import { useCallback } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth';
import { colors } from '@/theme/colors';
import { fontWeight } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

const YAMAK_WEBSITE_URL = 'https://yamak-kw.com';
const POWERED_BY_YAMAK_URL = 'https://yamak-kw.com';

type ProfileMenuItemProps = {
  label: string;
  onPress: () => void;
  testID?: string;
  external?: boolean;
};

function ProfileMenuItem({ label, onPress, testID, external = false }: ProfileMenuItemProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      accessibilityRole="button"
      accessibilityLabel={external ? `${label} (opens in browser)` : label}
    >
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.chevron}>{'›'}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }, [signOut]);

  const handleShareApp = useCallback(async () => {
    try {
      await Share.share({
        message: `Try Yamak — Kuwait road assistance support\n${YAMAK_WEBSITE_URL}`,
      });
    } catch (error) {
      // Silently ignore; Share API can throw in some environments
      console.warn('Share cancelled or failed', error);
    }
  }, []);

  const handleOpenUrl = useCallback(async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn('Failed to open URL', error);
    }
  }, []);

  const handleAboutUs = useCallback(() => {
    void handleOpenUrl(YAMAK_WEBSITE_URL);
  }, [handleOpenUrl]);

  const handlePoweredBy = useCallback(() => {
    void handleOpenUrl(POWERED_BY_YAMAK_URL);
  }, [handleOpenUrl]);

  const displayName = user?.name ?? '';
  const displayEmail = user?.email ?? '';
  const initials = displayName
    ? displayName
        .split(' ')
        .filter(Boolean)
        .map(part => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('')
    : 'YA';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={styles.identityTextWrap}>
          {displayName ? <Text style={styles.userName}>{displayName}</Text> : null}
          {displayEmail ? <Text style={styles.userEmail}>{displayEmail}</Text> : null}
        </View>
      </View>

      <View style={styles.menu}>
        <ProfileMenuItem label="Share" onPress={handleShareApp} testID="menu-share" />
        <ProfileMenuItem
          label="About Us"
          onPress={handleAboutUs}
          external
          testID="menu-about-us"
        />
        <ProfileMenuItem
          label="Powered By Yamak"
          onPress={handlePoweredBy}
          external
          testID="menu-powered-by"
        />
        <ProfileMenuItem label="Logout" onPress={handleLogout} testID="menu-logout" />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered By Yamak</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 1.5,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.surface,
  },
  avatarInitials: {
    fontWeight: fontWeight.bold,
    fontSize: 36,
    color: colors.brandText,
  },
  identityTextWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  userName: {
    color: colors.title,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  userEmail: {
    color: colors.subtitle,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: 'black',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuItemPressed: {
    opacity: 0.6,
  },
  menuLabel: {
    fontSize: 16,
    color: colors.title,
    fontWeight: fontWeight.medium,
  },
  chevron: {
    fontSize: 24,
    color: colors.subtitle,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    color: colors.subtitle,
    fontSize: 12,
    fontWeight: fontWeight.medium,
  },
});
