import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, getVehiclesByService, type Vehicle } from '@/api';
import { useUserLocation, type LocationStatus, type UserCoords } from '@/location';

/** Same set as the Home vehicles hook — states in which a request is allowed. */
const FETCHABLE_STATUSES: readonly LocationStatus[] = [
  'available',
  'denied',
  'unavailable',
  'timed-out',
];

function isFetchable(status: LocationStatus): boolean {
  return FETCHABLE_STATUSES.includes(status);
}

export type UseMapVehiclesResult = {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  /** Frozen per-selection: the coordinates the current markers were fetched with. */
  coordsUsed: UserCoords | null;
};

/**
 * Owns the Map screen's `GET /services/{service}/vehicles` request.
 *
 * - `serviceId === null` → NO request (no selected service is a valid Map state,
 *   not an error; the screen keeps showing the map + chips).
 * - On a service change the previous service's markers are cleared immediately
 *   and the cycle is re-armed (no stale markers, no cross-service race).
 * - The request waits for the location to settle (`unknown`/`resolving` hold,
 *   bounded by the provider's grace period), then starts ONCE for that service:
 *   `available` → optional finite coords (nearest-first ordering), anything
 *   else → coordinate-less fetch. A later location change does NOT auto-refetch
 *   (`cycleStartedRef` freezes the decision, mirroring Strategy A in 3B).
 * - Explicit `refetch()` re-reads the CURRENT location state.
 * - `requestIdRef` guards against overlapping requests.
 */
export function useMapVehicles(serviceId: number | null): UseMapVehiclesResult {
  const { status, coords } = useUserLocation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [coordsUsed, setCoordsUsed] = useState<UserCoords | null>(null);

  const requestIdRef = useRef(0);
  const cycleRef = useRef<{ serviceId: number | null; started: boolean }>({
    serviceId: null,
    started: false,
  });

  const load = useCallback(
    async (targetServiceId: number, sendCoords: boolean, coordsValue: UserCoords | null) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setIsLoading(true);
      setError(null);

      try {
        const params =
          sendCoords && coordsValue !== null
            ? { latitude: coordsValue.latitude, longitude: coordsValue.longitude }
            : {};
        const response = await getVehiclesByService(targetServiceId, params);
        if (requestId !== requestIdRef.current) {
          return;
        }
        setVehicles(response.data ?? []);
        setCoordsUsed(sendCoords ? coordsValue : null);
      } catch (cause) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setVehicles([]);
        setCoordsUsed(null);
        setError(cause instanceof ApiError ? cause : ApiError.network(cause));
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (serviceId !== cycleRef.current.serviceId) {
      // New selection: invalidate any in-flight request and clear old markers.
      requestIdRef.current += 1;
      cycleRef.current = { serviceId, started: false };
      setVehicles([]);
      setCoordsUsed(null);
      setError(null);

      if (serviceId === null) {
        setIsLoading(false);
        return;
      }
      // Fall through: when the location is ALREADY settled, start this cycle's
      // request in the same pass (nothing would change to re-trigger the effect
      // otherwise — the tap-only case is `available`, and coords stay frozen).
      setIsLoading(true);
    }

    if (serviceId === null || cycleRef.current.started) {
      return; // No selection, or this cycle already started: never auto-refetch.
    }
    if (!isFetchable(status)) {
      return; // `unknown`/`resolving`: bounded wait (the provider WILL transition).
    }

    cycleRef.current.started = true;
    void load(serviceId, status === 'available', status === 'available' ? coords : null);
  }, [serviceId, status, coords, load]);

  const refetch = useCallback(() => {
    if (serviceId === null) {
      return;
    }
    // Explicit refresh: re-read the CURRENT location state (frozen per request).
    cycleRef.current.started = true;
    void load(serviceId, status === 'available', status === 'available' ? coords : null);
  }, [serviceId, status, coords, load]);

  return { vehicles, isLoading, error, refetch, coordsUsed };
}