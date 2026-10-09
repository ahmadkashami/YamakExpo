import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import {
  TAB_ICON_COLUMN_HEIGHT,
  TabIcon,
  type TabIconName,
} from '@/components/navigation/TabIcons';
import { colors, fontWeight } from '@/theme';

/**
 * AUTHENTICATED BOTTOM TABS — Phase A / Step A5.2.
 *
 * This layout is the shell the `(tabs)` group has been waiting for. Adding it
 * turns the three existing screens into bottom tabs WITHOUT moving, renaming or
 * re-URL-ing a single file: `/home`, `/map` and `/profile` keep the exact hrefs
 * they already had, so `AUTHENTICATED_ENTRY_ROUTE` (`/home`) and every A1/A2/A3
 * navigation stay valid and untouched.
 *
 * `src/app/(app)/vehicle/[id].tsx` deliberately stays in `(app)`, OUTSIDE this
 * group. `(app)`'s `<Slot />` then renders either this tab navigator or the
 * vehicle screen — never both — so the tab bar is structurally absent on the
 * details screen with no `href: null`, no `display: 'none'` and no conditional
 * styling.
 *
 * `Tabs` is imported from `expo-router/js-tabs`, the non-deprecated spelling
 * for the installed `expo-router` (the root `expo-router` export of the same
 * component is flagged `@deprecated`). There is no `NavigationContainer`, no
 * `createBottomTabNavigator` and no manual React Navigation root — this file is
 * only a navigator configuration.
 *
 * ## Screen order is declared, never inferred
 *
 * The three screens are declared explicitly and in the approved order. This is
 * mandatory, not stylistic: with no `<Tabs.Screen>` children, Expo Router appends
 * the matched files sorted by `sortRoutes`' default comparator, which is
 * `a.route.length - b.route.length` — by STRING LENGTH, not alphabetically. That
 * would silently produce Map (3) → Home (4) → Profile (7). The declarations below
 * are the only thing keeping the approved Home · Map · Profile order.
 *
 * ## Approved visual source
 *
 * There is no dedicated approved tabs design; the bar is specified inside the two
 * approved screens that contain it:
 * `docs/rebuild/approve-ui/home/code.html:409-444` (`data-purpose="bottom-tab-navigation"`)
 * and `docs/rebuild/approve-ui/map/code.html:334-362` (`data-purpose="bottom-nav"`).
 * Both agree: white surface, slate-200 top border, subtle lift, navy active icon +
 * label, muted inactive icon + label, a tiny gold dot above the active tab, and an
 * icon + label pair.
 *
 * INTENTIONAL DIVERGENCE — both approved mocks show FOUR tabs (Home · Map ·
 * Services · Profile). "Services" is a quick-grid tab with no route and no screen
 * anywhere in the project, so it is NOT implemented here. The functional target is
 * exactly Home · Map · Profile; no placeholder and no hidden fourth tab is added.
 */

/** Approved `mt-0.5` between the icon and its label (Tailwind = 2px). */
const LABEL_GAP = 2;

/** Approved label type — `text-[11px]`, `font-bold` active / `font-medium` inactive. */
const LABEL_FONT_SIZE = 11;
const LABEL_LINE_HEIGHT = 15;

/**
 * Bar height.
 *
 * Deliberately a `minHeight`, NOT a `height`: the tab bar adds
 * `insets.bottom` to its own height, and `getTabBarHeight` returns a numeric
 * `tabBarStyle.height` verbatim — which would silently drop the bottom safe-area
 * inset. `minHeight` only grows the bar past its default when the approved
 * dot + icon + label stack needs the room, leaving the inset arithmetic intact.
 * `58` sits inside the 56–64 range proposed by
 * `docs/rebuild/new-ui/design-system/navigation.md` section 3.
 */
const TAB_BAR_MIN_HEIGHT = 58;

/**
 * Approved tab label. Rendered as a function so the weight can follow the focused
 * state, which a static `tabBarLabelStyle` cannot express.
 */
function TabLabel({ focused, children, color }: { focused: boolean; children: string; color: ColorValue }) {
  return (
    <Text
      style={[
        styles.label,
        focused ? styles.labelActive : styles.labelInactive,
        { color },
      ]}
    >
      {children}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        // Approved bar: `bg-white/95` + `border-t border-slate-200` + `shadow-nav`.
        tabBarStyle: styles.bar,
        // Approved active `#0B2A4A` (yamakNavy) and inactive `text-slate-400`.
        // These two tokens are the ONLY colour source for the bar: the navigator
        // passes them to the icon, the icon's dot slot and the label alike.
        tabBarActiveTintColor: colors.navyDeep,
        tabBarInactiveTintColor: colors.subtitle,
        // The approved bar is vertical (icon above label). Pinning this keeps a
        // landscape phone from silently switching to side-by-side labels.
        tabBarLabelPosition: 'below-icon',
        tabBarIconStyle: styles.iconColumn,
        tabBarLabel: ({ focused, children, color }) => (
          <TabLabel focused={focused} color={color}>
            {children}
          </TabLabel>
        ),
      }}
    >
      {/* Order below IS the visible tab order: Home | Map | Profile. */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: tabBarIcon('home'),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: tabBarIcon('map'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabBarIcon('profile'),
        }}
      />
    </Tabs>
  );
}

/**
 * Builds the per-tab icon renderer. The navigator calls this twice per tab (once
 * with `focused: true`, once with `false`) and cross-fades the two, so the gold
 * dot appears only on the focused copy without any animation or state of our own.
 */
function tabBarIcon(name: TabIconName) {
  return function TabBarIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <TabIcon name={name} focused={focused} color={color} />;
  };
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    minHeight: TAB_BAR_MIN_HEIGHT,
    // Subtle lift, matching the app-wide shadow idiom already used by the Map and
    // Vehicle Details surfaces (`shadowColor` there is the same navy family).
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  iconColumn: {
    height: TAB_ICON_COLUMN_HEIGHT,
  },
  label: {
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_LINE_HEIGHT,
    marginTop: LABEL_GAP,
    textAlign: 'center',
  },
  labelActive: {
    fontWeight: fontWeight.bold,
  },
  labelInactive: {
    fontWeight: fontWeight.medium,
  },
});
