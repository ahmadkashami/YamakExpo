import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MyCar } from '@/api';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { BackIcon } from '@/components/vehicle-details/icons';
import { useMyCars } from '@/hooks/use-my-cars';
import { colors, interactionOpacity, radius, spacing, typography } from '@/theme';

function MyCarCard({ car }: { car: MyCar }) {
  const make = car.make?.trim() || 'Not provided';
  const model = car.model?.trim() || 'Not provided';
  const year = car.year?.trim() || 'Not provided';

  return (
    <View
      accessible
      accessibilityLabel={`Make: ${make}, Model: ${model}, Year: ${year}, Type: ${car.type}, Status: ${car.status}`}
      style={styles.card}
    >
      <Text style={styles.field}>Make: {make}</Text>
      <Text style={styles.field}>Model: {model}</Text>
      <Text style={styles.field}>Year: {year}</Text>
      <Text style={styles.field}>Type: {car.type}</Text>
      <Text style={styles.field}>Status: {car.status}</Text>
    </View>
  );
}

export default function MyCarsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cars, isLoading, isRefreshing, error, isEmpty, refresh, retry } = useMyCars();

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  }, [router]);

  return (
    <View style={styles.screen}>
      <View style={[styles.appBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <BackIcon color={colors.subtitle} size={22} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>My Cars</Text>
        <View style={styles.iconButton} />
      </View>

      <FlatList
        data={cars}
        keyExtractor={car => String(car.id)}
        renderItem={({ item }) => <MyCarCard car={item} />}
        refreshing={isRefreshing}
        onRefresh={refresh}
        alwaysBounceVertical
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        ListHeaderComponent={error === null ? null : (
          <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.noticeTitle}>
              {error.status === 401
                ? 'Session expired'
                : error.status === 403
                  ? 'Not authorized'
                  : 'Cars could not be loaded'}
            </Text>
            <ApiErrorRow message={error.message} onRetry={retry} />
          </View>
        )}
        ListEmptyComponent={isLoading || isRefreshing ? (
          <View style={styles.stateBox} accessibilityRole="text" accessibilityLabel="Loading cars">
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading cars…</Text>
          </View>
        ) : isEmpty ? (
          <View style={styles.stateBox}>
            <Text style={styles.noticeTitle}>No cars yet</Text>
            <Text style={styles.stateText}>Your saved cars will appear here.</Text>
          </View>
        ) : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.phonePrefix,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: interactionOpacity.pressed,
  },
  title: {
    ...typography.subtitle,
    flex: 1,
    textAlign: 'center',
    color: colors.title,
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  field: {
    ...typography.body,
    color: colors.title,
  },
  errorBox: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  noticeTitle: {
    ...typography.subtitle,
    color: colors.title,
  },
  stateBox: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  stateText: {
    ...typography.body,
    color: colors.subtitle,
    textAlign: 'center',
  },
});
