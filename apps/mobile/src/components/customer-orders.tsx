import {
  formatVnd,
  generateVietQrUrl,
  type Order,
  type OrderStatus,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Copy,
  Package,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Store,
  Truck,
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { loadOrders, updateOrderStatus } from '@/lib/marketplace';

const STATUS_FILTERS: { label: string; value: 'all' | OrderStatus }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Đang xử lý', value: 'confirmed' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã huỷ', value: 'cancelled' },
];

export function CustomerOrders() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | OrderStatus>('all');
  const [qrModalOrder, setQrModalOrder] = useState<Order | null>(null);
  const [copiedMemo, setCopiedMemo] = useState(false);

  async function fetchOrders() {
    setLoading(true);
    try {
      const data = await loadOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchOrders();
  }, []);

  const filteredOrders =
    selectedFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === selectedFilter);

  async function handleCancelOrder(orderId: string) {
    Alert.alert(
      'Xác nhận huỷ đơn',
      'Bạn có chắc chắn muốn huỷ đơn hàng này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Huỷ đơn',
          style: 'destructive',
          onPress: async () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            await updateOrderStatus(orderId, 'cancelled');
            await fetchOrders();
          },
        },
      ],
    );
  }

  function copyToClipboard(text: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  }

  function renderStatusBadge(status: OrderStatus) {
    switch (status) {
      case 'pending':
        return (
          <View className="flex-row items-center gap-1 rounded-pill bg-amber-500/10 px-2.5 py-1">
            <Icon as={Clock} size={12} className="text-amber-500" />
            <Text className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400">
              Chờ xác nhận
            </Text>
          </View>
        );
      case 'confirmed':
        return (
          <View className="flex-row items-center gap-1 rounded-pill bg-blue-500/10 px-2.5 py-1">
            <Icon as={Package} size={12} className="text-blue-500" />
            <Text className="text-[11.5px] font-medium text-blue-600 dark:text-blue-400">
              Đã xác nhận
            </Text>
          </View>
        );
      case 'shipping':
        return (
          <View className="flex-row items-center gap-1 rounded-pill bg-indigo-500/10 px-2.5 py-1">
            <Icon as={Truck} size={12} className="text-indigo-500" />
            <Text className="text-[11.5px] font-medium text-indigo-600 dark:text-indigo-400">
              Đang giao hàng
            </Text>
          </View>
        );
      case 'completed':
        return (
          <View className="flex-row items-center gap-1 rounded-pill bg-emerald-500/10 px-2.5 py-1">
            <Icon as={CheckCircle2} size={12} className="text-emerald-500" />
            <Text className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
              Đã hoàn thành
            </Text>
          </View>
        );
      case 'cancelled':
        return (
          <View className="flex-row items-center gap-1 rounded-pill bg-rose-500/10 px-2.5 py-1">
            <Icon as={XCircle} size={12} className="text-rose-500" />
            <Text className="text-[11.5px] font-medium text-rose-600 dark:text-rose-400">
              Đã huỷ
            </Text>
          </View>
        );
    }
  }

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
        <Text className="font-display text-[18px] font-medium">Đơn mua của tôi</Text>
        <Pressable
          role="button"
          accessibilityLabel="Làm mới"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            void fetchOrders();
          }}
          className="size-11 items-center justify-center rounded-pill active:bg-surface-2"
        >
          <Icon as={RefreshCw} size={18} className="text-muted-foreground" />
        </Pressable>
      </View>

      {/* Status Filter Scroll */}
      <View className="border-b border-border/30 bg-card/40">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-4 py-2.5"
        >
          {STATUS_FILTERS.map((filter) => {
            const active = selectedFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                role="button"
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  setSelectedFilter(filter.value);
                }}
                className={`rounded-pill px-3.5 py-1.5 border ${
                  active
                    ? 'border-primary bg-primary'
                    : 'border-border bg-card'
                }`}
              >
                <Text
                  className={`text-[12.5px] font-medium ${
                    active ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content List */}
      <ScrollView
        contentContainerClassName="gap-3.5 p-4"
        style={{ marginBottom: Math.max(bottom, 12) }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="small" color="#666" />
            <Text className="mt-2 text-[13px] text-muted-foreground">Đang tải danh sách đơn hàng...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View className="py-16 items-center justify-center rounded-card border border-border bg-card p-6">
            <Icon as={ShoppingBag} size={38} className="text-muted-foreground/60" />
            <Text className="mt-3 text-[15px] font-semibold">Chưa có đơn hàng nào</Text>
            <Text className="mt-1 text-center text-[12.5px] text-muted-foreground">
              {selectedFilter === 'all'
                ? 'Bạn chưa đặt mua sản phẩm nào trên SkinSense Market.'
                : `Không có đơn hàng nào ở trạng thái này.`}
            </Text>
            <Pressable
              role="button"
              onPress={() => router.push('/routine')}
              className="mt-4 flex-row items-center gap-1.5 rounded-control bg-primary px-5 py-2.5"
            >
              <Text className="text-[13.5px] font-medium text-primary-foreground">
                Xem Routine & Sản phẩm gợi ý
              </Text>
              <Icon as={ArrowRight} size={15} className="text-primary-foreground" />
            </Pressable>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const isVietQr = order.paymentMethod === 'vietqr';
            return (
              <View
                key={order.id}
                className="gap-3 rounded-card border border-border bg-card p-4 shadow-sm"
              >
                {/* Order Top Bar: Shop info & status */}
                <View className="flex-row items-center justify-between border-b border-border/40 pb-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <Icon as={Store} size={15} className="text-primary" />
                    <Text className="text-[13.5px] font-semibold">{order.shopName}</Text>
                  </View>
                  {renderStatusBadge(order.status)}
                </View>

                {/* Product info */}
                <View className="flex-row gap-3">
                  <View className="size-16 overflow-hidden rounded-control bg-surface-2">
                    <Image
                      source={{ uri: order.productImage }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1 justify-between">
                    <View>
                      <Text numberOfLines={2} className="text-[13.5px] font-medium leading-[18px]">
                        {order.productName}
                      </Text>
                      <Text className="mt-0.5 text-[11.5px] text-muted-foreground">
                        Mã đơn: {order.id}
                      </Text>
                    </View>
                    <View className="flex-row items-baseline justify-between">
                      <Text className="text-[12px] text-muted-foreground">
                        x{order.quantity}
                      </Text>
                      <Text className="text-[14.5px] font-bold text-foreground">
                        {order.totalFormatted}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Payment & Delivery Summary */}
                <View className="rounded-control bg-surface-1 p-2.5 gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11.5px] text-muted-foreground">Hình thức:</Text>
                    <Text className="text-[11.5px] font-medium text-foreground">
                      {isVietQr ? 'Chuyển khoản VietQR 24/7' : 'Thanh toán tiền mặt khi nhận (COD)'}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11.5px] text-muted-foreground">Người nhận:</Text>
                    <Text className="text-[11.5px] font-medium text-foreground">
                      {order.customerName} ({order.customerPhone})
                    </Text>
                  </View>
                  <View className="flex-row items-start justify-between">
                    <Text className="text-[11.5px] text-muted-foreground">Địa chỉ:</Text>
                    <Text numberOfLines={1} className="max-w-[70%] text-[11.5px] text-foreground">
                      {order.customerAddress}
                    </Text>
                  </View>
                </View>

                {/* Action buttons */}
                <View className="flex-row items-center justify-end gap-2 border-t border-border/40 pt-2.5">
                  {order.status === 'pending' && isVietQr && (
                    <Pressable
                      role="button"
                      onPress={() => setQrModalOrder(order)}
                      className="flex-row items-center gap-1 rounded-control border border-primary/30 bg-primary/10 px-3 py-1.5"
                    >
                      <Icon as={QrCode} size={13} className="text-primary" />
                      <Text className="text-[12px] font-semibold text-primary">Xem mã VietQR</Text>
                    </Pressable>
                  )}

                  {order.status === 'pending' && (
                    <Pressable
                      role="button"
                      onPress={() => handleCancelOrder(order.id)}
                      className="rounded-control border border-border bg-card px-3 py-1.5"
                    >
                      <Text className="text-[12px] font-medium text-rose-500">Huỷ đơn</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* VietQR View Modal */}
      {qrModalOrder && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setQrModalOrder(null)}
        >
          <View className="flex-1 items-center justify-center bg-black/60 p-5">
            <View className="w-full max-w-sm rounded-sheet border border-border bg-card p-5">
              <View className="flex-row items-center justify-between pb-3 border-b border-border">
                <Text className="text-[16px] font-semibold">Mã QR Thanh Toán</Text>
                <Pressable
                  role="button"
                  onPress={() => setQrModalOrder(null)}
                  className="size-8 items-center justify-center rounded-pill active:bg-surface-2"
                >
                  <Icon as={X} size={18} className="text-muted-foreground" />
                </Pressable>
              </View>

              <View className="items-center py-4">
                <View className="size-60 items-center justify-center rounded-card border border-border bg-white p-2">
                  <Image
                    source={{
                      uri: generateVietQrUrl({
                        amount: qrModalOrder.totalVnd,
                        memo: qrModalOrder.id,
                      }),
                    }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                </View>

                <View className="mt-3 w-full rounded-card border border-border bg-surface-1 p-3 gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[12px] text-muted-foreground">Ngân hàng:</Text>
                    <Text className="text-[12px] font-semibold">MB Bank (Quân Đội)</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[12px] text-muted-foreground">Số tài khoản:</Text>
                    <Text className="text-[12px] font-semibold font-mono">0358899889</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[12px] text-muted-foreground">Chủ tài khoản:</Text>
                    <Text className="text-[12px] font-semibold">SKINSENSE VIETNAM</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[12px] text-muted-foreground">Số tiền:</Text>
                    <Text className="text-[13px] font-bold text-primary">
                      {qrModalOrder.totalFormatted}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between pt-1 border-t border-border/50">
                    <Text className="text-[12px] text-muted-foreground">Nội dung CK:</Text>
                    <Pressable
                      role="button"
                      onPress={() => copyToClipboard(qrModalOrder.id)}
                      className="flex-row items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5"
                    >
                      <Text className="text-[12px] font-semibold text-primary font-mono">
                        {qrModalOrder.id}
                      </Text>
                      <Icon as={Copy} size={11} className="text-primary" />
                    </Pressable>
                  </View>
                </View>
                {copiedMemo && (
                  <Text className="mt-2 text-[11px] font-medium text-success">
                    Đã sao chép nội dung chuyển khoản!
                  </Text>
                )}
              </View>

              <Pressable
                role="button"
                onPress={() => setQrModalOrder(null)}
                className="h-11 items-center justify-center rounded-control bg-primary active:opacity-90"
              >
                <Text className="text-[14px] font-medium text-primary-foreground">Đóng</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
