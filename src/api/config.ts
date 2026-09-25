const DEFAULT_API_BASE_URL = 'https://yamak-kw.com/api/mobile/v1/';

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return DEFAULT_API_BASE_URL;
  }
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export function resolveApiBaseUrl(envValue: string | undefined): string {
  return normalizeBaseUrl(envValue ?? DEFAULT_API_BASE_URL);
}

export const API_BASE_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

export function buildApiUrl(path: string, baseUrl: string = API_BASE_URL): string {
  const trimmedPath = path.trim();

  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  const root = normalizeBaseUrl(baseUrl);
  const relativePath = trimmedPath.replace(/^\/+/, '');
  return relativePath.length === 0 ? root : `${root}${relativePath}`;
}
