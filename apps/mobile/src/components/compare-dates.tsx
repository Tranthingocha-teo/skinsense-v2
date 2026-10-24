import { localDay } from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

// Canvas AndroidCompare: a bottom sheet with a month calendar that enables only days
// with Photos. RN Modal + NativeWind, not a sheet library: no native module, no rebuild.
type Pair = [string, string];

const LABEL = 'text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground';
const local = (day: string) => new Date(day + 'T00:00:00');
const ordered = ([a, b]: Pair): Pair => (a <= b ? [a, b] : [b, a]);
const monthOf = (day: string) => day.slice(0, 7);
const shiftMonth = (month: string, by: number) => {
  const [y, m] = month.split('-').map(Number);
  return monthOf(localDay(new Date(y, m - 1 + by, 1)));
};

// A "YYYY-MM" month as Monday-first weeks; null pads the blank cells.
function weeks(month: string): (string | null)[][] {
  const [y, m] = month.split('-').map(Number);
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const cells = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => localDay(new Date(y, m - 1, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

export function CompareDates({
  photoDays,
  firstDay,
  today,
  value,
  onChange,
}: {
  photoDays: string[]; // days of the range that have Photos
  firstDay: string; // the range's first day, the earliest month to show
  today: string;
  value: Pair; // the pair on screen
  onChange: (pair: Pair) => void;
}) {
  const { t, i18n } = useTranslation();
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [slot, setSlot] = useState<0 | 1>(0);
  const [month, setMonth] = useState(monthOf(value[1]));
  const enabled = new Set(photoDays);
  const text = (day: string, options: Intl.DateTimeFormatOptions) => local(day).toLocaleDateString(i18n.language, options);
  const caption = text(`${month}-01`, { month: 'long', year: 'numeric' });
  const canPrev = month > monthOf(firstDay);
  const canNext = month < monthOf(today);

  const show = () => {
    setDraft(value);
    setSlot(0);
    setMonth(monthOf(value[1]));
    setOpen(true);
  };
  const pick = (day: string) => {
    setDraft((d) => ordered(slot === 0 ? [day, d[1]] : [d[0], day]));
    setSlot(1);
  };

  return (
    <>
      <Pressable role="button" onPress={show} className="-my-3 h-11 flex-row items-center gap-1 px-1.5">
        <Icon as={CalendarDays} size={15} strokeWidth={1.5} className="text-foreground" />
        <Text className="text-[12.5px] font-medium">{t('trends.choose')}</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType={reduceMotion ? 'fade' : 'slide'}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}>
        {/* Canvas scrim: bg at 60% (hex alpha, ticket 03); tapping it dismisses like the back gesture. */}
        <Pressable accessible={false} onPress={() => setOpen(false)} style={[StyleSheet.absoluteFill, { backgroundColor: `${palette.bg}99` }]} />
        <View
          className="absolute bottom-0 left-0 right-0 gap-3.5 rounded-t-card border-t bg-card px-5 pb-7 pt-2.5"
          style={{ borderColor: `${palette.fg}24` }}>
          <View className="h-1 w-10 self-center rounded-pill bg-border" />
          <View className="gap-1">
            <Text role="heading" className="font-display text-[26px] font-normal leading-[34px]">{t('trends.choose')}</Text>
            <Text className="text-[13px] font-light text-muted-foreground">{t('trends.chooseHint')}</Text>
          </View>

          <View className="flex-row gap-2">
            {([0, 1] as const).map((i) => (
              <Pressable
                key={i}
                role="button"
                aria-selected={slot === i}
                onPress={() => setSlot(i)}
                className={`h-14 flex-1 justify-center rounded-control border px-3.5 ${slot === i ? 'border-foreground' : ''}`}
                style={slot === i ? undefined : { borderColor: `${palette.fg}24` }}>
                <Text className={LABEL}>{t(i === 0 ? 'trends.before' : 'trends.after')}</Text>
                <Text className="text-[15px] font-medium">{text(draft[i], { day: 'numeric', month: 'short' })}</Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center justify-between">
            <Pressable role="button" disabled={!canPrev} accessibilityLabel={t('trends.prevMonth')} onPress={() => setMonth(shiftMonth(month, -1))} className="size-11 items-center justify-center">
              <Icon as={ChevronLeft} size={20} strokeWidth={1.5} className={canPrev ? 'text-foreground' : 'text-muted-foreground'} />
            </Pressable>
            <Text className="text-[15px] font-medium">{caption.charAt(0).toUpperCase() + caption.slice(1)}</Text>
            <Pressable role="button" disabled={!canNext} accessibilityLabel={t('trends.nextMonth')} onPress={() => setMonth(shiftMonth(month, 1))} className="size-11 items-center justify-center">
              <Icon as={ChevronRight} size={20} strokeWidth={1.5} className={canNext ? 'text-foreground' : 'text-muted-foreground'} />
            </Pressable>
          </View>

          <View className="gap-0.5">
            <View className="flex-row">
              {/* 2026-09-14 is a Monday. */}
              {Array.from({ length: 7 }, (_, i) => (
                <Text key={i} className={`flex-1 pb-1.5 text-center ${LABEL}`}>
                  {new Date(2026, 8, 14 + i).toLocaleDateString(i18n.language, { weekday: 'narrow' })}
                </Text>
              ))}
            </View>
            {weeks(month).map((week, w) => (
              <View key={w} className="flex-row">
                {week.map((day, i) => {
                  if (!day) return <View key={i} className="h-11 flex-1" />;
                  const selected = draft.includes(day);
                  const label = text(day, { day: 'numeric', month: 'long', year: 'numeric' });
                  return (
                    <View key={i} className="h-11 flex-1 items-center">
                      <Pressable
                        role="button"
                        testID={enabled.has(day) ? 'photo-day' : undefined}
                        disabled={!enabled.has(day)}
                        aria-selected={selected}
                        accessibilityLabel={day === today ? `${label}, ${t('trends.today')}` : label}
                        onPress={() => pick(day)}
                        className={`size-11 items-center justify-center gap-[3px] rounded-pill ${selected ? 'bg-primary' : ''}`}>
                        <Text
                          className={`text-sm ${selected ? 'font-medium text-primary-foreground' : day > today ? 'text-muted-foreground' : 'text-foreground'} ${day === today ? 'font-semibold' : ''}`}>
                          {Number(day.slice(8))}
                        </Text>
                        {enabled.has(day) && <View className={`size-1 rounded-pill ${selected ? 'bg-primary-foreground' : 'bg-foreground'}`} />}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <Pressable
            role="button"
            disabled={draft[0] === draft[1]}
            onPress={() => {
              onChange(draft);
              setOpen(false);
            }}
            className={`h-[52px] items-center justify-center rounded-control bg-primary ${draft[0] === draft[1] ? 'opacity-50' : ''}`}>
            <Text className="text-[15px] font-medium text-primary-foreground">{t('trends.apply')}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
