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

/** Longest backend message we will surface verbatim (longer ⇒ framework debug output). */
const BACKEND_MESSAGE_MAX_LENGTH = 160;

/**
 * Only short, single-line, framework-safe phrases are treated as real backend
 * messages. Laravel's debug responses (API JSON with `APP_DEBUG=true`) put the
 * raw exception/SQLSTATE text in the body's `message` field; surfacing it would
 * leak DB internals into the UI. Verified-safe examples that still pass:
 * "Not Found", "Unauthenticated", "These credentials do not match our records."
 */
function isSurfacingBackendMessage(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length === 0 || trimmed.length > BACKEND_MESSAGE_MAX_LENGTH) {
    return false;
  }
  if (/[\r\n]/.test(trimmed)) {
    return false; // multi-line stack/dumps
  }
  if (/(SQLSTATE|No connection could be made|Connection refused|No query results for model|Exception|Stack ?trace| at [A-Za-z]:\\| at \/|#[0-9]+ [^ ]+\.php)/i.test(trimmed)) {
    return false; // framework debug artifacts (SQLSTATE, model-binding, exceptions, frames)
  }
  return true;
}

export function extractBackendMessage(body: unknown): string | undefined {
  if (isPlainObject(body)) {
    const message = body.message;
    if (typeof message === 'string' && isSurfacingBackendMessage(message)) {
      return message.trim();
    }
    return undefined;
  }

  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.length === 0 || trimmed.startsWith('<') || !isSurfacingBackendMessage(trimmed)) {
      return undefined;
    }
    return trimmed;
  }

  return undefined;
}
