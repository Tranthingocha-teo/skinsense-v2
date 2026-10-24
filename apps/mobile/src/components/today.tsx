import { dailySeries, localDay, rednessShare, streak, trendDirection, windowDays, ZONES } from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import { Link } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useEffect, useReducer, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, useColorScheme, View } from 'react-native';
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

// DESIGN.md zone bar: the hairline under the row is the track, filled to the zone's share of tonight's
// highest reading over 700ms ease-out cubic, 420ms + 80ms per row after the cards; reduced motion jumps.
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

export function Today() {
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
