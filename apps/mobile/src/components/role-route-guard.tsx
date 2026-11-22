import { canShopSignIn } from '@skinsense/domain';
import { router, type Href } from 'expo-router';
import { Home, LogOut, ShieldAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getRouteForRole, signOut, SUPER_ADMIN_EMAIL, useCurrentUser, type UserRole } from '@/lib/auth';

/**
 * Enforces Web-identical role access control on `/admin`, `/shop`, and `/specialist` routes.
 */
export function RoleRouteGuard({
  allowedRoles,
  title,
  children,
}: {
  allowedRoles: readonly UserRole[];
  title: string;
  children: ReactNode;
}) {
  const currentUser = useCurrentUser();
  const normalizedEmail = currentUser?.email?.trim().toLowerCase() ?? '';
  const isSuperAdmin =
    Boolean(currentUser?.isSuperAdmin) || normalizedEmail === SUPER_ADMIN_EMAIL;

  let deniedReason: string | null = null;

  if (!currentUser) {
    deniedReason = 'Vui lòng đăng nhập tài khoản được cấp quyền để truy cập trang này.';
  } else if (!isSuperAdmin && !allowedRoles.includes(currentUser.role)) {
    deniedReason = `Tài khoản hiện tại (${currentUser.role}) không có quyền truy cập ${title}.`;
  } else if (!isSuperAdmin && currentUser.role === 'shop' && allowedRoles.includes('shop')) {
    const check = canShopSignIn({
      role: currentUser.role,
      status: currentUser.status ?? 'pending',
      email: currentUser.email,
      fullName: currentUser.fullName,
    });
    if (!check.allowed) {
      deniedReason =
        check.reason ||
        'Hồ sơ Gian hàng đang chờ Super Admin phê duyệt trước khi truy cập Kênh Người Bán.';
    }
  }

  if (!deniedReason) {
    return <>{children}</>;
  }

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="w-full max-w-sm items-center gap-3 rounded-card border border-border bg-card p-6">
        <View className="size-12 items-center justify-center rounded-pill bg-destructive/10">
          <Icon as={ShieldAlert} size={24} className="text-destructive" />
        </View>
        <Text className="text-center font-display text-[19px] font-semibold text-foreground">
          Không đủ quyền truy cập
        </Text>
        <Text className="text-center text-[13px] leading-5 text-muted-foreground">
          {deniedReason}
        </Text>
        <View className="mt-2 w-full flex-row gap-2.5">
          <Pressable
            role="button"
            onPress={() =>
              router.replace(
                currentUser && currentUser.status === 'active'
                  ? getRouteForRole(currentUser)
                  : ('/(tabs)' as Href),
              )
            }
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-control border border-border bg-surface-2 py-3"
          >
            <Icon as={Home} size={15} className="text-foreground" />
            <Text className="text-[13px] font-medium text-foreground">Trang chính</Text>
          </Pressable>
          <Pressable
            role="button"
            onPress={async () => {
              await signOut();
              router.replace('/sign-in' as Href);
            }}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-control bg-primary py-3"
          >
            <Icon as={LogOut} size={15} className="text-primary-foreground" />
            <Text className="text-[13px] font-semibold text-primary-foreground">Đăng xuất</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
