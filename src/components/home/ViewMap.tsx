import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fontWeight, radius, spacing, typography } from '@/theme';

/**
 * APPROVED Home "Live Radar Map Preview" card (visual source of truth:
 * `docs/rebuild/approve-ui/home/code.html`, data-purpose="live-map-radar-card").
 *
 * Layout (top→bottom, faithful to the approved HTML structure):
 * - header row: pulsing emerald dot + "Nearby on radar", "Kuwait" caption,
 *   and the blue "Map preview" badge;
 * - h-36 map display: light map backdrop (gradient approximated flat),
 *   SVG road vectors + Gulf waterline, pulsing rose 📍 pin with a
 *   "Your location" pill, and two service chips ("🛻 Tow", "🔋 Battery");
 * - footer: "Recovery units ready" + the navy "Explore Map" button.
 *
 * Copy note (latest approved rules): the prototype's demo statistics
 * ("~14 min avg", "Kuwait City & Salmiya zone", "Winch · 1.2 km",
 * "Battery · 800m", "12 active recovery units ready") are DECORATIVE
 * EXAMPLES, not product data — no verified data backs them, so they are
 * neutralized (non-quantified labels only) while the visual composition
 * from `approve-ui/home/code.html` is preserved. No API/location backing.
 *
 * ONLY the "Explore Map" button is interactive (the approved HTML makes the
 * rest of the card decorative); it opens the real `/map` route with NO
 * serviceId, leaving the Map in its valid no-selection state (map + services
 * chips visible, no vehicles-by-service request until a chip is chosen).
 *
 * Deliberate differences from legacy `components/home/ViewMap.tsx`:
 * - no 1s fake-loading timeout → `NearByVehiclePH` skeleton (dropped per spec);
 * - no three icon/text rows and no white radius-10 card — the approved radar
 *   card replaces the legacy card visually;
 * - legacy `Paper map-cuate.svg` is not used — the approved design draws the
 *   preview with CSS + inline SVG, reproduced here with Views + react-native-svg
 *   (already a project dependency);
 * - no API, no location, no global state, no embedded MapView.
 */
export function ViewMap() {
  const router = useRouter();

  // Pulsing radar pin (approved keyframes: scale .95→2.2, opacity .8→0, 2.2s).
  const ping = useRef(new Animated.Value(0)).current;
  // Header dot `animate-ping` (scale 1→2, opacity .75→0, 1s).
  const dot = useRef(new Animated.Value(0)).current;

  const pingScale = ping.interpolate({ inputRange: [0, 1], outputRange: [0.95, 2.2] });
  const pingOpacity = ping.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.8, 0.05, 0] });
  const dotScale = dot.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
  const dotOpacity = dot.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] });

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(ping, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        { resetBeforeIteration: true },
      ),
      Animated.loop(
        Animated.timing(dot, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        { resetBeforeIteration: true },
      ),
    ];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dot, ping]);

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <View
                style={styles.dotAnchor}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
              >
                <View style={styles.dot} />
                <Animated.View
                  style={[styles.dotPing, { opacity: dotOpacity, transform: [{ scale: dotScale }] }]}
                />
              </View>
              <Text style={styles.title}>Nearby on radar</Text>
            </View>
            <Text style={styles.zone}>Kuwait</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Map preview</Text>
          </View>
        </View>

        {/* ---------- Map display (decorative — hidden from screen readers) ---------- */}
        <View
          style={styles.map}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {/* Stylized road vector grid (approved inline SVG, opacity 40%). */}
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 160" opacity={0.4} pointerEvents="none">
            <Path d="M-20 60 Q 150 40 400 80" fill="none" stroke={RADAR.svgRoad} strokeWidth={4} />
            <Path d="M50 0 Q 120 100 200 160" fill="none" stroke={RADAR.svgRoadSoft} strokeWidth={3} />
            <Path d="M220 0 L 260 160" fill="none" stroke={RADAR.svgRoadFaint} strokeWidth={5} />
            <Path d="M-10 120 L 400 110" fill="none" stroke={RADAR.svgRoad} strokeDasharray="6 4" strokeWidth={2} />
            <Circle cx={210} cy={70} r={40} fill="none" stroke={RADAR.svgRing} strokeWidth={1.5} />
          </Svg>

          {/* Gulf waterline indicator (Arabian Gulf coast, bottom-right). */}
          <View style={styles.waterline} />

          {/* Pulsing "Your location" pin (centered). */}
          <View style={styles.pinCenter}>
            <View style={styles.pinAnchor}>
              <Animated.View
                style={[styles.pinPing, { opacity: pingOpacity, transform: [{ scale: pingScale }] }]}
              />
              <View style={styles.pin}>
                <Text style={styles.pinGlyph}>📍</Text>
              </View>
            </View>
            <View style={styles.pinLabel}>
              <Text style={styles.pinLabelText}>Your location</Text>
            </View>
          </View>

          {/* Nearby vehicle chips. */}
          <View style={[styles.chip, styles.chipWinch]}>
            <Text style={styles.chipEmoji}>🛻</Text>
            <Text style={styles.chipText}>Tow</Text>
          </View>
          <View style={[styles.chip, styles.chipBattery]}>
            <Text style={styles.chipEmoji}>🔋</Text>
            <Text style={styles.chipBatteryText}>Battery</Text>
          </View>
        </View>

        {/* ---------- Footer / CTA ---------- */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={styles.footerStrong}>Recovery units</Text> ready
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open the road services map"
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            onPress={() => router.push('/map')}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Explore Map</Text>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="m8.25 4.5 7.5 7.5-7.5 7.5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * Decorative radar-card palette from the approved `approve-ui/home/code.html`
 * (Tailwind classes from that file noted inline). Kept local: these are
 * single-use card colors, not shared semantic tokens, so no theme additions.
 */
const RADAR = {
  navy: '#081C31', // text-brand-navy ("Nearby on radar")
  buttonNavy: '#0B2A4A', // bg-[#0B2A4A] ("Explore Map")
  svgRoad: '#93C5FD', // road + dashed lane stroke
  svgRoadSoft: '#CBD5E1', // secondary road stroke
  svgRoadFaint: '#E2E8F0', // main road stroke
  svgRing: '#BAE6FD', // open ring stroke (sky-200)
  waterline: 'rgba(186, 230, 253, 0.5)', // bg-sky-200/50 split circle
  mapGradientFlat: '#EFF6FF', // flat approx of bg-gradient-to-tr from-sky-100 via-blue-50 to-slate-200 (blue-50 midtone)
  badgeBg: '#EFF6FF', // bg-blue-50
  badgeBorder: '#DBEAFE', // border-blue-100
  badgeText: '#1D4ED8', // text-blue-700
  rosePing: 'rgba(244, 63, 94, 0.6)', // bg-rose-500/60 radar pulse
  rosePin: '#E11D48', // bg-rose-600 pin
  dot: '#10B981', // bg-emerald-500 static dot
  dotPing: 'rgba(52, 211, 153, 0.75)', // animate-ping over bg-emerald-400/75
  batteryText: '#047857', // text-emerald-700
  footerText: '#475569', // text-slate-600
  footerBg: 'rgba(248, 250, 252, 0.7)', // bg-slate-50/70
  white95: 'rgba(255, 255, 255, 0.95)', // bg-white/95 (chips + pin pill)
} as const;

const styles = StyleSheet.create({
  section: {
    // Content area semantics of the approved Home (`main` px-4 + space-y-4).
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  card: {
    // `bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm`.
    backgroundColor: colors.surface,
    borderRadius: 16, // rounded-2xl
    borderWidth: 1,
    borderColor: colors.border, // slate-200
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    // p-3 pb-2 → 12/8.
    padding: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // gap-1.5
  },
  dotAnchor: {
    width: 10, // h-2.5 w-2.5
    height: 10,
    // Space for the 1s ping ring scaling 1→2.
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: RADAR.dot, // bg-emerald-500
  },
  dotPing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: RADAR.dotPing, // bg-emerald-400 opacity-75
  },
  title: {
    fontSize: 12, // text-xs font-bold
    fontWeight: fontWeight.bold,
    color: RADAR.navy,
  },
  zone: {
    marginTop: 2,
    fontSize: 10, // text-[10px]
    color: colors.subtitle, // text-slate-500
  },
  badge: {
    // text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100.
    backgroundColor: RADAR.badgeBg,
    borderWidth: 1,
    borderColor: RADAR.badgeBorder,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: RADAR.badgeText,
    lineHeight: 14,
  },
  map: {
    // h-36 (144) with vertical slate-100 separators.
    height: 144,
    backgroundColor: RADAR.mapGradientFlat,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9', // slate-100
    overflow: 'hidden',
  },
  waterline: {
    // absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-sky-200/50.
    position: 'absolute',
    right: -24,
    bottom: -24,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: RADAR.waterline,
  },
  pinCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinAnchor: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPing: {
    // w-7 h-7 (28) rose pulse, centered under the 24px pin.
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RADAR.rosePing,
  },
  pin: {
    // w-6 h-6 bg-rose-600 rounded-full border-2 border-white shadow-lg.
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RADAR.rosePin,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pinGlyph: {
    fontSize: 12, // text-xs
  },
  pinLabel: {
    // mt-1 bg-white/95 px-2.5 py-0.5 rounded-full shadow border border-slate-100.
    marginTop: spacing.xs,
    backgroundColor: RADAR.white95,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  pinLabelText: {
    fontSize: 10, // text-[10px] font-bold text-slate-800
    fontWeight: fontWeight.bold,
    color: colors.fieldText,
    lineHeight: 14,
  },
  chip: {
    // bg-white/95 px-2 py-0.5 rounded-lg shadow-sm border border-slate-200.
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: RADAR.white95,
    borderRadius: 8, // rounded-lg
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
  },
  chipWinch: {
    top: 24, // top-6
    left: 48, // left-12
  },
  chipBattery: {
    bottom: 20, // bottom-5
    right: 32, // right-8
  },
  chipEmoji: {
    fontSize: 12, // text-xs
  },
  chipText: {
    fontSize: 9, // text-[9px] font-bold text-slate-700
    fontWeight: fontWeight.bold,
    color: colors.fieldLabel,
  },
  chipBatteryText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: RADAR.batteryText, // text-emerald-700
  },
  footer: {
    // p-2.5 bg-slate-50/70.
    padding: 10,
    backgroundColor: RADAR.footerBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footerText: {
    fontSize: 11, // text-[11px] text-slate-600
    color: RADAR.footerText,
  },
  footerStrong: {
    fontWeight: fontWeight.bold,
    color: colors.title, // text-slate-900
  },
  button: {
    // bg-[#0B2A4A] text-[11px] font-bold px-3 py-1.5 rounded-xl.
    backgroundColor: RADAR.buttonNavy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md, // rounded-xl
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.brandText,
  },
});