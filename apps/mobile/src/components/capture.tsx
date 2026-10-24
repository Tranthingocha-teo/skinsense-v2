import { ZONES, type CaptureIssue } from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import { CameraOff, Check, ChevronLeft, CircleAlert } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, useColorScheme, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import {
  CommonResolutions,
  useCameraPermission,
  usePhotoOutput,
  type CameraPhotoOutput,
  type CameraRef,
} from 'react-native-vision-camera';
import { Camera, type Face } from 'react-native-vision-camera-face-detector';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  captureStill,
  liveIssues,
  loadEngine,
  sampleBrightness,
  type Engine,
  type LiveFace,
  type Still,
} from '@/lib/capture-engine';
import { latestPhotoUrl, savePhoto } from '@/lib/photos';

// Canvas AndroidCapture: guide ellipse 95.5/350 x 123.8/467 of the 3:4 viewfinder. Same phases
// and copy as apps/web/src/components/capture.tsx; the live guide is ML Kit's
// face contours (face-detector output) instead of the 468 mesh dots.
const GUIDE = { rx: 0.273, ry: 0.265 };
const CARD = 'rounded-card border border-foreground/10 bg-card';
const LABEL = 'text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground';
const VALUE = 'w-24 text-right font-display text-[22px] font-light';
const BTN = 'h-[52px] flex-row items-center justify-center gap-2.5 rounded-control bg-primary px-6';
const BTN_O = 'h-[52px] flex-row items-center justify-center gap-2.5 rounded-control border border-foreground/55 px-6';
const OVERLAY_INTERVAL_MS = 100; // ~10 fps overlay updates; ML Kit delivers faces faster
const BRIGHTNESS_INTERVAL_MS = 700;

type Phase = 'loading' | 'cameraError' | 'live' | 'analysing' | 'review' | 'saving' | 'saved';

function sameIssues(a: CaptureIssue[], b: CaptureIssue[]) {
  return a.length === b.length && a.every((issue, i) => issue === b[i]);
}

function dotsPath(face: Face | undefined, r: number): string {
  if (!face?.contours) return '';
  let d = '';
  for (const points of Object.values(face.contours)) {
    for (const p of points ?? []) d += `M${p.x + r} ${p.y}a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0`;
  }
  return d;
}

// Rendered apart from the 10 fps overlay state: the face-detector's <Camera>
// rebuilds its output on every render, and vision-camera reconfigures the whole
// session for it (verified in logcat: 2-4 rebinds/s, and a shutter pressed
// mid-rebind fails with "ImageCapture not bound"). Every prop here is stable.
const LiveCamera = memo(function LiveCamera({
  cameraRef,
  photoOutput,
  onFacesDetected,
  onStarted,
  onError,
}: {
  cameraRef: RefObject<CameraRef | null>;
  photoOutput: CameraPhotoOutput;
  onFacesDetected: (faces: Face[]) => void;
  onStarted: () => void;
  onError: () => void;
}) {
  const outputs = useMemo(() => [photoOutput], [photoOutput]);
  return (
    <Camera
      ref={cameraRef}
      style={StyleSheet.absoluteFill}
      device="front"
      isActive
      outputs={outputs}
      onStarted={onStarted}
      onError={onError}
      cameraFacing="front"
      autoMode
      runContours
      performanceMode="fast"
      onFacesDetected={onFacesDetected}
    />
  );
});

export function Capture() {
  const { t, i18n } = useTranslation();
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput({ targetResolution: CommonResolutions.FHD_4_3 });
  const cameraRef = useRef<CameraRef>(null);
  const engineRef = useRef<Engine>(null);
  const faceRef = useRef<LiveFace | null>(null);
  const brightnessRef = useRef(0);
  const lastOverlay = useRef(0);
  const liveRef = useRef(false);
  const viewRef = useRef({ width: 0, height: 0 });
  const [phase, setPhase] = useState<Phase>('loading');
  const readyRef = useRef({ engine: false, camera: false });
  const [view, setView] = useState({ width: 0, height: 0 });
  const [dots, setDots] = useState('');
  const [issues, setIssues] = useState<CaptureIssue[]>(['noFace']);
  const [ghostUrl, setGhostUrl] = useState<string | null>(null);
  const [still, setStill] = useState<Still | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(() => new Date());

  const markReady = useCallback((key: 'engine' | 'camera') => {
    readyRef.current[key] = true;
    if (readyRef.current.engine && readyRef.current.camera) setPhase((p) => (p === 'loading' ? 'live' : p));
  }, []);

  useEffect(() => {
    latestPhotoUrl().then(setGhostUrl).catch(() => {});
    loadEngine()
      .then((engine) => {
        engineRef.current = engine;
        markReady('engine');
      })
      .catch(() => setPhase('cameraError'));
  }, [markReady]);

  useEffect(() => {
    if (hasPermission) return;
    requestPermission().then((granted) => {
      if (!granted) setPhase('cameraError');
    });
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    liveRef.current = phase === 'live';
    viewRef.current = view;
  }, [phase, view]);

  const updateIssues = useCallback(() => {
    const next = liveIssues(faceRef.current, brightnessRef.current);
    setIssues((prev) => (sameIssues(prev, next) ? prev : next));
  }, []);

  // Brightness comes from a small preview snapshot, not from the detector.
  useEffect(() => {
    if (phase !== 'live') return;
    const timer = setInterval(async () => {
      try {
        const snapshot = await cameraRef.current!.takeSnapshot();
        brightnessRef.current = await sampleBrightness(snapshot, faceRef.current?.box ?? null);
        updateIssues();
      } catch {}
    }, BRIGHTNESS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [phase, updateIssues]);

  const onFacesDetected = useCallback((faces: Face[]) => {
    const { width, height } = viewRef.current;
    if (!liveRef.current || width === 0) return;
    const face = faces[0];
    faceRef.current = face
      ? {
          box: {
            minX: face.bounds.x / width,
            maxX: (face.bounds.x + face.bounds.width) / width,
            minY: face.bounds.y / height,
            maxY: (face.bounds.y + face.bounds.height) / height,
          },
          yawAngle: face.yawAngle,
        }
      : null;
    const now = Date.now();
    if (now - lastOverlay.current < OVERLAY_INTERVAL_MS) return;
    lastOverlay.current = now;
    setDots(dotsPath(face, width / 230));
    updateIssues();
  }, [updateIssues]);
  const onCameraStarted = useCallback(() => markReady('camera'), [markReady]);
  const onCameraError = useCallback(() => setPhase('cameraError'), []);

  async function shutter() {
    if (!engineRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPhase('analysing');
    try {
      setStill(
        await captureStill(engineRef.current, cameraRef.current?.controller, () => photoOutput.capturePhoto({}, {})),
      );
      setPhase('review');
    } catch (error) {
      console.warn('[capture] still failed', error);
      setPhase('live');
    }
  }

  function retake() {
    setStill(null);
    setSaveFailed(false);
    setPhase('live');
  }

  async function save() {
    if (!still?.readings) return;
    setPhase('saving');
    setSaveFailed(false);
    try {
      setSavedId(
        await savePhoto({
          image: still.image,
          brightness: still.brightness,
          awbLocked: still.awbLocked,
          readings: still.readings,
        }),
      );
      setSavedAt(new Date());
      setPhase('saved');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      latestPhotoUrl().then(setGhostUrl).catch(() => {});
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setSaveFailed(true);
      setPhase('review');
    }
  }

  const showingStill = still !== null && phase !== 'live';
  const badge = issues[0];
  const shutterLabel = phase === 'loading' ? t('capture.loading') : phase === 'analysing' ? t('capture.analysing') : t('capture.shutter');
  const denied = phase === 'cameraError' && !hasPermission;

  async function allowCamera() {
    if (await requestPermission()) return setPhase('loading');
    void Linking.openSettings().catch(() => {});
  }

  const header = (
    <View className="flex-row items-center gap-1 pl-2.5 pr-[18px] pt-2">
      <Link href="/" asChild>
        <Pressable className="size-11 items-center justify-center" role="button" accessibilityLabel={t('markSpots.back')}>
          <Icon as={ChevronLeft} size={23} strokeWidth={1.5} />
        </Pressable>
      </Link>
      <Text role="heading" aria-level="1" className="font-display text-[32px] font-light leading-[38px]">
        {t('capture.title')}
      </Text>
    </View>
  );

  // Canvas AndroidCaptureSaved: thumbnail beside the time, table card, disclaimer, actions.
  if (phase === 'saved' && still?.readings) {
    return (
      <ScrollView contentContainerClassName="pb-5">
        {header}
        <View className="mx-5 mt-4 flex-row items-center gap-[18px]">
          <Image accessible={false} source={{ uri: still.previewUri }} style={[styles.thumb, styles.mirrored]} contentFit="cover" />
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <Icon as={Check} size={16} strokeWidth={1.5} className="text-success" />
              <Text className="text-[13px] font-medium text-success">{t('capture.savedTitle')}</Text>
            </View>
            <Text role="heading" aria-level="2" className="font-display text-[28px] leading-[34px]">
              {savedAt.toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View className={`mx-5 mt-4 px-[18px] pb-2 pt-1.5 ${CARD}`}>
          <View className="h-10 flex-row items-center">
            <Text className={`flex-1 ${LABEL}`}>{t('capture.zone')}</Text>
            <Text className={`w-24 text-right ${LABEL}`}>{t('capture.redness')}</Text>
            <Text className={`w-24 text-right ${LABEL}`}>{t('capture.unevenness')}</Text>
          </View>
          {ZONES.map((zone) => {
            const reading = still.readings![zone];
            const empty = reading.pixelCount === 0;
            return (
              <View key={zone} className="h-11 flex-row items-center border-t border-border" testID={`zone-${zone}`}>
                <Text className="flex-1 text-[15px] font-light">{t(`capture.zones.${zone}`)}</Text>
                <Text className={VALUE}>{empty ? '—' : reading.redness.toFixed(1)}</Text>
                <Text className={VALUE}>{empty ? '—' : reading.unevenness.toFixed(1)}</Text>
              </View>
            );
          })}
        </View>
        <Text className="mx-6 mt-3 text-[12.5px] font-light leading-[19px] text-muted-foreground">{t('capture.disclaimer')}</Text>
        <View className="mx-5 mt-4 flex-row gap-3">
          <Pressable role="button" onPress={retake} className={`flex-1 px-3 ${BTN_O}`}>
            <Text className="text-[15px]">{t('capture.again')}</Text>
          </Pressable>
          <Link href={`/spots/${savedId}`} asChild>
            <Pressable role="button" className={`flex-1 px-3 ${BTN}`}>
              <Text className="text-[15px] font-medium text-primary-foreground">{t('capture.markSpots')}</Text>
            </Pressable>
          </Link>
        </View>
        <Link href="/" className="min-h-11 py-3 text-center text-sm text-foreground">
          {t('capture.done')}
        </Link>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1">
      {header}

      {denied ? (
        // Canvas AndroidCameraDenied: the card takes the viewfinder's place.
        <View className="flex-1 items-center justify-center px-5 py-2">
          <View accessible role="alert" className={`aspect-[3/4] h-full max-h-[360px] w-full items-center justify-center gap-[18px] px-8 ${CARD}`}>
            <View className="size-16 items-center justify-center rounded-pill border border-foreground/30">
              <Icon as={CameraOff} size={28} strokeWidth={1.5} />
            </View>
            <Text className="text-center text-[15px] font-light leading-[23px]">{t('capture.privateNote')}</Text>
            <Pressable role="button" onPress={allowCamera} className={`self-stretch px-3 ${BTN}`}>
              <Text className="text-[15px] font-medium text-primary-foreground">{t('capture.permission')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-4 py-1">
          <View
            className="relative aspect-[3/4] h-full max-h-[365px] overflow-hidden rounded-card bg-surface-2"
            onLayout={(e: LayoutChangeEvent) => setView(e.nativeEvent.layout)}
          >
          {/* The stored JPEG is the raw camera frame (web's mirror rule): the preview
              is mirrored by the camera, the still and the ghost by style only. */}
          {hasPermission && phase !== 'cameraError' && (
            <LiveCamera
              cameraRef={cameraRef}
              photoOutput={photoOutput}
              onFacesDetected={onFacesDetected}
              onStarted={onCameraStarted}
              onError={onCameraError}
            />
          )}
          {ghostUrl && !showingStill && (
            <Image accessible={false} source={{ uri: ghostUrl }} style={[StyleSheet.absoluteFill, styles.mirrored, { opacity: 0.25 }]} contentFit="cover" />
          )}
          {!showingStill && view.width > 0 && (
            // Canvas guide: fg at 0.85, 1.5 stroke, 3.5/7 dashes, round caps (SVG needs hex: tokens.json).
            <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${view.width} ${view.height}`} pointerEvents="none">
              <Ellipse
                cx={view.width / 2}
                cy={view.height / 2}
                rx={GUIDE.rx * view.width}
                ry={GUIDE.ry * view.height}
                stroke={palette.fg}
                strokeOpacity={0.85}
                strokeWidth={1.5}
                strokeDasharray="3.5 7"
                strokeLinecap="round"
                fill="none"
              />
              {dots !== '' && <Path d={dots} fill={palette.fg} fillOpacity={0.55} />}
            </Svg>
          )}
          {showingStill && (
            <Image accessible={false} source={{ uri: still.previewUri }} style={[StyleSheet.absoluteFill, styles.mirrored]} contentFit="cover" />
          )}
          {phase === 'live' && (
            <>
              {/* Glass badge without the canvas blur (no blur view; costs GPU). Colour never alone: dot for good, icon for an issue. */}
              <View accessible role="status" className="absolute left-3.5 top-3.5 flex-row items-center gap-2 rounded-pill border border-foreground/14 bg-background/60 px-3 py-1.5">
                {badge ? <Icon as={CircleAlert} size={15} strokeWidth={1.5} /> : <View className="size-1.5 rounded-pill bg-success" />}
                <Text className="text-[12.5px] font-medium">{badge ? t(`capture.issues.${badge}`) : t('capture.goodLight')}</Text>
              </View>
              {/* DESIGN.md: text over the photo sits on a scrim fading to bg. */}
              <View style={styles.scrim} pointerEvents="none">
                <Svg style={StyleSheet.absoluteFill} aria-hidden>
                  <Defs>
                    <LinearGradient id="capture-scrim" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={palette.bg} stopOpacity={0} />
                      <Stop offset="1" stopColor={palette.bg} stopOpacity={0.7} />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#capture-scrim)" />
                </Svg>
                <Text className="text-center text-[13px]">{t('capture.placeFace')}</Text>
              </View>
            </>
          )}
          {phase === 'cameraError' && (
            <View className="absolute inset-0 items-center justify-center p-8">
              <Text role="alert" className="text-center text-[15px] font-light leading-[23px]">
                {t('capture.cameraError')}
              </Text>
            </View>
          )}
        </View>
        </View>
      )}

      {still && (phase === 'review' || phase === 'saving') ? (
        // Canvas AndroidCaptureReview / AndroidCaptureSaveError.
        <>
          {still.issues.length > 0 && (
            <View accessible role="alert" className={`mx-5 mt-3.5 gap-2 px-[18px] py-4 ${CARD}`}>
              <View className="flex-row items-center gap-2.5">
                <Icon as={CircleAlert} size={18} strokeWidth={1.5} />
                <Text className="text-sm font-medium">{t('capture.qualityWarning')}</Text>
              </View>
              {still.issues.map((issue) => (
                <View key={issue} className="flex-row items-center gap-2.5 pl-7">
                  <View className="size-1 rounded-pill bg-foreground" />
                  <Text className="text-sm font-light">{t(`capture.issues.${issue}`)}</Text>
                </View>
              ))}
            </View>
          )}
          {saveFailed && (
            <View accessible role="alert" className="mx-6 mt-3.5 flex-row items-center gap-2">
              <Icon as={CircleAlert} size={16} strokeWidth={1.5} className="text-destructive" />
              <Text className="text-sm text-destructive">{t('capture.saveError')}</Text>
            </View>
          )}
          <View className="mx-5 mt-3.5 flex-row gap-3">
            <Pressable role="button" onPress={retake} disabled={phase === 'saving'} className={`flex-1 ${BTN_O}`}>
              <Text className="text-[15px]">{t('capture.retake')}</Text>
            </Pressable>
            {still.readings && (
              <Pressable role="button" onPress={save} disabled={phase === 'saving'} className={`flex-1 ${BTN} disabled:opacity-60`}>
                <Text className="text-[15px] font-medium text-primary-foreground">
                  {phase === 'saving' ? t('capture.saving') : still.issues.length > 0 ? t('capture.saveAnyway') : t('capture.save')}
                </Text>
              </Pressable>
            )}
          </View>
        </>
      ) : (
        <View className="shrink-0 gap-1.5 pb-2 pt-0.5">
          {!denied && (
            <View className="gap-0.5 px-6">
              <Text className="text-center text-[12px] font-light text-muted-foreground">{t('capture.keepDistance')}</Text>
              <Text className="text-center text-[12px] font-light text-muted-foreground">{t('capture.lightHint')}</Text>
            </View>
          )}
          {/* Canvas: ring fg/55 around the accent disc; the whole block dims until the camera is ready. */}
          <View className={`items-center gap-1.5 ${phase === 'live' ? '' : 'opacity-40'}`}>
            <Pressable
              onPress={shutter}
              disabled={phase !== 'live'}
              accessibilityLabel={shutterLabel}
              role="button"
              className="size-[64px] items-center justify-center rounded-pill border-[1.5px] border-foreground/55"
            >
              <View className="size-[50px] rounded-pill bg-primary" />
            </Pressable>
            <Text className="text-[12px] font-light text-muted-foreground">{shutterLabel}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mirrored: { transform: [{ scaleX: -1 }] },
  thumb: { width: 96, height: 128, borderRadius: 10 },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 40, paddingBottom: 16 },
});
