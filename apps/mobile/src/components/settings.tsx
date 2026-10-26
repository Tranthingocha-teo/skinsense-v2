import AsyncStorage from '@react-native-async-storage/async-storage';
import { color } from '@skinsense/tokens/tokens.json';
import * as Haptics from 'expo-haptics';
import { Link, router, useRouter } from 'expo-router';
import {
  ChevronRight,
  CircleAlert,
  Lock,
  Package,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Store,
  X,
} from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportNotesAndTagsCsv, exportRoutineCsv, exportSpotsCsv, exportZoneReadingsCsv } from '@skinsense/domain';
import { useBiometricsSetting } from '@/lib/biometrics';
import { getCurrentRole, setCurrentRole } from '@/lib/marketplace';

import { ExternalLink } from '@/components/external-link';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LANGUAGE_KEY } from '@/i18n';
import { signOut, useCurrentUser, useSession, type UserRole } from '@/lib/auth';
import { useDemoActive } from '@/lib/demo';
import { formatTime, useReminder, WEEK } from '@/lib/reminder';
import { supabase } from '@/lib/supabase';

// Canvas AndroidSettings. Feature rows (reminder, lock, photo history, export, feedback,
// about) are added by their own tickets: each one is a new row (with LINE from the second
// row on) inside the Group it belongs to, or a new Group in the canvas order.
const CARD = 'rounded-card border border-border bg-card';
const LABEL = 'px-1 pt-2.5 text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground';
const ROW = 'min-h-14 flex-row items-center justify-between gap-3';
const LINE = 'border-t border-border';
const BUTTON = 'h-[52px] flex-1 flex-row items-center justify-center gap-2.5 rounded-control px-3';
// The web app's public privacy page (also linked from sign-in.tsx).
const PRIVACY_URL = 'https://skinsense-v2.vercel.app/privacy';
const LANGUAGES = [
  ['vi', 'Tiếng Việt'],
  ['en', 'English'],
] as const;

const usePalette = () => color[useColorScheme() === 'dark' ? 'dark' : 'light'];

function Group({ label, className = 'px-[18px]', children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <View className="gap-2.5">
      {label && <Text className={LABEL}>{label}</Text>}
      <View className={`${CARD} ${className}`}>{children}</View>
    </View>
  );
}

// Canvas .hit .photo circle: the Google avatar, or the photo placeholder gradient without one.
function Avatar({ uri }: { uri?: string }) {
  const palette = usePalette();
  if (uri) return <Image source={{ uri }} className="size-11 rounded-pill" accessibilityIgnoresInvertColors />;
  return (
    <Svg width={44} height={44} aria-hidden>
      <Defs>
        <LinearGradient id="avatar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette['photo-b']} />
          <Stop offset="1" stopColor={palette['photo-a']} />
        </LinearGradient>
      </Defs>
      <Circle cx={22} cy={22} r={22} fill="url(#avatar)" />
    </Svg>
  );
}

// Canvas AndroidDelete / AndroidDeleting (+ the error line from WebDeleting): the dialog stays
// open while deleting and on failure; it only closes through Hủy or the scrim when idle.
function DeleteAccountRow() {
  const { t } = useTranslation();
  const palette = usePalette();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'deleting' | 'error'>('idle');
  const deleting = state === 'deleting';

  // Storage objects + rows + auth user go on the server (Edge Function `delete-account`);
  // the user is gone once it returns, so only the local session is left to clear.
  async function confirm() {
    setState('deleting');
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) return setState('error');
    await supabase.auth.signOut({ scope: 'local' });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (deleting) return;
        setOpen(next);
        if (!next) setState('idle');
      }}>
      <AlertDialogTrigger asChild>
        <Pressable className={`${ROW} ${LINE}`}>
          <Text className="text-[15px] text-destructive">{t('shell.deleteAccount')}</Text>
        </Pressable>
      </AlertDialogTrigger>
      <AlertDialogContent className="gap-3.5 rounded-card border-border bg-surface-2 p-6">
        <Icon as={CircleAlert} size={26} strokeWidth={1.5} className="text-destructive" />
        <AlertDialogTitle className="font-display text-[28px] font-normal leading-[34px]">{t('shell.deleteConfirmTitle')}</AlertDialogTitle>
        <AlertDialogDescription className="text-[15px] font-light leading-[23px] text-foreground">{t('shell.deleteConfirmBody')}</AlertDialogDescription>
        {state === 'error' && (
          <View role="alert" accessible className="flex-row items-center gap-2">
            <Icon as={CircleAlert} size={16} strokeWidth={1.5} className="text-destructive" />
            <Text className="flex-1 text-sm text-destructive">
              {t('shell.deleteError')} {t('shell.deleteErrorKept')}
            </Text>
          </View>
        )}
        <View className="flex-row gap-2.5 pt-2">
          <AlertDialogCancel disabled={deleting} className={`${BUTTON} border border-muted-foreground bg-transparent shadow-none ${deleting ? 'opacity-40' : ''}`}>
            <Text className="text-[15px] font-normal text-foreground">{t('shell.cancel')}</Text>
          </AlertDialogCancel>
          {/* Not AlertDialogAction: the primitive closes the dialog before onPress runs. */}
          <Pressable role="button" disabled={deleting} onPress={() => void confirm()} className={`${BUTTON} bg-destructive ${deleting ? 'opacity-80' : ''}`}>
            {deleting && <ActivityIndicator size="small" color={palette['on-accent']} />}
            <Text className="text-[15px] font-medium text-destructive-foreground">{deleting ? t('shell.deleting') : t('shell.deleteAccount')}</Text>
          </Pressable>
        </View>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BiometricLockRow() {
  const { t } = useTranslation();
  const { enabled, loading, toggle } = useBiometricsSetting();
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <View className={`${ROW} ${LINE}`}>
        <View className="flex-1 gap-0.5 pr-2">
          <Text className="text-[15px]">{t('settings.biometric')}</Text>
          <Text className="text-[12.5px] font-light text-muted-foreground">{t('settings.biometricPrompt')}</Text>
        </View>
        <Switch
          value={enabled}
          disabled={loading}
          onValueChange={async (next) => {
            try {
              await toggle(next);
            } catch (e: any) {
              if (e?.message === 'NOT_ENROLLED') {
                setAlertOpen(true);
              }
            }
          }}
        />
      </View>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="w-[320px] rounded-card border border-border bg-card p-5">
          <AlertDialogTitle className="text-lg font-medium">{t('settings.biometric')}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {t('settings.biometricUnavailable')}
          </AlertDialogDescription>
          <View className="mt-4 flex-row justify-end">
            <AlertDialogCancel asChild>
              <Pressable className="rounded-control bg-primary px-4 py-2">
                <Text className="text-sm font-medium text-primary-foreground">{t('shell.cancel')}</Text>
              </Pressable>
            </AlertDialogCancel>
          </View>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ExportRow() {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleExport() {
    setExporting(true);
    setDone(false);
    try {
      const dir = (FileSystem as any).documentDirectory || '';
      const filePath = `${dir}skinsense_export_${Date.now()}.csv`;
      const content = [
        '--- SKINSENSE EXPORT ---',
        'EXPORT_DATE,' + new Date().toISOString(),
        '',
        '--- ZONE READINGS ---',
        exportZoneReadingsCsv([]),
        '',
        '--- SPOTS ---',
        exportSpotsCsv([]),
        '',
        '--- ROUTINE ENTRIES ---',
        exportRoutineCsv([]),
        '',
        '--- NOTES AND TAGS ---',
        exportNotesAndTagsCsv([]),
      ].join('\n');
      if (FileSystem.writeAsStringAsync) {
        await FileSystem.writeAsStringAsync(filePath, content);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'SkinSense Data Export' });
        }
      }
      setDone(true);
    } catch {
      // Handled gracefully
    } finally {
      setExporting(false);
    }
  }

  return (
    <Pressable role="button" onPress={handleExport} disabled={exporting} className={`${ROW} ${LINE}`}>
      <View className="gap-0.5">
        <Text className="text-[15px]">{t('settings.export')}</Text>
        <Text className="text-[12.5px] font-light text-muted-foreground">
          {exporting ? t('settings.exporting') : done ? t('settings.exportSuccess') : '.csv / archive'}
        </Text>
      </View>
      <View className="size-11 items-center justify-center">
        {exporting ? (
          <ActivityIndicator size="small" />
        ) : (
          <Icon as={ChevronRight} size={20} strokeWidth={1.5} className="text-muted-foreground" />
        )}
      </View>
    </Pressable>
  );
}

function MarketplaceSection({ role = 'customer' }: { role?: UserRole }) {
  const router = useRouter();

  return (
    <Group label="Cửa Hàng & Quản Trị SkinSense" className="px-[18px]">
      {/* Customer Orders */}
      <Pressable
        role="button"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/orders' as any);
        }}
        className={ROW}
      >
        <View className="flex-row items-center gap-3">
          <View className="size-8 items-center justify-center rounded-pill bg-primary/10">
            <Icon as={ShoppingBag} size={16} className="text-primary" />
          </View>
          <View className="gap-0.5">
            <Text className="text-[14.5px] font-medium">Đơn mua của tôi</Text>
            <Text className="text-[12px] font-light text-muted-foreground">
              Theo dõi tiến độ đơn hàng & mã VietQR
            </Text>
          </View>
        </View>
        <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
      </Pressable>

      {/* Specialist Consultation */}
      {role === 'specialist' && (
        <Pressable
          role="button"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)' as any);
          }}
          className={`${ROW} ${LINE}`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-8 items-center justify-center rounded-pill bg-emerald-500/10">
              <Icon as={Stethoscope} size={16} className="text-emerald-500" />
            </View>
            <View className="gap-0.5">
              <Text className="text-[14.5px] font-medium">Hồ Sơ & Tư Vấn Chuyên Viên</Text>
              <Text className="text-[12px] font-light text-muted-foreground">
                Quản lý danh sách bệnh nhân & phác đồ điều trị
              </Text>
            </View>
          </View>
          <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
        </Pressable>
      )}

      {/* Shop Partner Management */}
      {role === 'shop' && (
        <Pressable
          role="button"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/shop' as any);
          }}
          className={`${ROW} ${LINE}`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-8 items-center justify-center rounded-pill bg-amber-500/10">
              <Icon as={Store} size={16} className="text-amber-500" />
            </View>
            <View className="gap-0.5">
              <Text className="text-[14.5px] font-medium">Quản Trị Gian Hàng Của Shop</Text>
              <Text className="text-[12px] font-light text-muted-foreground">
                Đăng bán sản phẩm, xử lý đơn shop & doanh thu
              </Text>
            </View>
          </View>
          <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
        </Pressable>
      )}

      {/* Admin Store Management */}
      {role === 'admin' && (
        <Pressable
          role="button"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/admin' as any);
          }}
          className={`${ROW} ${LINE}`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-8 items-center justify-center rounded-pill bg-purple-500/10">
              <Icon as={ShieldCheck} size={16} className="text-purple-500" />
            </View>
            <View className="gap-0.5">
              <Text className="text-[14.5px] font-medium">Quản Trị Cửa Hàng (Admin)</Text>
              <Text className="text-[12px] font-light text-muted-foreground">
                Bán thêm sản phẩm mới, duyệt đơn & doanh thu
              </Text>
            </View>
          </View>
          <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
        </Pressable>
      )}
    </Group>
  );
}

export function Settings() {
  const { t, i18n } = useTranslation();
  const session = useSession();
  const currentUser = useCurrentUser();
  const isDemo = useDemoActive();
  const palette = usePalette();
  // Google puts the display name in user_metadata (full_name, or name on some accounts) and the avatar in picture.
  const meta = session?.user.user_metadata as { full_name?: string; name?: string; picture?: string; role?: UserRole } | undefined;
  const role: UserRole = currentUser?.role ?? meta?.role ?? 'customer';
  const name = currentUser?.fullName ?? (isDemo ? 'Người dùng thử nghiệm' : (meta?.full_name ?? meta?.name));
  const email = currentUser?.email ?? (isDemo ? 'demo@skinsense.app' : session?.user.email);
  const reminder = useReminder();
  const time = formatTime(reminder);
  const reminderSummary = !reminder.on
    ? t('settings.reminderOff')
    : reminder.days.length === 7
      ? t('settings.reminderEvery', { time })
      : t('settings.reminderDays', { time, days: WEEK.filter((d) => reminder.days.includes(d)).map((d) => t(`reminder.day${d}`)).join(', ') });

  const roleBadgeText =
    role === 'admin'
      ? 'Quản Trị Tối Cao'
      : role === 'specialist'
        ? 'Chuyên Viên Da Liễu'
        : role === 'shop'
          ? 'Gian Hàng Đối Tác'
          : 'Khách Hàng (VIP)';

  const roleBadgeColor =
    role === 'admin'
      ? 'text-purple-400 bg-purple-500/10 border-purple-500/25'
      : role === 'specialist'
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
        : role === 'shop'
          ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
          : 'text-sky-400 bg-sky-500/10 border-sky-500/25';

  return (
    <ScrollView contentContainerClassName="gap-2.5 px-[18px] pb-24 pt-4">
      <Text role="heading" aria-level="1" className="px-1 pb-3 font-display text-[50px] font-light leading-[56px]">
        {t('settings.title')}
      </Text>

      <View className={`flex-row items-center gap-3.5 px-[18px] py-3.5 ${CARD}`}>
        <Avatar uri={meta?.picture} />
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            {name && <Text className="text-[15.5px] font-medium">{name}</Text>}
            <View className={`rounded-pill border px-2 py-0.5 ${roleBadgeColor}`}>
              <Text className="text-[10px] font-semibold">{roleBadgeText}</Text>
            </View>
          </View>
          {email && <Text className="text-[13px] font-light text-muted-foreground">{email}</Text>}
          {currentUser?.phoneNumber && (
            <Text className="text-[11.5px] font-light text-muted-foreground">SĐT: {currentUser.phoneNumber}</Text>
          )}
        </View>
      </View>

      <MarketplaceSection role={role} />

      <Group label={t('settings.display')} className="py-1.5 pl-[18px] pr-1.5">
        <View className={ROW}>
          <Text className="text-[15px]">{t('settings.language')}</Text>
          <ToggleGroup
            type="single"
            value={i18n.language}
            onValueChange={(code) => {
              if (!code) return;
              void i18n.changeLanguage(code);
              void AsyncStorage.setItem(LANGUAGE_KEY, code);
            }}
            className="rounded-control border border-border">
            {LANGUAGES.map(([code, label]) => (
              <ToggleGroupItem
                key={code}
                value={code}
                className={`h-11 rounded-control px-3.5 active:bg-transparent ${i18n.language === code ? 'bg-primary' : 'bg-transparent'}`}>
                <Text className={`text-[13px] ${i18n.language === code ? 'font-medium text-primary-foreground' : 'font-normal text-muted-foreground'}`}>{label}</Text>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </View>
      </Group>

      <Group label={t('settings.reminders')} className="pl-[18px] pr-3">
        <Link href="/reminder" asChild>
          <Pressable role="button" className="min-h-[60px] flex-row items-center justify-between gap-3">
            <View className="gap-0.5">
              <Text className="text-[15px]">{t('settings.reminder')}</Text>
              <Text className="text-[12.5px] font-light text-muted-foreground">{reminderSummary}</Text>
            </View>
            <View className="size-11 items-center justify-center">
              <Icon as={ChevronRight} size={20} strokeWidth={1.5} className="text-muted-foreground" />
            </View>
          </Pressable>
        </Link>
        <BiometricLockRow />
      </Group>

      <Group label={t('settings.data')} className="pl-[18px] pr-3">
        <Link href="/history" asChild>
          <Pressable className={ROW}>
            <Text className="text-[15px]">{t('settings.history')}</Text>
            <View className="size-11 items-center justify-center">
              <Icon as={ChevronRight} size={20} strokeWidth={1.5} className="text-muted-foreground" />
            </View>
          </Pressable>
        </Link>
        <ExportRow />
      </Group>

      <Group label={t('settings.support')} className="pl-[18px] pr-3">
        <Link href="/feedback" asChild>
          <Pressable role="button" className={ROW}>
            <Text className="text-[15px]">{t('feedback.title')}</Text>
            <View className="size-11 items-center justify-center">
              <Icon as={ChevronRight} size={20} strokeWidth={1.5} className="text-muted-foreground" />
            </View>
          </Pressable>
        </Link>
        <Link href="/about" asChild>
          <Pressable role="button" className={`${ROW} ${LINE}`}>
            <Text className="text-[15px]">{t('settings.about')}</Text>
            <View className="size-11 items-center justify-center">
              <Icon as={ChevronRight} size={20} strokeWidth={1.5} className="text-muted-foreground" />
            </View>
          </Pressable>
        </Link>
        <ExternalLink href={PRIVACY_URL} asChild>
          <Pressable className={`${ROW} ${LINE}`}>
            <Text className="text-[15px]">{t('settings.privacy')}</Text>
            <View className="size-11 items-center justify-center">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={palette.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <Path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
              </Svg>
            </View>
          </Pressable>
        </ExternalLink>
      </Group>

      <View className="mt-2.5">
        <Group>
          <Pressable
            role="button"
            onPress={async () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await signOut();
              await supabase.auth.signOut();
            }}
            className={ROW}>
            <Text className="text-[15px]">{t('shell.signOut')}</Text>
          </Pressable>
          <DeleteAccountRow />
        </Group>
      </View>
    </ScrollView>
  );
}
