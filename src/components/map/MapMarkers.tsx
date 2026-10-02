import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { Vehicle } from '@/api';
import type { UserCoords } from '@/location';
import { colors, radius } from '@/theme';
import { formatDistanceKm } from '@/utils/distance';
import { vehicleMarkerCoordinate } from '@/utils/vehicle-marker';

/** Reserved pin stage (idle pin + the active ring both live inside it). */
const PIN_BOX = 48;
const PIN_SIZE = 32;
const PIN_ACTIVE_SIZE = 38;
const ICON_SIZE = 20;
const ICON_ACTIVE_SIZE = 24;
/** Fixed pill height + gap, used to keep the anchor on the PIN centre. */
const PILL_EXTRA = 18;

/**
 * One vehicle marker, restyled to approve-ui/map:
 * - IDLE: white rounded-square pin with a gold (wordmark) border + the real
 *   `iconMap` image (emoji 🛻 fallback, same as Vehicle Details).
 * - ACTIVE: gold pin, white border + gold ring; pressed markers navigate away
 *   immediately so this is a selection visual only.
 * - ONLINE dot: an emerald dot in the pill above ONLY when
 *   `workStatus === 'online'` (the sole verified mapping — nothing invented).
 * - Distance: real Haversine km (computed by the screen) shown in the same
 *   pill; omitted when the user has no valid position. No ETA, no rating, no
 *   demo provider copy — the "14m/4.9/km" mock values are never rendered.
 *
 * Position comes from `geoLocation.coordinates` (`[longitude, latitude]`,
 * converted by `vehicleMarkerCoordinate`); unusable coordinates skip the
 * marker entirely. `geoLocation` order is the only supported source.
 */
export function VehicleMarker({
  vehicle,
  isActive,
  distanceKm,
  onPress,
}: {
  vehicle: Vehicle;
  isActive: boolean;
  /** Real Haversine km from the user → vehicle, or null when no user fix. */
  distanceKm: number | null;
  onPress: (vehicle: Vehicle) => void;
}) {
  const coordinate = vehicleMarkerCoordinate(vehicle);
  if (coordinate === null) {
    return null;
  }

  const online = vehicle.workStatus === 'online';
  const showDistance = distanceKm !== null;
  const hasPill = online || showDistance;

  // Anchor the map point on the PIN centre: the pill (when present) sits above
  // the fixed 48pt pin stage, so the centre drifts up by half the pill height.
  const extraAbovePin = hasPill ? PILL_EXTRA : 0;
  const anchorY = (extraAbovePin + PIN_BOX / 2) / (extraAbovePin + PIN_BOX);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: anchorY }}
      onPress={() => onPress(vehicle)}
      // Same policy as the baseline: track only while selected (Android
      // re-snapshots markers then). Idle markers keep their first snapshot —
      // no continuous re-rendering of remote-image pins.
      tracksViewChanges={isActive}
    >
      <View
        accessible
        accessibilityLabel={`Vehicle ${vehicle.labelNumber ?? vehicle.id} on map`}
        style={styles.markerWrap}
      >
        {hasPill ? (
          <View style={styles.pill}>
            {online ? <View style={styles.pillDot} /> : null}
            {showDistance && distanceKm !== null ? (
              <Text style={[styles.pillText, online && styles.pillTextWithDot]}>
                {formatDistanceKm(distanceKm)}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View style={styles.pinBox}>
          {isActive ? <View style={styles.pinRing} /> : null}
          <View style={[styles.pin, isActive && styles.pinActive]}>
            {vehicle.iconMap === null ? (
              <Text style={[styles.pinFallback, isActive && styles.pinFallbackActive]}>🛻</Text>
            ) : (
              <Image
                source={{ uri: vehicle.iconMap }}
                style={isActive ? styles.iconActive : styles.icon}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </View>
    </Marker>
  );
}

/**
 * The single "you are here" marker, restyled to approve-ui/map: a blue dot
 * with an inner white core, a lightweight infinite pulse ring and the navy
 * "You are here" tooltip. `showsUserLocation` stays false — there is exactly
 * ONE user representation (the legacy duplicate dot is not reintroduced).
 *
 * The pulse is one `Animated.loop` over a single value (transform + opacity,
 * native driver). It runs only while mounted and is stopped on unmount.
 */
export function UserLocationMarker({ coords }: { coords: UserCoords }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  // Approve-ui keyframes: scale 0.95 → 1.6 at 50% while opacity fades 0.85 → 0.
  const ringScale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.95, 1.6, 0.95],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.85, 0, 0],
  });

  return (
    <Marker
      coordinate={coords}
      anchor={{ x: 0.5, y: 0.37 }}
      // The marker's animated child changes every frame, so it must keep
      // tracking view changes (one marker — acceptable, see 6B notes).
      tracksViewChanges
    >
      <View accessible accessibilityLabel="You are here" style={styles.userWrap}>
        <View style={styles.userStage}>
          <Animated.View
            style={[
              styles.userPulse,
              { opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
          />
          <View style={styles.userDot}>
            <View style={styles.userDotCore} />
          </View>
        </View>
        <Text style={styles.userLabel}>You are here</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerWrap: {
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 3,
    elevation: 2,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
  },
  pillText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
    color: colors.title,
  },
  pillTextWithDot: {
    marginLeft: 3,
  },
  pinBox: {
    width: PIN_BOX,
    height: PIN_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 17,
    borderWidth: 4,
    borderColor: 'rgba(233, 163, 25, 0.35)', // approve-ui `ring-4 ring-yamakGold/30`
  },
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.wordmark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
  },
  pinActive: {
    width: PIN_ACTIVE_SIZE,
    height: PIN_ACTIVE_SIZE,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.wordmark,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconActive: {
    width: ICON_ACTIVE_SIZE,
    height: ICON_ACTIVE_SIZE,
  },
  pinFallback: {
    fontSize: 18,
    lineHeight: 20,
  },
  pinFallbackActive: {
    fontSize: 20,
    lineHeight: 24,
  },
  userWrap: {
    alignItems: 'center',
  },
  userStage: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.userMarkerPulse,
  },
  userDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.userMarker,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  userLabel: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.navyDeep,
    color: colors.surface,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
});