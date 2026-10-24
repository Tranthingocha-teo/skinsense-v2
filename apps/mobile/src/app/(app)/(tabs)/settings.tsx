import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NightTint } from '@/components/night-tint';
import { Settings } from '@/components/settings';
import { useDemoActive } from '@/lib/demo';

export default function SettingsScreen() {
  const isDemo = useDemoActive();
  return (
    <View className="flex-1 bg-background">
      <NightTint height={240} />
      <SafeAreaView edges={isDemo ? [] : ['top']} style={{ flex: 1 }}>
        <Settings />
      </SafeAreaView>
    </View>
  );
}
