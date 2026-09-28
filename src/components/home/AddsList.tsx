import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddsCarousel } from '@/components/home/AddsCarousel';
import { useAdds } from '@/hooks/use-adds';
import { colors, radius, spacing, typography } from '@/theme';

export type AddsListProps = {
  /**
   * Lets the future Home screen trigger a pull-to-refresh without owning this
   * component's request. Optional: omitted, the list just self-fetches once.
   */
  onRefetchReady?: (refetch: () => void) => void;
};

export function AddsList({ onRefetchReady }: AddsListProps) {
  const { adds, isLoading, error, refetch } = useAdds();

  useEffect(() => {
    onRefetchReady?.(refetch);
  }, [onRefetchReady, refetch]);

  // Only the first load shows the skeleton, so a refetch does not blank the list.
  if (isLoading && adds.length === 0) {
    return <AddsListSkeleton />;
  }

  return (
    <View style={styles.section}>
      {error === null ? null : (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error.message}</Text>
          <Pressable accessibilityRole="button" onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      )}
      {/* Empty result keeps the legacy behaviour: no heading, just an empty carousel. */}
      <AddsCarousel adds={adds} />
    </View>
  );
}

function AddsListSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Legacy `AddsList` section: padding 8, radius 10, vertical margin 10,
  // horizontal margin 20 — and notably NO background colour, unlike Services.
  section: {
    padding: spacing.sm,
    borderRadius: radius.md,
    marginVertical: spacing.md,
    marginHorizontal: spacing.xl,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.error,
    flexShrink: 1,
    color: colors.error,
  },
  retryButton: {
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryLabel: {
    ...typography.label,
    color: colors.title,
  },
  // Legacy `AddsListPh`: one 200pt-tall rounded block, container padding 8 and
  // horizontal margin 20, vertical margin commented out.
  skeletonContainer: {
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.xl,
  },
  skeletonCard: {
    height: 200,
    borderRadius: radius.heroPlate,
    backgroundColor: colors.border,
  },
});
