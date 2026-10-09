import Constants from 'expo-constants';
import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { usePathname, useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth';
import { colors, fontWeight, radius, spacing } from '@/theme';

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
type DrawerRoute = { href: Href; label: string };

const DRAWER_ROUTES: readonly DrawerRoute[] = [
  { href: '/home', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/profile', label: 'Profile' },
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
 * A7.2 functional drawer content.
 *
 * - Identity header: initials + name + email straight from AuthProvider (the
 *   session user already carries both) — no image fetch, no profile API, no
 *   fake avatar, no invented "online" pill (legacy hardcoded one).
 * - Menu: Home · Map · Profile with the focused row highlighted.
 * - Footer: truthful app version from `expo-constants` (fixes the legacy
 *   undefined-version defect); no footer at all if the config version is
 *   unavailable — never invented data.
 *
 * Presentation is minimal on purpose; the A7.6 design review + A7.7 define the
 * final look (approved drawer design pending at `docs/rebuild/approve-ui/`).
 */
export function AppDrawerContent({ navigation }: DrawerContentComponentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    <DrawerContentScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(displayName)}</Text>
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
              activeTintColor={colors.brandText}
              activeBackgroundColor={colors.navyDeep}
              inactiveTintColor={colors.title}
              labelStyle={styles.itemLabel}
              style={styles.item}
            />
          );
        })}
      </View>

      {appVersion === null ? null : (
        <View style={styles.footer}>
          <Text style={styles.version}>Version {appVersion}</Text>
        </View>
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  identity: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.navyDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeight.bold,
    color: colors.brandText,
  },
  name: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeight.semibold,
    color: colors.title,
    textAlign: 'center',
  },
  email: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.regular,
    color: colors.subtitle,
    textAlign: 'center',
  },
  menu: {
    flex: 1,
  },
  item: {
    marginHorizontal: spacing.xs,
  },
  itemLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  version: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
    color: colors.subtitle,
  },
});