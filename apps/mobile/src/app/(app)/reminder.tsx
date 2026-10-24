import { View } from 'react-native';

import { Reminder } from '@/components/reminder';

// The component owns the top inset: the night tint runs under the status bar.
export default function ReminderScreen() {
  return (
    <View className="flex-1 bg-background">
      <Reminder />
    </View>
  );
}
