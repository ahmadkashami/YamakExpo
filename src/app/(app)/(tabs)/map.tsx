import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Service, Vehicle } from '@/api';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { EnableLocationCard } from '@/components/map/EnableLocationCard';
import { MapControls, type MapType } from '@/components/map/MapControls';
import { MapServiceChips } from '@/components/map/MapServiceChips';
import { MicroBanner } from '@/components/map/MicroBanner';
import { UserLocationMarker, VehicleMarker } from '@/components/map/MapMarkers';
import { useMapVehicles } from '@/hooks/use-map-vehicles';
import { useServices } from '@/hooks/use-services';
import { useUserLocation } from '@/location';
import { colors, radius, spacing } from '@/theme';
import { haversineDistanceKm } from '@/utils/distance';
import { vehicleMarkerCoordinate } from '@/utils/vehicle-marker';

/**
 * Kuwait default framing. This is ONLY the uncontrolled `initialRegion` — the
 * legacy Map kept a hardcoded controlled region with no `onRegionChange`
 * handler (the map was stuck around Kuwait city); here the user can pan/zoom
 * freely and we recenter on the user's position once, when it first arrives.
 */
const KUWAIT_INITIAL_REGION = {
  latitude: 29.3759,
  longitude: 47.9774,
  latitudeDelta: 0.3,
  longitudeDelta: 0.25,
};

const USER_CENTERED_DELTA = 0.05;

function parseServiceIdParam(value: string | string[] | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

/**
 * Map tab (approved new-ui `docs/rebuild/new-ui/main/map/index.html`).
 *
 * - Selected service is canonically the route param `serviceId`, mirrored in
 *   local state; NO global selected-service store. Chips update both.
 * - No selected service → valid Map state (map + user marker + chips), no
 *   vehicles request. Selecting a chip or entering with `?serviceId=N`
 *   fetches `GET /services/{id}/vehicles` via `useMapVehicles` (bare-array).
 * - The Map consumes the shared `useUserLocation()`; it requests location once
 *   on mount and shows the prototype's gold permission card otherwise.
 */
export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceId?: string | string[] }>();
  const rawServiceId = params.serviceId;

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(() =>
    parseServiceIdParam(rawServiceId),
  );

  // Route param is canonical: any deep-link / in-app param change re-syncs the
  // local selection (same value → no effect; different value → new cycle).
  useEffect(() => {
    setSelectedServiceId(parseServiceIdParam(rawServiceId));
  }, [rawServiceId]);

  const { services, isLoading: servicesLoading, error: servicesError, refetch: refetchServices } =
    useServices();
  const { vehicles, isLoading: vehiclesLoading, error: vehiclesError, refetch: refetchVehicles } =
    useMapVehicles(selectedServiceId);
  const { status: locationStatus, coords: userCoords, requestLocation } = useUserLocation();

  const mapRef = useRef<MapView>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Layers/Traffic are LOCAL to this screen (no global store, not persisted).
  const [mapType, setMapType] = useState<MapType>('standard');
  const [trafficEnabled, setTrafficEnabled] = useState(false);

  // One explicit location request on first open (the shared provider never
  // auto-requests — mounting any screen must not prompt). The approved
  // prototype's demo state IS the permission card, which this surfaces.
  const requestedLocationRef = useRef(false);
  useEffect(() => {
    if (requestedLocationRef.current || locationStatus !== 'unknown') {
      return;
    }
    requestedLocationRef.current = true;
    void requestLocation();
  }, [locationStatus, requestLocation]);

  // Single one-time recenter on the user once the position is available; the
  // region afterwards stays unattended (user-pannable/zoomable).
  const recenteredOnUserRef = useRef(false);
  useEffect(() => {
    if (userCoords === null || recenteredOnUserRef.current) {
      return;
    }
    recenteredOnUserRef.current = true;
    mapRef.current?.animateToRegion(
      {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: USER_CENTERED_DELTA,
        longitudeDelta: USER_CENTERED_DELTA,
      },
      400,
    );
  }, [userCoords]);

  const handleSelectService = useCallback(
    (service: Service) => {
      setSelectedServiceId(service.id);
      // Keep the route param canonical (safe: no navigation, instance stable).
      router.setParams({ serviceId: String(service.id) });
    },
    [router],
  );

  const handleVehiclePress = useCallback(
    (vehicle: Vehicle) => {
      // Marker press opens Vehicle Details DIRECTLY (approved wiring; no
      // bottom sheet, no intermediate callout). The local selected-state still
      // updates first for the gold selection visual.
      setSelectedVehicleId(vehicle.id);
      router.push({ pathname: '/vehicle/[id]', params: { id: String(vehicle.id) } });
    },
    [router],
  );

  const cycleMapType = useCallback(() => {
    setMapType((current) =>
      current === 'standard' ? 'satellite' : current === 'satellite' ? 'hybrid' : 'standard',
    );
  }, []);

  const toggleTraffic = useCallback(() => {
    setTrafficEnabled((current) => !current);
  }, []);

  // Manual Recenter: re-animates to the current frozen user coordinates. The
  // map stays otherwise uncontrolled (no controlled-region lock) and this
  // control NEVER requests permission — without coords it is simply disabled.
  const handleRecenter = useCallback(() => {
    if (userCoords === null) {
      return;
    }
    mapRef.current?.animateToRegion(
      {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: USER_CENTERED_DELTA,
        longitudeDelta: USER_CENTERED_DELTA,
      },
      500,
    );
  }, [userCoords]);

  // True Haversine distances in km from the frozen user position to each
  // vehicle — computed ONLY when both coordinate pairs are valid. The backend
  // `distance` field (Euclidean degrees) is neither read nor rendered. Markers
  // already skip unusable vehicle coords, so `null` here only means the user
  // has no valid position (the distance label is then omitted).
  const vehicleDistances = useMemo(() => {
    const distances: Record<number, number | null> = {};
    for (const vehicle of vehicles) {
      if (userCoords === null) {
        distances[vehicle.id] = null;
        continue;
      }
      const coordinate = vehicleMarkerCoordinate(vehicle);
      distances[vehicle.id] =
        coordinate === null ? null : haversineDistanceKm(userCoords, coordinate);
    }
    return distances;
  }, [vehicles, userCoords]);

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      {/* App bar (prototype `.appbar.on-light`): Menu | Map | Notifications. */}
      <View style={[styles.appBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          // The drawer is out of scope for Step 4B — placeholder keeps the
          // approved header geometry without inventing a drawer route.
          onPress={() => {}}
          style={styles.iconButton}
        >
          <Text style={styles.iconText}>☰</Text>
        </Pressable>
        <Text style={styles.appBarTitle}>Map</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          // Notifications screen is out of scope — no badge, no fake data.
          onPress={() => {}}
          style={styles.iconButton}
        >
          <Text style={styles.iconText}>🔔</Text>
        </Pressable>
      </View>

      {/* Map frame */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={KUWAIT_INITIAL_REGION}
          mapType={mapType}
          showsTraffic={trafficEnabled}
          loadingEnabled
          loadingBackgroundColor={colors.surface}
          toolbarEnabled={false}
          showsUserLocation={false}
          onPress={() => setSelectedVehicleId(null)}
        >
          {userCoords === null ? null : <UserLocationMarker coords={userCoords} />}
          {vehicles.map((vehicle) => (
            <VehicleMarker
              key={vehicle.id}
              vehicle={vehicle}
              isActive={vehicle.id === selectedVehicleId}
              distanceKm={vehicleDistances[vehicle.id] ?? null}
              onPress={handleVehiclePress}
            />
          ))}
        </MapView>

        {/* Approved micro-banner — static facilitator copy; `pointerEvents="none"`
            so the pill never blocks map pan/zoom beneath it. */}
        <MicroBanner />

        {/* Approved map controls: Recenter · Layers · Traffic (local state only). */}
        <MapControls
          onRecenter={handleRecenter}
          recenterDisabled={userCoords === null}
          mapType={mapType}
          onCycleMapType={cycleMapType}
          trafficEnabled={trafficEnabled}
          onToggleTraffic={toggleTraffic}
        />

        {/* Lightweight vehicles loading state (no selected service → no overlay). */}
        {vehiclesLoading ? (
          <View style={styles.loadingBadge} pointerEvents="none">
            <ActivityIndicator size="small" color={colors.gold} />
          </View>
        ) : null}

        {/* Safe error UI — ApiError.message only, never a raw response body. */}
        {vehiclesError !== null ? (
          <View style={styles.errorCard}>
            <ApiErrorRow message={vehiclesError.message} onRetry={refetchVehicles} />
          </View>
        ) : null}

        {/* Approved permission / location-off card (prototype `card.gold`). */}
        {locationStatus !== 'available' ? (
          <View style={styles.locationWrap}>
            <EnableLocationCard
              status={locationStatus}
              // Disable the action while a request is in flight: the provider
              // admits one resolution at a time, so extra presses would be
              // dropped anyway. Keeps the card honest about what a tap does.
              busy={locationStatus === 'resolving'}
              onEnable={() => void requestLocation()}
            />
            <Text style={styles.caption}>Marker/tap → vehicle details.</Text>
          </View>
        ) : null}
      </View>

      {/* Service chips footer — self-sufficient via its own `useServices` call
          above; never depends on Home having rendered first (legacy bug fix). */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {servicesLoading && services.length === 0 ? (
          <ActivityIndicator size="small" color={colors.gold} />
        ) : servicesError !== null ? (
          <ApiErrorRow message={servicesError.message} onRetry={refetchServices} />
        ) : (
          <MapServiceChips
            services={services}
            selectedServiceId={selectedServiceId}
            onSelect={handleSelectService}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    minHeight: 52,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.title,
  },
  appBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.title,
  },
  mapArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  errorCard: {
    position: 'absolute',
    // Below the micro-banner and the controls column so they never overlap.
    top: 104,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    elevation: 4,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  locationWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  caption: {
    marginTop: spacing.md,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.placeholder,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 120,
    justifyContent: 'center',
  },
});