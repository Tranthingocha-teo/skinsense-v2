import {
  assignSpotToZone,
  boundingBox,
  fromFaceRelative,
  toFaceRelative,
  ZONES,
  type Landmark,
  type Point2D,
  type Zone,
} from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ChevronLeft, CircleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, useColorScheme, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { detectImage, loadEngine } from '@/lib/capture-engine';
import { loadPhoto, loadSpots, saveSpots } from '@/lib/photos';

// Same phases, copy and cover maths as apps/web/src/components/mark-spots.tsx;
// markers are 44dp Pressables instead of SVG so a tap on one removes it natively.
type Face = { width: number; height: number; landmarks: Landmark[] };
type Spot = Point2D & { zone: Zone }; // image-normalised while on screen; face-relative once stored
type Phase = 'loading' | 'ready' | 'noFace' | 'loadError' | 'saving' | 'saveError' | 'saved';
type Size = { width: number; height: number };

// AndroidSpots marker: a 44dp hit target holding a 30dp halo and a 13dp dot.
const HIT = 44;

// contentFit="cover" on the mirrored image: same scale and centring for taps and markers.
function cover(face: Face, view: Size) {
  const scale = Math.max(view.width / face.width, view.height / face.height);
  return { scale, dx: (view.width - face.width * scale) / 2, dy: (view.height - face.height * scale) / 2 };
}

export function MarkSpots({ photoId }: { photoId: string }) {
  const { t } = useTranslation();
  const [uri, setUri] = useState<string | null>(null);
  const [face, setFace] = useState<Face | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [outside, setOutside] = useState(false);
  const [view, setView] = useState<Size>({ width: 0, height: 0 });
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [engine, path, stored] = await Promise.all([loadEngine(), loadPhoto(photoId), loadSpots(photoId)]);
        if (cancelled) return;
        setUri(path);
        const { width, height, landmarks } = await detectImage(engine, path);
        if (cancelled) return;
        if (!landmarks) return setPhase('noFace');
        const box = boundingBox(landmarks);
        setFace({ width, height, landmarks });
        setSpots(stored.map((s) => ({ ...fromFaceRelative(s, box), zone: s.zone })));
        setPhase('ready');
      } catch {
        if (!cancelled) setPhase('loadError');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  function tap(e: GestureResponderEvent) {
    if (!face || phase === 'saving' || view.width === 0) return;
    const { scale, dx, dy } = cover(face, view);
    const { locationX, locationY } = e.nativeEvent;
    const point = { x: 1 - (locationX - dx) / scale / face.width, y: (locationY - dy) / scale / face.height }; // un-mirror
    const zone = assignSpotToZone(point, face.landmarks);
    setOutside(!zone);
    if (!zone) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSpots([...spots, { ...point, zone }]);
    setPhase('ready');
  }

  function remove(index: number) {
    setSpots(spots.filter((_, i) => i !== index));
    setOutside(false);
    setPhase('ready');
  }

  async function save() {
    if (!face) return;
    setPhase('saving');
    const box = boundingBox(face.landmarks);
    try {
      await saveSpots(photoId, spots.map((s) => ({ ...toFaceRelative(s, box), zone: s.zone })));
      setPhase('saved');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setPhase('saveError');
    }
  }

  const perZone = ZONES.map((zone) => [zone, spots.filter((s) => s.zone === zone).length] as const).filter(([, n]) => n > 0);
  const { scale, dx, dy } = face && view.width > 0 ? cover(face, view) : { scale: 0, dx: 0, dy: 0 };

  return (
    <ScrollView className="flex-1" contentContainerClassName="flex-grow pb-8" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center gap-1 pl-2.5 pr-[18px] pt-4">
        <Link href="/" asChild>
          <Pressable className="size-11 items-center justify-center" role="button" accessibilityLabel={t('markSpots.back')}>
            <Icon as={ChevronLeft} size={23} strokeWidth={1.5} className="text-foreground" />
          </Pressable>
        </Link>
        <Text role="heading" aria-level="1" className="flex-1 font-display text-[34px] font-light leading-[39px]">
          {t('markSpots.title')}
        </Text>
      </View>

      <View
        testID="photo"
        className="relative mx-5 mt-3 aspect-[3/4] overflow-hidden rounded-card bg-photo-a"
        onLayout={(e: LayoutChangeEvent) => setView(e.nativeEvent.layout)}
      >
        {/* Mirrored by style like the viewfinder (ticket 07's mirror rule); the file itself stays raw. */}
        {uri && <Image accessible={false} source={{ uri }} style={[StyleSheet.absoluteFill, styles.mirrored]} contentFit="cover" />}
        {face && (
          <Pressable
            testID="photo-canvas"
            role="button"
            accessibilityLabel={t('markSpots.tapHint')}
            onPress={tap}
            style={StyleSheet.absoluteFill}
          />
        )}
        {face &&
          spots.map((s, i) => (
            <Pressable
              key={i}
              role="button"
              accessibilityLabel={t('markSpots.remove')}
              onPress={() => remove(i)}
              className="absolute items-center justify-center"
              style={{
                left: (1 - s.x) * face.width * scale + dx - HIT / 2,
                top: s.y * face.height * scale + dy - HIT / 2,
                width: HIT,
                height: HIT,
              }}
            >
              <View className="absolute size-[30px] rounded-pill bg-primary opacity-[0.24]" />
              <View className="size-[13px] rounded-pill border-[1.5px] border-background bg-primary" />
            </Pressable>
          ))}
        {phase === 'loading' && (
          <View className="absolute inset-0 items-center justify-center p-10">
            <Text className="text-center text-[15px] font-light">{t('markSpots.loading')}</Text>
          </View>
        )}
        {(phase === 'noFace' || phase === 'loadError') && (
          <View className="absolute inset-0 items-center justify-center p-10" style={{ backgroundColor: `${palette.bg}8C` }}>
            <Text role="alert" className="text-center text-[15px] font-light leading-[23px]">
              {t(`markSpots.${phase}`)}
            </Text>
          </View>
        )}
      </View>

      {face && (
        <>
          <View className="flex-row items-center justify-center gap-2 px-5 pt-[18px]" role="status">
            {outside ? <Icon as={CircleAlert} size={16} strokeWidth={1.5} className="text-destructive" /> : <View className="size-2 rounded-pill bg-primary" />}
            <Text className="shrink text-center text-sm font-light text-muted-foreground">
              {outside ? t('markSpots.outside') : spots.length === 0 ? t('markSpots.none') : t('markSpots.count', { count: spots.length })}
            </Text>
          </View>
          {perZone.length > 0 && (
            <View className="flex-row flex-wrap justify-center gap-2 px-5 pt-3">
              {perZone.map(([zone, n]) => (
                <Text key={zone} className="rounded-control border border-border px-3 py-[5px] text-[13px]">
                  {t(`capture.zones.${zone}`)} <Text className="font-display text-[17px]">{n}</Text>
                </Text>
              ))}
            </View>
          )}
          <View className="mt-auto px-5 pb-8 pt-5">
            {phase === 'saveError' && (
              <View className="flex-row items-center justify-center gap-2 pb-3">
                <Icon as={CircleAlert} size={16} strokeWidth={1.5} className="text-destructive" />
                <Text role="alert" className="text-sm text-destructive">{t('markSpots.saveError')}</Text>
              </View>
            )}
            {phase === 'saved' ? (
              <>
                <Text className="pb-3 text-center text-sm font-medium text-success">{t('markSpots.saved')}</Text>
                <Link href="/" asChild>
                  <Button className={BUTTON}>
                    <Text className="text-[15px] font-medium">{t('markSpots.done')}</Text>
                  </Button>
                </Link>
              </>
            ) : (
              <Button className={BUTTON} onPress={save} disabled={phase === 'saving'}>
                <Text className="text-[15px] font-medium">{phase === 'saving' ? t('markSpots.saving') : t('markSpots.save')}</Text>
              </Button>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const BUTTON = 'h-[52px] rounded-control';

const styles = StyleSheet.create({ mirrored: { transform: [{ scaleX: -1 }] } });
