import {
  dailySeries,
  localDay,
  rednessShare,
  streak,
  trendDirection,
  windowDays,
  ZONES,
} from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import * as Haptics from 'expo-haptics';
import { Link, useRouter, type Href } from 'expo-router';
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  FileText,
  FlaskConical,
  LogOut,
  Package,
  Send,
  ShieldCheck,
  Stethoscope,
  Store,
  X,
} from 'lucide-react-native';
import { useEffect, useReducer, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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

import { BuyerOrdersModal } from '@/components/buyer-orders';
import { LoadState } from '@/components/load-state';
import { Mark } from '@/components/mark';
import { RecommendedProductsSection } from '@/components/recommended-products';
import { AdminTodayWorkstation, ShopTodayWorkstation } from '@/components/role-workstations';
import { RoutineChecklist } from '@/components/routine-checklist';
import { SpecialistPortal } from '@/components/specialist-portal';
import { FLAT_TOLERANCE } from '@/components/trends';
import { Icon } from '@/components/ui/icon';
import { BottomSheetFrame } from '@/components/ui/portal-chrome';
import { Text } from '@/components/ui/text';
import { submitClinicalRecordRemote } from '@/lib/api';
import { uploadPhotoToCloudinary } from '@/lib/history';
import * as auth from '@/lib/auth';
import { useCurrentUser, type AuthUser, type StaffTodayViewMode } from '@/lib/auth';
import { useDemoActive } from '@/lib/demo';
import { loadTrends, type TrendData } from '@/lib/trends';

// Same derivations as apps/web/src/components/today.tsx; layout from the AndroidToday,
// AndroidFirstRun, AndroidLoading and AndroidLoadError artboards.
const CARD = 'rounded-card border border-border/80 bg-card shadow-xs';
const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground';

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
// CUSTOMER WORKSTATION
// =========================================================================
function CustomerToday({ user }: { user: AuthUser | null }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const router = useRouter();
  const enter = useEnter();
  const { bottom } = useSafeAreaInsets();
  const [today] = useState(() => localDay(new Date()));
  const [data, setData] = useState<TrendData | null>(); // undefined loading, null failed
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showClinicalExportModal, setShowClinicalExportModal] = useState(false);
  const [clinicalSymptoms, setClinicalSymptoms] = useState('');
  const [clinicalAllergies, setClinicalAllergies] = useState('');
  const [clinicalSkinType, setClinicalSkinType] = useState('Hỗn hợp thiên dầu');
  const [clinicalPhone, setClinicalPhone] = useState('');
  const [exportingClinical, setExportingClinical] = useState(false);
  const [exportedCaseCode, setExportedCaseCode] = useState<string | null>(null);

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
  const latestSpots = last ? data.spots.filter((s) => s.photo_id === last.id) : [];

  function handleOpenClinicalExport() {
    setExportedCaseCode(null);
    if (!clinicalPhone && user?.phoneNumber) setClinicalPhone(user.phoneNumber);
    if (!clinicalSymptoms) {
      const highZones = latest
        .filter((r) => r.redness >= 1.8)
        .map((r) => r.zone);
      setClinicalSymptoms(
        highZones.length > 0
          ? `Chỉ số mẩn đỏ tăng tại vùng: ${highZones.join(', ')} (${latestSpots.length} nốt mụn)`
          : 'Da nhạy cảm, cần bác sĩ kiểm tra và đề xuất routine phù hợp',
      );
    }
    setShowClinicalExportModal(true);
  }

  async function handleSubmitClinicalRecord() {
    if (!clinicalSymptoms.trim() || exportingClinical) return;
    setExportingClinical(true);
    const avgRedness =
      latest.length > 0
        ? Math.min(95, Math.round((latest.reduce((acc, r) => acc + r.redness, 0) / latest.length) * 20))
        : 35;
    const skinPhotoUrl = last ? await uploadPhotoToCloudinary(last.storage_path, last.id) : undefined;
    const res = await submitClinicalRecordRemote({
      skinPhotoUrl,
      patientName: user?.fullName || 'Khách hàng SkinSense',
      patientEmail: user?.email,
      phone: clinicalPhone || user?.phoneNumber,
      skinType: clinicalSkinType,
      symptoms: clinicalSymptoms.trim(),
      allergies: clinicalAllergies.trim() || 'Không ghi nhận',
      rednessIndex: avgRedness,
      spotsCount: latestSpots.length,
      affectedZones: latest.map((r) => r.zone),
    });
    setExportingClinical(false);
    if (res.ok && res.caseCode) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setExportedCaseCode(res.caseCode);
    }
  }

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
                  count: latestSpots.length,
                })
              : t('today.noPhoto')}
          </Text>
        </View>
        <Link href="/capture" asChild>
          <Pressable role="button" className="h-[52px] flex-row items-center justify-center gap-2.5 rounded-[14px] bg-primary active:scale-[0.99]">
            <Icon as={Camera} size={19} strokeWidth={1.5} className="text-primary-foreground" />
            <Text className="text-[15px] font-medium text-primary-foreground">{tonight ? t('today.captureAnother') : t('today.captureTonight')}</Text>
          </Pressable>
        </Link>
        {last && (
          <Link href={`/spots/${last.id}`} asChild>
            <Pressable role="button" className="-mt-1.5 min-h-11 justify-center">
              <Text className="text-sm underline">{t('today.markSpots')}</Text>
            </Pressable>
          </Link>
        )}
      </Animated.View>

      {/* Editorial Bento Quick Actions: Storefront, Prescribed Routine, Buyer Orders, Clinical Export */}
      <Animated.View entering={enter(2)} className="gap-2.5">
        <View className="flex-row gap-2.5">
          <Link href={'/store' as Href} asChild>
            <Pressable
              role="button"
              className="flex-1 justify-between gap-2.5 rounded-[18px] border border-border/80 bg-card p-4 active:scale-[0.98]"
            >
              <View className="flex-row items-center justify-between">
                <View className="size-9 items-center justify-center rounded-[12px] border border-border/70 bg-surface-2">
                  <Icon as={FlaskConical} size={17} strokeWidth={1.6} className="text-foreground" />
                </View>
                <Icon as={ChevronRight} size={15} className="text-muted-foreground" />
              </View>
              <View className="gap-0.5">
                <Text className="text-[14px] font-semibold text-foreground">Sàn & Xếp Routine</Text>
                <Text numberOfLines={1} className="text-[11.5px] font-light text-muted-foreground">
                  Hoạt chất · Check xung đột
                </Text>
              </View>
            </Pressable>
          </Link>

          <Link href={'/prescribed' as Href} asChild>
            <Pressable
              role="button"
              className="flex-1 justify-between gap-2.5 rounded-[18px] border border-border/80 bg-card p-4 active:scale-[0.98]"
            >
              <View className="flex-row items-center justify-between">
                <View className="size-9 items-center justify-center rounded-[12px] border border-success/25 bg-success/10">
                  <Icon as={Stethoscope} size={17} strokeWidth={1.6} className="text-success" />
                </View>
                <Icon as={ChevronRight} size={15} className="text-muted-foreground" />
              </View>
              <View className="gap-0.5">
                <Text className="text-[14px] font-semibold text-foreground">Phác Đồ Bác Sĩ</Text>
                <Text numberOfLines={1} className="text-[11.5px] font-light text-muted-foreground">
                  Đơn kê & Trạng thái BA
                </Text>
              </View>
            </Pressable>
          </Link>
        </View>

        <Pressable
          role="button"
          accessibilityLabel="Đơn Mua Của Tôi"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowOrdersModal(true);
          }}
          className="flex-row items-center justify-between gap-2.5 rounded-[16px] border border-border/80 bg-card px-4 py-3.5 active:scale-[0.99]"
        >
          <View className="flex-1 flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-[12px] border border-border/70 bg-surface-2">
              <Icon as={Package} size={17} strokeWidth={1.6} className="text-foreground" />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-[13.5px] font-semibold text-foreground">
                Đơn Mua Của Tôi (SkinSense Mall)
              </Text>
              <Text numberOfLines={1} className="text-[11.5px] font-light text-muted-foreground">
                Theo dõi vận đơn, đánh giá 5 sao & quản lý đơn
              </Text>
            </View>
          </View>
          <View className="shrink-0 rounded-full border border-border bg-surface-2 px-3 py-1">
            <Text className="text-[11px] font-semibold text-foreground">Xem</Text>
          </View>
        </Pressable>

        <Pressable
          role="button"
          onPress={handleOpenClinicalExport}
          className="flex-row items-center justify-between gap-2.5 rounded-[16px] border border-border/80 bg-card px-4 py-3.5 active:scale-[0.99]"
        >
          <View className="flex-1 flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-[12px] border border-success/25 bg-success/10">
              <Icon as={FileText} size={17} strokeWidth={1.6} className="text-success" />
            </View>
            <View className="flex-1">
              <Text className="text-[13.5px] font-semibold text-foreground">Xuất bệnh án gửi Bác sĩ</Text>
              <Text className="text-[11.5px] font-light text-muted-foreground">
                Đóng gói số đo AI 5 vùng & triệu chứng nhận phác đồ
              </Text>
            </View>
          </View>
          <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
        </Pressable>
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

      <BuyerOrdersModal
        visible={showOrdersModal}
        onClose={() => setShowOrdersModal(false)}
      />

      {/* Clinical Record Export Modal */}
      <Modal visible={showClinicalExportModal} animationType="slide" transparent>
        <BottomSheetFrame bottomInset={bottom} maxHeightClass="max-h-[86%]">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-success">
                Xuất hồ sơ da liễu AI
              </Text>
              <Text className="font-display text-[20px] font-normal text-foreground">
                Gửi bệnh án tới Bác sĩ
              </Text>
            </View>
            <Pressable
              onPress={() => setShowClinicalExportModal(false)}
              className="size-9 items-center justify-center rounded-[12px] border border-border bg-surface-2"
            >
              <Icon as={X} size={17} className="text-muted-foreground" />
            </Pressable>
          </View>

          {exportedCaseCode ? (
            <View className="items-center gap-3 py-4">
              <Icon as={CheckCircle2} size={36} className="text-success" />
              <Text className="font-display text-[20px] font-normal text-foreground">
                Đã xuất bệnh án {exportedCaseCode}
              </Text>
              <Text className="text-center text-[13px] leading-5 text-muted-foreground">
                Hồ sơ da liễu và chỉ số 5 vùng mặt đã được chuyển tới hàng đợi của Bác sĩ chuyên khoa.
              </Text>
              <Pressable
                onPress={() => {
                  setShowClinicalExportModal(false);
                  router.push('/prescribed' as any);
                }}
                className="mt-2 h-12 w-full items-center justify-center rounded-[13px] bg-primary"
              >
                <Text className="text-[14px] font-semibold text-primary-foreground">
                  Theo dõi bệnh án & Phác đồ
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 pb-2">
              <View className="gap-1.5">
                <Text className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Triệu chứng & vùng da đang gặp vấn đề *
                </Text>
                <TextInput
                  value={clinicalSymptoms}
                  onChangeText={setClinicalSymptoms}
                  multiline
                  numberOfLines={3}
                  placeholder="Ví dụ: Nổi mụn viêm vùng cằm, ửng đỏ hai má khi dùng acid..."
                  placeholderTextColor="#888"
                  className="min-h-[82px] rounded-[13px] border border-border/90 bg-surface-2 p-3.5 text-[13.5px] text-foreground"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Loại da nền
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {['Dầu mụn', 'Hỗn hợp thiên dầu', 'Khô nhạy cảm', 'Thường'].map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setClinicalSkinType(type)}
                      className={`rounded-full border px-3.5 py-1.5 ${
                        clinicalSkinType === type ? 'border-foreground bg-foreground' : 'border-border bg-surface-2'
                      }`}
                    >
                      <Text
                        className={`text-[12px] ${
                          clinicalSkinType === type ? 'font-semibold text-background' : 'text-foreground'
                        }`}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Tiền sử dị ứng hoạt chất
                </Text>
                <TextInput
                  value={clinicalAllergies}
                  onChangeText={setClinicalAllergies}
                  placeholder="Không có / Dị ứng BHA, hương liệu..."
                  placeholderTextColor="#888"
                  className="h-11 rounded-[13px] border border-border/90 bg-surface-2 px-3.5 text-[13.5px] text-foreground"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Số điện thoại liên hệ (tuỳ chọn)
                </Text>
                <TextInput
                  value={clinicalPhone}
                  onChangeText={setClinicalPhone}
                  keyboardType="phone-pad"
                  placeholder="09xx xxx xxx"
                  placeholderTextColor="#888"
                  className="h-11 rounded-[13px] border border-border/90 bg-surface-2 px-3.5 text-[13.5px] text-foreground"
                />
              </View>

              <Pressable
                disabled={exportingClinical || !clinicalSymptoms.trim()}
                onPress={() => void handleSubmitClinicalRecord()}
                className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-[13px] bg-emerald-600 active:scale-[0.99] disabled:opacity-50"
              >
                {exportingClinical ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Icon as={Send} size={15} className="text-white" />
                )}
                <Text className="text-[14px] font-semibold text-white">Gửi hồ sơ tới Bác sĩ</Text>
              </Pressable>
            </ScrollView>
          )}
        </BottomSheetFrame>
      </Modal>
    </Frame>
  );
}

// =========================================================================
// MAIN TODAY EXPORT
// =========================================================================
export function Today() {
  const currentUser = useCurrentUser();
  const isDemo = useDemoActive();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const date = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });

  const [fallbackMode, setFallbackMode] = useState<StaffTodayViewMode>('workstation');
  const sharedModeTuple =
    typeof auth.useStaffTodayViewMode === 'function' ? auth.useStaffTodayViewMode() : null;
  const viewMode = sharedModeTuple ? sharedModeTuple[0] : fallbackMode;
  const setViewMode = sharedModeTuple ? sharedModeTuple[1] : setFallbackMode;

  const isStaff =
    !isDemo &&
    (currentUser?.role === 'specialist' ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'shop');

  if (!isStaff || !currentUser) {
    return <CustomerToday user={isDemo ? null : currentUser} />;
  }

  const roleMeta =
    currentUser.role === 'admin'
      ? {
          portalLabel: 'Cổng Admin',
          workstationTab: 'Bàn Quản Trị',
          portalHref: '/admin' as Href,
          icon: ShieldCheck,
          accent: 'text-amber-500',
        }
      : currentUser.role === 'specialist'
        ? {
            portalLabel: 'Cổng Bác sĩ',
            workstationTab: 'Ca Bệnh',
            portalHref: '/specialist' as Href,
            icon: Stethoscope,
            accent: 'text-emerald-500',
          }
        : {
            portalLabel: 'Cổng Shop',
            workstationTab: 'Quản Lý Shop',
            portalHref: '/shop' as Href,
            icon: Store,
            accent: 'text-amber-500',
          };

  return (
    <View className="flex-1 bg-background">
      {/* Staff Role & Skin Analysis Mode Switcher Bar */}
      <View
        style={{ paddingTop: Math.max(top, 10) + 4 }}
        className="flex-row items-center justify-between gap-2 border-b border-border/80 bg-card px-3.5 pb-2.5"
      >
        <View className="flex-row items-center gap-1.5 rounded-full border border-border/80 bg-surface-2 p-1">
          <Pressable
            role="button"
            accessibilityLabel="Trang Soi Da AI"
            onPress={() => setViewMode('skin')}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
              viewMode === 'skin' ? 'bg-primary' : ''
            }`}
          >
            <Icon
              as={Camera}
              size={13}
              className={viewMode === 'skin' ? 'text-primary-foreground' : 'text-muted-foreground'}
            />
            <Text
              className={`text-[11.5px] font-semibold ${
                viewMode === 'skin' ? 'text-primary-foreground' : 'text-foreground'
              }`}
            >
              Trang Soi Da AI
            </Text>
          </Pressable>
          <Pressable
            role="button"
            accessibilityLabel={roleMeta.workstationTab}
            onPress={() => setViewMode('workstation')}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
              viewMode === 'workstation' ? 'bg-primary' : ''
            }`}
          >
            <Icon
              as={roleMeta.icon}
              size={13}
              className={viewMode === 'workstation' ? 'text-primary-foreground' : roleMeta.accent}
            />
            <Text
              className={`text-[11.5px] font-semibold ${
                viewMode === 'workstation' ? 'text-primary-foreground' : 'text-foreground'
              }`}
            >
              {roleMeta.workstationTab}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Pressable
            role="button"
            accessibilityLabel={`Mở ${roleMeta.portalLabel}`}
            onPress={() => router.push(roleMeta.portalHref)}
            className="h-8 items-center justify-center rounded-full border border-border/80 bg-surface-2 px-2.5 active:scale-[0.97]"
          >
            <Text className={`text-[11px] font-semibold ${roleMeta.accent}`}>
              {roleMeta.portalLabel} →
            </Text>
          </Pressable>
          <Pressable
            role="button"
            accessibilityLabel="Đăng xuất nhanh"
            onPress={async () => {
              if (typeof auth.signOut === 'function') await auth.signOut();
              router.replace('/sign-in' as Href);
            }}
            className="size-8 items-center justify-center rounded-full border border-border/80 bg-surface-2 active:scale-[0.96]"
          >
            <Icon as={LogOut} size={13} className="text-destructive" />
          </Pressable>
        </View>
      </View>

      {viewMode === 'skin' ? (
        <CustomerToday user={currentUser} />
      ) : currentUser.role === 'specialist' ? (
        <SpecialistPortal embedded />
      ) : currentUser.role === 'admin' ? (
        <AdminTodayWorkstation user={currentUser} date={date} />
      ) : (
        <ShopTodayWorkstation user={currentUser} date={date} />
      )}
    </View>
  );
}
