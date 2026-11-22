import { View } from 'react-native';

import { RoleRouteGuard } from '@/components/role-route-guard';
import { SpecialistPortal } from '@/components/specialist-portal';

export default function SpecialistScreen() {
  return (
    <View className="flex-1 bg-background">
      <RoleRouteGuard allowedRoles={['specialist', 'admin']} title="Cổng Bác Sĩ Chuyên Khoa">
        <SpecialistPortal />
      </RoleRouteGuard>
    </View>
  );
}
