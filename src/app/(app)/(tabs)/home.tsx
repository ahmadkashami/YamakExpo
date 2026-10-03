import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Service, Vehicle } from '@/api';
import { AddsList } from '@/components/home/AddsList';
import { ServicesList } from '@/components/home/ServicesList';
import { VehiclesList } from '@/components/home/VehiclesList';
import { ViewMap } from '@/components/home/ViewMap';
import { useUserLocation } from '@/location';
import { spacing } from '@/theme';

/**
 * AUTHENTICATED HOME — Phase A / Step A3.
 *
 * Composition only. This screen owns NO data: it mounts the four already-built,
 * already-verified Home sections in legacy `HomeScreen` order
 * (`ServicesList` → `AddsList` → `VehiclesList` → `ViewMap`) and wires only the
 * tap actions whose destinations already exist. Every section keeps its own hook
 * (`useServices` / `useAdds` / `useVehicles`), its own skeleton and its own
 * `ApiErrorRow`, so a failing or empty section degrades on its own and Home can
 * never surface a raw API error.
 *
 * NOT in A3 (deliberately, so nothing is invented):
 * - the approved Home header / brand pill / greeting / search bar — no verified
 *   component implements it yet (it is step 2 of YAMAK-SCREEN-010);
 * - the approved non-profit facilitator trust banner and the "Kuwait Road
 *   Assistance Support" community notice — recorded REQUIRED business content
 *   with no component behind them yet;
 * - the bottom tab navigator (A5), Profile (A4), onboarding and drawer.
 *
 * Route shape: this file lives in the existing `(tabs)` group, which today holds
 * `map.tsx` and has NO `_layout.tsx`. A group without a layout contributes no
 * navigation of its own, so this route is a plain sibling of `/map` inside the
 * A1-protected `(app)` group — no tab bar is created. When A5 adds
 * `(tabs)/_layout.tsx`, `/home` and `/map` become tabs with zero file moves.
 * `(tabs)/index.tsx` was rejected on purpose: it flattens to the same `/` href
 * as the A1 startup gate `src/app/index.tsx`, which would be a duplicate route.
 */

/** Legacy `HomeScreen` container background: `AppColorsTheme2.offWhite`. */
const HOME_BACKGROUND = '#fafafa';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status: locationStatus, requestLocation } = useUserLocation();

  // One explicit location request on first open, the same single-shot pattern
  // already runtime-verified in `/map` and `/vehicle/[id]`. The shared provider
  // deliberately never auto-requests (mounting a screen must not prompt), while
  // `useVehicles` waits for a settled status before its first request — without
  // this prime the "Vehicles Nearby" skeleton would wait forever on `unknown`.
  // Denied / unavailable / timed-out are all terminal: the hook then performs its
  // verified coordinate-less fallback fetch and Home needs no extra handling.
  const primedLocationRef = useRef(false);
  useEffect(() => {
    if (primedLocationRef.current || locationStatus !== 'unknown') {
      return;
    }
    primedLocationRef.current = true;
    void requestLocation();
  }, [locationStatus, requestLocation]);

  // Legacy opened the Map filtered to the pressed service. `/map` already owns
  // the `serviceId` param (it is what its own chips write via `setParams`), so
  // the press reuses that one destination instead of adding a second filter.
  const handleServicePress = useCallback(
    (service: Service) => {
      router.push({ pathname: '/map', params: { serviceId: String(service.id) } });
    },
    [router],
  );

  // Legacy pressed a vehicle to open its details screen; that route exists.
  const handleVehiclePress = useCallback(
    (vehicle: Vehicle) => {
      router.push({ pathname: '/vehicle/[id]', params: { id: String(vehicle.id) } });
    },
    [router],
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ServicesList onServicePress={handleServicePress} />
      <AddsList />
      <VehiclesList onVehiclePress={handleVehiclePress} />
      <ViewMap />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HOME_BACKGROUND,
  },
  // Legacy `HomeScreen` used `contentContainerStyle={{ flexGrow: 1 }}` so the
  // last section could sit flush when the content is short.
  content: {
    flexGrow: 1,
  },
});