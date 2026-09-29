import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import type { Service, ServiceLanguage } from '@/api';
import { colors, interactionOpacity, typography } from '@/theme';

/**
 * Legacy Map chip shape (80×80 circle, 4pt border, active fills gold with white
 * text) reproduced with new-ui tokens. The prototype does not specify chips, so
 * this keeps the verified legacy chip *intent* without copying its styling
 * defects (it was fine; the surrounding Map code was what was broken).
 */
const CHIP_DIAMETER = 80;
const CHIP_BORDER_WIDTH = 4;

export type MapServiceChipsProps = {
  services: Service[];
  selectedServiceId: number | null;
  onSelect: (service: Service) => void;
  language?: ServiceLanguage;
};

export function MapServiceChips({
  services,
  selectedServiceId,
  onSelect,
  language = 'en',
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
            accessibilityLabel={item.name.en}
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              numberOfLines={2}
              style={[styles.label, isSelected && styles.labelSelected]}
            >
              {item.name[language]}
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
    borderColor: colors.gold,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  chipSelected: {
    backgroundColor: colors.gold,
  },
  pressed: {
    opacity: interactionOpacity.pressed,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
    paddingHorizontal: 4,
    color: colors.title,
  },
  labelSelected: {
    color: colors.surface,
  },
});