import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, getVehicleById, type Vehicle } from '@/api';

export type UseVehicleDetailsResult = {
  vehicle: Vehicle | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
};

/**
 * Smallest Vehicle-Details data hook: fetch ONE vehicle by a pre-validated
 * positive integer id, with loading / error / refetch plus stale-response
 * protection (a slow earlier response can never overwrite a newer one).
 *
 * Intentionally NO location logic — the details screen needs the vehicle, not
 * the user's position. A `null` id (invalid route param) performs no request.
 */
export function useVehicleDetails(id: number | null): UseVehicleDetailsResult {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async (targetId: number) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getVehicleById(targetId);
      if (requestId !== requestRef.current) {
        return; // a newer request superseded this one
      }
      setVehicle(response.data);
    } catch (cause) {
      if (requestId !== requestRef.current) {
        return;
      }
      setVehicle(null);
      setError(cause instanceof ApiError ? cause : ApiError.network(cause));
    } finally {
      if (requestId === requestRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (id === null) {
      return;
    }
    void load(id);
  }, [id, load]);

  const refetch = useCallback(() => {
    if (id === null) {
      return;
    }
    void load(id);
  }, [id, load]);

  return { vehicle, isLoading, error, refetch };
}