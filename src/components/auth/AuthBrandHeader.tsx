import { SymbolView } from 'expo-symbols';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { colors, fontWeight, radius, spacing } from '@/theme';

const appLogo = require('@/assets/images/appLogo.png');

export function AuthBrandHeader() {
  return (
    <View style={styles.hero}>
      <Svg
        style={styles.heroRoute}
        width="100%"
        height="100%"
        viewBox="0 0 430 260"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        pointerEvents="none"
        opacity={0.22}>
        <Defs>
          <LinearGradient id="yamakRouteGlow" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0" stopColor={colors.routeBlue} stopOpacity={0.15} />
            <Stop offset="0.5" stopColor={colors.routeGold} stopOpacity={0.7} />
            <Stop offset="1" stopColor={colors.routeGold} stopOpacity={0.15} />
          </LinearGradient>
        </Defs>
        <Path
          d="M-20,185 C75,170 120,65 215,95 C285,120 345,70 450,48"
          fill="none"
          stroke="url(#yamakRouteGlow)"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeDasharray="4 6"
        />
        <Path
          d="M-30,215 C85,200 135,95 235,118 C320,138 370,95 460,70"
          fill="none"
          stroke={colors.routeGold}
          strokeOpacity={0.2}
          strokeWidth={1}
          strokeLinecap="round"
        />
        <Circle cx={172} cy={80} r={3.5} fill={colors.routeGold} fillOpacity={0.95} />
        <Circle
          cx={172}
          cy={80}
          r={7}
          fill="none"
          stroke={colors.routeGold}
          strokeOpacity={0.4}
          strokeWidth={1.2}
        />
        <Circle cx={278} cy={112} r={3} fill={colors.routeBlue} fillOpacity={0.75} />
        <Circle
          cx={278}
          cy={112}
          r={5.5}
          fill="none"
          stroke={colors.routeBlue}
          strokeOpacity={0.3}
          strokeWidth={1}
        />
      </Svg>
      <View style={styles.settingsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={6}
          style={({ pressed }) => [
            styles.settingsButton,
            pressed && styles.settingsButtonPressed,
          ]}>
          <SymbolView
            name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
            size={16}
            tintColor={colors.border}
          />
        </Pressable>
      </View>
      <View style={styles.brandGroup}>
        <View style={styles.logoPlate}>
          <Image source={appLogo} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.brandNameRow}>
          <Text style={styles.brandName}>YAMAK</Text>
          <Text style={styles.brandDivider}>·</Text>
          <Text style={styles.brandNameArabic}>يمك</Text>
        </View>
        <Text style={styles.tagline}>Your road &amp; mobility partner</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: spacing.sm,
    paddingBottom: 36,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.navy,
  },
  heroRoute: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  settingsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
  },
  settingsButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  brandGroup: {
    alignItems: 'center',
  },
  logoPlate: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
    borderRadius: radius.heroPlate,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: colors.surface,
    boxShadow:
      '0px 12px 28px rgba(6, 19, 34, 0.32), 0px 2px 8px rgba(233, 163, 25, 0.16)',
  },
  logo: {
    width: 56,
    height: 56,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  brandName: {
    color: colors.brandText,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  brandDivider: {
    color: colors.wordmark,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
  brandNameArabic: {
    color: colors.wordmark,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
    writingDirection: 'rtl',
  },
  tagline: {
    marginTop: 6,
    color: colors.tagline,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
