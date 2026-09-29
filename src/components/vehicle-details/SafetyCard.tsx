import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

/**
 * Legacy `YourSaftyMatter` ("Your safety matter to us") preserved and
 * redesigned to the approve-ui card language. The legacy bullets were
 * buyer/seller marketplace text ("inspect the product before purchasing",
 * "meeting a buyer / seller") and are REPLACED with business-model-aligned
 * copy: YAMAK is a free facilitator/connector, so the guidance is about
 * direct agreement with the independent provider — no guarantees added.
 */
const SAFETY_POINTS: readonly string[] = [
  'Communicate directly with the provider.',
  'Confirm service details before work begins.',
  'Do not pay in advance.',
  'YAMAK is a free facilitator / connector between you and the provider.',
];

export function SafetyCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Your safety</Text>
      {SAFETY_POINTS.map((point, index) => (
        <Text key={index} style={styles.point}>
          {`\u2022 ${point}`}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  heading: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.title,
    marginBottom: spacing.md,
  },
  point: {
    ...typography.caption,
    color: colors.subtitle,
    marginBottom: spacing.sm,
  },
});