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
  const hasImage = vehicle.iconMap !== null;
  const serviceCount = vehicle.services?.length ?? 0;

  // The whole card is ONE button, so it exposes a single composed label instead
  // of letting the screen reader walk the plate / divider / "View" visual.
  const accessibilityLabel = [
    vehicle.branch?.name == null ? null : `Name: ${vehicle.branch.name}`,
    `Services: ${serviceCount}`,
    distanceKm === null ? null : `${distanceKm.toFixed(1)} kilometers`,
  ]
    .filter((part): part is string => part !== null)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => onPress?.(vehicle)}
      style={({ pressed }) => [
        styles.container,
        isVertical && styles.containerVertical,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.innerContainer}>
        {/* Vertical cards only: a neutral plate when there is no image, so the
            left column reads as an intentional frame rather than a broken card.
            Home (horizontal) keeps the shipped blank plate. */}
        <View style={[styles.imageArea, isVertical && !hasImage && styles.imageAreaPlate]}>
          {vehicle.iconMap === null ? null : (
            <Image
              accessible={false}
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
            <Text style={styles.services}>{`Services : ${serviceCount}`}</Text>
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
              {/* Logical trailing pin: `marginStart` keeps "View" on the
                  trailing edge under both LTR and RTL, even when there is no
                  distance line to push it there via space-between. */}
              <View style={[styles.viewButton, isVertical && styles.viewButtonTrailing]}>
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
  // All-Vehicles list: full-width stacked card. The shell (radius + hairline +
  // subtle shadow + clipped overflow) matches the shipped Vehicle Details
  // surfaces; the horizontal Home card keeps its original square shell.
  containerVertical: {
    width: '100%',
    marginRight: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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
  // Vertical-only neutral plate behind a missing image (no asset/emoji/label).
  imageAreaPlate: {
    backgroundColor: colors.phonePrefix,
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
  // Vertical-only: keep the affordance on the trailing edge with no distance.
  viewButtonTrailing: {
    marginStart: 'auto',
  },
  viewButtonLabel: {
    ...typography.caption,
    color: colors.brandText,
    textTransform: 'capitalize',
  },
});