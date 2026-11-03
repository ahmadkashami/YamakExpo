import { useCallback, useRef, useState } from 'react';

import { ApiError, createServiceRequest, type CreateServiceRequestInput } from '@/api';

type CreateRequestAttempt = {
  key: string;
  payloadKey: string;
};

function stablePayloadKey(input: CreateServiceRequestInput): string {
  const services = [...input.services].sort((a, b) => a - b);
  return `v:${input.vehicleId}|d:${input.driverId}|s:${services.join(',')}`;
}

function generateUuidV4(): string {
  // Use crypto if available
  const g = globalThis as any;
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  if (g.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    g.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  // Fallback (best effort)
  let d = Date.now();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export type UseCreateRequestResult = {
  submit: (input: CreateServiceRequestInput) => Promise<boolean>;
  isSubmitting: boolean;
  error: ApiError | null;
  reset: () => void;
};

export function useCreateRequest(): UseCreateRequestResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const attemptRef = useRef<CreateRequestAttempt | null>(null);
  const inFlightRef = useRef(false);

  const reset = useCallback(() => {
    attemptRef.current = null;
    setError(null);
  }, []);

  const submit = useCallback(
    async (input: CreateServiceRequestInput): Promise<boolean> => {
      if (inFlightRef.current) {
        return false;
      }
      const payloadKey = stablePayloadKey(input);
      let attempt = attemptRef.current;
      if (attempt && attempt.payloadKey !== payloadKey) {
        attemptRef.current = null;
        attempt = null;
      }
      if (!attempt) {
        attempt = { key: generateUuidV4(), payloadKey };
        attemptRef.current = attempt;
      }

      inFlightRef.current = true;
      setIsSubmitting(true);
      setError(null);
      try {
        await createServiceRequest(input, attempt.key);
        attemptRef.current = null;
        return true;
      } catch (cause) {
        const apiError = cause instanceof ApiError ? cause : ApiError.network(cause);
        // If conflict due to same key different payload - clear attempt
        if (apiError.status === 409) {
          attemptRef.current = null;
        }
        setError(apiError);
        return false;
      } finally {
        inFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { submit, isSubmitting, error, reset };
}
