import AsyncStorage from '@react-native-async-storage/async-storage';
import { color } from '@skinsense/tokens/tokens.json';
import { Check } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useCameraPermission } from 'react-native-vision-camera';

import { NightTint } from '@/components/night-tint';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { notificationPermission, requestNotificationPermission } from '@/lib/reminder';

const KEY = 'onboarded';

// Once per device: null while AsyncStorage is read, then whether onboarding is done, and the setter.
export function useOnboarded() {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => setDone(v !== null), () => setDone(true));
  }, []);
  const finish = () => {
    void AsyncStorage.setItem(KEY, '1');
    setDone(true);
  };
  return [done, finish] as const;
}

// Canvas .photo placeholder, optionally under the scrim (bg 25% → 30% at 40% → solid at 74%).
function PhotoFill({ scrim = false }: { scrim?: boolean }) {
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Svg width="100%" height="100%" style={{ position: 'absolute' }} aria-hidden>
      <Defs>
        <LinearGradient id="ob-base" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette['photo-b']} />
          <Stop offset="1" stopColor={palette['photo-a']} />
        </LinearGradient>
        <RadialGradient id="ob-a" cx="20%" cy="85%" rx="90%" ry="70%">
          <Stop offset="0" stopColor={palette['photo-a']} />
          <Stop offset="0.75" stopColor={palette['photo-a']} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="ob-c" cx="50%" cy="46%" rx="40%" ry="34%">
          <Stop offset="0" stopColor={palette['photo-c']} stopOpacity={0.38} />
          <Stop offset="0.72" stopColor={palette['photo-c']} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="ob-scrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.bg} stopOpacity={0.25} />
          <Stop offset="0.4" stopColor={palette.bg} stopOpacity={0.3} />
          <Stop offset="0.74" stopColor={palette.bg} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#ob-base)" />
      <Rect width="100%" height="100%" fill="url(#ob-a)" />
      <Rect width="100%" height="100%" fill="url(#ob-c)" />
      {scrim && <Rect width="100%" height="100%" fill="url(#ob-scrim)" />}
    </Svg>
  );
}

function Skip({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable role="button" onPress={onPress} className="min-h-11 justify-center px-3">
      <Text className="text-sm">{t('onboarding.skip')}</Text>
    </Pressable>
  );
}

// Canvas row end: Đã cho phép, or the Cho phép button.
function Grant({ granted, onAllow }: { granted: boolean; onAllow: () => void }) {
  const { t } = useTranslation();
  return granted ? (
    <View className="flex-row items-center gap-1.5">
      <Icon as={Check} size={16} strokeWidth={1.5} className="text-success" />
      <Text className="text-[13px] font-medium text-success">{t('onboarding.allowed')}</Text>
    </View>
  ) : (
    <Pressable role="button" onPress={onAllow} className="h-11 justify-center rounded-control border border-foreground/55 px-3.5">
      <Text className="text-[13.5px]">{t('onboarding.allow')}</Text>
    </Pressable>
  );
}

function PermissionRows() {
  const { t } = useTranslation();
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { hasPermission, requestPermission } = useCameraPermission();
  const [notifications, setNotifications] = useState(false);
  useEffect(() => {
    notificationPermission().then((status) => setNotifications(status === 'granted'), () => {});
  }, []);
  return (
    <View className="rounded-card border border-foreground/10 bg-card pl-4 pr-3">
      <View className="min-h-[72px] flex-row items-center gap-3.5">
        <View className="size-11 items-center justify-center rounded-pill border border-foreground/20">
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={palette.fg} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <Rect x={3} y={7} width={18} height={13} rx={2.5} />
            <Path d="M8 7l1.6-2.5h4.8L16 7" />
            <Circle cx={12} cy={13.2} r={3.4} />
          </Svg>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-[15px]">{t('onboarding.camera')}</Text>
          <Text className="text-[12.5px] font-light text-muted-foreground">{t('onboarding.cameraNote')}</Text>
        </View>
        <Grant granted={hasPermission} onAllow={() => void requestPermission()} />
      </View>
      <View className="min-h-[72px] flex-row items-center gap-3.5 border-t border-border">
        <View className="size-11 items-center justify-center rounded-pill border border-foreground/20">
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={palette.fg} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <Path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" />
            <Path d="M10 20.5a2 2 0 0 0 4 0" />
          </Svg>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-[15px]">{t('onboarding.notifications')}</Text>
          <Text className="text-[12.5px] font-light text-muted-foreground">{t('onboarding.notificationsNote')}</Text>
        </View>
        <Grant
          granted={notifications}
          onAllow={() => void requestNotificationPermission(t('reminder.channel')).then((status) => setNotifications(status === 'granted'))}
        />
      </View>
    </View>
  );
}

// Canvas AndroidOnboarding1–3: the diary, shooting consistently, privacy and the camera permission.
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [step, setStep] = useState(0);
  const next = () => setStep(step + 1);

  const steps: { title: string; body: string; size: string; top: ReactNode; extra?: ReactNode }[] = [
    {
      title: t('onboarding.diaryTitle'),
      body: t('onboarding.diaryBody'),
      size: 'text-[44px] leading-[51px]',
      top: (
        <View className="flex-row items-center justify-between pl-5 pr-2 pt-4">
          <Text className="rounded-pill border border-dashed border-foreground/45 px-2.5 py-1 text-[11px]">{t('today.photoPlaceholder')}</Text>
          <Skip onPress={onDone} />
        </View>
      ),
    },
    {
      title: t('onboarding.lightTitle'),
      body: t('onboarding.lightBody'),
      size: 'text-[40px] leading-[46px]',
      top: (
        <>
          <View className="flex-row justify-end pr-2 pt-4">
            <Skip onPress={onDone} />
          </View>
          {/* The guide frame as Capture draws it. */}
          <View className="mt-6 h-[320px] w-[240px] self-center overflow-hidden rounded-card">
            <PhotoFill />
            <Svg width={240} height={320} viewBox="0 0 240 320" style={{ position: 'absolute' }} aria-hidden>
              <Ellipse cx={120} cy={160} rx={65.5} ry={84.8} fill="none" stroke={palette.fg} strokeOpacity={0.85} strokeWidth={1.5} strokeDasharray="3.5 7" strokeLinecap="round" />
            </Svg>
            <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-pill bg-background/60 px-2.5 py-[5px]">
              <View className="size-1.5 rounded-pill bg-success" />
              <Text className="text-[11.5px] font-medium">{t('capture.goodLight')}</Text>
            </View>
          </View>
        </>
      ),
    },
    {
      title: t('onboarding.privacyTitle'),
      body: t('onboarding.privacyBody'),
      size: 'text-[40px] leading-[46px]',
      top: null,
      extra: <PermissionRows />,
    },
  ];
  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: top }}>
      {step === 0 ? <PhotoFill scrim /> : <NightTint height={(step === 1 ? 420 : 360) + top} />}
      {current.top}
      <View className="mt-auto gap-[22px] px-6 pb-9">
        <View aria-label={t('onboarding.step', { step: step + 1 })} accessible className="flex-row gap-1.5">
          {steps.map((_, i) => (
            <View key={i} className={`h-0.5 w-7 ${i === step ? 'bg-foreground' : 'bg-border'}`} />
          ))}
        </View>
        <Text role="heading" aria-level="1" className={`font-display font-light ${current.size}`}>
          {current.title}
        </Text>
        <Text className="text-base font-light leading-[26px]">{current.body}</Text>
        {current.extra}
        <Pressable role="button" onPress={last ? onDone : next} className="h-[52px] items-center justify-center rounded-control bg-primary px-6">
          <Text className="text-[15px] font-medium text-primary-foreground">{t(last ? 'onboarding.start' : 'onboarding.next')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
