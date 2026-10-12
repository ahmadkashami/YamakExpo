import Constants from 'expo-constants';
import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { usePathname, useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth';
import { colors, fontWeight, interactionOpacity, radius, spacing } from '@/theme';
import { TabGlyph, type TabIconName } from './TabIcons';

/**
 * First-release drawer menu — ALL REAL ROUTES, no dead rows (project rule).
 * Home / Map / Profile are the same entries the tab bar already provides
 * (the legacy drawer was exactly this shell). Favorites / Notifications are
 * deliberately absent: their routes do not exist yet and no placeholder row is
 * added (A7.1 approved decision).
 *
 * Share / Sign out / Language are also deliberately absent — they live in the
 * Profile hub (A4) and the legacy drawer's duplicates were rejected (A7.1
 * approved decision: version-only footer, no duplicate Share, no duplicate
 * Sign Out).
 */
type DrawerRoute = { href: Href; label: string; icon: TabIconName };

const DRAWER_ROUTES: readonly DrawerRoute[] = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/map', label: 'Map', icon: 'map' },
  { href: '/profile', label: 'Profile', icon: 'profile' },
];

/** Same initials logic the Profile hub (A4) already uses — replicated, not shared. */
function initialsOf(name: string): string {
  if (name.length === 0) {
    return 'YA';
  }
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * A7.2 functional drawer content — A7.7 approved visual language (design
 * authority: `docs/rebuild/approve-ui/drawer/APPROVED-DRAWER-SPEC.md`).
 *
 * - Identity cap: full-bleed navy band (`colors.navyDeep`) carrying the
 *   safe-area top inset, with the glass/ gold-ring initials avatar plus the
 *   name + email straight from AuthProvider. No profile API, no image fetch,
 *   no fake avatar, no invented "online" pill (legacy hardcoded one).
 * - Menu: Home · Map · Profile on a white body; focused row = gold-tint card
 *   with a logical 3dp gold leading edge + navy content (NOT a full navy fill).
 * - Footer: truthful app version from `expo-constants` (fixes the legacy
 *   undefined-version defect); no footer at all if the config version is
 *   unavailable — never invented data.
 *
 * Behaviour is UNCHANGED from A7.3: same routes, same active-key logic, same
 * `OPEN_DRAWER` / `CLOSE_DRAWER` contract, same version source.
 */
export function AppDrawerContent({ navigation }: DrawerContentComponentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const displayName = user?.name ?? '';
  const displayEmail = user?.email ?? '';
  const appVersion = Constants.expoConfig?.version ?? null;

  const handleNavigate = (href: Href, focused: boolean) => {
    // Navigation first (only when the target is not already focused), then an
    // explicit CLOSE_DRAWER: this drawer has a single `(tabs)` route, so a tab
    // switch inside it never changes the drawer's own route state — which is
    // the state change a default drawer relies on to auto-close.
    if (!focused) {
      router.navigate(href);
    }
    navigation.dispatch({ type: 'CLOSE_DRAWER' });
  };

  return (
    // `DrawerContentScrollView` injects `paddingTop/Bottom/Start/End` from the
    // safe-area insets. We zero it here so the navy cap can bleed to the very
    // top edge and re-apply the insets ourselves (top inside the cap, bottom
    // inside the footer) — no double insets, no visible white sliver.
    <DrawerContentScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.cap, { paddingTop: insets.top + spacing.lg }]}>
        {/* Decorative: the initials are a visual echo of `displayName`, which
            is read separately — hiding them keeps the header from being
            announced twice. */}
        <View accessible={false} style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(displayName)}</Text>
          </View>
        </View>
        {displayName.length === 0 ? null : <Text style={styles.name}>{displayName}</Text>}
        {displayEmail.length === 0 ? null : <Text style={styles.email}>{displayEmail}</Text>}
      </View>

      <View style={styles.menu}>
        {DRAWER_ROUTES.map((route) => {
          const focused = pathname === route.href;
          return (
            <DrawerItem
              key={route.label}
              label={route.label}
              focused={focused}
              onPress={() => handleNavigate(route.href, focused)}
              activeTintColor={colors.navyDeep}
              inactiveTintColor={colors.fieldText}
              activeBackgroundColor={colors.goldTint}
              labelStyle={focused ? styles.itemLabelActive : styles.itemLabel}
              style={focused ? styles.itemActive : styles.item}
              pressOpacity={interactionOpacity.pressed}
              // The vendored DrawerItem already renders `role="button"` and
              // `aria-selected`; an explicit label keeps the row name
              // meaningful even though the text is already visible.
              accessibilityLabel={route.label}
              // Same glyph set the bottom tabs use (20pt). The drawer has no
              // gold indicator dot, so it renders the bare `TabGlyph` and picks
              // its own colour: navy when focused, muted otherwise.
              icon={({ focused: itemFocused }) => (
                <TabGlyph
                  name={route.icon}
                  color={itemFocused ? colors.navyDeep : colors.subtitle}
                />
              )}
            />
          );
        })}
      </View>

      {appVersion === null ? null : (
        <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
          <Text style={styles.version}>Version {appVersion}</Text>
        </View>
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    // `flexGrow` keeps the `menu: flex 1` spacer working so the footer sits at
    // the bottom; the zeroed paddings let the cap bleed to the top/sides (the
    // component's own safe-area padding is re-applied inside cap/footer).
    flexGrow: 1,
    paddingTop: 0,
    paddingBottom: 0,
    paddingStart: 0,
    paddingEnd: 0,
  },
  cap: {
    backgroundColor: colors.navyDeep,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.wordmark,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeight.bold,
    color: colors.brandText,
  },
  name: {
    marginTop: spacing.md,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeight.semibold,
    color: colors.brandText,
    textAlign: 'center',
  },
  email: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.regular,
    color: colors.tagline,
    textAlign: 'center',
  },
  menu: {
    flex: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  item: {
    borderRadius: radius.md,
    minHeight: 52,
  },
  itemActive: {
    borderRadius: radius.md,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.goldTintBorder,
    // Logical leading edge → mirrors automatically under RTL. A real 3dp gold
    // bar rather than a corner-radius-sensitive absolute child.
    borderStartWidth: 3,
    borderStartColor: colors.wordmark,
  },
  itemLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  itemLabelActive: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
    color: colors.subtitle,
  },
});
