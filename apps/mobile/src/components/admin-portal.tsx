import {
  formatVnd,
  type Order,
  type OrderStatus,
  type Shop,
  type ShopStatus,
  type SkinConditionClass,
  type WithdrawalRequest,
  type Zone,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowDownToLine,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  DollarSign,
  MapPin,
  Package,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Tag,
  Trash2,
  Truck,
  User,
  Users,
  Wallet,
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
import { getAllUsers, toggleUserStatus, type AuthUser, type UserRole } from '@/lib/auth';
import {
  approveWithdrawal,
  deleteCustomProduct,
  loadAllStoreProducts,
  loadOrders,
  loadShops,
  loadWithdrawalRequests,
  onMarketplaceChange,
  registerShop,
  rejectWithdrawal,
  saveCustomProduct,
  type StoreProduct,
  toggleProductActive,
  toggleShopOfficial,
  updateOrderStatus,
  updateShopStatus,
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
  const [shops, setShops] = useState<Shop[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'orders' | 'products' | 'shops' | 'analytics' | 'users'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'shops' | 'analytics' | 'users'>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [shopFilter, setShopFilter] = useState<'all' | ShopStatus>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
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

  // Add Shop Modal
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [savingShop, setSavingShop] = useState(false);

  async function refreshData() {
    try {
      const [allOrders, allProducts, allShops, allWithdrawals, allUsers] = await Promise.all([
        loadOrders(),
        loadAllStoreProducts(),
        loadShops(),
        loadWithdrawalRequests(),
        getAllUsers(),
      ]);
      setOrders(allOrders);
      setProducts(allProducts);
      setShops(allShops);
      setWithdrawals(allWithdrawals);
      setUsers(allUsers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    const unsubscribe = onMarketplaceChange(() => {
      void refreshData();
    });
    return unsubscribe;
  }, []);

  async function handleApproveWithdrawal(requestId: string) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await approveWithdrawal(requestId);
    await refreshData();
    Alert.alert('Thành công', 'Đã phê duyệt lệnh rút tiền và đối soát chuyển khoản cho Shop.');
  }

  async function handleRejectWithdrawal(requestId: string) {
    Alert.alert('Từ chối lệnh rút tiền', 'Bạn có chắc chắn muốn từ chối và hoàn tiền lại vào ví Shop?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: async () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          await rejectWithdrawal(requestId, 'Thông tin tài khoản không khớp');
          await refreshData();
        },
      },
    ]);
  }

  async function handleApproveShop(shopId: string, shopName: string) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await updateShopStatus(shopId, 'approved');
    Alert.alert('Đã duyệt mở bán', `Gian hàng "${shopName}" đã được phê duyệt và mở bán chính thức trên sàn Shopee Mall.`);
    await refreshData();
  }

  async function handleRejectShop(shopId: string, shopName: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await updateShopStatus(shopId, 'rejected');
    Alert.alert('Đã khóa gian hàng', `Gian hàng "${shopName}" đã bị từ chối / tạm khóa hoạt động.`);
    await refreshData();
  }

  async function handleToggleShopMall(shopId: string) {
    void Haptics.selectionAsync().catch(() => {});
    const isNowOfficial = await toggleShopOfficial(shopId);
    Alert.alert(
      isNowOfficial ? 'Đã cấp Shopee Mall' : 'Đã gỡ Shopee Mall',
      isNowOfficial
        ? 'Gian hàng đã được gắn huy hiệu Shopee Mall chính hãng.'
        : 'Gian hàng đã chuyển về shop tiêu chuẩn.',
    );
    await refreshData();
  }

  async function handleCreateNewShop() {
    if (!newShopName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên gian hàng');
      return;
    }
    if (!newOwnerName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên chủ gian hàng');
      return;
    }
    if (!newShopPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại');
      return;
    }

    setSavingShop(true);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await registerShop({
        shopName: newShopName.trim(),
        ownerName: newOwnerName.trim(),
        phone: newShopPhone.trim(),
        address: newShopAddress.trim() || 'Hà Nội',
      });
      setShowAddShopModal(false);
      setNewShopName('');
      setNewOwnerName('');
      setNewShopPhone('');
      setNewShopAddress('');
      Alert.alert('Thành công', 'Đã tạo gian hàng mới. Gian hàng đang ở trạng thái Chờ duyệt.');
      await refreshData();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo gian hàng. Vui lòng thử lại.');
    } finally {
      setSavingShop(false);
    }
  }

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

  // Shops Metrics & Filtering
  const pendingShops = shops.filter((s) => s.status === 'pending');
  const approvedShops = shops.filter((s) => s.status === 'approved');
  const rejectedShops = shops.filter((s) => s.status === 'rejected');

  const filteredShops = shops.filter((s) => {
    if (shopFilter !== 'all' && s.status !== shopFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.shopName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // User Management Filtering
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phoneNumber.includes(q) ||
        Boolean(u.shopName && u.shopName.toLowerCase().includes(q)) ||
        Boolean(u.specialty && u.specialty.toLowerCase().includes(q))
      );
    }
    return true;
  });

  async function handleToggleUserStatus(userId: string, currentStatus?: 'active' | 'blocked') {
    const isBlocking = currentStatus !== 'blocked';
    Alert.alert(
      isBlocking ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      isBlocking
        ? 'Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập vào SkinSense.'
        : 'Bạn có chắc muốn kích hoạt mở khóa lại cho tài khoản này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: isBlocking ? 'Khóa ngay' : 'Mở khóa',
          style: isBlocking ? 'destructive' : 'default',
          onPress: async () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            try {
              const updated = await toggleUserStatus(userId);
              await refreshData();
              Alert.alert(
                'Thành công',
                `Đã ${updated.status === 'blocked' ? 'khóa' : 'mở khóa'} tài khoản ${updated.fullName} (${updated.email}).`,
              );
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể cập nhật trạng thái người dùng.');
            }
          },
        },
      ],
    );
  }

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
      <View className="flex-row gap-2.5 p-4 pb-2">
        <View className="flex-1 rounded-card border border-border/80 bg-card p-3 gap-1 shadow-xs">
          <View className="flex-row items-center justify-between">
            <Text className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Doanh thu thực</Text>
            <Icon as={DollarSign} size={14} className="text-emerald-400" />
          </View>
          <Text className="font-display text-[17px] font-bold text-emerald-400">
            {formatVnd(totalRevenue)}
          </Text>
          <Text className="text-[10.5px] text-muted-foreground">
            {completedOrders.length} đơn hoàn thành
          </Text>
        </View>

        <View className="flex-1 rounded-card border border-border/80 bg-card p-3 gap-1 shadow-xs">
          <View className="flex-row items-center justify-between">
            <Text className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Đơn đặt hàng</Text>
            <Icon as={ShoppingBag} size={14} className="text-primary" />
          </View>
          <Text className="font-display text-[17px] font-bold text-primary">{orders.length} đơn</Text>
          <Text className="text-[10.5px] text-amber-400 font-medium">
            {pendingOrders.length} đơn chờ xử lý
          </Text>
        </View>

        <View className="flex-1 rounded-card border border-border/80 bg-card p-3 gap-1 shadow-xs">
          <View className="flex-row items-center justify-between">
            <Text className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Kho hàng</Text>
            <Icon as={Package} size={14} className="text-primary" />
          </View>
          <Text className="font-display text-[17px] font-bold text-primary">{products.length} SP</Text>
          <Text className="text-[10.5px] text-muted-foreground">
            {products.filter((p) => p.isCustom).length} SP thêm mới
          </Text>
        </View>
      </View>

      {/* Tabs Selector */}
      <View className="px-4 py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          className="rounded-control border border-border bg-surface-1 p-1"
        >
          <Pressable
            role="tab"
            accessibilityState={{ selected: activeTab === 'orders' }}
            onPress={() => setActiveTab('orders')}
            className={`px-3 py-2 rounded-control flex-row items-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-card border border-border' : ''
            }`}
          >
            <Text
              className={`text-[12.5px] font-medium ${
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
            className={`px-3 py-2 rounded-control items-center justify-center ${
              activeTab === 'products' ? 'bg-card border border-border' : ''
            }`}
          >
            <Text
              className={`text-[12.5px] font-medium ${
                activeTab === 'products' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Bán thêm sản phẩm ({products.length})
            </Text>
          </Pressable>

          <Pressable
            role="tab"
            accessibilityState={{ selected: activeTab === 'shops' }}
            onPress={() => setActiveTab('shops')}
            className={`px-3 py-2 rounded-control flex-row items-center gap-1.5 ${
              activeTab === 'shops' ? 'bg-card border border-border' : ''
            }`}
          >
            <Text
              className={`text-[12.5px] font-medium ${
                activeTab === 'shops' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Duyệt Shop ({shops.length})
            </Text>
            {pendingShops.length > 0 && (
              <View className="size-2 rounded-pill bg-destructive" />
            )}
          </Pressable>

          <Pressable
            role="tab"
            accessibilityState={{ selected: activeTab === 'analytics' }}
            onPress={() => setActiveTab('analytics')}
            className={`px-3 py-2 rounded-control flex-row items-center gap-1.5 ${
              activeTab === 'analytics' ? 'bg-card border border-border' : ''
            }`}
          >
            <Text
              className={`text-[12.5px] font-medium ${
                activeTab === 'analytics' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Tài chính & Ví Shop
            </Text>
            {withdrawals.filter((w) => w.status === 'pending').length > 0 && (
              <View className="size-2 rounded-pill bg-warning" />
            )}
          </Pressable>

          <Pressable
            role="tab"
            accessibilityLabel="Người dùng"
            accessibilityState={{ selected: activeTab === 'users' }}
            onPress={() => setActiveTab('users')}
            className={`px-3 py-2 rounded-control flex-row items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-card border border-border' : ''
            }`}
          >
            <Text
              className={`text-[12.5px] font-medium ${
                activeTab === 'users' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Người dùng ({users.length})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Search Input */}
      {activeTab !== 'analytics' && activeTab !== 'users' && (
        <View className="px-4 pb-2">
          <View className="flex-row items-center gap-2 rounded-control border border-border bg-surface-1 px-3 py-2">
            <Icon as={Search} size={16} className="text-muted-foreground" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                activeTab === 'orders'
                  ? 'Tìm theo tên khách, SĐT, mã đơn...'
                  : activeTab === 'shops'
                  ? 'Tìm shop theo tên, chủ shop, SĐT...'
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

          {/* TAB 3: SHOPS APPROVAL & MANAGEMENT */}
          {activeTab === 'shops' && (
            <>
              {/* Add New Shop Button */}
              <Pressable
                role="button"
                onPress={() => setShowAddShopModal(true)}
                className="h-12 flex-row items-center justify-center gap-2 rounded-control bg-primary active:opacity-90 shadow-sm"
              >
                <Icon as={Plus} size={18} className="text-primary-foreground" />
                <Text className="text-[15px] font-semibold text-primary-foreground">
                  + Tạo Shop Bán Hàng Mới
                </Text>
              </Pressable>

              {/* Shop Status Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              >
                {(
                  [
                    { id: 'all', label: `Tất cả (${shops.length})` },
                    { id: 'pending', label: `Chờ duyệt (${pendingShops.length})` },
                    { id: 'approved', label: `Đang bán (${approvedShops.length})` },
                    { id: 'rejected', label: `Đã khóa (${rejectedShops.length})` },
                  ] as const
                ).map((f) => (
                  <Pressable
                    key={f.id}
                    role="button"
                    onPress={() => setShopFilter(f.id)}
                    className={`rounded-pill px-3 py-1.5 border ${
                      shopFilter === f.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface-1'
                    }`}
                  >
                    <Text
                      className={`text-[12px] ${
                        shopFilter === f.id ? 'font-semibold text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Pending Alert if any */}
              {pendingShops.length > 0 && shopFilter !== 'approved' && shopFilter !== 'rejected' && (
                <View className="rounded-control bg-warning/10 border border-warning/30 p-3 flex-row items-center gap-2.5">
                  <Icon as={Clock} size={18} className="text-warning" />
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-warning">
                      Có {pendingShops.length} hồ sơ gian hàng mới chờ bạn duyệt!
                    </Text>
                    <Text className="text-[11.5px] text-muted-foreground">
                      Duyệt để shop xuất hiện trên sàn Shopee Mall và bắt đầu bán hàng.
                    </Text>
                  </View>
                </View>
              )}

              {filteredShops.length === 0 ? (
                <View className="items-center justify-center py-12 rounded-card border border-border bg-card">
                  <Icon as={Store} size={40} className="text-muted-foreground mb-2" />
                  <Text className="text-[14px] font-medium text-foreground">
                    Không có gian hàng nào
                  </Text>
                  <Text className="text-[12px] text-muted-foreground">
                    Danh sách các shop đối tác sẽ hiển thị tại đây.
                  </Text>
                </View>
              ) : (
                filteredShops.map((s) => {
                  const shopOrders = orders.filter((o) => o.shopId === s.id);
                  const shopRevenue = shopOrders
                    .filter((o) => o.status === 'completed')
                    .reduce((sum, o) => sum + o.totalVnd, 0);

                  return (
                    <View
                      key={s.id}
                      className="rounded-card border border-border bg-card p-4 gap-3"
                    >
                      {/* Shop Header */}
                      <View className="flex-row items-start justify-between pb-2 border-b border-border">
                        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                          <Image
                            source={{ uri: s.avatarUrl }}
                            className="size-11 rounded-pill bg-surface-2 border border-border"
                            contentFit="cover"
                          />
                          <View className="flex-1">
                            <View className="flex-row items-center gap-1.5 flex-wrap">
                              <Text className="text-[14.5px] font-bold text-foreground">
                                {s.shopName}
                              </Text>
                              {s.isOfficial ? (
                                <View className="rounded-pill bg-destructive/15 px-1.5 py-0.5">
                                  <Text className="text-[10px] font-bold text-destructive uppercase">
                                    Shopee Mall
                                  </Text>
                                </View>
                              ) : (
                                <View className="rounded-pill bg-blue-500/15 px-1.5 py-0.5">
                                  <Text className="text-[10px] font-bold text-blue-500 uppercase">
                                    Shop Chuẩn
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-[12px] text-muted-foreground">
                              Chủ shop: <Text className="font-medium text-foreground">{s.ownerName}</Text> • SĐT: {s.phone}
                            </Text>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View
                          className={`rounded-pill px-2.5 py-1 ${
                            s.status === 'approved'
                              ? 'bg-success/15'
                              : s.status === 'pending'
                              ? 'bg-warning/15'
                              : 'bg-destructive/15'
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-bold uppercase ${
                              s.status === 'approved'
                                ? 'text-success'
                                : s.status === 'pending'
                                ? 'text-warning'
                                : 'text-destructive'
                            }`}
                          >
                            {s.status === 'approved'
                              ? 'Đang Bán'
                              : s.status === 'pending'
                              ? 'Chờ Duyệt'
                              : 'Đã Khóa'}
                          </Text>
                        </View>
                      </View>

                      {/* Shop Details */}
                      <View className="gap-1.5">
                        <View className="flex-row items-start gap-1.5">
                          <Icon as={MapPin} size={13} className="text-muted-foreground mt-0.5" />
                          <Text className="text-[12px] text-muted-foreground flex-1">
                            Kho hàng: <Text className="text-foreground">{s.address}</Text>
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between pt-1">
                          <Text className="text-[12px] text-muted-foreground">
                            Đơn hàng: <Text className="font-semibold text-foreground">{shopOrders.length} đơn</Text>
                          </Text>
                          <Text className="text-[12px] text-muted-foreground">
                            Doanh thu shop: <Text className="font-bold text-primary">{formatVnd(shopRevenue)}</Text>
                          </Text>
                        </View>
                      </View>

                      {/* Admin Action Buttons */}
                      <View className="flex-row items-center gap-2 pt-2 border-t border-border">
                        {s.status === 'pending' && (
                          <>
                            <Pressable
                              role="button"
                              onPress={() => handleApproveShop(s.id, s.shopName)}
                              className="flex-1 h-9 flex-row items-center justify-center gap-1.5 rounded-control bg-success active:opacity-90"
                            >
                              <Icon as={CheckCircle2} size={14} className="text-white" />
                              <Text className="text-[12.5px] font-bold text-white">
                                Duyệt Mở Bán
                              </Text>
                            </Pressable>

                            <Pressable
                              role="button"
                              onPress={() => handleRejectShop(s.id, s.shopName)}
                              className="h-9 px-3 flex-row items-center justify-center gap-1 rounded-control bg-destructive/15 active:opacity-90"
                            >
                              <Icon as={XCircle} size={14} className="text-destructive" />
                              <Text className="text-[12px] font-medium text-destructive">
                                Từ Chối
                              </Text>
                            </Pressable>
                          </>
                        )}

                        {s.status === 'approved' && (
                          <>
                            <Pressable
                              role="button"
                              onPress={() => handleToggleShopMall(s.id)}
                              className={`flex-1 h-9 flex-row items-center justify-center gap-1.5 rounded-control border ${
                                s.isOfficial
                                  ? 'border-destructive/30 bg-destructive/10'
                                  : 'border-amber-500/30 bg-amber-500/10'
                              }`}
                            >
                              <Icon
                                as={BadgeCheck}
                                size={14}
                                className={s.isOfficial ? 'text-destructive' : 'text-amber-500'}
                              />
                              <Text
                                className={`text-[12px] font-semibold ${
                                  s.isOfficial ? 'text-destructive' : 'text-amber-500'
                                }`}
                              >
                                {s.isOfficial ? 'Gỡ Shopee Mall' : 'Cấp Shopee Mall'}
                              </Text>
                            </Pressable>

                            <Pressable
                              role="button"
                              onPress={() => handleRejectShop(s.id, s.shopName)}
                              className="h-9 px-3 flex-row items-center justify-center gap-1 rounded-control bg-surface-2 active:opacity-80"
                            >
                              <Icon as={XCircle} size={13} className="text-muted-foreground" />
                              <Text className="text-[12px] text-muted-foreground">
                                Tạm Khóa
                              </Text>
                            </Pressable>
                          </>
                        )}

                        {s.status === 'rejected' && (
                          <Pressable
                            role="button"
                            onPress={() => handleApproveShop(s.id, s.shopName)}
                            className="flex-1 h-9 flex-row items-center justify-center gap-1.5 rounded-control bg-primary active:opacity-90"
                          >
                            <Icon as={CheckCircle2} size={14} className="text-primary-foreground" />
                            <Text className="text-[12.5px] font-bold text-primary-foreground">
                              Mở Lại Hoạt Động
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* TAB 4: FINANCIALS & SHOP WITHDRAWALS */}
          {activeTab === 'analytics' && (
            <View className="gap-3.5">
              {/* Platform Overview */}
              <View className="rounded-card border border-border/80 bg-card p-4 gap-3 shadow-xs">
                <View className="flex-row items-center justify-between">
                  <Text className="font-display text-[15px] font-bold text-foreground">
                    Tài Chính & Doanh Thu Sàn SkinSense
                  </Text>
                  <View className="rounded-pill bg-primary/10 border border-primary/20 px-2.5 py-0.5">
                    <Text className="text-[11px] font-bold text-primary">Phí sàn: 5%</Text>
                  </View>
                </View>

                <View className="gap-2.5">
                  <View className="flex-row items-center justify-between py-1 border-b border-border/40">
                    <Text className="text-[12.5px] text-muted-foreground">Tổng GMV giao dịch toàn sàn</Text>
                    <Text className="font-display text-[17px] font-bold text-primary">
                      {formatVnd(orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalVnd : 0), 0))}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between py-1 border-b border-border/40">
                    <Text className="text-[12.5px] text-muted-foreground">Hoa hồng sàn thu được (5%)</Text>
                    <Text className="font-display text-[17px] font-bold text-emerald-400">
                      +{formatVnd(completedOrders.reduce((sum, o) => sum + (o.platformFeeVnd || Math.round(o.totalVnd * 0.05)), 0))}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between py-1 border-b border-border/40">
                    <Text className="text-[12.5px] text-muted-foreground">Gian hàng đang hoạt động</Text>
                    <Text className="font-display text-[15px] font-bold text-foreground">
                      {shops.filter((s) => s.status === 'approved').length} Shop
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between py-1">
                    <Text className="text-[12.5px] text-muted-foreground">Tỷ lệ đơn hoàn thành</Text>
                    <Text className="font-display text-[15px] font-bold text-primary">
                      {orders.length > 0
                        ? `${Math.round((completedOrders.length / orders.length) * 100)}%`
                        : '0%'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Shop Withdrawal Requests Management */}
              <View className="rounded-card border border-border bg-card p-4 gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[15px] font-semibold text-foreground">
                    Duyệt Lệnh Rút Tiền Ví Shop ({withdrawals.length})
                  </Text>
                  {withdrawals.filter((w) => w.status === 'pending').length > 0 && (
                    <View className="rounded-pill bg-warning/20 px-2 py-0.5 border border-warning/40">
                      <Text className="text-[10.5px] font-bold text-warning">
                        {withdrawals.filter((w) => w.status === 'pending').length} chờ duyệt
                      </Text>
                    </View>
                  )}
                </View>

                {withdrawals.length === 0 ? (
                  <Text className="text-[12px] text-muted-foreground py-2 text-center">
                    Chưa có yêu cầu rút tiền nào từ các gian hàng.
                  </Text>
                ) : (
                  withdrawals.map((w) => {
                    const isPending = w.status === 'pending';
                    const isApproved = w.status === 'approved';
                    const isRejected = w.status === 'rejected';

                    return (
                      <View
                        key={w.id}
                        className="rounded-control bg-surface-1 p-3 border border-border/50 gap-2"
                      >
                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text className="text-[13px] font-bold text-foreground">{w.shopName}</Text>
                            <Text className="text-[11px] font-mono text-muted-foreground">Mã: {w.id}</Text>
                          </View>
                          <Text className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">
                            {w.amountFormatted}
                          </Text>
                        </View>

                        <View className="rounded-control bg-surface-2 p-2 gap-0.5">
                          <Text className="text-[11.5px] font-semibold text-foreground">
                            Ngân hàng: {w.bankName}
                          </Text>
                          <Text className="text-[11.5px] font-mono text-foreground">
                            STK: {w.accountNumber} • Chủ TK: {w.accountHolder}
                          </Text>
                          <Text className="text-[10.5px] text-muted-foreground">
                            Ngày tạo: {new Date(w.createdAt).toLocaleDateString('vi-VN')} {new Date(w.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>

                        {isPending ? (
                          <View className="flex-row gap-2 pt-1 border-t border-border/30">
                            <Pressable
                              role="button"
                              accessibilityLabel={`Từ chối lệnh rút ${w.id}`}
                              onPress={() => handleRejectWithdrawal(w.id)}
                              className="flex-1 h-9 items-center justify-center rounded-control border border-rose-500/40 bg-rose-500/10 active:opacity-80"
                            >
                              <Text className="text-[12px] font-semibold text-rose-600 dark:text-rose-400">
                                Từ chối
                              </Text>
                            </Pressable>
                            <Pressable
                              role="button"
                              accessibilityLabel={`Duyệt chuyển khoản ${w.id}`}
                              onPress={() => handleApproveWithdrawal(w.id)}
                              className="flex-1 h-9 items-center justify-center rounded-control bg-primary active:opacity-90"
                            >
                              <Text className="text-[12px] font-bold text-primary-foreground">
                                Duyệt chuyển khoản
                              </Text>
                            </Pressable>
                          </View>
                        ) : (
                          <View className="self-end rounded-pill px-2.5 py-0.5 bg-surface-3">
                            <Text
                              className={`text-[11px] font-bold ${
                                isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isApproved ? '✓ Đã chuyển khoản đối soát' : '✕ Đã từ chối'}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {/* TAB 5: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <View className="gap-3.5">
              {/* User search bar */}
              <View className="flex-row items-center gap-2 rounded-control border border-border/80 bg-surface-1 px-3 py-2">
                <Icon as={Search} size={16} className="text-muted-foreground" />
                <TextInput
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                  placeholder="Tìm theo tên, email, SĐT..."
                  placeholderTextColor="#777"
                  className="flex-1 text-[13px] text-foreground p-0"
                />
                {userSearchQuery.length > 0 && (
                  <Pressable onPress={() => setUserSearchQuery('')} className="active:scale-[0.98]">
                    <Icon as={X} size={15} className="text-muted-foreground" />
                  </Pressable>
                )}
              </View>

              {/* Role Filter Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pb-1">
                  {[
                    { id: 'all', label: `Tất cả (${users.length})` },
                    { id: 'customer', label: `Khách hàng (${users.filter((u) => u.role === 'customer').length})` },
                    { id: 'shop', label: `Gian hàng (${users.filter((u) => u.role === 'shop').length})` },
                    { id: 'specialist', label: `Bác sĩ (${users.filter((u) => u.role === 'specialist').length})` },
                    { id: 'admin', label: `Quản trị (${users.filter((u) => u.role === 'admin').length})` },
                  ].map((f) => {
                    const active = userRoleFilter === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        role="button"
                        accessibilityLabel={f.label}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setUserRoleFilter(f.id as any);
                        }}
                        className={`rounded-pill px-3 py-1.5 border active:scale-[0.98] ${
                          active ? 'border-primary bg-primary' : 'border-border/80 bg-card'
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-medium ${
                            active ? 'text-primary-foreground font-bold' : 'text-muted-foreground'
                          }`}
                        >
                          {f.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Users list */}
              <View className="gap-2.5">
                {filteredUsers.length === 0 ? (
                  <View className="items-center justify-center rounded-card border border-border/80 bg-card p-8">
                    <Icon as={Users} size={32} className="text-muted-foreground/60" />
                    <Text className="mt-2 text-[14px] font-medium text-foreground">Không tìm thấy người dùng</Text>
                  </View>
                ) : (
                  filteredUsers.map((u) => {
                    const isBlocked = u.status === 'blocked';
                    const isAdmin = u.role === 'admin';
                    const RoleIcon =
                      u.role === 'specialist'
                        ? Stethoscope
                        : u.role === 'shop'
                          ? Store
                          : u.role === 'admin'
                            ? ShieldCheck
                            : User;

                    const roleLabel =
                      u.role === 'specialist'
                        ? 'Bác Sĩ Da Liễu'
                        : u.role === 'shop'
                          ? 'Gian Hàng'
                          : u.role === 'admin'
                            ? 'Quản Trị Viên'
                            : 'Khách Hàng';

                    return (
                      <View
                        key={u.id}
                        className={`rounded-card border p-3.5 gap-2.5 shadow-xs ${
                          isBlocked
                            ? 'border-rose-500/30 bg-rose-500/5'
                            : 'border-border/80 bg-card'
                        }`}
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-row items-center gap-2.5 flex-1">
                            <View className="size-10 rounded-pill bg-surface-2 border border-border/60 items-center justify-center">
                              <Icon as={RoleIcon} size={18} className={isAdmin ? 'text-purple-400' : 'text-primary'} />
                            </View>
                            <View className="flex-1">
                              <View className="flex-row items-center gap-1.5">
                                <Text className="text-[14px] font-bold text-foreground">{u.fullName}</Text>
                                {isAdmin && (
                                  <View className="rounded bg-purple-500/10 px-1 border border-purple-500/30">
                                    <Text className="text-[9px] font-bold text-purple-600 dark:text-purple-400">ADMIN</Text>
                                  </View>
                                )}
                              </View>
                              <Text className="text-[12px] text-muted-foreground">{u.email}</Text>
                              <Text className="text-[11.5px] text-muted-foreground">SĐT: {u.phoneNumber}</Text>
                              {u.role === 'shop' && u.shopName && (
                                <Text className="text-[11px] text-primary">Shop: {u.shopName}</Text>
                              )}
                              {u.role === 'specialist' && u.specialty && (
                                <Text className="text-[11px] text-emerald-400">Khoa: {u.specialty}</Text>
                              )}
                            </View>
                          </View>

                          <View
                            className={`flex-row items-center gap-1.5 rounded-pill px-2.5 py-0.5 border ${
                              isBlocked
                                ? 'bg-rose-500/15 border-rose-500/30'
                                : 'bg-emerald-500/15 border-emerald-500/30'
                            }`}
                          >
                            <View
                              className={`size-1.5 rounded-full ${
                                isBlocked
                                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                                  : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                              }`}
                            />
                            <Text
                              className={`text-[10px] font-bold ${
                                isBlocked ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {isBlocked ? 'Đang bị khóa' : 'Hoạt động'}
                            </Text>
                          </View>
                        </View>

                        <View className="pt-2 border-t border-border/40 flex-row items-center justify-between">
                          <View className="rounded-control bg-surface-2 border border-border/60 px-2 py-0.5">
                            <Text className="text-[10px] font-semibold text-muted-foreground">{roleLabel}</Text>
                          </View>

                          {isAdmin ? (
                            <Text className="text-[11px] text-muted-foreground italic">
                              Tài khoản cố định
                            </Text>
                          ) : (
                            <Pressable
                              role="button"
                              accessibilityLabel={isBlocked ? `Mở khóa ${u.fullName}` : `Khóa ${u.fullName}`}
                              onPress={() => handleToggleUserStatus(u.id, u.status)}
                              className={`px-3 py-1 rounded-control border active:scale-[0.98] ${
                                isBlocked
                                  ? 'border-emerald-500/40 bg-emerald-500/10'
                                  : 'border-rose-500/40 bg-rose-500/10'
                              }`}
                            >
                              <Text
                                className={`text-[11.5px] font-semibold ${
                                  isBlocked ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
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

      {/* Modal: Add New Shop */}
      {showAddShopModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddShopModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View
              style={{ paddingBottom: Math.max(bottom, 28) }}
              className="w-full max-h-[88%] rounded-t-sheet border-t border-border bg-card p-5"
            >
              <View className="flex-row items-center justify-between pb-3 border-b border-border">
                <View className="flex-row items-center gap-2">
                  <Icon as={Store} size={18} className="text-primary" />
                  <Text className="text-[16px] font-bold text-foreground">
                    + Tạo Shop Bán Hàng Mới
                  </Text>
                </View>
                <Pressable
                  role="button"
                  onPress={() => setShowAddShopModal(false)}
                  className="size-8 items-center justify-center rounded-pill active:bg-surface-2"
                >
                  <Icon as={X} size={18} className="text-muted-foreground" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 14, gap: 12 }}>
                <View className="gap-1">
                  <Text className="text-[12.5px] font-medium text-muted-foreground">
                    Tên gian hàng / Thương hiệu <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    value={newShopName}
                    onChangeText={setNewShopName}
                    placeholder="Ví dụ: Cocolux Dược Mỹ Phẩm"
                    placeholderTextColor="#888"
                    className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-[12.5px] font-medium text-muted-foreground">
                    Họ tên chủ gian hàng <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    value={newOwnerName}
                    onChangeText={setNewOwnerName}
                    placeholder="Ví dụ: Nguyễn Văn Bình"
                    placeholderTextColor="#888"
                    className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-[12.5px] font-medium text-muted-foreground">
                    Số điện thoại liên hệ <Text className="text-destructive">*</Text>
                  </Text>
                  <TextInput
                    value={newShopPhone}
                    onChangeText={setNewShopPhone}
                    placeholder="Ví dụ: 0988665544"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-[12.5px] font-medium text-muted-foreground">
                    Địa chỉ kho hàng / Cửa hàng
                  </Text>
                  <TextInput
                    value={newShopAddress}
                    onChangeText={setNewShopAddress}
                    placeholder="Ví dụ: 128 Cầu Giấy, Hà Nội"
                    placeholderTextColor="#888"
                    className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                  />
                </View>
              </ScrollView>

              <View className="flex-row gap-3 pt-3 border-t border-border">
                <Pressable
                  role="button"
                  onPress={() => setShowAddShopModal(false)}
                  className="flex-1 h-11 items-center justify-center rounded-control border border-border"
                >
                  <Text className="text-[14px] font-medium text-foreground">Huỷ</Text>
                </Pressable>
                <Pressable
                  role="button"
                  disabled={savingShop}
                  onPress={handleCreateNewShop}
                  className="flex-1 h-11 items-center justify-center rounded-control bg-primary active:opacity-90"
                >
                  {savingShop ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-[14px] font-semibold text-primary-foreground">
                      Tạo & Nộp Duyệt
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
