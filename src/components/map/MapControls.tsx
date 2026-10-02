import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';

import { colors, interactionOpacity, radius } from '@/theme';

/** MapView-supported modes exposed by the Layers control (no custom system). */
export type MapType = 'standard' | 'satellite' | 'hybrid';

export type MapControlsProps = {
  onRecenter: () => void;
  /**
   * True while no valid user position exists — Recenter is disabled and never
   * re-prompts for permission (the disabled control is the only feedback).
   */
  recenterDisabled: boolean;
  mapType: MapType;
  onCycleMapType: () => void;
  trafficEnabled: boolean;
  onToggleTraffic: () => void;
};

const MAP_TYPE_LABELS: Record<MapType, string> = {
  standard: 'STD',
  satellite: 'SAT',
  hybrid: 'HYB',
};

/** Approved crosshair — Recenter control. */
function RecenterIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
      <Line x1={12} y1={2} x2={12} y2={5} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={19} x2={12} y2={22} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={2} y1={12} x2={5} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={19} y1={12} x2={22} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Approved stacked-diamond layers icon — Layers control. */
function LayersIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="12 2 2 7 12 12 22 7 12 2"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Polyline points="2 17 12 22 22 17" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Polyline points="2 12 12 17 22 12" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * A tiny traffic-light glyph — coloured when the traffic layer is ON, grey
 * when OFF, so the toggle state is obvious at a glance.
 */
function TrafficLightsIcon({ on }: { on: boolean }) {
  const off = colors.placeholder;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx={12} cy={6} r={2.6} fill={on ? colors.error : off} />
      <Circle cx={12} cy={12} r={2.6} fill={on ? colors.amber : off} />
      <Circle cx={12} cy={18} r={2.6} fill={on ? colors.success : off} />
    </Svg>
  );
}

/**
 * Approved Map controls column (top-right over the map): Recenter · Layers ·
 * Traffic. Positions itself inside the Map frame (below the app bar, so no
 * status-bar inset is needed). `pointerEvents="box-none"` lets map pan/zoom
 * pass through the gaps between buttons.
 */
export function MapControls({
  onRecenter,
  recenterDisabled,
  mapType,
  onCycleMapType,
  trafficEnabled,
  onToggleTraffic,
}: MapControlsProps) {
  return (
    <View pointerEvents="box-none" style={styles.column}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recenter map"
        accessibilityState={{ disabled: recenterDisabled }}
        disabled={recenterDisabled}
        onPress={onRecenter}
        style={({ pressed }) => [
          styles.button,
          recenterDisabled && styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <RecenterIcon color={colors.navyDeep} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Map layers. Current: ${mapType}`}
        onPress={onCycleMapType}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <LayersIcon color={colors.fieldLabel} />
      </Pressable>
      {mapType !== 'standard' ? (
        <View style={styles.mapTypeLabel}>
          <Text style={styles.mapTypeLabelText}>{MAP_TYPE_LABELS[mapType]}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="switch"
        accessibilityLabel="Traffic layer"
        accessibilityState={{ checked: trafficEnabled }}
        onPress={onToggleTraffic}
        style={({ pressed }) => [
          styles.button,
          trafficEnabled && styles.buttonTrafficOn,
          pressed && styles.pressed,
        ]}
      >
        <TrafficLightsIcon on={trafficEnabled} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    top: 52,
    right: 12,
    alignItems: 'center',
    zIndex: 5,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#0C1E34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTrafficOn: {
    borderColor: colors.success,
    backgroundColor: colors.successTint,
  },
  pressed: {
    opacity: interactionOpacity.pressed,
  },
  mapTypeLabel: {
    marginTop: -4,
    marginBottom: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  mapTypeLabelText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.fieldLabel,
  },
});