import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { Service, ServiceLanguage } from '@/api';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { ServiceItem } from '@/components/home/ServiceItem';
import { useServices } from '@/hooks/use-services';
import { colors, fontWeight, radius, spacing, typography } from '@/theme';

/** Legacy `ServiceListPH` rendered five placeholder circles. */
const PLACEHOLDER_ITEMS = Array.from({ length: 5 }, (_, index) => index);

export type ServicesListProps = {
  /**
   * Legacy pressed a service to `navigation.navigate('Map', { id })`. The Map
   * route does not exist yet, so the selection is reported upward instead of
   * navigating to a route that is not there.
   */
  onServicePress?: (service: Service) => void;
  language?: ServiceLanguage;
  /**
   * Lets the future Home screen trigger a pull-to-refresh without owning this
   * component's request. Optional: omitted, the list just self-fetches once.
   */
  onRefetchReady?: (refetch: () => void) => void;
};

export function ServicesList({
  onServicePress,
  language = 'en',
  onRefetchReady,
}: ServicesListProps) {
  const { services, isLoading, error, refetch } = useServices();
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  useEffect(() => {
    onRefetchReady?.(refetch);
  }, [onRefetchReady, refetch]);

  const handlePress = useCallback(
    (service: Service) => {
      // Legacy also stored the selection, which underlined the pressed item.
      setSelectedServiceId(service.id);
      onServicePress?.(service);
    },
    [onServicePress],
  );

  const renderItem = useCallback(
    ({ item }: { item: Service }) => (
      <ServiceItem
        service={item}
        language={language}
        isSelected={item.id === selectedServiceId}
        onPress={handlePress}
      />
    ),
    [handlePress, language, selectedServiceId],
  );

  // Only the first load shows the skeleton, so a refetch does not blank the list.
  if (isLoading && services.length === 0) {
    return <ServicesListSkeleton />;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Services</Text>
      </View>
      {error === null ? null : <ApiErrorRow message={error.message} onRetry={refetch} />}
      {/* Empty result keeps the legacy behaviour: header visible, nothing below. */}
      <FlatList
        data={services}
        horizontal
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

function ServicesListSkeleton() {
  return (
    <View style={[styles.section, styles.skeletonSection]}>
      <FlatList
        data={PLACEHOLDER_ITEMS}
        horizontal
        keyExtractor={(item) => String(item)}
        renderItem={() => (
          <View style={styles.skeletonItem}>
            <View style={styles.skeletonPlate} />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: spacing.md,
    marginHorizontal: spacing.xl,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  skeletonSection: {
    height: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    // Legacy: 16px Roboto_Medium. No exact token pair, so `typography.subtitle`
    // supplies the size and the weight is set here.
    ...typography.subtitle,
    fontWeight: fontWeight.medium,
  },
  skeletonItem: {
    marginHorizontal: spacing.sm,
  },
  skeletonPlate: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
  },
});
