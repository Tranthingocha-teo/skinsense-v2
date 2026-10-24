import { View } from 'react-native';

import { Feedback } from '@/components/feedback';

// The component owns the top inset: its sent state runs the night tint under the status bar.
export default function FeedbackScreen() {
  return (
    <View className="flex-1 bg-background">
      <Feedback />
    </View>
  );
}
