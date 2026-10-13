import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Vehicle } from '@/api';
import { colors, interactionOpacity, radius, spacing, typography } from '@/theme';
import { haversineDistanceKm, isUsableVehicleGeo, type GeoCoordinate } from '@/utils/distance';

const CARD_WIDTH = 350;
const CARD_HEIGHT = 120;

export type VehicleItemProps = {
  vehicle: Vehicle;
  /**
   * The coordinates this fetch cycle was made with, or `null` for a
   * coordinate-less fallback fetch. Distances are computed from these FROZEN
   * coordinates only (never the live context), so a late location change can't
   * make numbers appear on an already-rendered list.
   */
  userCoords: GeoCoordinate | null;
  /** Callback for the card press. Legacy navigated to Vehicle Details, which does not exist yet. */
  onPress?: (vehicle: Vehicle) => void;
  /**
   * Legacy `VehicleItem` had an `isVertical` switch: Home's carousel renders the
   * fixed 350×120 card (`'horizontal'`, the default, byte-identical to before),
   * while the All-Vehicles list stacks full-width cards (`'vertical'`).
   */
  orientation?: 'horizontal' | 'vertical';
};

/**
 * Legacy `VehicleItem`: a 350×120 rounded white card, logo plate on the left,
 * a vertical divider, then Name / Services and a distance + "View" row.
 *
 * Distance is deliberately NOT the backend `distance` field — that value is
 * Euclidean degrees, and the legacy app wrongly rendered it as "KM". When a
 * fetch was made with the user's coordinates and the vehicle has a usable
 * `geoLocation`, the client computes a REAL distance (Haversine, km). In every
 * other case the distance area is simply left blank: no fake "0.0 KM".
 */
export function VehicleItem({
  vehicle,
  userCoords,
  onPress,
  orientation = 'horizontal',
}: VehicleItemProps) {
  const usableGeo = isUsableVehicleGeo(vehicle.geoLocation);
  const distanceKm =
    userCoords !== null && usableGeo ? haversineDistanceKm(userCoords, vehicle.geoLocation) : null;
  const isVertical = orientation === 'vertical';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(vehicle)}
      style={({ pressed }) => [
        styles.container,
        isVertical && styles.containerVertical,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.innerContainer}>
        <View style={styles.imageArea}>
          {vehicle.iconMap === null ? null : (
            <Image
              source={{ uri: vehicle.iconMap }}
              resizeMode="contain"
              style={styles.image}
            />
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.content}>
          <View style={styles.details}>
            {/* Legacy read `item.branch.name` unguarded; branch is nullable per
                the contract, so the row renders only when a name exists. */}
            {vehicle.branch?.name == null ? null : (
              <Text numberOfLines={1} style={styles.name}>
                {`Name : ${vehicle.branch.name}`}
              </Text>
            )}
            <Text style={styles.services}>{`Services : ${vehicle.services?.length ?? 0}`}</Text>
          </View>
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <View style={styles.footerRow}>
              {distanceKm === null ? null : (
                <Text style={styles.distance}>{`${distanceKm.toFixed(1)} km`}</Text>
              )}
              {/* Legacy `FillledButton`, gold with white label. The whole card
                  handles the press, so this is a static visual, not a second
                  nested press target. */}
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonLabel}>View</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: spacing.xl,
    backgroundColor: colors.surface,
  },
  // All-Vehicles list: full-width stacked card (no carousel gap on the right).
  containerVertical: {
    width: '100%',
    marginRight: 0,
  },
  pressed: {
    opacity: interactionOpacity.pressed,
  },
  innerContainer: {
    flexDirection: 'row',
    height: CARD_HEIGHT,
    borderRadius: radius.heroPlate,
  },
  imageArea: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Legacy used `borderWidth: 1` with the default (black) border colour; the
  // divider is recast as a 1pt line in the shared border token instead.
  divider: {
    width: 1,
    backgroundColor: colors.border,
    height: '80%',
    alignSelf: 'center',
  },
  content: {
    flex: 2,
    // Legacy padding literal (10); no spacing token equals it.
    padding: 10,
  },
  details: {
    flex: 2,
    justifyContent: 'center',
  },
  name: {
    // Legacy: 16px Roboto_Medium, black, capitalised. `typography.subtitle`
    // supplies the size; weight and transform are set here.
    ...typography.subtitle,
    fontWeight: '500',
    color: colors.title,
    textTransform: 'capitalize',
  },
  services: {
    ...typography.body,
    color: colors.title,
  },
  footer: {
    flex: 1,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  distance: {
    ...typography.body,
    color: colors.title,
  },
  viewButton: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    width: 60,
    height: 30,
    margin: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonLabel: {
    ...typography.caption,
    color: colors.brandText,
    textTransform: 'capitalize',
  },
});