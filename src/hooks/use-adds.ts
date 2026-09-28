import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, getAdds, type Add } from '@/api';

export type UseAddsResult = {
  adds: Add[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
};

/**
 * Owns the `GET /adds` request for the Home rebuild.
 *
 * Local state only, no global store: the legacy app pushed adds into Zustand
 * only so sibling sections could read them, and none of those consumers exist
 * yet. Mirrors `useServices` so Home can drive pull-to-refresh for both
 * sections through the same `refetch` contract.
 */
export function useAdds(): UseAddsResult {
  const [adds, setAdds] = useState<Add[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Guards against a slow earlier request resolving after a newer one.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdds();
      if (requestId !== requestIdRef.current) {
        return;
      }
      setAdds(response.data?.list ?? []);
    } catch (cause) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setAdds([]);
      setError(cause instanceof ApiError ? cause : ApiError.network(cause));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(() => {
    void load();
  }, [load]);

  return { adds, isLoading, error, refetch };
}
