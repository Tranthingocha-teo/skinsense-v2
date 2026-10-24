import DateTimePicker from '@expo/ui/community/datetime-picker';
import { color } from '@skinsense/tokens/tokens.json';
import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Pressable, ScrollView, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Mark } from '@/components/mark';
import { NightTint } from '@/components/night-tint';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatTime, notificationPermission, requestNotificationPermission, saveReminder, useReminder, WEEK, type ReminderSettings } from '@/lib/reminder';

const CARD = 'rounded-card border border-border bg-card';
const LABEL = 'px-1 pt-2 text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground';

// Canvas TOG:on / TOG:off.
function Toggle({ on }: { on: boolean }) {
  return on ? (
    <View className="h-8 w-[52px] items-end justify-center rounded-pill bg-primary p-1">
      <View className="size-6 rounded-pill bg-primary-foreground" />
    </View>
  ) : (
    <View className="h-8 w-[52px] justify-center rounded-pill border border-border bg-surface-2 p-1">
      <View className="size-[22px] rounded-pill bg-muted-foreground" />
    </View>
  );
}

// Canvas AndroidReminder / AndroidReminderDenied.
export function Reminder() {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const danger = color[useColorScheme() === 'dark' ? 'dark' : 'light'].danger;
  const reminder = useReminder();
  const [permission, setPermission] = useState<string>();
  const [picking, setPicking] = useState(false);
  const denied = permission === 'denied';
  const on = reminder.on && !denied;
  const time = formatTime(reminder);
  const save = (next: ReminderSettings) =>
    void saveReminder(next, { title: t('reminder.notificationTitle'), body: t('reminder.notificationBody') });

  // Read again when the user comes back from the system settings.
  useEffect(() => {
    const check = () => void notificationPermission().then(setPermission);
    check();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => sub.remove();
  }, []);

  async function toggle() {
    if (on) return save({ ...reminder, on: false });
    const status = await requestNotificationPermission(t('reminder.channel'));
    setPermission(status);
    if (status === 'granted') save({ ...reminder, on: true });
  }

  function toggleDay(day: number) {
    const days = reminder.days.includes(day) ? reminder.days.filter((d) => d !== day) : [...reminder.days, day];
    if (days.length) save({ ...reminder, days });
  }

  const openSettings = () =>
    Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
      { key: 'android.provider.extra.APP_PACKAGE', value: Constants.expoConfig?.android?.package ?? '' },
    ]).catch(() => Linking.openSettings());

  const pickerValue = new Date();
  pickerValue.setHours(reminder.hour, reminder.minute, 0, 0);

  return (
    <ScrollView contentContainerClassName="pb-10" contentContainerStyle={{ paddingTop: top }}>
      <NightTint height={260 + top} />
      <View className="flex-row items-center gap-1 pl-2.5 pr-[18px] pt-4">
        <Link href="/settings" asChild>
          <Pressable role="button" aria-label={t('reminder.back')} className="size-11 items-center justify-center">
            <Icon as={ChevronLeft} size={23} strokeWidth={1.5} className="text-foreground" />
          </Pressable>
        </Link>
        <Text role="heading" aria-level="1" className="font-display text-[34px] font-light leading-[39px]">
          {t('reminder.title')}
        </Text>
      </View>

      <View className="gap-3.5 px-5 pt-3.5">
        <Pressable role="switch" aria-checked={on} onPress={() => void toggle()} className={`${CARD} min-h-[60px] flex-row items-center justify-between pl-[18px] pr-3`}>
          <Text className="text-[15px]">{t('reminder.toggle')}</Text>
          <Toggle on={on} />
        </Pressable>

        {denied && (
          <View role="alert" className="gap-3 rounded-card border border-destructive/45 bg-card px-[18px] py-4">
            <View className="flex-row items-center gap-2.5">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={danger} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <Path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" />
                <Path d="M10 20.5a2 2 0 0 0 4 0" />
              </Svg>
              <Text className="flex-1 text-[14.5px] font-medium">{t('reminder.deniedTitle')}</Text>
            </View>
            <Text className="text-[13.5px] font-light leading-[20px] text-muted-foreground">{t('reminder.deniedBody', { time })}</Text>
            <Pressable role="button" onPress={() => void openSettings()} className="h-11 items-center justify-center rounded-control border border-foreground/55 px-6">
              <Text className="text-sm">{t('reminder.openSettings')}</Text>
            </Pressable>
          </View>
        )}

        <Pressable role="button" disabled={denied} onPress={() => setPicking(true)} className={`${CARD} items-center gap-0.5 px-[18px] py-[22px] ${denied ? 'opacity-45' : ''}`}>
          <Text className="font-display text-[72px] font-light leading-[79px]">{time}</Text>
          <Text className="text-[13px] font-light text-muted-foreground">{t('reminder.changeTime')}</Text>
        </Pressable>

        <Text className={LABEL}>{t('reminder.repeat')}</Text>
        <View className={`flex-row ${denied ? 'opacity-45' : ''}`}>
          {WEEK.map((day) => {
            const chosen = reminder.days.includes(day);
            return (
              <View key={day} className="flex-1 items-center">
                <Pressable role="checkbox" aria-checked={chosen} disabled={denied} onPress={() => toggleDay(day)} className={`size-11 items-center justify-center rounded-pill ${chosen ? 'bg-primary' : ''}`}>
                  <Text className={`text-sm ${chosen ? 'font-medium text-primary-foreground' : ''}`}>{t(`reminder.day${day}`)}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text className={LABEL}>{t('reminder.preview')}</Text>
        <View className={`${CARD} gap-1.5 px-[18px] py-3.5`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Mark size={20} />
              <Text className="text-[12.5px] font-medium">SkinSense</Text>
            </View>
            <Text className="text-xs font-light text-muted-foreground">{time}</Text>
          </View>
          <Text className="text-[15px] font-medium">{t('reminder.notificationTitle')}</Text>
          <Text className="text-sm font-light leading-[21px] text-muted-foreground">{t('reminder.notificationBody')}</Text>
        </View>
        <Text className="px-1 text-[12.5px] font-light leading-[19px] text-muted-foreground">{t('reminder.onDevice')}</Text>
      </View>

      {picking && (
        <DateTimePicker
          mode="time"
          presentation="dialog"
          is24Hour
          value={pickerValue}
          onValueChange={(_, date) => {
            setPicking(false);
            save({ ...reminder, hour: date.getHours(), minute: date.getMinutes() });
          }}
          onDismiss={() => setPicking(false)}
        />
      )}
    </ScrollView>
  );
}
