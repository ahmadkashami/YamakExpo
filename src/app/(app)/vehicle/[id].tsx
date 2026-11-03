import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { VehiclesList } from '@/components/home/VehiclesList';
import { ContactBar } from '@/components/vehicle-details/ContactBar';
import { DriverAvatar } from '@/components/vehicle-details/DriverAvatar';
import { BackIcon, ShareIcon } from '@/components/vehicle-details/icons';
import { SafetyCard } from '@/components/vehicle-details/SafetyCard';
import { VehicleStatusPill } from '@/components/vehicle-details/VehicleStatusPill';
import { useCreateRequest } from '@/hooks/use-create-request';
import { useVehicleDetails } from '@/hooks/use-vehicle-details';
import { useUserLocation } from '@/location';
import { colors, radius, spacing, typography } from '@/theme';

/** Legacy `ShareWithus` app-store link — the ONLY shared payload for now. */
const YAMAK_APP_LINK = 'yamak.page.link/app';

/**
 * Strict route-param guard (never `/vehicles/NaN`): the id must parse to a
 * positive integer, otherwise the screen renders the safe invalid-link state.
 */
function parseVehicleId(value: string | string[] | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value === null || value === undefined ? '' : value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function Header({
  insets,
  onBack,
  onShare,
}: {
  insets: EdgeInsets;
  onBack: () => void;
  onShare?: () => void;
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
      <Text style={styles.appBarTitle}>Vehicle details</Text>
      {onShare === undefined ? (
        <View style={styles.iconButton} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share the YAMAK app"
          hitSlop={8}
          onPress={onShare}
          style={styles.iconButton}
        >
          <ShareIcon color={colors.subtitle} size={22} />
        </Pressable>
      )}
    </View>
  );
}

function HeroImage({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <VehicleHeroFallback />;
  }
  return (
    <Image
      accessible={false}
      accessibilityIgnoresInvertColors
      style={styles.heroImage}
      resizeMode="cover"
      source={{ uri }}
      onError={() => setFailed(true)}
    />
  );
}

/** Safe local fallback (no legacy hardcoded Cloudinary URL, no copied assets). */
function VehicleHeroFallback() {
  return (
    <View style={styles.heroFallback}>
      <Text style={styles.heroFallbackEmoji}>🛻</Text>
      <Text style={styles.heroFallbackLabel}>Vehicle image</Text>
    </View>
  );
}

function VehicleDetailsSkeleton() {
  return (
    <View>
      <View style={styles.heroFrame} />
      <View style={[styles.card, styles.skeletonCard]} />
      <View style={[styles.card, styles.skeletonCardSmall]} />
    </View>
  );
}

/**
 * Vehicle Details — approved `docs/rebuild/approve-ui/VehiclesDetails`.
 *
 * Approved design kept: app bar (back / Vehicle details / Share), hero +
 * availability pill, title / identity card with the adapted non-profit
 * notice, provider card, persistent bottom contact bar, approved cards.
 *
 * Removed as unsupported marketplace content: price, specs grid, Verified /
 * Dealer Certified / MOI claims, rating / transactions / response-time /
 * member-since, ♡ favourite + toast, gallery counter.
 *
 * Legacy functions preserved (redesigned to the approved language): Share
 * (app link), Services (read-only chips), Safety card, Other Vehicles.
 */
export default function VehicleDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const vehicleId = useMemo(() => parseVehicleId(params.id), [params.id]);

  // "Other Vehicles" reuses the shared location-aware list; prime the shared
  // provider exactly like the Map does so a deep-linked session (no Map
  // visited first) never leaves that section unresolved. The detail hook
  // itself stays location-free.
  const { status: locationStatus, requestLocation } = useUserLocation();
  const primedLocationRef = useRef(false);
  useEffect(() => {
    // Only prime the shared location provider for VALID ids — an invalid deep
    // link must not pop the permission prompt on top of the invalid state.
    if (primedLocationRef.current || locationStatus !== 'unknown' || vehicleId === null) {
      return;
    }
    primedLocationRef.current = true;
    void requestLocation();
  }, [locationStatus, requestLocation, vehicleId]);

  const { vehicle, isLoading, error, refetch } = useVehicleDetails(vehicleId);
  const { submit: createRequest, isSubmitting, error: createError, reset: resetCreateRequest } = useCreateRequest();
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSelectedServiceIds(new Set());
    resetCreateRequest();
  }, [vehicleId, resetCreateRequest]);

  useEffect(() => {
    if (createError !== null) {
      Alert.alert('Request failed', createError.message);
    }
  }, [createError]);

  const toggleService = useCallback((serviceId: number) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  }, []);

  const handleRequest = useCallback(async () => {
    if (vehicle === null || vehicleId === null) {
      return;
    }
    const driverId = vehicle.currentDriver?.id;
    if (typeof driverId !== 'number') {
      Alert.alert('Unable to send request', 'No provider assigned to this vehicle.');
      return;
    }
    const services = Array.from(selectedServiceIds).filter((id) => typeof id === 'number' && id > 0);
    if (services.length === 0) {
      return;
    }
    const ok = await createRequest({
      vehicleId,
      driverId,
      services,
    });
    if (ok) {
      setSelectedServiceIds(new Set());
      Alert.alert('Request sent', 'Request sent successfully.');
    }
  }, [createRequest, selectedServiceIds, vehicle, vehicleId]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/map');
    }
  }, [router]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Download the YAMAK app now:\n${YAMAK_APP_LINK}`,
      });
    } catch {
      // Share sheet dismissed / unsupported — nothing to recover.
    }
  }, []);

  const vehiclePhone = useMemo(() => {
    if (vehicle === null) {
      return null;
    }
    const phone = nonEmpty(vehicle.currentDriver?.phoneNum ?? null);
    return phone === null ? null : phone.replace(/\s+/g, '');
  }, [vehicle]);

  const handleWhatsApp = useCallback(async () => {
    if (vehiclePhone === null) {
      return;
    }
    const servicesNames = (vehicle?.services ?? [])
      .map((service) => nonEmpty(service.name.en))
      .filter((name): name is string => name !== null);
    const base = 'Hello from the YAMAK app. I need your help';
    const message =
      servicesNames.length > 0 ? `${base} with: ${servicesNames.join(', ')}.` : `${base}.`;
    const digits = vehiclePhone.replace(/[^\d]/g, '');
    const intentUrl = `whatsapp://send?phone=${digits}&text=${encodeURIComponent(message)}`;
    const webFallbackUrl = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    try {
      if (await Linking.canOpenURL(intentUrl)) {
        await Linking.openURL(intentUrl);
        return;
      }
      await Linking.openURL(webFallbackUrl);
    } catch {
      // WhatsApp not installed and the web fallback failed — silent, safe.
    }
  }, [vehiclePhone, vehicle]);

  const handleCall = useCallback(async () => {
    if (vehiclePhone === null) {
      return;
    }
    try {
      await Linking.openURL(`tel:${vehiclePhone}`);
    } catch {
      // No dialler — silent, safe.
    }
  }, [vehiclePhone]);

  if (vehicleId === null) {
    return (
      <View style={styles.screen}>
        <Header insets={insets} onBack={goBack} />
        <View style={styles.invalidWrap}>
          <View style={styles.card}>
            <Text style={styles.invalidTitle}>Invalid vehicle link</Text>
            <Text style={styles.invalidBody}>
              This vehicle link is not valid. Go back and choose a provider from the map.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={goBack}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            >
              <Text style={styles.primaryButtonLabel}>Go back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const driver = vehicle?.currentDriver ?? null;
  const company = vehicle?.company ?? null;
  const branch = vehicle?.branch ?? null;
  const companyName = nonEmpty(company?.name.en ?? null);
  const branchName = nonEmpty(branch?.name ?? null);
  const title = nonEmpty(vehicle?.modelName ?? null) ?? companyName ?? 'Vehicle';
  const subtitle = [title !== companyName ? companyName : null, branchName]
    .filter((part): part is string => part !== null)
    .join(' · ');
  const services = (vehicle?.services ?? []).filter(
    (service) => nonEmpty(service.name.en) !== null,
  );

  return (
    <View style={styles.screen}>
      <Header insets={insets} onBack={goBack} onShare={() => void handleShare()} />

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <VehicleDetailsSkeleton />
        </ScrollView>
      ) : error !== null || vehicle === null ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <ApiErrorRow
              message={error?.message ?? 'Vehicle details could not be loaded.'}
              onRetry={refetch}
            />
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Hero image (single `iconMap`) + availability pill */}
            <View style={styles.heroFrame}>
              {vehicle.iconMap === null ? (
                <VehicleHeroFallback />
              ) : (
                <HeroImage uri={vehicle.iconMap} />
              )}
              <View style={styles.statusPillWrap}>
                <VehicleStatusPill workStatus={vehicle.workStatus} />
              </View>
            </View>

            {/* Title / identity + adapted non-profit notice (approved notice
                structure, YAMAK facilitator wording — no seller/commission). */}
            <View style={styles.card}>
              <Text style={styles.title}>{title}</Text>
              {subtitle.length === 0 ? null : <Text style={styles.subtitle}>{subtitle}</Text>}
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  <Text style={styles.noticeStrong}>YAMAK is a free facilitator / connector. </Text>
                  No middleman or platform fees — you agree price, payment and service terms
                  directly with the provider.
                </Text>
              </View>
            </View>

            {/* Provider / driver card (currentDriver is nullable) */}
            {driver === null ? null : (
              <View style={styles.card}>
                <View style={styles.providerRow}>
                  <DriverAvatar driver={driver} />
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>{nonEmpty(driver.name) ?? 'Provider'}</Text>
                    {subtitle.length === 0 ? null : (
                      <Text style={styles.providerMeta}>{subtitle}</Text>
                    )}
                    {vehiclePhone === null ? null : (
                      <Text style={styles.providerMeta}>{vehiclePhone}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Services — multi-select for request */}
            {services.length === 0 ? null : (
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>Services</Text>
                <View style={styles.chips}>
                  {services.map((service) => {
                    const selected = selectedServiceIds.has(service.id);
                    return (
                      <Pressable
                        key={service.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={service.name.en}
                        onPress={() => toggleService(service.id)}
                        style={[styles.chip, selected && styles.chipSelected]}
                        disabled={isSubmitting}
                      >
                        <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                          {service.name.en}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send request"
                disabled={selectedServiceIds.size === 0 || isSubmitting || vehicle.currentDriver?.id === undefined}
                onPress={() => void handleRequest()}
                style={({ pressed }) => [
                  styles.requestButton,
                  (selectedServiceIds.size === 0 || isSubmitting || vehicle.currentDriver?.id === undefined) && styles.requestButtonDisabled,
                  pressed && !(selectedServiceIds.size === 0 || isSubmitting) && styles.requestButtonPressed,
                ]}
              >
                <Text style={styles.requestButtonLabel}>{isSubmitting ? 'Sending...' : 'Request'}</Text>
              </Pressable>
            </View>

            <SafetyCard />

            {/* Other vehicles — shared list util, current vehicle excluded. */}
            <VehiclesList
              title="Other Vehicles"
              excludeId={vehicle.id}
              onVehiclePress={(other) =>
                router.push({ pathname: '/vehicle/[id]', params: { id: String(other.id) } })
              }
            />
          </ScrollView>

          {/* Persistent bottom contact bar — tel/WhatsApp ONLY (no POST /requests). */}
          <ContactBar
            onWhatsApp={() => void handleWhatsApp()}
            onCall={() => void handleCall()}
            disabled={vehiclePhone === null}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.phonePrefix, // approved screen bg #F8FAFC
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  appBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.title,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroFrame: {
    aspectRatio: 16 / 10,
    borderRadius: radius.heroPlate,
    overflow: 'hidden',
    backgroundColor: colors.border, // approved `bg-slate-200`
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  heroFallbackEmoji: {
    fontSize: 40,
  },
  heroFallbackLabel: {
    ...typography.caption,
    color: colors.subtitle,
  },
  statusPillWrap: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.title,
  },
  subtitle: {
    ...typography.caption,
    color: colors.subtitle,
    marginTop: spacing.xs,
  },
  notice: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.goldTintBorder,
  },
  noticeText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.fieldText,
  },
  noticeStrong: {
    fontWeight: '700',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.title,
  },
  providerMeta: {
    ...typography.caption,
    color: colors.subtitle,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.title,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.phonePrefix,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.fieldText,
  },
  chipSelected: {
    backgroundColor: colors.navyDeep,
    borderColor: colors.navyDeep,
  },
  chipLabelSelected: {
    color: colors.brandText,
  },
  requestButton: {
    backgroundColor: colors.navyDeep,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  requestButtonPressed: {
    backgroundColor: colors.navyDeepDark,
  },
  requestButtonDisabled: {
    opacity: 0.5,
  },
  requestButtonLabel: {
    ...typography.buttonLabel,
    color: colors.brandText,
  },
  invalidWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  invalidTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.title,
    marginBottom: spacing.sm,
  },
  invalidBody: {
    ...typography.subtitle,
    color: colors.subtitle,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.navyDeep,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: colors.navyDeepDark,
  },
  primaryButtonLabel: {
    ...typography.buttonLabel,
    color: colors.brandText,
  },
  skeletonCard: {
    height: 120,
  },
  skeletonCardSmall: {
    height: 96,
  },
});