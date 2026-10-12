import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/components/navigation/AppDrawerContent';
import { colors } from '@/theme';

/**
 * AUTHENTICATED DRAWER SHELL — Phase A / Step A7.2 (architecture only).
 *
 * This file turns the authenticated shell into the legacy DrawerNavigator
 * shape without any new dependency: `expo-router/drawer` re-exports the drawer
 * stack EXPOS ships vendored inside `expo-router` (the same library family the
 * tabs use), and `react-native-drawer-layout` is already installed
 * transitively as the gesture engine.
 *
 * ## Route architecture (URL-transparent route groups)
 *
 * The `(drawer)` group is invisible in URLs. The tabs group lives physically
 * under it — `src/app/(app)/(drawer)/(tabs)/` — so the drawer's ONLY screen is
 * `(tabs)`, and Home / Map / Profile keep their exact hrefs:
 *   /home  /map  /profile  (unchanged since A1–A5)
 *
 * The auth + onboarding gate stays untouched in `(app)/_layout.tsx`; this
 * drawer can only ever mount AFTER onboarding completes (the gate's `<Slot/>`
 * renders this layout). `onboarding.tsx` and `vehicle/[id].tsx` remain direct
 * `(app)` children, physically OUTSIDE this group:
 *   - Onboarding must never appear inside a drawer.
 *   - Vehicle Details keeps the A5 "outside tabs" stack behaviour AND stays
 *     outside the drawer, so the drawer's `backBehavior` never changes the
 *     details screen's back flow.
 *
 * ## Drawer surface (approved visual)
 *
 * The drawer content implements the A7.6 approved design
 * (`docs/rebuild/approve-ui/drawer/APPROVED-DRAWER-SPEC.md`): a white body with
 * a navy identity cap, a gold-tinted active row and a version-only footer — see
 * `AppDrawerContent`. Only the scrim colour is set here (`colors.scrim`) via
 * `overlayColor`; width / position / type / radius stay library defaults so RTL
 * mirroring and the vendored `front` corner radius apply as-is.
 *
 * Gestures / position / width / RTL: all library defaults (no override), so
 * RTL mirroring and the swipe-edge behaviour verified in A7.1 apply as-is.
 */
export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{ headerShown: false, overlayColor: colors.scrim }}
    />
  );
}