import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, getMyCars, type MyCar } from '@/api';
import { useAuth } from '@/auth';

export type UseMyCarsResult = {
  cars: MyCar[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: ApiError | null;
  isEmpty: boolean;
  refresh: () => void;
  retry: () => void;
};

type CarsState = {
  sessionKey: string;
  cars: MyCar[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: ApiError | null;
  hasLoaded: boolean;
};

export function useMyCars(): UseMyCarsResult {
  const { status, user, accessToken } = useAuth();
  const sessionKey = status === 'authenticated' && user !== null && accessToken !== null
    ? `${user.id}:${accessToken}`
    : null;
  const [state, setState] = useState<CarsState | null>(null);
  const requestRef = useRef<((mode: 'refresh' | 'retry') => void) | null>(null);

  useEffect(() => {
    if (sessionKey === null) {
      return;
    }

    let active = true;
    let pending = false;

    const load = async () => {
      if (!active || pending) {
        return;
      }
      pending = true;

      try {
        const response = await getMyCars();
        if (!active) {
          return;
        }
        if (response?.success !== true || !Array.isArray(response.data)) {
          throw new ApiError('http', 'Cars could not be loaded.');
        }
        setState({
          sessionKey,
          cars: response.data,
          isLoading: false,
          isRefreshing: false,
          error: null,
          hasLoaded: true,
        });
      } catch (cause) {
        if (!active) {
          return;
        }
        setState(current => ({
          sessionKey,
          cars: current?.sessionKey === sessionKey ? current.cars : [],
          isLoading: false,
          isRefreshing: false,
          error: cause instanceof ApiError ? cause : ApiError.network(cause),
          hasLoaded: current?.sessionKey === sessionKey && current.hasLoaded,
        }));
      } finally {
        pending = false;
      }
    };

    requestRef.current = mode => {
      if (!active || pending) {
        return;
      }
      setState(current => {
        const previous = current?.sessionKey === sessionKey ? current : null;
        const hasLoaded = previous?.hasLoaded ?? false;
        return {
          sessionKey,
          cars: previous?.cars ?? [],
          isLoading: mode === 'retry' && !hasLoaded,
          isRefreshing: mode === 'refresh' || hasLoaded,
          error: null,
          hasLoaded,
        };
      });
      void load();
    };

    void load();
    return () => {
      active = false;
      requestRef.current = null;
    };
  }, [sessionKey]);

  const refresh = useCallback(() => requestRef.current?.('refresh'), []);
  const retry = useCallback(() => requestRef.current?.('retry'), []);

  // Hide the previous account's state immediately, before effect cleanup runs.
  const current = sessionKey !== null && state?.sessionKey === sessionKey ? state : null;
  const isLoading = sessionKey !== null && (current?.isLoading ?? true);
  const isRefreshing = current?.isRefreshing ?? false;
  const error = current?.error ?? null;
  const cars = current?.cars ?? [];

  return {
    cars,
    isLoading,
    isRefreshing,
    error,
    isEmpty: current?.hasLoaded === true && !isLoading && !isRefreshing && error === null && cars.length === 0,
    refresh,
    retry,
  };
}
