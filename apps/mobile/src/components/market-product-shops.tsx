import {
  formatVnd,
  generateVietQrUrl,
  getProductById,
  type Order,
  type PaymentMethod,
  type Product,
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
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
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
import {
  createOrder,
  getStoreProductById,
  SKINSENSE_STORE_INFO,
  type StoreProduct,
} from '@/lib/marketplace';

export function MarketProductShops({ productId }: { productId: string }) {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [product, setProduct] = useState<StoreProduct | Product | undefined>(
    getProductById(productId),
  );
  const [loading, setLoading] = useState(true);

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
      const p = await getStoreProductById(productId);
      if (p) {
        setProduct(p);
      }
      setLoading(false);
    }
    void init();
  }, [productId]);

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

  const unitPrice = product.priceVnd;
  const totalAmount = unitPrice * quantity;
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
      const newOrder = await createOrder({
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        priceVnd: unitPrice,
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
            Phòng khám & Dược mỹ phẩm độc quyền
          </Text>
        </View>
        <View className="size-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
      >
        {/* Product Card */}
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
              <Text className="text-[16px] font-bold text-primary">
                {formatVnd(unitPrice)}
              </Text>
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

          {/* Quantity Selector */}
          <View className="flex-row items-center justify-between pt-2 border-t border-border">
            <Text className="text-[14px] font-medium text-foreground">Số lượng mua</Text>
            <View className="flex-row items-center gap-3 bg-surface-2 rounded-control px-2 py-1 border border-border">
              <Pressable
                role="button"
                accessibilityLabel="Giảm số lượng"
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                className="size-7 items-center justify-center rounded-pill bg-card active:opacity-70"
              >
                <Icon as={Minus} size={14} className="text-foreground" />
              </Pressable>
              <Text className="text-[15px] font-bold text-foreground w-6 text-center">
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
        </View>

        {/* Customer Delivery Info */}
        <View className="rounded-card border border-border bg-card p-4 gap-3">
          <Text className="text-[15px] font-semibold text-foreground">
            Thông tin nhận hàng
          </Text>

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
              Ghi chú cho chuyên viên (tuỳ chọn)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Thời gian nhận hàng hoặc lưu ý về tình trạng da..."
              placeholderTextColor="#888"
              className="h-10 rounded-control border border-border bg-surface-1 px-3 text-[13.5px] text-foreground"
            />
          </View>
        </View>

        {/* Payment Methods */}
        <View className="rounded-card border border-border bg-card p-4 gap-3">
          <Text className="text-[15px] font-semibold text-foreground">
            Phương thức thanh toán
          </Text>

          {/* COD */}
          <Pressable
            role="radio"
            accessibilityState={{ selected: paymentMethod === 'cod' }}
            onPress={() => setPaymentMethod('cod')}
            className={`flex-row items-center gap-3 rounded-control border p-3 ${
              paymentMethod === 'cod' ? 'border-primary bg-primary/10' : 'border-border bg-surface-1'
            }`}
          >
            <Icon
              as={CreditCard}
              size={20}
              className={paymentMethod === 'cod' ? 'text-primary' : 'text-muted-foreground'}
            />
            <View className="flex-1">
              <Text className="text-[14px] font-medium text-foreground">
                Thanh toán khi nhận hàng (COD)
              </Text>
              <Text className="text-[12px] text-muted-foreground">
                Kiểm tra hàng chính hãng trước khi thanh toán cho shipper
              </Text>
            </View>
            <View
              className={`size-5 rounded-pill border items-center justify-center ${
                paymentMethod === 'cod' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}
            >
              {paymentMethod === 'cod' && <View className="size-2 rounded-pill bg-white" />}
            </View>
          </Pressable>

          {/* VietQR */}
          <Pressable
            role="radio"
            accessibilityState={{ selected: paymentMethod === 'vietqr' }}
            onPress={() => setPaymentMethod('vietqr')}
            className={`flex-row items-center gap-3 rounded-control border p-3 ${
              paymentMethod === 'vietqr' ? 'border-primary bg-primary/10' : 'border-border bg-surface-1'
            }`}
          >
            <Icon
              as={QrCode}
              size={20}
              className={paymentMethod === 'vietqr' ? 'text-primary' : 'text-muted-foreground'}
            />
            <View className="flex-1">
              <Text className="text-[14px] font-medium text-foreground">
                Chuyển khoản VietQR 24/7 (Khuyên dùng)
              </Text>
              <Text className="text-[12px] text-muted-foreground">
                Quét mã QR thanh toán nhanh qua app ngân hàng MB / VCB
              </Text>
            </View>
            <View
              className={`size-5 rounded-pill border items-center justify-center ${
                paymentMethod === 'vietqr' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}
            >
              {paymentMethod === 'vietqr' && <View className="size-2 rounded-pill bg-white" />}
            </View>
          </Pressable>

          {/* VietQR Preview */}
          {paymentMethod === 'vietqr' && (
            <View className="items-center rounded-control border border-border bg-surface-1 p-3.5 gap-2 mt-1">
              <Text className="text-[12px] font-medium text-muted-foreground">
                Quét mã QR bằng App Ngân Hàng để chuyển khoản:
              </Text>
              <Image
                source={{ uri: qrUrl }}
                className="size-48 rounded-control bg-white"
                contentFit="contain"
              />
              <View className="items-center gap-0.5">
                <Text className="text-[13px] font-bold text-foreground">
                  STK: 999988886666 (MB Bank)
                </Text>
                <Text className="text-[12px] text-muted-foreground">
                  Chủ TK: SKINSENSE VIETNAM
                </Text>
                <Text className="text-[12px] font-medium text-primary">
                  Số tiền: {formatVnd(totalAmount)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View
        style={{ paddingBottom: Math.max(bottom, 24) }}
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/95 px-4 py-3 flex-row items-center justify-between gap-3"
      >
        <View>
          <Text className="text-[12px] text-muted-foreground">Tổng thanh toán</Text>
          <Text className="text-[18px] font-bold text-primary">{formatVnd(totalAmount)}</Text>
        </View>

        <Pressable
          role="button"
          accessibilityLabel="Xác nhận đặt hàng"
          disabled={submitting}
          onPress={handleConfirmOrder}
          className="flex-1 h-12 flex-row items-center justify-center gap-2 rounded-control bg-primary active:opacity-90"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
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

      {/* Order Success Dialog */}
      {placedOrder && (
        <Modal visible={true} transparent animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/60 p-5">
            <View className="w-full max-w-sm rounded-sheet border border-border bg-card p-6 items-center gap-3">
              <View className="size-16 rounded-pill bg-success/15 items-center justify-center">
                <Icon as={CheckCircle2} size={36} className="text-success" />
              </View>

              <Text className="text-[18px] font-bold text-foreground text-center">
                Đặt hàng thành công!
              </Text>
              <Text className="text-[13px] text-muted-foreground text-center">
                Đơn hàng đã được chuyển tới Ban Quản Trị SkinSense để đóng gói và vận chuyển sớm nhất.
              </Text>

              <View className="w-full rounded-control border border-border bg-surface-1 p-3 gap-1">
                <Text className="text-[12px] text-muted-foreground">Mã đơn hàng:</Text>
                <Text className="text-[14px] font-bold text-foreground">{placedOrder.id}</Text>
                <Text className="text-[12px] text-muted-foreground">Tổng thanh toán:</Text>
                <Text className="text-[15px] font-bold text-primary">
                  {placedOrder.totalFormatted} ({placedOrder.paymentMethod.toUpperCase()})
                </Text>
              </View>

              <View className="w-full gap-2 pt-2">
                <Pressable
                  role="button"
                  onPress={() => {
                    setPlacedOrder(null);
                    router.replace('/orders' as any);
                  }}
                  className="w-full h-11 items-center justify-center rounded-control bg-primary active:opacity-90"
                >
                  <Text className="text-[14px] font-semibold text-primary-foreground">
                    Xem đơn hàng của tôi
                  </Text>
                </Pressable>

                <Pressable
                  role="button"
                  onPress={() => {
                    setPlacedOrder(null);
                    router.back();
                  }}
                  className="w-full h-11 items-center justify-center rounded-control border border-border"
                >
                  <Text className="text-[14px] font-medium text-foreground">
                    Tiếp tục xem sản phẩm
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
