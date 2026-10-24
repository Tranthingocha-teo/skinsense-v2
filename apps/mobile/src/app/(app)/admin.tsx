import { View } from 'react-native';

import { AdminPortal } from '@/components/admin-portal';

export default function AdminScreen() {
  return (
    <View className="flex-1 bg-background">
      <AdminPortal />
    </View>
  );
}
