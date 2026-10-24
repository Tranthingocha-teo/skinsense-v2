import { useIsFocused } from 'expo-router';
import { View } from 'react-native';

import { Today } from '@/components/today';

export default function TodayScreen() {
  // Tabs stay mounted; remounting on focus reloads photos, streaks and the routine
  // after Chụp, /routine or spot marking changed them.
  const focused = useIsFocused();
  // No SafeAreaView: the photo band runs under the status bar and Today pads by the inset.
  // The tab bar already pads the bottom inset.
  return <View className="flex-1 bg-background">{focused && <Today />}</View>;
}
