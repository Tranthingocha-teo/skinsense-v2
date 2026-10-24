import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { resetDemoData, setDemoActive, useDemoActive } from '@/lib/demo';

export function DemoBanner() {
  const isDemo = useDemoActive();
  const insets = useSafeAreaInsets();

  if (!isDemo) return null;

  async function handleReset() {
    await resetDemoData();
  }

  async function handleExit() {
    await setDemoActive(false);
    router.replace('/sign-in');
  }

  return (
    <View style={[styles.banner, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
      <View style={styles.left}>
        <ThemedText type="smallBold" style={styles.title}>
          Dữ liệu mẫu
        </ThemedText>
        <ThemedText type="small" style={styles.note}>
          (Demo mode)
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Pressable role="button" onPress={handleReset} style={styles.resetButton}>
          <ThemedText type="small">Đặt lại</ThemedText>
        </Pressable>
        <Pressable role="button" onPress={handleExit} style={styles.signInButton}>
          <ThemedText type="smallBold" style={styles.signInText}>
            Đăng nhập
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 50,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    color: '#38BDF8',
  },
  note: {
    color: '#94A3B8',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  resetButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  signInButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#38BDF8',
  },
  signInText: {
    color: '#0F172A',
  },
});
