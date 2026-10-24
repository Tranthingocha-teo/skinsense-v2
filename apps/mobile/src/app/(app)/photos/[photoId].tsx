import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoDetail } from '@/components/photo-detail';

export default function PhotoScreen() {
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <PhotoDetail photoId={photoId} />
      </SafeAreaView>
    </View>
  );
}
