import AsyncStorage from '@react-native-async-storage/async-storage';
import { color } from '@skinsense/tokens/tokens.json';
import * as Haptics from 'expo-haptics';
import { Link, router, useRouter } from 'expo-router';
import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileText,
  FlaskConical,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Store,
  X,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
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
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportNotesAndTagsCsv, exportRoutineCsv, exportSpotsCsv, exportZoneReadingsCsv } from '@skinsense/domain';
import { submitRoleApplicationRemote } from '@/lib/api';
import { useBiometricsSetting } from '@/lib/biometrics';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Icon } from '@/components/ui/icon';
import { BottomSheetFrame, MODERN_INPUT } from '@/components/ui/portal-chrome';
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
const CARD = 'rounded-[20px] border border-border/80 bg-card';
const LABEL = 'px-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[1.32px] text-muted-foreground';
const ROW = 'min-h-14 flex-row items-center justify-between gap-3';
const LINE = 'border-t border-border/70';
const BUTTON = 'h-[52px] flex-1 flex-row items-center justify-center gap-2.5 rounded-[14px] px-3';
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
// Thứ tự ưu tiên (spec 002): ảnh đã tải lên (Cloudinary) → ảnh Google → gradient. Ảnh lỗi thì rơi xuống bậc kế.
function Avatar({ uris }: { uris: (string | undefined)[] }) {
  const palette = usePalette();
  const { t } = useTranslation();
  const candidates = uris.filter((u): u is string => !!u);
  const [failed, setFailed] = useState<string[]>([]);
  const uri = candidates.find((u) => !failed.includes(u));
  if (uri) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed((f) => [...f, uri])}
        accessibilityLabel={t('settings.avatar')}
        className="size-11 rounded-pill"
        accessibilityIgnoresInvertColors
      />
    );
  }
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
  const session = useSession();
  const currentUser = useCurrentUser();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyRole, setApplyRole] = useState<'specialist' | 'shop'>('specialist');
  const [applyName, setApplyName] = useState(currentUser?.fullName || '');
  const [applyEmail, setApplyEmail] = useState(currentUser?.email || session?.user?.email || '');
  const [applyPhone, setApplyPhone] = useState(currentUser?.phoneNumber || '');
  const [licenseId, setLicenseId] = useState('');
  const [hospital, setHospital] = useState('');
  const [specialty, setSpecialty] = useState('Da liễu Thẩm mỹ & Trị mụn');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [applyErrorMessage, setApplyErrorMessage] = useState<string | null>(null);

  async function handleSubmitRoleApplication() {
    if (!applyEmail.trim() || !applyName.trim()) {
      setApplyErrorMessage('Vui lòng nhập đầy đủ họ tên và email.');
      return;
    }
    if (applyRole === 'specialist' && !licenseId.trim()) {
      setApplyErrorMessage('Vui lòng nhập số Chứng chỉ hành nghề (CCHN).');
      return;
    }
    if (applyRole === 'shop' && !shopName.trim()) {
      setApplyErrorMessage('Vui lòng nhập tên gian hàng.');
      return;
    }
    setApplyErrorMessage(null);
    setSubmittingApply(true);
    const res = await submitRoleApplicationRemote({
      role: applyRole,
      email: applyEmail.trim(),
      fullName: applyName.trim(),
      doctorName: applyRole === 'specialist' ? applyName.trim() : undefined,
      ownerName: applyRole === 'shop' ? applyName.trim() : undefined,
      phoneNumber: applyPhone.trim() || undefined,
      licenseId: applyRole === 'specialist' ? licenseId.trim() : undefined,
      hospital: applyRole === 'specialist' ? hospital.trim() : undefined,
      specialty: applyRole === 'specialist' ? specialty.trim() : undefined,
      shopName: applyRole === 'shop' ? shopName.trim() : undefined,
      address: applyRole === 'shop' ? shopAddress.trim() : undefined,
      license: applyRole === 'shop' ? licenseId.trim() || undefined : undefined,
    });
    setSubmittingApply(false);
    if (res.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setApplySuccessMessage(
        res.data?.message ||
          (applyRole === 'specialist'
            ? 'Đã gửi hồ sơ Bác sĩ (CCHN) thành công! Admin sẽ phê duyệt sớm.'
            : 'Đã gửi hồ sơ mở Gian hàng đối tác thành công!'),
      );
    } else {
      setApplyErrorMessage(res.error || 'Không thể gửi hồ sơ lúc này. Vui lòng thử lại.');
    }
  }

  return (
    <Group label="Cửa Hàng & Quản Trị SkinSense" className="px-[18px]">
      {/* Customer Orders */}
      <Pressable
        role="button"
        accessibilityLabel="Đơn mua của tôi"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/orders' as any);
        }}
        className={ROW}
      >
        <View className="flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-[11px] border border-primary/20 bg-primary/10">
            <Icon as={ShoppingBag} size={16} className="text-primary" />
          </View>
          <View className="gap-0.5">
            <Text className="text-[14.5px] font-medium">Đơn mua của tôi</Text>
            <Text className="text-[12px] font-light text-muted-foreground">
              Theo dõi vận đơn Giao nhanh & đánh giá nhận hàng
            </Text>
          </View>
        </View>
        <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
      </Pressable>

      {/* Clinical Storefront + Routine Builder */}
      <Pressable
        role="button"
        accessibilityLabel="Sàn Dược Mỹ Phẩm & Routine"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/store' as any);
        }}
        className={`${ROW} ${LINE}`}
      >
        <View className="flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-[11px] border border-primary/20 bg-primary/10">
            <Icon as={FlaskConical} size={16} className="text-primary" />
          </View>
          <View className="gap-0.5">
            <Text className="text-[14.5px] font-medium">Sàn Dược Mỹ Phẩm & Routine</Text>
            <Text className="text-[12px] font-light text-muted-foreground">
              Tìm theo hoạt chất, xếp AM/PM & check xung đột
            </Text>
          </View>
        </View>
        <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
      </Pressable>

      {/* Prescribed Routine & Clinical Records */}
      <Pressable
        role="button"
        accessibilityLabel="Phác đồ Bác sĩ & Bệnh án"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/prescribed' as any);
        }}
        className={`${ROW} ${LINE}`}
      >
        <View className="flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-[11px] border border-emerald-500/25 bg-emerald-500/10">
            <Icon as={FileText} size={16} className="text-emerald-500" />
          </View>
          <View className="gap-0.5">
            <Text className="text-[14.5px] font-medium">Phác đồ Bác sĩ & Bệnh án</Text>
            <Text className="text-[12px] font-light text-muted-foreground">
              Theo dõi đơn kê chuyên khoa & trạng thái BA
            </Text>
          </View>
        </View>
        <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
      </Pressable>

      {/* Register Doctor / Shop Partner */}
      {role === 'customer' && (
        <Pressable
          role="button"
          accessibilityLabel="Đăng ký Bác sĩ / Đối tác Shop"
          onPress={() => {
            setApplySuccessMessage(null);
            setApplyErrorMessage(null);
            setShowApplyModal(true);
          }}
          className={`${ROW} ${LINE}`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-[11px] border border-amber-500/25 bg-amber-500/10">
              <Icon as={Stethoscope} size={16} className="text-amber-500" />
            </View>
            <View className="gap-0.5">
              <Text className="text-[14.5px] font-medium">Đăng ký Bác sĩ / Đối tác Shop</Text>
              <Text className="text-[12px] font-light text-muted-foreground">
                Nộp hồ sơ CCHN chuyên khoa hoặc mở gian hàng mall
              </Text>
            </View>
          </View>
          <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
        </Pressable>
      )}

      {/* Specialist Consultation */}
      {role === 'specialist' && (
        <Pressable
          role="button"
          accessibilityLabel="Cổng Bác Sĩ Da Liễu"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/specialist' as any);
          }}
          className={`${ROW} ${LINE}`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-[11px] border border-emerald-500/25 bg-emerald-500/10">
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
          accessibilityLabel="Kênh Người Bán"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/shop' as any);
          }}
          className={`${ROW} ${LINE}`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-[11px] border border-amber-500/25 bg-amber-500/10">
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
          accessibilityLabel="Quản Trị Cửa Hàng (Admin)"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/admin' as any);
          }}
          className={`${ROW} ${LINE}`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-9 items-center justify-center rounded-[11px] border border-amber-500/25 bg-amber-500/10">
              <Icon as={ShieldCheck} size={16} className="text-amber-500" />
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

      {/* Role Isolation Summary Badge */}
      <View className={`${LINE} py-3 flex-row items-center justify-between`}>
        <View className="flex-row items-center gap-2">
          <View className="size-2 rounded-full bg-emerald-500" />
          <Text className="text-[12px] text-muted-foreground">Phân quyền tài khoản:</Text>
        </View>
        <View className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5">
          <Text className="text-[11px] font-semibold text-primary capitalize">
            {role === 'admin'
              ? 'Quản trị viên'
              : role === 'shop'
              ? 'Gian hàng đối tác'
              : role === 'specialist'
              ? 'Bác sĩ da liễu'
              : 'Khách hàng'}
          </Text>
        </View>
      </View>

      {/* Role Application Modal: Doctor CCHN or Shop Partner */}
      <Modal visible={showApplyModal} animationType="slide" transparent>
        <BottomSheetFrame bottomInset={36} maxHeightClass="max-h-[85%]">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary">
                Hồ sơ đối tác SkinSense
              </Text>
              <Text className="font-display text-[20px] font-normal text-foreground">
                Đăng ký Bác sĩ / Gian hàng
              </Text>
            </View>
            <Pressable onPress={() => setShowApplyModal(false)} className="size-8 items-center justify-center rounded-full bg-surface-2">
              <Icon as={X} size={17} className="text-muted-foreground" />
            </Pressable>
          </View>

          {applySuccessMessage ? (
            <View className="items-center gap-3 py-5">
              <Icon as={CheckCircle2} size={36} className="text-emerald-500" />
              <Text className="text-center text-[14px] font-medium text-foreground">
                {applySuccessMessage}
              </Text>
              <Pressable
                onPress={() => setShowApplyModal(false)}
                className="mt-2 h-12 w-full items-center justify-center rounded-[14px] bg-primary active:scale-[0.98]">
                <Text className="text-[14px] font-semibold text-primary-foreground">Đóng</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-2">
              <View className="flex-row gap-2">
                {[
                  { id: 'specialist' as const, label: 'Bác sĩ Da liễu (CCHN)' },
                  { id: 'shop' as const, label: 'Gian hàng Đối tác' },
                ].map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => setApplyRole(opt.id)}
                    className={`flex-1 items-center rounded-full border py-2.5 active:scale-[0.98] ${
                      applyRole === opt.id ? 'border-foreground bg-foreground' : 'border-border/80 bg-surface-2'
                    }`}>
                    <Text className={`text-[12px] font-medium ${applyRole === opt.id ? 'text-background' : 'text-foreground'}`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={applyName}
                onChangeText={setApplyName}
                placeholder={applyRole === 'specialist' ? 'Họ và tên Bác sĩ *' : 'Họ và tên Chủ gian hàng *'}
                placeholderTextColor="#888"
                className={MODERN_INPUT}
              />
              <TextInput
                value={applyEmail}
                onChangeText={setApplyEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Email đăng nhập tài khoản *"
                placeholderTextColor="#888"
                className={MODERN_INPUT}
              />
              <TextInput
                value={applyPhone}
                onChangeText={setApplyPhone}
                keyboardType="phone-pad"
                placeholder="Số điện thoại liên hệ"
                placeholderTextColor="#888"
                className={MODERN_INPUT}
              />

              {applyRole === 'specialist' ? (
                <>
                  <TextInput
                    value={licenseId}
                    onChangeText={setLicenseId}
                    placeholder="Số Chứng chỉ hành nghề (CCHN) *"
                    placeholderTextColor="#888"
                    className={MODERN_INPUT}
                  />
                  <TextInput
                    value={hospital}
                    onChangeText={setHospital}
                    placeholder="Bệnh viện / Phòng khám công tác"
                    placeholderTextColor="#888"
                    className={MODERN_INPUT}
                  />
                  <TextInput
                    value={specialty}
                    onChangeText={setSpecialty}
                    placeholder="Chuyên khoa"
                    placeholderTextColor="#888"
                    className={MODERN_INPUT}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    value={shopName}
                    onChangeText={setShopName}
                    placeholder="Tên Gian hàng Chính hãng *"
                    placeholderTextColor="#888"
                    className={MODERN_INPUT}
                  />
                  <TextInput
                    value={shopAddress}
                    onChangeText={setShopAddress}
                    placeholder="Địa chỉ kho / chi nhánh"
                    placeholderTextColor="#888"
                    className={MODERN_INPUT}
                  />
                  <TextInput
                    value={licenseId}
                    onChangeText={setLicenseId}
                    placeholder="Số GPKD / Công bố mỹ phẩm"
                    placeholderTextColor="#888"
                    className={MODERN_INPUT}
                  />
                </>
              )}

              {applyErrorMessage && (
                <Text role="alert" className="text-[12px] text-destructive">
                  {applyErrorMessage}
                </Text>
              )}

              <Pressable
                disabled={submittingApply}
                onPress={() => void handleSubmitRoleApplication()}
                className="mt-1 h-12 items-center justify-center rounded-[14px] bg-primary active:scale-[0.98] disabled:opacity-50">
                {submittingApply ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-[14px] font-semibold text-primary-foreground">
                    Gửi hồ sơ xét duyệt
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          )}
        </BottomSheetFrame>
      </Modal>
    </Group>
  );
}

export function Settings() {
  const { t, i18n } = useTranslation();
  const session = useSession();
  const currentUser = useCurrentUser();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const isDemo = useDemoActive();
  const routerNav = useRouter();
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
      ? 'text-amber-400 bg-amber-500/12 border-amber-500/30'
      : role === 'specialist'
        ? 'text-emerald-400 bg-emerald-500/12 border-emerald-500/30'
        : role === 'shop'
          ? 'text-amber-400 bg-amber-500/12 border-amber-500/30'
          : 'text-emerald-500 bg-emerald-500/12 border-emerald-500/25';

  return (
    <ScrollView contentContainerClassName="gap-3 px-[18px] pb-24 pt-4">
      <Text role="heading" aria-level="1" className="px-1 pb-2 font-display text-[46px] font-light leading-[52px]">
        {t('settings.title')}
      </Text>

      <Pressable
        role="button"
        onPress={() => routerNav.push('/profile' as any)}
        className={`flex-row items-center gap-3.5 px-[18px] py-4 ${CARD} active:scale-[0.99]`}
      >
        <Avatar uris={[currentUser?.avatarUrl, meta?.picture]} />
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-2 flex-wrap">
            {name && <Text className="text-[15.5px] font-semibold">{name}</Text>}
            <View className={`rounded-full border px-2.5 py-0.5 ${roleBadgeColor}`}>
              <Text className="text-[10px] font-semibold">{roleBadgeText}</Text>
            </View>
          </View>
          {email && <Text className="text-[13px] font-light text-muted-foreground">{email}</Text>}
          {currentUser?.phoneNumber && (
            <Text className="text-[11.5px] font-light text-muted-foreground">SĐT: {currentUser.phoneNumber}</Text>
          )}
          {role === 'specialist' && (currentUser?.licenseId || currentUser?.hospital) && (
            <Text className="text-[11.5px] text-emerald-500">
              CCHN: {currentUser.licenseId || 'Đang xác minh'} {currentUser.hospital ? `· ${currentUser.hospital}` : ''}
            </Text>
          )}
          {role === 'shop' && (currentUser?.shopName || currentUser?.shopDetails?.license) && (
            <Text className="text-[11.5px] text-amber-500">
              {currentUser.shopName || 'Gian hàng đối tác'}{' '}
              {currentUser.status === 'pending' ? '(Chờ duyệt GPKD)' : '(Đang hoạt động)'}
            </Text>
          )}
          <Text className="text-[11px] font-medium text-primary">Chỉnh sửa hồ sơ & Routine phân bổ →</Text>
        </View>
        <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
      </Pressable>

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
            className="rounded-[13px] border border-border/80 bg-surface-2 p-0.5">
            {LANGUAGES.map(([code, label]) => (
              <ToggleGroupItem
                key={code}
                value={code}
                className={`h-10 rounded-[11px] px-3.5 active:bg-transparent ${i18n.language === code ? 'bg-primary' : 'bg-transparent'}`}>
                <Text className={`text-[13px] ${i18n.language === code ? 'font-semibold text-primary-foreground' : 'font-normal text-muted-foreground'}`}>{label}</Text>
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
        <Pressable role="button" onPress={() => setShowPrivacyModal(true)} className={`${ROW} ${LINE}`}>
          <Text className="text-[15px]">{t('settings.privacy')}</Text>
          <View className="size-11 items-center justify-center">
            <Icon as={ChevronRight} size={20} strokeWidth={1.5} className="text-muted-foreground" />
          </View>
        </Pressable>
      </Group>

      <Modal visible={showPrivacyModal} animationType="slide" transparent onRequestClose={() => setShowPrivacyModal(false)}>
        <BottomSheetFrame bottomInset={36}>
          <View className="gap-3">
            <Text className="font-display text-[20px] font-normal text-foreground">
              {t('settings.privacy')}
            </Text>
            <Text className="text-[13.5px] leading-5 text-muted-foreground">
              Dữ liệu chụp da, bệnh án tư vấn và đơn hàng SkinSense được lưu bảo mật trên tài khoản Supabase của bạn và phân quyền nghiêm ngặt theo vai trò (Khách hàng, Bác sĩ, Gian hàng, Quản trị viên).
            </Text>
            <Pressable
              role="button"
              onPress={() => setShowPrivacyModal(false)}
              className="mt-2 h-12 items-center justify-center rounded-[14px] bg-primary active:scale-[0.98]"
            >
              <Text className="text-[14px] font-semibold text-primary-foreground">Đóng</Text>
            </Pressable>
          </View>
        </BottomSheetFrame>
      </Modal>

      <View className="mt-2.5">
        <Group>
          <Pressable
            role="button"
            onPress={async () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await signOut();
              await supabase.auth.signOut();
              try {
                router.replace('/sign-in' as any);
              } catch {}
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
