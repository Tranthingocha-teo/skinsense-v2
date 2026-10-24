import { View } from 'react-native';

import { CustomerOrders } from '@/components/customer-orders';

export default function OrdersScreen() {
  return (
    <View className="flex-1 bg-background">
      <CustomerOrders />
    </View>
  );
}
