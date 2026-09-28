import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, getServices, type Service } from '@/api';

export type UseServicesResult = {
  services: Service[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
};

/**
 * Owns the `GET /services` request for the Home rebuild.
 *
 * Local state only, no global store: the legacy app pushed services into Zustand
 * only so sibling sections and the Map screen could read them, none of which
 * exist yet. Callers decide when to refetch, so the future Home screen can drive
 * a pull-to-refresh without this hook reaching for a global.
 */
export function useServices(): UseServicesResult {
  const [services, setServices] = useState<Service[]>([]);
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
      const response = await getServices();
      if (requestId !== requestIdRef.current) {
        return;
      }
      setServices(response.data?.list ?? []);
    } catch (cause) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setServices([]);
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

  return { services, isLoading, error, refetch };
}
