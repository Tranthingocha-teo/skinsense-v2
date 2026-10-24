import {
  formatVnd,
  generateVietQrUrl,
  getProductById,
  type Order,
  type PaymentMethod,
  type Product,
  type Shop,
  type ShopListing,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Copy,
  CreditCard,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
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
import { createOrder, loadListings, loadShops } from '@/lib/marketplace';

export function MarketProductShops({ productId }: { productId: string }) {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const product = getProductById(productId);

  const [shops, setShops] = useState<Shop[]>([]);
  const [listings, setListings] = useState<ShopListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Checkout modal state
  const [selectedShop, setSelectedShop] = useState<{ shop: Shop; listing: ShopListing } | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function init() {
      const allShops = await loadShops();
      const productListings = await loadListings(productId);
      const approvedShops = allShops.filter((s) => s.status === 'approved');
      setShops(approvedShops);
      setListings(productListings);
      setLoading(false);
    }
    void init();
  }, [productId]);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-background">
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

  // Combine listings with shop details
  const shopOffers = listings
    .map((listing) => {
      const shop = shops.find((s) => s.id === listing.shopId);
      return shop ? { shop, listing } : null;
    })
    .filter(Boolean) as { shop: Shop; listing: ShopListing }[];

  async function handleConfirmOrder() {
    if (!selectedShop) return;
    if (!customerName.trim()) {
      Alert.alert('Vui lòng nhập tên', 'Bạn hãy nhập họ tên người nhận.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      Alert.alert('Số điện thoại không hợp lệ', 'Vui lòng nhập số điện thoại chính xác.');
      return;
    }
    if (!customerAddress.trim()) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng nhập địa chỉ nhận hàng.');
      return;
    }

    setSubmitting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const order = await createOrder({
        shopId: selectedShop.shop.id,
        shopName: selectedShop.shop.shopName,
        productId: product!.id,
        productName: product!.name,
        productImage: product!.imageUrl,
        priceVnd: selectedShop.listing.priceVnd,
        quantity: 1,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        note: note.trim() || undefined,
        paymentMethod,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setPlacedOrder(order);
    } catch (error) {
      Alert.alert('Đặt hàng thất bại', 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  const vietQrUrl =
    selectedShop &&
    generateVietQrUrl({
      amount: selectedShop.listing.priceVnd,
      memo: `SKIN-${productId.slice(0, 6)}`,
    });

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
        <Text className="font-display text-[18px] font-medium">Gian hàng chính hãng</Text>
        <View className="size-11" />
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-24 pt-3"
        showsVerticalScrollIndicator={false}
      >
        {/* Product Compact Card */}
        <View className="flex-row items-center gap-3.5 rounded-card border border-border bg-card p-3.5">
          <View className="size-20 overflow-hidden rounded-control bg-surface-2">
            <Image
              source={{ uri: product.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {product.brand}
            </Text>
            <Text numberOfLines={2} className="text-[14px] font-medium leading-[19px]">
              {product.name}
            </Text>
            <Text className="text-[15px] font-bold text-primary">{product.priceFormatted}</Text>
          </View>
        </View>

        {/* Section Header */}
        <View className="mt-1 flex-row items-center justify-between">
          <View>
            <Text role="heading" aria-level="2" className="text-[17px] font-semibold">
              Các Shop được kiểm duyệt ({shopOffers.length})
            </Text>
            <Text className="text-[12.5px] font-light text-muted-foreground">
              Cam kết 100% hàng chính hãng, kiểm định bởi SkinSense
            </Text>
          </View>
        </View>

        {/* List of Verified Shops */}
        {loading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="small" color="#666" />
            <Text className="mt-2 text-[13px] text-muted-foreground">Đang tải danh sách gian hàng...</Text>
          </View>
        ) : shopOffers.length === 0 ? (
          <View className="py-10 items-center justify-center rounded-card border border-border bg-card p-6">
            <Icon as={ShoppingBag} size={32} className="text-muted-foreground" />
            <Text className="mt-3 text-[14.5px] font-medium">Chưa có gian hàng nào cho sản phẩm này</Text>
            <Text className="mt-1 text-center text-[12.5px] text-muted-foreground">
              Các đối tác đang chuẩn bị kho hàng. Vui lòng quay lại sau.
            </Text>
          </View>
        ) : (
          shopOffers.map(({ shop, listing }) => (
            <View
              key={listing.id}
              className="gap-3 rounded-card border border-border bg-card p-4 shadow-sm"
            >
              {/* Shop Header */}
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="size-11 overflow-hidden rounded-pill bg-surface-2 border border-border">
                    <Image
                      source={{ uri: shop.avatarUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-[15px] font-semibold">{shop.shopName}</Text>
                      {shop.isOfficial && (
                        <Icon as={BadgeCheck} size={16} className="text-primary fill-primary/20" />
                      )}
                    </View>
                    <View className="mt-0.5 flex-row items-center gap-2">
                      <View className="flex-row items-center gap-1">
                        <Icon as={Star} size={12} className="text-amber-500 fill-amber-500" />
                        <Text className="text-[12px] font-medium">{shop.rating.toFixed(1)}</Text>
                      </View>
                      <Text className="text-[11.5px] text-muted-foreground">· {shop.reviewCount} đánh giá</Text>
                    </View>
                  </View>
                </View>
                {shop.isOfficial && (
                  <View className="rounded-pill bg-primary/10 px-2.5 py-0.5">
                    <Text className="text-[10.5px] font-medium text-primary">Official Partner</Text>
                  </View>
                )}
              </View>

              {/* Delivery & Stock Info */}
              <View className="flex-row items-center justify-between border-t border-border/60 pt-2.5">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={Truck} size={14} className="text-muted-foreground" />
                  <Text className="text-[12.5px] text-muted-foreground">{listing.deliveryTime}</Text>
                </View>
                <Text className="text-[12px] text-muted-foreground">Kho còn: {listing.stock}</Text>
              </View>

              {/* Price & Action */}
              <View className="flex-row items-center justify-between border-t border-border/60 pt-3">
                <View>
                  <Text className="text-[11px] text-muted-foreground">Giá gian hàng</Text>
                  <Text className="text-[19px] font-bold text-foreground">
                    {listing.priceFormatted}
                  </Text>
                </View>
                <Pressable
                  role="button"
                  accessibilityLabel={`Chọn mua từ ${shop.shopName}`}
                  onPress={() => {
                    setSelectedShop({ shop, listing });
                  }}
                  className="h-10 px-5 flex-row items-center justify-center rounded-control bg-primary active:opacity-90"
                >
                  <Text className="text-[14px] font-semibold text-primary-foreground">
                    Chọn mua
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Fast Checkout Modal */}
      <Modal
        visible={selectedShop !== null && placedOrder === null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedShop(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View
            style={{ paddingBottom: Math.max(bottom, 16) }}
            className="max-h-[88%] rounded-t-[28px] border-t border-border bg-background p-5 shadow-2xl"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-border">
              <View>
                <Text className="text-[17px] font-bold">Đặt mua nhanh</Text>
                <Text className="text-[12px] text-muted-foreground">
                  Gian hàng: {selectedShop?.shop.shopName}
                </Text>
              </View>
              <Pressable
                role="button"
                onPress={() => setSelectedShop(null)}
                className="size-9 items-center justify-center rounded-pill bg-surface-2"
              >
                <Icon as={X} size={18} className="text-foreground" />
              </Pressable>
            </View>

            <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
              {/* Shipping Form */}
              <View className="gap-3">
                <Text className="text-[13.5px] font-semibold">Thông tin giao hàng</Text>
                <View className="gap-2.5">
                  <TextInput
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Họ và tên người nhận *"
                    placeholderTextColor="#888"
                    className="h-12 rounded-control border border-border bg-card px-3.5 text-[14px] text-foreground"
                  />
                  <TextInput
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="Số điện thoại nhận hàng *"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    className="h-12 rounded-control border border-border bg-card px-3.5 text-[14px] text-foreground"
                  />
                  <TextInput
                    value={customerAddress}
                    onChangeText={setCustomerAddress}
                    placeholder="Địa chỉ giao hàng (Số nhà, đường, phường/xã) *"
                    placeholderTextColor="#888"
                    className="h-12 rounded-control border border-border bg-card px-3.5 text-[14px] text-foreground"
                  />
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Ghi chú cho gian hàng (tùy chọn)"
                    placeholderTextColor="#888"
                    className="h-12 rounded-control border border-border bg-card px-3.5 text-[14px] text-foreground"
                  />
                </View>

                {/* Payment Selection */}
                <Text className="mt-2 text-[13.5px] font-semibold">Hình thức thanh toán</Text>
                <View className="gap-2">
                  {/* COD */}
                  <Pressable
                    role="radio"
                    aria-checked={paymentMethod === 'cod'}
                    onPress={() => setPaymentMethod('cod')}
                    className={`flex-row items-center justify-between rounded-control border p-3.5 ${
                      paymentMethod === 'cod'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <Icon as={Truck} size={18} className="text-foreground" />
                      <View>
                        <Text className="text-[14px] font-medium">Thanh toán khi nhận hàng (COD)</Text>
                        <Text className="text-[11.5px] text-muted-foreground">Trả tiền mặt cho shipper khi giao tới</Text>
                      </View>
                    </View>
                    <View className={`size-4 rounded-pill border items-center justify-center ${paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground'}`}>
                      {paymentMethod === 'cod' && <View className="size-2 rounded-pill bg-primary" />}
                    </View>
                  </Pressable>

                  {/* VietQR */}
                  <Pressable
                    role="radio"
                    aria-checked={paymentMethod === 'vietqr'}
                    onPress={() => setPaymentMethod('vietqr')}
                    className={`flex-row items-center justify-between rounded-control border p-3.5 ${
                      paymentMethod === 'vietqr'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <Icon as={QrCode} size={18} className="text-foreground" />
                      <View>
                        <Text className="text-[14px] font-medium">Chuyển khoản ngân hàng (VietQR)</Text>
                        <Text className="text-[11.5px] text-muted-foreground">Quét mã QR tự động điền tiền và nội dung</Text>
                      </View>
                    </View>
                    <View className={`size-4 rounded-pill border items-center justify-center ${paymentMethod === 'vietqr' ? 'border-primary' : 'border-muted-foreground'}`}>
                      {paymentMethod === 'vietqr' && <View className="size-2 rounded-pill bg-primary" />}
                    </View>
                  </Pressable>

                  {/* VietQR Display Box */}
                  {paymentMethod === 'vietqr' && vietQrUrl && (
                    <View className="mt-2 items-center rounded-card border border-border bg-card p-4">
                      <Text className="text-[12px] font-medium text-muted-foreground">Quét mã QR để thanh toán đơn hàng</Text>
                      <View className="my-2.5 size-48 overflow-hidden rounded-control bg-white p-1">
                        <Image
                          source={{ uri: vietQrUrl }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="contain"
                        />
                      </View>
                      <View className="w-full gap-1 border-t border-border/60 pt-2 text-center">
                        <Text className="text-center text-[12px] text-muted-foreground">
                          Ngân hàng: <Text className="font-bold text-foreground">MB Bank (Quân Đội)</Text>
                        </Text>
                        <Text className="text-center text-[12px] text-muted-foreground">
                          Số tài khoản: <Text className="font-bold text-foreground">999988886666</Text>
                        </Text>
                        <Text className="text-center text-[12px] text-muted-foreground">
                          Chủ tài khoản: <Text className="font-bold text-foreground">SKINSENSE VIETNAM</Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Price Breakdown */}
                <View className="mt-3 gap-1.5 rounded-card border border-border bg-card p-3.5">
                  <View className="flex-row justify-between">
                    <Text className="text-[13px] text-muted-foreground">Tiền sản phẩm</Text>
                    <Text className="text-[13px] font-medium">{selectedShop?.listing.priceFormatted}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-[13px] text-muted-foreground">Phí vận chuyển</Text>
                    <Text className="text-[13px] font-medium text-success">Miễn phí</Text>
                  </View>
                  <View className="mt-1 flex-row justify-between border-t border-border/60 pt-2">
                    <Text className="text-[14.5px] font-bold">Tổng thanh toán</Text>
                    <Text className="text-[17px] font-bold text-primary">
                      {selectedShop?.listing.priceFormatted}
                    </Text>
                  </View>
                </View>

                {/* Submit Button */}
                <Pressable
                  role="button"
                  disabled={submitting}
                  onPress={handleConfirmOrder}
                  className="mt-3 h-12 flex-row items-center justify-center rounded-control bg-primary active:opacity-90 disabled:opacity-50"
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-[15px] font-bold text-primary-foreground">
                      Xác nhận đặt hàng
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Order Placed Success Modal */}
      <Modal
        visible={placedOrder !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setPlacedOrder(null);
          setSelectedShop(null);
          router.replace('/');
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-5">
          <View className="w-full rounded-[24px] border border-border bg-card p-6 shadow-2xl items-center">
            <View className="size-16 items-center justify-center rounded-pill bg-success/10 mb-3">
              <Icon as={CheckCircle2} size={36} className="text-success" />
            </View>
            <Text className="text-[20px] font-bold text-foreground">Đặt hàng thành công!</Text>
            <Text className="mt-1 text-center text-[13px] text-muted-foreground">
              Đơn hàng của bạn đã được chuyển tới gian hàng {placedOrder?.shopName}.
            </Text>

            <View className="my-4 w-full gap-2 rounded-control bg-surface-2 p-3.5">
              <View className="flex-row justify-between">
                <Text className="text-[12.5px] text-muted-foreground">Mã đơn hàng</Text>
                <Text className="text-[12.5px] font-bold text-foreground">{placedOrder?.id}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[12.5px] text-muted-foreground">Sản phẩm</Text>
                <Text numberOfLines={1} className="w-40 text-right text-[12.5px] font-medium text-foreground">
                  {placedOrder?.productName}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[12.5px] text-muted-foreground">Tổng tiền</Text>
                <Text className="text-[13px] font-bold text-primary">{placedOrder?.totalFormatted}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[12.5px] text-muted-foreground">Thanh toán</Text>
                <Text className="text-[12.5px] font-medium text-foreground">
                  {placedOrder?.paymentMethod === 'cod' ? 'Thanh toán COD' : 'Chuyển khoản VietQR'}
                </Text>
              </View>
            </View>

            <Pressable
              role="button"
              onPress={() => {
                setPlacedOrder(null);
                setSelectedShop(null);
                router.replace('/');
              }}
              className="h-12 w-full items-center justify-center rounded-control bg-primary active:opacity-90"
            >
              <Text className="text-[15px] font-medium text-primary-foreground">
                Hoàn tất & Về trang chủ
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
