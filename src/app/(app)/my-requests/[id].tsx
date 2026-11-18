import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import type { MyRequestDetail, MyRequestTimelineEntry } from '@/api';
import { useAuth } from '@/auth';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { BackIcon } from '@/components/vehicle-details/icons';
import { useMyRequestDetails } from '@/hooks/use-my-requests';
import { colors, radius, spacing, typography } from '@/theme';
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  formatCreatedAt,
  labelFor,
  serviceNames,
  vehicleSummary,
} from '@/utils/my-request-display';

/**
 * B3.5 MY REQUEST DETAILS — functional customer read-only screen.
 *
 * Directly under `(app)`, so the existing auth/onboarding gate protects the
 * route. All data comes from the B3.3 `useMyRequestDetails()` hook: no endpoint,
 * hook, type, auth logic or networking is duplicated here. The hook's request
 * token and in-flight guard already ignore stale ID changes and overlapping
 * duplicate loads.
 *
 * Only the approved `MyRequestDetail` allowlist is read and rendered. Internal
 * actor/reason/transition/admin fields are not referenced, and phone numbers
 * are plain text — no dialer or WhatsApp handoff is started.
 */

function parseRequestId(value: string | string[] | undefined): number | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== 'string') {
    return null;
  }
  const trimmed = candidate.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function present(value: string | null | undefined, fallback = 'Not provided'): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function savedCoordinates(detail: MyRequestDetail): string {
  const coords = detail.owner_coords;
  if (
    coords === null ||
    typeof coords.latitude !== 'number' ||
    typeof coords.longitude !== 'number' ||
    !Number.isFinite(coords.latitude) ||
    !Number.isFinite(coords.longitude)
  ) {
    return 'Location not available';
  }
  return `${coords.latitude}, ${coords.longitude}`;
}

function AppBar({
  insets,
  subtitle,
  onBack,
}: {
  insets: EdgeInsets;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <View style={[styles.appBar, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={onBack}
        style={styles.iconButton}
      >
        <BackIcon color={colors.subtitle} size={22} />
      </Pressable>
      <View style={styles.barCenter}>
        <Text numberOfLines={1} style={styles.appBarTitle}>
          Request details
        </Text>
        {subtitle === undefined ? null : (
          <Text numberOfLines={1} style={styles.appBarSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.iconButton} />
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StateCard({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.stateWrap}>
      <View style={styles.stateCard}>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateMessage}>{message}</Text>
        {children}
      </View>
    </View>
  );
}

function TimelineList({ entries }: { entries: MyRequestTimelineEntry[] }) {
  if (entries.length === 0) {
    return <Text style={styles.emptyLine}>No timeline available</Text>;
  }

  return (
    <View style={styles.timeline}>
      {entries.map((entry, index) => (
        <View
          key={`${entry.toStatus}-${entry.createdAt ?? 'no-date'}-${index}`}
          style={styles.timelineRow}
        >
          <View style={styles.timelineDot} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineStatus}>{labelFor(entry.toStatus, STATUS_LABELS)}</Text>
            <Text style={styles.timelineDate}>{formatCreatedAt(entry.createdAt)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function DetailContent({ detail }: { detail: MyRequestDetail }) {
  const names = serviceNames(detail);
  const vehicle = detail.vehicle;

  return (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.requestId}>Request #{detail.id}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{labelFor(detail.status, STATUS_LABELS)}</Text>
          </View>
        </View>
        <Field label="Channel" value={labelFor(detail.channel, CHANNEL_LABELS)} />
        <Field label="Created" value={formatCreatedAt(detail.createdAt)} />
      </View>

      <Card title="Vehicle">
        <Field label="Summary" value={vehicleSummary(detail)} />
        <Field label="Type" value={present(vehicle?.type)} />
        <Field label="Vehicle status" value={present(vehicle?.status)} />
        <Field label="Work status" value={present(vehicle?.workStatus)} />
      </Card>

      <Card title="Services">
        {names.length === 0 ? (
          <Text style={styles.emptyLine}>No services listed</Text>
        ) : (
          <View style={styles.serviceList}>
            {names.map((name, index) => (
              <View key={`${name}-${index}`} style={styles.serviceChip}>
                <Text style={styles.serviceLabel}>{name}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card title="Provider">
        <Field label="Name" value={present(detail.provider_name)} />
        <Field label="Phone" value={present(detail.provider_phone)} />
      </Card>

      <Card title="Saved location">
        <Field label="Coordinates" value={savedCoordinates(detail)} />
      </Card>

      <Card title="Lifecycle">
        <TimelineList entries={detail.timeline} />
      </Card>
    </>
  );
}

export default function MyRequestDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const requestId = useMemo(() => parseRequestId(params.id), [params.id]);
  const { detail, isLoading, error, refetch, retry } = useMyRequestDetails(requestId);
  const { signOut } = useAuth();
  const signOutStartedRef = useRef(false);

  // 401 is an expired/invalid Sanctum session. Clear it through the existing
  // auth action; (app)/_layout.tsx then performs the normal unauthenticated
  // redirect. No second auth client, token store or login route is introduced.
  useEffect(() => {
    if (error?.status === 401 && !signOutStartedRef.current) {
      signOutStartedRef.current = true;
      void signOut();
    }
  }, [error?.status, signOut]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/my-requests');
    }
  }, [router]);

  const handleRefresh = useCallback(() => {
    if (!isLoading && detail !== null) {
      refetch();
    }
  }, [detail, isLoading, refetch]);

  if (requestId === null) {
    return (
      <View style={styles.screen}>
        <AppBar insets={insets} onBack={goBack} />
        <StateCard
          title="Invalid request link"
          message="This request link is not valid. Go back and choose a request from the list."
        >
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonLabel}>Back to My Requests</Text>
          </Pressable>
        </StateCard>
      </View>
    );
  }

  if (isLoading && detail === null && error === null) {
    return (
      <View style={styles.screen}>
        <AppBar insets={insets} subtitle={`Request #${requestId}`} onBack={goBack} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading request details…</Text>
        </View>
      </View>
    );
  }

  if (error?.status === 404) {
    return (
      <View style={styles.screen}>
        <AppBar insets={insets} subtitle={`Request #${requestId}`} onBack={goBack} />
        <StateCard
          title="Request not found"
          message="This request could not be found or is no longer available."
        >
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonLabel}>Back to My Requests</Text>
          </Pressable>
        </StateCard>
      </View>
    );
  }

  if (error?.status === 401) {
    return (
      <View style={styles.screen}>
        <AppBar insets={insets} subtitle={`Request #${requestId}`} onBack={goBack} />
        <StateCard
          title="Session expired"
          message="Your session is no longer valid. Returning to sign in…"
        >
          <ActivityIndicator color={colors.primary} />
        </StateCard>
      </View>
    );
  }

  if (error !== null) {
    return (
      <View style={styles.screen}>
        <AppBar insets={insets} subtitle={`Request #${requestId}`} onBack={goBack} />
        <StateCard
          title="Could not load request"
          message="Check your connection and try again."
        >
          <ApiErrorRow message={error.message} onRetry={retry} />
        </StateCard>
      </View>
    );
  }

  if (detail === null) {
    return (
      <View style={styles.screen}>
        <AppBar insets={insets} subtitle={`Request #${requestId}`} onBack={goBack} />
        <StateCard
          title="Request unavailable"
          message="This request could not be displayed."
        >
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonLabel}>Back to My Requests</Text>
          </Pressable>
        </StateCard>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppBar insets={insets} subtitle={`Request #${detail.id}`} onBack={goBack} />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DetailContent detail={detail} />
      </ScrollView>
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
  appBarSubtitle: {
    ...typography.caption,
    color: colors.subtitle,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  heroHeader: {
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardTitle: {
    ...typography.body,
    color: colors.title,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  field: {
    marginTop: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.subtitle,
    marginBottom: spacing.xs,
  },
  fieldValue: {
    ...typography.body,
    color: colors.fieldText,
  },
  serviceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceChip: {
    backgroundColor: colors.goldTint,
    borderColor: colors.goldTintBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  serviceLabel: {
    ...typography.caption,
    color: colors.navyDeep,
  },
  emptyLine: {
    ...typography.body,
    color: colors.subtitle,
  },
  timeline: {
    marginTop: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    ...typography.body,
    color: colors.fieldText,
    fontWeight: '600',
  },
  timelineDate: {
    ...typography.caption,
    color: colors.subtitle,
    marginTop: spacing.xs,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  loadingText: {
    ...typography.caption,
    color: colors.subtitle,
    textAlign: 'center',
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  stateCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateTitle: {
    ...typography.subtitle,
    color: colors.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateMessage: {
    ...typography.caption,
    color: colors.subtitle,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  primaryButtonPressed: {
    opacity: 0.7,
  },
  primaryButtonLabel: {
    ...typography.label,
    color: colors.brandText,
  },
});
