import {
  formatVnd,
  type Order,
  type OrderStatus,
  type SkinConditionClass,
  type Zone,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  DollarSign,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
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
  deleteCustomProduct,
  loadAllStoreProducts,
  loadOrders,
  saveCustomProduct,
  type StoreProduct,
  toggleProductActive,
  updateOrderStatus,
} from '@/lib/marketplace';

const PRESET_IMAGES = [
  {
    label: 'Serum Phục Hồi',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Kem Dưỡng B5',
    url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Tinh Chất Rau Má',
    url: 'https://images.unsplash.com/photo-1608248597359-56330089a8dc?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Chống Nắng Quang Phổ Rộng',
    url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
  },
];

export function AdminPortal() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'orders' | 'products' | 'analytics'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'analytics'>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Product Modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('Serum B5 SkinSense Tái Tạo');
  const [newProdBrand, setNewProdBrand] = useState('SkinSense Clinic');
  const [newProdCategory, setNewProdCategory] = useState('Serum phục hồi');
  const [newProdPrice, setNewProdPrice] = useState('350000');
  const [newProdSummary, setNewProdSummary] = useState('Công thức phục hồi chuyên sâu làm dịu da');
  const [newProdDescription, setNewProdDescription] = useState('Dược mỹ phẩm độc quyền phòng khám SkinSense');
  const [newProdImage, setNewProdImage] = useState(PRESET_IMAGES[0].url);
  const [savingProduct, setSavingProduct] = useState(false);

  async function refreshData() {
    setLoading(true);
    try {
      const [allOrders, allProducts] = await Promise.all([
        loadOrders(),
        loadAllStoreProducts(),
      ]);
      setOrders(allOrders);
      setProducts(allProducts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  async function handleUpdateOrderStatus(orderId: string, newStatus: OrderStatus) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await updateOrderStatus(orderId, newStatus);
    await refreshData();
  }

  async function handleToggleProductActive(productId: string, currentStatus: boolean | undefined) {
    void Haptics.selectionAsync().catch(() => {});
    await toggleProductActive(productId, !currentStatus);
    await refreshData();
  }

  async function handleDeleteProduct(productId: string) {
    Alert.alert(
      'Xoá sản phẩm',
      'Bạn có chắc chắn muốn xoá sản phẩm này khỏi cửa hàng SkinSense?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            await deleteCustomProduct(productId);
            await refreshData();
          },
        },
      ],
    );
  }

  async function handleSaveNewProduct() {
    const name = newProdName.trim() || 'Serum B5 SkinSense Tái Tạo';
    const price = parseInt(newProdPrice.replace(/\D/g, ''), 10) || 350000;
    const summary = newProdSummary.trim() || 'Công thức phục hồi chuyên sâu làm dịu da';

    setSavingProduct(true);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await saveCustomProduct({
        name,
        brand: newProdBrand.trim() || 'SkinSense Clinic',
        category: newProdCategory.trim() || 'Serum phục hồi',
        priceVnd: price,
        summary,
        description: newProdDescription.trim() || summary,
        imageUrl: newProdImage,
      });

      setShowAddProductModal(false);
      setNewProdName('Serum B5 SkinSense Tái Tạo');
      setNewProdSummary('Công thức phục hồi chuyên sâu làm dịu da');
      setNewProdDescription('Dược mỹ phẩm độc quyền phòng khám SkinSense');
      setNewProdPrice('350000');
      await refreshData();
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu sản phẩm. Vui lòng thử lại.');
    } finally {
      setSavingProduct(false);
    }
  }

  // Analytics Metrics
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalVnd, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const shippingOrders = orders.filter((o) => o.status === 'shipping' || o.status === 'confirmed');
  const inTransitAmount = shippingOrders.reduce((sum, o) => sum + o.totalVnd, 0);

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: top, paddingBottom: bottom }}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Pressable
          role="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          className="size-9 items-center justify-center rounded-pill active:bg-surface-2"
        >
          <Icon as={ChevronLeft} size={22} className="text-foreground" />
        </Pressable>
        <View className="items-center">
          <Text className="text-[17px] font-semibold text-foreground">
            Quản Trị Cửa Hàng SkinSense
          </Text>
          <Text className="text-[12px] text-muted-foreground">
            Quản lý sản phẩm, bán thêm & đơn đặt hàng
          </Text>
        </View>
        <Pressable
          role="button"
          accessibilityLabel="Làm mới"
          onPress={refreshData}
          className="size-9 items-center justify-center rounded-pill active:bg-surface-2"
        >
          <Icon as={RefreshCw} size={18} className="text-muted-foreground" />
        </Pressable>
      </View>

      {/* Overview Stat Cards */}
      <View className="flex-row gap-3 p-4 pb-2">
        <View className="flex-1 rounded-card border border-border bg-card p-3 gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11.5px] font-medium text-muted-foreground">Doanh thu thực</Text>
            <Icon as={DollarSign} size={15} className="text-success" />
          </View>
          <Text className="text-[17px] font-bold text-foreground">
            {formatVnd(totalRevenue)}
          </Text>
          <Text className="text-[11px] text-muted-foreground">
            {completedOrders.length} đơn hoàn thành
          </Text>
        </View>

        <View className="flex-1 rounded-card border border-border bg-card p-3 gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11.5px] font-medium text-muted-foreground">Đơn đặt hàng</Text>
            <Icon as={ShoppingBag} size={15} className="text-primary" />
          </View>
          <Text className="text-[17px] font-bold text-foreground">{orders.length} đơn</Text>
          <Text className="text-[11px] text-warning font-medium">
            {pendingOrders.length} đơn chờ xử lý
          </Text>
        </View>

        <View className="flex-1 rounded-card border border-border bg-card p-3 gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11.5px] font-medium text-muted-foreground">Kho hàng</Text>
            <Icon as={Package} size={15} className="text-primary" />
          </View>
          <Text className="text-[17px] font-bold text-foreground">{products.length} SP</Text>
          <Text className="text-[11px] text-muted-foreground">
            {products.filter((p) => p.isCustom).length} SP thêm mới
          </Text>
        </View>
      </View>

      {/* Tabs Selector */}
      <View className="px-4 py-2">
        <View className="flex-row rounded-control border border-border bg-surface-1 p-1">
          <Pressable
            role="tab"
            accessibilityState={{ selected: activeTab === 'orders' }}
            onPress={() => setActiveTab('orders')}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-control ${
              activeTab === 'orders' ? 'bg-card border border-border' : ''
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                activeTab === 'orders' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Đơn hàng ({orders.length})
            </Text>
            {pendingOrders.length > 0 && (
              <View className="size-2 rounded-pill bg-warning" />
            )}
          </Pressable>

          <Pressable
            role="tab"
            accessibilityState={{ selected: activeTab === 'products' }}
            onPress={() => setActiveTab('products')}
            className={`flex-1 py-2 rounded-control items-center justify-center ${
              activeTab === 'products' ? 'bg-card border border-border' : ''
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                activeTab === 'products' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Bán thêm sản phẩm ({products.length})
            </Text>
          </Pressable>

          <Pressable
            role="tab"
            accessibilityState={{ selected: activeTab === 'analytics' }}
            onPress={() => setActiveTab('analytics')}
            className={`flex-1 py-2 rounded-control items-center justify-center ${
              activeTab === 'analytics' ? 'bg-card border border-border' : ''
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                activeTab === 'analytics' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Báo cáo doanh số
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Search Input */}
      {activeTab !== 'analytics' && (
        <View className="px-4 pb-2">
          <View className="flex-row items-center gap-2 rounded-control border border-border bg-surface-1 px-3 py-2">
            <Icon as={Search} size={16} className="text-muted-foreground" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                activeTab === 'orders'
                  ? 'Tìm theo tên khách, SĐT, mã đơn...'
                  : 'Tìm sản phẩm theo tên hoặc hãng...'
              }
              placeholderTextColor="#888"
              className="flex-1 text-[13.5px] text-foreground p-0"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Icon as={X} size={15} className="text-muted-foreground" />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4ade80" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 60, gap: 12 }}
        >
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <>
              {/* Order Status Filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              >
                {(
                  [
                    { id: 'all', label: `Tất cả (${orders.length})` },
                    { id: 'pending', label: `Chờ duyệt (${pendingOrders.length})` },
                    {
                      id: 'confirmed',
                      label: `Đóng gói (${orders.filter((o) => o.status === 'confirmed').length})`,
                    },
                    {
                      id: 'shipping',
                      label: `Đang giao (${orders.filter((o) => o.status === 'shipping').length})`,
                    },
                    { id: 'completed', label: `Hoàn thành (${completedOrders.length})` },
                    {
                      id: 'cancelled',
                      label: `Đã huỷ (${orders.filter((o) => o.status === 'cancelled').length})`,
                    },
                  ] as const
                ).map((f) => (
                  <Pressable
                    key={f.id}
                    role="button"
                    onPress={() => setOrderFilter(f.id)}
                    className={`rounded-pill px-3 py-1.5 border ${
                      orderFilter === f.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface-1'
                    }`}
                  >
                    <Text
                      className={`text-[12px] ${
                        orderFilter === f.id ? 'font-semibold text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {filteredOrders.length === 0 ? (
                <View className="items-center justify-center py-12 rounded-card border border-border bg-card">
                  <Icon as={ShoppingBag} size={40} className="text-muted-foreground mb-2" />
                  <Text className="text-[14px] font-medium text-foreground">
                    Chưa có đơn hàng nào
                  </Text>
                  <Text className="text-[12px] text-muted-foreground">
                    Khi khách đặt mua sản phẩm, đơn hàng sẽ hiển thị tại đây.
                  </Text>
                </View>
              ) : (
                filteredOrders.map((order) => (
                  <View
                    key={order.id}
                    className="rounded-card border border-border bg-card p-4 gap-3"
                  >
                    {/* Header */}
                    <View className="flex-row items-center justify-between pb-2 border-b border-border">
                      <View className="gap-0.5">
                        <Text className="text-[13px] font-bold text-foreground">
                          {order.id}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </Text>
                      </View>
                      <View
                        className={`rounded-pill px-2.5 py-1 ${
                          order.status === 'completed'
                            ? 'bg-success/15'
                            : order.status === 'shipping'
                            ? 'bg-blue-500/15'
                            : order.status === 'confirmed'
                            ? 'bg-purple-500/15'
                            : order.status === 'pending'
                            ? 'bg-warning/15'
                            : 'bg-destructive/15'
                        }`}
                      >
                        <Text
                          className={`text-[11.5px] font-semibold ${
                            order.status === 'completed'
                              ? 'text-success'
                              : order.status === 'shipping'
                              ? 'text-blue-400'
                              : order.status === 'confirmed'
                              ? 'text-purple-400'
                              : order.status === 'pending'
                              ? 'text-warning'
                              : 'text-destructive'
                          }`}
                        >
                          {order.status === 'completed'
                            ? 'Đã giao thành công'
                            : order.status === 'shipping'
                            ? 'Đang giao hàng'
                            : order.status === 'confirmed'
                            ? 'Đang đóng gói'
                            : order.status === 'pending'
                            ? 'Chờ xác nhận'
                            : 'Đã huỷ'}
                        </Text>
                      </View>
                    </View>

                    {/* Customer Info */}
                    <View className="rounded-control bg-surface-1 p-2.5 gap-1 border border-border">
                      <Text className="text-[13px] font-semibold text-foreground">
                        Khách hàng: {order.customerName}
                      </Text>
                      <Text className="text-[12px] text-muted-foreground">
                        SĐT: <Text className="font-medium text-foreground">{order.customerPhone}</Text>
                      </Text>
                      <Text className="text-[12px] text-muted-foreground">
                        Địa chỉ: {order.customerAddress}
                      </Text>
                      {order.note && (
                        <Text className="text-[12px] italic text-primary">
                          Ghi chú: {order.note}
                        </Text>
                      )}
                    </View>

                    {/* Product & Payment */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-[13.5px] font-medium text-foreground" numberOfLines={1}>
                          {order.productName}
                        </Text>
                        <Text className="text-[12px] text-muted-foreground">
                          SL: {order.quantity} • {order.paymentMethod.toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-[15px] font-bold text-primary">
                        {order.totalFormatted}
                      </Text>
                    </View>

                    {/* Admin Action Buttons */}
                    <View className="flex-row gap-2 pt-2 border-t border-border">
                      {order.status === 'pending' && (
                        <>
                          <Pressable
                            role="button"
                            onPress={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            className="flex-1 h-9 items-center justify-center rounded-control bg-primary active:opacity-90"
                          >
                            <Text className="text-[12.5px] font-semibold text-primary-foreground">
                              Xác nhận & Đóng gói
                            </Text>
                          </Pressable>
                          <Pressable
                            role="button"
                            onPress={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="h-9 px-3 items-center justify-center rounded-control border border-destructive/40 active:bg-destructive/10"
                          >
                            <Text className="text-[12.5px] font-medium text-destructive">
                              Huỷ đơn
                            </Text>
                          </Pressable>
                        </>
                      )}

                      {order.status === 'confirmed' && (
                        <Pressable
                          role="button"
                          onPress={() => handleUpdateOrderStatus(order.id, 'shipping')}
                          className="flex-1 h-9 flex-row items-center justify-center gap-1.5 rounded-control bg-blue-600 active:opacity-90"
                        >
                          <Icon as={Truck} size={15} className="text-white" />
                          <Text className="text-[12.5px] font-semibold text-white">
                            Giao cho Shipper vận chuyển
                          </Text>
                        </Pressable>
                      )}

                      {order.status === 'shipping' && (
                        <Pressable
                          role="button"
                          onPress={() => handleUpdateOrderStatus(order.id, 'completed')}
                          className="flex-1 h-9 flex-row items-center justify-center gap-1.5 rounded-control bg-success active:opacity-90"
                        >
                          <Icon as={CheckCircle2} size={15} className="text-white" />
                          <Text className="text-[12.5px] font-semibold text-white">
                            Xác nhận đã giao (Hoàn tất)
                          </Text>
                        </Pressable>
                      )}

                      {order.status === 'completed' && (
                        <View className="flex-1 py-1 flex-row items-center justify-center gap-1">
                          <Icon as={CheckCircle2} size={14} className="text-success" />
                          <Text className="text-[12px] font-medium text-success">
                            Đơn hàng đã hoàn thành và cộng vào doanh thu
                          </Text>
                        </View>
                      )}

                      {order.status === 'cancelled' && (
                        <View className="flex-1 py-1 flex-row items-center justify-center gap-1">
                          <Icon as={XCircle} size={14} className="text-destructive" />
                          <Text className="text-[12px] font-medium text-destructive">
                            Đơn hàng đã huỷ
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {/* TAB 2: PRODUCTS (CATALOG & ADD PRODUCT) */}
          {activeTab === 'products' && (
            <>
              {/* Add New Product Button */}
              <Pressable
                role="button"
                onPress={() => setShowAddProductModal(true)}
                className="h-12 flex-row items-center justify-center gap-2 rounded-control bg-primary active:opacity-90 shadow-sm"
              >
                <Icon as={Plus} size={18} className="text-primary-foreground" />
                <Text className="text-[15px] font-semibold text-primary-foreground">
                  + Bán thêm sản phẩm mới
                </Text>
              </Pressable>

              <Text className="text-[13px] font-medium text-muted-foreground pt-1">
                Danh sách sản phẩm đang bán trên ứng dụng ({filteredProducts.length})
              </Text>

              {filteredProducts.map((p) => (
                <View
                  key={p.id}
                  className="rounded-card border border-border bg-card p-3.5 flex-row gap-3"
                >
                  <Image
                    source={{ uri: p.imageUrl }}
                    className="size-20 rounded-control bg-surface-2 border border-border"
                    contentFit="cover"
                  />
                  <View className="flex-1 justify-between">
                    <View className="gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[11.5px] font-semibold text-primary uppercase">
                          {p.brand}
                        </Text>
                        {p.isCustom ? (
                          <View className="bg-purple-500/15 px-2 py-0.5 rounded-pill">
                            <Text className="text-[10.5px] font-semibold text-purple-400">
                              Admin thêm
                            </Text>
                          </View>
                        ) : (
                          <View className="bg-success/15 px-2 py-0.5 rounded-pill">
                            <Text className="text-[10.5px] font-semibold text-success">
                              SkinSense Gốc
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-[14px] font-medium text-foreground" numberOfLines={2}>
                        {p.name}
                      </Text>
                      <Text className="text-[14px] font-bold text-primary">
                        {p.priceFormatted}
                      </Text>
                    </View>

                    {/* Custom Product Actions */}
                    {p.isCustom && (
                      <View className="flex-row items-center justify-between pt-2 border-t border-border mt-1">
                        <Pressable
                          role="button"
                          onPress={() => handleToggleProductActive(p.id, p.isActive)}
                          className="flex-row items-center gap-1.5"
                        >
                          <View
                            className={`size-2.5 rounded-pill ${
                              p.isActive !== false ? 'bg-success' : 'bg-destructive'
                            }`}
                          />
                          <Text className="text-[11.5px] font-medium text-muted-foreground">
                            {p.isActive !== false ? 'Đang bán' : 'Tạm hết hàng'}
                          </Text>
                        </Pressable>

                        <Pressable
                          role="button"
                          onPress={() => handleDeleteProduct(p.id)}
                          className="flex-row items-center gap-1 px-2 py-1 rounded-control bg-destructive/10"
                        >
                          <Icon as={Trash2} size={13} className="text-destructive" />
                          <Text className="text-[11.5px] font-medium text-destructive">Xoá</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* TAB 3: ANALYTICS */}
          {activeTab === 'analytics' && (
            <View className="gap-3">
              <View className="rounded-card border border-border bg-card p-4 gap-3">
                <Text className="text-[15px] font-semibold text-foreground">
                  Hiệu quả kinh doanh độc quyền
                </Text>

                <View className="gap-2.5">
                  <View className="flex-row items-center justify-between py-1 border-b border-border">
                    <Text className="text-[13px] text-muted-foreground">Doanh thu đã thu về</Text>
                    <Text className="text-[15px] font-bold text-success">
                      {formatVnd(totalRevenue)}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between py-1 border-b border-border">
                    <Text className="text-[13px] text-muted-foreground">Đang vận chuyển (dự kiến)</Text>
                    <Text className="text-[14px] font-bold text-foreground">
                      {formatVnd(inTransitAmount)}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between py-1 border-b border-border">
                    <Text className="text-[13px] text-muted-foreground">Tỷ lệ hoàn thành đơn</Text>
                    <Text className="text-[14px] font-bold text-primary">
                      {orders.length > 0
                        ? `${Math.round((completedOrders.length / orders.length) * 100)}%`
                        : '0%'}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between py-1">
                    <Text className="text-[13px] text-muted-foreground">Phương thức chuyển khoản VietQR</Text>
                    <Text className="text-[14px] font-bold text-foreground">
                      {orders.filter((o) => o.paymentMethod === 'vietqr').length} đơn
                    </Text>
                  </View>
                </View>
              </View>

              <View className="rounded-card border border-border bg-card p-4 gap-2">
                <Text className="text-[15px] font-semibold text-foreground">
                  Ghi chú cho Quản trị viên
                </Text>
                <Text className="text-[12.5px] text-muted-foreground leading-5">
                  Hệ thống SkinSense Boutique hoạt động hoàn toàn độc quyền trong ứng dụng. Mọi sản phẩm bạn thêm mới sẽ xuất hiện trực tiếp cho người dùng đặt mua không qua bất kỳ bên trung gian nào. Tiền thanh toán VietQR chuyển thẳng về tài khoản ngân hàng của bạn.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal: Add New Product */}
      {showAddProductModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddProductModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View
              style={{ paddingBottom: Math.max(bottom, 28) }}
              className="w-full max-h-[88%] rounded-t-sheet border-t border-border bg-card p-5"
            >
              <View className="flex-row items-center justify-between pb-3 border-b border-border">
                <Text className="text-[16px] font-bold text-foreground">
                  + Bán thêm sản phẩm mới
                </Text>
                <Pressable
                  role="button"
                  onPress={() => setShowAddProductModal(false)}
                  className="size-8 items-center justify-center rounded-pill active:bg-surface-2"
                >
                  <Icon as={X} size={18} className="text-muted-foreground" />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 14, gap: 12 }}
              >
                <View className="gap-1">
                  <Text className="text-[12.5px] font-medium text-muted-foreground">
                    Tên sản phẩm <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    value={newProdName}
                    onChangeText={setNewProdName}
                    placeholder="Ví dụ: Tinh Chất B5 Phục Hồi Chuyên Sâu"
                    placeholderTextColor="#888"
                    className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-[12.5px] font-medium text-muted-foreground">
                      Thương hiệu
                    </Text>
                    <TextInput
                      value={newProdBrand}
                      onChangeText={setNewProdBrand}
                      placeholder="SkinSense Clinic"
                      placeholderTextColor="#888"
                      className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                    />
                  </View>

                  <View className="flex-1 gap-1">
                    <Text className="text-[12.5px] font-medium text-muted-foreground">
                      Giá bán (VND) <Text className="text-destructive">*</Text>
                    </Text>
                    <TextInput
                      value={newProdPrice}
                      onChangeText={setNewProdPrice}
                      placeholder="350000"
                      keyboardType="numeric"
                      placeholderTextColor="#888"
                      className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                    />
                  </View>
                </View>

                <View className="gap-1">
                  <Text className="text-[12.5px] font-medium text-muted-foreground">
                    Danh mục sản phẩm
                  </Text>
                  <TextInput
                    value={newProdCategory}
                    onChangeText={setNewProdCategory}
                    placeholder="Serum phục hồi / Kem dưỡng / Chống nắng"
                    placeholderTextColor="#888"
                    className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-[12.5px] font-medium text-muted-foreground">
                    Tóm tắt công dụng & Thành phần <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    value={newProdSummary}
                    onChangeText={setNewProdSummary}
                    placeholder="Công thức 5% Vitamin B5 và Madecassoside làm dịu da cấp tốc..."
                    placeholderTextColor="#888"
                    multiline
                    numberOfLines={2}
                    className="min-h-[50px] rounded-control border border-border bg-surface-1 px-3 py-2 text-[14px] text-foreground"
                  />
                </View>

                {/* Preset Image Picker */}
                <View className="gap-1.5">
                  <Text className="text-[12.5px] font-medium text-muted-foreground">
                    Chọn ảnh sản phẩm mẫu
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {PRESET_IMAGES.map((img, i) => (
                      <Pressable
                        key={i}
                        role="button"
                        onPress={() => setNewProdImage(img.url)}
                        className={`size-16 rounded-control overflow-hidden border-2 ${
                          newProdImage === img.url ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <Image source={{ uri: img.url }} className="size-full" contentFit="cover" />
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>

              <View className="flex-row gap-3 pt-3 border-t border-border">
                <Pressable
                  role="button"
                  onPress={() => setShowAddProductModal(false)}
                  className="flex-1 h-11 items-center justify-center rounded-control border border-border"
                >
                  <Text className="text-[14px] font-medium text-foreground">Huỷ</Text>
                </Pressable>
                <Pressable
                  role="button"
                  disabled={savingProduct}
                  onPress={handleSaveNewProduct}
                  className="flex-1 h-11 items-center justify-center rounded-control bg-primary active:opacity-90"
                >
                  {savingProduct ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-[14px] font-semibold text-primary-foreground">
                      Lưu & Bày bán ngay
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
