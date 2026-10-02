import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

/**
 * Approved Map micro-banner (`approve-ui/map`): a compact `bg-white/95` pill
 * over the map with an emerald live dot and the EXACT approved facilitator
 * copy. Static product/business information — no API. The wrapper is
 * `pointerEvents="none"` so the pill never blocks map pan/zoom beneath it.
 */
export function MicroBanner() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.pill}>
        <View style={styles.dot} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={styles.text}
        >
          <Text style={styles.brand}>Yamak:</Text>
          {' 100% Free Facilitator • No Commission • Pay Driver Directly'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: spacing.sm,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.8)', // approve-ui `border-amber-200/80`
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: colors.success,
  },
  text: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.navyDeep,
  },
  brand: {
    fontWeight: '800',
    color: colors.wordmark,
  },
});