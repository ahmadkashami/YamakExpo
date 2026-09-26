import * as SecureStore from 'expo-secure-store';

import type { RegisteredUser } from '@/api/auth';

export const ACCESS_TOKEN_KEY = 'yamak_access_token';
export const AUTH_USER_KEY = 'yamak_auth_user';

export interface StoredSession {
  accessToken: string;
  user: RegisteredUser;
}

function isSessionUser(value: unknown): value is RegisteredUser {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<RegisteredUser>;

  return typeof candidate.email === 'string' && candidate.email.length > 0;
}

function parseStoredUser(raw: string | null): RegisteredUser | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isSessionUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(AUTH_USER_KEY);
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);

  try {
    await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(session.user));
  } catch (error) {
    await clearSession();
    throw error;
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  let accessToken: string | null;
  let rawUser: string | null;

  try {
    [accessToken, rawUser] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(AUTH_USER_KEY),
    ]);
  } catch {
    return null;
  }

  if (accessToken === null || accessToken.length === 0) {
    return null;
  }

  const user = parseStoredUser(rawUser);

  if (user === null) {
    await clearSession();
    return null;
  }

  return { accessToken, user };
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}
