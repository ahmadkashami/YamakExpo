import { useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useOnboarding } from '@/onboarding';
import { colors, fontWeight, radius, spacing } from '@/theme';

const { width } = Dimensions.get('window');

/**
 * Remote slide image (spec §14). `imageUrl` is a Cloudinary URI; missing or
 * failing images degrade to a YAMAK placeholder — the screen never crashes on
 * a bad remote image (spec §18).
 */
function SlideImage({ imageUrl }: { imageUrl: string | null }) {
  const [failed, setFailed] = useState(false);

  if (imageUrl === null || imageUrl.trim().length === 0 || failed) {
    return (
      <View style={styles.imageFallback}>
        <Text style={styles.imageFallbackText}>YAMAK</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.image}
      resizeMode="contain"
      accessibilityLabel="Onboarding illustration"
      onError={() => setFailed(true)}
    />
  );
}

function Dot({ active }: { active: boolean }) {
  return <View style={[styles.dot, active && styles.dotActive]} />;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { status, config, completeOnboarding } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Defensive sort by `order` (spec §13) even though the backend already orders.
  const slides = [...(config?.slides ?? [])].sort((a, b) => a.order - b.order);
  const isSkippable = config?.skippable === true;
  const isLastSlide = currentIndex >= slides.length - 1;

  /**
   * Single completion path for BOTH Skip and Get Started (spec §18).
   * `completeOnboarding` persists the seen version BEFORE resolving; only then
   * do we navigate — a write failure keeps us on onboarding and re-enables the
   * buttons so the user can retry (spec §17/§19).
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
      setCurrentIndex(currentIndex + 1);
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
    const index = Math.round(offset / slideSize);
    setCurrentIndex(index);
  }, []);

  // The gate redirects this screen away once the decision is made; this guard
  // only covers the brief transition while config is (re)resolved.
  if (status !== 'required' || slides.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}>
        {slides.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <View style={styles.imageContainer}>
              <SlideImage imageUrl={slide.imageUrl} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              {slide.description.length > 0 ? (
                <Text style={styles.description}>{slide.description}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <Dot key={String(index)} active={index === currentIndex} />
          ))}
        </View>

        <View style={styles.buttonsContainer}>
          {!isLastSlide ? (
            <>
              {isSkippable ? (
                <Pressable
                  onPress={handleSkip}
                  style={({ pressed }) => [styles.skipButton, pressed && styles.buttonPressed]}
                  disabled={isCompleting}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </Pressable>
              ) : (
                <View style={styles.skipButtonSpacer} />
              )}
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [styles.nextButton, pressed && styles.buttonPressed]}
                disabled={isCompleting}>
                <Text style={styles.nextButtonText}>Next</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleComplete}
              style={({ pressed }) => [styles.getStartedButton, pressed && styles.buttonPressed]}
              disabled={isCompleting}>
              <Text style={styles.getStartedButtonText}>
                {isCompleting ? 'Loading...' : 'Get Started'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingText: {
    marginTop: '50%',
    textAlign: 'center',
    fontSize: 16,
    color: colors.subtitle,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.xl,
  },
  image: {
    width: '90%',
    height: '90%',
    maxWidth: 400,
    maxHeight: 400,
  },
  imageFallback: {
    width: '90%',
    height: '90%',
    maxWidth: 400,
    maxHeight: 400,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  imageFallbackText: {
    color: colors.surface,
    fontSize: 40,
    fontWeight: fontWeight.black,
    letterSpacing: 4,
  },
  titleContainer: {
    paddingBottom: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    color: colors.title,
    textAlign: 'center',
    lineHeight: 32,
  },
  description: {
    marginTop: spacing.sm,
    fontSize: 15,
    fontWeight: fontWeight.regular,
    color: colors.subtitle,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skipButtonSpacer: {
    width: 60,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: fontWeight.medium,
    color: colors.subtitle,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
  getStartedButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    flex: 1,
    alignItems: 'center',
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    color: colors.surface,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});