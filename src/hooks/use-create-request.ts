import { useCallback, useRef, useState } from 'react';

import {
  ApiError,
  createServiceRequest,
  createTrackedServiceRequest,
  extractBackendMessage,
  type CreateServiceRequestInput,
  type CreateTrackedServiceRequestInput,
  type TrackedServiceRequestData,
} from '@/api';

type CreateRequestAttempt = {
  key: string;
  payloadKey: string;
};

type TrackedAttempt = {
  key: string;
  identity: string;
};

type CompletedTrackedRequest = {
  identity: string;
  request: TrackedServiceRequestData;
};

function stablePayloadKey(input: CreateServiceRequestInput): string {
  const services = [...input.services].sort((a, b) => a - b);
  return `v:${input.vehicleId}|d:${input.driverId}|s:${services.join(',')}`;
}

/**
 * Logical identity for a tracked attempt.
 *
 * Coordinates are deliberately excluded: refreshing GPS for the same logical
 * request must reuse the existing Idempotency-Key. Channel and the sorted
 * service ids are included, so changing either starts a new logical attempt.
 */
function stableTrackedIdentity(input: CreateTrackedServiceRequestInput): string {
  const services = [...input.services].sort((a, b) => a - b);
  return `v:${input.vehicleId}|d:${input.driverId}|s:${services.join(',')}|c:${input.channel}`;
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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Minimal runtime guard for the C4 payload. This is intentionally not a full
 * schema validator: it only rejects missing/mistyped identity fields and
 * collection shapes so a malformed 2xx envelope is never reported as success.
 * `driver` is checked only as an object/null because `phoneNum` is nullable
 * and is not needed to create or replay a request.
 */
function isTrackedRequestData(value: unknown): value is TrackedServiceRequestData {
  if (!isObjectRecord(value)) {
    return false;
  }
  if (typeof value.id !== 'number' || typeof value._id !== 'string') {
    return false;
  }
  if (value.channel !== 'app' && value.channel !== 'whatsapp' && value.channel !== 'phone') {
    return false;
  }
  if (typeof value.status !== 'string') {
    return false;
  }
  if (value.vehicleId !== null && typeof value.vehicleId !== 'number') {
    return false;
  }
  if (value.driverId !== null && typeof value.driverId !== 'string') {
    return false;
  }
  if (value.driver !== null && !isObjectRecord(value.driver)) {
    return false;
  }
  if (!Array.isArray(value.services)) {
    return false;
  }
  if (value.createdAt !== null && typeof value.createdAt !== 'string') {
    return false;
  }
  return true;
}

/** Turn a raw tracked response into a success result or a distinct failure. */
function parseTrackedResponse(envelope: unknown): SubmitTrackedResult {
  if (
    isObjectRecord(envelope) &&
    envelope.success === true &&
    isTrackedRequestData(envelope.data)
  ) {
    return { ok: true, request: envelope.data, wasCached: false };
  }

  const message = extractBackendMessage(envelope);
  return {
    ok: false,
    error: new ApiError('http', message ?? 'Request could not be created.', {
      body: envelope,
    }),
  };
}

export type SubmitTrackedResult =
  | { ok: true; request: TrackedServiceRequestData; wasCached: boolean }
  | { ok: false; error: ApiError };

export type UseCreateRequestResult = {
  submit: (input: CreateServiceRequestInput) => Promise<boolean>;
  submitTracked: (input: CreateTrackedServiceRequestInput) => Promise<SubmitTrackedResult>;
  startNewTrackedRequest: () => void;
  isSubmitting: boolean;
  error: ApiError | null;
  reset: () => void;
};

export function useCreateRequest(): UseCreateRequestResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const attemptRef = useRef<CreateRequestAttempt | null>(null);
  const trackedAttemptRef = useRef<TrackedAttempt | null>(null);
  const completedTrackedRef = useRef<CompletedTrackedRequest | null>(null);
  const trackedGenerationRef = useRef(0);
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

  /**
   * Explicitly discard the current tracked attempt and its cached success so
   * the next `submitTracked` call starts a brand-new logical request. This is
   * the only supported way to begin a new request for an identical payload;
   * a GPS refresh alone must not rotate the key.
   */
  const startNewTrackedRequest = useCallback(() => {
    trackedGenerationRef.current += 1;
    trackedAttemptRef.current = null;
    completedTrackedRef.current = null;
  }, []);

  const submitTracked = useCallback(
    async (input: CreateTrackedServiceRequestInput): Promise<SubmitTrackedResult> => {
      const identity = stableTrackedIdentity(input);

      // A repeated call for the same completed attempt returns its result
      // without issuing another POST.
      const completed = completedTrackedRef.current;
      if (completed !== null && completed.identity === identity) {
        return { ok: true, request: completed.request, wasCached: true };
      }

      // Same admission guard as the legacy path: never allow a concurrent
      // tracked POST, and never queue an automatic retry.
      if (inFlightRef.current) {
        return {
          ok: false,
          error: new ApiError('network', 'A request is already in progress.'),
        };
      }

      let attempt = trackedAttemptRef.current;
      if (attempt !== null && attempt.identity !== identity) {
        // New channel/services/vehicle/driver means a new logical attempt,
        // which gets its own Idempotency-Key.
        trackedAttemptRef.current = null;
        attempt = null;
      }
      if (attempt === null) {
        attempt = { key: generateUuidV4(), identity };
        trackedAttemptRef.current = attempt;
      }

      const generation = trackedGenerationRef.current;
      inFlightRef.current = true;
      try {
        // The generated key is retained for network failures, HTTP 422 and
        // malformed/unsuccessful envelopes. Only a 409 drops the attempt.
        const envelope: unknown = await createTrackedServiceRequest(input, attempt.key);
        const outcome = parseTrackedResponse(envelope);
        if (!outcome.ok) {
          return outcome;
        }
        if (trackedGenerationRef.current === generation) {
          completedTrackedRef.current = { identity, request: outcome.request };
          trackedAttemptRef.current = null;
        }
        return outcome;
      } catch (cause) {
        const apiError = cause instanceof ApiError ? cause : ApiError.network(cause);
        if (apiError.status === 409 && trackedGenerationRef.current === generation) {
          // Conflicted attempt: surface the error distinctly and clear it.
          // There is no automatic resubmission.
          trackedAttemptRef.current = null;
        }
        return { ok: false, error: apiError };
      } finally {
        inFlightRef.current = false;
      }
    },
    [],
  );

  return { submit, submitTracked, startNewTrackedRequest, isSubmitting, error, reset };
}
