import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { RegisteredUser } from '@/api/auth';

import { clearSession, loadSession, saveSession } from './auth-storage';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: RegisteredUser | null;
  accessToken: string | null;
  authenticate: (accessToken: string, user: RegisteredUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function restore() {
      const session = await loadSession();

      if (!active) {
        return;
      }

      if (session === null) {
        setStatus('unauthenticated');
        return;
      }

      setAccessToken(session.accessToken);
      setUser({ ...session.user });
      setStatus('authenticated');
    }

    void restore();

    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback(async (nextAccessToken: string, nextUser: RegisteredUser) => {
    if (typeof nextAccessToken !== 'string' || nextAccessToken.length === 0) {
      throw new Error('A session requires an access token');
    }

    if (typeof nextUser?.email !== 'string' || nextUser.email.length === 0) {
      throw new Error('A session requires a user');
    }

    const sessionUser = { ...nextUser };

    await saveSession({ accessToken: nextAccessToken, user: sessionUser });

    setAccessToken(nextAccessToken);
    setUser(sessionUser);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();

    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, accessToken, authenticate, signOut }),
    [status, user, accessToken, authenticate, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
