import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const appLogo = require('@/assets/images/appLogo.png');

const colors = {
  navy: '#0C1C33',
  gold: '#FBBF24',
  brandText: '#F8FAFC',
  tagline: '#CBD5E1',
  surface: '#FFFFFF',
  title: '#0F172A',
  subtitle: '#64748B',
} as const;

export default function RegisterScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.brand}>
        <View style={styles.logoPlate}>
          <Image source={appLogo} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.brandNameRow}>
          <Text style={styles.brandName}>YAMAK</Text>
          <Text style={styles.brandDivider}>•</Text>
          <Text style={styles.brandNameArabic}>يمك</Text>
        </View>
        <Text style={styles.tagline}>Kuwait’s road &amp; mobility partner</Text>
      </View>
      <View style={styles.surface}>
        <Text accessibilityRole="header" style={styles.title}>
          Begin your journey
        </Text>
        <Text style={styles.subtitle}>
          A premium account for every journey on Kuwait&apos;s roads.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  brand: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoPlate: {
    width: 64,
    height: 64,
    borderRadius: 16,
    padding: 8,
    backgroundColor: colors.surface,
  },
  logo: {
    width: 48,
    height: 48,
  },
  brandNameRow: {
    height: 24,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: colors.brandText,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  brandDivider: {
    color: colors.brandText,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  brandNameArabic: {
    color: colors.gold,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  tagline: {
    marginTop: 4,
    color: colors.tagline,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
  },
  surface: {
    flex: 1,
    paddingTop: 28,
    paddingHorizontal: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.title,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    color: colors.subtitle,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
});
