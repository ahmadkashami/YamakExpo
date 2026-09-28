import { useCallback } from 'react';
import { Dimensions, Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import type { Add } from '@/api';
import { colors, radius } from '@/theme';

/**
 * Legacy carousel geometry, kept exactly as the legacy app computed it: the
 * window is measured once at module load, the card takes 70% of a viewport that
 * is 80pt wider than the screen, and the neighbouring peek on both sides is
 * centred by padding the content by the leftover 30%.
 */
export const SLIDER_WIDTH = Dimensions.get('window').width + 80;
export const ITEM_WIDTH = Math.round(SLIDER_WIDTH * 0.7);

const CARD_HEIGHT = 200;

/** Legacy `isValidHttpUrl`: only http/https targets may be handed to the OS. */
function isOpenableHttpUrl(value: string | null): value is string {
  if (value === null) {
    return false;
  }
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export type AddCardProps = {
  add: Add;
};

export function AddCard({ add }: AddCardProps) {
  const handlePress = useCallback(async () => {
    // `link` is nullable and the backend can ship a non-http value, so both are
    // rejected before the OS is asked to open anything.
    if (!isOpenableHttpUrl(add.link)) {
      return;
    }
    try {
      // Legacy forgot to await this, so its `if (!canOpen) return` guard was
      // testing a Promise (always truthy) and never actually ran.
      const canOpen = await Linking.canOpenURL(add.link);
      if (!canOpen) {
        return;
      }
      await Linking.openURL(add.link);
    } catch {
      // Nothing is surfaced: legacy also failed silently. No URL is logged.
    }
  }, [add.link]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={add.title}
      onPress={() => {
        void handlePress();
      }}
      style={styles.container}
    >
      <Image source={{ uri: add.photo }} resizeMode="stretch" style={styles.image} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    // Legacy `AppColorsTheme2.primary200` (#E0EDF3); no theme token matches it
    // exactly, so `colors.border` (#E2E8F0) is the nearest neutral.
    backgroundColor: colors.border,
    borderRadius: radius.heroPlate,
    overflow: 'hidden',
    width: ITEM_WIDTH,
    height: CARD_HEIGHT,
    // Legacy `paddingBottom: 40` on a 200pt-tall container with a 200pt image
    // deliberately pushes the image out of view and clips it, so the card shows
    // the top portion of a stretched image. Preserved rather than "fixed".
    paddingBottom: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
  },
  image: {
    width: ITEM_WIDTH,
    height: CARD_HEIGHT,
  },
});
