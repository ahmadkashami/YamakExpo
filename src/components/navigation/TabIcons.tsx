import type { ColorValue } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, spacing } from '@/theme';

/** The three approved bottom tabs. There is deliberately no fourth tab. */
export type TabIconName = 'home' | 'map' | 'profile';

export type TabIconProps = {
  name: TabIconName;
  /** True for the focused tab; drives the approved gold indicator dot. */
  focused: boolean;
  /**
   * Resolved by the tab navigator from `tabBarActiveTintColor` /
   * `tabBarInactiveTintColor`, so the icon always matches its label.
   */
  color: ColorValue;
};

/** Approved icon box — every tab icon is `w-5 h-5` (20pt). */
export const TAB_ICON_SIZE = 20;

/** Approved active indicator — `w-1.5 h-1.5 rounded-full`. */
const ACTIVE_DOT_SIZE = 6;

/**
 * Height of one tab's icon column: indicator slot + approved `mb-1` gap + icon.
 *
 * `TabBarIcon` renders each icon inside a fixed 28pt box, so the layout passes
 * this to `tabBarIconStyle`; the approved stack then fits exactly instead of
 * overflowing the box by a pixel.
 */
export const TAB_ICON_COLUMN_HEIGHT = ACTIVE_DOT_SIZE + spacing.xs + TAB_ICON_SIZE;

/**
 * Home — approved solid house (`approve-ui/home/code.html:416-418`,
 * `fill-[#0B2A4A]`, `viewBox 0 0 24 24`).
 */
function HomeGlyph({ color }: { color: ColorValue }) {
  return (
    <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24">
      <Path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" fill={color} />
    </Svg>
  );
}

/**
 * Map — approved Heroicons folded-map outline
 * (`approve-ui/home/code.html:424-426`: `fill="none" stroke="currentColor"
 * stroke-width="2"`, round caps and joins).
 */
function MapGlyph({ color }: { color: ColorValue }) {
  return (
    <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934a1.12 1.12 0 01-1.006 0L9.503 3.314a1.125 1.125 0 00-1.006 0L3.622 5.75A1.125 1.125 0 003 6.756v11.424c0 .836.88 1.38 1.628 1.006l3.869-1.934a1.12 1.12 0 011.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Profile — approved Material solid person (`approve-ui/home/code.html:438-440`,
 * `fill="currentColor"`, `viewBox 0 0 24 24`).
 */
function ProfileGlyph({ color }: { color: ColorValue }) {
  return (
    <Svg width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} viewBox="0 0 24 24">
      <Path
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        fill={color}
      />
    </Svg>
  );
}

function TabGlyph({ name, color }: { name: TabIconName; color: ColorValue }) {
  if (name === 'home') {
    return <HomeGlyph color={color} />;
  }

  if (name === 'map') {
    return <MapGlyph color={color} />;
  }

  return <ProfileGlyph color={color} />;
}

/**
 * One tab's icon column: approved gold indicator dot, icon, (label rendered
 * separately by the navigator).
 *
 * The dot slot is ALWAYS the same height and only its content is conditional.
 * The approved mock instead pads inactive tabs with `pt-2.5`
 * (`approve-ui/home/code.html:423,430,437`), which visually shifts inactive
 * icons and labels out of line with the active one; a reserved slot keeps the
 * icon and the label on identical baselines in every state without any padding
 * fudge.
 *
 * Hidden from screen readers on purpose: the tab's accessible name is its text
 * label, and the built-in `role="tab"` / `aria-selected` on the tab button
 * already conveys the selected state, so the glyph and the dot must not add
 * anything to it.
 */
export function TabIcon({ name, focused, color }: TabIconProps) {
  return (
    <View
      style={styles.column}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.dotSlot}>{focused ? <View style={styles.dot} /> : null}</View>
      <TabGlyph name={name} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSlot: {
    height: ACTIVE_DOT_SIZE,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: ACTIVE_DOT_SIZE,
    height: ACTIVE_DOT_SIZE,
    borderRadius: ACTIVE_DOT_SIZE / 2,
    backgroundColor: colors.wordmark,
  },
});
