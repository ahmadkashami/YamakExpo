import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MyRequestListItem } from '@/api';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { BackIcon } from '@/components/vehicle-details/icons';
import { useMyRequests } from '@/hooks/use-my-requests';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * B3.4 MY REQUESTS — functional list using the B3.3 read hook only.
 *
 * This route is a direct child of `(app)`, so the existing auth/onboarding gate
 * in `(app)/_layout.tsx` protects it. It is deliberately outside `(drawer)` and
 * `(tabs)` (same shape as `/vehicles`): it owns a simple app bar instead of the
 * tab/drawer frame.
 *
 * Data authority: `useMyRequests()` (`GET /api/mobile/v1/requests`). This screen
 * owns NO fetch, cache, pagination state or detail navigation. It renders only
 * the B3.3 list allowlist: id, channel, status, createdAt, vehicle summary and
 * services summary. No coordinates, phone numbers, actor ids, reasons or admin
 * fields are requested or displayed. Request Details (B3.5) is NOT implemented.
 */

const CHANNEL_LABELS: Record<string, string> = {
  app: 'App',
  whatsapp: 'WhatsApp',
  phone: 'Phone',
};

/** Approved REQ-DEC-009 vocabulary. Unknown values fall back to raw data. */
const STATUS_LABELS: Record<string, string> = {
  contact_initiated: 'Contact initiated',
  pending: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  not_completed: 'Not completed',
  cancelled: 'Cancelled',
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function labelFor(value: string, labels: Record<string, string>): string {
  return labels[value] ?? value.replace(/_/g, ' ');
}

/**
 * Backend `createdAt` uses `optional()->toJSON()` with microseconds, e.g.
 * `2026-11-18T09:12:33.000000Z`. Normalise to a Date-parsable UTC string before
 * formatting instead of assuming strict ISO-8601 parsing.
 */
function formatCreatedAt(value: string | null): string {
  if (value === null || value.length === 0) {
    return '—';
  }

  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ? `${value.slice(0, 19)}Z`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = MONTHS[date.getUTCMonth()] ?? '';
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
}

function vehicleSummary(item: MyRequestListItem): string {
  const summary = item.vehicle_summary;
  const parts = [summary?.labelNumber, summary?.modelName].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  );
  return parts.length > 0 ? parts.join(' · ') : 'Vehicle unavailable';
}

function servicesSummary(item: MyRequestListItem): string {
  const names = item.services_summary.map(
    (service) => service.name?.en || service.name?.ar || `Service #${service.id}`,
  );
  return names.length > 0 ? names.join(', ') : 'No services listed';
}

/**
 * B3.3 decision B3.3-001 kept `provider_name` out of the LIST resource, so the
 * typed `MyRequestListItem` does not contain it. Render it only if a future
 * allowlist adds it at runtime; never call the detail hook to obtain it here.
 */
function providerName(item: MyRequestListItem): string | null {
  const candidate = item as MyRequestListItem & { provider_name?: unknown };
  const value = candidate.provider_name;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function MyRequestCard({ item }: { item: MyRequestListItem }) {
  const provider = providerName(item);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.requestId}>Request #{item.id}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{labelFor(item.status, STATUS_LABELS)}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Channel</Text>
          <Text style={styles.metaValue}>{labelFor(item.channel, CHANNEL_LABELS)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Created</Text>
          <Text style={styles.metaValue}>{formatCreatedAt(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Vehicle</Text>
        <Text style={styles.detailValue}>{vehicleSummary(item)}</Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Services</Text>
        <Text style={styles.detailValue}>{servicesSummary(item)}</Text>
      </View>

      {provider === null ? null : (
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Provider</Text>
          <Text style={styles.detailValue}>{provider}</Text>
        </View>
      )}
    </View>
  );
}

export default function MyRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    items,
    metaData,
    page,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    setPage,
    refresh,
    retry,
  } = useMyRequests();

  // One page transition at a time. The hook already discards stale responses by
  // request id; this guard additionally prevents duplicate/skipped page loads
  // from rapid taps before the hook's loading flag reaches this component.
  const pageChangeInFlightRef = useRef(false);

  useEffect(() => {
    if (pageChangeInFlightRef.current && !isLoading && !isRefreshing) {
      pageChangeInFlightRef.current = false;
    }
  }, [isLoading, isRefreshing]);

  const goToPage = useCallback(
    (next: number) => {
      if (pageChangeInFlightRef.current || isLoading || isRefreshing) {
        return;
      }
      const lastPage = metaData?.lastPage ?? 1;
      if (next < 1 || next > lastPage || next === page) {
        return;
      }
      pageChangeInFlightRef.current = true;
      setPage(next);
    },
    [isLoading, isRefreshing, metaData?.lastPage, page, setPage],
  );

  const handleRefresh = useCallback(() => {
    if (pageChangeInFlightRef.current || isLoading || isRefreshing) {
      return;
    }
    refresh();
  }, [isLoading, isRefreshing, refresh]);

  const handleRetry = useCallback(() => {
    if (pageChangeInFlightRef.current || isLoading || isRefreshing) {
      return;
    }
    retry();
  }, [isLoading, isRefreshing, retry]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }, [router]);

  const listExtraData = useMemo(
    () => ({ page, isLoading, isRefreshing, error }),
    [page, isLoading, isRefreshing, error],
  );

  const listEmptyComponent = useMemo(() => {
    if ((isLoading || isRefreshing) && items.length === 0) {
      return (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Loading requests…</Text>
        </View>
      );
    }
    if (error !== null && items.length === 0) {
      return (
        <View style={styles.stateBox}>
          <ApiErrorRow message={error.message} onRetry={handleRetry} />
        </View>
      );
    }
    if (!isLoading && !isRefreshing && error === null && items.length === 0) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.stateText}>Requests you create will appear here.</Text>
        </View>
      );
    }
    return null;
  }, [error, handleRetry, isLoading, isRefreshing, items.length]);

  const listFooterComponent = useMemo(() => {
    if (isLoading && items.length > 0) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (items.length === 0) {
      return null;
    }

    const lastPage = metaData?.lastPage ?? 1;
    const canGoPrevious = page > 1;
    const canGoNext = hasMore && page < lastPage;
    const controlsDisabled = isLoading || isRefreshing;

    return (
      <View style={styles.pagination}>
        <Text style={styles.pageLabel}>
          {`Page ${page} of ${lastPage}`}
        </Text>
        <View style={styles.pageButtons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous page"
            disabled={!canGoPrevious || controlsDisabled}
            onPress={() => goToPage(page - 1)}
            style={({ pressed }) => [
              styles.pageButton,
              (!canGoPrevious || controlsDisabled) && styles.pageButtonDisabled,
              pressed && canGoPrevious && !controlsDisabled && styles.pageButtonPressed,
            ]}
          >
            <Text style={styles.pageButtonLabel}>Previous</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next page"
            disabled={!canGoNext || controlsDisabled}
            onPress={() => goToPage(page + 1)}
            style={({ pressed }) => [
              styles.pageButton,
              (!canGoNext || controlsDisabled) && styles.pageButtonDisabled,
              pressed && canGoNext && !controlsDisabled && styles.pageButtonPressed,
            ]}
          >
            <Text style={styles.pageButtonLabel}>Next</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [goToPage, hasMore, isLoading, isRefreshing, items.length, metaData?.lastPage, page]);

  const totalCount = metaData?.totalCount;

  return (
    <View style={styles.screen}>
      <View style={[styles.appBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={goBack}
          style={styles.iconButton}
        >
          <BackIcon color={colors.subtitle} size={22} />
        </Pressable>
        <View style={styles.barCenter}>
          <Text numberOfLines={1} style={styles.appBarTitle}>
            My Requests
          </Text>
          {totalCount === undefined ? null : (
            <Text numberOfLines={1} style={styles.appBarCount}>
              {`${totalCount} ${totalCount === 1 ? 'request' : 'requests'}`}
            </Text>
          )}
        </View>
        <View style={styles.iconButton} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <MyRequestCard item={item} />}
        extraData={listExtraData}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        ItemSeparatorComponent={RequestSeparator}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function RequestSeparator() {
  return <View style={styles.separator} />;
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
    minHeight: 52,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.title,
  },
  appBarCount: {
    ...typography.caption,
    color: colors.subtitle,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  requestId: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
  },
  statusPill: {
    backgroundColor: colors.goldTint,
    borderColor: colors.goldTintBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    ...typography.label,
    color: colors.navyDeep,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  metaItem: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  metaLabel: {
    ...typography.label,
    color: colors.subtitle,
    marginBottom: spacing.xs,
  },
  metaValue: {
    ...typography.body,
    color: colors.fieldText,
  },
  detailBlock: {
    marginTop: spacing.sm,
  },
  detailLabel: {
    ...typography.label,
    color: colors.subtitle,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.body,
    color: colors.fieldText,
  },
  stateBox: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '600',
    textAlign: 'center',
  },
  stateText: {
    ...typography.caption,
    color: colors.subtitle,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  pagination: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  pageLabel: {
    ...typography.caption,
    color: colors.subtitle,
  },
  pageButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pageButton: {
    minWidth: 100,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pageButtonPressed: {
    opacity: 0.6,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonLabel: {
    ...typography.label,
    color: colors.title,
  },
});
