import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { signInWithGoogleIdToken } from '@/lib/auth';
import { setDemoActive } from '@/lib/demo';
import { googleWebClientId } from '@/lib/env';

// The web app's public privacy page (ticket 11); update once apps/web has its Vercel domain.
const PRIVACY_URL = 'https://skinsense-v2.vercel.app/privacy';

// Android client IDs (ticket 01b) are matched by package name + SHA-1 on Google's
// side; the SDK only needs the Web client ID to mint an idToken Supabase accepts.
GoogleSignin.configure({ webClientId: googleWebClientId() });

export default function SignInScreen() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      if (result.type !== 'success') return;
      const { error } = await signInWithGoogleIdToken(result.data.idToken!);
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function tryDemo() {
    await setDemoActive(true);
    router.replace('/');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="title">{t('signIn.title')}</ThemedText>
        <ThemedText style={styles.center}>{t('signIn.subtitle')}</ThemedText>
        <Pressable onPress={signIn} role="button" style={styles.button}>
          <ThemedText type="smallBold">{t('signIn.button')}</ThemedText>
        </Pressable>
        <Pressable onPress={tryDemo} role="button" style={[styles.button, styles.demoButton]}>
          <ThemedText type="smallBold">Xem thử (dữ liệu mẫu)</ThemedText>
        </Pressable>
        {error && (
          <ThemedText type="small" style={styles.center}>
            {t('signIn.error', { message: error })}
          </ThemedText>
        )}
        <ExternalLink href={PRIVACY_URL}>
          <ThemedText type="small">{t('signIn.privacy')}</ThemedText>
        </ExternalLink>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  center: { textAlign: 'center' },
  button: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  demoButton: { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)' },
});
