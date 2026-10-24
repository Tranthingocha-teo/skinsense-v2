import {
  formatVnd,
  PRODUCTS,
  type Order,
  type OrderStatus,
  type Shop,
  type ShopListing,
  type ShopStatus,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  BadgeAlert,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Coins,
  Layers,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  XCircle,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  loadListings,
  loadOrders,
  loadShops,
  updateOrderStatus,
  updateShopStatus,
} from '@/lib/marketplace';

export function AdminPortal() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [listings, setListings] = useState<ShopListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'shops' | 'orders' | 'catalog'
  const [activeTab, setActiveTab] = useState<'shops' | 'orders' | 'catalog'>('shops');
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [shopFilter, setShopFilter] = useState<'all' | ShopStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  async function refreshData() {
    setLoading(true);
    try {
      const [allShops, allOrders, allListings] = await Promise.all([
        loadShops(),
        loadOrders(),
        loadListings(),
      ]);
      setShops(allShops);
      setOrders(allOrders);
      setListings(allListings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  async function handleToggleShopStatus(shopId: string, newStatus: ShopStatus) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await updateShopStatus(shopId, newStatus);
    await refreshData();
  }

  // Analytics
  const totalGmv = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalVnd, 0);

  const pendingShops = shops.filter((s) => s.status === 'pending').length;
  const approvedShops = shops.filter((s) => s.status === 'approved').length;

  const filteredShops = shops.filter((s) => {
    if (shopFilter !== 'all' && s.status !== shopFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.shopName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.phone.includes(q)
      );
    }
    return true;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.shopName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: Math.max(top, 12) }}
        className="flex-row items-center justify-between border-b border-border/40 px-3 pb-2.5 bg-background/95"
      >
        <Pressable
          role="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          className="size-11 items-center justify-center rounded-pill active:bg-surface-2"
        >
          <Icon as={ChevronLeft} size={24} strokeWidth={1.5} className="text-foreground" />
        </Pressable>
        <View className="items-center">
          <Text className="font-display text-[18px] font-medium">Quản Trị Viên Tối Cao</Text>
          <Text className="text-[11px] font-light text-primary">SkinSense Marketplace Admin</Text>
        </View>
        <Pressable
          role="button"
          accessibilityLabel="Làm mới"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            void refreshData();
          }}
          className="size-11 items-center justify-center rounded-pill active:bg-surface-2"
        >
          <Icon as={RefreshCw} size={18} className="text-muted-foreground" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-24"
        showsVerticalScrollIndicator={false}
      >
        {/* Platform Overview Metrics */}
        <View className="gap-2.5">
          <View className="flex-row gap-2.5">
            <View className="flex-1 rounded-card border border-border bg-card p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] text-muted-foreground">Tổng GMV sàn</Text>
                <Icon as={Coins} size={14} className="text-emerald-500" />
              </View>
              <Text className="mt-1 text-[16px] font-bold text-foreground">
                {formatVnd(totalGmv)}
              </Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">
                {orders.length} giao dịch
              </Text>
            </View>

            <View className="flex-1 rounded-card border border-border bg-card p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] text-muted-foreground">Gian hàng duyệt</Text>
                <Icon as={Store} size={14} className="text-primary" />
              </View>
              <Text className="mt-1 text-[16px] font-bold text-foreground">
                {approvedShops} / {shops.length}
              </Text>
              <Text className="text-[10px] text-amber-500 mt-0.5">
                {pendingShops} shop chờ duyệt
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Selection */}
        <View className="flex-row rounded-control border border-border bg-surface-1 p-1">
          <Pressable
            role="button"
            onPress={() => {
              setActiveTab('shops');
              void Haptics.selectionAsync().catch(() => {});
            }}
            className={`flex-1 py-2 items-center justify-center rounded-control ${
              activeTab === 'shops' ? 'bg-primary shadow-sm' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-[12.5px] font-semibold ${
                activeTab === 'shops' ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Gian hàng ({shops.length})
            </Text>
          </Pressable>

          <Pressable
            role="button"
            onPress={() => {
              setActiveTab('orders');
              void Haptics.selectionAsync().catch(() => {});
            }}
            className={`flex-1 py-2 items-center justify-center rounded-control ${
              activeTab === 'orders' ? 'bg-primary shadow-sm' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-[12.5px] font-semibold ${
                activeTab === 'orders' ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Đơn hàng ({orders.length})
            </Text>
          </Pressable>

          <Pressable
            role="button"
            onPress={() => {
              setActiveTab('catalog');
              void Haptics.selectionAsync().catch(() => {});
            }}
            className={`flex-1 py-2 items-center justify-center rounded-control ${
              activeTab === 'catalog' ? 'bg-primary shadow-sm' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-[12.5px] font-semibold ${
                activeTab === 'catalog' ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Danh mục ({PRODUCTS.length})
            </Text>
          </Pressable>
        </View>

        {/* Search Bar for Shops and Orders */}
        {activeTab !== 'catalog' && (
          <View className="flex-row items-center gap-2 rounded-control border border-border bg-card px-3 py-2">
            <Icon as={Search} size={15} className="text-muted-foreground" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                activeTab === 'shops' ? 'Tìm theo tên shop, SĐT...' : 'Tìm theo mã đơn, SĐT khách...'
              }
              placeholderTextColor="#888"
              className="flex-1 text-[13px] text-foreground p-0"
            />
          </View>
        )}

        {/* TAB 1: SHOPS MANAGEMENT */}
        {activeTab === 'shops' && (
          <View className="gap-3">
            {/* Filter pills */}
            <View className="flex-row gap-2">
              {(
                [
                  { label: 'Tất cả', value: 'all' },
                  { label: `Chờ duyệt (${pendingShops})`, value: 'pending' },
                  { label: 'Đang hoạt động', value: 'approved' },
                  { label: 'Đã khoá', value: 'rejected' },
                ] as const
              ).map((f) => (
                <Pressable
                  key={f.value}
                  role="button"
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    setShopFilter(f.value);
                  }}
                  className={`rounded-pill px-3 py-1 border ${
                    shopFilter === f.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  }`}
                >
                  <Text
                    className={`text-[11.5px] font-medium ${
                      shopFilter === f.value ? 'text-primary font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {filteredShops.length === 0 ? (
              <View className="items-center justify-center rounded-card border border-border bg-card p-8">
                <Icon as={Store} size={32} className="text-muted-foreground/60" />
                <Text className="mt-2 text-[14px] font-medium">Không có gian hàng nào</Text>
              </View>
            ) : (
              filteredShops.map((shop) => (
                <View
                  key={shop.id}
                  className="gap-3 rounded-card border border-border bg-card p-4 shadow-sm"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="size-10 overflow-hidden rounded-pill bg-surface-2 border border-border">
                        <Image
                          source={{ uri: shop.avatarUrl }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      </View>
                      <View>
                        <View className="flex-row items-center gap-1.5">
                          <Text className="text-[14px] font-semibold">{shop.shopName}</Text>
                          {shop.isOfficial && (
                            <Icon as={BadgeCheck} size={15} className="text-primary fill-primary/20" />
                          )}
                        </View>
                        <Text className="text-[11.5px] text-muted-foreground">
                          Chủ shop: {shop.ownerName} · {shop.phone}
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`rounded-pill px-2.5 py-0.5 ${
                        shop.status === 'approved'
                          ? 'bg-emerald-500/10'
                          : shop.status === 'pending'
                          ? 'bg-amber-500/10'
                          : 'bg-rose-500/10'
                      }`}
                    >
                      <Text
                        className={`text-[10.5px] font-semibold uppercase ${
                          shop.status === 'approved'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : shop.status === 'pending'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {shop.status}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-[12px] text-muted-foreground">
                    Kho: {shop.address}
                  </Text>

                  {/* Admin Action Buttons */}
                  <View className="flex-row items-center justify-end gap-2 border-t border-border/40 pt-2.5">
                    {shop.status === 'pending' && (
                      <>
                        <Pressable
                          role="button"
                          onPress={() => handleToggleShopStatus(shop.id, 'rejected')}
                          className="rounded-control border border-rose-500/30 px-3 py-1.5"
                        >
                          <Text className="text-[12px] font-medium text-rose-500">Từ chối</Text>
                        </Pressable>
                        <Pressable
                          role="button"
                          onPress={() => handleToggleShopStatus(shop.id, 'approved')}
                          className="flex-row items-center gap-1 rounded-control bg-emerald-600 px-3.5 py-1.5"
                        >
                          <Icon as={CheckCircle2} size={13} className="text-white" />
                          <Text className="text-[12px] font-semibold text-white">Phê duyệt shop</Text>
                        </Pressable>
                      </>
                    )}

                    {shop.status === 'approved' && (
                      <Pressable
                        role="button"
                        onPress={() => handleToggleShopStatus(shop.id, 'rejected')}
                        className="rounded-control border border-border px-3 py-1.5"
                      >
                        <Text className="text-[12px] font-medium text-muted-foreground">
                          Khoá hoạt động
                        </Text>
                      </Pressable>
                    )}

                    {shop.status === 'rejected' && (
                      <Pressable
                        role="button"
                        onPress={() => handleToggleShopStatus(shop.id, 'approved')}
                        className="rounded-control bg-primary px-3 py-1.5"
                      >
                        <Text className="text-[12px] font-medium text-primary-foreground">
                          Mở khoá lại
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: PLATFORM ORDERS */}
        {activeTab === 'orders' && (
          <View className="gap-3">
            {/* Filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {(
                  [
                    { label: 'Tất cả', value: 'all' },
                    { label: 'Chờ xác nhận', value: 'pending' },
                    { label: 'Đang xử lý', value: 'confirmed' },
                    { label: 'Đang giao', value: 'shipping' },
                    { label: 'Hoàn thành', value: 'completed' },
                    { label: 'Đã huỷ', value: 'cancelled' },
                  ] as const
                ).map((f) => (
                  <Pressable
                    key={f.value}
                    role="button"
                    onPress={() => {
                      void Haptics.selectionAsync().catch(() => {});
                      setOrderFilter(f.value);
                    }}
                    className={`rounded-pill px-3 py-1 border ${
                      orderFilter === f.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Text
                      className={`text-[11.5px] font-medium ${
                        orderFilter === f.value ? 'text-primary font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {filteredOrders.length === 0 ? (
              <View className="items-center justify-center rounded-card border border-border bg-card p-8">
                <Icon as={Package} size={32} className="text-muted-foreground/60" />
                <Text className="mt-2 text-[14px] font-medium">Không có đơn hàng nào</Text>
              </View>
            ) : (
              filteredOrders.map((order) => (
                <View
                  key={order.id}
                  className="gap-2.5 rounded-card border border-border bg-card p-3.5 shadow-sm"
                >
                  <View className="flex-row items-center justify-between border-b border-border/40 pb-2">
                    <View>
                      <Text className="text-[13px] font-bold font-mono">{order.id}</Text>
                      <Text className="text-[11px] text-muted-foreground">
                        Shop: <Text className="font-semibold text-foreground">{order.shopName}</Text>
                      </Text>
                    </View>
                    <View className="rounded-pill bg-primary/10 px-2.5 py-0.5">
                      <Text className="text-[10.5px] font-medium text-primary uppercase">
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2.5">
                    <View className="size-12 overflow-hidden rounded-control bg-surface-2">
                      <Image
                        source={{ uri: order.productImage }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    </View>
                    <View className="flex-1 justify-between">
                      <Text numberOfLines={1} className="text-[13px] font-medium">
                        {order.productName}
                      </Text>
                      <View className="flex-row items-baseline justify-between">
                        <Text className="text-[11px] text-muted-foreground">SL: x{order.quantity}</Text>
                        <Text className="text-[13.5px] font-bold text-foreground">
                          {order.totalFormatted}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="rounded-control bg-surface-1 p-2 gap-0.5">
                    <Text className="text-[11.5px] font-medium text-foreground">
                      Khách: {order.customerName} ({order.customerPhone})
                    </Text>
                    <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
                      Đ/c: {order.customerAddress}
                    </Text>
                    <Text className="text-[10.5px] text-muted-foreground">
                      Thanh toán: {order.paymentMethod === 'vietqr' ? 'VietQR (Đã tạo mã)' : 'COD khi nhận'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: SYSTEM CATALOG */}
        {activeTab === 'catalog' && (
          <View className="gap-3">
            <Text className="text-[12.5px] text-muted-foreground">
              Danh mục {PRODUCTS.length} sản phẩm chính hãng đã qua kiểm định y khoa và liên kết với mô hình AI Routine của SkinSense.
            </Text>

            {PRODUCTS.map((prod) => {
              const shopListings = listings.filter((l) => l.productId === prod.id && l.isActive);
              return (
                <View
                  key={prod.id}
                  className="gap-2.5 rounded-card border border-border bg-card p-3.5 shadow-sm"
                >
                  <View className="flex-row gap-3">
                    <View className="size-16 overflow-hidden rounded-control bg-surface-2">
                      <Image
                        source={{ uri: prod.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    </View>
                    <View className="flex-1 justify-between">
                      <View>
                        <Text className="text-[11px] font-semibold uppercase text-primary">
                          {prod.brand} · {prod.category}
                        </Text>
                        <Text numberOfLines={2} className="text-[13px] font-medium leading-[17px]">
                          {prod.name}
                        </Text>
                      </View>
                      <View className="flex-row items-baseline justify-between">
                        <Text className="text-[13.5px] font-bold text-foreground">
                          {prod.priceFormatted}
                        </Text>
                        <Text className="text-[11.5px] text-muted-foreground">
                          {shopListings.length} shop mở bán
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-1.5 border-t border-border/40 pt-2">
                    {prod.keyActives.map((active, i) => (
                      <View
                        key={i}
                        className="rounded-pill border border-border bg-surface-1 px-2 py-0.5"
                      >
                        <Text className="text-[10.5px] text-muted-foreground">{active}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
