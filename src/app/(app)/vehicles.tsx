import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Vehicle } from '@/api';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { VehicleItem } from '@/components/home/VehicleItem';
import { VehiclesListSkeleton } from '@/components/home/VehiclesList';
import { BackIcon } from '@/components/vehicle-details/icons';
import { usePaginatedVehicles } from '@/hooks/use-paginated-vehicles';
import { useUserLocation } from '@/location';
import { colors, spacing, typography } from '@/theme';

/** Enough skeleton cards to cover the first viewport (spec §15: 4–6). */
const SKELETON_COUNT = 5;

/**
 * ALL VEHICLES — Phase B / Step B1.3 (functional) + B1.7 (approved UI).
 *
 * A pushed authenticated route (`/vehicles`), deliberately OUTSIDE the
 * `(drawer)`/`(tabs)` groups like `/vehicle/[id]`: it has its own app bar and
 * therefore no bottom tabs and no drawer. Entered from Home's "View All".
 *
 * Visual authority: `docs/rebuild/approve-ui/all-vehicles/APPROVED-ALL-VEHICLES-SPEC.md`
 * ("Home list, expanded"): light `phonePrefix` page, white app bar with a muted
 * count subtitle, full-width bordered cards. B1.7 is presentation only — the
 * B1.3/B1.4 functionality is unchanged.
 *
 * Data comes entirely from `usePaginatedVehicles` (pagination, refresh, load
 * more, dedupe, stale-request safety): this screen owns NO pagination state.
 * Deliberately excluded (B1 scope): search, service filter, favorites, and any
 * contact/request action (`POST /requests` is deferred on the backend side).
 */
export default function AllVehiclesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status: locationStatus, requestLocation } = useUserLocation();

  // Same single-shot prime as Home / Vehicle Details: the shared location
  // provider never auto-requests, and the paginated hook waits for a settled
  // status before its first fetch — without this a deep-linked session would
  // wait forever on `unknown`. Denied / unavailable / timed-out are terminal
  // and simply produce the hook's coordinate-less fetch.
  const primedLocationRef = useRef(false);
  useEffect(() => {
    if (primedLocationRef.current || locationStatus !== 'unknown') {
      return;
    }
    primedLocationRef.current = true;
    void requestLocation();
  }, [locationStatus, requestLocation]);

  const {
    vehicles,
    metaData,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    loadMoreError,
    isEmpty,
    coordsUsed,
    refresh,
    loadMore,
  } = usePaginatedVehicles();

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }, [router]);

  const handleVehiclePress = useCallback(
    (vehicle: Vehicle) => {
      router.push({ pathname: '/vehicle/[id]', params: { id: String(vehicle.id) } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Vehicle }) => (
      <VehicleItem
        vehicle={item}
        userCoords={coordsUsed}
        onPress={handleVehiclePress}
        orientation="vertical"
      />
    ),
    [coordsUsed, handleVehiclePress],
  );

  // RN `onEndReached` can fire repeatedly for a single scroll. This screen-level
  // once-per-gesture guard limits it to one `loadMore` per gesture; the hook
  // remains the source of truth for concurrency and page advancement.
  //
  // Armed on BOTH drag start and momentum begin: `onEndReached` fires DURING the
  // drag once the threshold is crossed, so arming only on momentum begin would
  // swallow that legitimate trigger and load-more would never run for a
  // drag-then-lift that crosses the threshold before any fling.
  const endReachedGuardRef = useRef(true);
  const handleEndReached = useCallback(() => {
    if (endReachedGuardRef.current) {
      return;
    }
    endReachedGuardRef.current = true;
    loadMore();
  }, [loadMore]);
  const handleScrollGestureBegin = useCallback(() => {
    endReachedGuardRef.current = false;
  }, []);

  // Empty/skeleton/error share one slot so pull-to-refresh still works with no
  // rows. They are mutually exclusive by construction.
  const listEmptyComponent = useMemo(() => {
    if (isLoading && vehicles.length === 0) {
      return (
        <View style={styles.skeletonStack}>
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <VehiclesListSkeleton key={index} variant="card" />
          ))}
        </View>
      );
    }
    if (error !== null && vehicles.length === 0) {
      return (
        <View style={styles.stateBox}>
          <ApiErrorRow message={error.message} onRetry={refresh} />
        </View>
      );
    }
    if (isEmpty) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.emptyText}>No vehicles available right now.</Text>
        </View>
      );
    }
    return null;
  }, [error, isEmpty, isLoading, refresh, vehicles.length]);

  // A later-page failure keeps the existing rows and only adds a retry footer.
  const listFooterComponent = useMemo(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (loadMoreError !== null) {
      return (
        <View style={styles.footer}>
          <ApiErrorRow message={loadMoreError.message} onRetry={loadMore} />
        </View>
      );
    }
    return null;
  }, [isLoadingMore, loadMore, loadMoreError]);

  const totalCount = metaData?.totalCount;

  return (
    <View style={styles.screen}>
      <View style={[styles.appBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={goBack}
          style={styles.iconButton}
        >
          <BackIcon color={colors.subtitle} size={22} />
        </Pressable>
        <View style={styles.barCenter}>
          <Text numberOfLines={1} style={styles.appBarTitle}>
            All Vehicles
          </Text>
          {totalCount === undefined ? null : (
            <Text numberOfLines={1} style={styles.appBarCount}>
              {`${totalCount} ${totalCount === 1 ? 'vehicle' : 'vehicles'}`}
            </Text>
          )}
        </View>
        {/* Symmetric empty trailing slot keeps the centered title optically
            centered regardless of the count width. */}
        <View style={styles.iconButton} />
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onEndReachedThreshold={0.5}
        onEndReached={handleEndReached}
        onScrollBeginDrag={handleScrollGestureBegin}
        onMomentumScrollBegin={handleScrollGestureBegin}
        refreshing={isRefreshing}
        onRefresh={refresh}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        ItemSeparatorComponent={VehicleSeparator}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function VehicleSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.phonePrefix,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  barCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.title,
  },
  appBarCount: {
    ...typography.caption,
    color: colors.subtitle,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  skeletonStack: {
    gap: spacing.md,
  },
  stateBox: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.subtitle,
    color: colors.subtitle,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
