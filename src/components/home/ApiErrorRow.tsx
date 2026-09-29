import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export type ApiErrorRowProps = {
  message: string;
  onRetry: () => void;
};

/**
 * Shared inline error row for the Home data sections (Services, Adds,
 * Vehicles). All three legacy sections rendered the same message + Retry row,
 * so the exact same style is now owned here; the per-section error text stays
 * the `ApiError.message` from each section's own request.
 */
export function ApiErrorRow({ message, onRetry }: ApiErrorRowProps) {
  return (
    <View style={styles.errorRow}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryLabel}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
});