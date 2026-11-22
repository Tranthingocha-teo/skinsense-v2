import * as Linking from 'expo-linking';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { completeOAuthRedirectUrl, getRouteForRole } from '@/lib/auth';

/**
 * Handles `skinsense://auth/callback` deep links when Android delivers an OAuth callback
 * directly to the app task instead of WebBrowser's in-flight auth session.
 */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function finishAuth() {
      try {
        if (params.error_description) {
          throw new Error(String(params.error_description));
        }
        const initialUrl = await Linking.getInitialURL().catch(() => null);
        const targetUrl =
          initialUrl && (initialUrl.includes('code=') || initialUrl.includes('access_token='))
            ? initialUrl
            : params.code
            ? `skinsense://auth/callback?code=${encodeURIComponent(String(params.code))}`
            : null;
        if (!targetUrl) {
          router.replace('/sign-in' as Href);
          return;
        }
        const user = await completeOAuthRedirectUrl(targetUrl);
        if (!cancelled) {
          router.replace(getRouteForRole(user));
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : 'Xác thực Google thất bại.');
        }
      }
    }
    void finishAuth();
    return () => {
      cancelled = true;
    };
  }, [params.code, params.error_description]);

  return (
    <View className="flex-1 items-center justify-center bg-background p-6 gap-3">
      {errorMsg ? (
        <>
          <Text className="text-center text-[14px] text-destructive">{errorMsg}</Text>
          <Pressable
            role="button"
            onPress={() => router.replace('/sign-in' as Href)}
            className="rounded-control bg-primary px-5 py-2.5"
          >
            <Text className="text-[13.5px] font-semibold text-primary-foreground">Quay lại đăng nhập</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator />
          <Text className="text-[13px] text-muted-foreground">Đang hoàn tất đăng nhập...</Text>
        </>
      )}
    </View>
  );
}
