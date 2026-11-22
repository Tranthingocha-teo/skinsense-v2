import {
  detectActiveConflicts,
  extractProductActives,
  formatVnd,
  generateVietQrPayload,
  inferRoutineStepCategory,
  inferUsageSlot,
  ROUTINE_STEP_LABELS,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  Droplets,
  Eye,
  Layers,
  Leaf,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductImage, QrImage } from '@/components/artwork';
import { Icon } from '@/components/ui/icon';
import {
  AmbientBackdrop,
  BottomSheetFrame,
  MODERN_INPUT,
  MODERN_SUBCARD,
  ToastBanner,
} from '@/components/ui/portal-chrome';
import { Text } from '@/components/ui/text';
import {
  apiJson,
  fetchApprovedMarketplaceProducts,
  getAccessToken,
  loadLocalCustomRoutineProductIds,
  loadPersonalRoutineRemote,
  payOrderRemote,
  savePersonalRoutineRemote,
} from '@/lib/api';
import { createOrder } from '@/lib/marketplace';

interface UnifiedStoreProduct {
  id: string;
  name: string;
  brand: string;
  shopName: string;
  category: string;
  priceVnd: number;
  priceFormatted: string;
  imageUrl: string;
  keyActives: string[];
  howToUse: string;
  description: string;
  isDomainSeed: boolean;
}

const ALL_BRANDS = 'Tất cả';

const SKIN_NEEDS = [
  { id: 'all', label: 'Tất Cả' },
  { id: 'oily_acne', label: 'Da Dầu & Mụn' },
  { id: 'sensitive', label: 'Da Nhạy Cảm' },
  { id: 'dry', label: 'Da Khô & Ẩm' },
  { id: 'recovery', label: 'Phục Hồi B5' },
] as const;

export function ClinicalStorefront() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const [remoteProducts, setRemoteProducts] = useState<UnifiedStoreProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(ALL_BRANDS);
  const [selectedSkinNeed, setSelectedSkinNeed] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const [routineIds, setRoutineIds] = useState<string[]>([]);
  const [isRoutineOpen, setIsRoutineOpen] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const [detailProduct, setDetailProduct] = useState<UnifiedStoreProduct | null>(null);
  const [showBundleCheckout, setShowBundleCheckout] = useState(false);
  const [checkoutTargetProducts, setCheckoutTargetProducts] = useState<UnifiedStoreProduct[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'momo' | 'vietqr'>('cod');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);
  const [vietQrBundleOrder, setVietQrBundleOrder] = useState<{ code: string; totalAmount: number } | null>(null);
  const [payingQr, setPayingQr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchApprovedMarketplaceProducts()
      .then((list) => {
        if (cancelled) return;
        const mapped: UnifiedStoreProduct[] = list
          .map((ap) => ({
            id: ap.id,
            name: ap.name,
            brand: ap.brand || ap.shopName || 'SkinSense Partner',
            shopName: ap.shopName,
            category: ap.category || 'Dược mỹ phẩm',
            priceVnd: ap.price || 0,
            priceFormatted: formatVnd(ap.price || 0),
            imageUrl: ap.coverImage || ap.images?.[0] || '',
            keyActives: extractProductActives(undefined, ap.name),
            howToUse: 'Sử dụng theo hướng dẫn của dược sĩ / bác sĩ chuyên khoa.',
            description: ap.description || 'Sản phẩm chính hãng đã kiểm duyệt bởi Ban Quản Trị SkinSense.',
            isDomainSeed: false,
          }));
        setRemoteProducts(mapped);
      })
      .catch(() => {});

    Promise.all([loadPersonalRoutineRemote('evening'), loadLocalCustomRoutineProductIds()])
      .then(([remote, localIds]) => {
        if (cancelled) return;
        if (remote.ok && remote.data?.protocolProductIds && remote.data.protocolProductIds.length > 0) {
          setRoutineIds(remote.data.protocolProductIds);
        } else if (localIds.length > 0) {
          setRoutineIds(localIds);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Chỉ hiển thị sản phẩm thật đã được Admin duyệt trên hệ thống (không dùng danh mục mẫu).
  const allProducts = remoteProducts;

  const brands = useMemo(
    () => [ALL_BRANDS, ...Array.from(new Set(allProducts.map((p) => p.brand)))],
    [allProducts],
  );

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allProducts
      .filter((p) => {
        const matchSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.keyActives.some((a) => a.toLowerCase().includes(q));
        const matchBrand = selectedBrand === ALL_BRANDS || p.brand === selectedBrand;
        const lower = `${p.name} ${p.description} ${p.keyActives.join(' ')}`.toLowerCase();
        const matchNeed =
          selectedSkinNeed === 'all' ||
          (selectedSkinNeed === 'oily_acne' && /mụn|effaclar|bha|salicylic|niacinamide/.test(lower)) ||
          (selectedSkinNeed === 'sensitive' && /nhạy cảm|dịu|bioderma|ceramide/.test(lower)) ||
          (selectedSkinNeed === 'dry' && /ẩm|khô|hyaluronic|cerave/.test(lower)) ||
          (selectedSkinNeed === 'recovery' && /phục hồi|b5|panthenol|hyalu|cicaplast/.test(lower));
        return matchSearch && matchBrand && matchNeed;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.priceVnd - b.priceVnd;
        if (sortBy === 'price-desc') return b.priceVnd - a.priceVnd;
        return 0;
      });
  }, [allProducts, searchTerm, selectedBrand, selectedSkinNeed, sortBy]);

  const routineProducts = useMemo(
    () =>
      routineIds
        .map((id) => allProducts.find((p) => p.id === id))
        .filter((p): p is UnifiedStoreProduct => Boolean(p)),
    [routineIds, allProducts],
  );

  const routineConflicts = useMemo(
    () =>
      detectActiveConflicts(
        routineProducts.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          howToUse: p.howToUse,
          keyActives: p.keyActives,
        })),
      ),
    [routineProducts],
  );

  function toggleRoutine(prod: UnifiedStoreProduct) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSaveFeedback(null);
    setRoutineIds((prev) => {
      if (prev.includes(prod.id)) return prev.filter((id) => id !== prod.id);
      setIsRoutineOpen(true);
      return [...prev, prod.id];
    });
  }

  async function handleSaveRoutine() {
    if (savingRoutine) return;
    setSavingRoutine(true);
    setSaveFeedback(null);
    try {
      const payloadProducts = routineProducts.map((p, idx) => {
        const slot = inferUsageSlot(p);
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          imageUrl: p.imageUrl,
          activeIngredients: p.keyActives.join(', ') || 'Hoạt chất chuẩn y khoa',
          stepTime: (slot === 'AM' ? 'morning' : slot === 'PM' ? 'evening' : 'both') as
            | 'morning'
            | 'evening'
            | 'both',
          stepNumber: idx + 1,
          dosage: '1 lượng vừa đủ',
          usageGuide: p.howToUse,
        };
      });

      const res = await savePersonalRoutineRemote({
        routineTitle: 'Routine Cá Nhân (Mobile)',
        products: payloadProducts,
      });

      if (res.ok) {
        setSaveFeedback(res.data?.message || 'Đã lưu Routine vào tài khoản Supabase.');
      } else if (res.status === 401) {
        setSaveFeedback('Đã lưu tạm trên máy. Đăng nhập Google để đồng bộ đa thiết bị.');
      } else {
        setSaveFeedback('Đã lưu Routine trên thiết bị (chế độ ngoại tuyến).');
      }
    } finally {
      setSavingRoutine(false);
    }
  }

  function openCheckoutForProducts(itemsToBuy: UnifiedStoreProduct[]) {
    setCheckoutTargetProducts(itemsToBuy);
    setIsRoutineOpen(false);
    setShowBundleCheckout(true);
  }

  async function handlePlaceBundleOrder() {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setOrderNotice('Vui lòng nhập đầy đủ tên, số điện thoại và địa chỉ nhận hàng.');
      return;
    }
    setPlacingOrder(true);
    setOrderNotice(null);
    try {
      const totalAmount = checkoutTargetProducts.reduce((sum, p) => sum + p.priceVnd, 0);
      const orderCode = `SS-${Math.floor(100000 + Math.random() * 900000)}`;
      const token = await getAccessToken().catch(() => null);
      if (token) {
        const res = await apiJson<{ ok?: boolean; error?: string }>('/api/orders', {
          method: 'POST',
          body: JSON.stringify({
            orderCode,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            shippingAddress: customerAddress.trim(),
            totalAmount,
            paymentMethod,
            shopName: checkoutTargetProducts[0]?.shopName || 'SkinSense Official',
            items: checkoutTargetProducts.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.priceVnd,
              priceVnd: p.priceVnd,
              quantity: 1,
              image: p.imageUrl,
            })),
          }),
        });
        if (!res.ok) {
          setOrderNotice(
            res.status === 401
              ? 'Vui lòng đăng nhập để đặt hàng trên hệ thống.'
              : res.data?.error || 'Không thể lưu đơn hàng lên máy chủ. Vui lòng thử lại.',
          );
          return;
        }
      }

      for (const item of checkoutTargetProducts) {
        await createOrder({
          productId: item.id,
          productName: item.name,
          productImage: item.imageUrl,
          shopName: item.shopName,
          priceVnd: item.priceVnd,
          quantity: 1,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          paymentMethod: paymentMethod === 'vietqr' ? 'vietqr' : 'cod',
        });
      }

      setShowBundleCheckout(false);
      if (paymentMethod === 'vietqr') {
        setVietQrBundleOrder({ code: orderCode, totalAmount });
      }
      setOrderNotice(`Đã đặt thành công ${checkoutTargetProducts.length} sản phẩm (${formatVnd(totalAmount)}).`);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } finally {
      setPlacingOrder(false);
    }
  }

  function renderNeedIcon(id: string, active: boolean) {
    const colorClass = active ? 'text-primary-foreground' : 'text-primary';
    switch (id) {
      case 'oily_acne':
        return <Icon as={Leaf} size={13} className={colorClass} />;
      case 'sensitive':
        return <Icon as={Droplets} size={13} className={colorClass} />;
      case 'dry':
        return <Icon as={Sun} size={13} className={colorClass} />;
      case 'recovery':
        return <Icon as={ShieldCheck} size={13} className={colorClass} />;
      default:
        return <Icon as={Sparkles} size={13} className={colorClass} />;
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* Sticky Top Header */}
      <View
        style={{ paddingTop: Math.max(top, 12) + 2 }}
        className="flex-row items-center justify-between border-b border-border/80 bg-card/95 px-3.5 pb-3.5"
      >
        <View className="flex-row items-center gap-2 flex-1">
          <Pressable
            role="button"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            className="size-10 items-center justify-center rounded-[12px] border border-border/70 bg-surface-2 active:scale-[0.96]"
          >
            <Icon as={ChevronLeft} size={20} strokeWidth={1.6} className="text-foreground" />
          </Pressable>
          <View className="flex-1">
            <Text className="font-display text-[20px] font-normal text-foreground leading-[24px]">
              SkinSense Clinical
            </Text>
            <Text className="text-[11px] text-muted-foreground">Dược mỹ phẩm chính hãng 100%</Text>
          </View>
        </View>

        <Pressable
          role="button"
          accessibilityLabel="Mở Routine Builder"
          onPress={() => setIsRoutineOpen(true)}
          className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:scale-[0.97] ${
            routineProducts.length > 0
              ? 'border-primary bg-primary'
              : 'border-border/80 bg-surface-2'
          }`}
        >
          <Icon
            as={Layers}
            size={14}
            className={routineProducts.length > 0 ? 'text-primary-foreground' : 'text-foreground'}
          />
          <Text
            className={`text-[12px] font-bold ${
              routineProducts.length > 0 ? 'text-primary-foreground' : 'text-foreground'
            }`}
          >
            Routine ({routineProducts.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-24 pt-4" showsVerticalScrollIndicator={false}>
        {orderNotice && <ToastBanner message={orderNotice} icon={CheckCircle2} tone="success" />}

        {/* Editorial Clinical Apothecary Hero */}
        <View className="relative overflow-hidden rounded-[22px] border border-border/80 bg-card p-4.5 gap-3">
          <AmbientBackdrop height={190} tone="botanical" />
          <View className="self-start flex-row items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-3 py-1">
            <Icon as={Sparkles} size={12} className="text-emerald-500" />
            <Text className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-emerald-500">
              Clinical Apothecary
            </Text>
          </View>
          <Text role="heading" aria-level="1" className="font-display text-[26px] font-normal leading-[32px] text-foreground">
            Sàn Dược Mỹ Phẩm Chuẩn Y Khoa
          </Text>
          <Text className="text-[13px] font-light leading-[20px] text-muted-foreground">
            Minh bạch nồng độ hoạt chất, gắn nhãn Sáng/Tối (AM/PM) và tự động kiểm tra xung đột khi ghép chu trình.
          </Text>
          <View className="flex-row gap-2.5 pt-1">
            <View className="flex-1 rounded-[15px] border border-border/80 bg-surface-2/90 px-3.5 py-2.5">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Công bố BYT</Text>
              <Text className="text-[12.5px] font-semibold text-foreground mt-0.5">Chính hãng VAT</Text>
            </View>
            <Pressable
              role="button"
              onPress={() => setIsRoutineOpen(true)}
              className="flex-1 rounded-[15px] border border-primary/35 bg-primary/12 px-3.5 py-2.5 active:scale-[0.98]"
            >
              <Text className="text-[10px] font-bold uppercase tracking-wider text-primary">Routine Builder</Text>
              <Text className="text-[12.5px] font-bold text-foreground mt-0.5">
                Kiểm tra ({routineProducts.length}) →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Search & Filters */}
        <View className="gap-2.5">
          <View className="flex-row items-center rounded-[14px] border border-border/90 bg-card px-3.5 h-12">
            <Icon as={Search} size={16} className="text-muted-foreground mr-2.5" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Tìm sản phẩm, hãng, hoạt chất (B5, BHA...)"
              placeholderTextColor="#8C8F8A"
              className="flex-1 text-[13.5px] text-foreground"
            />
            {searchTerm.length > 0 && (
              <Pressable onPress={() => setSearchTerm('')} className="p-1">
                <Icon as={X} size={15} className="text-muted-foreground" />
              </Pressable>
            )}
          </View>

          {/* Brands */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {brands.map((brand) => {
              const active = selectedBrand === brand;
              return (
                <Pressable
                  key={brand}
                  role="button"
                  onPress={() => setSelectedBrand(brand)}
                  className={`rounded-full border px-3.5 py-2 active:scale-[0.98] ${
                    active ? 'border-primary bg-primary' : 'border-border/80 bg-card'
                  }`}
                >
                  <Text className={`text-[12px] font-semibold ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {brand}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Skin Concerns + Sort */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {SKIN_NEEDS.map((need) => {
              const active = selectedSkinNeed === need.id;
              return (
                <Pressable
                  key={need.id}
                  role="button"
                  onPress={() => setSelectedSkinNeed(need.id)}
                  className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:scale-[0.98] ${
                    active ? 'border-foreground bg-foreground' : 'border-border/80 bg-card'
                  }`}
                >
                  {renderNeedIcon(need.id, active)}
                  <Text className={`text-[12px] font-medium ${active ? 'text-background' : 'text-foreground'}`}>
                    {need.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="flex-row items-center justify-between pt-1">
            <Text className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Danh sách sản phẩm ({filteredProducts.length})
            </Text>
            <Pressable
              role="button"
              onPress={() =>
                setSortBy((prev) =>
                  prev === 'default' ? 'price-asc' : prev === 'price-asc' ? 'price-desc' : 'default',
                )
              }
              className="rounded-full border border-border/80 bg-card px-3.5 py-1.5 active:scale-[0.98]"
            >
              <Text className="text-[11.5px] font-semibold text-foreground">
                {sortBy === 'default'
                  ? 'Sắp xếp: Mặc định'
                  : sortBy === 'price-asc'
                  ? 'Giá: Thấp → Cao'
                  : 'Giá: Cao → Thấp'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Product List Grid (2 columns responsive stack) */}
        <View className="flex-row flex-wrap gap-3">
          {filteredProducts.map((prod) => {
            const actives = extractProductActives(prod.keyActives, prod.name).slice(0, 2);
            const slot = inferUsageSlot(prod);
            const stepLabel = ROUTINE_STEP_LABELS[inferRoutineStepCategory(prod)];
            const inRoutine = routineIds.includes(prod.id);

            return (
              <View
                key={prod.id}
                className="w-[48%] flex-grow rounded-[18px] border border-border/80 bg-card p-3 justify-between gap-2.5"
              >
                <View>
                  <Pressable
                    onPress={() =>
                      setDetailProduct(prod)
                    }
                    className="relative aspect-square w-full overflow-hidden rounded-[13px] bg-surface-2 mb-2.5"
                  >
                    <ProductImage
                      uri={prod.imageUrl}
                      name={prod.name}
                      brand={prod.brand}
                      category={prod.category}
                      seed={prod.id}
                      style={{ width: '100%', height: '100%' }}
                    />
                    <View className="absolute right-1.5 top-1.5 flex-row items-center gap-0.5 rounded-full bg-card/95 border border-border/80 px-2 py-0.5">
                      <Icon as={slot === 'PM' ? Moon : Sun} size={10} className="text-primary" />
                      <Text className="text-[9.5px] font-bold text-foreground">{slot}</Text>
                    </View>
                  </Pressable>

                  <View className="flex-row items-center justify-between gap-1">
                    <View className="flex-1 flex-row items-center gap-1">
                      <Icon as={BadgeCheck} size={11} className="text-emerald-500" />
                      <Text numberOfLines={1} className="text-[10px] font-bold uppercase text-emerald-500 flex-1">
                        {prod.brand}
                      </Text>
                    </View>
                    <Text className="text-[9.5px] text-muted-foreground">{stepLabel}</Text>
                  </View>

                  <Text numberOfLines={2} className="mt-1 text-[12.5px] font-semibold leading-[17px] text-foreground min-h-[34px]">
                    {prod.name}
                  </Text>

                  {actives.length > 0 && (
                    <View className="mt-1.5 flex-row flex-wrap gap-1">
                      {actives.map((act) => (
                        <View key={act} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5">
                          <Text numberOfLines={1} className="text-[9.5px] font-medium text-emerald-500">
                            {act}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View className="gap-2 pt-2 border-t border-border/60">
                  <View className="flex-row items-center justify-between gap-1">
                    <Text className="text-[13.5px] font-bold text-foreground">{prod.priceFormatted}</Text>
                    <Pressable
                      role="button"
                      accessibilityLabel={`${inRoutine ? '✓ Routine' : '+ Routine'} ${prod.name}`}
                      onPress={() => toggleRoutine(prod)}
                      className={`rounded-full border px-2.5 py-0.5 active:scale-[0.96] ${
                        inRoutine ? 'border-emerald-600 bg-emerald-600' : 'border-border/80 bg-surface-2'
                      }`}
                    >
                      <Text className={`text-[10px] font-bold ${inRoutine ? 'text-white' : 'text-foreground'}`}>
                        {inRoutine ? '✓ Routine' : '+ Routine'}
                      </Text>
                    </Pressable>
                  </View>

                  <View className="flex-row gap-1.5">
                    <Pressable
                      role="button"
                      onPress={() =>
                        setDetailProduct(prod)
                      }
                      className="flex-1 h-8.5 flex-row items-center justify-center gap-1 rounded-[11px] border border-border/80 bg-surface-2 active:scale-[0.97]"
                    >
                      <Icon as={Eye} size={12} className="text-foreground" />
                      <Text className="text-[11px] font-semibold text-foreground">Chi tiết</Text>
                    </Pressable>
                    <Pressable
                      role="button"
                      onPress={() => openCheckoutForProducts([prod])}
                      className="flex-1 h-8.5 flex-row items-center justify-center gap-1 rounded-[11px] bg-primary active:scale-[0.97]"
                    >
                      <Icon as={ShoppingBag} size={12} className="text-primary-foreground" />
                      <Text className="text-[11px] font-bold text-primary-foreground">Mua ngay</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ROUTINE BUILDER & CONFLICT CHECKER MODAL */}
      <Modal visible={isRoutineOpen} animationType="slide" transparent>
        <BottomSheetFrame bottomInset={bottom} maxHeightClass="max-h-[88%]">
          <View className="gap-4">
            <View className="flex-row items-center justify-between border-b border-border/70 pb-3">
              <View className="flex-1 pr-2">
                <Text className="font-display text-[21px] font-normal text-foreground">
                  Xây dựng Routine & Kiểm tra hoạt chất
                </Text>
                <Text className="text-[12px] text-muted-foreground mt-0.5">
                  Làm sạch → Đặc trị → Dưỡng ẩm → Chống nắng
                </Text>
              </View>
              <Pressable
                onPress={() => setIsRoutineOpen(false)}
                className="size-8 items-center justify-center rounded-full bg-surface-2"
              >
                <Icon as={X} size={18} className="text-muted-foreground" />
              </Pressable>
            </View>

            <ScrollView className="max-h-[360px]" contentContainerClassName="gap-3" showsVerticalScrollIndicator={false}>
              {routineProducts.length === 0 ? (
                <View className={`${MODERN_SUBCARD} border-dashed p-6 items-center`}>
                  <Text className="text-[13px] text-center text-muted-foreground leading-5">
                    Chưa có sản phẩm nào. Nhấn &ldquo;+ Routine&rdquo; trên sản phẩm để ghép chu trình và kiểm tra tương tác.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {routineConflicts.length > 0 ? (
                    routineConflicts.map((warn) => (
                      <View
                        key={warn.id}
                        className="flex-row items-start gap-2.5 rounded-[16px] border border-amber-500/35 bg-amber-500/10 p-3.5"
                      >
                        <Icon as={AlertTriangle} size={17} className="text-amber-500 mt-0.5" />
                        <View className="flex-1 gap-0.5">
                          <Text className="text-[12.5px] font-bold text-foreground">{warn.title}</Text>
                          <Text className="text-[11.5px] text-muted-foreground leading-[17px]">{warn.advice}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="flex-row items-center gap-2 rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                      <Icon as={CheckCircle2} size={16} className="text-emerald-500" />
                      <Text className="flex-1 text-[12px] font-semibold text-emerald-500">
                        Các hoạt chất trong chu trình tương thích an toàn, chưa phát hiện xung đột.
                      </Text>
                    </View>
                  )}

                  {routineProducts.map((rp) => {
                    const slot = inferUsageSlot(rp);
                    const stepLabel = ROUTINE_STEP_LABELS[inferRoutineStepCategory(rp)];
                    return (
                      <View
                        key={rp.id}
                        className={`flex-row items-center gap-3 ${MODERN_SUBCARD} p-3`}
                      >
                        <View className="size-12 overflow-hidden rounded-[12px] bg-card">
                          <ProductImage
                            uri={rp.imageUrl}
                            name={rp.name}
                            brand={rp.brand}
                            category={rp.category}
                            seed={rp.id}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </View>
                        <View className="flex-1 gap-0.5">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-[10px] font-bold uppercase text-emerald-500">{stepLabel}</Text>
                            <View className="rounded-full bg-card px-2 py-0.5 border border-border/80">
                              <Text className="text-[9.5px] font-bold">{slot}</Text>
                            </View>
                          </View>
                          <Text numberOfLines={2} className="text-[13px] font-semibold text-foreground">
                            {rp.name}
                          </Text>
                        </View>
                        <Pressable onPress={() => toggleRoutine(rp)} className="p-1.5">
                          <Icon as={X} size={16} className="text-muted-foreground" />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {saveFeedback && (
              <Text className="text-[12px] font-semibold text-emerald-500 text-center">{saveFeedback}</Text>
            )}

            {routineProducts.length > 0 && (
              <View className="gap-2 pt-2 border-t border-border/70">
                <Pressable
                  role="button"
                  accessibilityLabel="Lưu vào Routine của tôi"
                  disabled={savingRoutine}
                  onPress={handleSaveRoutine}
                  className="h-12 flex-row items-center justify-center gap-2 rounded-[14px] bg-emerald-600 px-4 active:scale-[0.98]"
                >
                  {savingRoutine ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Icon as={CheckCircle2} size={16} className="text-white" />
                  )}
                  <Text className="text-[13.5px] font-bold text-white">
                    {savingRoutine ? 'Đang lưu...' : 'Lưu vào Routine của tôi'}
                  </Text>
                </Pressable>

                <Pressable
                  role="button"
                  onPress={() => openCheckoutForProducts(routineProducts)}
                  className="h-12 flex-row items-center justify-center gap-2 rounded-[14px] bg-primary px-4 active:scale-[0.98]"
                >
                  <Icon as={ShoppingBag} size={16} className="text-primary-foreground" />
                  <Text className="text-[13.5px] font-bold text-primary-foreground">
                    Đặt mua cả bộ ({routineProducts.length} SP)
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </BottomSheetFrame>
      </Modal>

      {/* DETAIL MODAL FOR DYNAMIC PARTNER SHOP PRODUCTS */}
      <Modal visible={detailProduct !== null} animationType="fade" transparent>
        <View className="flex-1 justify-center bg-black/65 p-5">
          {detailProduct && (
            <View className="rounded-[24px] border border-border/90 bg-card p-5 gap-3.5 max-h-[82%]">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={BadgeCheck} size={16} className="text-emerald-500" />
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                    {detailProduct.brand}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setDetailProduct(null)}
                  className="size-8 items-center justify-center rounded-full bg-surface-2"
                >
                  <Icon as={X} size={17} className="text-muted-foreground" />
                </Pressable>
              </View>

              <ScrollView contentContainerClassName="gap-2.5">
                <Text className="font-display text-[22px] font-normal text-foreground">{detailProduct.name}</Text>
                <Text className="font-display text-[22px] font-bold text-primary">
                  {detailProduct.priceFormatted}
                </Text>
                <Text className="text-[13px] text-muted-foreground leading-[19px]">
                  {detailProduct.description}
                </Text>
                {detailProduct.keyActives.length > 0 && (
                  <View className="flex-row flex-wrap gap-1.5 pt-1">
                    {detailProduct.keyActives.map((act) => (
                      <View key={act} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5">
                        <Text className="text-[11px] font-semibold text-emerald-500">{act}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View className="flex-row gap-2.5 pt-2 border-t border-border/70">
                <Pressable
                  onPress={() => {
                    toggleRoutine(detailProduct);
                    setDetailProduct(null);
                  }}
                  className="flex-1 h-12 items-center justify-center rounded-[13px] border border-border/80 bg-surface-2 active:scale-[0.98]"
                >
                  <Text className="text-[13px] font-semibold text-foreground">+ Routine</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const target = detailProduct;
                    setDetailProduct(null);
                    openCheckoutForProducts([target]);
                  }}
                  className="flex-1 h-12 items-center justify-center rounded-[13px] bg-primary active:scale-[0.98]"
                >
                  <Text className="text-[13px] font-bold text-primary-foreground">Mua ngay</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* MULTI-PRODUCT BUNDLE CHECKOUT MODAL */}
      <Modal visible={showBundleCheckout} animationType="slide" transparent>
        <BottomSheetFrame bottomInset={bottom} maxHeightClass="max-h-[88%]">
          <View className="gap-3.5">
            <View className="flex-row items-center justify-between border-b border-border/70 pb-2.5">
              <Text className="font-display text-[20px] font-normal text-foreground">
                Đặt mua ({checkoutTargetProducts.length} sản phẩm)
              </Text>
              <Pressable
                onPress={() => setShowBundleCheckout(false)}
                className="size-8 items-center justify-center rounded-full bg-surface-2"
              >
                <Icon as={X} size={18} className="text-muted-foreground" />
              </Pressable>
            </View>

            <ScrollView className="max-h-[360px]" contentContainerClassName="gap-3" keyboardShouldPersistTaps="handled">
              {checkoutTargetProducts.map((item) => (
                <View key={item.id} className="flex-row items-center justify-between border-b border-border/50 pb-2">
                  <Text numberOfLines={1} className="flex-1 pr-2 text-[13px] font-medium">
                    • {item.name}
                  </Text>
                  <Text className="text-[13px] font-bold text-foreground">{item.priceFormatted}</Text>
                </View>
              ))}

              <View className={`flex-row items-center justify-between ${MODERN_SUBCARD} px-3.5 py-3`}>
                <Text className="text-[13px] text-muted-foreground">Tổng thanh toán (Miễn phí ship):</Text>
                <Text className="font-display text-[21px] font-normal text-primary">
                  {formatVnd(checkoutTargetProducts.reduce((sum, p) => sum + p.priceVnd, 0))}
                </Text>
              </View>

              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Họ và tên người nhận"
                placeholderTextColor="#8C8F8A"
                className={MODERN_INPUT}
              />
              <TextInput
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Số điện thoại nhận hàng"
                keyboardType="phone-pad"
                placeholderTextColor="#8C8F8A"
                className={MODERN_INPUT}
              />
              <TextInput
                value={customerAddress}
                onChangeText={setCustomerAddress}
                placeholder="Địa chỉ giao hàng chi tiết"
                placeholderTextColor="#8C8F8A"
                className={MODERN_INPUT}
              />

              <View className="flex-row gap-2">
                {(['cod', 'vietqr', 'momo'] as const).map((method) => (
                  <Pressable
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    className={`flex-1 h-11 items-center justify-center rounded-[13px] border active:scale-[0.98] ${
                      paymentMethod === method ? 'border-primary bg-primary/15' : 'border-border/80 bg-surface-2'
                    }`}
                  >
                    <Text className="text-[12px] font-bold uppercase text-foreground">{method}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              role="button"
              disabled={placingOrder}
              onPress={handlePlaceBundleOrder}
              className="h-12 flex-row items-center justify-center gap-2 rounded-[14px] bg-primary active:scale-[0.98]"
            >
              <Icon as={Plus} size={17} className="text-primary-foreground" />
              <Text className="text-[14.5px] font-bold text-primary-foreground">
                {placingOrder ? 'Đang gửi đơn...' : 'Xác nhận đặt hàng'}
              </Text>
            </Pressable>
          </View>
        </BottomSheetFrame>
      </Modal>

      {/* Bundle VietQR Payment Modal */}
      <Modal
        visible={vietQrBundleOrder !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setVietQrBundleOrder(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/75 p-5">
          <View className="w-full max-w-sm gap-3 rounded-[24px] border border-border/90 bg-card p-5">
            <View className="flex-row items-center justify-between border-b border-border/70 pb-3">
              <Text className="text-[16px] font-semibold text-foreground">Thanh Toán VietQR</Text>
              <Pressable
                onPress={() => setVietQrBundleOrder(null)}
                className="size-8 items-center justify-center rounded-full bg-surface-2"
              >
                <Icon as={X} size={17} className="text-muted-foreground" />
              </Pressable>
            </View>
            {vietQrBundleOrder && (
              <View className="items-center gap-3 py-2">
                <View className="size-56 items-center justify-center rounded-[20px] border border-border bg-white p-2.5">
                  <QrImage
                    value={generateVietQrPayload({
                      amount: vietQrBundleOrder.totalAmount,
                      memo: vietQrBundleOrder.code,
                    })}
                    size={208}
                    label={`VietQR ${vietQrBundleOrder.code}`}
                  />
                </View>
                <Text className="text-[13px] font-medium text-foreground">
                  Mã đơn: <Text className="font-bold text-primary">{vietQrBundleOrder.code}</Text> ·{' '}
                  {formatVnd(vietQrBundleOrder.totalAmount)}
                </Text>
                <View className="w-full flex-row gap-2 pt-1">
                  <Pressable
                    role="button"
                    disabled={payingQr}
                    onPress={async () => {
                      if (!vietQrBundleOrder) return;
                      setPayingQr(true);
                      try {
                        const payRes = await payOrderRemote(vietQrBundleOrder.code).catch(() => null);
                        if (payRes?.ok && payRes.data?.ok) {
                          setOrderNotice(
                            `Đã thanh toán thành công đơn ${vietQrBundleOrder.code} (${formatVnd(vietQrBundleOrder.totalAmount)}).`,
                          );
                          setVietQrBundleOrder(null);
                          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        } else {
                          setOrderNotice(payRes?.data?.message || 'Chưa xác nhận được giao dịch VietQR.');
                        }
                      } finally {
                        setPayingQr(false);
                      }
                    }}
                    className="h-11 flex-1 items-center justify-center rounded-[13px] bg-emerald-600 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Text className="text-[13.5px] font-semibold text-white">
                      {payingQr ? 'Đang xác nhận...' : 'Thanh toán ngay'}
                    </Text>
                  </Pressable>
                  <Pressable
                    role="button"
                    onPress={() => setVietQrBundleOrder(null)}
                    className="h-11 flex-1 items-center justify-center rounded-[13px] border border-border/80 bg-surface-2 active:scale-[0.98]"
                  >
                    <Text className="text-[13.5px] font-medium text-foreground">Đóng</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
