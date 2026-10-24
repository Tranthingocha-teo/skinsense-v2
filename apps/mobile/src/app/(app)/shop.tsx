import { View } from 'react-native';

import { ShopPortal } from '@/components/shop-portal';

export default function ShopScreen() {
  return (
    <View className="flex-1 bg-background">
      <ShopPortal />
    </View>
  );
}
