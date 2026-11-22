import { View } from 'react-native';

import { PrescribedRoutineView } from '@/components/prescribed-routine';

export default function PrescribedScreen() {
  return (
    <View className="flex-1 bg-background">
      <PrescribedRoutineView />
    </View>
  );
}
