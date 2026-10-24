import { PortalHost } from '@rn-primitives/portal';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import '@/i18n';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useSession } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const session = useSession();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {session !== undefined && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="sign-in" />
          </Stack.Protected>
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
      )}
      <PortalHost />
    </ThemeProvider>
  );
}
