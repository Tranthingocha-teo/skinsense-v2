import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Store,
  User,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  DEFAULT_ACCOUNTS,
  findAccountByPhone,
  registerAccount,
  resetPassword,
  signInWithEmail,
  type UserRole,
} from '@/lib/auth';

type AuthMode = 'sign-in' | 'register' | 'recovery';
type RecoveryTab = 'password' | 'account';

export default function SignInScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [registerRole, setRegisterRole] = useState<UserRole>('customer');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regShopName, setRegShopName] = useState('');
  const [regSpecialty, setRegSpecialty] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);

  // Recovery state
  const [recoveryTab, setRecoveryTab] = useState<RecoveryTab>('password');
  const [recEmail, setRecEmail] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recConfirmPassword, setRecConfirmPassword] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recoveredEmail, setRecoveredEmail] = useState<string | null>(null);

  function resetFeedback() {
    setError(null);
    setSuccess(null);
  }

  async function handleSignIn(targetEmail?: string, targetPassword?: string) {
    resetFeedback();
    const loginEmail = targetEmail ?? email;
    const loginPassword = targetPassword ?? password;

    if (!loginEmail.trim() || !loginPassword) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(loginEmail, loginPassword);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    resetFeedback();
    if (!regFullName.trim()) {
      setError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!regPhone.trim()) {
      setError('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }
    if (registerRole === 'shop' && !regShopName.trim()) {
      setError('Vui lòng nhập tên gian hàng của bạn.');
      return;
    }
    if (registerRole === 'specialist' && !regSpecialty.trim()) {
      setError('Vui lòng nhập chuyên khoa hoặc nơi công tác.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setLoading(true);
    try {
      await registerAccount({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        phoneNumber: regPhone,
        role: registerRole,
        shopName: registerRole === 'shop' ? regShopName : undefined,
        specialty: registerRole === 'specialist' ? regSpecialty : undefined,
      });
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    resetFeedback();
    if (!recEmail.trim() || !recEmail.includes('@')) {
      setError('Vui lòng nhập email tài khoản của bạn.');
      return;
    }
    if (!recNewPassword || recNewPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (recNewPassword !== recConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(recEmail, recNewPassword);
      setSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.');
      setEmail(recEmail);
      setPassword(recNewPassword);
      setMode('sign-in');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleFindAccount() {
    resetFeedback();
    setRecoveredEmail(null);
    if (!recPhone.trim()) {
      setError('Vui lòng nhập số điện thoại liên hệ để tra cứu.');
      return;
    }

    setLoading(true);
    try {
      const found = await findAccountByPhone(recPhone);
      if (!found) {
        setError('Không tìm thấy tài khoản nào liên kết với số điện thoại này.');
      } else {
        setRecoveredEmail(found.email);
        setSuccess(`Đã tìm thấy tài khoản: ${found.fullName} (${found.role.toUpperCase()})`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled">
          {/* Header Brand */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Icon as={Sparkles} size={18} className="text-primary" />
              <ThemedText style={styles.brandBadgeText}>SKINSENSE 2.0</ThemedText>
            </View>
            <ThemedText type="title" style={styles.title}>
              {mode === 'sign-in' && 'Đăng Nhập'}
              {mode === 'register' && 'Đăng Ký Tài Khoản'}
              {mode === 'recovery' && 'Khôi Phục Tài Khoản'}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {mode === 'sign-in' && 'Truy cập phác đồ chăm sóc da và phân quyền hệ thống'}
              {mode === 'register' && 'Tham gia hệ sinh thái chăm sóc da chuyên sâu SkinSense'}
              {mode === 'recovery' && 'Đặt lại mật khẩu hoặc tra cứu email đã đăng ký'}
            </ThemedText>
          </View>

          {/* Feedback Messages */}
          {error && (
            <View style={styles.errorBanner}>
              <Icon as={AlertCircle} size={18} className="text-red-500" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          {success && (
            <View style={styles.successBanner}>
              <Icon as={CheckCircle2} size={18} className="text-emerald-500" />
              <ThemedText style={styles.successText}>{success}</ThemedText>
            </View>
          )}

          {/* MODE: SIGN IN */}
          {mode === 'sign-in' && (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Email đăng nhập</ThemedText>
                <View style={styles.inputContainer}>
                  <Icon as={Mail} size={18} className="text-muted-foreground mr-2" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <ThemedText style={styles.inputLabel}>Mật khẩu</ThemedText>
                  <Pressable
                    onPress={() => {
                      resetFeedback();
                      setMode('recovery');
                    }}>
                    <ThemedText style={styles.forgotLink}>Quên tài khoản?</ThemedText>
                  </Pressable>
                </View>
                <View style={styles.inputContainer}>
                  <Icon as={Lock} size={18} className="text-muted-foreground mr-2" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập mật khẩu..."
                    placeholderTextColor="#888"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Icon as={showPassword ? EyeOff : Eye} size={18} className="text-muted-foreground" />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => handleSignIn()}
                disabled={loading}
                style={[styles.primaryButton, loading && styles.disabledButton]}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>Đăng Nhập</ThemedText>
                )}
              </Pressable>

              <View style={styles.switchModeContainer}>
                <ThemedText style={styles.switchModeText}>Chưa có tài khoản? </ThemedText>
                <Pressable
                  onPress={() => {
                    resetFeedback();
                    setMode('register');
                  }}>
                  <ThemedText style={styles.switchModeLink}>Đăng ký ngay</ThemedText>
                </Pressable>
              </View>

              {/* Quick 1-Touch Demo Logins */}
              <View style={styles.quickAccessSection}>
                <ThemedText style={styles.quickAccessTitle}>ĐĂNG NHẬP NHANH 1-CHẠM (4 ROLE)</ThemedText>
                <View style={styles.quickAccessGrid}>
                  {DEFAULT_ACCOUNTS.map((acc) => {
                    const roleLabel =
                      acc.role === 'customer'
                        ? 'Khách hàng'
                        : acc.role === 'specialist'
                          ? 'Chuyên viên'
                          : acc.role === 'shop'
                            ? 'Shop bán hàng'
                            : 'Quản lý chung';
                    const RoleIcon =
                      acc.role === 'customer'
                        ? User
                        : acc.role === 'specialist'
                          ? Stethoscope
                          : acc.role === 'shop'
                            ? Store
                            : ShieldCheck;

                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => handleSignIn(acc.email, acc.password)}
                        style={styles.quickAccessPill}>
                        <Icon as={RoleIcon} size={15} className="text-primary mr-1.5" />
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.quickAccessPillRole}>{roleLabel}</ThemedText>
                          <ThemedText style={styles.quickAccessPillEmail} numberOfLines={1}>
                            {acc.email}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <View style={styles.formCard}>
              <ThemedText style={styles.inputLabel}>Chọn vai trò đăng ký của bạn *</ThemedText>
              <View style={styles.rolePickerRow}>
                <Pressable
                  onPress={() => setRegisterRole('customer')}
                  style={[styles.roleOption, registerRole === 'customer' && styles.roleOptionActive]}>
                  <Icon
                    as={User}
                    size={16}
                    className={registerRole === 'customer' ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <ThemedText
                    style={[
                      styles.roleOptionText,
                      registerRole === 'customer' && styles.roleOptionTextActive,
                    ]}>
                    Khách Hàng
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setRegisterRole('specialist')}
                  style={[styles.roleOption, registerRole === 'specialist' && styles.roleOptionActive]}>
                  <Icon
                    as={Stethoscope}
                    size={16}
                    className={registerRole === 'specialist' ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <ThemedText
                    style={[
                      styles.roleOptionText,
                      registerRole === 'specialist' && styles.roleOptionTextActive,
                    ]}>
                    Chuyên Viên
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => setRegisterRole('shop')}
                  style={[styles.roleOption, registerRole === 'shop' && styles.roleOptionActive]}>
                  <Icon
                    as={Store}
                    size={16}
                    className={registerRole === 'shop' ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <ThemedText
                    style={[
                      styles.roleOptionText,
                      registerRole === 'shop' && styles.roleOptionTextActive,
                    ]}>
                    Shop Bán Hàng
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Họ và tên người dùng *</ThemedText>
                <View style={styles.inputContainer}>
                  <Icon as={User} size={18} className="text-muted-foreground mr-2" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    placeholderTextColor="#888"
                    value={regFullName}
                    onChangeText={setRegFullName}
                  />
                </View>
              </View>

              {registerRole === 'shop' && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Tên Gian Hàng / Cửa Hàng *</ThemedText>
                  <View style={styles.inputContainer}>
                    <Icon as={Store} size={18} className="text-muted-foreground mr-2" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ví dụ: Da Sáng Boutique Official"
                      placeholderTextColor="#888"
                      value={regShopName}
                      onChangeText={setRegShopName}
                    />
                  </View>
                </View>
              )}

              {registerRole === 'specialist' && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Chuyên khoa / Đơn vị công tác *</ThemedText>
                  <View style={styles.inputContainer}>
                    <Icon as={Stethoscope} size={18} className="text-muted-foreground mr-2" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ví dụ: Da liễu & Điều trị mụn chuyên sâu"
                      placeholderTextColor="#888"
                      value={regSpecialty}
                      onChangeText={setRegSpecialty}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Email liên hệ *</ThemedText>
                <View style={styles.inputContainer}>
                  <Icon as={Mail} size={18} className="text-muted-foreground mr-2" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="email@example.com"
                    placeholderTextColor="#888"
                    value={regEmail}
                    onChangeText={setRegEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Số điện thoại *</ThemedText>
                <View style={styles.inputContainer}>
                  <Icon as={Phone} size={18} className="text-muted-foreground mr-2" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ví dụ: 0912345678"
                    placeholderTextColor="#888"
                    value={regPhone}
                    onChangeText={setRegPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Mật khẩu (tối thiểu 6 ký tự) *</ThemedText>
                <View style={styles.inputContainer}>
                  <Icon as={Lock} size={18} className="text-muted-foreground mr-2" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập mật khẩu..."
                    placeholderTextColor="#888"
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry={!regShowPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setRegShowPassword(!regShowPassword)}
                    style={styles.eyeButton}>
                    <Icon as={regShowPassword ? EyeOff : Eye} size={18} className="text-muted-foreground" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Xác nhận mật khẩu *</ThemedText>
                <View style={styles.inputContainer}>
                  <Icon as={Lock} size={18} className="text-muted-foreground mr-2" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập lại mật khẩu..."
                    placeholderTextColor="#888"
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                    secureTextEntry={!regShowPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={loading}
                style={[styles.primaryButton, loading && styles.disabledButton]}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>Tạo Tài Khoản & Bắt Đầu</ThemedText>
                )}
              </Pressable>

              <View style={styles.switchModeContainer}>
                <ThemedText style={styles.switchModeText}>Đã có tài khoản? </ThemedText>
                <Pressable
                  onPress={() => {
                    resetFeedback();
                    setMode('sign-in');
                  }}>
                  <ThemedText style={styles.switchModeLink}>Đăng nhập</ThemedText>
                </Pressable>
              </View>
            </View>
          )}

          {/* MODE: RECOVERY */}
          {mode === 'recovery' && (
            <View style={styles.formCard}>
              {/* Tab Selector */}
              <View style={styles.recoveryTabsRow}>
                <Pressable
                  onPress={() => {
                    resetFeedback();
                    setRecoveryTab('password');
                  }}
                  style={[
                    styles.recoveryTabItem,
                    recoveryTab === 'password' && styles.recoveryTabItemActive,
                  ]}>
                  <ThemedText
                    style={[
                      styles.recoveryTabText,
                      recoveryTab === 'password' && styles.recoveryTabTextActive,
                    ]}>
                    Quên Mật Khẩu
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    resetFeedback();
                    setRecoveryTab('account');
                  }}
                  style={[
                    styles.recoveryTabItem,
                    recoveryTab === 'account' && styles.recoveryTabItemActive,
                  ]}>
                  <ThemedText
                    style={[
                      styles.recoveryTabText,
                      recoveryTab === 'account' && styles.recoveryTabTextActive,
                    ]}>
                    Tìm Email / Tài Khoản
                  </ThemedText>
                </Pressable>
              </View>

              {/* Sub-Tab 1: Reset Password */}
              {recoveryTab === 'password' && (
                <View>
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Email tài khoản cần đổi mật khẩu *</ThemedText>
                    <View style={styles.inputContainer}>
                      <Icon as={Mail} size={18} className="text-muted-foreground mr-2" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="name@example.com"
                        placeholderTextColor="#888"
                        value={recEmail}
                        onChangeText={setRecEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Mật khẩu mới *</ThemedText>
                    <View style={styles.inputContainer}>
                      <Icon as={Lock} size={18} className="text-muted-foreground mr-2" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Tối thiểu 6 ký tự..."
                        placeholderTextColor="#888"
                        value={recNewPassword}
                        onChangeText={setRecNewPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Xác nhận mật khẩu mới *</ThemedText>
                    <View style={styles.inputContainer}>
                      <Icon as={Lock} size={18} className="text-muted-foreground mr-2" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Nhập lại mật khẩu mới..."
                        placeholderTextColor="#888"
                        value={recConfirmPassword}
                        onChangeText={setRecConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={handleResetPassword}
                    disabled={loading}
                    style={[styles.primaryButton, loading && styles.disabledButton]}>
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <ThemedText style={styles.primaryButtonText}>Cập Nhật Mật Khẩu Mới</ThemedText>
                    )}
                  </Pressable>
                </View>
              )}

              {/* Sub-Tab 2: Find Account by Phone */}
              {recoveryTab === 'account' && (
                <View>
                  <ThemedText style={styles.guideText}>
                    Nhập số điện thoại bạn đã đăng ký để tìm lại địa chỉ Email liên kết:
                  </ThemedText>

                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Số điện thoại đăng ký *</ThemedText>
                    <View style={styles.inputContainer}>
                      <Icon as={Phone} size={18} className="text-muted-foreground mr-2" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Ví dụ: 0988776655"
                        placeholderTextColor="#888"
                        value={recPhone}
                        onChangeText={setRecPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={handleFindAccount}
                    disabled={loading}
                    style={[styles.primaryButton, loading && styles.disabledButton]}>
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <ThemedText style={styles.primaryButtonText}>Tra Cứu Tài Khoản</ThemedText>
                    )}
                  </Pressable>

                  {recoveredEmail && (
                    <View style={styles.foundAccountCard}>
                      <ThemedText style={styles.foundAccountLabel}>Email tài khoản của bạn:</ThemedText>
                      <ThemedText style={styles.foundAccountEmail}>{recoveredEmail}</ThemedText>
                      <Pressable
                        onPress={() => {
                          setEmail(recoveredEmail);
                          setMode('sign-in');
                        }}
                        style={styles.foundAccountAction}>
                        <ThemedText style={styles.foundAccountActionText}>
                          Đăng nhập với email này →
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* Back to sign in */}
              <Pressable
                onPress={() => {
                  resetFeedback();
                  setMode('sign-in');
                }}
                style={styles.backButton}>
                <Icon as={ArrowLeft} size={16} className="text-muted-foreground mr-1.5" />
                <ThemedText style={styles.backButtonText}>Quay lại Đăng nhập</ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#38BDF8',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 19,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#10B981',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  forgotLink: {
    fontSize: 12,
    color: '#38BDF8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14.5,
  },
  eyeButton: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 13.5,
    color: '#888',
  },
  switchModeLink: {
    fontSize: 13.5,
    color: '#38BDF8',
    fontWeight: '600',
  },
  quickAccessSection: {
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  quickAccessTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAccessPill: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quickAccessPillRole: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickAccessPillEmail: {
    fontSize: 10.5,
    color: '#888',
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  roleOptionActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  roleOptionText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  roleOptionTextActive: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  recoveryTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 4,
  },
  recoveryTabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  recoveryTabItemActive: {
    borderBottomColor: '#38BDF8',
  },
  recoveryTabText: {
    fontSize: 13,
    color: '#888',
  },
  recoveryTabTextActive: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  guideText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    lineHeight: 18,
  },
  foundAccountCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 6,
  },
  foundAccountLabel: {
    fontSize: 12,
    color: '#888',
  },
  foundAccountEmail: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
  },
  foundAccountAction: {
    marginTop: 4,
  },
  foundAccountActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 13.5,
    color: '#888',
  },
});
