import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/auth';

// Hold the native splash until the stored session has been restored, so no route
// can render against an unresolved auth state. Must run at module scope; calling
// it from a component can run too late, once the splash already auto-hid.
void SplashScreen.preventAutoHideAsync();

function AuthReadyLayout() {
  const { status } = useAuth();
  const hasHiddenSplash = useRef(false);

  useEffect(() => {
    if (status === 'loading' || hasHiddenSplash.current) {
      return;
    }

    hasHiddenSplash.current = true;
    SplashScreen.hideAsync().catch(() => {
      // The splash was already hidden; there is nothing to recover from.
    });
  }, [status]);

  if (status === 'loading') {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <AuthProvider>
        <AuthReadyLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
