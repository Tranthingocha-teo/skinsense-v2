import {
  sanitizeDoctorApprovalInput,
  sanitizeShopApprovalInput,
  validateDoctorApprovalInput,
  validateShopApprovalInput,
} from '@skinsense/domain';
import { router, type Href } from 'expo-router';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  Stethoscope,
  Store,
  User,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Mark } from '@/components/mark';
import { Icon } from '@/components/ui/icon';
import { AmbientBackdrop, BottomSheetFrame, GoogleMark } from '@/components/ui/portal-chrome';
import { Text } from '@/components/ui/text';
import {
  getRouteForRole,
  registerAccount,
  signInWithEmail,
  signInWithGoogle,
  signOut,
} from '@/lib/auth';
import { setDemoActive } from '@/lib/demo';

type AuthTab = 'sign-in' | 'register' | 'doctor-approval' | 'shop-approval';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<AuthTab>('sign-in');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sign In Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Form (Customer / Shop matching Web auth-modal.tsx)
  const [regRole, setRegRole] = useState<'customer' | 'shop'>('customer');
  const [regFullName, setRegFullName] = useState('');
  const [regShopName, setRegShopName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Doctor CCHN Approval Form
  const [docName, setDocName] = useState('');
  const [docLicenseId, setDocLicenseId] = useState('');
  const [docHospital, setDocHospital] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('Da liễu & Điều trị mụn');
  const [docEmail, setDocEmail] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docPassword, setDocPassword] = useState('');

  // Shop Approval Form
  const [shopNameInput, setShopNameInput] = useState('');
  const [shopOwnerName, setShopOwnerName] = useState('');
  const [shopLicense, setShopLicense] = useState('');
  const [shopCategory, setShopCategory] = useState('Dược mỹ phẩm trị mụn & phục hồi');
  const [shopAddress, setShopAddress] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopPassword, setShopPassword] = useState('');

  function switchTab(nextTab: AuthTab) {
    setTab(nextTab);
    setError(null);
    setSuccess(null);
  }

  async function handleGoogleLogin() {
    setError(null);
    setSuccess(null);
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      if (!user) return;
      router.replace(getRouteForRole(user));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng nhập Google thất bại.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSignIn() {
    setError(null);
    setSuccess(null);
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      if (user.role === 'admin') {
        setSuccess('Đăng nhập Super Admin thành công! Đang mở Bảng Quản Trị...');
      } else if (user.role === 'specialist') {
        setSuccess('Đăng nhập Bác sĩ thành công! Đang mở Cổng Bác sĩ Chuyên khoa...');
      } else if (user.role === 'shop') {
        setSuccess('Đăng nhập Cửa hàng thành công! Đang mở Kênh Người bán...');
      }
      router.replace(getRouteForRole(user));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneralRegister() {
    setError(null);
    setSuccess(null);
    if (!regFullName.trim()) {
      setError('Vui lòng nhập Họ và tên.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Vui lòng nhập địa chỉ Email hợp lệ.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (regRole === 'shop' && !regShopName.trim()) {
      setError('Vui lòng nhập Tên Cửa Hàng / Shop Name.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerAccount({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        phoneNumber: regPhone,
        role: regRole,
        shopName: regRole === 'shop' ? regShopName : undefined,
      });
      if (result.status === 'signed_in' && result.user) {
        router.replace(getRouteForRole(result.user));
      } else {
        setSuccess(result.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDoctorApprovalSubmit() {
    setError(null);
    setSuccess(null);
    const validation = validateDoctorApprovalInput({
      fullName: docName,
      licenseId: docLicenseId,
      hospital: docHospital,
      email: docEmail,
      password: docPassword,
      phoneNumber: docPhone,
      specialty: docSpecialty,
    });
    if (!validation.isValid) {
      setError(validation.error || 'Thông tin gửi duyệt không hợp lệ.');
      return;
    }
    const payload = sanitizeDoctorApprovalInput({
      fullName: docName,
      licenseId: docLicenseId,
      hospital: docHospital,
      email: docEmail,
      password: docPassword,
      phoneNumber: docPhone,
      specialty: docSpecialty,
    });

    setLoading(true);
    try {
      const result = await registerAccount({
        role: 'specialist',
        email: payload.email,
        password: payload.password,
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        licenseId: payload.licenseId,
        hospital: payload.hospital,
        specialty: payload.specialty,
      });
      setSuccess(
        result.message ||
          'Hồ sơ Bác sĩ đã được gửi thành công! Ban quản trị sẽ xét duyệt Chứng chỉ hành nghề.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gửi yêu cầu thất bại.');
    } finally {
      setLoading(false);
    }
  }

  async function handleShopApprovalSubmit() {
    setError(null);
    setSuccess(null);
    const validation = validateShopApprovalInput({
      shopName: shopNameInput,
      ownerName: shopOwnerName,
      license: shopLicense,
      category: shopCategory,
      address: shopAddress,
      email: shopEmail,
      password: shopPassword,
      phoneNumber: shopPhone,
    });
    if (!validation.isValid) {
      setError(validation.error || 'Thông tin mở gian hàng không hợp lệ.');
      return;
    }
    const payload = sanitizeShopApprovalInput({
      shopName: shopNameInput,
      ownerName: shopOwnerName,
      license: shopLicense,
      category: shopCategory,
      address: shopAddress,
      email: shopEmail,
      password: shopPassword,
      phoneNumber: shopPhone,
    });

    setLoading(true);
    try {
      const result = await registerAccount({
        role: 'shop',
        email: payload.email,
        password: payload.password,
        fullName: payload.ownerName,
        phoneNumber: payload.phoneNumber,
        shopName: payload.shopName,
        license: payload.license,
        category: payload.category,
        address: payload.address,
      });
      setSuccess(
        result.message ||
          'Hồ sơ mở Gian hàng đã được gửi thành công! Super Admin Trần Thị Ngọc Hà sẽ xét duyệt trước khi bạn đăng nhập Kênh Người Bán.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gửi yêu cầu mở gian hàng thất bại.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnterDemo() {
    await signOut();
    await setDemoActive(true);
    router.replace('/(tabs)' as Href);
  }

  const tabs: { id: AuthTab; label: string }[] = [
    { id: 'sign-in', label: 'Đăng nhập' },
    { id: 'register', label: 'Đăng ký' },
    { id: 'doctor-approval', label: 'Bác sĩ duyệt' },
    { id: 'shop-approval', label: 'Mở Gian hàng' },
  ];

  return (
    <View className="flex-1 bg-background">
      <AmbientBackdrop height={280} tone="botanical" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: Math.max(insets.top + 14, 30),
            paddingBottom: Math.max(insets.bottom + 32, 48),
            paddingHorizontal: 18,
            gap: 16,
          }}
        >
          {/* Brand Header */}
          <View className="items-center gap-2.5 pt-2">
            <View className="size-12 items-center justify-center rounded-[16px] border border-border/80 bg-card/90">
              <Mark size={28} />
            </View>
            <View className="items-center gap-1">
              <Text className="font-display text-[21px] tracking-[0.22em] font-normal text-foreground">
                SKINSENSE
              </Text>
              <View className="rounded-full border border-border/80 bg-surface-2/85 px-3 py-1">
                <Text className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  SKINSENSE AUTH & XÉT DUYỆT
                </Text>
              </View>
            </View>
            <Text className="max-w-[310px] text-center text-[13px] font-light leading-5 text-muted-foreground">
              Đăng nhập đồng bộ 4 vai trò (Khách hàng, Bác sĩ, Gian hàng, Admin)
            </Text>
          </View>

          {/* 4 Web Tabs Switcher */}
          <View className="flex-row items-center justify-between gap-1 rounded-[16px] border border-border/85 bg-surface-2/85 p-1">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  role="tab"
                  aria-selected={active}
                  onPress={() => switchTab(item.id)}
                  className={`flex-grow min-h-10 items-center justify-center rounded-[12px] px-2 py-2 ${
                    active ? 'border border-border bg-card' : ''
                  }`}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    className={`text-[11.5px] text-center ${
                      active ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Alert Banners */}
          {error && (
            <View
              accessible
              role="alert"
              className="flex-row items-start gap-2.5 rounded-[16px] border border-destructive/40 bg-destructive/10 p-3.5"
            >
              <Icon as={AlertCircle} size={17} className="mt-0.5 text-destructive" />
              <Text className="flex-1 text-[12.5px] leading-5 text-destructive">{error}</Text>
            </View>
          )}

          {success && (
            <View
              role="status"
              className="flex-row items-start gap-2.5 rounded-[16px] border border-success/40 bg-success/10 p-3.5"
            >
              <Icon as={CheckCircle2} size={17} className="mt-0.5 text-success" />
              <Text className="flex-1 text-[12.5px] leading-5 text-success">{success}</Text>
            </View>
          )}

          {/* Main Auth Card */}
          <View className="gap-4 rounded-[22px] border border-border/85 bg-card p-5">
            {/* Google OAuth Section (on Sign In & Register matching Web) */}
            {(tab === 'sign-in' || tab === 'register') && (
              <View className="gap-2.5 rounded-[16px] border border-border/80 bg-surface-2/65 p-4">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-row items-center gap-1.5 flex-1">
                    <Icon as={Sparkles} size={14} className="text-foreground shrink-0" />
                    <Text className="flex-1 text-[12px] font-semibold leading-4 text-foreground">
                      Đăng nhập bằng Gmail (Google / Supabase)
                    </Text>
                  </View>
                  <View className="shrink-0 rounded-full border border-border bg-card px-2.5 py-0.5">
                    <Text className="text-[10px] font-semibold text-success">Khuyên dùng</Text>
                  </View>
                </View>
                <Text className="text-[11.5px] leading-4 text-muted-foreground">
                  Tiếp tục qua Supabase OAuth — Đăng nhập an toàn, đồng bộ cùng tài khoản Web.
                </Text>
                <Pressable
                  role="button"
                  disabled={googleLoading}
                  onPress={() => void handleGoogleLogin()}
                  className="mt-0.5 h-12 flex-row items-center justify-center gap-2.5 rounded-[13px] border border-border bg-background active:scale-[0.99] disabled:opacity-50"
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <>
                      <GoogleMark size={18} />
                      <Text className="text-[13.5px] font-semibold text-foreground">
                        Tiếp tục bằng Gmail (Google OAuth)
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* TAB 1: SIGN IN */}
            {tab === 'sign-in' && (
              <View className="gap-3.5">
                <View className="flex-row items-center gap-2.5">
                  <View className="h-px flex-1 bg-border/70" />
                  <Text className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    hoặc đăng nhập với tài khoản & mật khẩu
                  </Text>
                  <View className="h-px flex-1 bg-border/70" />
                </View>

                <View className="gap-1.5">
                  <Text className="text-[12px] font-medium text-foreground">Địa chỉ Email</Text>
                  <View className="h-12 flex-row items-center rounded-[13px] border border-border/90 bg-background px-3.5 gap-2.5">
                    <Icon as={Mail} size={16} className="text-muted-foreground" />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="nhap-email-cua-ban@gmail.com"
                      placeholderTextColor="#888"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="flex-1 text-[13.5px] text-foreground"
                    />
                  </View>
                </View>

                <View className="gap-1.5">
                  <Text className="text-[12px] font-medium text-foreground">Mật khẩu</Text>
                  <View className="h-12 flex-row items-center rounded-[13px] border border-border/90 bg-background px-3.5 gap-2.5">
                    <Icon as={Lock} size={16} className="text-muted-foreground" />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#888"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="flex-1 text-[13.5px] text-foreground"
                    />
                    <Pressable onPress={() => setShowPassword((s) => !s)} className="p-1.5">
                      <Icon as={showPassword ? EyeOff : Eye} size={16} className="text-muted-foreground" />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  role="button"
                  disabled={loading}
                  onPress={() => void handleSignIn()}
                  className="mt-1 h-12 flex-row items-center justify-center rounded-[13px] bg-primary active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-[14.5px] font-semibold text-primary-foreground">
                      Đăng nhập ngay
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* TAB 2: GENERAL REGISTER */}
            {tab === 'register' && (
              <View className="gap-3">
                <Text className="text-[12px] font-medium text-foreground">
                  Bạn muốn đăng ký vai trò:
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { id: 'customer' as const, label: 'Khách hàng (Soi da)', icon: User },
                    { id: 'shop' as const, label: 'Cửa hàng mỹ phẩm', icon: Store },
                  ].map((r) => {
                    const active = regRole === r.id;
                    return (
                      <Pressable
                        key={r.id}
                        role="button"
                        onPress={() => setRegRole(r.id)}
                        className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-[13px] border py-2.5 px-2 ${
                          active ? 'border-foreground bg-surface-2' : 'border-border/80 bg-background'
                        }`}
                      >
                        <Icon
                          as={r.icon}
                          size={15}
                          className={active ? 'text-foreground' : 'text-muted-foreground'}
                        />
                        <Text
                          className={`text-[12px] ${
                            active ? 'font-semibold text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {r.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  value={regFullName}
                  onChangeText={setRegFullName}
                  placeholder="Họ và tên *"
                  placeholderTextColor="#888"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />

                {regRole === 'shop' && (
                  <TextInput
                    value={regShopName}
                    onChangeText={setRegShopName}
                    placeholder="Tên Cửa Hàng / Shop Name *"
                    placeholderTextColor="#888"
                    className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                  />
                )}

                <TextInput
                  value={regEmail}
                  onChangeText={setRegEmail}
                  placeholder="Địa chỉ Email *"
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <TextInput
                  value={regPhone}
                  onChangeText={setRegPhone}
                  placeholder="Số điện thoại"
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <View className="h-12 flex-row items-center rounded-[13px] border border-border/90 bg-background px-3.5 gap-2">
                  <TextInput
                    value={regPassword}
                    onChangeText={setRegPassword}
                    placeholder="Mật khẩu (≥ 6 ký tự) *"
                    placeholderTextColor="#888"
                    secureTextEntry={!showRegPassword}
                    autoCapitalize="none"
                    className="flex-1 text-[13.5px] text-foreground"
                  />
                  <Pressable onPress={() => setShowRegPassword((s) => !s)} className="p-1.5">
                    <Icon as={showRegPassword ? EyeOff : Eye} size={16} className="text-muted-foreground" />
                  </Pressable>
                </View>
                <TextInput
                  value={regConfirmPassword}
                  onChangeText={setRegConfirmPassword}
                  placeholder="Xác nhận mật khẩu *"
                  placeholderTextColor="#888"
                  secureTextEntry={!showRegPassword}
                  autoCapitalize="none"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />

                <Pressable
                  role="button"
                  disabled={loading}
                  onPress={() => void handleGeneralRegister()}
                  className="mt-1 h-12 items-center justify-center rounded-[13px] bg-primary active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-[14.5px] font-semibold text-primary-foreground">
                      Đăng ký tài khoản ngay
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* TAB 3: DOCTOR APPROVAL */}
            {tab === 'doctor-approval' && (
              <View className="gap-3">
                <View className="gap-1.5 rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                  <View className="flex-row items-center gap-2">
                    <Icon as={Stethoscope} size={15} className="text-emerald-500" />
                    <Text className="text-[12.5px] font-semibold text-emerald-500">
                      Quy trình xét duyệt Bác sĩ Chuyên khoa Da liễu
                    </Text>
                  </View>
                  <Text className="text-[11.5px] leading-4 text-muted-foreground">
                    Bác sĩ gửi thông tin Chứng chỉ hành nghề (CCHN) và đơn vị công tác để kích hoạt tài khoản chuyên môn và quyền kê phác đồ da y khoa.
                  </Text>
                </View>

                <View className="h-12 flex-row items-center rounded-[13px] border border-border/90 bg-background px-3.5 gap-2.5">
                  <Icon as={User} size={15} className="text-muted-foreground" />
                  <TextInput
                    value={docName}
                    onChangeText={setDocName}
                    placeholder="Họ và tên Bác sĩ / Học vị *"
                    placeholderTextColor="#888"
                    className="flex-1 text-[13.5px] text-foreground"
                  />
                </View>
                <View className="h-12 flex-row items-center rounded-[13px] border border-border/90 bg-background px-3.5 gap-2.5">
                  <Icon as={FileCheck2} size={15} className="text-muted-foreground" />
                  <TextInput
                    value={docLicenseId}
                    onChangeText={setDocLicenseId}
                    placeholder="Số Chứng chỉ hành nghề (CCHN) *"
                    placeholderTextColor="#888"
                    className="flex-1 text-[13.5px] text-foreground"
                  />
                </View>
                <View className="h-12 flex-row items-center rounded-[13px] border border-border/90 bg-background px-3.5 gap-2.5">
                  <Icon as={Building2} size={15} className="text-muted-foreground" />
                  <TextInput
                    value={docHospital}
                    onChangeText={setDocHospital}
                    placeholder="Đơn vị / Bệnh viện công tác *"
                    placeholderTextColor="#888"
                    className="flex-1 text-[13.5px] text-foreground"
                  />
                </View>
                <TextInput
                  value={docSpecialty}
                  onChangeText={setDocSpecialty}
                  placeholder="Chuyên khoa điều trị"
                  placeholderTextColor="#888"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <View className="h-12 flex-row items-center rounded-[13px] border border-border/90 bg-background px-3.5 gap-2.5">
                  <Icon as={Mail} size={15} className="text-muted-foreground" />
                  <TextInput
                    value={docEmail}
                    onChangeText={setDocEmail}
                    placeholder="Email liên hệ (Gmail) *"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 text-[13.5px] text-foreground"
                  />
                </View>
                <View className="h-12 flex-row items-center rounded-[13px] border border-border/90 bg-background px-3.5 gap-2.5">
                  <Icon as={Phone} size={15} className="text-muted-foreground" />
                  <TextInput
                    value={docPhone}
                    onChangeText={setDocPhone}
                    placeholder="Số điện thoại liên hệ *"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    className="flex-1 text-[13.5px] text-foreground"
                  />
                </View>
                <View className="h-12 flex-row items-center rounded-[13px] border border-border/90 bg-background px-3.5 gap-2.5">
                  <Icon as={Lock} size={15} className="text-muted-foreground" />
                  <TextInput
                    value={docPassword}
                    onChangeText={setDocPassword}
                    placeholder="Mật khẩu khởi tạo (≥ 6 ký tự) *"
                    placeholderTextColor="#888"
                    secureTextEntry
                    autoCapitalize="none"
                    className="flex-1 text-[13.5px] text-foreground"
                  />
                </View>

                <Pressable
                  role="button"
                  disabled={loading}
                  onPress={() => void handleDoctorApprovalSubmit()}
                  className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-[13px] bg-emerald-600 active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon as={Stethoscope} size={16} className="text-white" />
                      <Text className="text-[14px] font-semibold text-white">
                        Gửi yêu cầu duyệt Bác sĩ
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* TAB 4: SHOP APPROVAL */}
            {tab === 'shop-approval' && (
              <View className="gap-3">
                <View className="gap-1.5 rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-3.5">
                  <View className="flex-row items-center gap-2">
                    <Icon as={Store} size={15} className="text-amber-500" />
                    <Text className="text-[12.5px] font-semibold text-amber-500">
                      Quy trình xét duyệt Mở Gian Hàng Đối Tác
                    </Text>
                  </View>
                  <Text className="text-[11.5px] leading-4 text-muted-foreground">
                    Chủ shop gửi Giấy phép ĐKKD / Mã số thuế và địa chỉ kho hàng để Super Admin Trần Thị Ngọc Hà kiểm duyệt trước khi mở bán.
                  </Text>
                </View>

                <TextInput
                  value={shopNameInput}
                  onChangeText={setShopNameInput}
                  placeholder="Tên Gian hàng / Thương hiệu kinh doanh *"
                  placeholderTextColor="#888"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <TextInput
                  value={shopOwnerName}
                  onChangeText={setShopOwnerName}
                  placeholder="Họ tên Chủ sở hữu / Người đại diện *"
                  placeholderTextColor="#888"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <TextInput
                  value={shopLicense}
                  onChangeText={setShopLicense}
                  placeholder="Mã số thuế / Số ĐKKD mỹ phẩm *"
                  placeholderTextColor="#888"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <TextInput
                  value={shopCategory}
                  onChangeText={setShopCategory}
                  placeholder="Danh mục sản phẩm kinh doanh *"
                  placeholderTextColor="#888"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <TextInput
                  value={shopAddress}
                  onChangeText={setShopAddress}
                  placeholder="Địa chỉ gian hàng / Kho xuất hàng *"
                  placeholderTextColor="#888"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <TextInput
                  value={shopEmail}
                  onChangeText={setShopEmail}
                  placeholder="Email liên hệ (Gmail) *"
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <TextInput
                  value={shopPhone}
                  onChangeText={setShopPhone}
                  placeholder="Số điện thoại Hotline / Zalo *"
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />
                <TextInput
                  value={shopPassword}
                  onChangeText={setShopPassword}
                  placeholder="Mật khẩu khởi tạo (≥ 6 ký tự) *"
                  placeholderTextColor="#888"
                  secureTextEntry
                  autoCapitalize="none"
                  className="h-12 rounded-[13px] border border-border/90 bg-background px-3.5 text-[13.5px] text-foreground"
                />

                <Pressable
                  role="button"
                  disabled={loading}
                  onPress={() => void handleShopApprovalSubmit()}
                  className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-[13px] bg-amber-600 active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon as={Store} size={16} className="text-white" />
                      <Text className="text-[14px] font-semibold text-white">
                        Gửi yêu cầu mở gian hàng
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>

          {/* Secondary Visitor Actions */}
          <View className="flex-row items-center justify-center gap-3 pt-1">
            <Pressable
              role="button"
              onPress={() => void handleEnterDemo()}
              className="rounded-full border border-border/70 bg-surface-2/80 px-4 py-2 active:opacity-80"
            >
              <Text className="text-[12.5px] font-medium text-muted-foreground">
                Xem thử (dữ liệu mẫu)
              </Text>
            </Pressable>
            <Pressable
              role="button"
              onPress={() => setShowPrivacyModal(true)}
              className="rounded-full border border-border/70 bg-surface-2/80 px-4 py-2 active:opacity-80"
            >
              <Text className="text-[12.5px] font-medium text-muted-foreground">
                Chính sách bảo mật
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showPrivacyModal} animationType="slide" transparent onRequestClose={() => setShowPrivacyModal(false)}>
        <BottomSheetFrame bottomInset={insets.bottom}>
          <View className="gap-3">
            <Text className="font-display text-[20px] font-normal text-foreground">
              Chính sách Bảo mật SkinSense
            </Text>
            <Text className="text-[13.5px] leading-5 text-muted-foreground">
              Ảnh da, hồ sơ bệnh án và thông tin đặt hàng của bạn được mã hóa và phân quyền nghiêm ngặt theo vai trò (Khách hàng, Bác sĩ Da liễu, Gian hàng, Quản trị viên) trên hệ thống Supabase SkinSense.
            </Text>
            <Pressable
              role="button"
              onPress={() => setShowPrivacyModal(false)}
              className="mt-2 h-12 items-center justify-center rounded-[13px] bg-primary active:scale-[0.99]"
            >
              <Text className="text-[14px] font-semibold text-primary-foreground">Đã hiểu</Text>
            </Pressable>
          </View>
        </BottomSheetFrame>
      </Modal>
    </View>
  );
}
