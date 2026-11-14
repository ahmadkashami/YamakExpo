import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import type { ApiError, RequestChannel, Service, TrackedServiceRequestData } from '@/api';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { VehiclesList } from '@/components/home/VehiclesList';
import { ContactBar } from '@/components/vehicle-details/ContactBar';
import { DriverAvatar } from '@/components/vehicle-details/DriverAvatar';
import { BackIcon, ShareIcon } from '@/components/vehicle-details/icons';
import { SafetyCard } from '@/components/vehicle-details/SafetyCard';
import { VehicleStatusPill } from '@/components/vehicle-details/VehicleStatusPill';
import { useCreateRequest } from '@/hooks/use-create-request';
import { useVehicleDetails } from '@/hooks/use-vehicle-details';
import {
  useUserLocation,
  type FreshLocationResult,
  type UserCoords,
} from '@/location';
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

/** Channels that end with an external handoff after the backend confirms creation. */
type HandoffChannel = Extract<RequestChannel, 'whatsapp' | 'phone'>;

/**
 * Everything a handoff-only retry needs.
 *
 * The phone and the WhatsApp message are captured at creation time, so a retry
 * never depends on the current selection (which is cleared on success) and
 * never recomputes the message from every service offered by the vehicle.
 */
type PreparedHandoff = {
  channel: HandoffChannel;
  request: TrackedServiceRequestData;
  /** Both safe representations travel together with the created request. */
  phone: PhoneHandoff;
  /** Selected-services snapshot, not the vehicle's full service list. */
  whatsAppMessage: string;
};

/**
 * Result of an external handoff attempt.
 *
 * `deferred` is distinct on purpose: the screen lost focus or the operation was
 * invalidated before `openURL`, so no external app was opened and the message
 * must not claim success or failure.
 */
type HandoffOutcome = 'opened' | 'failed' | 'deferred';

type RequestStage = 'location' | 'request' | 'handoff' | null;

type RequestFeedback = {
  tone: 'success' | 'error' | 'info';
  message: string;
};

/**
 * Two safe phone representations:
 * - `digits`: WhatsApp only (`whatsapp://send?phone=` / `wa.me`).
 * - `dial`: phone dialer payload; a leading `+` is preserved and every other
 *   formatting character is removed. Example: `+965 1234 5678` →
 *   digits `96512345678`, dial `+96512345678`.
 *
 * The minimum-digit guard is unchanged: at least 7 digits after stripping.
 */
type PhoneHandoff = {
  digits: string;
  dial: string;
};

function normalizePhone(value: string | null | undefined): PhoneHandoff | null {
  const trimmed = nonEmpty(value);
  if (trimmed === null) {
    return null;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) {
    return null;
  }
  const dial = trimmed.trimStart().startsWith('+') ? `+${digits}` : digits;
  return { digits, dial };
}

/**
 * Defensive validation of the D2 fresh-location result before any POST.
 *
 * D2 already rejects (0, 0) and out-of-range fixes; this repeats the contract at
 * the call site so no cached/vehicle/profile coordinate can ever reach the API.
 */
function isUsableRequestCoords(coords: UserCoords | null): boolean {
  if (coords === null) {
    return false;
  }
  const { latitude, longitude } = coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  if (longitude < -180 || longitude > 180) {
    return false;
  }
  return latitude !== 0 || longitude !== 0;
}

/** Local, actionable failure text for a fresh-location attempt (never a fallback). */
function freshLocationFailureMessage(
  result: Extract<FreshLocationResult, { ok: false }>,
): string {
  switch (result.status) {
    case 'denied':
      return result.canAskAgain
        ? 'Location permission is required to create a request. Tap the button to allow it and try again.'
        : 'Location permission is blocked. Enable location access for YAMAK in your device settings, then try again.';
    case 'timed-out':
      return 'Your current location could not be determined in time. Move somewhere with a clearer signal and try again.';
    case 'unavailable':
      return `${result.error ?? 'Your current location is unavailable.'} Try again to send the request.`;
  }
}

/** Message built from the selected services only. */
function buildWhatsAppMessage(services: Service[]): string {
  const names = services
    .map((service) => nonEmpty(service.name.en))
    .filter((name): name is string => name !== null);
  const base = 'Hello from the YAMAK app. I need your help';
  return names.length > 0 ? `${base} with: ${names.join(', ')}.` : `${base}.`;
}

/**
 * Mirror of the D4 logical attempt identity.
 *
 * Used only to decide whether this tap resumes a pending attempt (reuse the
 * hook-owned Idempotency-Key, even with refreshed GPS) or begins a new logical
 * request. Coordinates are deliberately excluded.
 */
function logicalRequestIdentity(
  vehicleId: number,
  driverId: number,
  services: number[],
  channel: RequestChannel,
): string {
  const sorted = [...services].sort((a, b) => a - b);
  return `v:${vehicleId}|d:${driverId}|s:${sorted.join(',')}|c:${channel}`;
}

/** Channel-agnostic busy label for the primary request button. */
function requestButtonLabel(busy: boolean, stage: RequestStage): string {
  if (!busy) {
    return 'Request';
  }
  if (stage === 'location') {
    return 'Getting location…';
  }
  if (stage === 'request') {
    return 'Sending…';
  }
  return 'Working…';
}

/** Distinguish conflict, validation and transport failures for the user. */
function describeRequestError(error: ApiError): string {
  if (error.status === 409) {
    return `This request conflicts with an earlier attempt (HTTP 409): ${error.message}. Nothing was resubmitted — review the request before trying again.`;
  }
  if (error.status === 422) {
    return `The server rejected these request details (HTTP 422): ${error.message}. Your services are still selected.`;
  }
  if (error.kind === 'network') {
    return 'The request could not reach the server (network error). Your services are still selected — retry when the connection is stable.';
  }
  return `${error.message} Your services are still selected.`;
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
  const {
    status: locationStatus,
    requestLocation,
    requestFreshLocation,
  } = useUserLocation();
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
  const {
    submitTracked,
    startNewTrackedRequest,
    reset: resetCreateRequest,
  } = useCreateRequest();

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<RequestStage>(null);
  const [feedback, setFeedback] = useState<RequestFeedback | null>(null);
  const [pendingHandoff, setPendingHandoff] = useState<PreparedHandoff | null>(null);

  // Synchronous double-tap guard: React state has not re-rendered yet when a
  // second press arrives, so the ref is the admission control.
  const busyRef = useRef(false);
  /**
   * Monotonic operation id. A navigation (vehicleId change) or unmount bumps it,
   * so a late continuation for an old vehicle cannot clear a new selection,
   * show a misleading success, overwrite newer state, or open a handoff.
   */
  const operationRef = useRef(0);
  const mountedRef = useRef(true);
  /**
   * Focus tracking (push/back does not change vehicleId on this instance). A
   * background screen must never open WhatsApp/dialer after a late POST, even
   * though the request identity must be preserved.
   */
  const focusedRef = useRef(true);
  /** Identity of the pending (failed) logical attempt, if any, for key reuse. */
  const retryIdentityRef = useRef<string | null>(null);
  const pendingHandoffRef = useRef<PreparedHandoff | null>(null);
  /** Vehicle id whose success/handoff result was actually shown to the user. */
  const presentedCompletionRef = useRef<number | null>(null);
  /** Set by a real selection change after a presented success. */
  const explicitNewIntentRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Invalidate anything still awaiting. The D4 hook keeps its own request
      // identity for an in-flight POST, so the request is not lost.
      operationRef.current += 1;
      busyRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, []),
  );

  useEffect(() => {
    // Vehicle identity changed while this screen stayed mounted. Invalidate
    // asynchronous continuations and reset only screen-local state; the D4 hook
    // owns request identity and is not rotated here.
    operationRef.current += 1;
    busyRef.current = false;
    // Keep `retryIdentityRef` and `completedRequestRef`: both are keyed by the
    // full logical identity, so a pending key survives navigation while a
    // different vehicle can never reuse them. A pending handoff does NOT carry
    // over — opening it from another vehicle would be unintended.
    pendingHandoffRef.current = null;
    explicitNewIntentRef.current = false;
    setBusy(false);
    setStage(null);
    setFeedback(null);
    setPendingHandoff(null);
    setSelectedServiceIds(new Set());
    resetCreateRequest();
  }, [vehicleId, resetCreateRequest]);

  const toggleService = useCallback((serviceId: number) => {
    // Changing the selection after a shown success is the explicit signal to
    // begin a new logical request. It also supersedes any failed-handoff retry.
    if (pendingHandoffRef.current !== null) {
      pendingHandoffRef.current = null;
      setPendingHandoff(null);
    }
    if (vehicleId !== null && presentedCompletionRef.current === vehicleId) {
      explicitNewIntentRef.current = true;
    }
    setFeedback(null);
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  }, [vehicleId]);

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

  /**
   * Existing linking behaviour, unchanged: native WhatsApp intent first, then
   * the `wa.me` web fallback. A resolved promise only means the OS accepted the
   * handoff — it is never reported as "message sent".
   *
   * Eligibility is re-checked immediately before EVERY `openURL`. Awaiting
   * `canOpenURL` can span a navigation/blur, and no external app may be opened
   * from a screen that is no longer current.
   */
  const openPreparedHandoff = useCallback(
    async (prepared: PreparedHandoff, operationId: number): Promise<HandoffOutcome> => {
      const eligible = (): boolean =>
        mountedRef.current && focusedRef.current && operationRef.current === operationId;

      try {
        if (prepared.channel === 'whatsapp') {
          const encoded = encodeURIComponent(prepared.whatsAppMessage);
          const intentUrl = `whatsapp://send?phone=${prepared.phone.digits}&text=${encoded}`;
          const webFallbackUrl = `https://wa.me/${prepared.phone.digits}?text=${encoded}`;

          const canOpenNative = await Linking.canOpenURL(intentUrl);

          if (!eligible()) {
            return 'deferred';
          }
          if (canOpenNative) {
            await Linking.openURL(intentUrl);
            return 'opened';
          }

          // Re-check the web fallback independently: the native decision and the
          // fallback are separate external opens.
          if (!eligible()) {
            return 'deferred';
          }
          await Linking.openURL(webFallbackUrl);
          return 'opened';
        }

        if (!eligible()) {
          return 'deferred';
        }
        await Linking.openURL(`tel:${prepared.phone.dial}`);
        return 'opened';
      } catch {
        // A throw is a genuine open failure unless the operation itself became
        // ineligible while awaiting — then it was never a valid handoff.
        return eligible() ? 'failed' : 'deferred';
      }
    },
    [],
  );

  const releaseOperation = useCallback((operationId: number) => {
    if (operationRef.current !== operationId || !mountedRef.current) {
      return;
    }
    busyRef.current = false;
    setBusy(false);
    setStage(null);
  }, []);

  /**
   * Handoff-only retry: reopens WhatsApp or the dialer for the request already
   * confirmed by the backend. It never POSTs and never refreshes GPS.
   */
  const retryHandoff = useCallback(async (): Promise<void> => {
    const prepared = pendingHandoffRef.current;
    if (prepared === null || busyRef.current) {
      return;
    }

    const operationId = operationRef.current + 1;
    operationRef.current = operationId;
    busyRef.current = true;
    setBusy(true);
    setStage('handoff');
    setFeedback(null);

    try {
      const outcome = await openPreparedHandoff(prepared, operationId);
      if (operationRef.current !== operationId || !mountedRef.current) {
        // Invalidated (vehicle change/unmount): keep the request, do not claim
        // that any app was opened, and do not touch newer screen state.
        return;
      }
      if (outcome === 'deferred') {
        // Still the current operation, but the screen lost focus mid-handoff.
        // Pending handoff information is preserved for another retry.
        setFeedback({
          tone: 'info',
          message: `Request #${prepared.request.id} saved. ${
            prepared.channel === 'whatsapp' ? 'WhatsApp' : 'The phone dialer'
          } was not opened because the screen lost focus — retry when you return.`,
        });
      } else if (outcome === 'opened') {
        pendingHandoffRef.current = null;
        setPendingHandoff(null);
        setFeedback({
          tone: 'success',
          message:
            prepared.channel === 'whatsapp'
              ? `Request #${prepared.request.id} saved. WhatsApp was opened — send the message to reach the provider.`
              : `Request #${prepared.request.id} saved. The phone dialer was opened — place the call to reach the provider.`,
        });
      } else {
        setFeedback({
          tone: 'error',
          message:
            prepared.channel === 'whatsapp'
              ? `Request #${prepared.request.id} was saved, but WhatsApp could not be opened.`
              : `Request #${prepared.request.id} was saved, but the phone dialer could not be opened.`,
        });
      }
    } finally {
      releaseOperation(operationId);
    }
  }, [openPreparedHandoff, releaseOperation]);

  /**
   * The single three-channel orchestration.
   *
   * Order is fixed: validate → guard concurrency → fresh location → validate
   * coordinates → tracked POST → confirm success → external handoff. No
   * WhatsApp/dialer intent is ever opened before the backend confirms creation.
   */
  const submitForChannel = useCallback(
    async (channel: RequestChannel): Promise<void> => {
      if (busyRef.current) {
        return;
      }

      // A request exists but its external handoff failed. Repeating that
      // channel is a handoff-only retry; the other contact action must not POST
      // a duplicate either.
      const awaitingHandoff = pendingHandoffRef.current;
      if (awaitingHandoff !== null) {
        if (awaitingHandoff.channel === channel) {
          await retryHandoff();
          return;
        }
        setFeedback({
          tone: 'info',
          message: `Request #${awaitingHandoff.request.id} was already saved. Retry the ${
            awaitingHandoff.channel === 'whatsapp' ? 'WhatsApp' : 'phone'
          } handoff, or change the selected services to start a new request.`,
        });
        return;
      }

      const activeVehicle = vehicle;
      const activeVehicleId = vehicleId;
      if (activeVehicle === null || activeVehicleId === null) {
        setFeedback({ tone: 'error', message: 'Vehicle details are not available yet.' });
        return;
      }

      const driverId = activeVehicle.currentDriver?.id;
      if (typeof driverId !== 'number') {
        setFeedback({
          tone: 'error',
          message: 'No provider is assigned to this vehicle, so a request cannot be created.',
        });
        return;
      }

      // Use only the services selected in this screen, as a snapshot.
      const selectedServices = activeVehicle.services.filter(
        (service) => selectedServiceIds.has(service.id) && Number.isInteger(service.id) && service.id > 0,
      );
      if (selectedServices.length === 0) {
        setFeedback({ tone: 'error', message: 'Select at least one service before sending a request.' });
        return;
      }
      const serviceIds = selectedServices.map((service) => service.id);

      const phone = normalizePhone(activeVehicle.currentDriver?.phoneNum ?? null);
      if (channel !== 'app' && phone === null) {
        setFeedback({
          tone: 'error',
          message:
            channel === 'whatsapp'
              ? 'This provider has no usable WhatsApp number. Select another channel or provider.'
              : 'This provider has no usable phone number. Select another channel or provider.',
        });
        return;
      }

      const identity = logicalRequestIdentity(activeVehicleId, driverId, serviceIds, channel);
      // Only a real post-success selection change rotates the D4 key/cache.
      // Otherwise the hook's identity rules apply: a pending attempt reused its
      // key (even with refreshed GPS), a completed identity returns its cached
      // request, and a different identity starts a new attempt automatically.
      if (explicitNewIntentRef.current) {
        startNewTrackedRequest();
        presentedCompletionRef.current = null;
        explicitNewIntentRef.current = false;
      }

      const operationId = operationRef.current + 1;
      operationRef.current = operationId;
      busyRef.current = true;
      setBusy(true);
      setStage('location');
      setFeedback(null);

      try {
        const location = await requestFreshLocation();
        if (operationRef.current !== operationId || !mountedRef.current) {
          return;
        }
        if (!location.ok) {
          // Never POST: selection, channel and services stay untouched.
          setFeedback({ tone: 'error', message: freshLocationFailureMessage(location) });
          return;
        }
        if (!isUsableRequestCoords(location.coords)) {
          setFeedback({
            tone: 'error',
            message: 'Your current location could not be used for this request. Move to an open area and try again.',
          });
          return;
        }

        setStage('request');
        const outcome = await submitTracked({
          vehicleId: activeVehicleId,
          driverId,
          services: serviceIds,
          channel,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (outcome.ok) {
          // D4 keeps this identity's completed result even when the user
          // navigated away, so returning to the same vehicle/channel/services
          // returns the cached request instead of re-POSTing it.
          retryIdentityRef.current = null;
        }

        if (operationRef.current !== operationId || !mountedRef.current) {
          // No UI, success claim or handoff for an old vehicle.
          return;
        }

        if (!outcome.ok) {
          // D4 drops an attempt on 409; every other failure keeps its key, so
          // only a non-409 failure resumes the same logical attempt.
          retryIdentityRef.current = outcome.error.status === 409 ? null : identity;
          setFeedback({ tone: 'error', message: describeRequestError(outcome.error) });
          return;
        }

        const request = outcome.request;
        presentedCompletionRef.current = activeVehicleId;
        // Backend-confirmed creation only: clear the selection now, never on a
        // failed attempt or a location failure.
        setSelectedServiceIds(new Set());

        if (channel === 'app') {
          setFeedback({
            tone: 'success',
            message: outcome.wasCached
              ? `Request #${request.id} was already created. Backend status: ${request.status}.`
              : `Request #${request.id} created. Backend status: ${request.status}. The provider will contact you.`,
          });
          return;
        }

        if (phone === null) {
          // Unreachable: the pre-POST guard already rejected a missing phone.
          setFeedback({
            tone: 'error',
            message: 'This provider has no usable phone number for the handoff.',
          });
          return;
        }

        // A tracked service request is recorded before the external app opens,
        // so the user knows the request exists independently of the handoff action.
        const requestRecordNote = `A tracked service request #${request.id} has been recorded. `;

        const prepared: PreparedHandoff = {
          channel,
          request,
          phone,
          whatsAppMessage: channel === 'whatsapp' ? buildWhatsAppMessage(selectedServices) : '',
        };
        // Kept before opening so a failed handoff can be retried without a POST.
        pendingHandoffRef.current = prepared;
        setPendingHandoff(prepared);

        if (!focusedRef.current) {
          // The request is created, but this screen is no longer in front:
          // opening an external app here would be an unintended handoff.
          setFeedback({
            tone: 'info',
            message: `${requestRecordNote}${channel === 'whatsapp' ? 'WhatsApp' : 'The phone dialer'} was not opened because the screen lost focus — retry when you return.`,
          });
          return;
        }

        setStage('handoff');
        const handoff = await openPreparedHandoff(prepared, operationId);

        if (operationRef.current !== operationId || !mountedRef.current) {
          // Vehicle changed / unmounted during the handoff: never claim an
          // external open for an operation that is no longer current.
          return;
        }

        if (handoff === 'deferred') {
          // Focus was lost while awaiting `canOpenURL`. The request exists and
          // the pending handoff is preserved for a retry after returning.
          setFeedback({
            tone: 'info',
            message: `${requestRecordNote}${channel === 'whatsapp' ? 'WhatsApp' : 'The phone dialer'} was not opened because the screen lost focus — retry when you return.`,
          });
          return;
        }

        if (handoff === 'opened') {
          pendingHandoffRef.current = null;
          setPendingHandoff(null);
          setFeedback({
            tone: 'success',
            message:
              channel === 'whatsapp'
                ? `Request #${request.id} saved. WhatsApp was opened — send the message to reach the provider.`
                : `Request #${request.id} saved. The phone dialer was opened — place the call to reach the provider.`,
          });
        } else {
          setFeedback({
            tone: 'error',
            message:
              channel === 'whatsapp'
                ? `Request #${request.id} was saved, but WhatsApp could not be opened.`
                : `Request #${request.id} was saved, but the phone dialer could not be opened.`,
          });
        }
      } finally {
        releaseOperation(operationId);
      }
    },
    [
      openPreparedHandoff,
      releaseOperation,
      requestFreshLocation,
      retryHandoff,
      selectedServiceIds,
      startNewTrackedRequest,
      submitTracked,
      vehicle,
      vehicleId,
    ],
  );

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
                        accessibilityState={{ selected, disabled: busy }}
                        accessibilityLabel={service.name.en}
                        onPress={() => toggleService(service.id)}
                        style={[styles.chip, selected && styles.chipSelected, busy && styles.chipDisabled]}
                        disabled={busy}
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
              {feedback === null ? null : (
                <View
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.feedback,
                    feedback.tone === 'success' && styles.feedbackSuccess,
                    feedback.tone === 'error' && styles.feedbackError,
                    feedback.tone === 'info' && styles.feedbackInfo,
                  ]}
                >
                  <Text
                    style={[
                      styles.feedbackText,
                      feedback.tone === 'success' && styles.feedbackTextSuccess,
                      feedback.tone === 'error' && styles.feedbackTextError,
                      feedback.tone === 'info' && styles.feedbackTextInfo,
                    ]}
                  >
                    {feedback.message}
                  </Text>
                </View>
              )}

              {pendingHandoff === null ? null : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    pendingHandoff.channel === 'whatsapp'
                      ? 'Retry opening WhatsApp'
                      : 'Retry opening the phone dialer'
                  }
                  disabled={busy}
                  onPress={() => void retryHandoff()}
                  style={({ pressed }) => [
                    styles.handoffRetry,
                    busy && styles.requestButtonDisabled,
                    pressed && !busy && styles.handoffRetryPressed,
                  ]}
                >
                  <Text style={styles.handoffRetryLabel}>
                    {pendingHandoff.channel === 'whatsapp'
                      ? 'Retry opening WhatsApp'
                      : 'Retry phone dialer'}
                  </Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send request"
                accessibilityState={{
                  disabled:
                    selectedServiceIds.size === 0 ||
                    busy ||
                    vehicle.currentDriver?.id === undefined,
                  busy,
                }}
                disabled={
                  selectedServiceIds.size === 0 ||
                  busy ||
                  vehicle.currentDriver?.id === undefined
                }
                onPress={() => void submitForChannel('app')}
                style={({ pressed }) => [
                  styles.requestButton,
                  (selectedServiceIds.size === 0 ||
                    busy ||
                    vehicle.currentDriver?.id === undefined) &&
                    styles.requestButtonDisabled,
                  pressed &&
                    !(selectedServiceIds.size === 0 || busy) &&
                    styles.requestButtonPressed,
                ]}
              >
                <Text style={styles.requestButtonLabel}>{requestButtonLabel(busy, stage)}</Text>
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

          {/* Persistent bottom contact bar — creates a tracked request first,
              then opens the external handoff after backend confirmation. */}
          <ContactBar
            onWhatsApp={() => void submitForChannel('whatsapp')}
            onCall={() => void submitForChannel('phone')}
            disabled={normalizePhone(vehicle.currentDriver?.phoneNum ?? null) === null}
            busy={busy}
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
  chipDisabled: {
    opacity: 0.5,
  },
  chipLabelSelected: {
    color: colors.brandText,
  },
  feedback: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  feedbackSuccess: {
    backgroundColor: colors.successTint,
    borderColor: colors.success,
  },
  feedbackError: {
    backgroundColor: colors.errorBackground,
    borderColor: colors.error,
  },
  feedbackInfo: {
    backgroundColor: colors.goldTint,
    borderColor: colors.goldTintBorder,
  },
  feedbackText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.fieldText,
  },
  feedbackTextSuccess: {
    color: colors.successText,
  },
  feedbackTextError: {
    color: colors.error,
  },
  feedbackTextInfo: {
    color: colors.fieldText,
  },
  handoffRetry: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.successTint,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  handoffRetryPressed: {
    opacity: 0.7,
  },
  handoffRetryLabel: {
    ...typography.label,
    color: colors.successText,
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