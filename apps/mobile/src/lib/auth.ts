import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { setDemoActive } from './demo';

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
  role: UserRole;
  shopName?: string;
  specialty?: string;
  createdAt: string;
}

export interface UserAccount extends AuthUser {
  password: string;
}

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-admin-default',
    email: 'admin@skinsense.vn',
    password: 'admin123456',
    fullName: 'Ban Quản Trị Hệ Thống',
    phoneNumber: '0900000001',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-specialist-default',
    email: 'bacsi.hoa@skinsense.vn',
    password: '123456',
    fullName: 'BS. CKI Nguyễn Mai Hoa',
    phoneNumber: '0900000002',
    specialty: 'Da liễu & Điều trị mụn chuyên sâu',
    role: 'specialist',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-shop-default',
    email: 'shop.laroche@skinsense.vn',
    password: '123456',
    fullName: 'Đại lý Dược Mỹ Phẩm La Roche-Posay',
    phoneNumber: '0900000003',
    shopName: 'La Roche-Posay Official Store',
    role: 'shop',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-customer-default',
    email: 'khachhang@gmail.com',
    password: '123456',
    fullName: 'Trần Thị Ngọc Hà',
    phoneNumber: '0988776655',
    role: 'customer',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const CURRENT_USER_KEY = 'skinsense_current_user_account';
const ACCOUNTS_STORE_KEY = 'skinsense_user_accounts_store';

let inMemoryCurrentUser: AuthUser | null = null;
let isInitialized = false;
const userListeners = new Set<(user: AuthUser | null) => void>();

function notifyUser(user: AuthUser | null) {
  inMemoryCurrentUser = user;
  userListeners.forEach((l) => l(user));
}

export async function loadAccounts(): Promise<UserAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_STORE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(ACCOUNTS_STORE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const accounts = JSON.parse(raw) as UserAccount[];
    // Ensure all default accounts exist
    let updated = false;
    for (const def of DEFAULT_ACCOUNTS) {
      if (!accounts.some((a) => a.email.toLowerCase() === def.email.toLowerCase())) {
        accounts.push(def);
        updated = true;
      }
    }
    if (updated) {
      await AsyncStorage.setItem(ACCOUNTS_STORE_KEY, JSON.stringify(accounts));
    }
    return accounts;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export async function saveAccounts(accounts: UserAccount[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_STORE_KEY, JSON.stringify(accounts));
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
  if (user) {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }
  notifyUser(user);
}

export async function registerAccount(data: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  shopName?: string;
  specialty?: string;
}): Promise<AuthUser> {
  const normalizedEmail = data.email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Email không hợp lệ. Vui lòng kiểm tra lại.');
  }
  if (!data.password || data.password.length < 6) {
    throw new Error('Mật khẩu phải có tối thiểu 6 ký tự.');
  }
  if (!data.fullName.trim()) {
    throw new Error('Vui lòng nhập họ và tên của bạn.');
  }
  if (!data.phoneNumber.trim()) {
    throw new Error('Vui lòng nhập số điện thoại liên hệ.');
  }

  const accounts = await loadAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
  }

  const newAccount: UserAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email: normalizedEmail,
    password: data.password,
    fullName: data.fullName.trim(),
    phoneNumber: data.phoneNumber.trim(),
    role: data.role,
    shopName: data.role === 'shop' ? (data.shopName?.trim() || 'Gian hàng mới') : undefined,
    specialty: data.role === 'specialist' ? (data.specialty?.trim() || 'Chuyên viên tư vấn da liễu') : undefined,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  await saveAccounts(accounts);

  const { password: _, ...userWithoutPassword } = newAccount;
  await setCurrentUser(userWithoutPassword);
  return userWithoutPassword;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = await loadAccounts();
  const account = accounts.find(
    (a) => a.email.toLowerCase() === normalizedEmail && a.password === password,
  );

  if (!account) {
    throw new Error('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
  }

  const { password: _, ...userWithoutPassword } = account;
  await setCurrentUser(userWithoutPassword);
  return userWithoutPassword;
}

export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
  }
  const accounts = await loadAccounts();
  const index = accounts.findIndex((a) => a.email.toLowerCase() === normalizedEmail);
  if (index === -1) {
    throw new Error('Không tìm thấy tài khoản liên kết với email này.');
  }

  accounts[index].password = newPassword;
  await saveAccounts(accounts);

  if (inMemoryCurrentUser && inMemoryCurrentUser.email.toLowerCase() === normalizedEmail) {
    const { password: _, ...userWithoutPassword } = accounts[index];
    await setCurrentUser(userWithoutPassword);
  }

  return true;
}

export async function findAccountByPhone(phoneNumber: string): Promise<AuthUser | null> {
  const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[-().]/g, '');
  if (!cleanPhone) return null;
  const accounts = await loadAccounts();
  const found = accounts.find(
    (a) => a.phoneNumber.replace(/\s+/g, '').replace(/[-().]/g, '') === cleanPhone,
  );
  if (!found) return null;
  const { password: _, ...userWithoutPassword } = found;
  return userWithoutPassword;
}

export async function signOut(): Promise<void> {
  await setCurrentUser(null);
  await setDemoActive(false);
  try {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
  } catch {
    // Ignore supabase signOut network errors
  }
}

export function useCurrentUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(inMemoryCurrentUser);

  useEffect(() => {
    getCurrentUser().then((u) => {
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

// idToken from @react-native-google-signin (sign-in.tsx); nonce-less on native.
export function signInWithGoogleIdToken(idToken: string) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not initialized');
  return sb.auth.signInWithIdToken({ provider: 'google', token: idToken });
}

// undefined = still restoring from storage; null = signed out.
export function useSession() {
  const [supabaseSession, setSupabaseSession] = useState<Session | null | undefined>(undefined);
  const currentUser = useCurrentUser();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setSupabaseSession(null);
      return;
    }
    sb.auth.getSession().then(({ data }) => setSupabaseSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_event, next) => setSupabaseSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  // If local AuthUser is signed in, synthesize a compatible session object
  if (currentUser) {
    return {
      user: {
        id: currentUser.id,
        email: currentUser.email,
        user_metadata: {
          full_name: currentUser.fullName,
          role: currentUser.role,
          shop_name: currentUser.shopName,
          specialty: currentUser.specialty,
        },
      },
    } as any;
  }

  return supabaseSession;
}
