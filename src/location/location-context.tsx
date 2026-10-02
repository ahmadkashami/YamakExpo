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

export type UserLocationState = {
  status: LocationStatus;
  /** Non-null only while `status === 'available'`; no ambiguous "null means loading or denied". */
  coords: UserCoords | null;
  /** Whether the OS will allow another permission prompt (its own `canAskAgain`). */
  canAskAgain: boolean;
  /** Safe, localised-by-caller error message for the `unavailable` failure path. */
  error: string | null;
  /** Request foreground permission (if needed) and resolve the current position. */
  requestLocation: () => Promise<void>;
};

const UserLocationContext = createContext<UserLocationState | null>(null);

/**
 * App-level, memory-only location ownership for the authenticated portion of
 * the app (approved decision C: React Context, no Zustand, no persistence).
 *
 * - Nothing is persisted: coordinates are resolved fresh per authenticated app
 *   session and never written to AsyncStorage/SecureStore.
 * - No auto-request on mount: mounting the provider must NOT trigger a
 *   permission prompt. The future authenticated shell (or, for this slice's
 *   runtime preview, the preview surface) calls `requestLocation()` explicitly.
 * - Late-result rule: once `getCurrentPositionAsync` loses the grace-period
 *   race its eventual resolution is ignored entirely — the provider never
 *   flips from `timed-out`/`unavailable` back to `available` for that cycle,
 *   so a fallback request can never be paired with a late coordinate request.
 */
export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>('unknown');
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supersedes an in-flight resolution when `requestLocation` is invoked again
  // (e.g. an explicit refresh path), matching the per-slice requestIdRef guard.
  const requestIdRef = useRef(0);

  /**
   * True while a resolution is actually running — see `requestLocation`.
   *
   * NOT the same thing as `status === 'resolving'`: that is React state (one
   * render late, and cleared by the provider's own transitions), whereas this
   * is the synchronous admission flag for the public entry point.
   */
  const resolvingRef = useRef(false);

  /**
   * The single resolution pipeline: permission → bounded position read.
   * Every path into a location attempt goes through here.
   */
  const resolveLocation = useCallback(async () => {
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
      if (requestId !== requestIdRef.current) {
        return;
      }
      setCanAskAgain(false);
      setStatus('denied');
      setError(cause instanceof Error ? cause.message : 'Location permission could not be requested');
      return;
    }

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (permission.status !== Location.PermissionStatus.GRANTED) {
      setCanAskAgain(permission.canAskAgain);
      setStatus('denied');
      setCoords(null);
      return;
    }

    // 2. Current position, bounded by the grace period. If the timeout wins,
    //    the still-pending position result is dropped (never applied to state).
    try {
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new LocationGraceTimeout()), LOCATION_GRACE_PERIOD_MS);
        }),
      ]);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setStatus('available');
    } catch (cause) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (cause instanceof LocationGraceTimeout) {
        // Timeout is NOT permission denial.
        setStatus('timed-out');
      } else {
        // Non-permission position failure (location services off, etc.).
        setStatus('unavailable');
        setError(cause instanceof Error ? cause.message : 'Location could not be determined');
      }
      setCoords(null);
    }
  }, []);

  /**
   * Public entry point. Admits at most ONE resolution at a time.
   *
   * `requestIdRef` only decides which result WINS, so N overlapping calls would
   * still start N native `getCurrentPositionAsync` requests and N grace timers.
   * `resolvingRef` removes that at the source, instead of relying on every
   * caller staying perfectly guarded against a re-run of its mount effect.
   *
   * A retry issued AFTER the previous attempt settled is always admitted (the
   * flag clears in the `finally` that ends the request), and `requestIdRef` is
   * deliberately untouched by the early return, so the in-flight request keeps
   * its id and can still apply its result.
   */
  const requestLocation = useCallback(async () => {
    if (resolvingRef.current) {
      return;
    }
    resolvingRef.current = true;

    try {
      await resolveLocation();
    } finally {
      resolvingRef.current = false;
    }
  }, []);

  const value = useMemo<UserLocationState>(
    () => ({ status, coords, canAskAgain, error, requestLocation }),
    [status, coords, canAskAgain, error, requestLocation],
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