import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import {
  CheckCircle2,
  ChevronLeft,
  Edit3,
  LogOut,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Store,
  User,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InitialsAvatar } from '@/components/artwork';
import { Icon } from '@/components/ui/icon';
import {
  AmbientBackdrop,
  HeaderIconButton,
  MODERN_CARD,
  ToastBanner,
} from '@/components/ui/portal-chrome';
import { Text } from '@/components/ui/text';
import {
  loadAdminRoutinesRemote,
  loadRoleProfileRemote,
  saveRoleProfileRemote,
  uploadImageRemote,
  tickAdminRoutineRemote,
  type RoleProfileRemoteData,
  type RoleRoutineRemote,
} from '@/lib/api';
import {
  getRouteForRole,
  setCurrentUser,
  signOut,
  useCurrentUser,
  type UserRole,
} from '@/lib/auth';

const ROLE_META: Record<UserRole, { label: string; icon: typeof User; accent: string }> = {
  customer: { label: 'Khách hàng SkinSense', icon: User, accent: 'text-emerald-500' },
  specialist: { label: 'Bác sĩ / Chuyên viên Da liễu', icon: Stethoscope, accent: 'text-emerald-500' },
  shop: { label: 'Chủ Gian hàng Đối tác', icon: Store, accent: 'text-amber-500' },
  admin: { label: 'Quản trị Viên Hệ thống', icon: ShieldCheck, accent: 'text-amber-500' },
};

/**
 * Native Role Profile + Editable Metadata + Allocated Role Routine screen
 * matching Web `/profile`, `/admin/profile`, `/specialist/profile`, `/shop/profile`.
 */
export function RoleProfileScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const currentUser = useCurrentUser();
  const role: UserRole = currentUser?.role ?? 'customer';
  const cfg = ROLE_META[role];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Customer fields
  const [custAddress, setCustAddress] = useState('');
  const [custSkinType, setCustSkinType] = useState('Hỗn hợp');
  const [custAllergies, setCustAllergies] = useState('');

  // Specialist fields
  const [specHospital, setSpecHospital] = useState(currentUser?.hospital || '');
  const [specLicense, setSpecLicense] = useState(currentUser?.licenseId || '');
  const [specSpecialty, setSpecSpecialty] = useState(currentUser?.specialty || '');

  // Shop fields
  const [shopName, setShopName] = useState(currentUser?.shopName || currentUser?.shopDetails?.shopName || '');
  const [shopLicense, setShopLicense] = useState(currentUser?.shopDetails?.license || '');
  const [shopAddress, setShopAddress] = useState(currentUser?.shopDetails?.address || '');
  const [shopCategory, setShopCategory] = useState(currentUser?.shopDetails?.category || '');

  // Allocated Role Routine (matching Web AllocatedRoutineView)
  const [roleRoutine, setRoleRoutine] = useState<RoleRoutineRemote | null>(null);
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [profRes, routRes] = await Promise.all([
      loadRoleProfileRemote(role).catch(() => null),
      loadAdminRoutinesRemote(role).catch(() => null),
    ]);

    if (profRes?.ok && profRes.data?.ok && profRes.data.user) {
      const u = profRes.data.user;
      setFullName(u.fullName || currentUser?.fullName || '');
      setEmail(u.email || currentUser?.email || '');
      setPhone(u.phone || currentUser?.phoneNumber || '');
      setAvatarUrl(u.avatarUrl || '');
      if (u.customer) {
        setCustAddress(u.customer.address || '');
        setCustSkinType(u.customer.skinType || 'Hỗn hợp');
        setCustAllergies(u.customer.allergies || '');
      }
      if (u.specialist) {
        setSpecHospital(u.specialist.hospital || '');
        setSpecLicense(u.specialist.licenseNumber || '');
        setSpecSpecialty(u.specialist.specialty || '');
      }
      if (u.shop) {
        setShopName(u.shop.shopName || '');
        setShopLicense(u.shop.license || '');
        setShopAddress(u.shop.address || '');
        setShopCategory(u.shop.category || '');
      }
    }

    const rData = routRes?.data;
    if (routRes?.ok && rData?.ok) {
      const targetRoutine = rData.routine || rData.routines?.[role] || null;
      setRoleRoutine(targetRoutine);
    }

    setLoading(false);
  }, [currentUser?.email, currentUser?.fullName, currentUser?.phoneNumber, role]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  async function handlePickAvatar() {
    if (uploadingAvatar) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const picker = require('expo-image-picker') as typeof import('expo-image-picker');
      const perm = await picker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setToastMsg('Cần cấp quyền thư viện ảnh để đổi ảnh đại diện.');
        return;
      }
      const result = await picker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (result.canceled || !result.assets[0]?.uri) return;
      setUploadingAvatar(true);
      const up = await uploadImageRemote({ uri: result.assets[0].uri, folder: 'avatars' });
      setUploadingAvatar(false);
      if (!up.ok || !up.url) {
        setToastMsg(up.error || 'Tải ảnh đại diện lên thất bại.');
        return;
      }
      setAvatarUrl(up.url);
      setToastMsg('Đã tải ảnh lên. Nhấn Lưu để cập nhật hồ sơ.');
    } catch {
      setUploadingAvatar(false);
      setToastMsg('Máy chưa có module chọn ảnh, cần build lại app.');
    }
  }

  async function handleSave() {
    if (!fullName.trim()) {
      setToastMsg('Họ và tên không được để trống.');
      return;
    }
    setSaving(true);
    const payload: RoleProfileRemoteData = {
      id: currentUser?.id || 'me',
      email: email || currentUser?.email || '',
      role,
      fullName: fullName.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl || undefined,
      ...(role === 'customer'
        ? {
            customer: {
              address: custAddress.trim(),
              skinType: custSkinType.trim(),
              allergies: custAllergies.trim(),
            },
          }
        : {}),
      ...(role === 'specialist'
        ? {
            specialist: {
              hospital: specHospital.trim(),
              licenseNumber: specLicense.trim(),
              specialty: specSpecialty.trim(),
            },
          }
        : {}),
      ...(role === 'shop'
        ? {
            shop: {
              shopName: shopName.trim(),
              license: shopLicense.trim(),
              address: shopAddress.trim(),
              category: shopCategory.trim(),
            },
          }
        : {}),
    };

    const res = await saveRoleProfileRemote(payload).catch(() => null);
    setSaving(false);

    if (!res?.ok || !res.data?.ok) {
      setToastMsg(res?.data?.error || 'Không thể lưu hồ sơ lên máy chủ.');
      return;
    }

    if (currentUser) {
      await setCurrentUser({
        ...currentUser,
        fullName: payload.fullName,
        phoneNumber: payload.phone || currentUser.phoneNumber,
        avatarUrl: avatarUrl || currentUser.avatarUrl,
        hospital: payload.specialist?.hospital ?? currentUser.hospital,
        licenseId: payload.specialist?.licenseNumber ?? currentUser.licenseId,
        specialty: payload.specialist?.specialty ?? currentUser.specialty,
        shopName: payload.shop?.shopName ?? currentUser.shopName,
        shopDetails: payload.shop
          ? { ...currentUser.shopDetails, ...payload.shop }
          : currentUser.shopDetails,
      });
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setEditing(false);
    setToastMsg(res.data.message || 'Đã cập nhật hồ sơ thành công!');
  }

  async function handleToggleRoutineStep(stepId: string, currentDone?: boolean) {
    if (!roleRoutine || togglingStepId) return;
    const nextDone = !currentDone;
    setTogglingStepId(stepId);
    setRoleRoutine((prev) =>
      prev
        ? {
            ...prev,
            steps: prev.steps.map((s) => (s.id === stepId ? { ...s, isCompleted: nextDone } : s)),
          }
        : prev,
    );

    const res = await tickAdminRoutineRemote(role, stepId, nextDone).catch(() => null);
    setTogglingStepId(null);
    if (res?.ok && res.data?.ok && res.data.routine) {
      setRoleRoutine(res.data.routine);
      void Haptics.selectionAsync().catch(() => {});
    }
  }

  const completedCount = roleRoutine?.steps?.filter((s) => s.isCompleted).length ?? 0;
  const totalCount = roleRoutine?.steps?.length ?? 0;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: Math.max(top, 12) + 2 }}
        className="relative overflow-hidden flex-row items-center justify-between border-b border-border/80 bg-card px-3.5 pb-3.5"
      >
        <AmbientBackdrop
          height={120}
          tone={role === 'admin' ? 'gold' : role === 'shop' ? 'terracotta' : 'botanical'}
        />
        <View className="flex-row items-center gap-2 flex-1">
          <Pressable
            role="button"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            className="size-10 items-center justify-center rounded-[12px] border border-border/80 bg-surface-2/90 active:scale-[0.96]"
          >
            <Icon as={ChevronLeft} size={20} strokeWidth={1.6} className="text-foreground" />
          </Pressable>
          <View className="flex-1">
            <Text className={`text-[10.5px] font-bold uppercase tracking-[0.12em] ${cfg.accent}`}>
              {cfg.label}
            </Text>
            <Text className="font-display text-[19px] font-normal text-foreground leading-[24px]">
              Hồ Sơ & Routine Phân Bổ
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1.5">
          <HeaderIconButton icon={RefreshCw} label="Làm mới" onPress={() => void loadAll()} />
          <HeaderIconButton
            icon={LogOut}
            label="Đăng xuất"
            destructive
            onPress={async () => {
              await signOut();
              router.replace('/sign-in' as Href);
            }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(bottom + 24, 32),
          gap: 14,
        }}
      >
        {toastMsg && <ToastBanner message={toastMsg} icon={CheckCircle2} tone="success" />}

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator />
            <Text className="mt-2 text-[12.5px] text-muted-foreground">Đang tải hồ sơ...</Text>
          </View>
        ) : (
          <>
            {/* Profile Card */}
            <View className={`gap-3.5 ${MODERN_CARD} p-4`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <Pressable role="button" disabled={!editing} onPress={() => void handlePickAvatar()} className="active:opacity-80">
                    <InitialsAvatar uri={avatarUrl || undefined} name={fullName || 'SkinSense User'} seed={email || 'user'} size={52} />
                    {editing && <Text className="mt-0.5 text-center text-[10px] text-primary">{uploadingAvatar ? 'Đang tải…' : 'Đổi ảnh'}</Text>}
                  </Pressable>
                  <View className="flex-1">
                    <Text className="text-[16px] font-semibold text-foreground">{fullName || 'Người dùng SkinSense'}</Text>
                    <Text className="text-[12px] text-muted-foreground">{email}</Text>
                  </View>
                </View>
                <Pressable
                  role="button"
                  onPress={() => setEditing((e) => !e)}
                  className="flex-row items-center gap-1 rounded-[12px] border border-border/80 bg-surface-2 px-3 py-2 active:scale-[0.97]"
                >
                  <Icon as={Edit3} size={13} className="text-foreground" />
                  <Text className="text-[12px] font-medium text-foreground">
                    {editing ? 'Hủy sửa' : 'Chỉnh sửa'}
                  </Text>
                </Pressable>
              </View>

              <View className="gap-2.5 border-t border-border/60 pt-3">
                <View className="gap-1">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Họ và tên</Text>
                  {editing ? (
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      className="h-11 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                    />
                  ) : (
                    <Text className="text-[13.5px] text-foreground">{fullName || '—'}</Text>
                  )}
                </View>

                <View className="gap-1">
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Số điện thoại</Text>
                  {editing ? (
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      className="h-11 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                    />
                  ) : (
                    <Text className="text-[13.5px] text-foreground">{phone || 'Chưa cập nhật'}</Text>
                  )}
                </View>

                {role === 'customer' && (
                  <>
                    <View className="gap-1">
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Loại da</Text>
                      {editing ? (
                        <TextInput
                          value={custSkinType}
                          onChangeText={setCustSkinType}
                          className="h-11 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                        />
                      ) : (
                        <Text className="text-[13.5px] text-foreground">{custSkinType || '—'}</Text>
                      )}
                    </View>
                    <View className="gap-1">
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Địa chỉ nhận hàng</Text>
                      {editing ? (
                        <TextInput
                          value={custAddress}
                          onChangeText={setCustAddress}
                          className="h-11 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                        />
                      ) : (
                        <Text className="text-[13.5px] text-foreground">{custAddress || 'Chưa cập nhật'}</Text>
                      )}
                    </View>
                  </>
                )}

                {role === 'specialist' && (
                  <>
                    <View className="gap-1">
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Số CCHN</Text>
                      {editing ? (
                        <TextInput
                          value={specLicense}
                          onChangeText={setSpecLicense}
                          className="h-11 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                        />
                      ) : (
                        <Text className="text-[13.5px] text-emerald-500">{specLicense || '—'}</Text>
                      )}
                    </View>
                    <View className="gap-1">
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bệnh viện / Phòng khám</Text>
                      {editing ? (
                        <TextInput
                          value={specHospital}
                          onChangeText={setSpecHospital}
                          className="h-11 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                        />
                      ) : (
                        <Text className="text-[13.5px] text-foreground">{specHospital || '—'}</Text>
                      )}
                    </View>
                  </>
                )}

                {role === 'shop' && (
                  <>
                    <View className="gap-1">
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tên Gian hàng</Text>
                      {editing ? (
                        <TextInput
                          value={shopName}
                          onChangeText={setShopName}
                          className="h-11 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                        />
                      ) : (
                        <Text className="text-[13.5px] text-amber-500">{shopName || '—'}</Text>
                      )}
                    </View>
                    <View className="gap-1">
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GPKD / MST</Text>
                      <Text className="text-[13.5px] text-foreground">{shopLicense || '—'}</Text>
                    </View>
                    <View className="gap-1">
                      <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Địa chỉ kho</Text>
                      {editing ? (
                        <TextInput
                          value={shopAddress}
                          onChangeText={setShopAddress}
                          className="h-11 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                        />
                      ) : (
                        <Text className="text-[13.5px] text-foreground">{shopAddress || '—'}</Text>
                      )}
                    </View>
                  </>
                )}

                {editing && (
                  <Pressable
                    role="button"
                    disabled={saving}
                    onPress={() => void handleSave()}
                    className="mt-2 h-12 flex-row items-center justify-center gap-2 rounded-[14px] bg-primary active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Icon as={Save} size={15} className="text-primary-foreground" />
                    )}
                    <Text className="text-[13.5px] font-semibold text-primary-foreground">
                      Lưu thay đổi hồ sơ
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Quick Portal Navigation */}
            {currentUser && (
              <Pressable
                role="button"
                onPress={() => router.replace(getRouteForRole(currentUser))}
                className={`h-12 flex-row items-center justify-center gap-2 ${MODERN_CARD} active:scale-[0.98]`}
              >
                <Icon as={cfg.icon} size={16} className={cfg.accent} />
                <Text className="text-[13.5px] font-semibold text-foreground">
                  Mở Không Gian Làm Việc ({role.toUpperCase()})
                </Text>
              </Pressable>
            )}

            {/* Allocated Role Routine (matching Web AllocatedRoutineView) */}
            {roleRoutine && (
              <View className={`gap-3 ${MODERN_CARD} p-4`}>
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-2 flex-1">
                    <Icon as={Sparkles} size={16} className="text-emerald-500" />
                    <Text className="flex-1 text-[15px] font-semibold text-foreground">
                      {roleRoutine.title}
                    </Text>
                  </View>
                  {totalCount > 0 ? (
                    <Text className="text-[12px] font-bold text-emerald-500">
                      {completedCount}/{totalCount} ({completionPct}%)
                    </Text>
                  ) : null}
                </View>
                {totalCount > 0 ? (
                  <View className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <View
                      style={{ width: `${completionPct}%` }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </View>
                ) : null}
                <Text className="text-[12.5px] text-muted-foreground leading-4">{roleRoutine.description}</Text>
                <View className="gap-2">
                  {roleRoutine.steps.map((s) => (
                    <Pressable
                      key={s.id}
                      disabled={togglingStepId === s.id}
                      onPress={() => void handleToggleRoutineStep(s.id, s.isCompleted)}
                      className={`flex-row items-center gap-3 rounded-[14px] border p-3.5 active:scale-[0.99] ${
                        s.isCompleted ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border/70 bg-surface-2'
                      }`}
                    >
                      <Icon
                        as={CheckCircle2}
                        size={17}
                        className={s.isCompleted ? 'text-emerald-500' : 'text-muted-foreground'}
                      />
                      <View className="flex-1">
                        <Text className="text-[13px] font-medium text-foreground">
                          {s.stepNumber}. {s.label}
                          {s.productName ? ` · ${s.productName}` : ''}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground">
                          {s.stepTime === 'morning'
                            ? 'Buổi sáng'
                            : s.stepTime === 'evening'
                              ? 'Buổi tối'
                              : 'Sáng & Tối'}
                          {s.dosage ? ` · ${s.dosage}` : ''}
                          {s.usageGuide ? ` · ${s.usageGuide}` : ''}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
