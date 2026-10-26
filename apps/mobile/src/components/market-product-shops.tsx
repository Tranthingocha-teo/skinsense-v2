import {
  formatVnd,
  generateVietQrUrl,
  getProductById,
  type Order,
  type PaymentMethod,
  type Product,
  type Shop,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  Copy,
  CreditCard,
  MapPin,
  Minus,
  Phone,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
  User,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
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
  createOrder,
  getStoreProductById,
  loadProductShopVendors,
  type ProductShopVendor,
  type StoreProduct,
} from '@/lib/marketplace';

export function MarketProductShops({ productId }: { productId: string }) {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [product, setProduct] = useState<StoreProduct | Product | undefined>(
    getProductById(productId),
  );
  const [vendors, setVendors] = useState<ProductShopVendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<ProductShopVendor | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'official' | 'cheap' | 'fast'>('all');
  const [viewingShopModal, setViewingShopModal] = useState<Shop | null>(null);

  // Form states
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function init() {
      const [p, vendorList] = await Promise.all([
        getStoreProductById(productId),
        loadProductShopVendors(productId),
      ]);
      if (p) {
        setProduct(p);
      }
      setVendors(vendorList);
      if (vendorList.length > 0) {
        // Default to first official shop, or first available shop
        const official = vendorList.find((v) => v.shop.isOfficial) || vendorList[0];
        setSelectedVendor(official);
      }
      setLoading(false);
    }
    void init();
  }, [productId]);

  // Filtered & Sorted Vendors like Shopee
  const filteredVendors = useMemo(() => {
    let list = [...vendors];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.shop.shopName.toLowerCase().includes(q) ||
          v.shop.address.toLowerCase().includes(q) ||
          v.shop.ownerName.toLowerCase().includes(q),
      );
    }

    if (filterType === 'official') {
      list = list.filter((v) => v.shop.isOfficial);
    } else if (filterType === 'cheap') {
      list.sort((a, b) => a.priceVnd - b.priceVnd);
    } else if (filterType === 'fast') {
      list.sort((a, b) => (a.deliveryTime.includes('24h') ? -1 : 1));
    }

    return list;
  }, [vendors, searchQuery, filterType]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-background">
        <Icon as={AlertTriangle} size={40} className="text-warning mb-3" />
        <Text className="text-center text-lg font-medium">Không tìm thấy sản phẩm</Text>
        <Pressable
          role="button"
          onPress={() => router.back()}
          className="mt-4 rounded-control bg-primary px-5 py-2.5"
        >
          <Text className="font-medium text-primary-foreground">Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const activeUnitPrice = selectedVendor ? selectedVendor.priceVnd : product.priceVnd;
  const totalAmount = activeUnitPrice * quantity;
  const tempOrderMemo = `SS${productId.slice(0, 6).toUpperCase()}${Date.now().toString().slice(-4)}`;
  const qrUrl = generateVietQrUrl({
    amount: totalAmount,
    memo: tempOrderMemo,
  });

  async function handleConfirmOrder() {
    if (!product) return;
    if (!customerName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên người nhận hàng');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      Alert.alert('Số điện thoại không hợp lệ', 'Vui lòng nhập số điện thoại liên hệ chính xác');
      return;
    }
    if (!customerAddress.trim()) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng nhập địa chỉ nhận hàng chi tiết');
      return;
    }

    setSubmitting(true);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const chosenShop = selectedVendor?.shop;
      const newOrder = await createOrder({
        shopId: chosenShop?.id,
        shopName: chosenShop?.shopName,
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        priceVnd: activeUnitPrice,
        quantity,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        note: note.trim() || undefined,
        paymentMethod,
      });

      setPlacedOrder(newOrder);
    } catch {
      Alert.alert('Lỗi', 'Không thể hoàn tất đơn hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
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
            Đặt Mua Chính Hãng SkinSense
          </Text>
          <Text className="text-[12px] text-muted-foreground">
            Chọn gian hàng & so sánh giá như Shopee Mall
          </Text>
        </View>
        <View className="size-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
      >
        {/* Product Summary Card */}
        <View className="rounded-card border border-border bg-card p-4 gap-3">
          <View className="flex-row gap-3">
            <Image
              source={{ uri: product.imageUrl }}
              className="size-20 rounded-control bg-surface-2 border border-border"
              contentFit="cover"
            />
            <View className="flex-1 justify-center gap-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[12px] font-semibold text-primary uppercase">
                  {product.brand}
                </Text>
                <Icon as={BadgeCheck} size={14} className="text-primary" />
              </View>
              <Text className="text-[15px] font-medium text-foreground" numberOfLines={2}>
                {product.name}
              </Text>
              <View className="flex-row items-baseline gap-2">
                <Text className="text-[16px] font-bold text-primary">
                  {formatVnd(activeUnitPrice)}
                </Text>
                {selectedVendor && selectedVendor.priceVnd < product.priceVnd && (
                  <Text className="text-[13px] text-muted-foreground line-through">
                    {formatVnd(product.priceVnd)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Guarantee Badges */}
          <View className="flex-row flex-wrap gap-2 pt-2 border-t border-border">
            <View className="flex-row items-center gap-1 bg-success/10 px-2.5 py-1 rounded-pill">
              <Icon as={ShieldCheck} size={13} className="text-success" />
              <Text className="text-[11.5px] font-medium text-success">100% Chính Hãng</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-pill">
              <Icon as={Truck} size={13} className="text-primary" />
              <Text className="text-[11.5px] font-medium text-primary">Giao Nhanh 1-2 Ngày</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-surface-2 px-2.5 py-1 rounded-pill">
              <Icon as={CheckCircle2} size={13} className="text-muted-foreground" />
              <Text className="text-[11.5px] text-muted-foreground">Dược sĩ đồng hành</Text>
            </View>
          </View>
        </View>

        {/* =========================================================================
            MULTI-VENDOR SHOP SELECTION (CHUẨN SHOPEE)
            ========================================================================= */}
        <View className="rounded-card border border-border bg-card p-4 gap-3.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="size-7 items-center justify-center rounded-pill bg-primary/10">
                <Icon as={Store} size={15} className="text-primary" />
              </View>
              <View>
                <Text className="text-[15px] font-semibold text-foreground">
                  Gian Hàng Đang Bán ({filteredVendors.length})
                </Text>
                <Text className="text-[11.5px] text-muted-foreground">
                  Chọn shop có giá tốt nhất hoặc gần bạn
                </Text>
              </View>
            </View>
            {selectedVendor && (
              <View className="rounded-pill bg-primary/10 px-2.5 py-0.5">
                <Text className="text-[11px] font-semibold text-primary">
                  Đã chọn: {selectedVendor.shop.shopName.split(' ')[0]}
                </Text>
              </View>
            )}
          </View>

          {/* Search Shops Input */}
          <View className="flex-row items-center gap-2 rounded-control border border-border bg-surface-1 px-3 py-1.5">
            <Icon as={Search} size={15} className="text-muted-foreground" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm kiếm shop, khu vực kho (Hà Nội, HCM)..."
              placeholderTextColor="#888"
              className="flex-1 py-1 text-[13.5px] text-foreground"
            />
            {searchQuery.length > 0 && (
              <Pressable role="button" onPress={() => setSearchQuery('')}>
                <Icon as={X} size={14} className="text-muted-foreground" />
              </Pressable>
            )}
          </View>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable
              role="button"
              onPress={() => setFilterType('all')}
              className={`rounded-pill px-3 py-1.5 border ${
                filterType === 'all'
                  ? 'bg-primary border-primary'
                  : 'bg-surface-2 border-border'
              }`}
            >
              <Text
                className={`text-[12px] font-medium ${
                  filterType === 'all' ? 'text-primary-foreground font-semibold' : 'text-foreground'
                }`}
              >
                Tất cả Shop ({vendors.length})
              </Text>
            </Pressable>

            <Pressable
              role="button"
              onPress={() => setFilterType('official')}
              className={`flex-row items-center gap-1 rounded-pill px-3 py-1.5 border ${
                filterType === 'official'
                  ? 'bg-primary border-primary'
                  : 'bg-surface-2 border-border'
              }`}
            >
              <Icon
                as={BadgeCheck}
                size={12}
                className={filterType === 'official' ? 'text-primary-foreground' : 'text-primary'}
              />
              <Text
                className={`text-[12px] font-medium ${
                  filterType === 'official' ? 'text-primary-foreground font-semibold' : 'text-foreground'
                }`}
              >
                Chính Hãng Mall
              </Text>
            </Pressable>

            <Pressable
              role="button"
              onPress={() => setFilterType('cheap')}
              className={`rounded-pill px-3 py-1.5 border ${
                filterType === 'cheap'
                  ? 'bg-primary border-primary'
                  : 'bg-surface-2 border-border'
              }`}
            >
              <Text
                className={`text-[12px] font-medium ${
                  filterType === 'cheap' ? 'text-primary-foreground font-semibold' : 'text-foreground'
                }`}
              >
                Giá Rẻ Nhất
              </Text>
            </Pressable>

            <Pressable
              role="button"
              onPress={() => setFilterType('fast')}
              className={`rounded-pill px-3 py-1.5 border ${
                filterType === 'fast'
                  ? 'bg-primary border-primary'
                  : 'bg-surface-2 border-border'
              }`}
            >
              <Text
                className={`text-[12px] font-medium ${
                  filterType === 'fast' ? 'text-primary-foreground font-semibold' : 'text-foreground'
                }`}
              >
                Giao Nhanh 24h
              </Text>
            </Pressable>
          </ScrollView>

          {/* Vendors Cards List */}
          <View className="gap-3 pt-1">
            {filteredVendors.length === 0 ? (
              <View className="items-center py-6 gap-2">
                <Text className="text-sm text-muted-foreground">Không tìm thấy gian hàng phù hợp</Text>
                <Pressable
                  role="button"
                  onPress={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                >
                  <Text className="text-xs text-primary font-medium">Đặt lại bộ lọc</Text>
                </Pressable>
              </View>
            ) : (
              filteredVendors.map((vendor) => {
                const isSelected = selectedVendor?.shop.id === vendor.shop.id;
                return (
                  <View
                    key={vendor.listingId}
                    className={`rounded-control border p-3.5 gap-2.5 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface-1'
                    }`}
                  >
                    {/* Shop Info Row */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <Image
                          source={{ uri: vendor.shop.avatarUrl }}
                          className="size-10 rounded-pill bg-surface-2 border border-border"
                          contentFit="cover"
                        />
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5 flex-wrap">
                            <Text className="text-[14px] font-bold text-foreground" numberOfLines={1}>
                              {vendor.shop.shopName}
                            </Text>
                            {vendor.shop.isOfficial ? (
                              <View className="rounded-pill bg-destructive/15 px-1.5 py-0.5">
                                <Text className="text-[10px] font-bold text-destructive uppercase">
                                  Shopee Mall
                                </Text>
                              </View>
                            ) : (
                              <View className="rounded-pill bg-blue-500/15 px-1.5 py-0.5">
                                <Text className="text-[10px] font-bold text-blue-500 uppercase">
                                  Shop Yêu Thích
                                </Text>
                              </View>
                            )}
                          </View>
                          <View className="flex-row items-center gap-2 mt-0.5">
                            <View className="flex-row items-center gap-0.5">
                              <Icon as={Star} size={11} className="text-amber-500 fill-amber-500" />
                              <Text className="text-[11.5px] font-semibold text-foreground">
                                {vendor.shop.rating}
                              </Text>
                            </View>
                            <Text className="text-[11.5px] text-muted-foreground">
                              ({vendor.shop.reviewCount} đánh giá)
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Shop Price */}
                      <View className="items-end">
                        <Text className="text-[16px] font-extrabold text-primary">
                          {vendor.priceFormatted}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground">
                          Kho: {vendor.shop.address.includes('Hà Nội') ? 'Hà Nội' : 'TP.HCM'}
                        </Text>
                      </View>
                    </View>

                    {/* Delivery & Stock badges */}
                    <View className="flex-row items-center justify-between pt-1 border-t border-border/60">
                      <View className="flex-row items-center gap-1.5">
                        <Icon as={Truck} size={12} className="text-primary" />
                        <Text className="text-[11.5px] text-muted-foreground">
                          {vendor.deliveryTime}
                        </Text>
                      </View>
                      <Text className="text-[11px] text-muted-foreground">
                        Sẵn hàng: <Text className="font-semibold text-foreground">{vendor.stock}</Text>
                      </Text>
                    </View>

                    {/* Action Buttons: Xem Shop & Chọn Mua */}
                    <View className="flex-row items-center gap-2 pt-1">
                      <Pressable
                        role="button"
                        onPress={() => {
                          void Haptics.selectionAsync().catch(() => {});
                          setViewingShopModal(vendor.shop);
                        }}
                        className="flex-1 h-9 flex-row items-center justify-center gap-1.5 rounded-control border border-border bg-card active:opacity-75"
                      >
                        <Icon as={Store} size={13} className="text-foreground" />
                        <Text className="text-[12.5px] font-medium text-foreground">
                          Xem Shop
                        </Text>
                      </Pressable>

                      <Pressable
                        role="button"
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setSelectedVendor(vendor);
                        }}
                        className={`flex-[1.5] h-9 flex-row items-center justify-center gap-1.5 rounded-control active:opacity-90 ${
                          isSelected
                            ? 'bg-success text-success-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <Icon
                          as={isSelected ? CheckCircle2 : ShoppingBag}
                          size={14}
                          className="text-white"
                        />
                        <Text className="text-[13px] font-semibold text-white">
                          {isSelected ? 'Đã Chọn Shop Này' : 'Chọn Mua Từ Shop'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* =========================================================================
            ORDER FORM FOR SELECTED SHOP
            ========================================================================= */}
        <View className="rounded-card border border-border bg-card p-4 gap-3">
          <View className="flex-row items-center justify-between pb-2 border-b border-border">
            <View>
              <Text className="text-[15px] font-semibold text-foreground">
                Thông tin nhận hàng
              </Text>
              {selectedVendor && (
                <Text className="text-[12px] text-primary font-medium">
                  Mua trực tiếp từ: {selectedVendor.shop.shopName}
                </Text>
              )}
            </View>

            {/* Quantity Selector */}
            <View className="flex-row items-center gap-2 bg-surface-2 rounded-control px-2 py-1 border border-border">
              <Pressable
                role="button"
                accessibilityLabel="Giảm số lượng"
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                className="size-7 items-center justify-center rounded-pill bg-card active:opacity-70"
              >
                <Icon as={Minus} size={14} className="text-foreground" />
              </Pressable>
              <Text className="text-[14px] font-bold text-foreground w-5 text-center">
                {quantity}
              </Text>
              <Pressable
                role="button"
                accessibilityLabel="Tăng số lượng"
                onPress={() => setQuantity((q) => q + 1)}
                className="size-7 items-center justify-center rounded-pill bg-card active:opacity-70"
              >
                <Icon as={Plus} size={14} className="text-foreground" />
              </Pressable>
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-[12.5px] font-medium text-muted-foreground">
              Số lượng mua
            </Text>
            <View className="flex-row items-center justify-between bg-surface-1 px-3 py-2 rounded-control border border-border">
              <Text className="text-[13px] text-muted-foreground">Đơn giá áp dụng của Shop:</Text>
              <Text className="text-[14px] font-bold text-primary">
                {formatVnd(activeUnitPrice)} / hộp
              </Text>
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-[12.5px] font-medium text-muted-foreground">
              Họ và tên người nhận <Text className="text-destructive">*</Text>
            </Text>
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Ví dụ: Trần Thị Ngọc Hà"
              placeholderTextColor="#888"
              className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-[12.5px] font-medium text-muted-foreground">
              Số điện thoại liên hệ <Text className="text-destructive">*</Text>
            </Text>
            <TextInput
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Ví dụ: 0912345678"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-[12.5px] font-medium text-muted-foreground">
              Địa chỉ giao hàng chi tiết <Text className="text-destructive">*</Text>
            </Text>
            <TextInput
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
              placeholderTextColor="#888"
              multiline
              numberOfLines={2}
              className="min-h-[50px] rounded-control border border-border bg-surface-1 px-3 py-2 text-[14px] text-foreground"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-[12.5px] font-medium text-muted-foreground">
              Ghi chú cho gian hàng (tuỳ chọn)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Thời gian nhận hàng hoặc lưu ý về tình trạng da..."
              placeholderTextColor="#888"
              className="h-11 rounded-control border border-border bg-surface-1 px-3 text-[14px] text-foreground"
            />
          </View>
        </View>

        {/* Payment Methods */}
        <View className="rounded-card border border-border bg-card p-4 gap-3">
          <Text className="text-[15px] font-semibold text-foreground">
            Phương thức thanh toán
          </Text>

          {/* COD Option */}
          <Pressable
            role="radio"
            aria-checked={paymentMethod === 'cod'}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              setPaymentMethod('cod');
            }}
            className={`flex-row items-center justify-between rounded-control border p-3 ${
              paymentMethod === 'cod'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface-1'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className="size-9 items-center justify-center rounded-pill bg-success/20">
                <Icon as={CreditCard} size={18} className="text-success" />
              </View>
              <View>
                <Text className="text-[14px] font-medium text-foreground">
                  Thanh toán khi nhận hàng (COD)
                </Text>
                <Text className="text-[12px] text-muted-foreground">
                  Kiểm tra hàng chính hãng trước khi thanh toán cho shipper
                </Text>
              </View>
            </View>
            <View
              className={`size-5 rounded-pill border items-center justify-center ${
                paymentMethod === 'cod' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}
            >
              {paymentMethod === 'cod' && (
                <View className="size-2 rounded-pill bg-primary-foreground" />
              )}
            </View>
          </Pressable>

          {/* VietQR Option */}
          <Pressable
            role="radio"
            aria-checked={paymentMethod === 'vietqr'}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              setPaymentMethod('vietqr');
            }}
            className={`flex-row items-center justify-between rounded-control border p-3 ${
              paymentMethod === 'vietqr'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface-1'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className="size-9 items-center justify-center rounded-pill bg-primary/20">
                <Icon as={QrCode} size={18} className="text-primary" />
              </View>
              <View>
                <Text className="text-[14px] font-medium text-foreground">
                  Chuyển khoản VietQR tức thì (24/7)
                </Text>
                <Text className="text-[12px] text-muted-foreground">
                  Miễn phí giao dịch qua app mọi ngân hàng Việt Nam
                </Text>
              </View>
            </View>
            <View
              className={`size-5 rounded-pill border items-center justify-center ${
                paymentMethod === 'vietqr' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}
            >
              {paymentMethod === 'vietqr' && (
                <View className="size-2 rounded-pill bg-primary-foreground" />
              )}
            </View>
          </Pressable>

          {/* VietQR Preview Box */}
          {paymentMethod === 'vietqr' && (
            <View className="mt-2 items-center rounded-control border border-primary/30 bg-primary/5 p-4 gap-2">
              <Text className="text-[12px] font-semibold text-primary uppercase tracking-wider">
                Mã VietQR tự động theo số tiền đơn hàng
              </Text>
              <Image
                source={{ uri: qrUrl }}
                className="size-48 rounded-control bg-white"
                contentFit="contain"
              />
              <Text className="text-[12px] text-muted-foreground text-center">
                Mở ứng dụng ngân hàng quét mã QR trên hoặc chuyển khoản sau khi tạo đơn
              </Text>
            </View>
          )}
        </View>

        {/* Order Summary & Confirm */}
        <View className="rounded-card border border-border bg-card p-4 gap-3">
          <View className="flex-row justify-between">
            <Text className="text-[13.5px] text-muted-foreground">Gian hàng cung cấp:</Text>
            <Text className="text-[13.5px] font-semibold text-foreground">
              {selectedVendor?.shop.shopName || 'SkinSense Boutique'}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-[13.5px] text-muted-foreground">Số lượng:</Text>
            <Text className="text-[13.5px] font-medium text-foreground">x{quantity}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-[13.5px] text-muted-foreground">Phí vận chuyển:</Text>
            <Text className="text-[13.5px] font-medium text-success">Miễn phí giao hàng</Text>
          </View>
          <View className="flex-row justify-between items-baseline pt-2 border-t border-border">
            <Text className="text-[15px] font-semibold text-foreground">Tổng thanh toán:</Text>
            <Text className="text-[20px] font-bold text-primary">
              {formatVnd(totalAmount)}
            </Text>
          </View>

          <Pressable
            role="button"
            onPress={handleConfirmOrder}
            disabled={submitting}
            className="mt-2 h-12 flex-row items-center justify-center gap-2 rounded-control bg-primary active:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon as={ShoppingBag} size={18} className="text-primary-foreground" />
                <Text className="text-[15px] font-semibold text-primary-foreground">
                  Xác nhận đặt hàng
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* =========================================================================
          MODAL: VIEW SHOP PROFILE (XEM GIAN HÀNG)
          ========================================================================= */}
      <Modal
        visible={viewingShopModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setViewingShopModal(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-[28px] border-t border-border bg-card p-6 gap-4">
            <View className="flex-row items-center justify-between pb-2 border-b border-border">
              <View className="flex-row items-center gap-2">
                <Icon as={Store} size={18} className="text-primary" />
                <Text className="text-[17px] font-bold text-foreground">
                  Hồ Sơ Gian Hàng Đối Tác
                </Text>
              </View>
              <Pressable
                role="button"
                onPress={() => setViewingShopModal(null)}
                className="size-8 items-center justify-center rounded-pill bg-surface-2"
              >
                <Icon as={X} size={16} className="text-muted-foreground" />
              </Pressable>
            </View>

            {viewingShopModal && (
              <View className="gap-3.5">
                <View className="flex-row items-center gap-3">
                  <Image
                    source={{ uri: viewingShopModal.avatarUrl }}
                    className="size-14 rounded-pill bg-surface-2 border border-border"
                    contentFit="cover"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <Text className="text-[16px] font-bold text-foreground">
                        {viewingShopModal.shopName}
                      </Text>
                      {viewingShopModal.isOfficial && (
                        <View className="rounded-pill bg-destructive/15 px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-destructive uppercase">
                            Shopee Mall
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <Icon as={Star} size={12} className="text-amber-500 fill-amber-500" />
                      <Text className="text-[13px] font-semibold text-foreground">
                        {viewingShopModal.rating}
                      </Text>
                      <Text className="text-[12px] text-muted-foreground">
                        ({viewingShopModal.reviewCount} đánh giá từ khách hàng)
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="gap-2 rounded-control bg-surface-1 p-3 border border-border">
                  <View className="flex-row items-center gap-2">
                    <Icon as={User} size={14} className="text-muted-foreground" />
                    <Text className="text-[13px] text-foreground">
                      Chủ shop: <Text className="font-semibold">{viewingShopModal.ownerName}</Text>
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Icon as={Phone} size={14} className="text-muted-foreground" />
                    <Text className="text-[13px] text-foreground">
                      Hotline hỗ trợ: <Text className="font-semibold">{viewingShopModal.phone}</Text>
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Icon as={MapPin} size={14} className="text-muted-foreground mt-0.5" />
                    <Text className="text-[13px] text-foreground flex-1">
                      Địa chỉ kho: <Text className="font-semibold">{viewingShopModal.address}</Text>
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-around rounded-control bg-success/10 p-3">
                  <View className="items-center">
                    <Text className="text-[12px] text-success font-medium">Cam kết</Text>
                    <Text className="text-[13px] font-bold text-success">100% Chính Hãng</Text>
                  </View>
                  <View className="w-[1px] h-6 bg-success/30" />
                  <View className="items-center">
                    <Text className="text-[12px] text-success font-medium">Tỷ lệ phản hồi</Text>
                    <Text className="text-[13px] font-bold text-success">99% Trong 15p</Text>
                  </View>
                </View>

                <Pressable
                  role="button"
                  onPress={() => {
                    const matchedVendor = vendors.find((v) => v.shop.id === viewingShopModal.id);
                    if (matchedVendor) {
                      setSelectedVendor(matchedVendor);
                    }
                    setViewingShopModal(null);
                  }}
                  className="h-11 flex-row items-center justify-center gap-2 rounded-control bg-primary active:opacity-90 mt-1"
                >
                  <Icon as={ShoppingBag} size={16} className="text-primary-foreground" />
                  <Text className="text-[14px] font-semibold text-primary-foreground">
                    Chọn Mua Hàng Từ Shop Này
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* =========================================================================
          MODAL: ORDER SUCCESS WITH VIETQR
          ========================================================================= */}
      <Modal visible={placedOrder !== null} animationType="slide" transparent>
        <View className="flex-1 justify-center bg-black/70 p-5">
          <View className="rounded-card border border-border bg-card p-6 gap-4">
            <View className="items-center gap-2">
              <View className="size-14 items-center justify-center rounded-pill bg-success/20">
                <Icon as={CheckCircle2} size={32} className="text-success" />
              </View>
              <Text className="text-[18px] font-bold text-foreground text-center">
                Đặt Hàng Thành Công!
              </Text>
              <Text className="text-[13px] text-muted-foreground text-center">
                Mã đơn hàng: <Text className="font-mono font-bold text-primary">{placedOrder?.id}</Text>
              </Text>
              <View className="rounded-pill bg-primary/10 px-3 py-1">
                <Text className="text-[12px] font-semibold text-primary">
                  Cung cấp bởi: {placedOrder?.shopName}
                </Text>
              </View>
            </View>

            {placedOrder?.paymentMethod === 'vietqr' && (
              <View className="items-center rounded-control bg-surface-1 p-4 border border-border gap-2">
                <Text className="text-[12px] font-semibold text-primary uppercase">
                  Quét mã VietQR để hoàn tất thanh toán
                </Text>
                <Image
                  source={{ uri: qrUrl }}
                  className="size-48 rounded-control bg-white"
                  contentFit="contain"
                />
                <Text className="text-[14px] font-bold text-foreground">
                  {formatVnd(placedOrder.totalVnd)}
                </Text>
                <Text className="text-[11.5px] text-muted-foreground text-center">
                  Nội dung CK: <Text className="font-mono text-primary">{tempOrderMemo}</Text>
                </Text>
              </View>
            )}

            <View className="gap-2 pt-2">
              <Pressable
                role="button"
                onPress={() => {
                  setPlacedOrder(null);
                  router.push('/orders' as any);
                }}
                className="h-11 flex-row items-center justify-center gap-2 rounded-control bg-primary active:opacity-90"
              >
                <Icon as={ShoppingBag} size={16} className="text-primary-foreground" />
                <Text className="text-[14px] font-medium text-primary-foreground">
                  Xem Đơn Mua Của Tôi
                </Text>
              </Pressable>

              <Pressable
                role="button"
                onPress={() => {
                  setPlacedOrder(null);
                  router.back();
                }}
                className="h-11 items-center justify-center rounded-control border border-border bg-surface-1 active:opacity-75"
              >
                <Text className="text-[14px] font-medium text-foreground">
                  Tiếp Tục Mua Sắm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
