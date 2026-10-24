import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoHistory } from '@/components/photo-history';

export default function HistoryScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <PhotoHistory />
      </SafeAreaView>
    </View>
  );
}
