import { useIsFocused } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Capture } from '@/components/capture';
import { useDemoActive } from '@/lib/demo';

export default function CaptureScreen() {
  // Tabs stay mounted; unmount on blur so the camera and its timers stop.
  const focused = useIsFocused();
  const isDemo = useDemoActive();
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={isDemo ? [] : ['top']} style={{ flex: 1 }}>
        {focused && <Capture />}
      </SafeAreaView>
    </View>
  );
}
