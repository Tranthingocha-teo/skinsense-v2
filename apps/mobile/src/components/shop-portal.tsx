import {
  formatVnd,
  PRODUCTS,
  type Order,
  type OrderStatus,
  type Product,
  type Shop,
  type ShopListing,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  Clock,
  DollarSign,
  Edit3,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  Users,
  X,
  XCircle,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  registerShop,
  saveListing,
  updateOrderStatus,
  updateShopStatus,
} from '@/lib/marketplace';

export function ShopPortal() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShop, setActiveShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [listings, setListings] = useState<ShopListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Active portal tab
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');

  // Registration modal / form state
  const [isRegistering, setIsRegistering] = useState(false);
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [registeringSubmitting, setRegisteringSubmitting] = useState(false);

  // Edit Listing Modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPriceStr, setEditPriceStr] = useState('');
  const [editStockStr, setEditStockStr] = useState('');
  const [savingListing, setSavingListing] = useState(false);

  async function refreshData() {
    setLoading(true);
    try {
      const allShops = await loadShops();
      setShops(allShops);

      // Select active shop or first approved shop
      const current = activeShop
        ? allShops.find((s) => s.id === activeShop.id) || allShops[0]
        : allShops[0];

      setActiveShop(current || null);

      if (current) {
        const [shopOrders, allListings] = await Promise.all([
          loadOrders({ shopId: current.id }),
          loadListings(),
        ]);
        setOrders(shopOrders);
        setListings(allListings.filter((l) => l.shopId === current.id));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  async function handleSelectShop(shop: Shop) {
    void Haptics.selectionAsync().catch(() => {});
    setActiveShop(shop);
    const [shopOrders, allListings] = await Promise.all([
      loadOrders({ shopId: shop.id }),
      loadListings(),
    ]);
    setOrders(shopOrders);
    setListings(allListings.filter((l) => l.shopId === shop.id));
  }

  async function handleRegisterShop() {
    if (!regShopName.trim() || !regOwnerName.trim() || !regPhone.trim() || !regAddress.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    setRegisteringSubmitting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const newShop = await registerShop({
        shopName: regShopName.trim(),
        ownerName: regOwnerName.trim(),
        phone: regPhone.trim(),
        address: regAddress.trim(),
      });

      setIsRegistering(false);
      setRegShopName('');
      setRegOwnerName('');
      setRegPhone('');
      setRegAddress('');

      Alert.alert(
        'Đăng ký thành công!',
        `Gian hàng "${newShop.shopName}" đang chờ Ban quản trị SkinSense duyệt. Bạn có thể duyệt ngay trong trang Admin hoặc nút Duyệt nhanh bên dưới.`,
      );
      await refreshData();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo gian hàng lúc này.');
    } finally {
      setRegisteringSubmitting(false);
    }
  }

  async function handleQuickApprove(shopId: string) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await updateShopStatus(shopId, 'approved');
    await refreshData();
  }

  async function handleUpdateOrderStatus(orderId: string, nextStatus: OrderStatus) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await updateOrderStatus(orderId, nextStatus);
    if (activeShop) {
      const shopOrders = await loadOrders({ shopId: activeShop.id });
      setOrders(shopOrders);
    }
  }

  function openEditListing(product: Product) {
    const existing = listings.find((l) => l.productId === product.id);
    setEditingProduct(product);
    setEditPriceStr(existing ? existing.priceVnd.toString() : product.priceVnd.toString());
    setEditStockStr(existing ? existing.stock.toString() : '50');
  }

  async function handleSaveListing() {
    if (!editingProduct || !activeShop) return;
    const price = parseInt(editPriceStr.replace(/\D/g, ''), 10);
    const stock = parseInt(editStockStr.replace(/\D/g, ''), 10);

    if (isNaN(price) || price <= 0) {
      Alert.alert('Giá không hợp lệ', 'Vui lòng nhập giá bán hợp lệ.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      Alert.alert('Số lượng không hợp lệ', 'Vui lòng nhập số lượng tồn kho hợp lệ.');
      return;
    }

    setSavingListing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await saveListing({
        shopId: activeShop.id,
        productId: editingProduct.id,
        priceVnd: price,
        stock: stock,
      });

      const allListings = await loadListings();
      setListings(allListings.filter((l) => l.shopId === activeShop.id));
      setEditingProduct(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } finally {
      setSavingListing(false);
    }
  }

  // Calculate quick stats
  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalVnd, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  return (
    <View className="flex-1 bg-background">
      {/* Top Header */}
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
        <Text className="font-display text-[18px] font-medium">Kênh Người Bán</Text>
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
        {/* Active Shop Selector / Switcher */}
        <View className="gap-2 rounded-card border border-border bg-card p-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-medium uppercase text-muted-foreground">
              Gian hàng đang quản lý ({shops.length})
            </Text>
            <Pressable
              role="button"
              onPress={() => setIsRegistering(true)}
              className="flex-row items-center gap-1 rounded-pill bg-primary/10 px-2.5 py-1"
            >
              <Icon as={Plus} size={12} className="text-primary" />
              <Text className="text-[11.5px] font-semibold text-primary">Đăng ký Shop mới</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pt-1">
            <View className="flex-row gap-2">
              {shops.map((s) => {
                const isSelected = activeShop?.id === s.id;
                return (
                  <Pressable
                    key={s.id}
                    role="button"
                    onPress={() => handleSelectShop(s)}
                    className={`flex-row items-center gap-2 rounded-pill px-3 py-1.5 border ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface-1'
                    }`}
                  >
                    <Icon
                      as={Store}
                      size={13}
                      className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <Text
                      className={`text-[12.5px] font-medium ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {s.shopName}
                    </Text>
                    {s.status === 'pending' && (
                      <View className="rounded-pill bg-amber-500/20 px-1.5 py-0.2">
                        <Text className="text-[10px] text-amber-600 dark:text-amber-400">Chờ duyệt</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Shop Status Banner if Pending */}
        {activeShop?.status === 'pending' && (
          <View className="gap-2 rounded-card border border-amber-500/30 bg-amber-500/10 p-3.5">
            <View className="flex-row items-center gap-2">
              <Icon as={AlertCircle} size={17} className="text-amber-500" />
              <Text className="text-[13.5px] font-semibold text-amber-700 dark:text-amber-400">
                Gian hàng đang chờ Admin kiểm duyệt
              </Text>
            </View>
            <Text className="text-[12px] text-amber-800/80 dark:text-amber-300/80">
              Các sản phẩm bạn đăng tải sẽ hiển thị trên SkinSense Market sau khi được Admin phê duyệt.
            </Text>
            <Pressable
              role="button"
              onPress={() => handleQuickApprove(activeShop.id)}
              className="mt-1 self-start rounded-control bg-amber-600 px-3 py-1.5 active:opacity-90"
            >
              <Text className="text-[12px] font-medium text-white">Duyệt nhanh ngay (Test Mode)</Text>
            </Pressable>
          </View>
        )}

        {/* Shop Summary Stats */}
        {activeShop && (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-card border border-border bg-card p-3.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[12px] text-muted-foreground">Doanh thu</Text>
                  <Icon as={DollarSign} size={15} className="text-success" />
                </View>
                <Text className="mt-1 text-[18px] font-bold text-foreground">
                  {formatVnd(totalRevenue)}
                </Text>
                <Text className="text-[10.5px] text-muted-foreground mt-0.5">
                  Từ các đơn đã hoàn thành
                </Text>
              </View>

              <View className="flex-1 rounded-card border border-border bg-card p-3.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[12px] text-muted-foreground">Đơn hàng</Text>
                  <Icon as={Package} size={15} className="text-primary" />
                </View>
                <Text className="mt-1 text-[18px] font-bold text-foreground">
                  {orders.length}
                </Text>
                <Text className="text-[10.5px] text-amber-500 mt-0.5">
                  {pendingOrders} đơn chờ xử lý
                </Text>
              </View>
            </View>

            {/* Portal Tab Switcher */}
            <View className="flex-row rounded-control border border-border bg-surface-1 p-1">
              <Pressable
                role="button"
                onPress={() => {
                  setActiveTab('orders');
                  void Haptics.selectionAsync().catch(() => {});
                }}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-control ${
                  activeTab === 'orders' ? 'bg-primary shadow-sm' : 'bg-transparent'
                }`}
              >
                <Icon
                  as={Package}
                  size={15}
                  className={activeTab === 'orders' ? 'text-primary-foreground' : 'text-muted-foreground'}
                />
                <Text
                  className={`text-[13px] ${
                    activeTab === 'orders' ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  Đơn hàng ({orders.length})
                </Text>
              </Pressable>

              <Pressable
                role="button"
                onPress={() => {
                  setActiveTab('inventory');
                  void Haptics.selectionAsync().catch(() => {});
                }}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-control ${
                  activeTab === 'inventory' ? 'bg-primary shadow-sm' : 'bg-transparent'
                }`}
              >
                <Icon
                  as={Tag}
                  size={15}
                  className={activeTab === 'inventory' ? 'text-primary-foreground' : 'text-muted-foreground'}
                />
                <Text
                  className={`text-[13px] ${
                    activeTab === 'inventory' ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  Kho & Bảng giá ({listings.length}/{PRODUCTS.length})
                </Text>
              </Pressable>
            </View>

            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <View className="gap-3">
                {orders.length === 0 ? (
                  <View className="items-center justify-center rounded-card border border-border bg-card p-8">
                    <Icon as={ShoppingBag} size={32} className="text-muted-foreground/60" />
                    <Text className="mt-2 text-[14px] font-medium">Chưa có đơn hàng nào</Text>
                    <Text className="text-[12px] text-muted-foreground text-center mt-1">
                      Khi khách đặt mua sản phẩm của shop, đơn hàng sẽ hiển thị ở đây để bạn xác nhận.
                    </Text>
                  </View>
                ) : (
                  orders.map((order) => (
                    <View
                      key={order.id}
                      className="gap-3 rounded-card border border-border bg-card p-4 shadow-sm"
                    >
                      <View className="flex-row items-center justify-between border-b border-border/40 pb-2">
                        <View>
                          <Text className="text-[13px] font-bold font-mono">{order.id}</Text>
                          <Text className="text-[11px] text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')} {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View className="rounded-pill bg-primary/10 px-2.5 py-0.5">
                          <Text className="text-[11px] font-medium text-primary uppercase">
                            {order.status}
                          </Text>
                        </View>
                      </View>

                      {/* Product & Qty */}
                      <View className="flex-row gap-2.5">
                        <View className="size-14 overflow-hidden rounded-control bg-surface-2">
                          <Image
                            source={{ uri: order.productImage }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                          />
                        </View>
                        <View className="flex-1 justify-between">
                          <Text numberOfLines={2} className="text-[13px] font-medium leading-[17px]">
                            {order.productName}
                          </Text>
                          <View className="flex-row items-baseline justify-between">
                            <Text className="text-[11.5px] text-muted-foreground">
                              SL: x{order.quantity}
                            </Text>
                            <Text className="text-[14px] font-bold text-foreground">
                              {order.totalFormatted}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Customer info */}
                      <View className="rounded-control bg-surface-1 p-2.5 gap-1">
                        <Text className="text-[12px] font-semibold text-foreground">
                          {order.customerName} - {order.customerPhone}
                        </Text>
                        <Text className="text-[11.5px] text-muted-foreground">
                          Đ/c: {order.customerAddress}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground">
                          PTTT: {order.paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : 'Thu tiền COD'}
                        </Text>
                      </View>

                      {/* Action buttons based on status */}
                      <View className="flex-row items-center justify-end gap-2 border-t border-border/40 pt-2.5">
                        {order.status === 'pending' && (
                          <>
                            <Pressable
                              role="button"
                              onPress={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                              className="rounded-control border border-border px-3 py-1.5"
                            >
                              <Text className="text-[12px] text-rose-500 font-medium">Từ chối</Text>
                            </Pressable>
                            <Pressable
                              role="button"
                              onPress={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                              className="rounded-control bg-primary px-3.5 py-1.5"
                            >
                              <Text className="text-[12px] text-primary-foreground font-semibold">
                                Xác nhận đơn
                              </Text>
                            </Pressable>
                          </>
                        )}

                        {order.status === 'confirmed' && (
                          <Pressable
                            role="button"
                            onPress={() => handleUpdateOrderStatus(order.id, 'shipping')}
                            className="flex-row items-center gap-1.5 rounded-control bg-blue-600 px-3.5 py-1.5"
                          >
                            <Icon as={Truck} size={13} className="text-white" />
                            <Text className="text-[12px] text-white font-semibold">Giao hàng cho Shipper</Text>
                          </Pressable>
                        )}

                        {order.status === 'shipping' && (
                          <Pressable
                            role="button"
                            onPress={() => handleUpdateOrderStatus(order.id, 'completed')}
                            className="flex-row items-center gap-1.5 rounded-control bg-emerald-600 px-3.5 py-1.5"
                          >
                            <Icon as={CheckCircle2} size={13} className="text-white" />
                            <Text className="text-[12px] text-white font-semibold">Hoàn thành đơn</Text>
                          </Pressable>
                        )}

                        {order.status === 'completed' && (
                          <View className="flex-row items-center gap-1">
                            <Icon as={CheckCircle2} size={14} className="text-emerald-500" />
                            <Text className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                              Đơn đã giao thành công
                            </Text>
                          </View>
                        )}

                        {order.status === 'cancelled' && (
                          <Text className="text-[12px] text-muted-foreground">Đơn đã huỷ</Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 2: INVENTORY & PRICING */}
            {activeTab === 'inventory' && (
              <View className="gap-3">
                <Text className="text-[12.5px] text-muted-foreground">
                  Chọn sản phẩm từ danh mục hệ thống để thiết lập giá bán và số lượng trong kho của shop bạn.
                </Text>

                {PRODUCTS.map((prod) => {
                  const listing = listings.find((l) => l.productId === prod.id);
                  const isListed = !!listing;

                  return (
                    <View
                      key={prod.id}
                      className="gap-2.5 rounded-card border border-border bg-card p-3.5"
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
                              {prod.brand}
                            </Text>
                            <Text numberOfLines={2} className="text-[13px] font-medium leading-[17px]">
                              {prod.name}
                            </Text>
                          </View>
                          <Text className="text-[11.5px] text-muted-foreground">
                            Giá niêm yết: {prod.priceFormatted}
                          </Text>
                        </View>
                      </View>

                      {/* Listing status & action */}
                      <View className="flex-row items-center justify-between border-t border-border/40 pt-2.5">
                        <View>
                          {isListed ? (
                            <View>
                              <Text className="text-[11px] text-muted-foreground">Giá bán của shop:</Text>
                              <Text className="text-[14px] font-bold text-foreground">
                                {listing.priceFormatted} · Còn: {listing.stock}
                              </Text>
                            </View>
                          ) : (
                            <Text className="text-[12px] text-muted-foreground italic">
                              Chưa mở bán tại shop
                            </Text>
                          )}
                        </View>

                        <Pressable
                          role="button"
                          onPress={() => openEditListing(prod)}
                          className="flex-row items-center gap-1 rounded-control bg-primary/10 border border-primary/20 px-3 py-1.5 active:opacity-80"
                        >
                          <Icon as={Edit3} size={13} className="text-primary" />
                          <Text className="text-[12px] font-semibold text-primary">
                            {isListed ? 'Chỉnh sửa' : 'Mở bán'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Listing Modal */}
      {editingProduct && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingProduct(null)}
        >
          <View className="flex-1 items-center justify-center bg-black/60 p-5">
            <View className="w-full max-w-sm rounded-sheet border border-border bg-card p-5">
              <View className="flex-row items-center justify-between pb-3 border-b border-border">
                <Text className="text-[16px] font-semibold">Thiết lập giá & kho hàng</Text>
                <Pressable
                  role="button"
                  onPress={() => setEditingProduct(null)}
                  className="size-8 items-center justify-center rounded-pill active:bg-surface-2"
                >
                  <Icon as={X} size={18} className="text-muted-foreground" />
                </Pressable>
              </View>

              <View className="gap-3 py-4">
                <Text numberOfLines={2} className="text-[13.5px] font-medium text-foreground">
                  {editingProduct.name}
                </Text>

                <View className="gap-1">
                  <Text className="text-[12px] font-medium text-muted-foreground">
                    Giá bán gian hàng (VND)
                  </Text>
                  <TextInput
                    value={editPriceStr}
                    onChangeText={setEditPriceStr}
                    keyboardType="numeric"
                    placeholder="VD: 395000"
                    placeholderTextColor="#888"
                    className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-[12px] font-medium text-muted-foreground">
                    Số lượng trong kho
                  </Text>
                  <TextInput
                    value={editStockStr}
                    onChangeText={setEditStockStr}
                    keyboardType="numeric"
                    placeholder="VD: 50"
                    placeholderTextColor="#888"
                    className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                  />
                </View>
              </View>

              <View className="flex-row gap-2 pt-2 border-t border-border">
                <Pressable
                  role="button"
                  onPress={() => setEditingProduct(null)}
                  className="flex-1 h-11 items-center justify-center rounded-control border border-border"
                >
                  <Text className="text-[13.5px] font-medium text-foreground">Huỷ</Text>
                </Pressable>
                <Pressable
                  role="button"
                  disabled={savingListing}
                  onPress={handleSaveListing}
                  className="flex-1 h-11 items-center justify-center rounded-control bg-primary active:opacity-90"
                >
                  {savingListing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-[13.5px] font-semibold text-primary-foreground">
                      Lưu thay đổi
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Shop Registration Modal */}
      {isRegistering && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setIsRegistering(false)}
        >
          <View className="flex-1 items-center justify-center bg-black/60 p-5">
            <View className="w-full max-w-sm rounded-sheet border border-border bg-card p-5">
              <View className="flex-row items-center justify-between pb-3 border-b border-border">
                <Text className="text-[16px] font-semibold">Đăng ký gian hàng mới</Text>
                <Pressable
                  role="button"
                  onPress={() => setIsRegistering(false)}
                  className="size-8 items-center justify-center rounded-pill active:bg-surface-2"
                >
                  <Icon as={X} size={18} className="text-muted-foreground" />
                </Pressable>
              </View>

              <ScrollView className="max-h-[380px]" showsVerticalScrollIndicator={false}>
                <View className="gap-3 py-3">
                  <View className="gap-1">
                    <Text className="text-[12px] font-medium text-muted-foreground">
                      Tên gian hàng *
                    </Text>
                    <TextInput
                      value={regShopName}
                      onChangeText={setRegShopName}
                      placeholder="VD: Dược Mỹ Phẩm Hà Nội"
                      placeholderTextColor="#888"
                      className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                    />
                  </View>

                  <View className="gap-1">
                    <Text className="text-[12px] font-medium text-muted-foreground">
                      Họ tên chủ shop *
                    </Text>
                    <TextInput
                      value={regOwnerName}
                      onChangeText={setRegOwnerName}
                      placeholder="VD: Nguyễn Văn A"
                      placeholderTextColor="#888"
                      className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                    />
                  </View>

                  <View className="gap-1">
                    <Text className="text-[12px] font-medium text-muted-foreground">
                      Số điện thoại *
                    </Text>
                    <TextInput
                      value={regPhone}
                      onChangeText={setRegPhone}
                      keyboardType="phone-pad"
                      placeholder="VD: 0987654321"
                      placeholderTextColor="#888"
                      className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                    />
                  </View>

                  <View className="gap-1">
                    <Text className="text-[12px] font-medium text-muted-foreground">
                      Địa chỉ kho gửi hàng *
                    </Text>
                    <TextInput
                      value={regAddress}
                      onChangeText={setRegAddress}
                      placeholder="VD: 123 Phố Huế, Q. Hai Bà Trưng, Hà Nội"
                      placeholderTextColor="#888"
                      className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                    />
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row gap-2 pt-3 border-t border-border">
                <Pressable
                  role="button"
                  onPress={() => setIsRegistering(false)}
                  className="flex-1 h-11 items-center justify-center rounded-control border border-border"
                >
                  <Text className="text-[13.5px] font-medium text-foreground">Huỷ</Text>
                </Pressable>
                <Pressable
                  role="button"
                  disabled={registeringSubmitting}
                  onPress={handleRegisterShop}
                  className="flex-1 h-11 items-center justify-center rounded-control bg-primary active:opacity-90"
                >
                  {registeringSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-[13.5px] font-semibold text-primary-foreground">
                      Đăng ký
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
