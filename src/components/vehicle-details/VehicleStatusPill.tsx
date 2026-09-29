import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

export type WorkStatusDisplay = {
  label: string;
  dotColor: string;
};

/**
 * `workStatus` → user-facing label. Verified backend values (driver API
 * validation `in:online,offline`, default `offline` — see backend
 * `Driver\VehicleController` + `SeedMongoDumpCommand`): every non-`online`
 * value, including unknown ones, renders the NEUTRAL Unavailable state (grey
 * dot, no green/red claim). No unsupported enum case is invented — there is
 * no verified `busy` value on the mobile resource.
 */
export function mapWorkStatus(workStatus: string): WorkStatusDisplay {
  if (workStatus === 'online') {
    return { label: 'Available', dotColor: colors.success };
  }
  return { label: 'Unavailable', dotColor: colors.placeholder };
}

export type VehicleStatusPillProps = {
  workStatus: string;
};

/** Approved hero overlay pill (`bg-white/90` + emerald pulse dot). */
export function VehicleStatusPill({ workStatus }: VehicleStatusPillProps) {
  const { label, dotColor } = mapWorkStatus(workStatus);
  return (
    <View style={styles.pill} accessibilityLabel={label}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.fieldText,
  },
});