import {
  calculateOrderFinancials,
  formatVnd,
  PRODUCTS,
  type Order,
  type OrderStatus,
  type Product,
  type Shop,
  type ShopListing,
  type WithdrawalRequest,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowDownToLine,
  BadgeCheck,
  Building,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  DollarSign,
  Edit3,
  ImageIcon,
  MapPin,
  Package,
  Phone,
  Plus,
  RefreshCw,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  Truck,
  User,
  Wallet,
  X,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
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
import { useCurrentUser } from '@/lib/auth';
import {
  cancelOrder,
  confirmShopOrder,
  getShopWallet,
  loadListings,
  loadOrders,
  loadShops,
  loadWithdrawalRequests,
  onMarketplaceChange,
  registerShop,
  requestShopWithdrawal,
  saveListing,
  shipShopOrder,
  updateOrderStatus,
  updateShopStatus,
} from '@/lib/marketplace';

export type ShopPortalTab = 'orders' | 'inventory' | 'wallet' | 'profile';
export type ShopOrderFilter = 'all' | 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';

const VIETNAM_BANKS = ['MB Bank', 'Vietcombank', 'Techcombank', 'VPBank', 'ACB', 'BIDV', 'TPBank'];

export function ShopPortal() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const currentUser = useCurrentUser();
  const isStrictShop = currentUser?.role === 'shop';

  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShop, setActiveShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [listings, setListings] = useState<ShopListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Active portal tab
  const [activeTab, setActiveTab] = useState<ShopPortalTab>('orders');
  const [orderFilter, setOrderFilter] = useState<ShopOrderFilter>('all');

  // Wallet State
  const [walletInfo, setWalletInfo] = useState<{
    balanceVnd: number;
    balanceFormatted: string;
    pendingVnd: number;
    pendingFormatted: string;
    totalEarningsVnd: number;
    totalEarningsFormatted: string;
    completedOrdersCount: number;
  }>({
    balanceVnd: 1500000,
    balanceFormatted: '1.500.000₫',
    pendingVnd: 0,
    pendingFormatted: '0₫',
    totalEarningsVnd: 1500000,
    totalEarningsFormatted: '1.500.000₫',
    completedOrdersCount: 0,
  });
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Withdrawal Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmountStr, setWithdrawAmountStr] = useState('500000');
  const [selectedBank, setSelectedBank] = useState('MB Bank');
  const [withdrawAccountNo, setWithdrawAccountNo] = useState('0912345678');
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState('NGUYEN THU HA');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Registration modal / form state
  const [isRegistering, setIsRegistering] = useState(false);
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [registeringSubmitting, setRegisteringSubmitting] = useState(false);

  // Edit Listing Modal state (Price, Stock, Rich Description, Images)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPriceStr, setEditPriceStr] = useState('');
  const [editStockStr, setEditStockStr] = useState('');
  const [editRichDesc, setEditRichDesc] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [savingListing, setSavingListing] = useState(false);

  async function refreshData() {
    try {
      const allShops = await loadShops();
      setShops(allShops);

      let current: Shop | null = null;
      if (isStrictShop) {
        current =
          allShops.find(
            (s) =>
              s.id === currentUser?.shopId ||
              s.shopName.toLowerCase() === currentUser?.shopName?.toLowerCase() ||
              s.ownerName.toLowerCase() === currentUser?.fullName.toLowerCase(),
          ) || allShops[0];
      } else if (activeShop) {
        current = allShops.find((s) => s.id === activeShop.id) || allShops[0];
      } else {
        current = allShops.find((s) => s.id === 'shop-skinsense-official') || allShops[0];
      }

      setActiveShop(current || null);

      if (current) {
        const [shopOrders, allListings, wallet, shopWithdrawals] = await Promise.all([
          loadOrders({ shopId: current.id }),
          loadListings(),
          getShopWallet(current.id),
          loadWithdrawalRequests(current.id),
        ]);
        setOrders(shopOrders);
        setListings(allListings.filter((l) => l.shopId === current.id));
        setWalletInfo(wallet);
        setWithdrawals(shopWithdrawals);
      }
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
  }, [activeShop?.id]);

  async function handleSelectShop(shop: Shop) {
    void Haptics.selectionAsync().catch(() => {});
    setActiveShop(shop);
    const [shopOrders, allListings, wallet, shopWithdrawals] = await Promise.all([
      loadOrders({ shopId: shop.id }),
      loadListings(),
      getShopWallet(shop.id),
      loadWithdrawalRequests(shop.id),
    ]);
    setOrders(shopOrders);
    setListings(allListings.filter((l) => l.shopId === shop.id));
    setWalletInfo(wallet);
    setWithdrawals(shopWithdrawals);
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
        `Gian hàng "${newShop.shopName}" đang ở trạng thái Chờ Admin duyệt. Sau khi Admin phê duyệt, shop sẽ được mở bán chính thức.`,
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

  // Order lifecycle actions
  async function handleConfirmOrder(orderId: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await confirmShopOrder(orderId);
    await refreshData();
    Alert.alert('Thành công', 'Đơn hàng đã được chuyển sang trạng thái "Chuẩn bị hàng"');
  }

  async function handleShipOrder(orderId: string) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await shipShopOrder(orderId);
    await refreshData();
    Alert.alert('Đã bàn giao ĐVVC', 'Kiện hàng đã được bàn giao cho SPX Express và sinh mã vận đơn.');
  }

  async function handleCancelOrder(orderId: string) {
    Alert.alert('Hủy đơn hàng', 'Bạn có chắc chắn muốn hủy đơn hàng này không?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          await cancelOrder(orderId, 'Gian hàng hết hàng tạm thời');
          await refreshData();
        },
      },
    ]);
  }

  // Inventory actions
  function openEditListing(product: Product) {
    const existing = listings.find((l) => l.productId === product.id);
    setEditingProduct(product);
    setEditPriceStr(existing ? existing.priceVnd.toString() : product.priceVnd.toString());
    setEditStockStr(existing ? existing.stock.toString() : '50');
    setEditRichDesc(existing?.richDescription || product.description || '');
    setEditImages(existing?.images && existing.images.length > 0 ? [...existing.images] : [product.imageUrl]);
    setNewImageUrl('');
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
        richDescription: editRichDesc.trim(),
        images: editImages.filter((img) => Boolean(img && img.trim())),
      });

      const allListings = await loadListings();
      setListings(allListings.filter((l) => l.shopId === activeShop.id));
      setEditingProduct(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } finally {
      setSavingListing(false);
    }
  }

  // Wallet withdrawal action
  async function handleRequestWithdrawal() {
    if (!activeShop) return;
    const amount = parseInt(withdrawAmountStr.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount < 50000) {
      Alert.alert('Số tiền không hợp lệ', 'Số tiền rút tối thiểu là 50.000₫');
      return;
    }
    if (amount > walletInfo.balanceVnd) {
      Alert.alert('Số dư không đủ', 'Số tiền yêu cầu vượt quá số dư ví khả dụng hiện tại.');
      return;
    }
    if (!withdrawAccountNo.trim() || !withdrawAccountHolder.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ số tài khoản và tên chủ thẻ.');
      return;
    }

    setSubmittingWithdraw(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await requestShopWithdrawal({
        shopId: activeShop.id,
        shopName: activeShop.shopName,
        amountVnd: amount,
        bankName: selectedBank,
        accountNumber: withdrawAccountNo.trim(),
        accountHolder: withdrawAccountHolder.trim(),
      });

      setShowWithdrawModal(false);
      Alert.alert(
        'Đã gửi yêu cầu rút tiền!',
        `Lệnh rút ${formatVnd(amount)} về tài khoản ${selectedBank} đã được gửi tới Ban quản trị sàn SkinSense để đối soát phê duyệt.`,
      );
      await refreshData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo lệnh rút tiền.');
    } finally {
      setSubmittingWithdraw(false);
    }
  }

  // Filtered orders for shop
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    if (orderFilter === 'processing') {
      return orders.filter((o) => o.status === 'processing' || o.status === 'confirmed');
    }
    if (orderFilter === 'shipping') {
      return orders.filter((o) => o.status === 'shipping' || o.status === 'delivered');
    }
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const processingCount = orders.filter((o) => o.status === 'processing' || o.status === 'confirmed').length;
  const shippingCount = orders.filter((o) => o.status === 'shipping' || o.status === 'delivered').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

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
        <View className="items-center">
          <Text className="font-display text-[17px] font-semibold">Kênh Người Bán</Text>
          <Text className="text-[11.5px] text-muted-foreground">Shopee Seller Center</Text>
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

      {/* 4 Shopee Seller Center Tab Bar (Fixed beneath header) */}
      <View className="px-4 py-2 border-b border-border/40 bg-background">
        <View className="flex-row rounded-control border border-border/80 bg-surface-1 p-1">
          <Pressable
            role="button"
            accessibilityLabel="Đơn hàng"
            onPress={() => {
              setActiveTab('orders');
              void Haptics.selectionAsync().catch(() => {});
            }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-control active:scale-[0.98] ${
              activeTab === 'orders' ? 'bg-primary shadow-sm' : 'bg-transparent'
            }`}
          >
            <Icon
              as={Package}
              size={14}
              pointerEvents="none"
              className={activeTab === 'orders' ? 'text-primary-foreground' : 'text-muted-foreground'}
            />
            <Text
              pointerEvents="none"
              className={`text-[12px] ${
                activeTab === 'orders' ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Đơn ({orders.length})
            </Text>
          </Pressable>

          <Pressable
            role="button"
            accessibilityLabel="Kho hàng"
            onPress={() => {
              setActiveTab('inventory');
              void Haptics.selectionAsync().catch(() => {});
            }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-control active:scale-[0.98] ${
              activeTab === 'inventory' ? 'bg-primary shadow-sm' : 'bg-transparent'
            }`}
          >
            <Icon
              as={Tag}
              size={14}
              pointerEvents="none"
              className={activeTab === 'inventory' ? 'text-primary-foreground' : 'text-muted-foreground'}
            />
            <Text
              pointerEvents="none"
              className={`text-[12px] ${
                activeTab === 'inventory' ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Kho ({listings.length})
            </Text>
          </Pressable>

          <Pressable
            role="button"
            accessibilityLabel="Ví Người Bán"
            onPress={() => {
              setActiveTab('wallet');
              void Haptics.selectionAsync().catch(() => {});
            }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-control active:scale-[0.98] ${
              activeTab === 'wallet' ? 'bg-primary shadow-sm' : 'bg-transparent'
            }`}
          >
            <Icon
              as={Wallet}
              size={14}
              pointerEvents="none"
              className={activeTab === 'wallet' ? 'text-primary-foreground' : 'text-muted-foreground'}
            />
            <Text
              pointerEvents="none"
              className={`text-[12px] ${
                activeTab === 'wallet' ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Ví Shop
            </Text>
          </Pressable>

          <Pressable
            role="button"
            accessibilityLabel="Hồ sơ Shop"
            onPress={() => {
              setActiveTab('profile');
              void Haptics.selectionAsync().catch(() => {});
            }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-control active:scale-[0.98] ${
              activeTab === 'profile' ? 'bg-primary shadow-sm' : 'bg-transparent'
            }`}
          >
            <Icon
              as={Store}
              size={14}
              pointerEvents="none"
              className={activeTab === 'profile' ? 'text-primary-foreground' : 'text-muted-foreground'}
            />
            <Text
              pointerEvents="none"
              className={`text-[12px] ${
                activeTab === 'profile' ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Hồ sơ
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-28"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Active Shop Selector / Switcher */}
        <View className="gap-2 rounded-card border border-border/80 bg-surface-1 p-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {isStrictShop ? 'Gian hàng đang quản lý (Gian hàng riêng)' : `Gian hàng đang quản lý (${shops.length})`}
            </Text>
            {!isStrictShop && (
              <Pressable
                role="button"
                accessibilityLabel="Đăng ký Shop mới"
                onPress={() => setIsRegistering(true)}
                className="flex-row items-center gap-1 rounded-pill bg-primary/10 px-2.5 py-1 active:scale-[0.98]"
              >
                <Icon as={Plus} size={12} className="text-primary" />
                <Text className="text-[11.5px] font-semibold text-primary">Đăng ký Shop mới</Text>
              </Pressable>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pt-1">
            <View className="flex-row gap-2">
              {(isStrictShop && activeShop ? [activeShop] : shops).map((s) => {
                const isSelected = activeShop?.id === s.id;
                return (
                  <Pressable
                    key={s.id}
                    role="button"
                    accessibilityLabel={s.shopName}
                    onPress={() => {
                      if (!isStrictShop) handleSelectShop(s);
                    }}
                    className={`flex-row items-center gap-2 rounded-pill px-3 py-1.5 border active:scale-[0.98] ${
                      isSelected
                        ? 'border-primary bg-primary/15'
                        : 'border-border/80 bg-surface-2'
                    }`}
                  >
                    <Icon
                      as={Store}
                      size={13}
                      className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <Text
                      className={`text-[12.5px] font-medium ${
                        isSelected ? 'text-primary font-semibold' : 'text-foreground'
                      }`}
                    >
                      {s.shopName}
                    </Text>
                    {s.isOfficial && (
                      <View className="rounded bg-rose-500/10 px-1 border border-rose-500/30">
                        <Text className="text-[9px] font-bold text-rose-600 dark:text-rose-400">MALL</Text>
                      </View>
                    )}
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

        {/* KPI Metric Overview Cards */}
        <View className="flex-row gap-2.5">
          <View className="flex-1 rounded-card border border-border/80 bg-card p-3 shadow-xs">
            <Text className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Doanh thu shop
            </Text>
            <Text className="font-display text-[18px] font-bold text-primary mt-1">
              {walletInfo.totalEarningsFormatted}
            </Text>
          </View>
          <View className="flex-1 rounded-card border border-border/80 bg-card p-3 shadow-xs">
            <Text className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Đơn cần gói
            </Text>
            <Text className="font-display text-[18px] font-bold text-primary mt-1">
              {pendingCount + processingCount}
            </Text>
          </View>
          <View className="flex-1 rounded-card border border-border/80 bg-card p-3 shadow-xs">
            <Text className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Sản phẩm
            </Text>
            <Text className="font-display text-[18px] font-bold text-primary mt-1">
              {listings.length}
            </Text>
          </View>
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
            <Text className="text-[12px] text-amber-800/80 dark:text-amber-300/80 leading-4">
              Sau khi được Admin duyệt mở bán, các sản phẩm của bạn sẽ tự động xuất hiện trên danh sách lựa chọn shop của khách hàng.
            </Text>
            <Pressable
              role="button"
              accessibilityLabel="Duyệt nhanh ngay (Test Mode)"
              onPress={() => handleQuickApprove(activeShop.id)}
              className="mt-1 self-start rounded-control bg-amber-600 px-3 py-1.5 active:opacity-90"
            >
              <Text className="text-[12px] font-medium text-white">Duyệt nhanh ngay (Test Mode)</Text>
            </Pressable>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: ORDERS (Shopee Seller Fulfillment Lifecycle)           */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'orders' && (
          <View className="gap-3">
            {/* Sub-Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1.5 pb-1">
                {[
                  { id: 'all', label: `Tất cả (${orders.length})` },
                  { id: 'pending', label: `Chờ xác nhận (${pendingCount})` },
                  { id: 'processing', label: `Chuẩn bị hàng (${processingCount})` },
                  { id: 'shipping', label: `Đang giao (${shippingCount})` },
                  { id: 'completed', label: `Hoàn tất (${completedCount})` },
                  { id: 'cancelled', label: 'Đã hủy' },
                ].map((f) => {
                  const active = orderFilter === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      role="button"
                      accessibilityLabel={f.label}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setOrderFilter(f.id as ShopOrderFilter);
                      }}
                      className={`rounded-pill px-3 py-1.5 border active:scale-[0.98] ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/80 bg-card'
                      }`}
                    >
                      <Text
                        className={`text-[11.5px] font-medium ${
                          active ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {filteredOrders.length === 0 ? (
              <View className="items-center justify-center rounded-card border border-border/80 bg-card p-8">
                <Icon as={ShoppingBag} size={32} className="text-muted-foreground/60" />
                <Text className="mt-2 text-[14px] font-medium">Không có đơn hàng nào</Text>
                <Text className="text-[12px] text-muted-foreground text-center mt-1">
                  Mọi đơn đặt từ người mua chọn shop bạn sẽ xuất hiện tại đây để đóng gói & gửi SPX.
                </Text>
              </View>
            ) : (
              filteredOrders.map((order) => {
                const isPending = order.status === 'pending';
                const isProcessing = order.status === 'processing' || order.status === 'confirmed';
                const isShipping = order.status === 'shipping' || order.status === 'delivered';
                const isCompleted = order.status === 'completed';

                return (
                  <View
                    key={order.id}
                    className="gap-3 rounded-card border border-border/80 bg-card p-4 shadow-xs"
                  >
                    {/* Header */}
                    <View className="flex-row items-center justify-between border-b border-border/40 pb-2">
                      <View>
                        <Text className="text-[13px] font-bold font-mono">{order.id}</Text>
                        <Text className="text-[11px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')} {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <View className="rounded-pill bg-primary/10 px-2.5 py-0.5 border border-primary/20">
                        <Text className="text-[11px] font-semibold text-primary uppercase">
                          {order.status}
                        </Text>
                      </View>
                    </View>

                    {/* Product & Qty */}
                    <View className="flex-row gap-2.5">
                      <Image
                        source={{ uri: order.productImage }}
                        className="size-14 rounded-control bg-surface-2 border border-border/80"
                        contentFit="cover"
                      />
                      <View className="flex-1 justify-between">
                        <Text numberOfLines={2} className="text-[13px] font-medium leading-[17px]">
                          {order.productName}
                        </Text>
                        <View className="flex-row items-baseline justify-between">
                          <Text className="text-[11.5px] text-muted-foreground">
                            Số lượng: x{order.quantity}
                          </Text>
                          <Text className="font-display text-[15px] font-bold text-primary">
                            {order.totalFormatted}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Customer Info */}
                    <View className="rounded-control bg-surface-1 p-2.5 gap-1 border border-border/50">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[12px] font-semibold text-foreground">
                          Khách: {order.customerName} ({order.customerPhone})
                        </Text>
                        <Text className="text-[11px] font-semibold text-primary">
                          {order.paymentMethod === 'vietqr' ? 'Đã CK VietQR' : 'Thu COD'}
                        </Text>
                      </View>
                      <Text className="text-[11.5px] text-muted-foreground">
                        Đ/c: {order.customerAddress}
                      </Text>
                      {order.note && (
                        <Text className="text-[11px] italic text-muted-foreground">
                          Ghi chú: {order.note}
                        </Text>
                      )}
                      {order.trackingCode && (
                        <View className="flex-row items-center gap-1 pt-1 border-t border-border/20">
                          <Icon as={Truck} size={12} className="text-indigo-400" />
                          <Text className="text-[11px] font-mono text-indigo-400">
                            Mã SPX: {order.trackingCode}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Shop Financial Share (Sau 5% phí sàn) */}
                    <View className="flex-row items-center justify-between px-1">
                      <Text className="text-[11px] text-muted-foreground">
                        Thực nhận (sau 5% phí sàn):
                      </Text>
                      <Text className="font-display text-[14px] font-bold text-[#AFCFA9]">
                        +{formatVnd(order.shopEarningsVnd || Math.round(order.totalVnd * 0.95))}
                      </Text>
                    </View>

                    {/* Action buttons */}
                    <View className="flex-row items-center justify-end gap-2 border-t border-border/40 pt-2.5">
                      {isPending && (
                        <>
                          <Pressable
                            role="button"
                            accessibilityLabel="Từ chối đơn"
                            onPress={() => handleCancelOrder(order.id)}
                            className="rounded-control border border-border/80 px-3 py-1.5 active:scale-[0.98] active:bg-surface-2"
                          >
                            <Text className="text-[12px] text-rose-400 font-medium">Hủy đơn</Text>
                          </Pressable>
                          <Pressable
                            role="button"
                            accessibilityLabel="Xác nhận & Chuẩn bị hàng"
                            onPress={() => handleConfirmOrder(order.id)}
                            className="rounded-control bg-primary px-3.5 py-1.5 active:scale-[0.98]"
                          >
                            <Text className="text-[12px] text-primary-foreground font-semibold">
                              Xác nhận & Chuẩn bị hàng
                            </Text>
                          </Pressable>
                        </>
                      )}

                      {isProcessing && (
                        <Pressable
                          role="button"
                          accessibilityLabel="Bàn giao cho ĐVVC SPX"
                          onPress={() => handleShipOrder(order.id)}
                          className="flex-row items-center gap-1.5 rounded-control bg-indigo-600 px-3.5 py-1.5 active:scale-[0.98]"
                        >
                          <Icon as={Truck} size={13} className="text-white" />
                          <Text className="text-[12px] text-white font-semibold">
                            Bàn giao ĐVVC (SPX)
                          </Text>
                        </Pressable>
                      )}

                      {isShipping && (
                        <View className="flex-row items-center gap-1.5 px-2 py-1">
                          <Icon as={Truck} size={13} className="text-indigo-400" />
                          <Text className="text-[11.5px] text-muted-foreground">
                            Đang trên đường giao đến người mua...
                          </Text>
                        </View>
                      )}

                      {isCompleted && (
                        <View className="flex-row items-center gap-1">
                          <Icon as={CheckCircle2} size={14} className="text-[#AFCFA9]" />
                          <Text className="text-[12px] font-medium text-[#AFCFA9]">
                            Đã giao & Tiền đã về ví shop
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: INVENTORY & CATALOG PRICING                            */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'inventory' && (
          <View className="gap-3">
            <Text className="text-[12.5px] text-muted-foreground">
              Thiết lập giá bán cạnh tranh và số lượng tồn kho cho gian hàng của bạn từ danh mục SkinSense chính hãng.
            </Text>

            {PRODUCTS.map((prod) => {
              const listing = listings.find((l) => l.productId === prod.id);
              const isListed = !!listing && listing.stock > 0;

              return (
                <View
                  key={prod.id}
                  className="rounded-card border border-border/80 bg-card p-3.5 gap-3 shadow-xs"
                >
                  <View className="flex-row gap-3">
                    <Image
                      source={{ uri: prod.imageUrl }}
                      className="size-16 rounded-control bg-surface-2 border border-border/80"
                      contentFit="cover"
                    />
                    <View className="flex-1 justify-center gap-1">
                      <Text numberOfLines={1} className="text-[11px] font-bold text-primary uppercase tracking-wider">
                        {prod.brand}
                      </Text>
                      <Text numberOfLines={1} className="text-[13.5px] font-semibold text-foreground">
                        {prod.name}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-baseline gap-1.5">
                          <Text className="font-display text-[15px] font-bold text-primary">
                            {listing ? listing.priceFormatted : prod.priceFormatted}
                          </Text>
                          {listing && listing.priceVnd !== prod.priceVnd && (
                            <Text className="text-[11px] text-muted-foreground line-through">
                              {prod.priceFormatted}
                            </Text>
                          )}
                        </View>
                        <View
                          className={`rounded-pill px-2.5 py-0.5 border ${
                            isListed ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-border/80 bg-surface-2'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              isListed ? 'text-[#AFCFA9]' : 'text-muted-foreground'
                            }`}
                          >
                            {isListed ? `Sẵn hàng: ${listing.stock}` : 'Chưa niêm yết'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between border-t border-border/40 pt-2.5">
                    <Text className="text-[11.5px] text-muted-foreground">
                      Giao hàng: {listing?.deliveryTime || 'Giao trong 1-2 ngày'}
                    </Text>
                    <Pressable
                      role="button"
                      accessibilityLabel={`Sửa giá & kho ${prod.name}`}
                      onPress={() => openEditListing(prod)}
                      className="flex-row items-center gap-1 rounded-control bg-primary/10 border border-primary/20 px-3 py-1.5 active:scale-[0.98] active:bg-primary/20"
                    >
                      <Icon as={Edit3} size={13} className="text-primary" />
                      <Text className="text-[12px] font-semibold text-primary">
                        {listing ? 'Sửa Giá & Kho' : '+ Đăng Bán SP'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: VÍ NGƯỜI BÁN & DOANH THU (SHOPEE BALANCE)              */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'wallet' && (
          <View className="gap-3.5">
            {/* Shopee Seller Wallet Main Card */}
            <View className="rounded-card border border-border/80 bg-card p-4 gap-3 shadow-xs">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="size-9 rounded-pill bg-emerald-500/10 items-center justify-center border border-emerald-500/20">
                    <Icon as={Wallet} size={18} className="text-[#AFCFA9]" />
                  </View>
                  <View>
                    <Text className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-[0.06em]">
                      Số Dư Ví Người Bán (Shopee Balance)
                    </Text>
                    <Text className="font-display text-[26px] font-bold text-primary">
                      {walletInfo.balanceFormatted}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center justify-between rounded-control bg-surface-1 p-2.5 border border-border/50">
                <View>
                  <Text className="text-[11px] text-muted-foreground">Đang chờ giải ngân:</Text>
                  <Text className="font-display text-[13px] font-semibold text-amber-400">
                    +{walletInfo.pendingFormatted}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[11px] text-muted-foreground">Phí sàn SkinSense:</Text>
                  <Text className="text-[13px] font-semibold text-foreground">
                    5% / đơn thành công
                  </Text>
                </View>
              </View>

              {/* Withdraw Button */}
              <Pressable
                role="button"
                accessibilityLabel="Rút tiền về tài khoản ngân hàng"
                onPress={() => setShowWithdrawModal(true)}
                className="h-11 flex-row items-center justify-center gap-2 rounded-control bg-primary active:scale-[0.98]"
              >
                <Icon as={ArrowDownToLine} size={16} className="text-primary-foreground" />
                <Text className="text-[14px] font-semibold text-primary-foreground">
                  Rút Tiền Về Tài Khoản Ngân Hàng
                </Text>
              </Pressable>
            </View>

            {/* Withdrawal Requests History */}
            <View className="rounded-card border border-border bg-card p-4 gap-3">
              <Text className="text-[14px] font-semibold text-foreground">
                Lịch sử yêu cầu rút tiền ({withdrawals.length})
              </Text>

              {withdrawals.length === 0 ? (
                <Text className="text-[12px] text-muted-foreground py-2 text-center">
                  Chưa có yêu cầu rút tiền nào được tạo.
                </Text>
              ) : (
                withdrawals.map((w) => (
                  <View
                    key={w.id}
                    className="flex-row items-center justify-between border-b border-border/40 py-2.5 last:border-b-0"
                  >
                    <View className="gap-0.5">
                      <Text className="text-[13px] font-bold font-mono">{w.id}</Text>
                      <Text className="text-[11.5px] text-muted-foreground">
                        {w.bankName} • {w.accountNumber} ({w.accountHolder})
                      </Text>
                      <Text className="text-[10.5px] text-muted-foreground">
                        {new Date(w.createdAt).toLocaleDateString('vi-VN')} {new Date(w.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-[14px] font-bold text-foreground">
                        -{w.amountFormatted}
                      </Text>
                      <View
                        className={`rounded-pill px-2 py-0.5 ${
                          w.status === 'approved'
                            ? 'bg-emerald-500/10'
                            : w.status === 'rejected'
                              ? 'bg-rose-500/10'
                              : 'bg-amber-500/10'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            w.status === 'approved'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : w.status === 'rejected'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {w.status === 'approved'
                            ? 'Đã duyệt'
                            : w.status === 'rejected'
                              ? 'Từ chối'
                              : 'Chờ Admin duyệt'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: HỒ SƠ SHOP & CÀI ĐẶT KHO                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'profile' && activeShop && (
          <View className="gap-3.5">
            <View className="rounded-card border border-border bg-card p-4 gap-3">
              <View className="flex-row items-center gap-3">
                <View className="size-14 rounded-pill bg-primary/10 items-center justify-center">
                  <Icon as={Store} size={28} className="text-primary" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[16px] font-bold text-foreground">
                      {activeShop.shopName}
                    </Text>
                    {activeShop.isOfficial && (
                      <View className="rounded bg-rose-500/10 px-1 border border-rose-500/30">
                        <Text className="text-[9px] font-bold text-rose-600 dark:text-rose-400">MALL</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-[12px] text-muted-foreground">
                    Chủ sở hữu: {activeShop.ownerName}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground">
                    Mã gian hàng: <Text className="font-mono">{activeShop.id}</Text>
                  </Text>
                </View>
              </View>

              <View className="gap-2 pt-2 border-t border-border/40">
                <View className="flex-row items-center gap-2">
                  <Icon as={Phone} size={14} className="text-primary" />
                  <Text className="text-[12.5px] font-medium text-foreground">
                    Hotline: {activeShop.phone}
                  </Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Icon as={MapPin} size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <Text className="text-[12.5px] text-muted-foreground flex-1">
                    Kho lấy hàng SPX: {activeShop.address}
                  </Text>
                </View>
              </View>
            </View>

            <View className="rounded-card border border-border bg-card p-4 gap-2">
              <Text className="text-[14px] font-semibold text-foreground">
                Tiêu chuẩn vận hành Shopee Mall
              </Text>
              <Text className="text-[12px] text-muted-foreground leading-4">
                • 100% sản phẩm có hóa đơn chứng từ chính hãng.{'\n'}
                • Thời gian đóng gói chuẩn bị hàng dưới 24h.{'\n'}
                • Bàn giao đúng hẹn cho đơn vị vận chuyển SPX Express.{'\n'}
                • Tỷ lệ phản hồi tin nhắn khách hàng trên 90%.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ------------------------------------------------------------- */}
      {/* Modal: Rút Tiền Về Ngân Hàng                                   */}
      {/* ------------------------------------------------------------- */}
      {showWithdrawModal && (
        <Modal visible={true} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/75">
            <View
              className="rounded-t-3xl border-t border-border/80 bg-card p-5 gap-4"
              style={{ paddingBottom: Math.max(bottom, 20) }}
            >
              <View className="flex-row items-center justify-between pb-2 border-b border-border/60">
                <Text className="font-display text-[17px] font-bold text-foreground">
                  Rút Tiền Về Ngân Hàng
                </Text>
                <Pressable
                  role="button"
                  accessibilityLabel="Đóng"
                  onPress={() => setShowWithdrawModal(false)}
                  className="size-8 items-center justify-center rounded-full bg-surface-2 active:scale-[0.98]"
                >
                  <Icon as={X} size={18} className="text-foreground" />
                </Pressable>
              </View>

              <View className="rounded-control bg-surface-2 p-3 border border-border/80">
                <Text className="text-[11px] text-muted-foreground uppercase tracking-[0.06em]">Số dư khả dụng:</Text>
                <Text className="font-display text-[22px] font-bold text-primary mt-0.5">
                  {walletInfo.balanceFormatted}
                </Text>
              </View>

              <View className="gap-1.5">
                <Text className="text-[11.5px] font-semibold text-primary uppercase tracking-[0.08em]">
                  Số tiền muốn rút (VNĐ) *
                </Text>
                <TextInput
                  value={withdrawAmountStr}
                  onChangeText={setWithdrawAmountStr}
                  keyboardType="numeric"
                  placeholder="500000"
                  placeholderTextColor="#777"
                  className="h-11 rounded-control border border-border/80 bg-surface-2 px-3 text-[14px] text-foreground font-semibold"
                />
              </View>

              {/* Bank selector */}
              <View className="gap-1.5">
                <Text className="text-[11.5px] font-semibold text-primary uppercase tracking-[0.08em]">
                  Chọn ngân hàng thụ hưởng *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {VIETNAM_BANKS.map((b) => (
                      <Pressable
                        key={b}
                        role="button"
                        onPress={() => setSelectedBank(b)}
                        className={`rounded-pill px-3 py-1.5 border active:scale-[0.98] ${
                          selectedBank === b
                            ? 'border-primary bg-primary'
                            : 'border-border/80 bg-surface-2'
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-medium ${
                            selectedBank === b ? 'text-primary-foreground font-bold' : 'text-foreground'
                          }`}
                        >
                          {b}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="gap-1.5">
                <Text className="text-[11.5px] font-semibold text-primary uppercase tracking-[0.08em]">
                  Số tài khoản ngân hàng *
                </Text>
                <TextInput
                  value={withdrawAccountNo}
                  onChangeText={setWithdrawAccountNo}
                  keyboardType="numeric"
                  placeholder="0912345678"
                  placeholderTextColor="#777"
                  className="h-11 rounded-control border border-border/80 bg-surface-2 px-3 text-[14px] text-foreground font-mono"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-[11.5px] font-semibold text-primary uppercase tracking-[0.08em]">
                  Tên chủ tài khoản (In hoa không dấu) *
                </Text>
                <TextInput
                  value={withdrawAccountHolder}
                  onChangeText={setWithdrawAccountHolder}
                  autoCapitalize="characters"
                  placeholder="NGUYEN THU HA"
                  placeholderTextColor="#777"
                  className="h-11 rounded-control border border-border/80 bg-surface-2 px-3 text-[14px] text-foreground font-semibold"
                />
              </View>

              <Pressable
                role="button"
                accessibilityLabel="Xác nhận gửi yêu cầu rút tiền"
                disabled={submittingWithdraw}
                onPress={handleRequestWithdrawal}
                className="mt-2 h-11 items-center justify-center rounded-control bg-primary active:scale-[0.98]"
              >
                {submittingWithdraw ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text className="text-[14px] font-semibold text-primary-foreground">
                    Xác Nhận Rút Tiền
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Edit Price & Stock & Rich Description & Images Listing   */}
      {/* ------------------------------------------------------------- */}
      {editingProduct && (
        <Modal visible={true} transparent animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/75 p-4">
            <View className="w-full max-w-sm max-h-[85%] rounded-sheet border border-border/80 bg-card p-5 gap-3.5 shadow-lg">
              <View className="flex-row items-center justify-between pb-2 border-b border-border/60">
                <Text className="font-display text-[16px] font-bold text-foreground">
                  Thiết Lập Giá & Kho Bán
                </Text>
                <Pressable
                  role="button"
                  onPress={() => setEditingProduct(null)}
                  className="size-7 items-center justify-center rounded-pill active:scale-[0.98] active:bg-surface-2"
                >
                  <Icon as={X} size={16} className="text-muted-foreground" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 pb-2">
                <Text numberOfLines={1} className="text-[13.5px] font-bold text-foreground">
                  {editingProduct.name}
                </Text>

                <View className="flex-row gap-2.5">
                  <View className="flex-1 gap-1">
                    <Text className="text-[11.5px] font-semibold text-primary uppercase tracking-[0.08em]">
                      Giá bán của shop (VNĐ)
                    </Text>
                    <TextInput
                      value={editPriceStr}
                      onChangeText={setEditPriceStr}
                      keyboardType="numeric"
                      className="h-10 rounded-control border border-border/80 bg-surface-2 px-3 text-[13.5px] font-semibold text-foreground"
                    />
                  </View>

                  <View className="flex-1 gap-1">
                    <Text className="text-[11.5px] font-semibold text-primary uppercase tracking-[0.08em]">
                      Số lượng tồn kho (Hộp)
                    </Text>
                    <TextInput
                      value={editStockStr}
                      onChangeText={setEditStockStr}
                      keyboardType="numeric"
                      className="h-10 rounded-control border border-border/80 bg-surface-2 px-3 text-[13.5px] font-semibold text-foreground"
                    />
                  </View>
                </View>

                {/* Rich Description */}
                <View className="gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11.5px] font-semibold text-primary uppercase tracking-[0.08em]">
                      Bài viết / Mô tả sản phẩm của Shop
                    </Text>
                    <Text className="text-[10px] text-muted-foreground">Chi tiết & Hướng dẫn</Text>
                  </View>
                  <TextInput
                    value={editRichDesc}
                    onChangeText={setEditRichDesc}
                    multiline
                    numberOfLines={4}
                    placeholder="Nhập bài viết mô tả chi tiết, cam kết hàng chính hãng, hướng dẫn sử dụng của riêng shop..."
                    placeholderTextColor="#777"
                    className="min-h-[85px] rounded-control border border-border/80 bg-surface-2 p-3 text-[12.5px] text-foreground"
                  />
                </View>

                {/* Images Manager */}
                <View className="gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11.5px] font-semibold text-primary uppercase tracking-[0.08em]">
                      Hình ảnh sản phẩm của Shop ({editImages.length})
                    </Text>
                    <Text className="text-[10px] text-muted-foreground">Ảnh thực tế / Toa tem</Text>
                  </View>

                  {/* Image thumbnails */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                    <View className="flex-row gap-2">
                      {editImages.map((imgUri, idx) => (
                        <View key={`${imgUri}-${idx}`} className="relative size-16 rounded-control overflow-hidden border border-border/80 bg-surface-2">
                          <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                          <Pressable
                            role="button"
                            accessibilityLabel={`Xóa ảnh ${idx + 1}`}
                            onPress={() => {
                              setEditImages(editImages.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 size-5 items-center justify-center rounded-full bg-black/70 active:scale-[0.98]"
                          >
                            <Icon as={X} size={11} className="text-white" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Add Image input & sample presets */}
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <TextInput
                      value={newImageUrl}
                      onChangeText={setNewImageUrl}
                      placeholder="Dán link ảnh URL..."
                      placeholderTextColor="#777"
                      className="flex-1 h-9 rounded-control border border-border/80 bg-surface-2 px-2.5 text-[11.5px] text-foreground"
                    />
                    <Pressable
                      role="button"
                      accessibilityLabel="Thêm ảnh"
                      onPress={() => {
                        if (newImageUrl.trim()) {
                          setEditImages([...editImages, newImageUrl.trim()]);
                          setNewImageUrl('');
                        }
                      }}
                      className="h-9 px-3 items-center justify-center rounded-control bg-primary/10 border border-primary/30 active:scale-[0.98]"
                    >
                      <Text className="text-[11.5px] font-semibold text-primary">+ Thêm</Text>
                    </Pressable>
                  </View>

                  <View className="flex-row gap-1.5 pt-1">
                    <Pressable
                      onPress={() => {
                        setEditImages([
                          ...editImages,
                          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
                        ]);
                      }}
                      className="rounded-pill bg-surface-2 px-2.5 py-1 border border-border/80 active:scale-[0.98]"
                    >
                      <Text className="text-[10px] text-muted-foreground">+ Ảnh mẫu Serum</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setEditImages([
                          ...editImages,
                          'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
                        ]);
                      }}
                      className="rounded-pill bg-surface-2 px-2.5 py-1 border border-border/80 active:scale-[0.98]"
                    >
                      <Text className="text-[10px] text-muted-foreground">+ Ảnh mẫu Tem Phụ</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row gap-2 pt-2 border-t border-border/60">
                <Pressable
                  role="button"
                  onPress={() => setEditingProduct(null)}
                  className="flex-1 h-10 items-center justify-center rounded-control border border-border/80 active:scale-[0.98]"
                >
                  <Text className="text-[13px] font-medium text-foreground">Huỷ</Text>
                </Pressable>
                <Pressable
                  role="button"
                  accessibilityLabel="Lưu niêm yết"
                  disabled={savingListing}
                  onPress={handleSaveListing}
                  className="flex-1 h-10 items-center justify-center rounded-control bg-primary active:scale-[0.98]"
                >
                  {savingListing ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className="text-[13px] font-semibold text-primary-foreground">
                      Lưu Niêm Yết
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Đăng ký Gian Hàng Mới                                  */}
      {/* ------------------------------------------------------------- */}
      {isRegistering && (
        <Modal visible={true} transparent animationType="fade">
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
                    <Text className="text-[12px] font-medium text-muted-foreground">Tên gian hàng *</Text>
                    <TextInput
                      value={regShopName}
                      onChangeText={setRegShopName}
                      placeholder="VD: Dược Mỹ Phẩm Hà Nội"
                      placeholderTextColor="#888"
                      className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                    />
                  </View>

                  <View className="gap-1">
                    <Text className="text-[12px] font-medium text-muted-foreground">Họ tên chủ shop *</Text>
                    <TextInput
                      value={regOwnerName}
                      onChangeText={setRegOwnerName}
                      placeholder="VD: Nguyễn Văn A"
                      placeholderTextColor="#888"
                      className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
                    />
                  </View>

                  <View className="gap-1">
                    <Text className="text-[12px] font-medium text-muted-foreground">Số điện thoại *</Text>
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
                    <Text className="text-[12px] font-medium text-muted-foreground">Địa chỉ kho gửi hàng *</Text>
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
                  accessibilityLabel="Đăng ký"
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
