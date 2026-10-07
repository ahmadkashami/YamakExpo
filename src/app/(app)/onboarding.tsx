import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOnboarding } from '@/onboarding';
import { colors, fontWeight, interactionOpacity, radius, spacing, typography } from '@/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Slide content width: full screen minus the shared side padding (spec §4). */
const CONTENT_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

/** Ratio-based image plate height (spec §4/§7): shrinks on small screens, caps at 300. */
const PLATE_HEIGHT = Math.min(300, Math.round(SCREEN_HEIGHT * 0.34));

/** Progress dots (spec §8): 8dp idle, 24×8 active pill; scrollable row beyond this many slides. */
const MAX_INLINE_DOTS = 9;
/** ≈ active dot width (24) + margins (2×3) — used only for the auto-scroll math. */
const DOTS_STEP = 30;

/**
 * Remote slide image (spec §7/§14). Missing, empty or failed URLs degrade to a
 * branded navy YAMAK plate; while a valid URL is downloading, the white framed
 * plate shows a lightweight spinner (no blank flash, no layout jump).
 */
function SlideImage({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  const safeUrl = imageUrl?.trim() ?? '';
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'failed'>(
    safeUrl.length === 0 ? 'failed' : 'loading',
  );

  if (safeUrl.length === 0 || imageState === 'failed') {
    return (
      <View
        style={styles.imageFallback}
        accessible={false}
        importantForAccessibility="no-hide-descendants">
        <Text style={styles.imageFallbackText}>YAMAK</Text>
      </View>
    );
  }

  return (
    <View
      style={styles.imagePlate}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      {imageState === 'loading' ? <ActivityIndicator color={colors.subtitle} /> : null}
      <Image
        source={{ uri: safeUrl }}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel={title}
        onLoad={() => setImageState('ready')}
        onError={() => setImageState('failed')}
      />
    </View>
  );
}

/**
 * Progress dots (spec §8). Idle = 8dp circle, active = 24×8 navy pill. When the
 * slide count exceeds MAX_INLINE_DOTS the row becomes a horizontal ScrollView
 * that auto-scrolls the active dot into view — no pager/progress dependency.
 * The whole row is hidden from the screen reader; the "Slide n of N" announcement
 * lives on a separate live region in the footer (spec §16).
 */
function ProgressDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollable = count > MAX_INLINE_DOTS;

  const dots = useMemo(() => Array.from({ length: count }, (_, index) => index), [count]);

  useEffect(() => {
    if (!scrollable) return;
    const target = Math.max(
      0,
      activeIndex * DOTS_STEP - (CONTENT_WIDTH - DOTS_STEP) / 2,
    );
    scrollRef.current?.scrollTo({ x: target, animated: true });
  }, [activeIndex, scrollable]);

  const dotRow = dots.map((index) => (
    <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
  ));

  if (!scrollable) {
    return (
      <View
        style={styles.dotsRow}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {dotRow}
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.dotsScroll}
      contentContainerStyle={[styles.dotsRow, styles.dotsScrollContent]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {dotRow}
    </ScrollView>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, config, completeOnboarding } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const pagerRef = useRef<ScrollView>(null);

  // Defensive sort by `order` (A6.2E) even though the backend already orders.
  const slides = [...(config?.slides ?? [])].sort((a, b) => a.order - b.order);
  const isSkippable = config?.skippable === true;
  const isLastSlide = currentIndex >= slides.length - 1;
  const canSkip = isSkippable && !isLastSlide;

  /**
   * Single completion path for BOTH Skip and Get Started (A6.2E spec §18).
   * `completeOnboarding` persists the seen version BEFORE resolving; only then
   * do we navigate — a write failure keeps us here and re-enables the actions.
   */
  const handleComplete = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await completeOnboarding();
      router.replace('/home' as never);
    } catch {
      setIsCompleting(false);
    }
  }, [completeOnboarding, isCompleting, router]);

  const handleNext = useCallback(() => {
    if (slides.length === 0 || isCompleting) return;
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      pagerRef.current?.scrollTo({ x: next * CONTENT_WIDTH, animated: true });
    } else {
      handleComplete();
    }
  }, [currentIndex, handleComplete, isCompleting, slides.length]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handleScroll = useCallback((event: { nativeEvent: { layoutMeasurement: { width: number }; contentOffset: { x: number } } }) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    setCurrentIndex(Math.round(offset / slideSize));
  }, []);

  // Neutral transient guard while the gate (res)olves the decision (spec §15).
  if (status !== 'required' || slides.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={colors.subtitle} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        styles.contentPadding,
        { paddingTop: Math.max(insets.top, spacing.md) },
      ]}>
      {/* Subtle brand mark (spec §5 — option A). Same pattern as AuthBrandHeader,
          re-keyed for the light background. Never a hero. */}
      <View style={styles.brandRow}>
        <Text style={styles.brandName}>YAMAK</Text>
        <Text style={styles.brandDivider}>·</Text>
        <Text style={styles.brandNameArabic}>يمك</Text>
      </View>

      {/* Horizontal pager (unchanged mechanism). Each slide = image plate (fixed,
          ratio-based) + vertically scrollable text region (spec §4/§11). */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}>
        {slides.map((slide) => {
          // Backend description is nullable → normalize BEFORE any render (spec §13).
          const description = slide.description?.trim() ?? '';
          return (
            <View key={slide.id} style={[styles.slide, { width: CONTENT_WIDTH }]}>
              <SlideImage imageUrl={slide.imageUrl} title={slide.title} />
              <ScrollView
                style={styles.textRegion}
                contentContainerStyle={styles.textRegionContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>{slide.title}</Text>
                {description.length > 0 ? (
                  <Text style={styles.description}>{description}</Text>
                ) : null}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* Fixed footer: live a11y page counter + progress + actions + bottom inset.
          Never moves while slide content changes (spec §4/§16). */}
      <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>
        <View style={styles.liveRegion} accessibilityLiveRegion="polite">
          <Text style={styles.liveRegionText}>
            {`Slide ${currentIndex + 1} of ${slides.length}`}
          </Text>
        </View>

        <ProgressDots count={slides.length} activeIndex={currentIndex} />

        <View style={styles.actionsRow}>
          {isLastSlide ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isCompleting, busy: isCompleting }}
              disabled={isCompleting}
              onPress={handleComplete}
              style={({ pressed }) => [
                styles.ctaButton,
                styles.ctaFullWidth,
                pressed && styles.ctaPressed,
              ]}>
              <Text style={styles.ctaLabel}>
                {isCompleting ? 'Loading…' : 'Get Started'}
              </Text>
            </Pressable>
          ) : (
            <>
              {canSkip ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isCompleting }}
                  disabled={isCompleting}
                  onPress={handleSkip}
                  style={({ pressed }) => [
                    styles.skipButton,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isCompleting }}
                disabled={isCompleting}
                onPress={handleNext}
                style={({ pressed }) => [
                  styles.ctaButton,
                  !canSkip && styles.ctaFullWidth,
                  pressed && styles.ctaPressed,
                ]}>
                <Text style={styles.ctaLabel}>Next</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.phonePrefix, // approved light editorial surface (spec §5)
  },
  contentPadding: {
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  brandName: {
    color: colors.navyDeep,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  brandDivider: {
    color: colors.wordmark,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  brandNameArabic: {
    color: colors.wordmark,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
    writingDirection: 'rtl',
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  // Framed white plate while loading/downloading (spec §7: radius.lg, hairline).
  imagePlate: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    height: PLATE_HEIGHT,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageFallback: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    height: PLATE_HEIGHT,
    borderRadius: radius.lg,
    backgroundColor: colors.navyDeep, // approved navy fallback plate (spec §7/§14)
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: colors.brandText,
    fontSize: 28,
    fontWeight: fontWeight.black,
    letterSpacing: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Vertically scrollable text region (spec §11/§13): long copy scrolls, the
  // footer stays pinned; short copy centers inside the region.
  textRegion: {
    flex: 1,
    alignSelf: 'stretch',
  },
  textRegionContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: fontWeight.bold,
    color: colors.title,
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: fontWeight.regular,
    color: colors.subtitle,
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.lg,
    position: 'relative',
  },
  // Visually hidden screen-reader page counter (spec §16). Not color/shape-only:
  // the counter is the non-visual guarantee for progress semantics.
  liveRegion: {
    position: 'absolute',
    left: -10000,
    top: 0,
    opacity: 0,
  },
  liveRegionText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.title,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dotsScrollContent: {
    // Mirrors horizontal centering inside the scrollable row (spec §8).
    paddingHorizontal: CONTENT_WIDTH / 2,
  },
  dotsScroll: {
    flexGrow: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.navyDeep,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  skipButton: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
    color: colors.subtitle,
  },
  buttonPressed: {
    opacity: interactionOpacity.pressed,
  },
  // ONE primary button system (spec §9): Vehicle-Details/approved navy CTA.
  ctaButton: {
    backgroundColor: colors.navyDeep,
    borderRadius: radius.md,
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    backgroundColor: colors.navyDeepDark,
  },
  ctaFullWidth: {
    flex: 1,
  },
  ctaLabel: {
    ...typography.buttonLabel,
    color: colors.brandText,
  },
});