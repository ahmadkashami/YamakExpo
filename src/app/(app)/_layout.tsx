import { Slot } from 'expo-router';

import { UserLocationProvider } from '@/location';

/**
 * Minimal authenticated-area shell for Step 4B: this layout only mounts the
 * SINGLE shared `UserLocationProvider` around the Map route (approved ownership
 * decision — the Map consumes `useUserLocation()`, it never starts a second
 * location flow, and mounting the provider here means opening `/register` can
 * never prompt for location).
 *
 * Deliberately no auth gate and no navigator yet: the future authenticated
 * `(app)` shell (tabs/drawer) will grow from here without moving the provider.
 */
export default function AppGroupLayout() {
  return (
    <UserLocationProvider>
      <Slot />
    </UserLocationProvider>
  );
}