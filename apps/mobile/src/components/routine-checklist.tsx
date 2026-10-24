import { isDuplicateRoutineLabel, routineCompletionPercent } from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { Check, ChevronLeft, EllipsisVertical, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { LoadState } from '@/components/load-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import {
  addItem,
  deleteItem,
  loadRoutine,
  renameItem,
  saveEntry,
  swapPositions,
  type RoutineEntry,
  type RoutineItem,
} from '@/lib/routine';

function localDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// DESIGN.md motion: the hairline follows a tick in 360ms; reduced motion jumps.
function ProgressLine({ percent }: { percent: number }) {
  const width = useSharedValue(percent);
  useEffect(() => {
    width.value = withTiming(percent, { duration: 360, reduceMotion: ReduceMotion.System });
  }, [percent, width]);
  const style = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View className="h-px flex-1 bg-border">
      <Animated.View style={style}>
        <View className="h-px bg-foreground" />
      </Animated.View>
    </View>
  );
}

// DESIGN.md motion: the circle presses in (0.78, 90ms) and springs back; medium haptic on tick, light on untick.
function Tick({ ticked, disabled, onToggle, label, children }: { ticked: boolean; disabled: boolean; onToggle: () => void; label: string; children?: React.ReactNode }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  function press() {
    scale.value = withSequence(
      withTiming(0.78, { duration: 90, reduceMotion: ReduceMotion.System }),
      withSpring(1, { damping: 11, stiffness: 320, reduceMotion: ReduceMotion.System }),
    );
    void Haptics.impactAsync(ticked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onToggle();
  }
  return (
    <Pressable
      role="checkbox"
      aria-checked={ticked}
      aria-label={label}
      disabled={disabled}
      onPress={press}
      className="flex-1 flex-row items-center gap-3.5 self-stretch">
      <Animated.View style={style}>
        <View
          className={`size-[22px] items-center justify-center rounded-pill ${ticked ? 'bg-primary' : 'border border-foreground'}`}>
          {ticked && <Icon as={Check} size={12} strokeWidth={2.6} className="text-primary-foreground" />}
        </View>
      </Animated.View>
      {children}
    </Pressable>
  );
}

// Same state logic as apps/web/src/components/routine-checklist.tsx.
// `embedded` (inside Hôm nay): tick only, editing lives on the /routine screen.
export function RoutineChecklist({ embedded = false }: { embedded?: boolean }) {
  const { t, i18n } = useTranslation();
  const [night] = useState(localDate);
  const [status, setStatus] = useState<'loading' | 'failed' | 'ready'>('loading');
  const [attempt, retry] = useReducer((n: number) => n + 1, 0);
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [entry, setEntry] = useState<RoutineEntry | null>(null);
  // 'new' = the add field at the end of the list; an id = that row's rename field.
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const loaded = await loadRoutine(night, t('routine.defaults', { returnObjects: true }) as string[]);
    setItems(loaded.items);
    setEntry(loaded.entry);
  }, [night, t]);

  useEffect(() => {
    reload().then(() => setStatus('ready'), () => setStatus('failed'));
  }, [reload, attempt]);

  // Optimistic UI; a failed write reloads so the screen never shows an unsaved state.
  function persist(write: () => Promise<unknown>) {
    write().catch(() => reload().catch(() => setStatus('failed')));
  }

  const ticked = new Set(entry?.completed_labels ?? []);
  const done = items.filter((i) => ticked.has(i.label)).length;

  function edit(target: string | null, text = '') {
    setEditing(target);
    setDraft(text);
    setDuplicate(false);
  }

  function toggle(item: RoutineItem) {
    const labels = items
      .filter((i) => (i.id === item.id ? !ticked.has(i.label) : ticked.has(i.label)))
      .map((i) => i.label);
    setEntry({ night, completed_labels: labels, item_count: items.length });
    persist(() => saveEntry(night, labels, items.length));
  }

  // Labels are tonight's snapshot key (ADR 0004): a duplicate keeps the field open with the error.
  function rename(item: RoutineItem, label: string) {
    if (label === '' || label === item.label) return edit(null);
    if (isDuplicateRoutineLabel(items, label, item.id)) return setDuplicate(true);
    edit(null);
    setItems(items.map((i) => (i.id === item.id ? { ...i, label } : i)));
    persist(() => renameItem(item.id, label));
  }

  function remove(item: RoutineItem) {
    setItems(items.filter((i) => i.id !== item.id));
    persist(() => deleteItem(item.id));
  }

  function move(index: number, delta: 1 | -1) {
    const a = items[index];
    const b = items[index + delta];
    if (!b) return;
    const next = [...items];
    next[index] = { ...b, position: a.position };
    next[index + delta] = { ...a, position: b.position };
    setItems(next);
    persist(() => swapPositions(a, b));
  }

  function add(label: string) {
    if (label === '') return edit(null);
    if (isDuplicateRoutineLabel(items, label)) return setDuplicate(true);
    edit(null);
    const position = (items.at(-1)?.position ?? -1) + 1;
    const tempId = `tmp-${position}`;
    setItems([...items, { id: tempId, label, position }]);
    persist(async () => {
      const saved = await addItem(label, position);
      setItems((cur) => cur.map((i) => (i.id === tempId ? saved : i)));
    });
  }

  // Android has no Escape and the back key hides the keyboard without blurring: blur the field so onBlur commits once.
  useEffect(() => {
    if (!editing) return;
    const sub = Keyboard.addListener('keyboardDidHide', () => TextInput.State.currentlyFocusedInput()?.blur());
    return () => sub.remove();
  }, [editing]);

  if (status !== 'ready') {
    return <LoadState failed={status === 'failed'} onRetry={() => { setStatus('loading'); retry(); }} />;
  }

  const error = duplicate && (
    <Text role="alert" className="text-xs text-destructive">
      {t('routine.duplicate')}
    </Text>
  );

  const progress = (
    <View className="flex-row items-center gap-3">
      <ProgressLine percent={routineCompletionPercent(done, items.length)} />
      <Text className="text-[12.5px] font-light text-muted-foreground">{t('routine.progress', { done, total: items.length })}</Text>
    </View>
  );

  const rows = items.map((item, index) => {
    const isTicked = ticked.has(item.label);
    return (
      <View
        key={item.id}
        className={`flex-row items-center gap-3.5 ${embedded ? 'h-12' : `min-h-14 ${index > 0 ? 'border-t border-border' : ''}`}`}>
        <Tick ticked={isTicked} disabled={editing === item.id} onToggle={() => toggle(item)} label={item.label}>
          {editing === item.id ? (
            <View className="-ml-2.5 flex-1 gap-1 py-2">
              <Input
                autoFocus
                value={draft}
                onChangeText={(text) => { setDraft(text); setDuplicate(false); }}
                onBlur={() => rename(item, draft.trim())}
                onSubmitEditing={() => rename(item, draft.trim())}
                accessibilityLabel={t('routine.rename')}
                aria-invalid={duplicate}
                className={`h-10 rounded-control bg-transparent px-2.5 text-[15.5px] shadow-none ${duplicate ? 'border-destructive' : 'border-foreground'}`}
              />
              {error}
            </View>
          ) : (
            <Text numberOfLines={1} className={`flex-1 text-[15.5px] ${isTicked ? 'font-light text-muted-foreground' : ''}`}>
              {item.label}
            </Text>
          )}
        </Tick>
        {!embedded && (
          <DropdownMenu onOpenChange={(open) => setOpenMenu(open ? item.id : null)}>
            <DropdownMenuTrigger asChild>
              <Pressable
                role="button"
                aria-label={t('routine.more', { label: item.label })}
                className={`size-11 items-center justify-center rounded-pill ${openMenu === item.id ? 'bg-surface-2' : ''}`}>
                <Icon as={EllipsisVertical} size={20} strokeWidth={2.8} className={openMenu === item.id ? 'text-foreground' : 'text-muted-foreground'} />
              </Pressable>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[216px] rounded-control border-border bg-surface-2 p-0 py-1.5">
              <DropdownMenuLabel numberOfLines={1} className="px-4 pb-1.5 pt-2 text-[12.5px] font-medium text-muted-foreground">
                {item.label}
              </DropdownMenuLabel>
              <DropdownMenuItem className="h-11 rounded-none px-4" onPress={() => edit(item.id, item.label)}>
                <Text className="text-[15px]">{t('routine.rename')}</Text>
              </DropdownMenuItem>
              <DropdownMenuItem className="h-11 rounded-none px-4" disabled={index === 0} onPress={() => move(index, -1)}>
                <Text className="text-[15px]">{t('routine.moveUp')}</Text>
              </DropdownMenuItem>
              <DropdownMenuItem className="h-11 rounded-none px-4" disabled={index === items.length - 1} onPress={() => move(index, 1)}>
                <Text className="text-[15px]">{t('routine.moveDown')}</Text>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" className="h-11 rounded-none border-t border-border px-4" onPress={() => remove(item)}>
                <Text className="text-[15px]">{t('routine.delete')}</Text>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </View>
    );
  });

  if (embedded) {
    return (
      <Animated.View entering={FadeIn.duration(200)}>
        <View className="gap-2.5 px-5 pb-2 pt-[18px]">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-display text-[26px] font-normal">{t('routine.title')}</Text>
            <Link href="/routine" asChild>
              <Pressable role="button" className="min-h-11 justify-center">
                <Text className="text-[13px]">{t('routine.edit')}</Text>
              </Pressable>
            </Link>
          </View>
          {progress}
          <View>{rows}</View>
        </View>
      </Animated.View>
    );
  }

  const dateLabel = new Date(night).toLocaleDateString(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
      <ScrollView className="flex-1" contentContainerClassName="gap-3 px-[18px] pb-8 pt-4" keyboardShouldPersistTaps="handled">
        <View className="-ml-2 flex-row items-center gap-1">
          <Link href="/" asChild>
            <Pressable role="button" aria-label={t('routine.back')} className="size-11 items-center justify-center">
              <Icon as={ChevronLeft} size={23} strokeWidth={1.5} className="text-foreground" />
            </Pressable>
          </Link>
          <Text role="heading" aria-level="1" className="font-display text-[34px] font-light leading-[39px]">
            {t('routine.title')}
          </Text>
        </View>

        <View className="gap-3.5 px-1 pb-2 pt-1">
          <Text className="text-[11.5px] font-medium uppercase tracking-[1.6px]">{dateLabel}</Text>
          {progress}
        </View>

        <View className="rounded-card border border-border bg-card py-1 pl-5 pr-2">{rows}</View>

        {editing === 'new' ? (
          <View className="gap-1">
            <Input
              autoFocus
              value={draft}
              onChangeText={(text) => { setDraft(text); setDuplicate(false); }}
              placeholder={t('routine.newStepPlaceholder')}
              accessibilityLabel={t('routine.newStepPlaceholder')}
              aria-invalid={duplicate}
              onBlur={() => add(draft.trim())}
              onSubmitEditing={() => add(draft.trim())}
              className={`h-[54px] rounded-control bg-transparent px-[18px] text-[15px] shadow-none ${duplicate ? 'border-destructive' : 'border-foreground'}`}
            />
            {error}
          </View>
        ) : (
          <Pressable
            role="button"
            onPress={() => edit('new')}
            className="h-[54px] flex-row items-center gap-2.5 rounded-control border border-dashed border-border px-[18px]">
            <Icon as={Plus} size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <Text className="text-[15px] text-muted-foreground">{t('routine.addStep')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </Animated.View>
  );
}
