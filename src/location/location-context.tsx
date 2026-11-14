import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type LocationStatus =
  | 'unknown'
  | 'resolving'
  | 'available'
  | 'denied'
  | 'unavailable'
  | 'timed-out';

export type UserCoords = {
  latitude: number;
  longitude: number;
};

/** Failure statuses a fresh-location request can resolve to. */
export type FreshLocationFailureStatus = 'denied' | 'unavailable' | 'timed-out';

/**
 * Direct result of a fresh-location attempt.
 *
 * Success carries the coordinates that the resolution itself produced; callers
 * never read `coords` from React state after awaiting. Failure is explicit so a
 * tracked-request caller can stop and explain the problem instead of falling
 * back to cached/vehicle/profile coordinates.
 */
export type FreshLocationResult =
  | { ok: true; coords: UserCoords }
  | {
      ok: false;
      status: FreshLocationFailureStatus;
      canAskAgain: boolean;
      error: string | null;
    };

/**
 * Bounded grace period for the initial position fix.
 *
 * Strategy A (approved): the Vehicles list waits for the location to settle
 * before its first request, but it must not hang forever on a hung GPS. Once
 * this window elapses the context reports `timed-out` and callers fall back to
 * a coordinate-less request. 10s is a generous but bounded window for a
 * foreground `Balanced` fix (enough for GPS/Wi-Fi on a normal connection) and
 * short enough that the fallback still feels prompt on a dead GPS.
 */
export const LOCATION_GRACE_PERIOD_MS = 10_000;

class LocationGraceTimeout extends Error {
  constructor() {
    super('Location resolution exceeded the grace period');
    this.name = 'LocationGraceTimeout';
  }
}

/** A usable position fix: finite, in range, and not the forbidden (0, 0) pair. */
function isValidUserCoords(coords: UserCoords): boolean {
  const { latitude, longitude } = coords;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  if (longitude < -180 || longitude > 180) {
    return false;
  }

  // Individual zero values are valid; only the (0, 0) pair is not.
  return latitude !== 0 || longitude !== 0;
}

export type UserLocationState = {
  status: LocationStatus;
  /** Non-null only while `status === 'available'`; no ambiguous "null means loading or denied". */
  coords: UserCoords | null;
  /** Whether the OS will allow another permission prompt (its own `canAskAgain`). */
  canAskAgain: boolean;
  /** Safe, localised-by-caller error message for the `unavailable` failure path. */
  error: string | null;
  /**
   * Request foreground permission (if needed) and resolve the current position.
   * Kept for the existing list/map callers; it deliberately returns no coords.
   */
  requestLocation: () => Promise<void>;
  /**
   * Obtain a position fix initiated for this call (or after any earlier
   * in-flight resolution) and return the result directly. Concurrent fresh
   * callers share the same fresh operation; an ordinary list/map resolution is
   * never reused. See `FreshLocationResult`.
   */
  requestFreshLocation: () => Promise<FreshLocationResult>;
};

const UserLocationContext = createContext<UserLocationState | null>(null);

type LocationRunKind = 'regular' | 'fresh';

type ActiveLocationRun = {
  kind: LocationRunKind;
  promise: Promise<FreshLocationResult>;
};

/**
 * App-level, memory-only location ownership for the authenticated portion of
 * the app (approved decision C: React Context, no Zustand, no persistence).
 *
 * - Nothing is persisted: coordinates are resolved fresh per authenticated app
 *   session and never written to AsyncStorage/SecureStore.
 * - No auto-request on mount: mounting the provider must NOT trigger a
 *   permission prompt. Each screen calls `requestLocation()` explicitly.
 * - One native resolution at a time: `activeRunRef` serializes ordinary and
 *   fresh runs so overlapping callers never start competing GPS reads.
 * - Fresh-location rule: `requestFreshLocation()` never treats an ordinary
 *   list/map resolution as fresh. If one is in flight it waits for it to settle,
 *   then starts a new fix. Concurrent fresh callers share the fresh operation.
 * - Late-result rule: once `getCurrentPositionAsync` loses the grace-period
 *   race its eventual resolution is ignored for state — the provider never
 *   flips from `timed-out`/`unavailable` back to `available` for that cycle,
 *   so a fallback request can never be paired with a late coordinate request.
 */
export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>('unknown');
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supersedes an in-flight resolution when a newer run is invoked, matching the
  // per-slice requestIdRef guard used by the data hooks.
  const requestIdRef = useRef(0);

  /**
   * The single in-flight native resolution.
   *
   * Both public entry points go through `beginRun`, so there is never more than
   * one simultaneous `getCurrentPositionAsync`.
   */
  const activeRunRef = useRef<ActiveLocationRun | null>(null);

  /**
   * True while a fresh operation is waiting for an ordinary resolution to
   * settle. This stops a new ordinary run from slipping in between the ordinary
   * run's completion and the queued fresh run's start.
   */
  const freshPendingRef = useRef(false);

  /**
   * The single resolution pipeline: permission → bounded position read.
   *
   * Always settles with a discriminated result; state updates are still guarded
   * by `requestIdRef` so a superseded run can never overwrite newer state.
   */
  const resolveLocation = useCallback(async (): Promise<FreshLocationResult> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setStatus('resolving');
    setCoords(null);
    setError(null);

    // 1. Foreground permission (no background access, no geofencing).
    //
    //    Re-check the CURRENT permission before asking again: a cold launch
    //    with the permission already granted must resolve straight through to
    //    the position step instead of re-entering the OS prompt path. This is
    //    also what keeps a granted-but-no-fix cycle truthful — `timed-out` /
    //    `unavailable` can only ever be reached AFTER the permission check
    //    succeeded, so those states can never be mistaken for a denial.
    let permission: Location.LocationPermissionResponse;
    try {
      permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Location permission could not be requested';
      if (requestId === requestIdRef.current) {
        setCanAskAgain(false);
        setStatus('denied');
        setError(message);
      }
      return { ok: false, status: 'denied', canAskAgain: false, error: message };
    }

    if (permission.status !== Location.PermissionStatus.GRANTED) {
      if (requestId === requestIdRef.current) {
        setCanAskAgain(permission.canAskAgain);
        setStatus('denied');
        setCoords(null);
      }
      return {
        ok: false,
        status: 'denied',
        canAskAgain: permission.canAskAgain,
        error: null,
      };
    }

    // 2. Current position, bounded by the grace period. If the timeout wins,
    //    the still-pending position result is dropped from state.
    try {
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new LocationGraceTimeout()), LOCATION_GRACE_PERIOD_MS);
        }),
      ]);

      const candidate: UserCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      if (!isValidUserCoords(candidate)) {
        const message = 'Location returned invalid coordinates';
        if (requestId === requestIdRef.current) {
          setCoords(null);
          setStatus('unavailable');
          setError(message);
        }
        return {
          ok: false,
          status: 'unavailable',
          canAskAgain: permission.canAskAgain,
          error: message,
        };
      }

      if (requestId === requestIdRef.current) {
        setCoords(candidate);
        setStatus('available');
      }
      return { ok: true, coords: candidate };
    } catch (cause) {
      if (cause instanceof LocationGraceTimeout) {
        // Timeout is NOT permission denial.
        if (requestId === requestIdRef.current) {
          setStatus('timed-out');
          setCoords(null);
        }
        return {
          ok: false,
          status: 'timed-out',
          canAskAgain: permission.canAskAgain,
          error: null,
        };
      }

      const message = cause instanceof Error ? cause.message : 'Location could not be determined';
      if (requestId === requestIdRef.current) {
        setStatus('unavailable');
        setError(message);
        setCoords(null);
      }
      return {
        ok: false,
        status: 'unavailable',
        canAskAgain: permission.canAskAgain,
        error: message,
      };
    }
  }, []);

  /**
   * Start the single resolution pipeline and publish it as the active run.
   *
   * `resolveLocation` is written to settle (never reject), but the `.catch`
   * keeps that guarantee local: an unexpected throw still produces a truthful
   * failure result instead of an unhandled rejection. The clear handlers are
   * attached to the same promise callers await, so the active-run flag is
   * cleared before any queued fresh continuation runs.
   */
  const beginRun = useCallback(
    (kind: LocationRunKind): Promise<FreshLocationResult> => {
      const promise = resolveLocation().catch(
        (cause): FreshLocationResult => ({
          ok: false,
          status: 'unavailable',
          canAskAgain: false,
          error: cause instanceof Error ? cause.message : 'Location could not be determined',
        }),
      );

      const run: ActiveLocationRun = { kind, promise };
      activeRunRef.current = run;

      const clear = () => {
        if (activeRunRef.current === run) {
          activeRunRef.current = null;
        }
      };
      void promise.then(clear, clear);

      return promise;
    },
    [resolveLocation],
  );

  /**
   * Ordinary entry point used by the map/list screens.
   *
   * Behaviour is intentionally unchanged for existing consumers: it still
   * returns no coordinates and still drops a call that arrives while another
   * resolution is running. It also refuses to preempt a queued fresh run, so a
   * list/map prime can never delay a tracked-request fix.
   */
  const requestLocation = useCallback(async () => {
    if (activeRunRef.current !== null || freshPendingRef.current) {
      return;
    }
    await beginRun('regular');
  }, [beginRun]);

  /**
   * Fresh-location entry point for tracked-request creation.
   *
   * Freshness contract:
   * - No active run: start a new fix for this call.
   * - Active FRESH run: share it. Concurrent fresh callers receive the same
   *   real result, never an early `undefined` or a premature success.
   * - Active ORDINARY run: that fix began before this call, so it cannot be
   *   returned as fresh. Queue a new fix after it settles. The pending flag
   *   stops an ordinary caller from starting another run in the gap.
   *
   * The returned coordinates come from the resolution that produced them; the
   * caller never reads `coords` from React state after awaiting.
   */
  const requestFreshLocation = useCallback((): Promise<FreshLocationResult> => {
    const runFresh = (): Promise<FreshLocationResult> => {
      const active = activeRunRef.current;

      if (active !== null) {
        if (active.kind === 'fresh') {
          freshPendingRef.current = false;
          return active.promise;
        }

        freshPendingRef.current = true;
        // `then(runFresh, runFresh)`: a regular run always settles with a
        // result, but a rejection must still trigger the queued fresh fix.
        return active.promise.then(runFresh, runFresh);
      }

      freshPendingRef.current = false;
      return beginRun('fresh');
    };

    return runFresh();
  }, [beginRun]);

  const value = useMemo<UserLocationState>(
    () => ({
      status,
      coords,
      canAskAgain,
      error,
      requestLocation,
      requestFreshLocation,
    }),
    [status, coords, canAskAgain, error, requestLocation, requestFreshLocation],
  );

  return <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>;
}

export function useUserLocation(): UserLocationState {
  const context = useContext(UserLocationContext);
  if (context === null) {
    throw new Error('useUserLocation must be used within a UserLocationProvider');
  }
  return context;
}
