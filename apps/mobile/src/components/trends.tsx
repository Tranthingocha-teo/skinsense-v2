import {
  comparisonPair,
  dailySeries,
  localDay,
  photoDays,
  routineCompletionPercent,
  trendDirection,
  windowDays,
  ZONES,
  type DayPoint,
  type Zone,
} from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ChevronLeft, ChevronsLeftRight } from 'lucide-react-native';
import { useEffect, useReducer, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polyline, Rect, Stop } from 'react-native-svg';

import { CompareDates } from '@/components/compare-dates';
import { LoadState } from '@/components/load-state';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { loadTrends, signedPhotoUrls, type TrendData } from '@/lib/trends';

// Same series maths, chart geometry and copy as apps/web/src/components/trends.tsx;
// layout from the AndroidTrends artboard. SVG via react-native-svg (colours from
// tokens.json: SVG strokes take no className), the before/after drag via the RN responder system.
const X0 = 8, X1 = 320, Y0 = 18, Y1 = 140; // Trends artboard viewBox 328×160
export const FLAT_TOLERANCE = 0.1; // a* units; below this the line reads as steady
const LABEL = 'text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground';
const CARD = 'rounded-card border border-border bg-card';
const NUMBER = 'font-display text-[44px] font-light leading-[48px]';

const present = (series: DayPoint[]) => series.flatMap((p) => (p.value === null ? [] : [p.value]));

function chart(series: DayPoint[]) {
  const values = present(series);
  const min = Math.min(0, ...values);
  const max = Math.max(min + 1, ...values);
  const n = Math.max(series.length - 1, 1);
  const y = (v: number) => Y1 - ((v - min) / (max - min)) * (Y1 - Y0);
  const points = series.flatMap((p, i) =>
    p.value === null ? [] : [{ day: p.day, value: p.value, x: X0 + (i / n) * (X1 - X0), y: y(p.value) }],
  );
  // Adjacent present days join; a gap in the data is a gap in the line.
  const indexOf = new Map(series.map((p, i) => [p.day, i]));
  const path = points
    .map((p, i) => (i > 0 && indexOf.get(p.day)! - indexOf.get(points[i - 1].day)! === 1 ? 'L' : 'M') + `${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  return { points, path, zeroY: y(0) };
}

export function Trends() {
  const { t, i18n } = useTranslation();
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [today] = useState(() => localDay(new Date()));
  const [days, setDays] = useState<7 | 30>(7);
  const [zone, setZone] = useState<Zone>('forehead');
  const [data, setData] = useState<TrendData | null>(); // undefined loading, null failed
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);
  const [split, setSplit] = useState(50);
  const [compareWidth, setCompareWidth] = useState(0);
  // The user's two days; unset (or without Photos in this window) keeps the first/last pair.
  const [chosen, setChosen] = useState<[string, string]>();
  const pair = data ? comparisonPair(data.photos, chosen) : null;
  const pairKey = pair ? `${pair.before.storage_path}|${pair.after.storage_path}` : '';
  const [signed, setSigned] = useState<{ key: string; urls: string[] }>();
  const urls = signed?.key === pairKey ? signed.urls : [];

  useEffect(() => {
    let cancelled = false;
    loadTrends(windowDays(days, today)[0])
      .then((loaded) => !cancelled && setData(loaded))
      // Only a first load fails the screen; a window switch keeps what is shown.
      .catch(() => !cancelled && setData((d) => d ?? null));
    return () => {
      cancelled = true;
    };
  }, [today, days, attempt]);

  useEffect(() => {
    if (!pairKey) return;
    let cancelled = false;
    // A failed signing leaves the placeholder gradient under the date pills.
    signedPhotoUrls(pairKey.split('|')).then((u) => !cancelled && setSigned({ key: pairKey, urls: u }), () => {});
    return () => {
      cancelled = true;
    };
  }, [pairKey]);

  if (!data) return <LoadState failed={data === null} onRetry={() => { setData(undefined); retry(); }} />;

  const window = windowDays(days, today);
  const photoDay = new Map(data.photos.map((p) => [p.id, localDay(new Date(p.taken_at))]));
  const redness = dailySeries(
    window,
    data.readings.filter((r) => r.zone === zone).map((r) => ({ day: photoDay.get(r.photo_id)!, value: r.redness })),
  );
  // A day's spot count is its latest photo's count (the marked record), not a
  // mean over retakes; redness does average, since retakes only add noise.
  const lastPhotoOfDay = new Map(data.photos.map((p) => [photoDay.get(p.id)!, p.id]));
  const spotCount = dailySeries(
    window,
    [...lastPhotoOfDay].map(([day, id]) => ({ day, value: data.spots.filter((s) => s.photo_id === id && s.zone === zone).length })),
  );
  // Adherence over every night since the first ticked night in the window: a
  // night without an entry is 0%, not skipped; nights before the user started are.
  const routineDays = dailySeries(
    window,
    data.entries.map((e) => ({ day: e.night, value: routineCompletionPercent(e.completed_labels.length, e.item_count) })),
  );
  const nights = routineDays.slice(routineDays.findIndex((p) => p.value !== null));
  const routinePercent = nights.length ? Math.round(nights.reduce((sum, p) => sum + (p.value ?? 0), 0) / nights.length) : 0;

  const line = chart(redness);
  const last = line.points.at(-1);
  const direction = trendDirection(redness, FLAT_TOLERANCE);
  const latestSpots = present(spotCount).at(-1);
  const spotPoints = spotCount.flatMap((p, i) => (p.value === null ? [] : [{ x: 2 + (i / Math.max(window.length - 1, 1)) * 76, v: p.value }]));
  const spotMax = Math.max(1, ...spotPoints.map((p) => p.v));
  const labelAt = (i: number) => days === 7 || (days - 1 - i) % 7 === 0; // 30 days: weekly, anchored on today
  const dayLabel = (day: string) =>
    new Date(day + 'T00:00:00').toLocaleDateString(i18n.language, days === 7 ? { weekday: 'short' } : { day: 'numeric', month: 'numeric' });
  const pill = (iso: string) => new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
  const zoneName = t(`capture.zones.${zone}`);
  // Web's sr-only series table, as the hint TalkBack reads after the chart label.
  const series = (points: DayPoint[], digits: number) =>
    points.flatMap((p) => (p.value === null ? [] : [`${dayLabel(p.day)}: ${p.value.toFixed(digits)}`])).join(', ');
  const select = () => void Haptics.selectionAsync().catch(() => {});
  // Canvas bg 60% / fg 30% over the photo: hex alpha, since NativeWind opacity modifiers are not trusted here (ticket 03).
  const scrim = { backgroundColor: `${palette.bg}99` };

  // The transparent overlay is the touch target, so locationX is relative to the whole image.
  const drag = (e: GestureResponderEvent) => {
    if (compareWidth > 0) setSplit(Math.min(100, Math.max(0, (e.nativeEvent.locationX / compareWidth) * 100)));
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
    <ScrollView contentContainerClassName="gap-3 px-[18px] pb-8 pt-4">
      <View className="-ml-2 flex-row items-center gap-1">
        <Link href="/" asChild>
          <Pressable className="size-11 items-center justify-center" role="button" accessibilityLabel={t('trends.back')}>
            <Icon as={ChevronLeft} size={23} strokeWidth={1.5} className="text-foreground" />
          </Pressable>
        </Link>
        <Text role="heading" aria-level="1" className="flex-1 font-display text-[38px] font-light leading-[44px]">
          {t('trends.title')}
        </Text>
        <ToggleGroup type="single" value={String(days)} onValueChange={(v) => v && setDays(Number(v) as 7 | 30)} className="rounded-control border border-border">
          {([7, 30] as const).map((n) => (
            <ToggleGroupItem
              key={n}
              value={String(n)}
              testID={`days-${n}`}
              onPress={select}
              className={`h-11 rounded-control px-3 active:bg-transparent ${days === n ? 'bg-primary' : 'bg-transparent'}`}>
              <Text className={`text-[12.5px] ${days === n ? 'font-medium text-primary-foreground' : 'font-normal text-muted-foreground'}`}>{t(`trends.days${n}`)}</Text>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-[18px]" contentContainerClassName="px-[18px]">
        <ToggleGroup type="single" value={zone} onValueChange={(v) => v && setZone(v as Zone)} className="gap-2">
          {ZONES.map((z) => (
            <ToggleGroupItem
              key={z}
              value={z}
              onPress={select}
              className={`h-11 rounded-control px-4 active:bg-transparent ${zone === z ? 'bg-primary' : 'border border-border bg-transparent'}`}>
              <Text className={`text-sm ${zone === z ? 'font-medium text-primary-foreground' : 'font-normal text-muted-foreground'}`}>{t(`capture.zones.${z}`)}</Text>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ScrollView>

      {/* Solid, not the canvas glass: no blur on Android (ticket 02, DESIGN.md GPU cost). */}
      <View className={`${CARD} gap-2 px-5 pb-3 pt-[18px]`}>
        <View className="flex-row items-baseline justify-between gap-3">
          <Text className={LABEL}>{t('trends.redness', { zone: zoneName })}</Text>
          {direction && (
            <Text className={`text-xs font-medium ${direction === 'down' ? 'text-success' : 'text-muted-foreground'}`}>{t(`trends.${direction}`)}</Text>
          )}
        </View>
        {line.points.length === 0 ? (
          <View className="h-[190px] items-center justify-center">
            <Text className="text-sm font-light text-muted-foreground">{t('trends.noData')}</Text>
          </View>
        ) : (
          <>
            <View role="img" accessibilityLabel={t('trends.chartLabel', { zone: zoneName, count: line.points.length })} accessibilityHint={series(redness, 1)}>
              <Svg viewBox="0 0 328 160" style={styles.chart}>
                <Line x1={X0} x2={X1} y1={Y0} y2={Y0} stroke={palette.line} />
                <Line x1={X0} x2={X1} y1={line.zeroY} y2={line.zeroY} stroke={palette.muted} strokeDasharray="2 3" />
                <Path d={line.path} fill="none" stroke={palette.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                {line.points.map((p) => (
                  <Circle key={p.day} cx={p.x} cy={p.y} r={4} fill={p === last ? palette.accent : palette.surface} stroke={palette.accent} strokeWidth={2} />
                ))}
              </Svg>
            </View>
            <Text className="self-end rounded-pill border border-border px-2.5 py-[3px] text-[11.5px]">
              <Trans i18nKey="trends.latest" values={{ value: last!.value.toFixed(1) }} components={{ v: <Text className="font-display text-[17px]" /> }} />
            </Text>
            <View className="flex-row justify-between">
              {window.map((day, i) => (
                <Text key={day} numberOfLines={1} className="text-[11px] font-light text-muted-foreground" style={labelAt(i) ? undefined : styles.hidden}>
                  {dayLabel(day)}
                </Text>
              ))}
            </View>
          </>
        )}
      </View>

      <View className="flex-row gap-3">
        <View className={`${CARD} flex-1 px-[18px] py-3.5`}>
          <Text className={LABEL}>{t('trends.spots')}</Text>
          {latestSpots === undefined ? (
            <Text className={NUMBER}>—</Text>
          ) : (
            <>
              <Text className={NUMBER}>
                {Math.round(latestSpots)}
                <Text className="font-body text-[13px] font-light text-muted-foreground"> {t('trends.spotsUnit', { zone: zoneName })}</Text>
              </Text>
              <Svg viewBox="0 0 80 24" width={64} height={20} role="img" accessibilityLabel={t('trends.spots')} accessibilityHint={series(spotCount, 0)}>
                <Polyline
                  points={spotPoints.map((p) => `${p.x.toFixed(1)},${(20 - (p.v / spotMax) * 16).toFixed(1)}`).join(' ')}
                  fill="none"
                  stroke={palette.muted}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </>
          )}
        </View>
        <View className={`${CARD} flex-1 px-[18px] py-3.5`}>
          <Text className={LABEL}>{t('trends.routine')}</Text>
          <Text className={`${NUMBER} text-success`}>{routinePercent}%</Text>
          <View className="mt-3 h-px bg-border">
            <View className="h-px bg-success" style={{ width: `${routinePercent}%` }} />
          </View>
        </View>
      </View>

      <View className={`${CARD} gap-3 p-5 pt-[18px]`}>
        <View className="flex-row items-center justify-between gap-3">
          <Text className={LABEL}>{t('trends.compare')}</Text>
          {pair && (
            <CompareDates
              photoDays={photoDays(window, data.photos)}
              firstDay={window[0]}
              today={today}
              value={[localDay(new Date(pair.before.taken_at)), localDay(new Date(pair.after.taken_at))]}
              onChange={setChosen}
            />
          )}
        </View>
        {pair ? (
          <View
            className="relative aspect-video overflow-hidden rounded-[10px]"
            onLayout={(e: LayoutChangeEvent) => setCompareWidth(e.nativeEvent.layout.width)}
          >
            {/* Labelled photo placeholder gradient (DESIGN.md) until the signed URLs arrive. */}
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} aria-hidden>
              <Defs>
                <LinearGradient id="photo" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={palette['photo-b']} />
                  <Stop offset="1" stopColor={palette['photo-a']} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#photo)" />
            </Svg>
            {urls.length === 2 && (
              <>
                <Image accessible={false} source={{ uri: urls[0] }} style={[StyleSheet.absoluteFill, styles.mirrored]} contentFit="cover" />
                {/* "After" shows right of the split: a clipping box from split% to the edge, the image pinned to the box's left. */}
                <View style={[StyleSheet.absoluteFill, { left: `${split}%`, overflow: 'hidden' }]}>
                  <Image
                    accessible={false}
                    source={{ uri: urls[1] }}
                    style={[StyleSheet.absoluteFill, styles.mirrored, { width: compareWidth, left: -(split / 100) * compareWidth }]}
                    contentFit="cover"
                  />
                </View>
              </>
            )}
            <Text className="absolute left-2.5 top-2.5 rounded-pill px-2.5 py-[3px] text-[11px] font-medium tracking-[0.66px]" style={scrim}>{pill(pair.before.taken_at)}</Text>
            <Text className="absolute right-2.5 top-2.5 rounded-pill px-2.5 py-[3px] text-[11px] font-medium tracking-[0.66px]" style={scrim}>{pill(pair.after.taken_at)}</Text>
            <View pointerEvents="none" className="absolute bottom-0 top-0 w-px bg-foreground" style={{ left: `${split}%` }} />
            <View
              pointerEvents="none"
              className="absolute top-1/2 size-11 items-center justify-center rounded-pill border"
              style={[scrim, { borderColor: `${palette.fg}4D`, left: `${split}%`, marginLeft: -22, marginTop: -22 }]}>
              <Icon as={ChevronsLeftRight} size={18} strokeWidth={1.5} className="text-foreground" />
            </View>
            {/* Whole-image drag target (≥44dp everywhere); screen readers step it by 10. */}
            <View
              testID="compare-slider"
              role="slider"
              accessibilityLabel={t('trends.slider')}
              accessibilityValue={{ min: 0, max: 100, now: Math.round(split) }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) => setSplit(Math.min(100, Math.max(0, split + (e.nativeEvent.actionName === 'increment' ? 10 : -10))))}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={drag}
              onResponderMove={drag}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : (
          <View className="aspect-video items-center justify-center rounded-[10px] border border-dashed border-border px-6">
            <Text className="text-center text-sm font-light text-muted-foreground">{t('trends.compareHint')}</Text>
          </View>
        )}
      </View>

      <Text className="text-center text-[11.5px] font-light text-muted-foreground">{t('trends.disclaimer')}</Text>
    </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chart: { width: '100%', aspectRatio: 328 / 160 },
  hidden: { opacity: 0, width: 0 },
  mirrored: { transform: [{ scaleX: -1 }] },
});
