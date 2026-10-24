import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { About } from '@/components/about';
import { NightTint } from '@/components/night-tint';

export default function AboutScreen() {
  return (
    <View className="flex-1 bg-background">
      <NightTint height={300} />
      <SafeAreaView style={{ flex: 1 }}>
        <About />
      </SafeAreaView>
    </View>
  );
}
