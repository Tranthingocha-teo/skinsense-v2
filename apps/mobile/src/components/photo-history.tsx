import { filterHistory, groupByMonth, historyTags, type HistoryFilter } from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ChevronLeft, Tag } from 'lucide-react-native';
import { useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { LoadState } from '@/components/load-state';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { loadHistory, type HistoryPhoto } from '@/lib/history';

// Same grouping, filters and copy as apps/web/src/components/photo-history.tsx; layout from AndroidHistory.
function Chip({ on, onPress, label, tag }: { on: boolean; onPress: () => void; label: string; tag?: boolean }) {
  return (
    <Pressable
      role="button"
      aria-selected={on}
      onPress={onPress}
      className={`h-11 flex-row items-center gap-1.5 rounded-control px-4 ${on ? 'bg-primary' : 'border border-border'}`}>
      {tag && <Icon as={Tag} size={15} strokeWidth={1.5} className={on ? 'text-primary-foreground' : 'text-muted-foreground'} />}
      <Text className={`text-sm ${on ? 'font-medium text-primary-foreground' : 'text-muted-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

const LABEL = 'text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground';
const PAD = 18;
const GAP = 6;

const usePalette = () => color[useColorScheme() === 'dark' ? 'dark' : 'light'];

// Canvas .tile: the photo (mirrored, ticket 07) over the placeholder gradient, date and spot count on a bg scrim.
// SVG gradients because the NativeWind tokens are HSL vars.
function Tile({ photo, size }: { photo: HistoryPhoto; size: number }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const date = new Date(photo.taken_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
  const spots = t('history.spots', { count: photo.spotCount });
  return (
    <Link href={`/photos/${photo.id}`} asChild>
      <Pressable accessibilityLabel={`${date}, ${spots}`} style={{ width: size, aspectRatio: 3 / 4 }} className="overflow-hidden rounded-[6px]">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} aria-hidden>
          <Defs>
            <LinearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette['photo-b']} />
              <Stop offset="1" stopColor={palette['photo-a']} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#tile)" />
        </Svg>
        {photo.url && <Image accessible={false} source={{ uri: photo.url }} style={[StyleSheet.absoluteFill, styles.mirrored]} contentFit="cover" />}
        {photo.tags.length > 0 && (
          <View className="absolute right-1.5 top-1.5" aria-hidden>
            <Icon as={Tag} size={14} strokeWidth={1.5} className="text-foreground" />
          </View>
        )}
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between px-[7px] pb-1.5 pt-4">
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} aria-hidden>
            <Defs>
              <LinearGradient id="tile-scrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.bg} stopOpacity={0} />
                <Stop offset="1" stopColor={palette.bg} stopOpacity={0.82} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#tile-scrim)" />
          </Svg>
          <Text className="text-[11px] font-medium">{date}</Text>
          <Text className="text-[11px] font-medium">{spots}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

export function PhotoHistory() {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const [photos, setPhotos] = useState<HistoryPhoto[] | null>(); // undefined loading, null failed
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);
  const [filter, setFilter] = useState<HistoryFilter>('all');

  useEffect(() => {
    let cancelled = false;
    loadHistory().then(
      (loaded) => !cancelled && setPhotos(loaded),
      () => !cancelled && setPhotos(null),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const shown = photos && filterHistory(photos, filter);
  const size = (width - 2 * PAD - 2 * GAP) / 3;
  const thisYear = new Date().getFullYear();

  return (
    <ScrollView contentContainerClassName="flex-grow px-[18px] pb-8 pt-4">
      <View className="-ml-2 flex-row items-center gap-1">
        <Link href="/settings" asChild>
          <Pressable role="button" aria-label={t('history.back')} className="size-11 items-center justify-center">
            <Icon as={ChevronLeft} size={23} strokeWidth={1.5} className="text-foreground" />
          </Pressable>
        </Link>
        <Text role="heading" aria-level="1" className="font-display text-[34px] font-light leading-[39px]">
          {t('history.title')}
        </Text>
      </View>

      {photos === undefined && <LoadState failed={false} onRetry={retry} />}
      {photos === null && (
        <LoadState
          failed
          onRetry={() => {
            setPhotos(undefined);
            retry();
          }}
        />
      )}
      {photos?.length === 0 && (
        <View className="my-auto items-center gap-5 px-6 pb-16">
          <Text className="text-center text-[15.5px] font-light leading-6">{t('today.noPhoto')}</Text>
          <Link href="/capture" asChild>
            <Pressable role="button" className="h-[52px] flex-row items-center justify-center rounded-control bg-primary px-6">
              <Text className="text-[15px] font-medium text-primary-foreground">{t('today.captureTonight')}</Text>
            </Pressable>
          </Link>
        </View>
      )}

      {!!photos?.length && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mr-[18px] pt-3" contentContainerClassName="gap-2 pr-[18px]">
          <Chip on={filter === 'all'} onPress={() => setFilter('all')} label={t('history.all')} />
          {historyTags(photos).map((tag) => (
            <Chip key={tag} tag on={typeof filter === 'object' && filter.tag === tag} onPress={() => setFilter({ tag })} label={tag} />
          ))}
          <Chip on={filter === 'note'} onPress={() => setFilter('note')} label={t('history.hasNote')} />
        </ScrollView>
      )}
      {!!photos?.length && shown!.length === 0 && (
        <Text className="py-16 text-center text-[15.5px] font-light leading-6">{t('history.noMatch')}</Text>
      )}

      {shown &&
        groupByMonth(shown).map(({ month, photos: list }) => {
          const [y, m] = month.split('-').map(Number);
          return (
            <View key={month}>
              <View className="flex-row items-center justify-between px-0.5 pb-2.5 pt-5">
                {/* Mid-month, so no timezone shift can move the label into a neighbouring month. */}
                <Text role="heading" aria-level="2" className={LABEL}>
                  {new Date(y, m - 1, 15).toLocaleDateString(i18n.language, { month: 'long', year: y === thisYear ? undefined : 'numeric' })}
                </Text>
                <Text className="text-[12.5px] font-light text-muted-foreground">{t('history.photos', { count: list.length })}</Text>
              </View>
              <View className="flex-row flex-wrap" style={{ gap: GAP }}>
                {list.map((photo) => (
                  <Tile key={photo.id} photo={photo} size={size} />
                ))}
              </View>
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ mirrored: { transform: [{ scaleX: -1 }] } });
