import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Service, ServiceLanguage } from '@/api';
import { colors, interactionOpacity, spacing, typography } from '@/theme';

const LOGO_PLATE_SIZE = 80;
const LOGO_IMAGE_SIZE = 60;

export type ServiceItemProps = {
  service: Service;
  /** Legacy resolved the label as `name[i18n.language]`. i18n is not built yet,
   *  so the language is an explicit prop and defaults to English. */
  language: ServiceLanguage;
  isSelected: boolean;
  onPress: (service: Service) => void;
};

export function ServiceItem({ service, language, isSelected, onPress }: ServiceItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(service)}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        isSelected && styles.selected,
      ]}
    >
      <View style={styles.logoPlate}>
        {service.logo === null ? null : (
          <Image source={{ uri: service.logo }} style={styles.logo} resizeMode="contain" />
        )}
      </View>
      <Text numberOfLines={1} style={styles.label}>
        {service.name[language]}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  pressed: {
    opacity: interactionOpacity.pressed,
  },
  selected: {
    borderBottomWidth: 2,
    borderColor: colors.gold,
  },
  logoPlate: {
    width: LOGO_PLATE_SIZE,
    height: LOGO_PLATE_SIZE,
    borderRadius: LOGO_PLATE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    overflow: 'hidden',
  },
  logo: {
    width: LOGO_IMAGE_SIZE,
    height: LOGO_IMAGE_SIZE,
  },
  label: {
    ...typography.body,
    marginVertical: spacing.xs,
    color: colors.title,
  },
});
