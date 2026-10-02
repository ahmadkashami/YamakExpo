import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LocationStatus } from '@/location';
import { colors, interactionOpacity, radius, spacing, typography } from '@/theme';

export type EnableLocationCardProps = {
  /** Wired to the shared provider's `requestLocation()`. */
  onEnable: () => void;
  /** True while a permission/position request is in flight (keeps the button quiet). */
  busy?: boolean;
  /**
   * Current owner status.
   *
   * The card is only rendered while the status is NOT `available`, and those
   * states are NOT equivalent: `denied` (plus the pre-request `unknown` /
   * `resolving` pair) means the OS permission is missing, whereas
   * `timed-out` / `unavailable` can only be reached AFTER the permission check
   * already succeeded — they are position failures, and re-prompting for a
   * permission the user already granted can never fix them. Showing the
   * permission copy for all of them misreports a granted app as "Enable
   * location", so each failure gets its own truthful copy and action.
   */
  status: LocationStatus;
};

type LocationCardCopy = {
  title: string;
  body: string;
  action: string;
};

/**
 * `denied` (and the two pre-request states) keep the approved new-ui Map
 * permission copy verbatim — the user genuinely still owes us the permission.
 * The two post-permission failures state what actually went wrong and offer a
 * retry, which is the only action that can change their outcome.
 */
function copyForStatus(status: LocationStatus): LocationCardCopy {
  if (status === 'timed-out') {
    return {
      title: '📍 Location not found',
      body: 'Location access is on, but we could not get your position. Try again.',
      action: 'Try again',
    };
  }
  if (status === 'unavailable') {
    return {
      title: '📍 Location services are off',
      body: 'Location access is on, but your device location services are off. Turn them on, then try again.',
      action: 'Try again',
    };
  }
  return {
    title: '📍 Enable location',
    body: 'Allow location access to see road services near you.',
    action: 'Enable location',
  };
}

/**
 * Approved new-ui Map permission card (`card.gold`, prototype `map/index.html`):
 * gold tint container, title, body copy, and a primary `btn-sm` action. The
 * approved "Enable location" wording is reserved for the states where the
 * permission is genuinely still missing.
 */
export function EnableLocationCard({ onEnable, busy = false, status }: EnableLocationCardProps) {
  const copy = copyForStatus(status);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.action}
        disabled={busy}
        onPress={onEnable}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          busy && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonLabel}>{copy.action}</Text>
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