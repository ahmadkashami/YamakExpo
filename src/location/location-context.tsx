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

  const requestLocation = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setStatus('resolving');
    setCoords(null);
    setError(null);

    // 1. Foreground permission (no background access, no geofencing).
    let permission: Location.LocationPermissionResponse;
    try {
      permission = await Location.requestForegroundPermissionsAsync();
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