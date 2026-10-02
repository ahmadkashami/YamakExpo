import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/**
 * Minimal neutral surface rendered while the persisted session is still being
 * restored (`useAuth().status === 'loading'`).
 *
 * Deliberately unbranded: Step A1 is routing only, so this must not invent any
 * new branding or design work. It exists so that a gate branch can never fall
 * through to an unauthenticated or an authenticated screen while the auth
 * status is unresolved — that fall-through is what would cause a wrong-screen
 * flash.
 */
export function AuthGateLoading({ testID }: { testID?: string }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Restoring your session"
      testID={testID}
      style={styles.surface}>
      <ActivityIndicator color={colors.navy} size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});