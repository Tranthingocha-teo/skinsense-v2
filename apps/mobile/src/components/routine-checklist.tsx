import { isDuplicateRoutineLabel, routineCompletionPercent } from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import {
  Check,
  ChevronLeft,
  Clock,
  EllipsisVertical,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
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
import { RecommendedProductsSection } from '@/components/recommended-products';

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

// Dr. Whitney Bowe (FAAD) 4-night skin cycling phases
const SKIN_CYCLING_PHASES = [
  {
    step: 1,
    phase: 'Exfoliation',
    label: 'Đêm 1: Tẩy tế bào chết (AHA/BHA)',
    labelEn: 'Night 1: Exfoliation (AHA/BHA)',
    icon: '✨',
    tag: 'Thông thoáng lỗ chân lông',
    desc: 'Làm sạch tế bào sừng với BHA 2% hoặc AHA dịu nhẹ. Giúp da thông thoáng hấp thụ tối đa các đêm sau.',
    dermatologistNote: 'Chỉ tẩy da chết hóa học 1 lần/chu kỳ để tránh làm tổn thương màng bảo vệ da.',
  },
  {
    step: 2,
    phase: 'Retinoid',
    label: 'Đêm 2: Retinoid Tái tạo sâu',
    labelEn: 'Night 2: Retinoid Renewal',
    icon: '🌙',
    tag: 'Tăng sinh Collagen & Mờ thâm',
    desc: 'Bôi một lượng bằng hạt đậu Retinol/Tretinoin trên nền da khô ráo. Tránh vùng mắt nhạy cảm.',
    dermatologistNote: 'Mẹo da liễu: Dùng phương pháp kẹp ẩm (Sandwich method) nếu da bạn dễ kích ứng.',
  },
  {
    step: 3,
    phase: 'Recovery 1',
    label: 'Đêm 3: Phục hồi màng ẩm (I)',
    labelEn: 'Night 3: Barrier Recovery (I)',
    icon: '🌿',
    tag: 'Ceramides & B5 Cấp ẩm',
    desc: 'Ngưng toàn bộ acid/retinol. Bổ sung Hyaluronic Acid, B5, Ceramides để làm dịu và phục hồi màng lipid.',
    dermatologistNote: 'Không dùng hoạt chất mạnh trong 2 đêm phục hồi để hàng rào da nghỉ ngơi và tái tạo.',
  },
  {
    step: 4,
    phase: 'Recovery 2',
    label: 'Đêm 4: Khóa ẩm chuyên sâu (II)',
    labelEn: 'Night 4: Moisture Seal (II)',
    icon: '💧',
    tag: 'Peptides & Khóa ẩm sâu',
    desc: 'Củng cố màng lipid với kem dưỡng ẩm giàu Peptides & Ceramides trước khi bước sang chu kỳ mới.',
    dermatologistNote: 'Làn da khỏe mạnh có màng bảo vệ vững chãi sẽ giảm 80% nguy cơ bùng phát mụn viêm.',
  },
];

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

  // Skin Cycling phase calculation
  const [showCycleModal, setShowCycleModal] = useState(false);
  const dayNumber = Math.floor(new Date(night).getTime() / (1000 * 60 * 60 * 24));
  const cycleIndex = Math.abs(dayNumber % 4);
  const currentPhase = SKIN_CYCLING_PHASES[cycleIndex] ?? SKIN_CYCLING_PHASES[0];

  // Active step timer (Skin Bliss absorption & 60s rule)
  const [activeTimer, setActiveTimer] = useState<{ id: string; seconds: number } | null>(null);

  useEffect(() => {
    if (!activeTimer || activeTimer.seconds <= 0) return;
    const timer = setInterval(() => {
      setActiveTimer((cur) => {
        if (!cur) return null;
        if (cur.seconds <= 1) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          return null;
        }
        return { ...cur, seconds: cur.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTimer]);

  function toggleTimer(id: string) {
    if (activeTimer?.id === id) {
      setActiveTimer(null);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setActiveTimer({ id, seconds: 60 });
    }
  }

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
    const isNowTicking = !ticked.has(item.label);
    const labels = items
      .filter((i) => (i.id === item.id ? isNowTicking : ticked.has(i.label)))
      .map((i) => i.label);
    setEntry({ night, completed_labels: labels, item_count: items.length });
    persist(() => saveEntry(night, labels, items.length));

    // When all items complete (100%): trigger Apple HIG celebratory haptic
    if (isNowTicking && labels.length === items.length) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
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
    const lower = item.label.toLowerCase();
    const isTimerEligible = lower.includes('rửa mặt') || lower.includes('cleanser') || lower.includes('serum') || lower.includes('mụn');
    const isTimerRunning = activeTimer?.id === item.id;

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
            <View className="flex-1 flex-row items-center justify-between pr-1">
              <Text numberOfLines={1} className={`flex-1 text-[15.5px] ${isTicked ? 'font-light text-muted-foreground line-through' : ''}`}>
                {item.label}
              </Text>
              {isTimerEligible && (
                <Pressable
                  role="button"
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleTimer(item.id);
                  }}
                  className={`ml-2 flex-row items-center gap-1 rounded-pill px-2 py-0.5 ${
                    isTimerRunning ? 'bg-primary' : 'bg-surface-2 border border-border/70'
                  }`}>
                  <Icon as={Clock} size={11} className={isTimerRunning ? 'text-primary-foreground' : 'text-muted-foreground'} />
                  <Text className={`text-[10.5px] font-semibold tabular-nums ${isTimerRunning ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {isTimerRunning ? `${activeTimer.seconds}s` : '60s'}
                  </Text>
                </Pressable>
              )}
            </View>
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

  const rawTitle = t('routine.title');
  const titleParts = rawTitle.split(/\s+/);
  const titleFirst = titleParts[0] ?? 'Routine';
  const titleSecond = titleParts.slice(1).join(' ') || '';

  if (embedded) {
    return (
      <Animated.View entering={FadeIn.duration(200)}>
        <View className="gap-3 px-5 pb-3 pt-[20px]">
          {/* Editorial Luxury Header matching uploaded reference */}
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="font-display text-[32px] font-normal leading-[36px] tracking-tight text-foreground">
                {titleFirst}
              </Text>
              {titleSecond !== '' && (
                <Text className="font-display text-[32px] font-normal leading-[36px] tracking-tight text-foreground">
                  {titleSecond}
                </Text>
              )}
            </View>
            <Link href="/routine" asChild>
              <Pressable role="button" className="min-h-11 justify-start pt-1">
                <Text className="text-[13.5px] font-medium text-muted-foreground hover:text-foreground">
                  {t('routine.edit')}
                </Text>
              </Pressable>
            </Link>
          </View>

          {/* Skin Cycling Intelligence Badge */}
          <Pressable
            role="button"
            onPress={() => setShowCycleModal(true)}
            className="flex-row items-center justify-between rounded-control border border-border/60 bg-surface-2/40 px-3 py-2">
            <View className="flex-1 flex-row items-center gap-2">
              <Text className="text-[13px]">{currentPhase.icon}</Text>
              <View className="flex-1">
                <Text className="text-[11.5px] font-semibold text-foreground" numberOfLines={1}>
                  {i18n.language === 'vi' ? currentPhase.label : currentPhase.labelEn}
                </Text>
                <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
                  {currentPhase.tag} • Chu kỳ Dr. Whitney Bowe
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1 rounded-pill bg-success/15 px-2 py-0.5">
              <Icon as={ShieldCheck} size={11} className="text-success" />
              <Text className="text-[10px] font-semibold text-success">An toàn</Text>
            </View>
          </Pressable>

          {progress}
          <View>{rows}</View>

          {/* 100% Completion Moment */}
          {done === items.length && items.length > 0 && (
            <Animated.View entering={FadeIn.duration(400)} className="mt-2 rounded-control border border-success/30 bg-success/10 p-3">
              <View className="flex-row items-center gap-2">
                <Icon as={Sparkles} size={15} className="text-success" />
                <Text className="text-[13px] font-semibold text-success">
                  Nghi thức trọn vẹn tối nay!
                </Text>
              </View>
              <Text className="mt-1 text-[11.5px] text-muted-foreground leading-4">
                Làn da đã được bảo vệ và nuôi dưỡng tối ưu. Chúc bạn một giấc ngủ ngon để tế bào phục hồi rạng rỡ! ✨
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Skin Cycling Science Info Modal */}
        <Modal
          visible={showCycleModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCycleModal(false)}>
          <View className="flex-1 items-center justify-center bg-black/60 px-4">
            <View className="w-full max-w-sm rounded-[24px] border border-border bg-card p-5 shadow-lg">
              <View className="flex-row items-center justify-between pb-3 border-b border-border">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[18px]">🌙</Text>
                  <Text className="font-display text-[18px] font-semibold text-foreground">
                    Skin Cycling Khoa Học
                  </Text>
                </View>
                <Pressable
                  role="button"
                  onPress={() => setShowCycleModal(false)}
                  className="size-8 items-center justify-center rounded-pill bg-surface-2">
                  <Icon as={X} size={16} className="text-muted-foreground" />
                </Pressable>
              </View>

              <ScrollView className="max-h-[360px] py-3">
                <Text className="text-[12.5px] leading-5 text-muted-foreground">
                  Phương pháp <Text className="font-semibold text-foreground">Skin Cycling</Text> được sáng lập bởi Tiến sĩ - Bác sĩ da liễu <Text className="font-semibold text-foreground">Dr. Whitney Bowe (FAAD - New York)</Text>. Luân phiên 4 đêm giúp tối đa hóa tác dụng hoạt chất mà không gây tổn thương hàng rào ẩm.
                </Text>

                <View className="mt-3 gap-2">
                  {SKIN_CYCLING_PHASES.map((p, idx) => (
                    <View
                      key={p.step}
                      className={`rounded-control border p-2.5 ${
                        idx === cycleIndex ? 'border-primary bg-primary/10' : 'border-border/60 bg-surface-2/30'
                      }`}>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[12px] font-semibold text-foreground">
                          {p.icon} {p.label}
                        </Text>
                        {idx === cycleIndex && (
                          <View className="rounded-pill bg-primary px-2 py-0.5">
                            <Text className="text-[9.5px] font-bold text-primary-foreground">Đêm nay</Text>
                          </View>
                        )}
                      </View>
                      <Text className="mt-1 text-[11px] text-muted-foreground leading-4">{p.desc}</Text>
                    </View>
                  ))}
                </View>

                <View className="mt-3.5 rounded-control border border-success/30 bg-success/10 p-2.5">
                  <Text className="text-[11px] font-semibold text-success">
                    🛡️ Lời khuyên da liễu đêm nay:
                  </Text>
                  <Text className="mt-0.5 text-[10.5px] text-muted-foreground leading-4">
                    {currentPhase.dermatologistNote}
                  </Text>
                </View>
              </ScrollView>

              <Pressable
                role="button"
                onPress={() => setShowCycleModal(false)}
                className="mt-3 h-10 items-center justify-center rounded-control bg-primary">
                <Text className="text-[13px] font-semibold text-primary-foreground">Đã hiểu</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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

        <View className="-mx-[18px] mt-2">
          <RecommendedProductsSection
            title="Sản phẩm hỗ trợ Routine"
            subtitle="Mô hình AI gợi ý sản phẩm phù hợp theo từng vùng da để bổ sung vào chu trình"
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
}
