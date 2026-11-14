import {
  formatVnd,
  type Order,
  type OrderStatus,
  type OrderTrackingEvent,
} from '@skinsense/domain';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Star,
  Store,
  Truck,
  X,
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
import {
  cancelOrder,
  completeOrder,
  loadOrders,
  onMarketplaceChange,
} from '@/lib/marketplace';

export type BuyerTab = 'all' | 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';

const BUYER_TABS: { id: BuyerTab; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'processing', label: 'Chờ lấy hàng' },
  { id: 'shipping', label: 'Đang giao' },
  { id: 'completed', label: 'Đã giao' },
  { id: 'cancelled', label: 'Đã hủy' },
];

export function BuyerOrdersModal({
  visible,
  onClose,
  initialTab = 'all',
}: {
  visible: boolean;
  onClose: () => void;
  initialTab?: BuyerTab;
}) {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<BuyerTab>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Rating Modal State
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [reviewText, setReviewText] = useState('Sản phẩm chính hãng đóng gói kỹ, dùng rất êm da!');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Sync orders
  const refresh = async () => {
    const list = await loadOrders();
    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      void refresh();
    }
  }, [visible]);

  useEffect(() => {
    const unsubscribe = onMarketplaceChange(() => {
      void refresh();
    });
    return unsubscribe;
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'shipping') {
      return orders.filter((o) => o.status === 'shipping' || o.status === 'delivered');
    }
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const handleCancel = (order: Order) => {
    Alert.alert(
      'Hủy đơn hàng',
      `Bạn có chắc chắn muốn hủy đơn hàng ${order.id} từ gian hàng "${order.shopName}"?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await cancelOrder(order.id, 'Người mua thay đổi nhu cầu');
            void refresh();
          },
        },
      ],
    );
  };

  const handleOpenRating = (order: Order) => {
    setRatingOrder(order);
    setSelectedStars(5);
    setReviewText('Sản phẩm chính hãng đóng gói kỹ, dùng rất êm da!');
  };

  const handleSubmitRating = async () => {
    if (!ratingOrder) return;
    setSubmittingRating(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await completeOrder(ratingOrder.id, selectedStars, reviewText);
    setSubmittingRating(false);
    setRatingOrder(null);
    void refresh();
    Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá! Tiền đã được giải ngân cho Shop.');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Chờ Shop xác nhận',
          bg: 'bg-amber-500/10 dark:bg-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500/30',
        };
      case 'processing':
      case 'confirmed':
        return {
          label: 'Shop đang chuẩn bị hàng',
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-500/30',
        };
      case 'shipping':
        return {
          label: 'Đang vận chuyển (SPX)',
          bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
          text: 'text-indigo-600 dark:text-indigo-400',
          border: 'border-indigo-500/30',
        };
      case 'delivered':
        return {
          label: 'Đã giao đến nơi',
          bg: 'bg-teal-500/10 dark:bg-teal-500/20',
          text: 'text-teal-600 dark:text-teal-400',
          border: 'border-teal-500/30',
        };
      case 'completed':
        return {
          label: 'Đã nhận hàng thành công',
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/30',
        };
      case 'cancelled':
        return {
          label: 'Đã hủy đơn',
          bg: 'bg-rose-500/10 dark:bg-rose-500/20',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500/30',
        };
      default:
        return {
          label: status,
          bg: 'bg-surface-2',
          text: 'text-muted-foreground',
          border: 'border-border',
        };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: Math.max(top, 10), paddingBottom: bottom }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Pressable
            role="button"
            accessibilityLabel="Đóng"
            onPress={onClose}
            className="size-9 items-center justify-center rounded-pill active:bg-surface-2"
          >
            <Icon as={ChevronLeft} size={22} className="text-foreground" />
          </Pressable>
          <View className="items-center">
            <Text className="text-[17px] font-semibold text-foreground">
              Đơn Mua Của Tôi
            </Text>
            <Text className="text-[11.5px] text-muted-foreground">
              Theo dõi & quản lý đơn hàng chuẩn Shopee
            </Text>
          </View>
          <View className="size-9 items-center justify-center">
            <Icon as={Package} size={18} className="text-primary" />
          </View>
        </View>

        {/* Tab Bar */}
        <View className="border-b border-border bg-card">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
          >
            {BUYER_TABS.map((tab) => {
              const active = activeTab === tab.id;
              const count =
                tab.id === 'all'
                  ? orders.length
                  : tab.id === 'shipping'
                    ? orders.filter((o) => o.status === 'shipping' || o.status === 'delivered').length
                    : orders.filter((o) => o.status === tab.id).length;

              return (
                <Pressable
                  key={tab.id}
                  role="tab"
                  accessibilityLabel={tab.label}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab.id);
                  }}
                  className={`flex-row items-center gap-1.5 rounded-pill px-3.5 py-1.5 border ${
                    active
                      ? 'bg-primary border-primary'
                      : 'bg-surface-2 border-border/60'
                  }`}
                >
                  <Text
                    className={`text-[12.5px] font-medium ${
                      active ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View
                      className={`rounded-pill px-1.5 py-0.5 ${
                        active ? 'bg-primary-foreground/20' : 'bg-surface-3'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          active ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Orders List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4ade80" />
          </View>
        ) : filteredOrders.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8 gap-3">
            <View className="size-16 rounded-full bg-surface-2 items-center justify-center">
              <Icon as={Package} size={32} className="text-muted-foreground" />
            </View>
            <Text className="text-[16px] font-semibold text-foreground text-center">
              Chưa có đơn hàng nào
            </Text>
            <Text className="text-[13px] text-muted-foreground text-center max-w-[260px]">
              Các đơn hàng bạn đặt từ các shop sẽ hiển thị trạng thái và mã vận đơn tại đây.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 40 }}
          >
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              const isPending = order.status === 'pending';
              const isProcessing = order.status === 'processing' || order.status === 'confirmed';
              const isShipping = order.status === 'shipping' || order.status === 'delivered';
              const isCompleted = order.status === 'completed';

              return (
                <View
                  key={order.id}
                  className="rounded-card border border-border bg-card p-4 gap-3 shadow-sm"
                >
                  {/* Shop Info & Status Header */}
                  <View className="flex-row items-center justify-between pb-2 border-b border-border/50">
                    <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                      <Icon as={Store} size={15} className="text-primary shrink-0" />
                      <Text
                        numberOfLines={1}
                        className="text-[13.5px] font-semibold text-foreground"
                      >
                        {order.shopName}
                      </Text>
                      <View className="rounded bg-primary/15 px-1.5 py-0.5 border border-primary/25">
                        <Text className="text-[9px] font-bold text-primary uppercase tracking-wider">
                          MALL
                        </Text>
                      </View>
                    </View>
                    <View className={`rounded-pill px-2.5 py-1 border ${badge.bg} ${badge.border}`}>
                      <Text className={`text-[11px] font-medium ${badge.text}`}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* Product Details Row */}
                  <View className="flex-row gap-3">
                    <Image
                      source={{ uri: order.productImage }}
                      className="size-16 rounded-control bg-surface-2 border border-border"
                      contentFit="cover"
                    />
                    <View className="flex-1 justify-center gap-1">
                      <Text
                        numberOfLines={2}
                        className="text-[13.5px] font-medium text-foreground leading-[18px]"
                      >
                        {order.productName}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[12px] text-muted-foreground">
                          Số lượng: x{order.quantity}
                        </Text>
                        <Text className="text-[13.5px] font-bold text-primary">
                          {formatVnd(order.priceVnd)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Order Total & Tracking Info */}
                  <View className="rounded-control bg-surface-1 p-2.5 gap-1.5 border border-border/40">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[11.5px] text-muted-foreground">
                        Mã đơn: <Text className="font-mono font-medium text-foreground">{order.id}</Text>
                      </Text>
                      <Text className="text-[11.5px] text-muted-foreground">
                        PTTT: <Text className="font-semibold text-foreground">{order.paymentMethod === 'vietqr' ? 'VietQR' : 'COD'}</Text>
                      </Text>
                    </View>

                    {order.trackingCode && (
                      <View className="flex-row items-center justify-between pt-1 border-t border-border/30">
                        <View className="flex-row items-center gap-1">
                          <Icon as={Truck} size={13} className="text-indigo-500" />
                          <Text className="text-[11.5px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {order.trackingCode}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-muted-foreground">
                          SPX Express
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center justify-between pt-1">
                      <Text className="text-[12.5px] font-medium text-muted-foreground">
                        Tổng thanh toán:
                      </Text>
                      <Text className="text-[15px] font-bold text-primary">
                        {order.totalFormatted}
                      </Text>
                    </View>
                  </View>

                  {/* Customer Review if completed */}
                  {order.rating && (
                    <View className="rounded-control bg-amber-500/10 p-2.5 border border-amber-500/20 gap-1">
                      <View className="flex-row items-center gap-1">
                        <View className="flex-row">
                          {Array.from({ length: order.rating }).map((_, i) => (
                            <Icon key={i} as={Star} size={12} className="text-amber-500 fill-amber-500" />
                          ))}
                        </View>
                        <Text className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                          Đánh giá của bạn:
                        </Text>
                      </View>
                      {order.reviewComment && (
                        <Text className="text-[12px] italic text-amber-800 dark:text-amber-200">
                          {`"${order.reviewComment}"`}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Actions Footer */}
                  <View className="flex-row items-center justify-end gap-2 pt-1 border-t border-border/50">
                    {/* Pending Actions */}
                    {isPending && (
                      <Pressable
                        role="button"
                        accessibilityLabel="Hủy đơn hàng"
                        onPress={() => handleCancel(order)}
                        className="rounded-control border border-rose-500/40 bg-rose-500/10 px-3.5 py-1.5 active:opacity-80"
                      >
                        <Text className="text-[12.5px] font-medium text-rose-600 dark:text-rose-400">
                          Hủy đơn hàng
                        </Text>
                      </Pressable>
                    )}

                    {/* Processing Actions */}
                    {isProcessing && (
                      <View className="flex-row items-center gap-1.5 px-2 py-1">
                        <Icon as={Clock} size={13} className="text-blue-500" />
                        <Text className="text-[11.5px] text-muted-foreground">
                          Shop đang chuẩn bị hàng & đóng gói
                        </Text>
                      </View>
                    )}

                    {/* Shipping Actions */}
                    {isShipping && (
                      <>
                        <Pressable
                          role="button"
                          accessibilityLabel="Xem hành trình vận đơn"
                          onPress={() => setTrackingOrder(order)}
                          className="flex-row items-center gap-1.5 rounded-control border border-border bg-surface-2 px-3 py-1.5 active:bg-surface-3"
                        >
                          <Icon as={Truck} size={14} className="text-foreground" />
                          <Text className="text-[12px] font-medium text-foreground">
                            Theo dõi SPX
                          </Text>
                        </Pressable>

                        <Pressable
                          role="button"
                          accessibilityLabel="Đã nhận được hàng"
                          onPress={() => handleOpenRating(order)}
                          className="flex-row items-center gap-1.5 rounded-control bg-primary px-3.5 py-1.5 active:opacity-90"
                        >
                          <Icon as={CheckCircle2} size={14} className="text-primary-foreground" />
                          <Text className="text-[12px] font-semibold text-primary-foreground">
                            Đã nhận hàng
                          </Text>
                        </Pressable>
                      </>
                    )}

                    {/* Completed Actions */}
                    {isCompleted && (
                      <>
                        <Pressable
                          role="button"
                          accessibilityLabel="Xem hành trình"
                          onPress={() => setTrackingOrder(order)}
                          className="rounded-control border border-border bg-surface-2 px-3 py-1.5 active:bg-surface-3"
                        >
                          <Text className="text-[12px] font-medium text-foreground">
                            Chi tiết vận đơn
                          </Text>
                        </Pressable>

                        <Pressable
                          role="button"
                          accessibilityLabel="Đánh giá lại"
                          onPress={() => handleOpenRating(order)}
                          className="flex-row items-center gap-1 rounded-control border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 active:bg-amber-500/20"
                        >
                          <Icon as={Star} size={13} className="text-amber-500 fill-amber-500" />
                          <Text className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
                            {order.rating ? 'Sửa đánh giá' : 'Đánh giá'}
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SPX Express Live Tracking Timeline Overlay                    */}
        {/* ------------------------------------------------------------- */}
        {trackingOrder && (
          <View className="absolute inset-0 z-50 justify-end bg-black/60">
            <View
              className="rounded-t-3xl bg-background p-5 gap-4 max-h-[85%]"
              style={{ paddingBottom: Math.max(bottom, 20) }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-border">
                <View className="flex-row items-center gap-2">
                  <View className="size-8 rounded-full bg-indigo-500/10 items-center justify-center">
                    <Icon as={Truck} size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </View>
                  <View>
                    <Text className="text-[16px] font-semibold text-foreground">
                      Hành Trình Vận Đơn SPX
                    </Text>
                    <Text className="text-[11.5px] font-mono text-muted-foreground">
                      {trackingOrder.trackingCode} · SPX Express
                    </Text>
                  </View>
                </View>
                <Pressable
                  role="button"
                  accessibilityLabel="Đóng"
                  onPress={() => setTrackingOrder(null)}
                  className="size-8 items-center justify-center rounded-full bg-surface-2"
                >
                  <Icon as={X} size={18} className="text-foreground" />
                </Pressable>
              </View>

              {/* Shipping Destination */}
              <View className="rounded-control bg-surface-2 p-3 gap-1">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={MapPin} size={14} className="text-rose-500" />
                  <Text className="text-[12px] font-semibold text-foreground">
                    Địa chỉ nhận hàng:
                  </Text>
                </View>
                <Text className="text-[12.5px] font-medium text-foreground pl-5">
                  {trackingOrder.customerName} · {trackingOrder.customerPhone}
                </Text>
                <Text className="text-[11.5px] text-muted-foreground pl-5">
                  {trackingOrder.customerAddress}
                </Text>
              </View>

              {/* Tracking Steps Timeline */}
              <Text className="text-[13px] font-semibold text-foreground">
                Trạng thái di chuyển kiện hàng
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} className="max-h-[320px]">
                <View className="pl-2 gap-3.5">
                  {(trackingOrder.trackingTimeline ?? []).map((step, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    return (
                      <View key={idx} className="flex-row gap-3">
                        {/* Indicator Line & Dot */}
                        <View className="items-center">
                          <View
                            className={`size-4 rounded-full items-center justify-center ${
                              step.completed ? 'bg-primary' : 'bg-surface-3 border border-border'
                            }`}
                          >
                            {step.completed && (
                              <View className="size-1.5 rounded-full bg-primary-foreground" />
                            )}
                          </View>
                          {!isLast && (
                            <View
                              className={`w-0.5 flex-1 my-1 ${
                                step.completed ? 'bg-primary/50' : 'bg-border'
                              }`}
                            />
                          )}
                        </View>

                        {/* Content */}
                        <View className="flex-1 pb-2">
                          <View className="flex-row items-center justify-between">
                            <Text
                              className={`text-[13px] ${
                                step.completed
                                  ? 'font-semibold text-foreground'
                                  : 'font-normal text-muted-foreground'
                              }`}
                            >
                              {step.title}
                            </Text>
                            <Text className="text-[11px] font-mono text-muted-foreground">
                              {step.time}
                            </Text>
                          </View>
                          <Text className="text-[11.5px] text-muted-foreground mt-0.5">
                            {step.desc}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Close Button */}
              <Pressable
                role="button"
                onPress={() => setTrackingOrder(null)}
                className="rounded-control bg-primary py-2.5 items-center justify-center active:opacity-90"
              >
                <Text className="text-[14px] font-semibold text-primary-foreground">
                  Đã Hiểu
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Rating & Review Overlay (Khách bấm Đã Nhận Hàng)              */}
        {/* ------------------------------------------------------------- */}
        {ratingOrder && (
          <View className="absolute inset-0 z-50 justify-end bg-black/60">
            <View
              className="rounded-t-3xl bg-background p-5 gap-4"
              style={{ paddingBottom: Math.max(bottom, 20) }}
            >
              <View className="flex-row items-center justify-between pb-2 border-b border-border">
                <Text className="text-[17px] font-semibold text-foreground">
                  Xác Nhận & Đánh Giá Đơn Hàng
                </Text>
                <Pressable
                  role="button"
                  onPress={() => setRatingOrder(null)}
                  className="size-8 items-center justify-center rounded-full bg-surface-2"
                >
                  <Icon as={X} size={18} className="text-foreground" />
                </Pressable>
              </View>

              {/* Product Summary */}
              <View className="flex-row items-center gap-3 rounded-control bg-surface-2 p-3">
                <Image
                  source={{ uri: ratingOrder.productImage }}
                  className="size-12 rounded-control bg-surface-3"
                  contentFit="cover"
                />
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-[13px] font-semibold text-foreground">
                    {ratingOrder.productName}
                  </Text>
                  <Text className="text-[11.5px] text-muted-foreground">
                    Cung cấp bởi: {ratingOrder.shopName}
                  </Text>
                </View>
              </View>

              {/* Star Rating Select */}
              <View className="items-center py-2 gap-1.5">
                <Text className="text-[13px] font-medium text-foreground">
                  Chất lượng sản phẩm & Dịch vụ gian hàng
                </Text>
                <View className="flex-row gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      role="button"
                      accessibilityLabel={`${star} sao`}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedStars(star);
                      }}
                      className="p-1 active:scale-110"
                    >
                      <Icon
                        as={Star}
                        size={32}
                        className={
                          star <= selectedStars
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-border fill-transparent'
                        }
                      />
                    </Pressable>
                  ))}
                </View>
                <Text className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                  {selectedStars === 5
                    ? 'Tuyệt vời (5/5)'
                    : selectedStars === 4
                      ? 'Hài lòng (4/5)'
                      : selectedStars === 3
                        ? 'Bình thường (3/5)'
                        : 'Cần cải thiện'}
                </Text>
              </View>

              {/* Review Comment Input */}
              <View className="gap-1.5">
                <Text className="text-[12.5px] font-medium text-foreground">
                  Chia sẻ cảm nhận cho cộng đồng SkinSense:
                </Text>
                <TextInput
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="Hãy chia sẻ trải nghiệm về chất lượng sản phẩm..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  className="min-h-[80px] rounded-control border border-border bg-card p-3 text-[13px] text-foreground text-start"
                />
              </View>

              {/* Submit Action */}
              <Pressable
                role="button"
                accessibilityLabel="Gửi đánh giá và hoàn tất đơn hàng"
                disabled={submittingRating}
                onPress={handleSubmitRating}
                className="rounded-control bg-primary py-3 items-center justify-center active:opacity-90"
              >
                {submittingRating ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text className="text-[14px] font-semibold text-primary-foreground">
                    Xác Nhận Đã Nhận & Gửi Đánh Giá
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
