import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, interactionOpacity, radius, spacing, typography } from '@/theme';

export type EnableLocationCardProps = {
  /** Wired to the shared provider's `requestLocation()`. */
  onEnable: () => void;
  /** True while a permission/position request is in flight (keeps the button quiet). */
  busy?: boolean;
};

/**
 * Approved new-ui Map permission card (`card.gold`, prototype `map/index.html`):
 * gold tint container, "📍 Enable location", body copy, and a primary
 * `btn-sm` "Enable location" action.
 */
export function EnableLocationCard({ onEnable, busy = false }: EnableLocationCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>📍 Enable location</Text>
      <Text style={styles.body}>Allow location access to see road services near you.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enable location"
        disabled={busy}
        onPress={onEnable}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          busy && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonLabel}>Enable location</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.goldTintBorder,
    borderRadius: radius.lg,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.title,
  },
  body: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.subtitle,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    opacity: interactionOpacity.pressed,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    ...typography.buttonLabel,
    color: colors.brandText,
  },
});