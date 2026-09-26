import { getAccessToken } from '@/auth/auth-storage';

import { ApiError, extractBackendMessage } from './api-error';
import { buildApiUrl } from './config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function buildRequestHeaders<TBody>(
  options: ApiRequestOptions<TBody>,
  accessToken: string | null,
): Record<string, string> {
  return {
    Accept: 'application/json',
    ...(options.body === undefined ? null : { 'Content-Type': 'application/json' }),
    ...(accessToken === null ? null : { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };
}

function parseJsonBody(text: string): unknown {
  if (text.trim().length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<TResponse, TBody = never>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const { method = 'GET', body, headers, signal } = options;
  const url = buildApiUrl(path);
  const accessToken = await getAccessToken();

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: buildRequestHeaders(options, accessToken),
      ...(body === undefined ? null : { body: JSON.stringify(body) }),
      ...(signal === undefined ? null : { signal }),
    });
  } catch (cause) {
    throw ApiError.network(cause);
  }

  const responseText = await response.text();
  const parsedBody = parseJsonBody(responseText);

  if (!response.ok) {
    throw ApiError.http({
      status: response.status,
      body: parsedBody,
      message: extractBackendMessage(parsedBody),
    });
  }

  return parsedBody as TResponse;
}

export function apiGet<TResponse>(path: string, options: ApiRequestOptions<never> = {}) {
  return apiRequest<TResponse, never>(path, { ...options, method: 'GET' });
}

export function apiPost<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  options: ApiRequestOptions<TBody> = {},
) {
  return apiRequest<TResponse, TBody>(path, { ...options, method: 'POST', body });
}

export function apiPut<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  options: ApiRequestOptions<TBody> = {},
) {
  return apiRequest<TResponse, TBody>(path, { ...options, method: 'PUT', body });
}

export function apiPatch<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  options: ApiRequestOptions<TBody> = {},
) {
  return apiRequest<TResponse, TBody>(path, { ...options, method: 'PATCH', body });
}

export function apiDelete<TResponse>(path: string, options: ApiRequestOptions<never> = {}) {
  return apiRequest<TResponse, never>(path, { ...options, method: 'DELETE' });
}
