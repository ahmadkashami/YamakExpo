import { Image, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { Vehicle } from '@/api';
import type { UserCoords } from '@/location';
import { colors } from '@/theme';
import { vehicleMarkerCoordinate } from '@/utils/vehicle-marker';

const BADGE_SIZE = 40;
const BADGE_ACTIVE_SIZE = 48;
const ICON_SIZE = 22;
const ICON_ACTIVE_SIZE = 26;

/**
 * One vehicle marker. Position comes from `geoLocation.coordinates`
 * (`[longitude, latitude]`, converted by `vehicleMarkerCoordinate`); vehicles
 * without a usable location are skipped (return null) — nothing is ever read
 * from the legacy `geoMetry` typo.
 *
 * Visual: legacy *intent* (pin with the vehicle's `iconMap` service icon) built
 * from brand tokens — a gold circular badge instead of the legacy `PinLocation`
 * PNG pipeline. No index keys: the parent keys by `vehicle.id`.
 *
 * Press behaviour: Vehicle Details does not exist yet, so `VehicleMarker`
 * reports the vehicle upward and the screen keeps a local selection only — it
 * never navigates to an invented route.
 */
export function VehicleMarker({
  vehicle,
  isActive,
  onPress,
}: {
  vehicle: Vehicle;
  isActive: boolean;
  onPress: (vehicle: Vehicle) => void;
}) {
  const coordinate = vehicleMarkerCoordinate(vehicle);
  if (coordinate === null) {
    return null;
  }

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(vehicle)}
      // Snapshot when idle; while selected, keep tracking so the active size
      // change re-renders (Android re-snapshots only while tracked).
      tracksViewChanges={isActive}
    >
      <View
        accessible
        accessibilityLabel={`Vehicle ${vehicle.labelNumber ?? vehicle.id} on map`}
        style={[styles.badge, isActive && styles.badgeActive]}
      >
        {vehicle.iconMap === null ? null : (
          <Image
            source={{ uri: vehicle.iconMap }}
            style={isActive ? styles.iconActive : styles.icon}
            resizeMode="contain"
          />
        )}
      </View>
    </Marker>
  );
}

/**
 * The single "you are here" marker. One implementation only — the native
 * `showsUserLocation` dot is disabled so we never render two user indicators
 * (legacy defect). Rendered only while `status === 'available'` (non-null coords).
 */
export function UserLocationMarker({ coords }: { coords: UserCoords }) {
  return (
    <Marker coordinate={coords} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
      <View accessible accessibilityLabel="Your location" style={styles.userBadge}>
        <View style={styles.userDot} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  badgeActive: {
    width: BADGE_ACTIVE_SIZE,
    height: BADGE_ACTIVE_SIZE,
    borderRadius: BADGE_ACTIVE_SIZE / 2,
    borderColor: colors.primary,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconActive: {
    width: ICON_ACTIVE_SIZE,
    height: ICON_ACTIVE_SIZE,
  },
  userBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surface,
  },
});