import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ApiError,
  getMyRequestDetails,
  getMyRequests,
  normalizeMyRequestsQuery,
  type MyRequestDetail,
  type MyRequestListItem,
  type MyRequestsMetaData,
  type MyRequestsQuery,
} from '@/api';

/**
 * B3.3 My Requests hooks.
 *
 * Hooks own their state locally (no global store). All async work is contained
 * inside a guarded loader that catches every failure, so callers never need to
 * handle a promise rejection. A monotonically increasing request id discards
 * stale responses, and an in-flight identity guard prevents duplicate
 * overlapping fetches for the same page/detail id.
 */

export type UseMyRequestsOptions = MyRequestsQuery;

export type UseMyRequestsResult = {
  items: MyRequestListItem[];
  metaData: MyRequestsMetaData | null;
  page: number;
  perPage: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: ApiError | null;
  hasMore: boolean;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  refresh: () => void;
  retry: () => void;
};

type ListLoadParams = { page: number; perPage: number };

function unexpected(cause: unknown): ApiError {
  return cause instanceof ApiError ? cause : ApiError.network(cause);
}

/** Paginated owner-scoped list data for the My Requests list screen. */
export function useMyRequests(options: UseMyRequestsOptions = {}): UseMyRequestsResult {
  const initial = normalizeMyRequestsQuery(options);

  const [page, setPageState] = useState(initial.page);
  const [perPage, setPerPageState] = useState(initial.perPage);
  const [items, setItems] = useState<MyRequestListItem[]>([]);
  const [metaData, setMetaData] = useState<MyRequestsMetaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const requestIdRef = useRef(0);
  const inFlightRef = useRef<ListLoadParams | null>(null);

  const load = useCallback(async (params: ListLoadParams, mode: 'initial' | 'refresh') => {
    const active = inFlightRef.current;
    if (
      active !== null &&
      active.page === params.page &&
      active.perPage === params.perPage
    ) {
      // Also covers React StrictMode's double effect setup on mount.
      return;
    }

    const requestId = ++requestIdRef.current;
    inFlightRef.current = params;
    setError(null);
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await getMyRequests(params);
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (!response.success || response.data === null) {
        throw new ApiError('http', 'Requests could not be loaded.', { body: response });
      }
      setItems(response.data.list);
      setMetaData(response.data.metaData);
    } catch (cause) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems([]);
      setMetaData(null);
      setError(unexpected(cause));
    } finally {
      if (requestId === requestIdRef.current) {
        inFlightRef.current = null;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load({ page, perPage }, 'initial');
  }, [page, perPage, load]);

  const setPage = useCallback((next: number) => {
    const value = normalizeMyRequestsQuery({ page: next }).page;
    setPageState((current) => (current === value ? current : value));
  }, []);

  const setPerPage = useCallback((next: number) => {
    const value = normalizeMyRequestsQuery({ perPage: next }).perPage;
    setPerPageState((current) => (current === value ? current : value));
  }, []);

  const refresh = useCallback(() => {
    void load({ page, perPage }, 'refresh');
  }, [load, page, perPage]);

  return {
    items,
    metaData,
    page,
    perPage,
    isLoading,
    isRefreshing,
    error,
    hasMore: metaData !== null && page < metaData.lastPage,
    setPage,
    setPerPage,
    refresh,
    retry: refresh,
  };
}

export type UseMyRequestDetailsResult = {
  detail: MyRequestDetail | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  retry: () => void;
};

type DetailState = { id: number; data: MyRequestDetail };
type DetailErrorState = { id: number; error: ApiError };

/** Owner-only detail data for the My Request details screen. */
export function useMyRequestDetails(requestId: number | null | undefined): UseMyRequestDetailsResult {
  const validId =
    typeof requestId === 'number' && Number.isInteger(requestId) && requestId > 0
      ? requestId
      : null;

  // Detail and error state carry the id they belong to. A value from a previous
  // route id can never be returned for the current id, even if a late response
  // or a reused screen instance survives an A -> B navigation.
  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [errorState, setErrorState] = useState<DetailErrorState | null>(null);
  const [isFetching, setIsFetching] = useState(validId !== null);

  const requestIdRef = useRef(0);
  const inFlightRef = useRef<number | null>(null);

  const load = useCallback(async (id: number | null) => {
    if (id === null) {
      setDetailState(null);
      setErrorState(null);
      setIsFetching(false);
      return;
    }
    if (inFlightRef.current === id) {
      return; // Same detail already loading: no duplicate overlapping request.
    }

    const requestToken = ++requestIdRef.current;
    inFlightRef.current = id;
    setErrorState(null);
    setIsFetching(true);

    try {
      const response = await getMyRequestDetails(id);
      if (requestToken !== requestIdRef.current) {
        return;
      }
      if (!response.success || response.data === null) {
        throw new ApiError('http', 'Request could not be loaded.', { body: response });
      }
      setDetailState({ id, data: response.data });
    } catch (cause) {
      if (requestToken !== requestIdRef.current) {
        return;
      }
      setDetailState(null);
      setErrorState({ id, error: unexpected(cause) });
    } finally {
      if (requestToken === requestIdRef.current) {
        inFlightRef.current = null;
        setIsFetching(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(validId);
  }, [validId, load]);

  const refetch = useCallback(() => {
    void load(validId);
  }, [load, validId]);

  const detail = detailState?.id === validId ? detailState.data : null;
  const error = errorState?.id === validId ? errorState.error : null;
  // A newly selected id has no state of its own yet, so it must show loading
  // before the effect starts its fetch. For a same-id refresh, `isFetching`
  // keeps the current detail visible while the RefreshControl spins.
  const isLoading = validId !== null && (isFetching || (detail === null && error === null));

  return { detail, isLoading, error, refetch, retry: refetch };
}

/** Alias kept for callers that used the earlier singular hook name. */
export const useMyRequestDetail = useMyRequestDetails;
