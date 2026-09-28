import { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

import type { Add } from '@/api';
import { AddCard, ITEM_WIDTH, SLIDER_WIDTH } from '@/components/home/AddCard';

const AUTOPLAY_DELAY = 5000;
const AUTOPLAY_INTERVAL = 3000;

export type AddsCarouselProps = {
  adds: Add[];
};

/**
 * Snapping horizontal carousel rebuilt on a plain `FlatList`. Every prop below
 * comes from the legacy `CarouselCards`; no carousel dependency is needed to
 * reproduce the behaviour.
 */
export function AddsCarousel({ adds }: AddsCarouselProps) {
  const listRef = useRef<FlatList<Add>>(null);
  const activeIndex = useRef(0);

  useEffect(() => {
    // A single add is not worth autoplaying, and it is also why the legacy
    // effect bailed out before touching `data.length - 1`.
    if (adds.length < 2) {
      return;
    }

    activeIndex.current = Math.min(activeIndex.current, adds.length - 1);

    let autoplayInterval: ReturnType<typeof setInterval> | undefined;
    const autoplayDelay = setTimeout(() => {
      autoplayInterval = setInterval(() => {
        activeIndex.current = (activeIndex.current + 1) % adds.length;
        listRef.current?.scrollToIndex({ animated: true, index: activeIndex.current });
      }, AUTOPLAY_INTERVAL);
    }, AUTOPLAY_DELAY);

    return () => {
      clearTimeout(autoplayDelay);
      if (autoplayInterval !== undefined) {
        clearInterval(autoplayInterval);
      }
    };
  }, [adds.length]);

  // Keeps autoplay resuming from wherever the user left the carousel.
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      activeIndex.current = Math.min(
        adds.length - 1,
        Math.round(Math.abs(event.nativeEvent.contentOffset.x) / ITEM_WIDTH),
      );
    },
    [adds.length],
  );

  const renderItem = useCallback(
    ({ item }: { item: Add }) => <AddCard add={item} />,
    [],
  );

  return (
    <View style={styles.viewport}>
      <FlatList
        ref={listRef}
        data={adds}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        decelerationRate="fast"
        disableIntervalMomentum
        snapToInterval={ITEM_WIDTH}
        getItemLayout={(_, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Pulled left so the 70%-wide first card lands centred in the viewport.
  viewport: {
    marginLeft: -80,
  },
  content: {
    paddingHorizontal: (SLIDER_WIDTH - ITEM_WIDTH) / 2,
  },
});
