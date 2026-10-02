import { FlatList, Image, Pressable, StyleSheet, Text } from 'react-native';

import type { Service } from '@/api';
import { colors, interactionOpacity } from '@/theme';

/**
 * Approved Map service chips (`approve-ui/map`): 64 px circles with a 3 px
 * amber border, a logo icon, and the real EN + AR names on SEPARATE lines
 * (never concatenated — each line renders inside its own direction). Selected
 * chips get the product Gold fill. All content is real `Service` data; when
 * `logo` is null a safe emoji glyph is shown (no new assets).
 */
const CHIP_DIAMETER = 64;
const CHIP_BORDER_WIDTH = 3;

export type MapServiceChipsProps = {
  services: Service[];
  selectedServiceId: number | null;
  onSelect: (service: Service) => void;
};

export function MapServiceChips({
  services,
  selectedServiceId,
  onSelect,
}: MapServiceChipsProps) {
  return (
    <FlatList
      data={services}
      horizontal
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => {
        const isSelected = item.id === selectedServiceId;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${item.name.en} — ${item.name.ar}`}
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
          >
            {item.logo === null ? (
              <Text style={styles.logoFallback}>🛠️</Text>
            ) : (
              <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="contain" />
            )}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={[styles.labelEn, isSelected && styles.labelSelected]}
            >
              {item.name.en}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.labelAr, isSelected && styles.labelSelected]}
            >
              {item.name.ar}
            </Text>
          </Pressable>
        );
      }}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  chip: {
    width: CHIP_DIAMETER,
    height: CHIP_DIAMETER,
    borderRadius: CHIP_DIAMETER / 2,
    borderWidth: CHIP_BORDER_WIDTH,
    borderColor: colors.amber,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginHorizontal: 5,
    overflow: 'hidden',
  },
  chipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  pressed: {
    opacity: interactionOpacity.pressed,
  },
  logo: {
    width: 20,
    height: 20,
    marginBottom: 1,
  },
  logoFallback: {
    fontSize: 18,
    lineHeight: 20,
    marginBottom: 1,
  },
  labelEn: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.title,
    marginTop: 2,
  },
  labelAr: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.amber,
    marginTop: 1,
  },
  labelSelected: {
    color: colors.surface,
  },
});