import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { DemoBanner } from '@/components/demo-banner';
import { Onboarding, useOnboarded } from '@/components/onboarding';
import { setStaffTodayViewMode, useCurrentUser } from '@/lib/auth';
import { useDemoActive } from '@/lib/demo';

// Gives the signed-in group its own navigator so the root's `Stack.Screen name="(app)"`
// covers every screen in it, not only index.
export default function AppLayout() {
  const { t } = useTranslation();
  const [onboarded, finishOnboarding] = useOnboarded();
  const currentUser = useCurrentUser();
  const isDemo = useDemoActive();
  const isStaffRole =
    !isDemo &&
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'specialist' ||
      currentUser?.role === 'shop');

  useEffect(() => {
    if (isStaffRole) {
      setStaffTodayViewMode('skin');
    }
  }, [currentUser?.id, isStaffRole]);

  // Long-press icon shortcuts; routed from this sub-layout, not the root (library's rule).
  useQuickActionRouting();
  useEffect(() => {
    QuickActions.setItems([
      { id: 'capture', title: t('nav.capture'), params: { href: '/capture' } },
      { id: 'routine', title: t('nav.routine'), params: { href: '/routine' } },
    ]).catch(() => {});
  }, [t]);

  // First sign-in on customer device: onboarding stands in for the navigator until done;
  // staff roles (Admin / Specialist / Shop) and explicit signed-in accounts go straight in.
  const hasAuthenticatedAccount = Boolean(currentUser?.id) || isDemo;
  if (onboarded === null && !isStaffRole && !hasAuthenticatedAccount) return null;
  if (!onboarded && !isStaffRole && !hasAuthenticatedAccount) {
    return <Onboarding onDone={finishOnboarding} />;
  }
  return (
    <View style={styles.container}>
      <DemoBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
