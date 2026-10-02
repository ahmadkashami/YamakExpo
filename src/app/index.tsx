import { Redirect } from 'expo-router';

import {
  AUTHENTICATED_ENTRY_ROUTE,
  UNAUTHENTICATED_ENTRY_ROUTE,
  useAuth,
} from '@/auth';
import { AuthGateLoading } from '@/components/auth/AuthGateLoading';

/**
 * Root startup gate — Phase A / Step A1 (session / auth gate only).
 *
 * This route owns exactly one decision: where an app launch with an
 * already-resolved session starts. It is NOT the post-OTP transition — Step A2
 * owns `/email-otp` and its success navigation — and it does not create or
 * choose any destination screen.
 *
 * `AuthProvider` (in the root layout) is the single session owner and is the
 * only thing that reads SecureStore; this gate just consumes `useAuth()`.
 * `status === 'loading'` renders a neutral surface instead of redirecting, so
 * a launch can never flash the wrong side of the gate.
 */
export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <AuthGateLoading />;
  }

  if (status === 'authenticated') {
    return <Redirect href={AUTHENTICATED_ENTRY_ROUTE} />;
  }

  return <Redirect href={UNAUTHENTICATED_ENTRY_ROUTE} />;
}