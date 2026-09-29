import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, getVehicles, type Vehicle } from '@/api';
import { useUserLocation, type LocationStatus, type UserCoords } from '@/location';

export type UseVehiclesResult = {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  /**
   * The exact coordinates this fetch cycle was made with, or `null` for a
   * coordinate-less fallback fetch. Frozen for the cycle so the rendered list
   * never recomputes distances against a "later" location state (no list jump).
   */
  coordsUsed: UserCoords | null;
};

/** States in which the list may fetch. `unknown`/`resolving` must keep waiting. */
const FETCHABLE_STATUSES: readonly LocationStatus[] = [
  'available',
  'denied',
  'unavailable',
  'timed-out',
];

function isFetchable(status: LocationStatus): boolean {
  return FETCHABLE_STATUSES.includes(status);
}

type FetchDecision = {
  withCoords: boolean;
  coords: UserCoords | null;
};

/**
 * Owns the `GET /vehicles` request for the Home rebuild and integrates the
 * approved Strategy A location flow:
 *
 * - While the location is `unknown`/`resolving` the hook does NOT call the API
 *   (the caller keeps showing the skeleton).
 * - On the FIRST fetchable state the decision is frozen for that cycle:
 *   `available` → request WITH coordinates, anything else → coordinate-less
 *   fallback. A later location change after a fallback must NOT auto-refetch.
 * - Explicit `refetch()` re-reads the CURRENT location state (fresh per
 *   session, never persisted): available → with coords, otherwise without.
 * - `requestIdRef` guards against overlapping manual refreshes.
 */
export function useVehicles(): UseVehiclesResult {
  const { status, coords } = useUserLocation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [coordsUsed, setCoordsUsed] = useState<UserCoords | null>(null);

  // Guards against a slow earlier request resolving after a newer one.
  const requestIdRef = useRef(0);
  // Freezes the decision for the current cycle: once the list has started its
  // first (or an explicitly refreshed) fetch, a location state change must not
  // fire a second request for the same cycle.
  const decisionLockedRef = useRef(false);

  const load = useCallback(async (decision: FetchDecision) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const params =
        decision.withCoords && decision.coords !== null
          ? { latitude: decision.coords.latitude, longitude: decision.coords.longitude }
          : {};
      const response = await getVehicles(params);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setVehicles(response.data?.list ?? []);
      setCoordsUsed(decision.withCoords ? decision.coords : null);
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
  }, []);

  // Strategy A: wait for the location to settle before the FIRST request.
  useEffect(() => {
    if (!isFetchable(status)) {
      return; // `unknown`/`resolving`: do NOT call GET /vehicles yet.
    }
    if (decisionLockedRef.current) {
      return; // A decision already locked this cycle: no automatic second request.
    }
    decisionLockedRef.current = true;
    const decision: FetchDecision =
      status === 'available'
        ? { withCoords: true, coords }
        : { withCoords: false, coords: null };
    void load(decision);
  }, [status, coords, load]);

  const refetch = useCallback(() => {
    // Explicit refresh: use the CURRENT location state, never a stale value.
    decisionLockedRef.current = true;
    const decision: FetchDecision =
      status === 'available'
        ? { withCoords: true, coords }
        : { withCoords: false, coords: null };
    void load(decision);
  }, [status, coords, load]);

  return { vehicles, isLoading, error, refetch, coordsUsed };
}