import { View } from 'react-native';

import { AdminPortal } from '@/components/admin-portal';
import { RoleRouteGuard } from '@/components/role-route-guard';

export default function AdminScreen() {
  return (
    <View className="flex-1 bg-background">
      <RoleRouteGuard allowedRoles={['admin']} title="Cổng Quản Trị Hệ Thống (Admin)">
        <AdminPortal />
      </RoleRouteGuard>
    </View>
  );
}
