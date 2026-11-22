import AsyncStorage from '@react-native-async-storage/async-storage';
import { canShopSignIn } from '@skinsense/domain';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  fetchAuthMeRemote,
  submitRoleApplicationRemote,
  type AuthMeRemoteUser,
} from './api';
import { setDemoActive } from './demo';
import { googleWebClientId } from './env';

export const SUPER_ADMIN_EMAIL = 'hattn.23itb@vku.udn.vn';

function getSupabase(): SupabaseClient | null {
  try {
    return require('./supabase').supabase;
  } catch {
    return null;
  }
}

export type UserRole = 'customer' | 'specialist' | 'admin' | 'shop';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string; // ảnh đại diện trên Cloudinary; thiếu ở user lưu bởi bản app cũ
  role: UserRole;
  status?: 'active' | 'pending' | 'rejected' | 'suspended' | 'blocked';
  isSuperAdmin?: boolean;
  licenseId?: string;
  hospital?: string;
  specialty?: string;
  shopName?: string;
  shopId?: string;
  shopStatus?: 'pending' | 'approved' | 'rejected';
  shopDetails?: {
    shopName?: string;
    ownerName?: string;
    license?: string;
    category?: string;
    address?: string;
    phone?: string;
  };
  createdAt: string;
}

const CURRENT_USER_KEY = 'skinsense_current_user_account';

let inMemoryCurrentUser: AuthUser | null = null;
const userListeners = new Set<(user: AuthUser | null) => void>();

let inMemorySession: Session | null | undefined = undefined;
const sessionListeners = new Set<(session: Session | null | undefined) => void>();

export type StaffTodayViewMode = 'workstation' | 'skin';
let inMemoryStaffTodayViewMode: StaffTodayViewMode = 'workstation';
const staffViewModeListeners = new Set<(mode: StaffTodayViewMode) => void>();

export function getStaffTodayViewMode(): StaffTodayViewMode {
  return inMemoryStaffTodayViewMode;
}

export function setStaffTodayViewMode(mode: StaffTodayViewMode): void {
  inMemoryStaffTodayViewMode = mode;
  staffViewModeListeners.forEach((l) => l(mode));
}

export function useStaffTodayViewMode(): [StaffTodayViewMode, (mode: StaffTodayViewMode) => void] {
  const [mode, setMode] = useState<StaffTodayViewMode>(inMemoryStaffTodayViewMode);
  useEffect(() => {
    setMode(inMemoryStaffTodayViewMode);
    const listener = (next: StaffTodayViewMode) => setMode(next);
    staffViewModeListeners.add(listener);
    return () => {
      staffViewModeListeners.delete(listener);
    };
  }, []);
  return [mode, setStaffTodayViewMode];
}

function notifyUser(user: AuthUser | null) {
  inMemoryCurrentUser = user;
  userListeners.forEach((l) => l(user));
}

function notifySession(session: Session | null | undefined) {
  inMemorySession = session;
  sessionListeners.forEach((l) => l(session));
}

export function getRouteForRole(user: Pick<AuthUser, 'role' | 'status' | 'isSuperAdmin' | 'email'>): Href {
  const email = user.email?.trim().toLowerCase();
  if (email === SUPER_ADMIN_EMAIL || user.isSuperAdmin || user.role === 'admin') {
    return '/admin' as Href;
  }
  if (user.role === 'specialist') {
    return (user.status === 'pending' ? '/specialist?status=pending' : '/specialist') as Href;
  }
  if (user.role === 'shop') {
    return '/shop' as Href;
  }
  return '/(tabs)' as Href;
}

function mapSupabaseUserFallback(sbUser: User): AuthUser {
  const email = (sbUser.email || '').trim().toLowerCase();
  const appMeta = (sbUser.app_metadata || {}) as Record<string, unknown>;
  const meta = (sbUser.user_metadata || {}) as Record<string, unknown>;
  const shopDetailsMeta = (meta.shop_details || {}) as Record<string, unknown>;

  if (email === SUPER_ADMIN_EMAIL) {
    return {
      id: sbUser.id,
      email,
      fullName: 'Trần Thị Ngọc Hà (Super Admin)',
      phoneNumber: String(meta.phone_number || ''),
      role: 'admin',
      status: 'active',
      isSuperAdmin: true,
      createdAt: sbUser.created_at || new Date().toISOString(),
    };
  }

  const rawRole = typeof appMeta.role === 'string' ? appMeta.role : typeof meta.role === 'string' ? meta.role : 'customer';
  const role: UserRole =
    rawRole === 'admin' || rawRole === 'shop' || rawRole === 'specialist' ? rawRole : 'customer';

  const rawStatus =
    typeof appMeta.status === 'string'
      ? appMeta.status
      : typeof meta.status === 'string'
      ? meta.status
      : 'active';
  const status = (
    rawStatus === 'pending' || rawStatus === 'rejected' || rawStatus === 'suspended' || rawStatus === 'blocked'
      ? rawStatus
      : 'active'
  ) as AuthUser['status'];

  const shopName =
    role === 'shop'
      ? String(meta.shop_name || shopDetailsMeta.shopName || 'Cửa Hàng Dược Mỹ Phẩm SkinSense').trim()
      : undefined;

  return {
    id: sbUser.id,
    email,
    fullName: String(
      (role === 'shop' ? shopName : undefined) ||
        meta.full_name ||
        meta.name ||
        email.split('@')[0] ||
        'Khách hàng',
    ).trim(),
    phoneNumber: String(meta.phone_number || sbUser.phone || ''),
    role,
    status,
    licenseId: typeof meta.license_id === 'string' ? meta.license_id : undefined,
    hospital: typeof meta.hospital === 'string' ? meta.hospital : undefined,
    specialty: typeof meta.specialty === 'string' ? meta.specialty : undefined,
    shopName,
    shopId: typeof appMeta.shop_id === 'string' ? appMeta.shop_id : undefined,
    shopDetails:
      role === 'shop'
        ? {
            shopName,
            ownerName: String(meta.full_name || meta.name || 'Chủ Gian Hàng'),
            license: String(meta.license || shopDetailsMeta.license || ''),
            category: String(meta.category || shopDetailsMeta.category || ''),
            address: String(meta.address || shopDetailsMeta.address || ''),
            phone: String(meta.phone_number || ''),
          }
        : undefined,
    createdAt: sbUser.created_at || new Date().toISOString(),
  };
}

function mapAuthMeToAuthUser(me: AuthMeRemoteUser, fallback: AuthUser): AuthUser {
  const rawStatus =
    me.status === 'pending' || me.status === 'rejected' || me.status === 'suspended' || me.status === 'blocked'
      ? me.status
      : 'active';
  const preservePendingRole =
    fallback.role !== 'customer' &&
    (!me.role || me.role === 'customer') &&
    (fallback.status === 'pending' || fallback.status === 'rejected');
  const resolvedRole: UserRole = preservePendingRole ? fallback.role : me.role || fallback.role;
  const status = (preservePendingRole ? fallback.status : rawStatus) as AuthUser['status'];
  const normalizedEmail = (fallback.email || me.email || '').trim().toLowerCase();
  const isSuperAdmin = normalizedEmail === SUPER_ADMIN_EMAIL;

  return {
    ...fallback,
    id: fallback.id || me.id,
    email: normalizedEmail,
    fullName: isSuperAdmin
      ? 'Trần Thị Ngọc Hà (Super Admin)'
      : me.fullName || fallback.fullName,
    role: isSuperAdmin ? 'admin' : resolvedRole,
    status: isSuperAdmin ? 'active' : status,
    isSuperAdmin,
    licenseId: me.licenseId || fallback.licenseId,
    hospital: me.hospital || fallback.hospital,
    specialty: me.specialty || fallback.specialty,
    shopName: me.shopDetails?.shopName || fallback.shopName,
    shopDetails: me.shopDetails ?? fallback.shopDetails,
    phoneNumber: me.shopDetails?.phone || fallback.phoneNumber,
  };
}

export async function resolveAuthUserFromSupabase(
  sbUser: User,
  accessToken?: string,
): Promise<AuthUser> {
  const fallback = mapSupabaseUserFallback(sbUser);
  if (accessToken) {
    const meRes = await fetchAuthMeRemote(accessToken).catch(() => null);
    const remoteUser = meRes?.data?.user;
    const remoteEmail = remoteUser?.email?.trim().toLowerCase();
    if (
      meRes?.ok &&
      meRes.data?.authenticated &&
      remoteUser &&
      (!remoteEmail || remoteEmail === fallback.email.trim().toLowerCase())
    ) {
      return mapAuthMeToAuthUser(remoteUser, fallback);
    }
  }
  return fallback;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (inMemoryCurrentUser) return inMemoryCurrentUser;
  try {
    const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    inMemoryCurrentUser = user;
    return user;
  } catch {
    return null;
  }
}

export async function setCurrentUser(user: AuthUser | null): Promise<void> {
  notifyUser(user);
  if (user) {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }
}

/**
 * Validates suspended / pending shop policies identically to Web auth-modal.tsx.
 */
async function enforceAccountPolicyAndPersist(sb: SupabaseClient, user: AuthUser): Promise<AuthUser> {
  if (user.status === 'suspended' || user.status === 'blocked') {
    await sb.auth.signOut().catch(() => {});
    await setCurrentUser(null);
    throw new Error('Tài khoản này đã bị Ban Quản Trị tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ.');
  }

  if (user.role === 'shop') {
    const check = canShopSignIn({
      role: user.role,
      status: user.status ?? 'pending',
      email: user.email,
      fullName: user.fullName,
    });
    if (!check.allowed) {
      await sb.auth.signOut().catch(() => {});
      await setCurrentUser(null);
      throw new Error(
        check.reason ||
          'Hồ sơ Gian hàng của bạn đang chờ Super Admin (Trần Thị Ngọc Hà) xét duyệt.',
      );
    }
  }

  await setDemoActive(false);
  await setCurrentUser(user);
  return user;
}

/**
 * Authenticates directly with Supabase Auth + Web `/api/auth/me`, matching apps/web.
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error('Vui lòng nhập đầy đủ Email và Mật khẩu.');
  }

  const sb = getSupabase();
  if (!sb) {
    throw new Error('Không thể khởi tạo kết nối Supabase Auth.');
  }

  const { data, error } = await sb.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data?.user) {
    const msg =
      error?.message === 'Invalid login credentials'
        ? 'Email hoặc mật khẩu không chính xác.'
        : error?.message || 'Đăng nhập thất bại.';
    throw new Error(msg);
  }

  const resolved = await resolveAuthUserFromSupabase(data.user, data.session?.access_token);
  const persisted = await enforceAccountPolicyAndPersist(sb, resolved);
  if (data.session) notifySession(data.session);
  return persisted;
}

export function signInWithGoogleIdToken(idToken: string) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not initialized');
  return sb.auth.signInWithIdToken({ provider: 'google', token: idToken });
}

/**
 * Signs in natively with Google Play Services (`GoogleSignin`), strictly staying inside
 * the native mobile app without opening external Vercel Web pages in a browser.
 */
export async function signInWithGoogle(): Promise<AuthUser | null> {
  const sb = getSupabase();
  if (!sb) throw new Error('Không thể khởi tạo kết nối Supabase Auth.');

  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({ webClientId: googleWebClientId() });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    if (typeof GoogleSignin.signOut === 'function') {
      await Promise.resolve(GoogleSignin.signOut()).catch(() => {});
    }
    const res = await GoogleSignin.signIn();
    if (res.type !== 'success' || !res.data?.idToken) {
      return null;
    }
    const { data, error } = await sb.auth.signInWithIdToken({
      provider: 'google',
      token: res.data.idToken,
    });
    if (error || !data?.user) {
      throw new Error(error?.message || 'Đăng nhập Google thất bại.');
    }
    const resolved = await resolveAuthUserFromSupabase(data.user, data.session?.access_token);
    const persisted = await enforceAccountPolicyAndPersist(sb, resolved);
    if (data.session) notifySession(data.session);
    return persisted;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(msg)) return null;
    if (/developer|10:|not configured/i.test(msg)) {
      if (process.env.EXPO_PUBLIC_ALLOW_BROWSER_OAUTH === 'true') {
        const WebBrowser = require('expo-web-browser') as typeof import('expo-web-browser');
        const redirectTo = 'skinsense://auth/callback';
        const { data: oauthData, error: oauthErr } = await sb.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: { access_type: 'offline', prompt: 'select_account' },
          },
        });
        if (oauthErr || !oauthData?.url) {
          throw new Error(oauthErr?.message || 'Không khởi tạo được Google OAuth.');
        }
        const result = await WebBrowser.openAuthSessionAsync(oauthData.url, redirectTo);
        if (result.type !== 'success' || !result.url) {
          return null;
        }
        return completeOAuthRedirectUrl(new URL(result.url));
      }
      throw new Error(
        'Bản Android USB chưa khai báo SHA-1 Android Client ID trong Google Cloud Console (lỗi Play Services 10). Vui lòng đăng nhập trực tiếp bằng Email & Mật khẩu bên dưới — dữ liệu đồng bộ 100% với tài khoản Web.',
      );
    }
    throw err instanceof Error ? err : new Error(msg);
  }
}

/**
 * Completes Supabase OAuth from a `skinsense://auth/callback` URL (?code= or #access_token=).
 */
export async function completeOAuthRedirectUrl(urlOrString: string | URL): Promise<AuthUser> {
  const sb = getSupabase();
  if (!sb) throw new Error('Không thể khởi tạo kết nối Supabase Auth.');

  const parsedUrl = typeof urlOrString === 'string' ? new URL(urlOrString) : urlOrString;
  const code = parsedUrl.searchParams.get('code');
  let sessionUser: User | null = null;
  let token: string | undefined;

  if (code) {
    const { data, error } = await sb.auth.exchangeCodeForSession(code);
    if (error) throw error;
    sessionUser = data.user;
    token = data.session?.access_token;
  } else {
    const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) {
      const { data, error } = await sb.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      sessionUser = data.user;
      token = data.session?.access_token;
    }
  }

  if (!sessionUser) {
    throw new Error('Không nhận được phiên đăng nhập Google từ Supabase.');
  }

  const resolved = await resolveAuthUserFromSupabase(sessionUser, token);
  return enforceAccountPolicyAndPersist(sb, resolved);
}

/**
 * Registers Customer/Shop or submits Doctor/Shop application directly to Web API `/api/auth/register`.
 */
export async function registerAccount(data: {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
  role: 'customer' | 'specialist' | 'shop';
  shopName?: string;
  specialty?: string;
  licenseId?: string;
  hospital?: string;
  license?: string;
  category?: string;
  address?: string;
}): Promise<{ status: 'signed_in' | 'pending_approval'; user?: AuthUser; message: string }> {
  const res = await submitRoleApplicationRemote({
    role: data.role,
    email: data.email.trim().toLowerCase(),
    password: data.password,
    fullName: data.fullName.trim(),
    doctorName: data.role === 'specialist' ? data.fullName.trim() : undefined,
    ownerName: data.role === 'shop' ? data.fullName.trim() : undefined,
    phoneNumber: data.phoneNumber?.trim(),
    shopName: data.shopName?.trim(),
    specialty: data.specialty?.trim(),
    licenseId: data.licenseId?.trim(),
    hospital: data.hospital?.trim(),
    license: data.license?.trim(),
    category: data.category?.trim(),
    address: data.address?.trim(),
  });

  if (!res.ok || res.error) {
    throw new Error(res.error || res.data?.error || 'Đăng ký thất bại.');
  }

  if (data.role === 'specialist') {
    return {
      status: 'pending_approval',
      message:
        res.data?.message ||
        'Hồ sơ Bác sĩ đã được gửi thành công! Ban quản trị sẽ xét duyệt Chứng chỉ hành nghề.',
    };
  }

  if (data.role === 'shop') {
    return {
      status: 'pending_approval',
      message:
        res.data?.message ||
        'Hồ sơ mở Gian hàng đã được gửi thành công! Super Admin Trần Thị Ngọc Hà sẽ xét duyệt trước khi mở bán.',
    };
  }

  if (data.password) {
    const signedUser = await signInWithEmail(data.email, data.password);
    return {
      status: 'signed_in',
      user: signedUser,
      message: 'Tạo tài khoản và đăng nhập thành công!',
    };
  }

  return {
    status: 'signed_in',
    message: res.data?.message || 'Đăng ký thành công!',
  };
}

export async function signOut(): Promise<void> {
  notifyUser(null);
  notifySession(null);
  setStaffTodayViewMode('workstation');
  await setCurrentUser(null);
  await setDemoActive(false);
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
    try {
      if (typeof GoogleSignin?.configure === 'function') {
        GoogleSignin.configure({ webClientId: googleWebClientId() });
      }
    } catch {}
    if (typeof GoogleSignin?.signOut === 'function') {
      await Promise.resolve(GoogleSignin.signOut()).catch(() => {});
    }
  } catch {}
  try {
    const sb = getSupabase();
    if (sb) {
      await sb.auth.signOut({ scope: 'local' }).catch(() => {});
      await sb.auth.signOut().catch(() => {});
    }
  } catch {}
}

export function useCurrentUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(inMemoryCurrentUser);

  useEffect(() => {
    void getCurrentUser().then((u) => {
      setUser(u);
    });
    const listener = (next: AuthUser | null) => setUser(next);
    userListeners.add(listener);
    return () => {
      userListeners.delete(listener);
    };
  }, []);

  return user;
}

/**
 * Restores real Supabase session cleanly. Unlike legacy local mock auth, never synthesizes
 * a signed-in session without a real Supabase session token.
 */
export function useSession() {
  const [supabaseSession, setSupabaseSession] = useState<Session | null | undefined>(inMemorySession);

  useEffect(() => {
    let cancelled = false;
    const sessionListener = (next: Session | null | undefined) => {
      if (!cancelled) setSupabaseSession(next);
    };
    sessionListeners.add(sessionListener);

    const sb = getSupabase();
    if (!sb) {
      notifySession(null);
      return () => {
        cancelled = true;
        sessionListeners.delete(sessionListener);
      };
    }

    async function syncSession(next: Session | null) {
      if (cancelled) return;
      if (!next?.user) {
        await setCurrentUser(null);
        if (!cancelled) notifySession(null);
        return;
      }
      const resolved = await resolveAuthUserFromSupabase(next.user, next.access_token);
      if (cancelled) return;
      if (resolved.status === 'suspended' || resolved.status === 'blocked') {
        await sb?.auth.signOut().catch(() => {});
        await setCurrentUser(null);
        if (!cancelled) notifySession(null);
        return;
      }
      if (resolved.role === 'shop' && !canShopSignIn({ role: resolved.role, status: resolved.status ?? 'pending', email: resolved.email }).allowed) {
        await sb?.auth.signOut().catch(() => {});
        await setCurrentUser(null);
        if (!cancelled) notifySession(null);
        return;
      }
      await setCurrentUser(resolved);
      if (!cancelled) notifySession(next);
    }

    sb.auth
      .getSession()
      .then(({ data }) => syncSession(data.session ?? null))
      .catch(() => {
        if (!cancelled) notifySession(null);
      });

    const { data } = sb.auth.onAuthStateChange((_event, next) => {
      void syncSession(next);
    });

    return () => {
      cancelled = true;
      sessionListeners.delete(sessionListener);
      data.subscription.unsubscribe();
    };
  }, []);

  return supabaseSession;
}
