import {
  canShopSignIn,
  filterProductsByShop,
  formatVnd,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { useRouter, type Href } from 'expo-router';
import {
  Camera,
  Clock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Mark } from '@/components/mark';
import { Icon } from '@/components/ui/icon';
import { AmbientBackdrop, type PortalTone } from '@/components/ui/portal-chrome';
import { Text } from '@/components/ui/text';
import {
  loadAdminOrdersRemote,
  loadAdminProductsRemote,
  loadAdminSpecialistsRemote,
  loadAdminUsersRemote,
  loadUserOrdersRemote,
  type AdminOrderRecordRemote,
  type AdminSpecialistRecordRemote,
  type AdminUserRecordRemote,
  type MarketplaceApiProduct,
  type RemoteUserOrderItem,
} from '@/lib/api';
import * as auth from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { useDemoActive } from '@/lib/demo';

const CARD = 'rounded-[20px] border border-border/80 bg-card';
const LABEL = 'text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground';

function WorkstationFrame({
  date,
  tone = 'botanical',
  children,
}: {
  date: string;
  tone?: PortalTone;
  children: ReactNode;
}) {
  const { top } = useSafeAreaInsets();
  const isDemo = useDemoActive();
  return (
    <View className="flex-1 bg-background">
      <AmbientBackdrop height={260} tone={tone} />
      <ScrollView
        contentContainerClassName="flex-grow gap-3 px-[18px] pb-32"
        contentContainerStyle={{ paddingTop: isDemo ? 16 : top + 16 }}
      >
        <View className="flex-row items-end justify-between px-1 pb-[14px]">
          <View className="gap-0.5">
            <Text className="text-[11px] font-medium uppercase tracking-[1.6px] text-muted-foreground">
              {date}
            </Text>
            <Text role="heading" aria-level="1" className="font-display text-[44px] font-light leading-[50px]">
              Hôm nay
            </Text>
          </View>
          <View className="items-end justify-end pb-2">
            <Mark size={40} />
          </View>
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

/**
 * Super Admin Today Overview backed directly by Web `/api/admin/*` endpoints.
 */
export function AdminTodayWorkstation({ user, date }: { user: AuthUser; date: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrderRecordRemote[]>([]);
  const [users, setUsers] = useState<AdminUserRecordRemote[]>([]);
  const [products, setProducts] = useState<MarketplaceApiProduct[]>([]);
  const [specialists, setSpecialists] = useState<AdminSpecialistRecordRemote[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [oRes, uRes, pRes, sRes] = await Promise.all([
      loadAdminOrdersRemote(),
      loadAdminUsersRemote(),
      loadAdminProductsRemote(),
      loadAdminSpecialistsRemote(),
    ]);

    if (!oRes.ok && !uRes.ok) {
      setError(oRes.error || uRes.error || 'Không thể đồng bộ dữ liệu Quản trị viên.');
    }

    setOrders(Array.isArray(oRes.data?.orders) ? oRes.data.orders : []);
    setUsers(Array.isArray(uRes.data?.users) ? uRes.data.users : []);
    setProducts(Array.isArray(pRes.data?.products) ? pRes.data.products : []);
    setSpecialists(Array.isArray(sRes.data?.specialists) ? sRes.data.specialists : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const activeShopsCount = users.filter((u) => u.role === 'shop' && u.status === 'active').length;
  const pendingShopsCount = users.filter((u) => u.role === 'shop' && u.status === 'pending').length;
  const activeDoctorsCount = specialists.filter((s) => s.status === 'active').length;
  const pendingDoctorsCount = specialists.filter((s) => s.status === 'pending').length;
  const pendingProductsCount = products.filter((p) => p.status === 'pending').length;

  return (
    <WorkstationFrame date={date} tone="gold">
      <View className={`gap-3 p-5 ${CARD}`}>
        <View className="flex-row items-center justify-between gap-2.5">
          <View className="flex-1 flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-[14px] border border-amber-400/30 bg-amber-400/12">
              <Icon as={ShieldCheck} size={19} strokeWidth={1.6} className="text-amber-400" />
            </View>
            <View className="flex-1">
              <Text className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-amber-400">
                Quản Trị Viên Tối Cao
              </Text>
              <Text numberOfLines={1} className="font-display text-[19px] font-normal text-foreground">
                {user.fullName}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Pressable
              role="button"
              accessibilityLabel="Mở trang soi da"
              onPress={() => {
                if (typeof auth.setStaffTodayViewMode === 'function') {
                  auth.setStaffTodayViewMode('skin');
                }
              }}
              className="h-9 flex-row items-center gap-1 rounded-[12px] border border-emerald-500/40 bg-emerald-500/15 px-2.5 active:scale-[0.96]"
            >
              <Icon as={Camera} size={13} className="text-emerald-500" />
              <Text className="text-[11px] font-semibold text-emerald-500">Soi da</Text>
            </Pressable>
            <Pressable
              role="button"
              accessibilityLabel="Làm mới"
              onPress={() => void loadData()}
              className="size-9 items-center justify-center rounded-[12px] border border-border/80 bg-surface-2 active:scale-[0.96]"
            >
              <Icon as={RefreshCw} size={15} className="text-foreground" />
            </Pressable>
            <Pressable
              role="button"
              accessibilityLabel="Đăng xuất"
              onPress={async () => {
                if (typeof auth.signOut === 'function') await auth.signOut();
                router.replace('/sign-in' as Href);
              }}
              className="size-9 items-center justify-center rounded-[12px] border border-border/80 bg-surface-2 active:scale-[0.96]"
            >
              <Icon as={LogOut} size={15} className="text-destructive" />
            </Pressable>
          </View>
        </View>
        <Text className="text-[13px] font-light text-muted-foreground">
          Bảng điều khiển trung tâm đồng bộ trực tiếp từ hệ thống SkinSense
        </Text>
      </View>

      {error && (
        <View className="rounded-[16px] border border-destructive/40 bg-destructive/10 p-3.5">
          <Text className="text-[12.5px] text-destructive">{error}</Text>
        </View>
      )}

      {loading ? (
        <View className={`items-center justify-center py-8 ${CARD}`}>
          <ActivityIndicator />
          <Text className="mt-2 text-[12.5px] text-muted-foreground">Đang đồng bộ số liệu toàn sàn...</Text>
        </View>
      ) : (
        <>
          <View className="flex-row flex-wrap gap-2.5">
            <View className={`flex-1 min-w-[46%] gap-1 p-4 ${CARD}`}>
              <Text className={LABEL}>Doanh thu toàn sàn</Text>
              <Text className="font-display text-[24px] font-normal text-success">
                {formatVnd(totalRevenue)}
              </Text>
              <Text className="text-[11px] font-light text-muted-foreground">
                {activeOrders.length} đơn hợp lệ
              </Text>
            </View>
            <View className={`flex-1 min-w-[46%] gap-1 p-4 ${CARD}`}>
              <Text className={LABEL}>Đơn hàng toàn sàn</Text>
              <Text className="font-display text-[24px] font-normal text-foreground">
                {orders.length} đơn
              </Text>
              <Text className="text-[11px] font-light text-muted-foreground">
                {pendingOrdersCount} đơn chờ xử lý
              </Text>
            </View>
            <View className={`flex-1 min-w-[46%] gap-1 p-4 ${CARD}`}>
              <Text className={LABEL}>Shop đối tác</Text>
              <Text className="font-display text-[24px] font-normal text-foreground">
                {activeShopsCount} shop
              </Text>
              <Text className="text-[11px] font-light text-muted-foreground">
                {pendingShopsCount} hồ sơ chờ duyệt
              </Text>
            </View>
            <View className={`flex-1 min-w-[46%] gap-1 p-4 ${CARD}`}>
              <Text className={LABEL}>Bác sĩ & Sản phẩm</Text>
              <Text className="font-display text-[24px] font-normal text-foreground">
                {activeDoctorsCount} bác sĩ
              </Text>
              <Text className="text-[11px] font-light text-muted-foreground">
                {pendingDoctorsCount} chờ CCHN · {products.length} SP · {pendingProductsCount} SP chờ
              </Text>
            </View>
          </View>

          <View className={`gap-3 p-4 ${CARD}`}>
            <Text className={LABEL}>Hoạt động toàn sàn gần nhất</Text>
            {orders.length === 0 ? (
              <Text className="text-[12.5px] font-light text-muted-foreground">
                Chưa có đơn hàng nào được ghi nhận trên hệ thống.
              </Text>
            ) : (
              <View className="gap-2.5">
                {orders.slice(0, 3).map((ord, idx) => (
                  <View
                    key={ord.id}
                    className={`flex-row items-center justify-between ${
                      idx < Math.min(orders.length, 3) - 1 ? 'border-b border-border/50 pb-2.5' : ''
                    }`}
                  >
                    <View className="flex-1 pr-2 gap-0.5">
                      <Text numberOfLines={1} className="text-[13.5px] font-medium text-foreground">
                        {ord.orderCode} · {ord.items?.[0]?.name || 'Đơn hàng SkinSense'}
                      </Text>
                      <Text numberOfLines={1} className="text-[11.5px] font-light text-muted-foreground">
                        Khách: {ord.customerName} · {(ord.paymentMethod || 'cod').toUpperCase()}
                      </Text>
                    </View>
                    <Text className="font-display text-[15px] font-normal text-success">
                      {formatVnd(ord.totalAmount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      <Pressable
        role="button"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          router.push('/admin' as Href);
        }}
        className="h-[52px] flex-row items-center justify-center gap-2.5 rounded-[14px] bg-primary active:scale-[0.99]"
      >
        <Icon as={ShieldCheck} size={18} className="text-primary-foreground" />
        <Text className="text-[15px] font-semibold text-primary-foreground">
          Vào Cổng Quản Trị Hệ Thống (Admin)
        </Text>
      </Pressable>

      <Pressable
        role="button"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          if (typeof auth.setStaffTodayViewMode === 'function') {
            auth.setStaffTodayViewMode('skin');
          }
        }}
        className="h-12 flex-row items-center justify-center gap-2 rounded-[14px] border border-emerald-500/40 bg-emerald-500/12 active:scale-[0.99]"
      >
        <Icon as={Camera} size={16} className="text-emerald-500" />
        <Text className="text-[14px] font-semibold text-emerald-500">
          Mở Trang Soi Da & Chụp Ảnh AI
        </Text>
      </Pressable>
    </WorkstationFrame>
  );
}

/**
 * Shop Merchant Today Overview backed directly by Web `/api/user/orders?role=shop` and `/api/admin/products`.
 */
export function ShopTodayWorkstation({ user, date }: { user: AuthUser; date: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<RemoteUserOrderItem[]>([]);
  const [products, setProducts] = useState<MarketplaceApiProduct[]>([]);

  const shopName =
    user.shopDetails?.shopName?.trim() ||
    user.shopName?.trim() ||
    user.fullName?.trim() ||
    '';

  const accountStatus = user.status ?? user.shopStatus ?? 'pending';
  const shopAccess = canShopSignIn({
    role: user.role,
    status: accountStatus,
    email: user.email,
    fullName: user.fullName,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [oRes, pRes] = await Promise.all([
      loadUserOrdersRemote('shop'),
      loadAdminProductsRemote(shopName || undefined),
    ]);
    setOrders(Array.isArray(oRes.data?.orders) ? oRes.data.orders : []);
    const allProds = Array.isArray(pRes.data?.products) ? pRes.data.products : [];
    setProducts(filterProductsByShop(allProds, shopName));
    setLoading(false);
  }, [shopName]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const completedRevenue = orders
    .filter((o) => o.status === 'delivered' || o.status === 'completed')
    .reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const approvedProductsCount = products.filter((p) => p.status === 'approved').length;
  const pendingProductsCount = products.filter((p) => p.status === 'pending').length;

  return (
    <WorkstationFrame date={date} tone="terracotta">
      <View className={`gap-3 p-5 ${CARD}`}>
        <View className="flex-row items-center justify-between gap-2.5">
          <View className="flex-1 flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-[14px] border border-amber-500/30 bg-amber-500/12">
              <Icon as={Store} size={19} strokeWidth={1.6} className="text-amber-400" />
            </View>
            <View className="flex-1">
              <Text className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-amber-400">
                Gian Hàng Đối Tác
              </Text>
              <Text numberOfLines={1} className="font-display text-[19px] font-normal text-foreground">
                {shopName || 'Gian Hàng SkinSense Partner'}
              </Text>
            </View>
          </View>
          {!shopAccess.allowed ? (
            <View className="flex-row items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/12 px-3 py-1">
              <Icon as={Clock} size={12} className="text-amber-500" />
              <Text className="text-[11px] font-semibold text-amber-500">Chờ duyệt</Text>
            </View>
          ) : (
            <Pressable
              role="button"
              accessibilityLabel="Làm mới"
              onPress={() => void loadData()}
              className="size-9 items-center justify-center rounded-[12px] border border-border/80 bg-surface-2 active:scale-[0.96]"
            >
              <Icon as={RefreshCw} size={15} className="text-foreground" />
            </Pressable>
          )}
        </View>
        <Text className="text-[13px] font-light text-muted-foreground">
          Chủ gian hàng: {user.fullName}
          {user.phoneNumber ? ` • SĐT: ${user.phoneNumber}` : ''}
        </Text>

        {!shopAccess.allowed && (
          <View className="rounded-[14px] bg-amber-500/12 border border-amber-500/30 p-3.5 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Icon as={Clock} size={16} className="text-amber-500" />
              <Text className="flex-1 text-[13px] font-bold text-amber-500">
                Hồ sơ gian hàng đang chờ Admin SkinSense duyệt GPKD
              </Text>
            </View>
            <Text className="text-[12px] text-muted-foreground leading-4">
              {shopAccess.reason ||
                'Sau khi được Admin phê duyệt, gian hàng sẽ được mở bán chính thức trên sàn SkinSense Mall.'}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View className={`items-center justify-center py-8 ${CARD}`}>
          <ActivityIndicator />
          <Text className="mt-2 text-[12.5px] text-muted-foreground">Đang tải dữ liệu gian hàng...</Text>
        </View>
      ) : (
        <>
          <View className="flex-row gap-2.5">
            <View className={`flex-1 gap-1 p-3.5 ${CARD}`}>
              <Text className={LABEL}>Doanh thu</Text>
              <Text className="font-display text-[21px] font-normal text-success">
                {formatVnd(completedRevenue)}
              </Text>
              <Text className="text-[11px] font-light text-muted-foreground">đơn đã giao</Text>
            </View>
            <View className={`flex-1 gap-1 p-3.5 ${CARD}`}>
              <Text className={LABEL}>Đơn chờ</Text>
              <Text className="font-display text-[21px] font-normal text-foreground">
                {pendingOrdersCount} đơn
              </Text>
              <Text className="text-[11px] font-light text-muted-foreground">{orders.length} tổng đơn</Text>
            </View>
            <View className={`flex-1 gap-1 p-3.5 ${CARD}`}>
              <Text className={LABEL}>Sản phẩm</Text>
              <Text className="font-display text-[21px] font-normal text-foreground">
                {approvedProductsCount} SP
              </Text>
              <Text className="text-[11px] font-light text-muted-foreground">
                {pendingProductsCount} chờ duyệt
              </Text>
            </View>
          </View>

          <View className={`gap-3 p-4 ${CARD}`}>
            <Text className={LABEL}>Đơn đặt mua từ gian hàng của bạn</Text>
            {orders.length === 0 ? (
              <Text className="text-[12.5px] font-light text-muted-foreground">
                Chưa có đơn hàng nào từ khách hàng.
              </Text>
            ) : (
              <View className="gap-2.5">
                {orders.slice(0, 3).map((ord, idx) => (
                  <View
                    key={ord.id}
                    className={`flex-row items-center justify-between ${
                      idx < Math.min(orders.length, 3) - 1 ? 'border-b border-border/50 pb-2.5' : ''
                    }`}
                  >
                    <View className="flex-1 pr-2 gap-0.5">
                      <Text numberOfLines={1} className="text-[13.5px] font-medium text-foreground">
                        {ord.items?.[0]?.name || ord.orderCode}
                      </Text>
                      <Text className="text-[11.5px] font-light text-muted-foreground">
                        Mã: {ord.orderCode} • {ord.paymentMethod.toUpperCase()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-display text-[15px] font-normal text-amber-400">
                        {formatVnd(ord.totalAmount)}
                      </Text>
                      <Text className="text-[11px] text-success font-medium">{ord.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      <Pressable
        role="button"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          router.push('/shop' as Href);
        }}
        className="h-[52px] flex-row items-center justify-center gap-2.5 rounded-[14px] bg-amber-600 active:scale-[0.99]"
      >
        <Icon as={Store} size={18} className="text-white" />
        <Text className="text-[15px] font-semibold text-white">
          Quản Trị Gian Hàng & Đăng Bán Sản Phẩm
        </Text>
      </Pressable>

      <Pressable
        role="button"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          if (typeof auth.setStaffTodayViewMode === 'function') {
            auth.setStaffTodayViewMode('skin');
          }
        }}
        className="h-12 flex-row items-center justify-center gap-2 rounded-[14px] border border-emerald-500/40 bg-emerald-500/12 active:scale-[0.99]"
      >
        <Icon as={Camera} size={16} className="text-emerald-500" />
        <Text className="text-[14px] font-semibold text-emerald-500">
          Mở Trang Soi Da & Chụp Ảnh AI
        </Text>
      </Pressable>
    </WorkstationFrame>
  );
}
