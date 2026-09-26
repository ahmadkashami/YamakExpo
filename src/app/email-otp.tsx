import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontWeight, radius, spacing, typography } from '@/theme';

const appLogo = require('@/assets/images/appLogo.png');

export default function EmailOtpScreen() {
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const emailValue = Array.isArray(email) ? (email[0] ?? '') : (email ?? '');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandGroup}>
          <View style={styles.logoPlate}>
            <Image source={appLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.brandNameRow}>
            <Text style={styles.brandName}>YAMAK</Text>
            <Text style={styles.brandDivider}>·</Text>
            <Text style={styles.brandNameArabic}>يمك</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            Account Verification
          </Text>
          <Text style={styles.subtitle}>Please Enter the 4 digit we have sent to :</Text>
          <Text accessibilityLabel={`Verification code sent to ${emailValue}`} style={styles.email}>
            {emailValue}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  brandGroup: {
    alignItems: 'center',
  },
  logoPlate: {
    width: 72,
    height: 72,
    marginBottom: spacing.md,
    borderRadius: radius.heroPlate,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  logo: {
    width: 48,
    height: 48,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  brandName: {
    color: colors.brandText,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  brandDivider: {
    color: colors.wordmark,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  brandNameArabic: {
    color: colors.wordmark,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
    writingDirection: 'rtl',
  },
  card: {
    marginTop: spacing.xxl,
    paddingTop: spacing.xl,
    paddingRight: spacing.xl,
    paddingBottom: spacing.xl,
    paddingLeft: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.title,
    color: colors.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.subtitle,
    textAlign: 'center',
  },
  email: {
    ...typography.subtitle,
    marginTop: spacing.sm,
    color: colors.title,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
});
