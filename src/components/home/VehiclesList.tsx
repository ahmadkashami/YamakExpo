import { useCallback, useEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Vehicle } from '@/api';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { VehicleItem } from '@/components/home/VehicleItem';
import { useVehicles } from '@/hooks/use-vehicles';
import { colors, radius, spacing, typography } from '@/theme';

export type VehiclesListProps = {
  /** Legacy defaulted to `t("VehiclesNearBy")` = "Vehicles Nearby". */
  title?: string;
  /** Legacy defaulted to a horizontal row of cars. */
  horizontal?: boolean;
  /**
   * Vehicle Details reuses this list for "Other Vehicles": pass the current
   * vehicle's id to exclude it from the row (legacy `VehiclesList
   * selectedId={_id}` semantics).
   */
  excludeId?: number;
  /**
   * Legacy pressed a car to the Vehicle Details screen (and "View All" to the
   * All-Vehicles screen). The details route now exists — consumers push
   * `/vehicle/{id}` here; "View All" still has no route, so that affordance
   * only appears once a handler is supplied.
   */
  onVehiclePress?: (vehicle: Vehicle) => void;
  onViewAllPress?: () => void;
  /**
   * Lets the future Home screen trigger a pull-to-refresh without owning this
   * component's request. `useVehicles.refetch` re-reads the CURRENT location
   * state, so a refresh uses the latest coordinates (never persisted ones).
   */
  onRefetchReady?: (refetch: () => void) => void;
};

export function VehiclesList({
  title,
  horizontal = true,
  excludeId,
  onVehiclePress,
  onViewAllPress,
  onRefetchReady,
}: VehiclesListProps) {
  const { vehicles, isLoading, error, refetch, coordsUsed } = useVehicles();

  const data = useMemo(
    () => (excludeId === undefined ? vehicles : vehicles.filter((vehicle) => vehicle.id !== excludeId)),
    [vehicles, excludeId],
  );

  useEffect(() => {
    onRefetchReady?.(refetch);
  }, [onRefetchReady, refetch]);

  const renderItem = useCallback(
    ({ item }: { item: Vehicle }) => (
      <VehicleItem vehicle={item} userCoords={coordsUsed} onPress={onVehiclePress} />
    ),
    [coordsUsed, onVehiclePress],
  );

  // Only the first load shows the skeleton, so a refetch does not blank the list.
  if (isLoading && vehicles.length === 0) {
    return <VehiclesListSkeleton />;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title ? title : 'Vehicles Nearby'}</Text>
        {/* Legacy always rendered "View All" and navigated to the All-Vehicles
            screen; that route does not exist, so the affordance only appears
            once a consumer supplies a handler. */}
        {onViewAllPress === undefined ? null : (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onViewAllPress}>
            <Text style={styles.viewAllLabel}>View All</Text>
          </Pressable>
        )}
      </View>
      {error === null ? null : <ApiErrorRow message={error.message} onRetry={refetch} />}
      {/* Empty result keeps the legacy behaviour: header visible, nothing below. */}
      <FlatList
        data={data}
        horizontal={horizontal}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

/** Legacy `NearByVehiclePH`: one 150pt-tall block, container padding 8 and
 *  horizontal margin 20. solid `colors.border`, matching how the Services and
 *  Adds sections already recreate their legacy placeholders. */
export function VehiclesListSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonBlock} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Legacy `VehiclesList` sectionContainer: radius 10, vertical margin 10,
  // horizontal margin 20 and NO background colour (that is not a typo — the
  // legacy `backgroundColor` was commented out).
  section: {
    borderRadius: radius.md,
    marginVertical: spacing.md,
    marginHorizontal: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    // Legacy: 16px Roboto_Medium. No exact token pair, so `typography.subtitle`
    // supplies the size and the weight is set here.
    ...typography.subtitle,
    fontWeight: '500',
  },
  viewAllLabel: {
    // Legacy: 12px Roboto_Medium in the gold secondary colour.
    ...typography.caption,
    color: colors.gold,
  },
  skeletonContainer: {
    padding: spacing.sm,
    marginHorizontal: spacing.xl,
  },
  skeletonBlock: {
    height: 150,
    backgroundColor: colors.border,
  },
});