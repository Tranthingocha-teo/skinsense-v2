import { View } from 'react-native';

import { RoleRouteGuard } from '@/components/role-route-guard';
import { ShopPortal } from '@/components/shop-portal';

export default function ShopScreen() {
  return (
    <View className="flex-1 bg-background">
      <RoleRouteGuard allowedRoles={['shop', 'admin']} title="Kênh Người Bán (Shop)">
        <ShopPortal />
      </RoleRouteGuard>
    </View>
  );
}
