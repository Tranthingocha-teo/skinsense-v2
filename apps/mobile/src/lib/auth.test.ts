import AsyncStorage from '@react-native-async-storage/async-storage';

const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({});
const mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } });
const mockOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
});

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signInWithIdToken: jest.fn(),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

const mockGoogleConfigure = jest.fn();
const mockHasPlayServices = jest.fn().mockResolvedValue(true);
const mockGoogleSignIn = jest.fn();
const mockGoogleSignOut = jest.fn().mockResolvedValue(undefined);
const mockOpenAuthSessionAsync = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: (...args: unknown[]) => mockGoogleConfigure(...args),
    hasPlayServices: (...args: unknown[]) => mockHasPlayServices(...args),
    signIn: (...args: unknown[]) => mockGoogleSignIn(...args),
    signOut: (...args: unknown[]) => mockGoogleSignOut(...args),
  },
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSessionAsync(...args),
}));

import {
  getCurrentUser,
  getRouteForRole,
  registerAccount,
  setCurrentUser,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  SUPER_ADMIN_EMAIL,
} from './auth';

describe('Authentication & Role Engine (Web-Parity Supabase Auth)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await setCurrentUser(null);
  });

  it('signs in real Super Admin account via Supabase Auth and routes to /admin', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        user: {
          id: 'uid-admin',
          email: SUPER_ADMIN_EMAIL,
          app_metadata: { role: 'admin', status: 'active' },
          user_metadata: { full_name: 'Trần Thị Ngọc Hà' },
          created_at: '2026-01-01T00:00:00Z',
        },
        session: { access_token: 'jwt-admin' },
      },
      error: null,
    });
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        user: {
          id: 'uid-admin',
          email: SUPER_ADMIN_EMAIL,
          fullName: 'Trần Thị Ngọc Hà (Super Admin)',
          role: 'admin',
          status: 'active',
          isSuperAdmin: true,
        },
      }),
    })) as unknown as typeof fetch;

    const user = await signInWithEmail(SUPER_ADMIN_EMAIL, 'secret123');
    expect(user.role).toBe('admin');
    expect(user.isSuperAdmin).toBe(true);
    expect(getRouteForRole(user)).toBe('/admin');

    const persisted = await getCurrentUser();
    expect(persisted?.email).toBe(SUPER_ADMIN_EMAIL);
  });

  it('blocks pending shop sign-in identically to Web canShopSignIn rule', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        user: {
          id: 'uid-shop-pending',
          email: 'pending.shop@test.vn',
          app_metadata: { role: 'shop', status: 'pending' },
          user_metadata: { shop_name: 'Shop Cho Duyet' },
        },
        session: { access_token: 'jwt-shop' },
      },
      error: null,
    });
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        user: {
          id: 'uid-shop-pending',
          email: 'pending.shop@test.vn',
          fullName: 'Shop Cho Duyet',
          role: 'shop',
          status: 'pending',
        },
      }),
    })) as unknown as typeof fetch;

    await expect(signInWithEmail('pending.shop@test.vn', '123456')).rejects.toThrow(
      /chờ Super Admin/,
    );
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('allows pending specialist sign-in into /specialist?status=pending sandbox', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        user: {
          id: 'uid-doc-pending',
          email: 'dr.test@gmail.com',
          app_metadata: { role: 'specialist', status: 'pending' },
          user_metadata: { full_name: 'BS Test', license_id: 'CCHN-999' },
        },
        session: { access_token: 'jwt-doc' },
      },
      error: null,
    });
    global.fetch = jest.fn(async () => ({ ok: false, status: 401, json: async () => null })) as unknown as typeof fetch;

    const doc = await signInWithEmail('dr.test@gmail.com', '123456');
    expect(doc.role).toBe('specialist');
    expect(doc.status).toBe('pending');
    expect(getRouteForRole(doc)).toBe('/specialist?status=pending');
  });

  it('submits Doctor approval request to POST /api/auth/register cleanly', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        message: 'Hồ sơ Bác sĩ đã được gửi thành công!',
      }),
    })) as unknown as typeof fetch;

    const res = await registerAccount({
      role: 'specialist',
      email: 'bacsi.moi@gmail.com',
      password: 'password123',
      fullName: 'ThS. BS Nguyễn Minh',
      phoneNumber: '0912345678',
      licenseId: 'CCHN-008812',
      hospital: 'BV Da Liễu Trung Ương',
    });

    expect(res.status).toBe('pending_approval');
    expect(res.message).toContain('Hồ sơ Bác sĩ');

    await signOut();
    expect(await getCurrentUser()).toBeNull();
  });

  it('keeps signInWithGoogle native without opening external Chrome browser on DEVELOPER_ERROR (10)', async () => {
    const prevAllow = process.env.EXPO_PUBLIC_ALLOW_BROWSER_OAUTH;
    const prevClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_ALLOW_BROWSER_OAUTH;
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-web-client.apps.googleusercontent.com';
    mockGoogleSignIn.mockRejectedValueOnce(new Error('DEVELOPER_ERROR 10: Client not configured'));

    try {
      await expect(signInWithGoogle()).rejects.toThrow(/Bản Android USB chưa khai báo SHA-1 Android Client ID/);
      expect(mockGoogleConfigure).toHaveBeenCalledWith({
        webClientId: 'test-web-client.apps.googleusercontent.com',
      });
      expect(mockHasPlayServices).toHaveBeenCalledTimes(1);
      expect(mockOpenAuthSessionAsync).not.toHaveBeenCalled();
    } finally {
      if (prevAllow !== undefined) {
        process.env.EXPO_PUBLIC_ALLOW_BROWSER_OAUTH = prevAllow;
      }
      if (prevClientId !== undefined) {
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = prevClientId;
      } else {
        delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      }
    }
  });

  it('clears cached GoogleSignin account on signOut and ignores mismatched /api/auth/me admin response when switching accounts', async () => {
    await signOut();
    expect(mockGoogleSignOut).toHaveBeenCalled();

    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        user: {
          id: 'uid-doc-real',
          email: 'dinhknd3@gmail.com',
          app_metadata: { role: 'specialist', status: 'active' },
          user_metadata: { full_name: 'BS. Đinh Khánh' },
          created_at: '2026-01-01T00:00:00Z',
        },
        session: { access_token: 'jwt-doc-real' },
      },
      error: null,
    });
    // Simulate a stale cached /api/auth/me response for Super Admin
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        user: {
          id: 'uid-admin',
          email: SUPER_ADMIN_EMAIL,
          fullName: 'Trần Thị Ngọc Hà (Super Admin)',
          role: 'admin',
          status: 'active',
          isSuperAdmin: true,
        },
      }),
    })) as unknown as typeof fetch;

    const user = await signInWithEmail('dinhknd3@gmail.com', 'secret123');
    expect(user.email).toBe('dinhknd3@gmail.com');
    expect(user.role).toBe('specialist');
    expect(user.isSuperAdmin).toBeUndefined();
    expect(getRouteForRole(user)).toBe('/specialist');
  });
});
