import {
  canShopSignIn,
  filterProductsByShop,
  formatVnd,
  getProductApprovalBadge,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { useRouter, type Href } from 'expo-router';
import {
  AlertCircle,
  CheckCircle2,
  Home,
  LogOut,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Send,
  ShoppingBag,
  Store,
  User,
  Wallet,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { ProductImage } from '@/components/artwork';
import { Icon } from '@/components/ui/icon';
import {
  BottomSheetFrame,
  HeaderIconButton,
  MODERN_CARD,
  MODERN_INPUT,
  MODERN_SUBCARD,
  PortalHeader,
  ToastBanner,
} from '@/components/ui/portal-chrome';
import { Text } from '@/components/ui/text';
import {
  createProductRemote,
  loadAdminProductsRemote,
  loadShopChatThreadsRemote,
  loadUserOrdersRemote,
  mutateUserOrderRemote,
  sendChatMessageRemote,
  uploadImageRemote,
  type ChatThreadRemote,
  type MarketplaceApiProduct,
  type RemoteUserOrderItem,
} from '@/lib/api';
import { setStaffTodayViewMode, signOut, useCurrentUser } from '@/lib/auth';

type ShopTab = 'orders' | 'products' | 'messages' | 'wallet' | 'profile';
type OrderFilter = 'all' | 'pending' | 'processing' | 'delivering' | 'delivered' | 'cancelled';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang chuẩn bị',
  shipping: 'Đang giao',
  delivering: 'Đang vận chuyển',
  delivered: 'Hoàn tất',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

export function ShopPortal() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const currentUser = useCurrentUser();

  const [activeTab, setActiveTab] = useState<ShopTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [orders, setOrders] = useState<RemoteUserOrderItem[]>([]);
  const [products, setProducts] = useState<MarketplaceApiProduct[]>([]);
  const [threads, setThreads] = useState<ChatThreadRemote[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Add Product Modal (Web-parity POST /api/admin/products -> status: 'pending')
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Chăm sóc da mặt > Serum & Tinh chất');
  const [formBrand, setFormBrand] = useState('');
  const [formOrigin, setFormOrigin] = useState('Pháp');
  const [formPrice, setFormPrice] = useState('350000');
  const [formStock, setFormStock] = useState('100');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUri, setFormImageUri] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.isSuperAdmin === true;
  const shopName =
    currentUser?.shopDetails?.shopName?.trim() ||
    currentUser?.shopName?.trim() ||
    currentUser?.fullName?.trim() ||
    '';

  const shopAccess = canShopSignIn(
    currentUser
      ? {
          role: currentUser.role,
          status: currentUser.status ?? 'pending',
          email: currentUser.email,
          fullName: currentUser.fullName,
        }
      : null,
  );

  const refreshData = useCallback(async () => {
    setLoading(true);
    const [ordRes, prodRes, chatRes] = await Promise.all([
      loadUserOrdersRemote('shop'),
      loadAdminProductsRemote(),
      loadShopChatThreadsRemote(shopName || undefined).catch(() => null),
    ]);

    if (ordRes.ok && ordRes.data?.ok && Array.isArray(ordRes.data.orders)) {
      setOrders(ordRes.data.orders);
    } else {
      setOrders([]);
    }

    if (prodRes.ok && prodRes.data?.ok && Array.isArray(prodRes.data.products)) {
      const own = filterProductsByShop(prodRes.data.products, shopName, isAdmin);
      setProducts(own);
    } else {
      setProducts([]);
    }

    if (chatRes?.ok && chatRes.data?.ok && Array.isArray(chatRes.data.threads)) {
      setThreads(chatRes.data.threads);
      if (chatRes.data.threads.length > 0) {
        setSelectedThreadId((prev) => prev || chatRes.data?.threads?.[0]?.id || null);
      }
    }

    setLoading(false);
  }, [isAdmin, shopName]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    if (orderFilter === 'delivering') {
      return orders.filter((o) => o.status === 'delivering' || o.status === 'shipping');
    }
    if (orderFilter === 'delivered') {
      return orders.filter((o) => o.status === 'delivered' || o.status === 'completed');
    }
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const walletSummary = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'delivered' || o.status === 'completed');
    const gross = completed.reduce((sum, o) => sum + o.totalAmount, 0);
    const net = Math.round(gross * 0.92);
    const inTransit = orders
      .filter((o) => o.status === 'pending' || o.status === 'processing' || o.status === 'delivering' || o.status === 'shipping')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      gross,
      net,
      inTransit,
      completedCount: completed.length,
    };
  }, [orders]);

  async function handleOrderAction(
    orderCode: string,
    action: 'confirm' | 'ship' | 'deliver' | 'cancel',
  ) {
    if (busyKey) return;
    setBusyKey(orderCode);
    const res = await mutateUserOrderRemote({ orderCode, action });
    setBusyKey(null);
    if (!res.ok) {
      setToastMsg(res.error || 'Không thể cập nhật đơn hàng.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setToastMsg(res.data?.message || `Đã cập nhật đơn ${orderCode}.`);
    await refreshData();
  }

  async function handlePickImage() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const picker = require('expo-image-picker') as typeof import('expo-image-picker');
      const perm = await picker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setToastMsg('Cần cấp quyền thư viện ảnh để chọn ảnh sản phẩm.');
        return;
      }
      const result = await picker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets[0]?.uri) setFormImageUri(result.assets[0].uri);
    } catch {
      setToastMsg('Máy chưa có module chọn ảnh, cần build lại app.');
    }
  }

  async function handleCreateProduct() {
    if (!shopAccess.allowed) {
      setToastMsg(shopAccess.reason || 'Gian hàng chưa được duyệt.');
      return;
    }
    if (!formName.trim()) {
      setToastMsg('Vui lòng nhập tên sản phẩm.');
      return;
    }
    const price = parseInt(formPrice.replace(/\D/g, ''), 10) || 0;
    const stock = parseInt(formStock.replace(/\D/g, ''), 10) || 0;
    if (price <= 0) {
      setToastMsg('Giá sản phẩm phải lớn hơn 0.');
      return;
    }

    setSavingProduct(true);
    let finalImageUrl = formImageUri.trim();
    if (finalImageUrl.startsWith('file://')) {
      const up = await uploadImageRemote({
        uri: finalImageUrl,
        folder: 'products',
        shopName,
      });
      if (!up.ok || !up.url) {
        setSavingProduct(false);
        setToastMsg(up.error || 'Tải ảnh sản phẩm lên máy chủ thất bại.');
        return;
      }
      finalImageUrl = up.url;
    }

    const res = await createProductRemote({
      name: formName.trim(),
      shopName,
      price,
      category: formCategory.trim() || 'Chăm sóc da chuyên sâu',
      stock,
      brand: formBrand.trim() || shopName || 'Chính Hãng',
      sku: formSku.trim() || undefined,
      coverImage: finalImageUrl || undefined,
      images: finalImageUrl ? [finalImageUrl] : [],
      description: formDescription.trim() || 'Sản phẩm dược mỹ phẩm chính hãng.',
      origin: formOrigin.trim() || 'Pháp',
    });
    setSavingProduct(false);

    if (!res.ok || !res.data?.ok) {
      setToastMsg(res.error || 'Không lưu được sản phẩm.');
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setShowAddProductModal(false);
    setFormName('');
    setFormSku('');
    setFormDescription('');
    setFormImageUri('');
    setToastMsg('Đã gửi sản phẩm mới! Đang chờ Super Admin phê duyệt lên sàn.');
    await refreshData();
  }

  async function handleSendShopReply() {
    const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0];
    if (!activeThread || !replyText.trim() || sendingReply) return;
    setSendingReply(true);
    const text = replyText.trim();
    setReplyText('');
    const res = await sendChatMessageRemote({
      shopId: activeThread.shopId,
      shopName: shopName || activeThread.shopName,
      userId: activeThread.userId,
      userName: activeThread.userName,
      orderCode: activeThread.orderCode,
      sender: 'shop',
      text,
    }).catch(() => null);
    setSendingReply(false);
    if (!res?.ok || !res.data?.ok || !res.data.thread) {
      setReplyText(text);
      setToastMsg(res?.data?.error || 'Không thể gửi tin nhắn phản hồi.');
      return;
    }
    const updated = res.data.thread;
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/sign-in' as Href);
  }

  return (
    <View className="flex-1 bg-background">
      <PortalHeader
        topInset={top}
        tone="terracotta"
        icon={Store}
        eyebrow="Kênh Người Bán SkinSense"
        title={shopName || 'Gian Hàng Đối Tác'}
        eyebrowClassName="text-amber-500"
        iconWellClassName="border-amber-500/35 bg-amber-500/15"
        iconClassName="text-amber-500"
        actions={
          <>
            <Pressable
              role="button"
              accessibilityLabel="Trang soi da"
              onPress={() => {
                setStaffTodayViewMode('skin');
                router.push('/(tabs)' as Href);
              }}
              className="h-9 flex-row items-center gap-1 rounded-[12px] border border-emerald-500/40 bg-emerald-500/15 px-2.5 active:scale-[0.97]"
            >
              <Icon as={Home} size={13} className="text-emerald-500" />
              <Text className="text-[11px] font-semibold text-emerald-500">Soi da</Text>
            </Pressable>
            <Pressable
              role="button"
              accessibilityLabel="Xem Sàn (Khách)"
              onPress={() => router.push('/store' as Href)}
              className="h-9 items-center justify-center rounded-[12px] border border-border/80 bg-surface-2/90 px-2.5 active:scale-[0.97]"
            >
              <Text className="text-[11px] font-semibold text-foreground">Xem Sàn</Text>
            </Pressable>
            <HeaderIconButton icon={RefreshCw} label="Làm mới" onPress={() => void refreshData()} />
            <HeaderIconButton icon={LogOut} label="Đăng xuất" destructive onPress={() => void handleSignOut()} />
          </>
        }
        tabs={[
          { id: 'orders', label: `Đơn (${orders.length})`, icon: ShoppingBag },
          { id: 'products', label: `Sản phẩm (${products.length})`, icon: Package },
          { id: 'messages', label: `Tin nhắn (${threads.length})`, icon: MessageSquare },
          { id: 'wallet', label: 'Doanh thu', icon: Wallet },
          { id: 'profile', label: 'Hồ sơ Shop', icon: User },
        ]}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as typeof activeTab)}
      />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(bottom + 24, 32),
          gap: 12,
        }}
      >
        {toastMsg && <ToastBanner message={toastMsg} icon={CheckCircle2} tone="success" />}

        {!shopAccess.allowed && (
          <View className="flex-row items-start gap-2.5 rounded-[18px] border border-amber-500/40 bg-amber-500/10 p-4">
            <Icon as={AlertCircle} size={17} className="mt-0.5 text-amber-500" />
            <Text className="flex-1 text-[12.5px] leading-5 text-amber-500">{shopAccess.reason}</Text>
          </View>
        )}

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator />
            <Text className="mt-2 text-[12.5px] text-muted-foreground">Đang tải dữ liệu Gian hàng...</Text>
          </View>
        ) : (
          <>
            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <View className="gap-3.5">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2">
                  {(['all', 'pending', 'processing', 'delivering', 'delivered', 'cancelled'] as const).map((f) => {
                    const active = orderFilter === f;
                    return (
                      <Pressable
                        key={f}
                        onPress={() => setOrderFilter(f)}
                        className={`rounded-full border px-3.5 py-2 active:scale-[0.98] ${
                          active ? 'border-primary bg-primary' : 'border-border/80 bg-card'
                        }`}
                      >
                        <Text className={`text-[12px] font-medium ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                          {f === 'all' ? 'Tất cả' : ORDER_STATUS_LABELS[f]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {filteredOrders.length === 0 ? (
                  <View className={`items-center ${MODERN_CARD} p-8`}>
                    <Icon as={ShoppingBag} size={28} className="text-muted-foreground" />
                    <Text className="mt-2.5 text-[13.5px] font-medium text-foreground">
                      Chưa có đơn hàng nào cho gian hàng
                    </Text>
                  </View>
                ) : (
                  filteredOrders.map((o) => (
                    <View key={o.orderCode} className={`gap-2.5 ${MODERN_CARD} p-4`}>
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-[14.5px] font-semibold text-foreground">{o.orderCode}</Text>
                          <Text className="text-[12px] text-muted-foreground">
                            Khách: {o.customerName} {o.customerPhone ? `· ${o.customerPhone}` : ''}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-[14.5px] font-bold text-primary">{formatVnd(o.totalAmount)}</Text>
                          <Text className="text-[11px] font-semibold text-amber-500">
                            {ORDER_STATUS_LABELS[o.status] || o.status}
                          </Text>
                        </View>
                      </View>
                      {o.status === 'pending' && (
                        <View className="flex-row gap-2 pt-1">
                          <Pressable
                            disabled={busyKey === o.orderCode}
                            onPress={() => void handleOrderAction(o.orderCode, 'confirm')}
                            className="flex-1 items-center rounded-[12px] bg-primary py-2.5 active:scale-[0.98]"
                          >
                            <Text className="text-[12px] font-semibold text-primary-foreground">Xác nhận đơn</Text>
                          </Pressable>
                          <Pressable
                            disabled={busyKey === o.orderCode}
                            onPress={() => void handleOrderAction(o.orderCode, 'cancel')}
                            className="items-center rounded-[12px] border border-destructive/40 px-3.5 py-2.5 active:scale-[0.98]"
                          >
                            <Text className="text-[12px] font-semibold text-destructive">Hủy</Text>
                          </Pressable>
                        </View>
                      )}
                      {o.status === 'processing' && (
                        <Pressable
                          disabled={busyKey === o.orderCode}
                          onPress={() => void handleOrderAction(o.orderCode, 'ship')}
                          className="items-center rounded-[12px] bg-emerald-600 py-2.5 active:scale-[0.98]"
                        >
                          <Text className="text-[12px] font-semibold text-white">Bàn giao ĐVVC</Text>
                        </Pressable>
                      )}
                      {(o.status === 'delivering' || o.status === 'shipping') && (
                        <Pressable
                          disabled={busyKey === o.orderCode}
                          onPress={() => void handleOrderAction(o.orderCode, 'deliver')}
                          className="items-center rounded-[12px] bg-emerald-600 py-2.5 active:scale-[0.98]"
                        >
                          <Text className="text-[12px] font-semibold text-white">Xác nhận đã giao</Text>
                        </Pressable>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 2: SHOP PRODUCTS */}
            {activeTab === 'products' && (
              <View className="gap-3.5">
                <Pressable
                  role="button"
                  disabled={!shopAccess.allowed}
                  onPress={() => setShowAddProductModal(true)}
                  className="h-12 flex-row items-center justify-center gap-2 rounded-[14px] bg-primary active:scale-[0.98] disabled:opacity-45"
                >
                  <Icon as={Plus} size={16} className="text-primary-foreground" />
                  <Text className="text-[13.5px] font-semibold text-primary-foreground">
                    + Đăng bán sản phẩm mới
                  </Text>
                </Pressable>

                {products.length === 0 ? (
                  <View className={`items-center ${MODERN_CARD} p-8`}>
                    <Icon as={Package} size={28} className="text-muted-foreground" />
                    <Text className="mt-2.5 text-[13.5px] font-medium text-foreground">
                      Gian hàng chưa có sản phẩm nào
                    </Text>
                  </View>
                ) : (
                  products.map((p) => {
                    const badge = getProductApprovalBadge(p.status);
                    return (
                      <View key={p.id} className={`flex-row gap-3 ${MODERN_CARD} p-3.5`}>
                        <View className="size-16 overflow-hidden rounded-[13px] bg-surface-2">
                          <ProductImage
                            uri={p.coverImage || p.images?.[0]}
                            name={p.name}
                            brand={p.brand || p.shopName}
                            category={p.category || ''}
                            seed={p.id}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </View>
                        <View className="flex-1 gap-1">
                          <Text className="text-[14px] font-semibold text-foreground" numberOfLines={2}>
                            {p.name}
                          </Text>
                          <Text className="text-[12.5px] font-bold text-primary">
                            {formatVnd(p.price)} · Kho: {p.stock ?? 0}
                          </Text>
                          <View
                            className={`self-start rounded-full px-2.5 py-0.5 border ${
                              badge.variant === 'approved'
                                ? 'border-emerald-500/30 bg-emerald-500/15'
                                : badge.variant === 'pending'
                                ? 'border-amber-500/30 bg-amber-500/15'
                                : 'border-destructive/30 bg-destructive/10'
                            }`}
                          >
                            <Text
                              className={`text-[10.5px] font-semibold ${
                                badge.variant === 'approved'
                                  ? 'text-emerald-500'
                                  : badge.variant === 'pending'
                                  ? 'text-amber-500'
                                  : 'text-destructive'
                              }`}
                            >
                              {badge.label}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 3: SHOP INBOX CHAT WITH CUSTOMERS (/api/chat?forShop=true) */}
            {activeTab === 'messages' && (
              <View className="gap-3.5">
                {threads.length === 0 ? (
                  <View className={`items-center ${MODERN_CARD} p-8 gap-2`}>
                    <Icon as={MessageSquare} size={28} className="text-muted-foreground" />
                    <Text className="text-[13.5px] font-medium text-foreground">
                      Chưa có tin nhắn nào từ khách hàng
                    </Text>
                    <Text className="text-center text-[12px] text-muted-foreground leading-4">
                      Khi khách hàng nhắn tin hỏi sản phẩm hoặc đơn hàng, hội thoại sẽ đồng bộ tại đây.
                    </Text>
                  </View>
                ) : (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2">
                      {threads.map((t) => {
                        const active = (selectedThreadId || threads[0]?.id) === t.id;
                        return (
                          <Pressable
                            key={t.id}
                            onPress={() => setSelectedThreadId(t.id)}
                            className={`rounded-[14px] border px-3.5 py-2 active:scale-[0.98] ${
                              active ? 'border-primary bg-primary/15' : 'border-border/80 bg-card'
                            }`}
                          >
                            <Text className="text-[12px] font-semibold text-foreground">{t.userName}</Text>
                            {t.orderCode ? (
                              <Text className="text-[10.5px] text-muted-foreground">{t.orderCode}</Text>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {(() => {
                      const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0];
                      if (!activeThread) return null;
                      return (
                        <View className={`gap-3 ${MODERN_CARD} p-4`}>
                          <Text className="text-[14px] font-semibold text-foreground">
                            Hội thoại với {activeThread.userName}
                          </Text>
                          <View className="gap-2">
                            {activeThread.messages.map((m) => {
                              const fromShop = m.sender === 'shop';
                              return (
                                <View
                                  key={m.id}
                                  className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 ${
                                    fromShop
                                      ? 'self-end bg-primary rounded-br-[6px]'
                                      : 'self-start border border-border/80 bg-surface-2 rounded-bl-[6px]'
                                  }`}
                                >
                                  <Text className={`text-[13px] ${fromShop ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {m.text}
                                  </Text>
                                  <Text className={`mt-0.5 text-[10px] ${fromShop ? 'text-primary-foreground/75 text-right' : 'text-muted-foreground'}`}>
                                    {m.time}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                          <View className="flex-row items-center gap-2 border-t border-border/70 pt-3">
                            <TextInput
                              value={replyText}
                              onChangeText={setReplyText}
                              placeholder="Trả lời khách hàng..."
                              placeholderTextColor="#888"
                              className="flex-1 h-11 rounded-[13px] border border-border/90 bg-surface-2 px-3.5 text-[13px] text-foreground"
                            />
                            <Pressable
                              role="button"
                              accessibilityLabel="Gửi phản hồi"
                              disabled={sendingReply || !replyText.trim()}
                              onPress={() => void handleSendShopReply()}
                              className="size-11 items-center justify-center rounded-[13px] bg-primary active:scale-[0.96] disabled:opacity-45"
                            >
                              <Icon as={Send} size={15} className="text-primary-foreground" />
                            </Pressable>
                          </View>
                        </View>
                      );
                    })()}
                  </>
                )}
              </View>
            )}

            {/* TAB 4: WALLET / REVENUE */}
            {activeTab === 'wallet' && (
              <View className="gap-3">
                <View className={`${MODERN_CARD} p-4 gap-2`}>
                  <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Doanh thu thực nhận (Sau phí sàn 8%)
                  </Text>
                  <Text className="font-display text-[30px] font-normal text-emerald-500 leading-[36px]">
                    {formatVnd(walletSummary.net)}
                  </Text>
                  <Text className="text-[12.5px] text-muted-foreground">
                    Từ {walletSummary.completedCount} đơn hoàn tất · Đang luân chuyển: {formatVnd(walletSummary.inTransit)}
                  </Text>
                </View>
              </View>
            )}

            {/* TAB 4: SHOP PROFILE */}
            {activeTab === 'profile' && (
              <View className={`${MODERN_CARD} p-4 gap-2`}>
                <Text className="text-[15.5px] font-semibold text-foreground">{shopName}</Text>
                <Text className="text-[12.5px] text-muted-foreground">
                  Chủ sở hữu: {currentUser?.shopDetails?.ownerName || currentUser?.fullName || '—'}
                </Text>
                <Text className="text-[12.5px] text-muted-foreground">
                  GPKD / MST: {currentUser?.shopDetails?.license || '—'}
                </Text>
                <Text className="text-[12.5px] text-muted-foreground">
                  Địa chỉ kho: {currentUser?.shopDetails?.address || '—'}
                </Text>
                <Text className="text-[12.5px] text-muted-foreground">
                  Email: {currentUser?.email || '—'}
                </Text>
                <Pressable
                  role="button"
                  onPress={() => router.push('/profile' as Href)}
                  className={`mt-2 h-11 items-center justify-center ${MODERN_SUBCARD} active:scale-[0.98]`}
                >
                  <Text className="text-[13px] font-semibold text-foreground">
                    Chỉnh sửa Hồ sơ & Routine phân bổ
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Product Modal matching Web POST /api/admin/products */}
      <Modal visible={showAddProductModal} animationType="slide" transparent>
        <BottomSheetFrame bottomInset={bottom} maxHeightClass="max-h-[88%]">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-amber-500">
                Đăng bán sản phẩm (Chờ Admin duyệt)
              </Text>
              <Text className="font-display text-[20px] font-normal text-foreground">
                Thêm sản phẩm mới
              </Text>
            </View>
            <Pressable
              onPress={() => setShowAddProductModal(false)}
              className="size-8 items-center justify-center rounded-full bg-surface-2"
            >
              <Icon as={X} size={17} className="text-muted-foreground" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-2.5 pb-3">
            <Pressable
              onPress={() => void handlePickImage()}
              className="h-28 items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-border/90 bg-background"
            >
              {formImageUri ? (
                <Image source={{ uri: formImageUri }} className="size-full" contentFit="cover" />
              ) : (
                <Text className="text-[13px] text-muted-foreground">Chọn ảnh sản phẩm (tải lên Cloudinary)</Text>
              )}
            </Pressable>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              placeholder="Tên sản phẩm *"
              placeholderTextColor="#888"
              className={MODERN_INPUT}
            />
            <View className="flex-row gap-2">
              <TextInput
                value={formPrice}
                onChangeText={setFormPrice}
                placeholder="Giá bán VNĐ *"
                keyboardType="numeric"
                placeholderTextColor="#888"
                className={`flex-1 ${MODERN_INPUT}`}
              />
              <TextInput
                value={formStock}
                onChangeText={setFormStock}
                placeholder="Tồn kho"
                keyboardType="numeric"
                placeholderTextColor="#888"
                className={`flex-1 ${MODERN_INPUT}`}
              />
            </View>
            <TextInput
              value={formBrand}
              onChangeText={setFormBrand}
              placeholder="Thương hiệu (vd: La Roche-Posay)"
              placeholderTextColor="#888"
              className={MODERN_INPUT}
            />
            <TextInput
              value={formCategory}
              onChangeText={setFormCategory}
              placeholder="Danh mục"
              placeholderTextColor="#888"
              className={MODERN_INPUT}
            />
            <View className="flex-row gap-2">
              <TextInput
                value={formSku}
                onChangeText={setFormSku}
                placeholder="SKU"
                placeholderTextColor="#888"
                className={`flex-1 ${MODERN_INPUT}`}
              />
              <TextInput
                value={formOrigin}
                onChangeText={setFormOrigin}
                placeholder="Xuất xứ"
                placeholderTextColor="#888"
                className={`flex-1 ${MODERN_INPUT}`}
              />
            </View>
            <TextInput
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
              numberOfLines={3}
              placeholder="Mô tả thành phần, hoạt chất & công dụng"
              placeholderTextColor="#888"
              className="min-h-[80px] rounded-[14px] border border-border/90 bg-background p-3.5 text-[13.5px] text-foreground"
            />
          </ScrollView>

          <Pressable
            disabled={savingProduct}
            onPress={() => void handleCreateProduct()}
            className="mt-2 h-12 items-center justify-center rounded-[14px] bg-primary active:scale-[0.98] disabled:opacity-50"
          >
            {savingProduct ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-[14px] font-semibold text-primary-foreground">
                Gửi duyệt & Đăng bán
              </Text>
            )}
          </Pressable>
        </BottomSheetFrame>
      </Modal>
    </View>
  );
}
