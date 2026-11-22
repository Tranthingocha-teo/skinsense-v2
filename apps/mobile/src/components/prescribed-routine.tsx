import { PRODUCTS } from '@skinsense/domain';
import { useRouter } from 'expo-router';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Droplets,
  FlaskConical,
  Moon,
  RefreshCw,
  ShoppingBag,
  Stethoscope,
  Sun,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductImage } from '@/components/artwork';
import { Icon } from '@/components/ui/icon';
import { AmbientBackdrop, MODERN_CARD, MODERN_SUBCARD } from '@/components/ui/portal-chrome';
import { Text } from '@/components/ui/text';
import {
  fetchApprovedMarketplaceProducts,
  loadMyClinicalRecordsRemote,
  type ClinicalCaseRecordItem,
} from '@/lib/api';

function formatDateVi(iso?: string): string {
  if (!iso) return '';
  if (iso.includes('/')) return iso;
  const parts = iso.slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}

export function PrescribedRoutineView() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<ClinicalCaseRecordItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'morning' | 'evening'>('all');
  const [catalogIds, setCatalogIds] = useState<Set<string>>(() => new Set(PRODUCTS.map((p) => p.id)));

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadMyClinicalRecordsRemote(), fetchApprovedMarketplaceProducts()])
      .then(([recordsRes, approvedProds]) => {
        if (cancelled) return;
        setCases(recordsRes.cases);
        const ids = new Set(PRODUCTS.map((p) => p.id));
        for (const ap of approvedProds) ids.add(ap.id);
        setCatalogIds(ids);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const prescribedCase = cases
    .filter((c) => (c.currentRoutine?.products?.length ?? 0) > 0)
    .sort((a, b) =>
      String(b.currentRoutine?.prescribedAt ?? b.submittedDate ?? '').localeCompare(
        String(a.currentRoutine?.prescribedAt ?? a.submittedDate ?? ''),
      ),
    )[0];

  const routine = prescribedCase?.currentRoutine;
  const allProducts = routine?.products ?? [];
  const filteredProducts = allProducts.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'morning') return p.stepTime === 'morning' || p.stepTime === 'both';
    return p.stepTime === 'evening' || p.stepTime === 'both';
  });

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: Math.max(top, 12) + 2 }}
        className="relative overflow-hidden flex-row items-center justify-between border-b border-border/80 bg-card/95 px-3.5 pb-3.5"
      >
        <AmbientBackdrop height={120} tone="botanical" />
        <View className="flex-row items-center gap-2 flex-1">
          <Pressable
            role="button"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            className="size-10 items-center justify-center rounded-[12px] border border-border/80 bg-surface-2/90 active:scale-[0.96]"
          >
            <Icon as={ChevronLeft} size={20} strokeWidth={1.6} className="text-foreground" />
          </Pressable>
          <View className="flex-1">
            <Text className="font-display text-[20px] font-normal text-foreground leading-[24px]">
              Phác Đồ Bác Sĩ Kê
            </Text>
            <Text className="text-[11px] text-muted-foreground">
              Hồ sơ điều trị & tiến trình da liễu của bạn
            </Text>
          </View>
        </View>

        <Pressable
          role="button"
          onPress={() => router.push('/store' as any)}
          className="flex-row items-center gap-1.5 rounded-full border border-border/80 bg-surface-2/90 px-3.5 py-2 active:scale-[0.97]"
        >
          <Icon as={ShoppingBag} size={13} className="text-primary" />
          <Text className="text-[11.5px] font-bold text-primary">Sàn SP</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-20 pt-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="py-12 items-center gap-2">
            <ActivityIndicator size="small" />
            <Text className="text-[13px] text-muted-foreground">Đang tải hồ sơ & phác đồ...</Text>
          </View>
        ) : routine && prescribedCase ? (
          <View className="gap-4">
            {/* Prescribed Plan Summary */}
            <View className="relative overflow-hidden rounded-[22px] border border-emerald-500/35 bg-card p-4.5 gap-3">
              <AmbientBackdrop height={150} tone="botanical" />
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="size-10 items-center justify-center rounded-[14px] border border-emerald-500/35 bg-emerald-500/15">
                    <Icon as={Stethoscope} size={19} className="text-emerald-500" />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-emerald-500">
                      {routine.prescribedBy || 'Bác sĩ Chuyên khoa'}
                    </Text>
                    <Text className="font-display text-[20px] font-normal text-foreground leading-[24px]">
                      {routine.routineTitle}
                    </Text>
                  </View>
                </View>
              </View>

              {routine.doctorNotes ? (
                <View className={`${MODERN_SUBCARD} p-3.5`}>
                  <Text className="text-[12.5px] text-foreground leading-[19px]">
                    <Text className="font-bold">Chỉ định: </Text>
                    {routine.doctorNotes}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row items-center justify-between pt-1.5 border-t border-border/60">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={Calendar} size={13} className="text-muted-foreground" />
                  <Text className="text-[12px] text-muted-foreground">
                    Tái khám: <Text className="font-bold text-foreground">{formatDateVi(routine.revisitDate) || 'Theo hẹn'}</Text>
                  </Text>
                </View>
                <Text className="text-[12px] font-semibold text-emerald-500">
                  {prescribedCase.caseCode}
                </Text>
              </View>
            </View>

            {/* Time of day filter tabs */}
            <View className="flex-row rounded-[15px] border border-border/80 bg-surface-2 p-1">
              {(
                [
                  ['all', `Tất cả (${allProducts.length})`],
                  ['morning', 'Buổi Sáng'],
                  ['evening', 'Buổi Tối'],
                ] as const
              ).map(([key, label]) => {
                const active = activeTab === key;
                return (
                  <Pressable
                    key={key}
                    role="tab"
                    accessibilityState={{ selected: active }}
                    onPress={() => setActiveTab(key)}
                    className={`flex-1 py-2.5 rounded-[12px] items-center active:scale-[0.98] ${
                      active ? 'bg-card border border-border/70 shadow-xs' : ''
                    }`}
                  >
                    <Text className={`text-[12px] ${active ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Product steps */}
            <View className="gap-3">
              {filteredProducts.map((prod, idx) => (
                <View key={prod.id || `${prod.name}-${idx}`} className={`${MODERN_CARD} p-4 gap-3`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Bước {prod.stepNumber || idx + 1} • {prod.category || 'Chuyên khoa'}
                    </Text>
                    <View className="flex-row items-center gap-1 rounded-full border border-border/80 bg-surface-2 px-2.5 py-0.5">
                      <Icon
                        as={prod.stepTime === 'morning' ? Sun : prod.stepTime === 'evening' ? Moon : RefreshCw}
                        size={11}
                        className="text-foreground"
                      />
                      <Text className="text-[10.5px] font-semibold">
                        {prod.stepTime === 'morning'
                          ? 'Buổi sáng'
                          : prod.stepTime === 'evening'
                          ? 'Buổi tối'
                          : 'Sáng & Tối'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-3">
                    <View className="size-16 overflow-hidden rounded-[14px] border border-border/80 bg-surface-2">
                      <ProductImage
                        uri={prod.imageUrl}
                        name={prod.name}
                        brand={prod.brand}
                        category={prod.category}
                        seed={prod.id || prod.name}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      {prod.brand ? (
                        <Text className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                          {prod.brand}
                        </Text>
                      ) : null}
                      <Text className="text-[14.5px] font-bold text-foreground leading-[20px]">
                        {prod.name}
                      </Text>
                      {prod.dosage ? (
                        <Text className="text-[12px] text-emerald-500 font-medium">Liều lượng: {prod.dosage}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View className={`${MODERN_SUBCARD} p-3 gap-1.5`}>
                    {prod.activeIngredients ? (
                      <View className="flex-row items-start gap-1.5">
                        <Icon as={FlaskConical} size={13} className="text-primary mt-0.5" />
                        <Text className="flex-1 text-[12px] text-muted-foreground leading-4">
                          <Text className="font-semibold text-foreground">Hoạt chất: </Text>
                          {prod.activeIngredients}
                        </Text>
                      </View>
                    ) : null}
                    {prod.usageGuide ? (
                      <View className="flex-row items-start gap-1.5">
                        <Icon as={Droplets} size={13} className="text-emerald-500 mt-0.5" />
                        <Text className="flex-1 text-[12px] text-muted-foreground leading-4">
                          <Text className="font-semibold text-foreground">Cách dùng: </Text>
                          {prod.usageGuide}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {catalogIds.has(prod.id) && (
                    <Pressable
                      role="button"
                      onPress={() => router.push(`/products/${prod.id}` as any)}
                      className="self-end"
                    >
                      <Text className="text-[12px] font-bold text-primary underline">Xem trên sàn →</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            <Pressable
              role="button"
              onPress={() => router.push('/store' as any)}
              className="h-12 flex-row items-center justify-center gap-2 rounded-[14px] bg-primary active:scale-[0.98]"
            >
              <Icon as={ShoppingBag} size={17} className="text-primary-foreground" />
              <Text className="text-[14px] font-bold text-primary-foreground">
                Mua sản phẩm tại Sàn Dược Mỹ Phẩm
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className={`${MODERN_CARD} p-6 items-center gap-3`}>
            <View className="size-12 items-center justify-center rounded-[15px] bg-emerald-500/15 border border-emerald-500/30">
              <Icon as={Stethoscope} size={22} className="text-emerald-500" />
            </View>
            <Text className="font-display text-[20px] font-normal text-center text-foreground">
              Chưa có phác đồ nào được kê
            </Text>
            <Text className="text-[13px] text-center text-muted-foreground leading-[19px]">
              Xuất hồ sơ da từ trang Hôm nay để Bác sĩ chuyên khoa xem ảnh và kê Routine điều trị trực tiếp về tài khoản.
            </Text>
            <Pressable
              role="button"
              onPress={() => router.back()}
              className="mt-1 h-11 rounded-[13px] bg-emerald-600 px-5 items-center justify-center active:scale-[0.98]"
            >
              <Text className="text-[13px] font-bold text-white">Quay lại trang Hôm nay</Text>
            </Pressable>
          </View>
        )}

        {/* Submitted Clinical Cases Status Tracker */}
        {!loading && cases.length > 0 && (
          <View className={`${MODERN_CARD} p-4 gap-3`}>
            <View className="flex-row items-center justify-between border-b border-border/70 pb-2.5">
              <Text className="font-display text-[18px] font-normal text-foreground">
                Hồ sơ bệnh án đã gửi Bác sĩ ({cases.length})
              </Text>
              <Text className="text-[11px] text-muted-foreground">Đồng bộ phòng khám</Text>
            </View>
            <View className="gap-2.5">
              {cases.map((sc) => (
                <View key={sc.id} className={`${MODERN_SUBCARD} p-3.5 gap-1.5`}>
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-[12px] font-bold text-foreground">
                      {sc.caseCode} {sc.submittedDate ? `• ${sc.submittedDate}` : ''}
                    </Text>
                    {sc.status === 'completed' ? (
                      <View className="flex-row items-center gap-1 rounded-full bg-surface-2 border border-border px-2.5 py-0.5">
                        <Icon as={CheckCircle2} size={11} className="text-emerald-500" />
                        <Text className="text-[10.5px] font-bold text-foreground">Hoàn tất liệu trình</Text>
                      </View>
                    ) : sc.status === 'in_treatment' ? (
                      <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5">
                        <Icon as={CheckCircle2} size={11} className="text-emerald-500" />
                        <Text className="text-[10.5px] font-bold text-emerald-500">Đã có phác đồ</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5">
                        <Icon as={Clock} size={11} className="text-amber-500" />
                        <Text className="text-[10.5px] font-bold text-amber-500">Đang chờ Bác sĩ duyệt</Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={2} className="text-[12px] text-muted-foreground leading-4">
                    {sc.symptoms}
                  </Text>
                  <View className="flex-row items-center justify-between pt-1.5 border-t border-border/50">
                    <Text className="text-[11px] text-muted-foreground">
                      Phụ trách: <Text className="font-semibold text-foreground">{sc.assignedDoctor || 'Bác sĩ da liễu'}</Text>
                    </Text>
                    <Text className="text-[11px] font-bold text-emerald-500">
                      Điểm da: {sc.aiAnalysis?.skinHealthScore ?? 75}/100
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
