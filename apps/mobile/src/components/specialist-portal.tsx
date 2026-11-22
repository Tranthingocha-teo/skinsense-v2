import {
  detectActiveConflicts,
  extractProductActives,
  PRODUCTS,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Home,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Send,
  Stethoscope,
  User,
  X,
  ZoomIn,
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

import { Icon } from '@/components/ui/icon';
import {
  AmbientBackdrop,
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
  fetchApprovedMarketplaceProducts,
  loadSpecialistCasesRemote,
  prescribeSpecialistCaseRemote,
  updateSpecialistCaseStatusRemote,
  type ClinicalCaseRecordItem,
  type MarketplaceApiProduct,
  type RoutineProtocolProductPayload,
} from '@/lib/api';
import { setStaffTodayViewMode, signOut, useCurrentUser } from '@/lib/auth';

const DEFAULT_PRESET_ITEMS: RoutineProtocolProductPayload[] = [
  {
    id: PRODUCTS[0]?.id ?? 'preset-1',
    name: PRODUCTS[0]?.name ?? 'La Roche-Posay Effaclar Duo+M 40ml',
    brand: PRODUCTS[0]?.brand ?? 'La Roche-Posay',
    category: 'Đặc trị mụn & Phục hồi',
    activeIngredients: 'Niacinamide, Piroctone Olamine, LHA',
    stepTime: 'both',
    dosage: '1 lượng bằng hạt đậu',
    usageGuide: 'Thoa lớp mỏng lên vùng da có mụn sau bước làm sạch.',
  },
  {
    id: PRODUCTS[2]?.id ?? 'preset-2',
    name: PRODUCTS[2]?.name ?? 'Serum B5 Tái Tạo & Làm Dịu Da 30ml',
    brand: PRODUCTS[2]?.brand ?? 'La Roche-Posay',
    category: 'Phục hồi màng ẩm',
    activeIngredients: 'Vitamin B5 (Panthenol 5%), Hyaluronic Acid',
    stepTime: 'both',
    dosage: '2-3 giọt toàn mặt',
    usageGuide: 'Thoa lên nền da hơi ẩm để tăng khả năng cấp ẩm và làm dịu mẩn đỏ.',
  },
  {
    id: 'preset-cleanser',
    name: 'Gel Rửa Mặt Dịu Nhẹ Cân Bằng pH 5.5',
    brand: 'CeraVe',
    category: 'Làm sạch',
    activeIngredients: 'Ceramides, Hyaluronic Acid, Glycerin',
    stepTime: 'both',
    dosage: '1 lần nhấn vừa đủ',
    usageGuide: 'Tạo bọt nhẹ với nước sạch, rửa trong 45-60 giây rồi thấm khô.',
  },
];

function getDefaultRevisitDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
}

export function SpecialistPortal({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const currentUser = useCurrentUser();

  const [cases, setCases] = useState<ClinicalCaseRecordItem[]>([]);
  const [approvedProducts, setApprovedProducts] = useState<MarketplaceApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<'granted' | 'denied' | 'signed-out'>('granted');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_routine' | 'in_treatment' | 'completed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'mild' | 'moderate' | 'severe'>('all');

  const [detailCase, setDetailCase] = useState<ClinicalCaseRecordItem | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState(false);

  const [prescribeCase, setPrescribeCase] = useState<ClinicalCaseRecordItem | null>(null);
  const [routineTitle, setRoutineTitle] = useState('');
  const [startDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [revisitDate, setRevisitDate] = useState(getDefaultRevisitDate);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<RoutineProtocolProductPayload[]>([
    DEFAULT_PRESET_ITEMS[0],
  ]);

  // Custom product composer inside prescribe modal (matching Web)
  const [showCustomProductForm, setShowCustomProductForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customActives, setCustomActives] = useState('');
  const [customTime, setCustomTime] = useState<'morning' | 'evening' | 'both'>('both');
  const [customDosage, setCustomDosage] = useState('1 lượng bằng hạt đậu');
  const [customGuide, setCustomGuide] = useState('Thoa sau bước làm sạch, vỗ nhẹ thẩm thấu.');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const accountStatus = currentUser?.status ?? 'active';
  const isPendingDoctor =
    accountStatus === 'pending' || accountStatus === 'rejected' || accountStatus === 'suspended';

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [casesRes, approvedRes] = await Promise.all([
      loadSpecialistCasesRemote(),
      fetchApprovedMarketplaceProducts().catch(() => [] as MarketplaceApiProduct[]),
    ]);
    setApprovedProducts(approvedRes);
    if (casesRes.status === 401) {
      setAccessState('signed-out');
      setCases([]);
    } else if (casesRes.status === 403) {
      setAccessState('denied');
      setCases([]);
    } else if (!casesRes.ok || !casesRes.data?.ok) {
      setLoadError(casesRes.error || 'Không thể tải danh sách hồ sơ da liễu.');
      setCases([]);
    } else {
      setAccessState('granted');
      setCases(Array.isArray(casesRes.data.cases) ? casesRes.data.cases : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const catalogOptions = useMemo<RoutineProtocolProductPayload[]>(() => {
    const map = new Map<string, RoutineProtocolProductPayload>();
    for (const item of DEFAULT_PRESET_ITEMS) {
      map.set(item.name.toLowerCase(), item);
    }
    for (const rp of approvedProducts) {
      const key = rp.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: rp.id,
          name: rp.name,
          brand: rp.brand || rp.shopName,
          category: rp.category || 'Dược mỹ phẩm',
          imageUrl: rp.coverImage || rp.images?.[0],
          activeIngredients: extractProductActives(rp.description, rp.name).join(', '),
          stepTime: 'both',
          dosage: 'Theo hướng dẫn chuyên khoa',
          usageGuide: 'Thoa đều sau bước làm sạch.',
        });
      }
    }
    return Array.from(map.values());
  }, [approvedProducts]);

  const conflictWarnings = useMemo(() => {
    return detectActiveConflicts(
      selectedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        keyActives: extractProductActives(p.activeIngredients, p.name),
      })),
    );
  }, [selectedProducts]);

  const filteredCases = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return cases.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
      if (!q) return true;
      return (
        c.patientName.toLowerCase().includes(q) ||
        c.caseCode.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.symptoms.toLowerCase().includes(q)
      );
    });
  }, [cases, searchTerm, statusFilter, severityFilter]);

  function openPrescribe(target: ClinicalCaseRecordItem) {
    if (isPendingDoctor) {
      setToast('Hồ sơ CCHN đang chờ Admin duyệt — bạn đang ở chế độ Xem trước.');
      return;
    }
    setPrescribeCase(target);
    setRoutineTitle(
      target.currentRoutine?.routineTitle ||
        `Phác đồ điều trị cho ${target.patientName} (${target.caseCode})`,
    );
    setRevisitDate(target.currentRoutine?.revisitDate || getDefaultRevisitDate());
    setDoctorNotes(
      target.currentRoutine?.doctorNotes ||
        `Tuân thủ routine Sáng/Tối đúng hướng dẫn, chống nắng kỹ và tái khám đúng hẹn.`,
    );
    setSelectedProducts(
      target.currentRoutine?.products?.length
        ? target.currentRoutine.products.map((p, idx) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            category: p.category,
            imageUrl: p.imageUrl,
            activeIngredients: p.activeIngredients,
            stepTime: p.stepTime === 'morning' || p.stepTime === 'evening' ? p.stepTime : 'both',
            stepNumber: p.stepNumber ?? idx + 1,
            dosage: p.dosage,
            usageGuide: p.usageGuide,
          }))
        : [DEFAULT_PRESET_ITEMS[0]],
    );
    setShowCustomProductForm(false);
  }

  function toggleCatalogProduct(item: RoutineProtocolProductPayload) {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === item.id || p.name === item.name);
      if (exists) {
        return prev.length > 1 ? prev.filter((p) => p.id !== item.id && p.name !== item.name) : prev;
      }
      return [...prev, { ...item, stepNumber: prev.length + 1 }];
    });
  }

  function addCustomProduct() {
    if (!customName.trim()) return;
    const item: RoutineProtocolProductPayload = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      brand: customBrand.trim() || 'Chỉ định Bác sĩ',
      category: 'Sản phẩm chỉ định',
      activeIngredients: customActives.trim() || extractProductActives(undefined, customName).join(', '),
      stepTime: customTime,
      stepNumber: selectedProducts.length + 1,
      dosage: customDosage.trim() || 'Vừa đủ',
      usageGuide: customGuide.trim() || 'Theo hướng dẫn bác sĩ',
    };
    setSelectedProducts((prev) => [...prev, item]);
    setCustomName('');
    setCustomBrand('');
    setCustomActives('');
    setShowCustomProductForm(false);
  }

  async function handleSubmitPrescription() {
    if (!prescribeCase || isPendingDoctor) return;
    setSaving(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const res = await prescribeSpecialistCaseRemote({
      caseId: prescribeCase.id,
      routineTitle: routineTitle.trim() || `Phác đồ ${selectedProducts.length} bước`,
      doctorNotes: doctorNotes.trim(),
      revisitDate: revisitDate.trim(),
      products: selectedProducts.map((p, idx) => ({ ...p, stepNumber: idx + 1 })),
    });
    setSaving(false);

    if (!res.ok) {
      setToast(res.error || 'Không thể lưu phác đồ lên hệ thống.');
      return;
    }

    setToast(`Đã gửi phác đồ điều trị cho bệnh nhân ${prescribeCase.patientName}!`);
    setPrescribeCase(null);
    await loadData();
  }

  async function handleCompleteCase(target: ClinicalCaseRecordItem) {
    if (isPendingDoctor) return;
    setSaving(true);
    const res = await updateSpecialistCaseStatusRemote(target.id, 'completed');
    setSaving(false);
    if (!res.ok) {
      setToast(res.error || 'Không cập nhật được trạng thái ca bệnh.');
      return;
    }
    setDetailCase(null);
    setToast(`Đã hoàn tất liệu trình cho bệnh nhân ${target.patientName}.`);
    await loadData();
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/sign-in' as Href);
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header: compact embedded bar inside (tabs), full bar on /specialist */}
      {embedded ? (
        <View
          style={{ paddingTop: Math.max(top, 12) + 4 }}
          className="relative overflow-hidden border-b border-border/80 bg-card px-4 pb-3.5"
        >
          <AmbientBackdrop height={130} tone="botanical" />
          <View className="flex-row items-center justify-between gap-2.5">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-[14px] border border-emerald-500/35 bg-emerald-500/15">
                <Icon as={Stethoscope} size={19} strokeWidth={1.6} className="text-emerald-500" />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-emerald-500">
                  Bác Sĩ / Chuyên Viên Da Liễu
                </Text>
                <Text numberOfLines={1} className="font-display text-[19px] font-normal text-foreground leading-[24px]">
                  {currentUser?.fullName || 'Bác sĩ Da liễu'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1.5">
              <HeaderIconButton icon={RefreshCw} label="Làm mới" onPress={() => void loadData()} />
              <Pressable
                role="button"
                accessibilityLabel="Mở cổng bác sĩ toàn màn hình"
                onPress={() => router.push('/specialist' as Href)}
                className="h-9 items-center justify-center rounded-[12px] bg-emerald-600 px-3 active:scale-[0.97]"
              >
                <Text className="text-[11.5px] font-semibold text-white">Cổng Bác sĩ</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <PortalHeader
          topInset={top}
          tone="botanical"
          icon={Stethoscope}
          eyebrow="Cổng Bác Sĩ Chuyên Khoa"
          title={currentUser?.fullName || 'Bác sĩ Da liễu'}
          eyebrowClassName="text-emerald-500"
          iconWellClassName="border-emerald-500/35 bg-emerald-500/15"
          iconClassName="text-emerald-500"
          subtitle={
            currentUser?.licenseId || currentUser?.hospital || currentUser?.specialty
              ? [
                  currentUser?.licenseId ? `CCHN: ${currentUser.licenseId}` : '',
                  currentUser?.hospital || '',
                  currentUser?.specialty || '',
                ]
                  .filter(Boolean)
                  .join(' · ')
              : undefined
          }
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
              <HeaderIconButton icon={User} label="Hồ sơ và cài đặt" onPress={() => router.push('/profile' as Href)} />
              <HeaderIconButton icon={RefreshCw} label="Làm mới" onPress={() => void loadData()} />
              <HeaderIconButton icon={LogOut} label="Đăng xuất" destructive onPress={() => void handleSignOut()} />
            </>
          }
        />
      )}

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(bottom + (embedded ? 96 : 24), embedded ? 110 : 32),
          gap: 12,
        }}
      >
        {toast && <ToastBanner message={toast} icon={CheckCircle2} tone="success" />}

        {/* Pending CCHN Verification Tracker Banner matching Web /specialist?status=pending */}
        {isPendingDoctor && (
          <View className="gap-2 rounded-[18px] border border-amber-500/40 bg-amber-500/10 p-4">
            <View className="flex-row items-center gap-2">
              <Icon as={AlertTriangle} size={18} className="text-amber-500" />
              <Text className="flex-1 text-[13.5px] font-semibold text-amber-500">
                {accountStatus === 'rejected'
                  ? 'Hồ sơ CCHN đã bị từ chối — Cần nộp bổ sung'
                  : 'Tài khoản Bác sĩ đang chờ Admin duyệt CCHN'}
              </Text>
            </View>
            <Text className="text-[12.5px] leading-5 text-muted-foreground">
              Chế độ Xem trước (Read-Only Sandbox): Super Admin Trần Thị Ngọc Hà đang xác minh Chứng chỉ hành nghề{currentUser?.licenseId ? ` (${currentUser.licenseId})` : ''}. Bạn chưa thể gửi kê đơn chính thức cho tới khi được phê duyệt.
            </Text>
          </View>
        )}

        {/* Metrics Row computed strictly from real backend cases */}
        <View className="flex-row gap-2.5">
          <View className={`flex-1 ${MODERN_CARD} p-3.5`}>
            <Text className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tổng hồ sơ
            </Text>
            <Text className="mt-0.5 font-display text-[26px] font-normal text-foreground">{cases.length}</Text>
          </View>
          <View className="flex-1 rounded-[20px] border border-amber-500/35 bg-amber-500/8 p-3.5">
            <Text className="text-[10.5px] font-semibold uppercase tracking-wider text-amber-500">
              Chờ kê đơn
            </Text>
            <Text className="mt-0.5 font-display text-[26px] font-normal text-amber-500">
              {cases.filter((c) => c.status === 'pending_routine').length}
            </Text>
          </View>
          <View className="flex-1 rounded-[20px] border border-emerald-500/35 bg-emerald-500/8 p-3.5">
            <Text className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-500">
              Đang điều trị
            </Text>
            <Text className="mt-0.5 font-display text-[26px] font-normal text-emerald-500">
              {cases.filter((c) => c.status === 'in_treatment').length}
            </Text>
          </View>
        </View>

        {/* Search & Dual Filter (Status + Severity matching Web) */}
        <View className="gap-2.5">
          <View className="h-12 flex-row items-center gap-2.5 rounded-[14px] border border-border/90 bg-card px-3.5">
            <Icon as={Search} size={15} className="text-muted-foreground" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Tìm bệnh nhân, mã BA-..., số điện thoại..."
              placeholderTextColor="#888"
              className="flex-1 text-[13.5px] text-foreground"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2">
            {[
              { id: 'all', label: 'Tất cả trạng thái' },
              { id: 'pending_routine', label: 'Chờ kê đơn' },
              { id: 'in_treatment', label: 'Đang điều trị' },
              { id: 'completed', label: 'Hoàn tất' },
            ].map((item) => {
              const active = statusFilter === item.id;
              return (
                <Pressable
                  key={item.id}
                  role="tab"
                  aria-selected={active}
                  onPress={() => setStatusFilter(item.id as typeof statusFilter)}
                  className={`rounded-full border px-3.5 py-2 active:scale-[0.98] ${
                    active ? 'border-foreground bg-foreground' : 'border-border/80 bg-card'
                  }`}
                >
                  <Text className={`text-[12px] font-medium ${active ? 'text-background' : 'text-foreground'}`}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2">
            {[
              { id: 'all', label: 'Mọi mức độ' },
              { id: 'severe', label: 'Nặng' },
              { id: 'moderate', label: 'Trung bình' },
              { id: 'mild', label: 'Nhẹ' },
            ].map((sev) => {
              const active = severityFilter === sev.id;
              return (
                <Pressable
                  key={sev.id}
                  role="tab"
                  aria-selected={active}
                  onPress={() => setSeverityFilter(sev.id as typeof severityFilter)}
                  className={`rounded-full border px-3 py-1.5 active:scale-[0.98] ${
                    active ? 'border-primary bg-primary/15' : 'border-border/80 bg-surface-2'
                  }`}
                >
                  <Text className={`text-[11.5px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                    {sev.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Cases Queue */}
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator />
            <Text className="mt-2 text-[12.5px] text-muted-foreground">Đang đồng bộ ca bệnh từ máy chủ...</Text>
          </View>
        ) : accessState === 'signed-out' || accessState === 'denied' ? (
          <View className={`items-center gap-2 ${MODERN_CARD} p-6`}>
            <Icon as={Stethoscope} size={28} className="text-muted-foreground" />
            <Text className="text-center text-[14px] font-semibold text-foreground">
              {accessState === 'signed-out'
                ? 'Vui lòng đăng nhập tài khoản Bác sĩ để xem hồ sơ'
                : 'Tài khoản này chưa được cấp quyền Bác sĩ chuyên khoa'}
            </Text>
          </View>
        ) : loadError ? (
          <View className="items-center gap-2.5 rounded-[20px] border border-destructive/40 bg-destructive/10 p-5">
            <Text className="text-center text-[13px] text-destructive">{loadError}</Text>
            <Pressable onPress={() => void loadData()} className="rounded-[12px] bg-primary px-4 py-2.5 active:scale-[0.98]">
              <Text className="text-[12.5px] font-semibold text-primary-foreground">Thử lại</Text>
            </Pressable>
          </View>
        ) : filteredCases.length === 0 ? (
          <View className={`items-center gap-2 ${MODERN_CARD} p-8`}>
            <Icon as={FileText} size={30} className="text-muted-foreground" />
            <Text className="text-[14px] font-semibold text-foreground">
              Chưa có hồ sơ bệnh án nào khớp bộ lọc
            </Text>
            <Text className="text-center text-[12px] text-muted-foreground leading-4">
              Khi bệnh nhân xuất bệnh án AI từ ứng dụng, hồ sơ sẽ hiển thị trực tiếp tại đây.
            </Text>
          </View>
        ) : (
          filteredCases.map((c) => (
            <View key={c.id} className={`gap-2.5 ${MODERN_CARD} p-4`}>
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-[15.5px] font-semibold text-foreground">
                    {c.patientName} ({c.patientAge || 24}t)
                  </Text>
                  <Text className="text-[11.5px] text-muted-foreground">
                    {c.caseCode} · {c.submittedDate}
                  </Text>
                </View>
                <View
                  className={`rounded-full border px-2.5 py-0.5 ${
                    c.status === 'completed'
                      ? 'border-emerald-500/30 bg-emerald-500/15'
                      : c.status === 'in_treatment'
                      ? 'border-sky-500/30 bg-sky-500/15'
                      : 'border-amber-500/30 bg-amber-500/15'
                  }`}
                >
                  <Text
                    className={`text-[10.5px] font-bold ${
                      c.status === 'completed'
                        ? 'text-emerald-500'
                        : c.status === 'in_treatment'
                        ? 'text-sky-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {c.status === 'completed'
                      ? 'Hoàn tất'
                      : c.status === 'in_treatment'
                      ? 'Đang điều trị'
                      : 'Chờ kê đơn'}
                  </Text>
                </View>
              </View>

              <View className={`flex-row gap-3 ${MODERN_SUBCARD} p-3`}>
                <Text className="text-[12px] text-foreground">
                  AI Score: <Text className="font-bold">{c.aiAnalysis?.skinHealthScore ?? 70}</Text>
                </Text>
                <Text className="text-[12px] text-rose-500">
                  Mẩn đỏ: <Text className="font-bold">{c.aiAnalysis?.rednessIndex ?? 0}%</Text>
                </Text>
                <Text className="text-[12px] text-amber-500">
                  Mụn viêm: <Text className="font-bold">{c.aiAnalysis?.inflammatorySpots ?? 0}</Text>
                </Text>
              </View>

              <Text className="text-[12.5px] text-muted-foreground leading-4" numberOfLines={3}>
                Triệu chứng: {c.symptoms}
              </Text>

              <View className="flex-row gap-2 pt-1">
                <Pressable
                  role="button"
                  onPress={() => {
                    setZoomPhoto(false);
                    setDetailCase(c);
                  }}
                  className={`flex-row items-center justify-center gap-1.5 ${MODERN_SUBCARD} px-3.5 py-2.5 active:scale-[0.98]`}
                >
                  <Icon as={Eye} size={15} className="text-foreground" />
                  <Text className="text-[12.5px] font-medium text-foreground">Ảnh & Hồ sơ</Text>
                </Pressable>
                <Pressable
                  role="button"
                  disabled={isPendingDoctor}
                  onPress={() => openPrescribe(c)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[13px] bg-emerald-600 py-2.5 active:scale-[0.98] disabled:opacity-45"
                >
                  <Icon as={FileText} size={15} className="text-white" />
                  <Text className="text-[13px] font-semibold text-white">Kê Phác Đồ & Dặn Dò</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Case Detail + Photo Zoom Modal */}
      <Modal visible={detailCase !== null} animationType="slide" transparent>
        <BottomSheetFrame bottomInset={bottom} maxHeightClass="max-h-[85%]">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary">
                Bệnh án {detailCase?.caseCode}
              </Text>
              <Text className="font-display text-[20px] font-normal text-foreground">
                {detailCase?.patientName}
              </Text>
            </View>
            <Pressable
              onPress={() => setDetailCase(null)}
              className="size-8 items-center justify-center rounded-full bg-surface-2"
            >
              <Icon as={X} size={17} className="text-muted-foreground" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-3">
            <View className={`gap-2 ${MODERN_SUBCARD} p-3`}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[11.5px] font-semibold text-muted-foreground">
                  Ảnh tổn thương da (Lâm sàng)
                </Text>
                <Pressable
                  onPress={() => setZoomPhoto((z) => !z)}
                  className="flex-row items-center gap-1 rounded-full border border-border/80 bg-card px-2.5 py-1 active:scale-[0.97]"
                >
                  <Icon as={ZoomIn} size={13} className="text-primary" />
                  <Text className="text-[11px] font-medium text-foreground">
                    {zoomPhoto ? '2x Zoom' : '1x'}
                  </Text>
                </Pressable>
              </View>
              {detailCase?.skinPhotoUrl ? (
                <View className="h-[190px] w-full overflow-hidden rounded-[14px] bg-background">
                  <Image
                    source={{ uri: detailCase.skinPhotoUrl }}
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: [{ scale: zoomPhoto ? 1.85 : 1 }],
                    }}
                    contentFit="cover"
                  />
                </View>
              ) : (
                <View className="h-[96px] items-center justify-center rounded-[14px] border border-dashed border-border bg-background/60 px-4">
                  <Text className="text-center text-[12px] text-muted-foreground">
                    Bệnh nhân gửi hồ sơ kèm số liệu phân tích AI (không đính kèm ảnh).
                  </Text>
                </View>
              )}
            </View>

            <View className={`gap-1.5 ${MODERN_SUBCARD} p-3.5`}>
              <Text className="text-[12px] font-semibold text-foreground">Triệu chứng:</Text>
              <Text className="text-[12.5px] text-muted-foreground leading-4">{detailCase?.symptoms}</Text>
              <Text className="mt-1 text-[12px] font-semibold text-rose-500">Tiền sử dị ứng:</Text>
              <Text className="text-[12.5px] text-muted-foreground leading-4">
                {detailCase?.allergies || 'Không ghi nhận'}
              </Text>
            </View>
          </ScrollView>

          <View className="mt-2 flex-row gap-2.5">
            {detailCase && detailCase.status !== 'completed' && !isPendingDoctor && (
              <Pressable
                disabled={saving}
                onPress={() => void handleCompleteCase(detailCase)}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[13px] border border-emerald-500/40 bg-emerald-500/15 py-3 active:scale-[0.98]"
              >
                <Icon as={CheckCircle2} size={15} className="text-emerald-500" />
                <Text className="text-[13px] font-semibold text-emerald-500">Hoàn tất liệu trình</Text>
              </Pressable>
            )}
            <Pressable
              disabled={isPendingDoctor}
              onPress={() => {
                const target = detailCase;
                setDetailCase(null);
                if (target) openPrescribe(target);
              }}
              className="flex-1 items-center justify-center rounded-[13px] bg-primary py-3 active:scale-[0.98] disabled:opacity-45"
            >
              <Text className="text-[13px] font-semibold text-primary-foreground">Kê phác đồ</Text>
            </Pressable>
          </View>
        </BottomSheetFrame>
      </Modal>

      {/* Prescribe Modal matching Web /specialist */}
      <Modal visible={prescribeCase !== null} animationType="slide" transparent>
        <BottomSheetFrame bottomInset={bottom} maxHeightClass="max-h-[90%]">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-emerald-500">
                Kê phác đồ y khoa · {prescribeCase?.caseCode}
              </Text>
              <Text className="font-display text-[20px] font-normal text-foreground">
                {prescribeCase?.patientName}
              </Text>
            </View>
            <Pressable
              onPress={() => setPrescribeCase(null)}
              className="size-8 items-center justify-center rounded-full bg-surface-2"
            >
              <Icon as={X} size={17} className="text-muted-foreground" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-3">
            <View className="gap-1.5">
              <Text className="text-[11.5px] font-semibold text-muted-foreground">Tên phác đồ *</Text>
              <TextInput
                value={routineTitle}
                onChangeText={setRoutineTitle}
                className={MODERN_INPUT}
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 gap-1.5">
                <Text className="text-[11px] font-semibold text-muted-foreground">Ngày bắt đầu</Text>
                <View className="h-11 flex-row items-center gap-1.5 rounded-[13px] border border-border/80 bg-surface-2 px-3">
                  <Icon as={Calendar} size={13} className="text-muted-foreground" />
                  <Text className="text-[12.5px] text-foreground">{startDate}</Text>
                </View>
              </View>
              <View className="flex-1 gap-1.5">
                <Text className="text-[11px] font-semibold text-muted-foreground">Ngày tái khám</Text>
                <TextInput
                  value={revisitDate}
                  onChangeText={setRevisitDate}
                  placeholder="YYYY-MM-DD"
                  className="h-11 rounded-[13px] border border-border/90 bg-background px-3 text-[12.5px] text-foreground"
                />
              </View>
            </View>

            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11.5px] font-semibold text-primary uppercase tracking-wider">
                  Sản phẩm chỉ định ({selectedProducts.length})
                </Text>
                <Pressable
                  onPress={() => setShowCustomProductForm((s) => !s)}
                  className="flex-row items-center gap-1 rounded-full border border-border/80 bg-surface-2 px-3 py-1 active:scale-[0.97]"
                >
                  <Icon as={Plus} size={12} className="text-primary" />
                  <Text className="text-[11px] font-semibold text-primary">Tự thêm sản phẩm</Text>
                </Pressable>
              </View>

              {showCustomProductForm && (
                <View className="gap-2 rounded-[16px] border border-primary/30 bg-primary/5 p-3.5">
                  <TextInput
                    value={customName}
                    onChangeText={setCustomName}
                    placeholder="Tên sản phẩm kê ngoài *"
                    placeholderTextColor="#888"
                    className="h-11 rounded-[12px] border border-border/90 bg-background px-3 text-[12.5px] text-foreground"
                  />
                  <TextInput
                    value={customBrand}
                    onChangeText={setCustomBrand}
                    placeholder="Hãng / Nhà sản xuất"
                    placeholderTextColor="#888"
                    className="h-11 rounded-[12px] border border-border/90 bg-background px-3 text-[12.5px] text-foreground"
                  />
                  <TextInput
                    value={customActives}
                    onChangeText={setCustomActives}
                    placeholder="Hoạt chất (vd: Adapalene 0.1%, B5)"
                    placeholderTextColor="#888"
                    className="h-11 rounded-[12px] border border-border/90 bg-background px-3 text-[12.5px] text-foreground"
                  />
                  <View className="flex-row gap-1.5">
                    {(['morning', 'evening', 'both'] as const).map((slot) => (
                      <Pressable
                        key={slot}
                        onPress={() => setCustomTime(slot)}
                        className={`flex-1 items-center rounded-full border py-1.5 ${
                          customTime === slot ? 'border-primary bg-primary/15' : 'border-border/80 bg-background'
                        }`}
                      >
                        <Text className="text-[11px] font-semibold text-foreground">
                          {slot === 'morning' ? 'Sáng' : slot === 'evening' ? 'Tối' : 'Sáng & Tối'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    value={customDosage}
                    onChangeText={setCustomDosage}
                    placeholder="Liều lượng"
                    className="h-10 rounded-[12px] border border-border/90 bg-background px-3 text-[12px] text-foreground"
                  />
                  <TextInput
                    value={customGuide}
                    onChangeText={setCustomGuide}
                    placeholder="Cách thoa / hướng dẫn"
                    className="h-10 rounded-[12px] border border-border/90 bg-background px-3 text-[12px] text-foreground"
                  />
                  <Pressable
                    onPress={addCustomProduct}
                    className="items-center rounded-[12px] bg-primary py-2.5 active:scale-[0.98]"
                  >
                    <Text className="text-[12.5px] font-semibold text-primary-foreground">Thêm vào đơn</Text>
                  </Pressable>
                </View>
              )}

              <View className="flex-row flex-wrap gap-1.5">
                {catalogOptions.map((opt) => {
                  const active = selectedProducts.some((p) => p.name === opt.name);
                  return (
                    <Pressable
                      key={opt.name}
                      onPress={() => toggleCatalogProduct(opt)}
                      className={`rounded-full border px-3 py-2 active:scale-[0.98] ${
                        active ? 'border-emerald-500 bg-emerald-500/15' : 'border-border/80 bg-surface-2'
                      }`}
                    >
                      <Text className={`text-[11.5px] ${active ? 'font-semibold text-emerald-500' : 'text-foreground'}`}>
                        {opt.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {conflictWarnings.length > 0 && (
              <View className="gap-1 rounded-[14px] border border-amber-500/40 bg-amber-500/10 p-3.5">
                <View className="flex-row items-center gap-1.5">
                  <Icon as={AlertTriangle} size={14} className="text-amber-500" />
                  <Text className="text-[12px] font-semibold text-amber-500">
                    Cảnh báo tương tác hoạt chất
                  </Text>
                </View>
                {conflictWarnings.map((w) => (
                  <Text key={w.id} className="text-[11.5px] text-muted-foreground leading-4">
                    • {w.title}: {w.advice}
                  </Text>
                ))}
              </View>
            )}

            <View className="gap-1.5">
              <Text className="text-[11.5px] font-semibold text-muted-foreground">Lời dặn chuyên khoa *</Text>
              <TextInput
                value={doctorNotes}
                onChangeText={setDoctorNotes}
                multiline
                numberOfLines={3}
                className="min-h-[84px] rounded-[14px] border border-border/90 bg-background p-3.5 text-[13.5px] text-foreground"
              />
            </View>
          </ScrollView>

          <View className="mt-2 flex-row gap-2.5">
            <Pressable
              onPress={() => setPrescribeCase(null)}
              className="flex-1 items-center justify-center rounded-[13px] border border-border/80 py-3 active:scale-[0.98]"
            >
              <Text className="text-[13.5px] font-medium text-foreground">Hủy</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => void handleSubmitPrescription()}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[13px] bg-emerald-600 py-3 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon as={Send} size={15} className="text-white" />
              )}
              <Text className="text-[13.5px] font-semibold text-white">Gửi Cho Bệnh Nhân</Text>
            </Pressable>
          </View>
        </BottomSheetFrame>
      </Modal>
    </View>
  );
}
