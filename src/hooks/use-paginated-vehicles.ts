import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ApiError,
  getVehicles,
  type Vehicle,
  type VehicleListParams,
  type VehicleSort,
  type VehiclesMetaData,
} from '@/api';
import { useUserLocation, type LocationStatus, type UserCoords } from '@/location';

/**
 * Default page size for the All-Vehicles list: matches the legacy `AppLimitList`
 * (10) and the backend default (`limit` omitted → 10). Kept here rather than in
 * a new global constants system because it only exists for this data layer.
 */
export const DEFAULT_VEHICLE_PAGE_SIZE = 10;

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

/**
 * Freezes the location decision for ONE pagination cycle: whether to send
 * coordinates, and which coordinates. Every page of a cycle reuses the SAME
 * decision, so the backend's nearest-first ordering can never shift mid-cycle
 * (page 1 without coords, page 2 with coords).
 */
type CycleDecision = {
  withCoords: boolean;
  coords: UserCoords | null;
};

function decisionFrom(status: LocationStatus, coords: UserCoords | null): CycleDecision {
  return status === 'available' ? { withCoords: true, coords } : { withCoords: false, coords: null };
}

export type UsePaginatedVehiclesOptions = {
  /** Rows per request. Defaults to `DEFAULT_VEHICLE_PAGE_SIZE`; invalid values fall back. */
  pageSize?: number;
};

export type UsePaginatedVehiclesResult = {
  /** Accumulated, deduped rows of the current cycle, in backend page order. */
  vehicles: Vehicle[];
  /** Pagination info for the last successful page, or `null` before the first. */
  metaData: VehiclesMetaData | null;
  /** True only while the FIRST page of a cycle loads (skeleton state). */
  isLoading: boolean;
  /** True while an explicit refresh (page 1 of a new cycle) loads. */
  isRefreshing: boolean;
  /** True while a later page loads. */
  isLoadingMore: boolean;
  /** Initial/blocking error (no usable list). `null` once a cycle succeeds. */
  error: ApiError | null;
  /** A later-page error; the existing list is preserved. `null` otherwise. */
  loadMoreError: ApiError | null;
  /** True when a successful page 1 returned zero rows. Never an error. */
  isEmpty: boolean;
  /** True while another page exists (`currentPage < lastPage`). */
  hasMore: boolean;
  /** Current sort direction. */
  sort: VehicleSort;
  /** Resets to page 1, replaces the list and refreshes the location decision. */
  refresh: () => void;
  /** Appends the next page. Ignored while loading, refreshing or at the end. */
  loadMore: () => void;
  /** Changes sort and restarts the cycle from page 1 (no-op if unchanged). */
  setSort: (sort: VehicleSort) => void;
  /** Alias of `refresh`, for parity with the other data hooks. */
  refetch: () => void;
};

/**
 * Merge `incoming` into `existing`, deduping by canonical `vehicle.id` and
 * preserving order (never by array index). Pure and defensive against a backend
 * that returns an overlapping row on a later page.
 */
export function mergeVehiclesById(existing: Vehicle[], incoming: Vehicle[]): Vehicle[] {
  if (incoming.length === 0) {
    return existing;
  }
  const seen = new Set(existing.map((vehicle) => vehicle.id));
  const merged = existing.slice();
  for (const vehicle of incoming) {
    if (seen.has(vehicle.id)) {
      continue;
    }
    seen.add(vehicle.id);
    merged.push(vehicle);
  }
  return merged;
}

/**
 * Paginated `GET /vehicles` data layer for the All-Vehicles screen (B1).
 *
 * Home keeps its own simple `useVehicles` hook; this hook is separate so the
 * verified Home behavior is untouched.
 *
 * Cycle model:
 * - A "cycle" is one fresh dataset from page 1 (initial load, refresh, or sort
 *   change). Every cycle captures ONE frozen location decision; later pages of
 *   the same cycle reuse it, so backend ordering stays stable.
 * - `unknown`/`resolving` location holds the first request (Strategy A, same as
 *   `useVehicles`); the first fetchable state decides `available` → coords,
 *   anything else → coordinate-less. A later location change never auto-refetches.
 * - `cycleIdRef` invalidates a stale cycle: an old page-1 or load-more response
 *   can never corrupt a newer cycle.
 */
export function usePaginatedVehicles(
  options: UsePaginatedVehiclesOptions = {},
): UsePaginatedVehiclesResult {
  const pageSize =
    typeof options.pageSize === 'number' &&
    Number.isInteger(options.pageSize) &&
    options.pageSize >= 1
      ? options.pageSize
      : DEFAULT_VEHICLE_PAGE_SIZE;

  const { status, coords } = useUserLocation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [metaData, setMetaData] = useState<VehiclesMetaData | null>(null);
  const [sort, setSortState] = useState<VehicleSort>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<ApiError | null>(null);

  // Guards against a stale cycle (or an old page) resolving after a newer one.
  const cycleIdRef = useRef(0);
  // Freezes the location decision per cycle: false until the first fetchable
  // state, then true so a later location change never auto-refetches.
  const cycleLockedRef = useRef(false);
  // The frozen decision of the CURRENT cycle (read by `loadMore`).
  const decisionRef = useRef<CycleDecision | null>(null);
  const pageRef = useRef(0);
  const lastPageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const sortRef = useRef<VehicleSort>('asc');
  const pageSizeRef = useRef(pageSize);

  useEffect(() => {
    pageSizeRef.current = pageSize;
  }, [pageSize]);

  const fetchPage = useCallback(
    async (cycleId: number, page: number, decision: CycleDecision) => {
      const params: VehicleListParams = {
        page,
        limit: pageSizeRef.current,
        sort: sortRef.current,
      };
      if (decision.withCoords && decision.coords !== null) {
        params.latitude = decision.coords.latitude;
        params.longitude = decision.coords.longitude;
      }
      const response = await getVehicles(params);
      if (cycleId !== cycleIdRef.current) {
        return null; // the cycle changed while this request was in flight
      }
      return response;
    },
    [],
  );

  const startCycle = useCallback(
    async (decision: CycleDecision, mode: 'initial' | 'refresh' | 'sort') => {
      const cycleId = cycleIdRef.current + 1;
      cycleIdRef.current = cycleId;
      decisionRef.current = decision;
      pageRef.current = 0;
      lastPageRef.current = 1;
      loadingMoreRef.current = false;

      setError(null);
      setLoadMoreError(null);
      setIsLoadingMore(false);
      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      // A refresh/sort reset does NOT blank the current rows; the replacement
      // happens only once the new page 1 succeeds (and on failure, below).

      try {
        const response = await fetchPage(cycleId, 1, decision);
        if (response === null) {
          return; // superseded by a newer cycle
        }
        const list = response.data?.list ?? [];
        const meta = response.data?.metaData ?? null;
        setVehicles(list);
        setMetaData(meta);
        pageRef.current = 1;
        lastPageRef.current = meta?.lastPage ?? 1;
      } catch (cause) {
        if (cycleId !== cycleIdRef.current) {
          return;
        }
        setVehicles([]);
        setMetaData(null);
        pageRef.current = 0;
        lastPageRef.current = 1;
        setError(cause instanceof ApiError ? cause : ApiError.network(cause));
      } finally {
        if (cycleId === cycleIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [fetchPage],
  );

  // Strategy A: hold the first request until the location settles.
  useEffect(() => {
    if (!isFetchable(status)) {
      return; // `unknown`/`resolving`: do NOT call GET /vehicles yet.
    }
    if (cycleLockedRef.current) {
      return; // A cycle already decided: no automatic second request.
    }
    cycleLockedRef.current = true;
    void startCycle(decisionFrom(status, coords), 'initial');
  }, [status, coords, startCycle]);

  const refresh = useCallback(() => {
    if (!isFetchable(status)) {
      return; // Nothing to refresh against yet; the initial flow will fetch.
    }
    cycleLockedRef.current = true;
    void startCycle(decisionFrom(status, coords), 'refresh');
  }, [status, coords, startCycle]);

  const setSort = useCallback(
    (next: VehicleSort) => {
      if (next === sortRef.current) {
        return;
      }
      sortRef.current = next;
      setSortState(next);
      // No cycle yet (or location not settled): the initial flow will fetch with
      // the new sort. Otherwise restart page 1 with a fresh location decision.
      if (!cycleLockedRef.current || !isFetchable(status)) {
        return;
      }
      void startCycle(decisionFrom(status, coords), 'sort');
    },
    [status, coords, startCycle],
  );

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) {
      return; // Ignore a duplicate concurrent call.
    }
    if (isLoading || isRefreshing) {
      return; // A cycle (or refresh) is already in flight.
    }
    if (error !== null) {
      return; // Never extend a failed cycle.
    }
    const decision = decisionRef.current;
    if (decision === null || pageRef.current < 1) {
      return; // First page has not succeeded yet.
    }
    if (pageRef.current >= lastPageRef.current) {
      return; // End of list.
    }

    const cycleId = cycleIdRef.current;
    const nextPage = pageRef.current + 1;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    void fetchPage(cycleId, nextPage, decision)
      .then((response) => {
        if (response === null) {
          return; // Superseded by a newer cycle.
        }
        const list = response.data?.list ?? [];
        const meta = response.data?.metaData ?? null;
        setVehicles((prev) => mergeVehiclesById(prev, list));
        setMetaData(meta);
        pageRef.current = nextPage;
        lastPageRef.current = meta?.lastPage ?? lastPageRef.current;
      })
      .catch((cause) => {
        if (cycleId !== cycleIdRef.current) {
          return; // The failure belongs to a cycle that is already gone.
        }
        // Keep the existing rows; surface the later-page failure separately.
        setLoadMoreError(cause instanceof ApiError ? cause : ApiError.network(cause));
      })
      .finally(() => {
        if (cycleId === cycleIdRef.current) {
          loadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
      });
  }, [error, fetchPage, isLoading, isRefreshing]);

  const currentPage = metaData?.currentPage ?? 0;
  const lastPage = metaData?.lastPage ?? 1;
  const hasMore =
    !isLoading && !isRefreshing && error === null && vehicles.length > 0 && currentPage < lastPage;
  const isEmpty = !isLoading && error === null && vehicles.length === 0;

  return {
    vehicles,
    metaData,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    loadMoreError,
    isEmpty,
    hasMore,
    sort,
    refresh,
    loadMore,
    setSort,
    refetch: refresh,
  };
}
