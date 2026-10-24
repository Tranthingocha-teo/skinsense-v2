import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarkSpots } from '@/components/mark-spots';

export default function SpotsScreen() {
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <MarkSpots photoId={photoId} />
      </SafeAreaView>
    </View>
  );
}
