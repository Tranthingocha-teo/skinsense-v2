import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: jest.fn(),
      signOut: jest.fn().mockResolvedValue({}),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
  },
}));

import {
  findAccountByPhone,
  getCurrentUser,
  loadAccounts,
  registerAccount,
  resetPassword,
  setCurrentUser,
  signInWithEmail,
  signOut,
} from './auth';

describe('Authentication & User Role Engine', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await setCurrentUser(null);
  });

  it('loads 4 initial default accounts (admin, specialist, shop, customer)', async () => {
    const accounts = await loadAccounts();
    expect(accounts.length).toBeGreaterThanOrEqual(4);

    const admin = accounts.find((a) => a.role === 'admin');
    const specialist = accounts.find((a) => a.role === 'specialist');
    const shop = accounts.find((a) => a.role === 'shop');
    const customer = accounts.find((a) => a.role === 'customer');

    expect(admin).toBeDefined();
    expect(admin?.email).toBe('admin@skinsense.vn');

    expect(specialist).toBeDefined();
    expect(specialist?.email).toBe('bacsi.hoa@skinsense.vn');

    expect(shop).toBeDefined();
    expect(shop?.email).toBe('shop.laroche@skinsense.vn');

    expect(customer).toBeDefined();
    expect(customer?.email).toBe('khachhang@gmail.com');
  });

  it('signs in successfully with valid credentials and sets current user', async () => {
    const user = await signInWithEmail('admin@skinsense.vn', 'admin123456');
    expect(user.role).toBe('admin');
    expect(user.fullName).toBe('Ban Quản Trị Hệ Thống');

    const current = await getCurrentUser();
    expect(current?.id).toBe(user.id);
  });

  it('throws descriptive error on invalid credentials', async () => {
    await expect(signInWithEmail('admin@skinsense.vn', 'wrongpass')).rejects.toThrow(
      'Email hoặc mật khẩu không chính xác',
    );
    await expect(signInWithEmail('nonexistent@test.com', '123456')).rejects.toThrow(
      'Email hoặc mật khẩu không chính xác',
    );
  });

  it('registers a new customer account and automatically signs in', async () => {
    const newUser = await registerAccount({
      email: 'newbie@example.com',
      password: 'password123',
      fullName: 'Nguyen Thi Mai',
      phoneNumber: '0912345678',
      role: 'customer',
    });

    expect(newUser.email).toBe('newbie@example.com');
    expect(newUser.role).toBe('customer');

    const current = await getCurrentUser();
    expect(current?.email).toBe('newbie@example.com');

    // Reject duplicate email
    await expect(
      registerAccount({
        email: 'newbie@example.com',
        password: 'password123',
        fullName: 'Duplicate',
        phoneNumber: '0999999999',
        role: 'customer',
      }),
    ).rejects.toThrow('Email này đã được đăng ký');
  });

  it('registers a new shop account with custom shopName', async () => {
    const shop = await registerAccount({
      email: 'cosmetics@boutique.vn',
      password: 'password123',
      fullName: 'Pham Van B',
      phoneNumber: '0922222222',
      role: 'shop',
      shopName: 'Seoul Skincare Boutique',
    });

    expect(shop.role).toBe('shop');
    expect(shop.shopName).toBe('Seoul Skincare Boutique');
  });

  it('finds account by phone number for recovery', async () => {
    const found = await findAccountByPhone('0988776655');
    expect(found).toBeDefined();
    expect(found?.email).toBe('khachhang@gmail.com');

    const notFound = await findAccountByPhone('0999000111');
    expect(notFound).toBeNull();
  });

  it('resets password for existing account', async () => {
    const success = await resetPassword('khachhang@gmail.com', 'newsecret678');
    expect(success).toBe(true);

    // Old password should fail
    await expect(signInWithEmail('khachhang@gmail.com', '123456')).rejects.toThrow();

    // New password should succeed
    const user = await signInWithEmail('khachhang@gmail.com', 'newsecret678');
    expect(user.email).toBe('khachhang@gmail.com');
  });

  it('signs out properly clearing current user', async () => {
    await signInWithEmail('admin@skinsense.vn', 'admin123456');
    expect(await getCurrentUser()).not.toBeNull();

    await signOut();
    expect(await getCurrentUser()).toBeNull();
  });
});
