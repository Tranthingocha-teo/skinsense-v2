import { color } from '@skinsense/tokens/tokens.json';
import { router } from 'expo-router';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resetDemoData, setDemoActive, useDemoActive } from '@/lib/demo';

export function DemoBanner() {
  const isDemo = useDemoActive();
  const insets = useSafeAreaInsets();
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];

  if (!isDemo) return null;

  async function handleReset() {
    await resetDemoData();
  }

  async function handleExit() {
    await setDemoActive(false);
    router.replace('/sign-in');
  }

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 12) + 4,
        backgroundColor: palette.surface,
        borderBottomColor: palette.line,
      }}
      className="z-50 flex-row items-center justify-between border-b px-4 pb-2.5"
    >
      <View className="flex-row items-center gap-2">
        <View style={{ backgroundColor: palette.good }} className="size-2 rounded-full" />
        <Text style={{ fontFamily: 'Manrope', color: palette.fg }} className="text-[12.5px] font-semibold">
          Dữ liệu mẫu
        </Text>
        <Text style={{ fontFamily: 'Manrope', color: palette.muted }} className="text-[11.5px] font-light">
          (Demo mode)
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Pressable
          role="button"
          onPress={handleReset}
          style={{ backgroundColor: palette['surface-2'], borderColor: palette.line }}
          className="rounded-[10px] border px-3 py-1.5 active:opacity-80"
        >
          <Text style={{ fontFamily: 'Manrope', color: palette.fg }} className="text-[12px] font-medium">
            Đặt lại
          </Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={handleExit}
          style={{ backgroundColor: palette.accent }}
          className="rounded-[10px] px-3.5 py-1.5 active:opacity-85"
        >
          <Text style={{ fontFamily: 'Manrope', color: palette['on-accent'] }} className="text-[12px] font-semibold">
            Đăng nhập
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
