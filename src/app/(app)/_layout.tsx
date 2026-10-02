import { Redirect, Slot } from 'expo-router';

import { UNAUTHENTICATED_ENTRY_ROUTE, useAuth } from '@/auth';
import { AuthGateLoading } from '@/components/auth/AuthGateLoading';
import { UserLocationProvider } from '@/location';

/**
 * Authenticated-area shell + session gate — Phase A / Step A1.
 *
 * This layout owns the protected direction of the gate and keeps its existing
 * `UserLocationProvider` mount. That provider is the SINGLE shared location
 * owner (approved decision): the Map consumes `useUserLocation()`, it never
 * starts a second location flow, and mounting the provider here means opening
 * `/register` can never prompt for location.
 *
 * A1 adds ONLY the gate:
 * - `unauthenticated` → replaced into the unauthenticated entry, so a deep link
 *   or a history entry can never reach a `(app)` route. `<Redirect>` performs a
 *   `router.replace`, so the blocked protected route is not left behind on the
 *   back stack for a back gesture to re-enter.
 * - `loading` → neutral surface. Unreachable while the root layout holds the
 *   splash, kept so this layout can never mount providers or children against
 *   an unresolved session.
 * - `authenticated` → the pre-existing shell, unchanged.
 *
 * Deliberately still no tabs and no drawer: A5 owns the navigator.
 */
export default function AppGroupLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <AuthGateLoading />;
  }

  if (status !== 'authenticated') {
    return <Redirect href={UNAUTHENTICATED_ENTRY_ROUTE} />;
  }

  return (
    <UserLocationProvider>
      <Slot />
    </UserLocationProvider>
  );
}