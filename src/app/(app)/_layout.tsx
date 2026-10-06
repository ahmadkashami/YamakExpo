import { Redirect, Slot, usePathname } from 'expo-router';

import { UNAUTHENTICATED_ENTRY_ROUTE, useAuth } from '@/auth';
import { AuthGateLoading } from '@/components/auth/AuthGateLoading';
import { UserLocationProvider } from '@/location';
import { OnboardingProvider, useOnboarding } from '@/onboarding';

const ONBOARDING_ROUTE = '/onboarding';
const HOME_ROUTE = '/home';

function AppProtectedLayout() {
  const { status: authStatus } = useAuth();
  const { status: onboardingStatus } = useOnboarding();
  const pathname = usePathname();

  // Auth first, then the remote onboarding decision (spec §11). Onboarding is
  // resolved by OnboardingProvider while the auth session is already known, so
  // no Tabs/Home frame ever flashes before the decision completes.
  if (authStatus === 'loading' || onboardingStatus === 'loading') {
    return <AuthGateLoading />;
  }

  if (authStatus !== 'authenticated') {
    return <Redirect href={UNAUTHENTICATED_ENTRY_ROUTE} />;
  }

  const inOnboarding = pathname === ONBOARDING_ROUTE;

  // Deep links (spec §12): /home, /map, /profile, /vehicle/{id} and every
  // other authenticated route redirect to /onboarding while the current
  // version is unseen. Normal navigation resumes after completion.
  if (onboardingStatus === 'required' && !inOnboarding) {
    return <Redirect href={ONBOARDING_ROUTE as never} />;
  }

  // A completed user who directly opens /onboarding is sent Home (spec §11).
  if (onboardingStatus === 'not-required' && inOnboarding) {
    return <Redirect href={HOME_ROUTE as never} />;
  }

  return (
    <UserLocationProvider>
      <Slot />
    </UserLocationProvider>
  );
}

export default function AppGroupLayout() {
  return (
    <OnboardingProvider>
      <AppProtectedLayout />
    </OnboardingProvider>
  );
}