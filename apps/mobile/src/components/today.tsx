import { dailySeries, localDay, rednessShare, streak, trendDirection, windowDays, ZONES } from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import * as Haptics from 'expo-haptics';
import { Link, useRouter } from 'expo-router';
import {
  Activity,
  AlertCircle,
  Award,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Package,
  Plus,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Store,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { useEffect, useReducer, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { LoadState } from '@/components/load-state';
import { Mark } from '@/components/mark';
import { RecommendedProductsSection } from '@/components/recommended-products';
import { RoutineChecklist } from '@/components/routine-checklist';
import { FLAT_TOLERANCE } from '@/components/trends';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useCurrentUser, type AuthUser } from '@/lib/auth';
import { useDemoActive } from '@/lib/demo';
import { loadTrends, type TrendData } from '@/lib/trends';

// Same derivations as apps/web/src/components/today.tsx; layout from the AndroidToday,
// AndroidFirstRun, AndroidLoading and AndroidLoadError artboards.
const CARD = 'rounded-card border border-border bg-card';
const LABEL = 'text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground';

const usePalette = () => color[useColorScheme() === 'dark' ? 'dark' : 'light'];

// DESIGN.md: cards FadeInDown 460ms, stagger 80ms, from 12px above (canvas .in); reduced motion keeps the fade.
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
function useEnter() {
  const reduced = useReducedMotion();
  return (order: number) =>
    (reduced ? FadeIn.reduceMotion(ReduceMotion.Never) : FadeInDown.withInitialValues({ transform: [{ translateY: -12 }] }).easing(EASE_OUT))
      .duration(460)
      .delay(order * 80);
}

// The night photo band under the status bar: a labelled gradient until real photos exist,
// the night tint before the first capture (SVG: NativeWind tokens are HSL vars, gradients need hex).
function Band({ photo }: { photo: boolean }) {
  const palette = usePalette();
  return (
    <Svg width="100%" height={photo ? 420 : 320} style={{ position: 'absolute', top: 0 }} aria-hidden>
      <Defs>
        <LinearGradient id="band" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette['photo-b']} />
          <Stop offset="1" stopColor={palette.bg} />
        </LinearGradient>
        <RadialGradient id="glow-a" cx="20%" cy="70%" rx="90%" ry="70%">
          <Stop offset="0" stopColor={palette['photo-a']} />
          <Stop offset="0.75" stopColor={palette['photo-a']} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="glow-c" cx={photo ? '70%' : '75%'} cy={photo ? '18%' : '10%'} rx="60%" ry={photo ? '50%' : '60%'}>
          <Stop offset="0" stopColor={palette['photo-c']} stopOpacity={photo ? 0.55 : 0.32} />
          <Stop offset="0.7" stopColor={palette['photo-c']} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.bg} stopOpacity={0.25} />
          <Stop offset="1" stopColor={palette.bg} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#band)" />
      {photo && <Rect width="100%" height="100%" fill="url(#glow-a)" />}
      <Rect width="100%" height="100%" fill="url(#glow-c)" />
      {photo && <Rect width="100%" height="100%" fill="url(#scrim)" />}
    </Svg>
  );
}

function Frame({ photo, date, loading = false, children }: { photo: boolean; date: string; loading?: boolean; children: ReactNode }) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const isDemo = useDemoActive();
  const enter = useEnter();
  return (
    <View className="flex-1">
      <Band photo={photo} />
      <ScrollView contentContainerClassName="flex-grow gap-3 px-[18px] pb-32" contentContainerStyle={{ paddingTop: isDemo ? 16 : top + 16 }} role={loading ? 'status' : undefined}>
        <Animated.View entering={enter(0)} className="flex-row items-end justify-between px-1 pb-[18px]">
          <View className="gap-0.5">
            <Text className="text-[11.5px] font-medium uppercase tracking-[1.6px]">{date}</Text>
            <Text role="heading" aria-level="1" className="font-display text-[54px] font-light leading-[60px]">
              {t('today.title')}
            </Text>
            {loading && <Text className="pt-1.5 text-[13px] font-light text-muted-foreground">{t('common.loading')}</Text>}
          </View>
          {/* The placeholder label and the mark share the header's right edge (canvas: pill top-right, mark as on AndroidSignIn). */}
          <View className="items-end justify-between self-stretch pb-2.5">
            {photo ? (
              <Text className="rounded-pill border border-dashed border-muted-foreground px-2.5 py-1 text-[11px]">{t('today.photoPlaceholder')}</Text>
            ) : (
              <View />
            )}
            <Mark size={40} />
          </View>
        </Animated.View>
        {children}
      </ScrollView>
    </View>
  );
}

function StreakCard({ title, days, today, success = false }: { title: string; days: Set<string>; today: string; success?: boolean }) {
  const { t } = useTranslation();
  const count = streak(days, today);
  return (
    <View className={`flex-1 px-[18px] py-3.5 ${CARD}`}>
      <Text className={LABEL}>{title}</Text>
      <Text className={`font-display text-[52px] font-light leading-[60px] ${success ? 'text-success' : ''}`}>
        {count}
        <Text className="font-body text-[13px] font-light text-muted-foreground">{t('today.nights', { count })}</Text>
      </Text>
    </View>
  );
}

function ZoneBar({ share, good, order }: { share: number; good: boolean; order: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(420 + 80 * order, withTiming(share * 100, { duration: 700, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [order, share, width]);
  const style = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <Animated.View aria-hidden style={[{ position: 'absolute', left: 0, bottom: 0 }, style]}>
      <View className={`h-px ${good ? 'bg-success' : 'bg-foreground'}`} />
    </Animated.View>
  );
}

// Canvas AndroidLoading: blocks the size of the real cards so nothing jumps when data lands.
function Loading() {
  return (
    <>
      <View className="h-[196px] rounded-card bg-card" />
      <View className="flex-row gap-3">
        <View className="h-[100px] flex-1 rounded-card bg-card" />
        <View className="h-[100px] flex-1 rounded-card bg-card" />
      </View>
      <View className="gap-[18px] rounded-card bg-card px-5 py-[22px]">
        {(['56%', '80%', '68%', '74%'] as const).map((width, i) => (
          <View key={width} className={`rounded-control bg-surface-2 ${i === 0 ? 'h-3.5' : 'h-2.5'}`} style={{ width }} />
        ))}
      </View>
    </>
  );
}

// =========================================================================
// ROLE 2: CHUYÊN VIÊN DA LIỄU WORKSTATION
// =========================================================================
interface PatientCase {
  id: string;
  name: string;
  age: number;
  timeAgo: string;
  redness: { forehead: string; leftCheek: string; rightCheek: string; nose: string; chin: string };
  diagnosis: string;
  recommendedRoutine: string;
  urgent?: boolean;
}

const INITIAL_PATIENTS: PatientCase[] = [
  {
    id: 'pt-1',
    name: 'Trần Thị Ngọc Hà',
    age: 24,
    timeAgo: '15 phút trước',
    redness: { forehead: '-0.8 ↓', leftCheek: '+0.4 ↓', rightCheek: '-0.9 ↓', nose: '+2.9 ↑', chin: '+4.0 ↑' },
    diagnosis: 'Mụn sưng viêm sưng đỏ vùng cằm & bít tắc lỗ chân lông vùng chữ T',
    recommendedRoutine: 'Effaclar Duo+M 40ml & Tinh chất B5 phục hồi da',
    urgent: true,
  },
  {
    id: 'pt-2',
    name: 'Lê Hoàng Nam',
    age: 27,
    timeAgo: '1 giờ trước',
    redness: { forehead: '+2.5 ↑', leftCheek: '+1.2', rightCheek: '+3.1 ↑', nose: '+0.8', chin: '+1.5' },
    diagnosis: 'Da dầu mụn kích ứng nhạy cảm, hàng rào bảo vệ suy giảm',
    recommendedRoutine: 'Centella Ampoule 100ml làm dịu & Gel rửa mặt dịu nhẹ',
  },
  {
    id: 'pt-3',
    name: 'Đỗ Thu Trang',
    age: 22,
    timeAgo: 'Hôm nay',
    redness: { forehead: '-1.1 ↓', leftCheek: '-0.9 ↓', rightCheek: '-1.2 ↓', nose: '-0.4 ↓', chin: '-0.6 ↓' },
    diagnosis: 'Nền da phục hồi rất tốt sau phác đồ tuần trước, giảm viêm 80%',
    recommendedRoutine: 'Routine dưỡng ẩm duy trì & Chống nắng hàng ngày',
  },
];

function SpecialistTodayWorkstation({ user, date }: { user: AuthUser; date: string }) {
  const enter = useEnter();
  const { bottom } = useSafeAreaInsets();
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [activePatient, setActivePatient] = useState<PatientCase | null>(null);
  const [adviceText, setAdviceText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('Effaclar Duo+M Giảm Mụn 40ml');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  function handleOpenPrescribe(pt: PatientCase) {
    setActivePatient(pt);
    setAdviceText(`Dặn dò bệnh nhân: ${pt.name} cần vệ sinh sạch vùng mũi và cằm, bôi mỏng 2 lần sáng/tối.`);
  }

  function handleSendPrescription() {
    if (!activePatient) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToastMessage(`Đã gửi phác đồ điều trị thành công tới bệnh nhân ${activePatient.name}!`);
    setActivePatient(null);
  }

  return (
    <Frame photo={false} date={date}>
      {/* Toast */}
      {toastMessage && (
        <View className="mb-2 flex-row items-center gap-2 rounded-card border border-emerald-500/30 bg-emerald-500/15 p-3.5">
          <Icon as={CheckCircle2} size={18} className="text-emerald-500" />
          <Text className="flex-1 text-[13px] font-medium text-emerald-400">{toastMessage}</Text>
        </View>
      )}

      {/* Specialist Header Card */}
      <Animated.View entering={enter(1)} className={`gap-3 p-5 ${CARD}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="size-9 items-center justify-center rounded-pill bg-emerald-500/15">
              <Icon as={Stethoscope} size={18} className="text-emerald-400" />
            </View>
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Bác Sĩ / Chuyên Viên Da Liễu
              </Text>
              <Text className="text-[17px] font-semibold">{user.fullName}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-pill border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
            <View className="size-2 rounded-full bg-emerald-400" />
            <Text className="text-[11px] font-medium text-emerald-400">Đang trực tuyến</Text>
          </View>
        </View>
        <Text className="text-[13px] text-muted-foreground">
          Chuyên khoa: {user.specialty || 'Da liễu & Điều trị mụn chuyên sâu'}
        </Text>
      </Animated.View>

      {/* Specialist Quick Metrics */}
      <Animated.View entering={enter(2)} className="flex-row gap-2.5">
        <View className={`flex-1 gap-1 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Bệnh nhân</Text>
          <Text className="font-display text-[26px]">24</Text>
          <Text className="text-[11px] text-muted-foreground">đang quản lý</Text>
        </View>
        <View className={`flex-1 gap-1 border-amber-500/25 bg-amber-500/5 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Chờ tư vấn</Text>
          <Text className="font-display text-[26px] text-amber-400">8 ca</Text>
          <Text className="text-[11px] text-amber-500/80">hôm nay</Text>
        </View>
        <View className={`flex-1 gap-1 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Phác đồ</Text>
          <Text className="font-display text-[26px]">18</Text>
          <Text className="text-[11px] text-muted-foreground">đã gửi tuần này</Text>
        </View>
      </Animated.View>

      {/* Patient Queue Section */}
      <Animated.View entering={enter(3)} className="gap-2.5">
        <View className="flex-row items-center justify-between px-1 pt-2">
          <Text className={LABEL}>Hồ sơ da & Yêu cầu tư vấn mới nhất</Text>
          <Text className="text-[12px] font-medium text-primary">3 hồ sơ</Text>
        </View>

        {patients.map((pt) => (
          <View key={pt.id} className={`gap-3 p-4 ${CARD}`}>
            <View className="flex-row items-start justify-between">
              <View className="gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[15.5px] font-semibold">{pt.name}</Text>
                  <Text className="text-[13px] text-muted-foreground">({pt.age} tuổi)</Text>
                  {pt.urgent && (
                    <View className="rounded-pill bg-rose-500/15 px-2 py-0.5">
                      <Text className="text-[10px] font-bold text-rose-400">Mới gửi ảnh</Text>
                    </View>
                  )}
                </View>
                <Text className="text-[11.5px] text-muted-foreground">{pt.timeAgo}</Text>
              </View>
            </View>

            {/* Redness telemetry pills */}
            <View className="rounded-control bg-surface-2/60 p-2.5">
              <Text className="mb-1 text-[11px] font-semibold text-muted-foreground">
                Số đo vi diện mẩn đỏ AI:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Text className="text-[12px]">Trán: <Text className="font-semibold">{pt.redness.forehead}</Text></Text>
                <Text className="text-[12px]">Má T: <Text className="font-semibold">{pt.redness.leftCheek}</Text></Text>
                <Text className="text-[12px]">Má P: <Text className="font-semibold">{pt.redness.rightCheek}</Text></Text>
                <Text className="text-[12px]">Mũi: <Text className="font-semibold text-rose-400">{pt.redness.nose}</Text></Text>
                <Text className="text-[12px]">Cằm: <Text className="font-semibold text-rose-400">{pt.redness.chin}</Text></Text>
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-[12.5px] font-medium text-foreground">Chẩn đoán sơ bộ:</Text>
              <Text className="text-[12.5px] text-muted-foreground">{pt.diagnosis}</Text>
            </View>

            <View className="gap-1">
              <Text className="text-[12.5px] font-medium text-emerald-400">Phác đồ gợi ý:</Text>
              <Text className="text-[12.5px] text-muted-foreground">{pt.recommendedRoutine}</Text>
            </View>

            <Pressable
              role="button"
              onPress={() => handleOpenPrescribe(pt)}
              className="mt-1 flex-row items-center justify-center gap-2 rounded-control bg-emerald-600/90 py-2.5">
              <Icon as={FileText} size={15} className="text-white" />
              <Text className="text-[13.5px] font-semibold text-white">Kê Phác Đồ & Dặn Dò</Text>
            </Pressable>
          </View>
        ))}
      </Animated.View>

      {/* Modal Prescribe */}
      <Modal visible={activePatient !== null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View
            style={{ paddingBottom: Math.max(bottom, 24) }}
            className="max-h-[85%] rounded-t-3xl border-t border-border bg-card p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Kê phác đồ điều trị
                </Text>
                <Text className="text-[18px] font-semibold">{activePatient?.name}</Text>
              </View>
              <Pressable onPress={() => setActivePatient(null)} className="p-1">
                <Icon as={X} size={20} className="text-muted-foreground" />
              </Pressable>
            </View>

            <ScrollView className="gap-3">
              <View className="gap-1.5">
                <Text className="text-[13px] font-medium">Sản phẩm điều trị chỉ định</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    'Effaclar Duo+M Giảm Mụn 40ml',
                    'Centella Ampoule Rau Má 100ml',
                    'Serum B5 Tái Tạo Phục Hồi',
                    'Gel Rửa Mặt Dịu Nhẹ Cân Bằng',
                  ].map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setSelectedProduct(p)}
                      className={`rounded-control border px-3 py-2 ${
                        selectedProduct === p
                          ? 'border-emerald-500 bg-emerald-500/15'
                          : 'border-border bg-surface-2'
                      }`}>
                      <Text
                        className={`text-[12px] ${
                          selectedProduct === p ? 'font-semibold text-emerald-400' : 'text-foreground'
                        }`}>
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="gap-1.5 pt-2">
                <Text className="text-[13px] font-medium">Chẩn đoán & Lời dặn chuyên khoa *</Text>
                <TextInput
                  value={adviceText}
                  onChangeText={setAdviceText}
                  multiline
                  numberOfLines={4}
                  className="min-h-[100px] rounded-control border border-border bg-surface-2 p-3 text-[13.5px] text-foreground"
                  placeholder="Nhập hướng dẫn liều dùng, lưu ý chăm sóc da cho bệnh nhân..."
                  placeholderTextColor="#888"
                />
              </View>
            </ScrollView>

            <View className="mt-4 flex-row gap-3 pt-2">
              <Pressable
                onPress={() => setActivePatient(null)}
                className="flex-1 items-center justify-center rounded-control border border-border py-3">
                <Text className="text-[14px]">Huỷ</Text>
              </Pressable>
              <Pressable
                onPress={handleSendPrescription}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-control bg-emerald-600 py-3">
                <Icon as={Send} size={15} className="text-white" />
                <Text className="text-[14px] font-semibold text-white">Gửi Cho Bệnh Nhân</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Frame>
  );
}

// =========================================================================
// ROLE 3: QUẢN LÝ CHUNG HẾT (SUPER ADMIN) WORKSTATION
// =========================================================================
function AdminTodayWorkstation({ user, date }: { user: AuthUser; date: string }) {
  const router = useRouter();
  const enter = useEnter();

  return (
    <Frame photo={false} date={date}>
      {/* Super Admin Header Card */}
      <Animated.View entering={enter(1)} className={`gap-3 p-5 ${CARD}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="size-9 items-center justify-center rounded-pill bg-purple-500/15">
              <Icon as={ShieldCheck} size={18} className="text-purple-400" />
            </View>
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Quản Trị Viên Tối Cao
              </Text>
              <Text className="text-[17px] font-semibold">{user.fullName}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-pill border border-purple-500/30 bg-purple-500/10 px-2.5 py-1">
            <Text className="text-[11px] font-medium text-purple-400">Toàn quyền</Text>
          </View>
        </View>
        <Text className="text-[13px] text-muted-foreground">
          Bảng điều khiển trung tâm quản lý toàn bộ hệ sinh thái SkinSense
        </Text>
      </Animated.View>

      {/* System Metrics */}
      <Animated.View entering={enter(2)} className="flex-row flex-wrap gap-2.5">
        <View className={`flex-1 min-w-[46%] gap-1 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Doanh thu toàn sàn</Text>
          <Text className="font-display text-[26px] text-emerald-400">740.000₫</Text>
          <Text className="text-[11px] text-muted-foreground">2 đơn hoàn tất</Text>
        </View>
        <View className={`flex-1 min-w-[46%] gap-1 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Đơn hàng toàn sàn</Text>
          <Text className="font-display text-[26px]">2 đơn</Text>
          <Text className="text-[11px] text-muted-foreground">0 đơn chờ duyệt</Text>
        </View>
        <View className={`flex-1 min-w-[46%] gap-1 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Shop bán hàng</Text>
          <Text className="font-display text-[26px]">1 shop</Text>
          <Text className="text-[11px] text-muted-foreground">đang hoạt động</Text>
        </View>
        <View className={`flex-1 min-w-[46%] gap-1 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Chuyên viên tư vấn</Text>
          <Text className="font-display text-[26px]">1 bác sĩ</Text>
          <Text className="text-[11px] text-muted-foreground">trực tuyến</Text>
        </View>
      </Animated.View>

      {/* System Recent Activities */}
      <Animated.View entering={enter(3)} className={`gap-3 p-4 ${CARD}`}>
        <Text className={LABEL}>Hoạt động toàn sàn gần nhất</Text>
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between border-b border-border pb-2.5">
            <View className="gap-0.5">
              <Text className="text-[13.5px] font-medium">Đơn ORD-405503-9548 (Effaclar Duo+M)</Text>
              <Text className="text-[11.5px] text-muted-foreground">Khách: Nguyen Van A • COD</Text>
            </View>
            <Text className="text-[13.5px] font-bold text-emerald-400">+395.000₫</Text>
          </View>
          <View className="flex-row items-center justify-between border-b border-border pb-2.5">
            <View className="gap-0.5">
              <Text className="text-[13.5px] font-medium">Đơn ORD-913038-9AAB (Centella Ampoule)</Text>
              <Text className="text-[11.5px] text-muted-foreground">Khách: Tran Thi Ngoc Ha • COD</Text>
            </View>
            <Text className="text-[13.5px] font-bold text-emerald-400">+345.000₫</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="gap-0.5">
              <Text className="text-[13.5px] font-medium">Sản phẩm mới trong kho</Text>
              <Text className="text-[11.5px] text-muted-foreground">Serum B5 SkinSense Tái Tạo</Text>
            </View>
            <View className="rounded-pill bg-purple-500/15 px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-purple-400">11 SP</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Enter Super Admin Portal Button */}
      <Animated.View entering={enter(4)}>
        <Pressable
          role="button"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/admin' as any);
          }}
          className="h-[52px] flex-row items-center justify-center gap-2.5 rounded-control bg-purple-600">
          <Icon as={ShieldCheck} size={19} className="text-white" />
          <Text className="text-[15px] font-semibold text-white">
            Vào Cổng Quản Trị Hệ Thống (Admin)
          </Text>
        </Pressable>
      </Animated.View>
    </Frame>
  );
}

// =========================================================================
// ROLE 4: SHOP ĐĂNG KÝ BÁN HÀNG WORKSTATION
// =========================================================================
function ShopTodayWorkstation({ user, date }: { user: AuthUser; date: string }) {
  const router = useRouter();
  const enter = useEnter();
  const isPending = user.shopStatus === 'pending';

  return (
    <Frame photo={false} date={date}>
      {/* Shop Partner Header Card */}
      <Animated.View entering={enter(1)} className={`gap-3 p-5 ${CARD}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="size-9 items-center justify-center rounded-pill bg-amber-500/15">
              <Icon as={Store} size={18} className="text-amber-400" />
            </View>
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Gian Hàng Đối Tác
              </Text>
              <Text className="text-[17px] font-semibold">
                {user.shopName || 'Gian Hàng SkinSense Partner'}
              </Text>
            </View>
          </View>
          {isPending ? (
            <View className="flex-row items-center gap-1.5 rounded-pill border border-warning/40 bg-warning/15 px-2.5 py-1">
              <Icon as={Clock} size={12} className="text-warning" />
              <Text className="text-[11px] font-semibold text-warning">Chờ duyệt</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1.5 rounded-pill border border-amber-500/30 bg-amber-500/10 px-2.5 py-1">
              <View className="size-2 rounded-full bg-amber-400" />
              <Text className="text-[11px] font-medium text-amber-400">Mở bán</Text>
            </View>
          )}
        </View>
        <Text className="text-[13px] text-muted-foreground">
          Chủ gian hàng: {user.fullName} • SĐT: {user.phoneNumber}
        </Text>

        {isPending && (
          <View className="rounded-control bg-warning/15 border border-warning/30 p-3.5 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Icon as={Clock} size={16} className="text-warning" />
              <Text className="text-[13px] font-bold text-warning">
                Hồ sơ gian hàng đang chờ Admin SkinSense duyệt
              </Text>
            </View>
            <Text className="text-[12px] text-muted-foreground leading-4">
              Sau khi được Admin phê duyệt, gian hàng sẽ được mở bán chính thức trên sàn Shopee Mall và hiển thị cho khách mua.
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Shop Metrics */}
      <Animated.View entering={enter(2)} className="flex-row gap-2.5">
        <View className={`flex-1 gap-1 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Doanh thu shop</Text>
          <Text className="font-display text-[26px] text-amber-400">395.000₫</Text>
          <Text className="text-[11px] text-muted-foreground">tháng này</Text>
        </View>
        <View className={`flex-1 gap-1 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Đơn cần gói</Text>
          <Text className="font-display text-[26px]">1 đơn</Text>
          <Text className="text-[11px] text-muted-foreground">chờ shipper lấy</Text>
        </View>
        <View className={`flex-1 gap-1 p-3.5 ${CARD}`}>
          <Text className={LABEL}>Sản phẩm</Text>
          <Text className="font-display text-[26px]">10 SP</Text>
          <Text className="text-[11px] text-muted-foreground">đang bày bán</Text>
        </View>
      </Animated.View>

      {/* Shop Orders Feed */}
      <Animated.View entering={enter(3)} className={`gap-3 p-4 ${CARD}`}>
        <Text className={LABEL}>Đơn đặt mua từ gian hàng của bạn</Text>
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between border-b border-border pb-2.5">
            <View className="gap-0.5">
              <Text className="text-[13.5px] font-medium">Effaclar Duo+M Giảm Mụn (x1)</Text>
              <Text className="text-[11.5px] text-muted-foreground">Mã: ORD-405503-9548 • COD</Text>
            </View>
            <View className="items-end">
              <Text className="text-[13.5px] font-semibold text-amber-400">395.000₫</Text>
              <Text className="text-[11px] text-emerald-400 font-medium">Đã giao</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="gap-0.5">
              <Text className="text-[13.5px] font-medium">Madagascar Centella Ampoule (x1)</Text>
              <Text className="text-[11.5px] text-muted-foreground">Mã: ORD-913038-9AAB • COD</Text>
            </View>
            <View className="items-end">
              <Text className="text-[13.5px] font-semibold text-amber-400">345.000₫</Text>
              <Text className="text-[11px] text-emerald-400 font-medium">Đã giao</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Enter Shop Management Portal Button */}
      <Animated.View entering={enter(4)}>
        <Pressable
          role="button"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/shop' as any);
          }}
          className="h-[52px] flex-row items-center justify-center gap-2.5 rounded-control bg-amber-600">
          <Icon as={Store} size={19} className="text-white" />
          <Text className="text-[15px] font-semibold text-white">
            Quản Trị Gian Hàng & Đăng Bán Sản Phẩm
          </Text>
        </Pressable>
      </Animated.View>
    </Frame>
  );
}

// =========================================================================
// CUSTOMER WORKSTATION
// =========================================================================
function CustomerToday() {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const enter = useEnter();
  const [today] = useState(() => localDay(new Date()));
  const [data, setData] = useState<TrendData | null>(); // undefined loading, null failed
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    // 90 days in one load: the streaks and the 7-day directions both derive from it.
    loadTrends(windowDays(90, today)[0]).then(setData, () => setData(null));
  }, [today, attempt]);

  const date = new Date(today).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

  if (data === undefined) {
    return (
      <Frame photo={false} date={date} loading>
        <Loading />
      </Frame>
    );
  }
  if (data === null) {
    return (
      <Frame photo={false} date={date}>
        <LoadState failed onRetry={() => { setData(undefined); retry(); }} />
      </Frame>
    );
  }

  const photoDay = new Map(data.photos.map((p) => [p.id, localDay(new Date(p.taken_at))]));
  const last = data.photos.at(-1);
  const tonight = last !== undefined && photoDay.get(last.id) === today;
  const week = windowDays(7, today);
  // ponytail: every Photo counts as camera-sourced until gallery import (spec row 25) adds photos.source.
  const captureDays = new Set(photoDay.values());
  const routineDays = new Set(data.entries.filter((e) => e.completed_labels.length > 0).map((e) => e.night));
  const latest = last ? data.readings.filter((r) => r.photo_id === last.id) : [];

  return (
    <Frame photo={last !== undefined} date={date}>
      {/* Glass over the photo (surface 72%, fg 14% border) without the canvas blur: no blur view is installed and it costs GPU. */}
      <Animated.View
        entering={enter(1)}
        className={`gap-4 p-5 ${last ? 'rounded-card border' : CARD}`}
        style={last ? { backgroundColor: `${palette.surface}B8`, borderColor: `${palette.fg}24` } : undefined}>
        <View className="gap-1.5">
          <Text role="heading" aria-level="2" className="font-display text-[28px] font-normal leading-[34px]">
            {tonight ? t('today.tonightSaved') : t('today.noTonight')}
          </Text>
          <Text className={`font-light text-muted-foreground ${last ? 'text-[13px]' : 'text-[13.5px] leading-[20px]'}`}>
            {last
              ? t('today.last', {
                  when: new Date(last.taken_at).toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                  count: data.spots.filter((s) => s.photo_id === last.id).length,
                })
              : t('today.noPhoto')}
          </Text>
        </View>
        <Link href="/capture" asChild>
          <Pressable role="button" className="h-[52px] flex-row items-center justify-center gap-2.5 rounded-control bg-primary">
            <Icon as={Camera} size={19} strokeWidth={1.5} className="text-primary-foreground" />
            <Text className="text-[15px] font-medium text-primary-foreground">{tonight ? t('today.captureAnother') : t('today.captureTonight')}</Text>
          </Pressable>
        </Link>
        {last && (
          <Link href={`/spots/${last.id}`} asChild>
            <Pressable role="button" className="-mt-2 min-h-11 justify-center">
              <Text className="text-sm underline">{t('today.markSpots')}</Text>
            </Pressable>
          </Link>
        )}
      </Animated.View>

      <Animated.View entering={enter(2)} className="flex-row gap-3">
        <StreakCard title={t('today.captureStreak')} days={captureDays} today={today} />
        <StreakCard title={t('today.routineStreak')} days={routineDays} today={today} success />
      </Animated.View>

      <Animated.View entering={enter(3)} className={CARD}>
        <RoutineChecklist embedded />
      </Animated.View>

      {last && (
        <Animated.View entering={enter(4)} className={`px-5 pb-3 pt-1.5 ${CARD}`}>
          <View className="flex-row items-center justify-between">
            <Text className={LABEL}>{t('today.redness7')}</Text>
            <Link href="/trends" asChild>
              <Pressable role="button" className="min-h-11 justify-center">
                <Text className="text-[13px] underline">{t('today.trends')}</Text>
              </Pressable>
            </Link>
          </View>
          {ZONES.map((zone, order) => {
            const reading = latest.find((r) => r.zone === zone);
            const series = dailySeries(
              week,
              data.readings.filter((r) => r.zone === zone).map((r) => ({ day: photoDay.get(r.photo_id)!, value: r.redness })),
            );
            const direction = trendDirection(series, FLAT_TOLERANCE);
            const good = direction === 'down';
            return (
              <View key={zone} className={`h-[42px] flex-row items-center border-t border-border ${order === ZONES.length - 1 ? 'border-b' : ''}`}>
                {reading && <ZoneBar share={rednessShare(reading.redness, latest.map((r) => r.redness))} good={good} order={order} />}
                <Text className="flex-1 text-[15px] font-light">{t(`capture.zones.${zone}`)}</Text>
                <Text className="w-14 text-right font-display text-[22px]">{reading ? reading.redness.toFixed(1) : '—'}</Text>
                <Text className={`w-[108px] text-right text-xs font-medium ${good ? 'text-success' : 'text-muted-foreground'}`}>
                  {direction ? t(`trends.${direction}`) : '—'}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      )}

      <RecommendedProductsSection
        title="Gợi ý sản phẩm cho bạn"
        subtitle="Mô hình AI đề xuất theo số đo vùng trán, má, mũi, cằm gần nhất"
      />
    </Frame>
  );
}

// =========================================================================
// MAIN TODAY EXPORT
// =========================================================================
export function Today() {
  const currentUser = useCurrentUser();
  const { i18n } = useTranslation();
  const date = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });

  // Role-based distinct workstations
  if (currentUser?.role === 'specialist') {
    return <SpecialistTodayWorkstation user={currentUser} date={date} />;
  }
  if (currentUser?.role === 'admin') {
    return <AdminTodayWorkstation user={currentUser} date={date} />;
  }
  if (currentUser?.role === 'shop') {
    return <ShopTodayWorkstation user={currentUser} date={date} />;
  }

  // Default customer workstation (Routine AI & Skin Telemetry)
  return <CustomerToday />;
}
