import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, interactionOpacity, radius, spacing, typography } from '@/theme';
import { PhoneIcon, WhatsAppIcon } from './icons';

export type ContactBarProps = {
  onWhatsApp: () => void;
  onCall: () => void;
  /**
   * True when there is no usable driver phone — both actions are disabled and
   * nothing is ever invoked (never `tel:undefined`, never a bad WhatsApp URL).
   */
  disabled?: boolean;
};

/**
 * Persistent bottom contact bar (approve-ui footer, `bg-white/95` + top hairline):
 * the WhatsApp quick-inquiry tile and the navy "Call provider" CTA. Wording is
 * facilitator-aligned — YAMAK connects the user with the independent provider,
 * it never sells or fulfils the service ("Call provider", not "Order Now").
 */
export function ContactBar({ onWhatsApp, onCall, disabled = false }: ContactBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Inquire via WhatsApp"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onWhatsApp}
        style={({ pressed }) => [styles.waButton, (pressed || disabled) && styles.dimmed]}
      >
        <WhatsAppIcon color={disabled ? colors.placeholder : colors.successText} size={22} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Call provider"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onCall}
        style={({ pressed }) => [
          styles.callButton,
          disabled && styles.callButtonDisabled,
          pressed && !disabled && styles.callButtonPressed,
        ]}
      >
        <PhoneIcon color={colors.wordmark} size={18} />
        <Text style={styles.callLabel}>Call provider</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  waButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navyDeep,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    shadowColor: '#0B2A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  callButtonPressed: {
    backgroundColor: colors.navyDeepDark,
  },
  callButtonDisabled: {
    backgroundColor: colors.border,
  },
  callLabel: {
    ...typography.buttonLabel,
    color: colors.brandText,
  },
  dimmed: {
    opacity: interactionOpacity.pressed,
  },
});