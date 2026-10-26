import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';

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

import * as auth from '@/lib/auth';
import SignInScreen from '../app/sign-in';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => {
  const original = jest.requireActual('@/lib/auth');
  return {
    ...original,
    signInWithEmail: jest.fn(),
    registerAccount: jest.fn(),
    resetPassword: jest.fn(),
    findAccountByPhone: jest.fn(),
  };
});

async function renderSignIn() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
        frame: { x: 0, y: 0, width: 375, height: 812 },
      }}>
      <SignInScreen />
    </SafeAreaProvider>,
  );
}

describe('SignInScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Sign In screen with inputs and role access pills', async () => {
    await renderSignIn();

    expect(screen.getAllByText('Đăng Nhập').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText('name@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('Nhập mật khẩu...')).toBeTruthy();
    expect(screen.getByText('ĐĂNG NHẬP NHANH 1-CHẠM (4 ROLE)')).toBeTruthy();
    expect(screen.getByText('Khách hàng')).toBeTruthy();
    expect(screen.getByText('Chuyên viên')).toBeTruthy();
    expect(screen.getByText('Shop bán hàng')).toBeTruthy();
    expect(screen.getByText('Quản lý chung')).toBeTruthy();
  });

  it('switches to Register mode and renders role selector', async () => {
    await renderSignIn();

    fireEvent.press(screen.getByText('Đăng ký ngay'));

    await waitFor(() => {
      expect(screen.getByText('Đăng Ký Tài Khoản')).toBeTruthy();
      expect(screen.getByText('Khách Hàng')).toBeTruthy();
      expect(screen.getByText('Chuyên Viên')).toBeTruthy();
      expect(screen.getByText('Shop Bán Hàng')).toBeTruthy();
      expect(screen.getByText('Tạo Tài Khoản & Bắt Đầu')).toBeTruthy();
    });
  });

  it('switches to Recovery mode and shows password and account tabs', async () => {
    await renderSignIn();

    fireEvent.press(screen.getByText('Quên tài khoản?'));

    await waitFor(() => {
      expect(screen.getByText('Khôi Phục Tài Khoản')).toBeTruthy();
      expect(screen.getByText('Quên Mật Khẩu')).toBeTruthy();
      expect(screen.getByText('Tìm Email / Tài Khoản')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Tìm Email / Tài Khoản'));
    await waitFor(() => {
      expect(screen.getByText('Tra Cứu Tài Khoản')).toBeTruthy();
    });
  });

  it('handles quick 1-touch demo login', async () => {
    (auth.signInWithEmail as jest.Mock).mockResolvedValueOnce({
      id: 'admin',
      role: 'admin',
      fullName: 'Ban Quản Trị Hệ Thống',
    });

    await renderSignIn();

    fireEvent.press(screen.getByText('Quản lý chung'));

    await waitFor(() => {
      expect(auth.signInWithEmail).toHaveBeenCalledWith('admin@skinsense.vn', 'admin123456');
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });
});
