import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { DriverResource } from '@/api';
import { colors } from '@/theme';

/**
 * Fallback initials avatar (approved provider avatar `bg-yamakNavy` with the
 * faint `ring-yamakGold/30` ring). Photo → initials on load failure, and a
 * generic `?` when the driver has no usable name.
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) {
    return '?';
  }
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase() || '?';
}

export type DriverAvatarProps = {
  driver: DriverResource;
  size?: number;
};

export function DriverAvatar({ driver, size = 48 }: DriverAvatarProps) {
  const hasPhoto = driver.photo !== null && driver.photo !== '';
  const [showPhoto, setShowPhoto] = useState(hasPhoto);

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      {showPhoto ? (
        <Image
          accessible={false}
          accessibilityIgnoresInvertColors
          style={styles.photo}
          source={{ uri: driver.photo ?? undefined }}
          onError={() => setShowPhoto(false)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.4) }]}>
          {initialsOf(driver.name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Approved ring: `ring-yamakGold/30` → gold at 30% alpha around the navy disc.
  circle: {
    backgroundColor: colors.navyDeep,
    borderWidth: 2,
    borderColor: 'rgba(233, 163, 25, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
  initials: {
    fontWeight: '700',
    color: colors.brandText,
  },
});