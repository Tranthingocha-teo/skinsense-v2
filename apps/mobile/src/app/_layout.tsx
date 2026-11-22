import { PortalHost } from '@rn-primitives/portal';
import {
  DarkTheme,
  DefaultTheme,
  router,
  Stack,
  ThemeProvider,
  useSegments,
  type Href,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import '@/global.css';
import '@/i18n';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useSession } from '@/lib/auth';
import { useDemoActive } from '@/lib/demo';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const session = useSession();
  const isDemo = useDemoActive();
  const isAllowed = !!session || isDemo;
  const segments = useSegments();
  const firstSegment = segments[0];

  useEffect(() => {
    if (session === undefined) return;
    const inAuthScreen = firstSegment === 'sign-in' || firstSegment === 'auth';
    if (!isAllowed && !inAuthScreen) {
      router.replace('/sign-in' as Href);
    }
  }, [session, isAllowed, firstSegment]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {session !== undefined && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="sign-in" />
        </Stack>
      )}
      <PortalHost />
    </ThemeProvider>
  );
}
