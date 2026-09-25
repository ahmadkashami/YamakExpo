export type ApiErrorKind = 'network' | 'http';

export interface ApiHttpErrorInput {
  status: number;
  body?: unknown;
  message?: string;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly body?: unknown;
  readonly cause?: unknown;

  constructor(kind: ApiErrorKind, message: string, input: Omit<ApiHttpErrorInput, 'status'> & { status?: number; cause?: unknown } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = input.status;
    this.body = input.body;
    this.cause = input.cause;
  }

  static http({ status, body, message }: ApiHttpErrorInput): ApiError {
    return new ApiError('http', message ?? `Request failed with status ${status}`, { status, body });
  }

  static network(cause: unknown): ApiError {
    const isAbort = cause instanceof Error && cause.name === 'AbortError';
    return new ApiError(
      'network',
      isAbort ? 'Request was cancelled' : 'Network request failed',
      { cause },
    );
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function extractBackendMessage(body: unknown): string | undefined {
  if (isPlainObject(body)) {
    const message = body.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
    return undefined;
  }

  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.length === 0 || trimmed.startsWith('<')) {
      return undefined;
    }
    return trimmed;
  }

  return undefined;
}
