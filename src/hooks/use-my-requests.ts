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

/** Owner-only detail data for the My Request details screen. */
export function useMyRequestDetails(requestId: number | null | undefined): UseMyRequestDetailsResult {
  const validId =
    typeof requestId === 'number' && Number.isInteger(requestId) && requestId > 0
      ? requestId
      : null;

  const [detail, setDetail] = useState<MyRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(validId !== null);
  const [error, setError] = useState<ApiError | null>(null);

  const requestIdRef = useRef(0);
  const inFlightRef = useRef<number | null>(null);

  const load = useCallback(async (id: number | null) => {
    if (id === null) {
      setDetail(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    if (inFlightRef.current === id) {
      return; // Same detail already loading: no duplicate overlapping request.
    }

    const requestToken = ++requestIdRef.current;
    inFlightRef.current = id;
    setError(null);
    setIsLoading(true);

    try {
      const response = await getMyRequestDetails(id);
      if (requestToken !== requestIdRef.current) {
        return;
      }
      if (!response.success || response.data === null) {
        throw new ApiError('http', 'Request could not be loaded.', { body: response });
      }
      setDetail(response.data);
    } catch (cause) {
      if (requestToken !== requestIdRef.current) {
        return;
      }
      setDetail(null);
      setError(unexpected(cause));
    } finally {
      if (requestToken === requestIdRef.current) {
        inFlightRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(validId);
  }, [validId, load]);

  const refetch = useCallback(() => {
    void load(validId);
  }, [load, validId]);

  return { detail, isLoading, error, refetch, retry: refetch };
}

/** Alias kept for callers that used the earlier singular hook name. */
export const useMyRequestDetail = useMyRequestDetails;
