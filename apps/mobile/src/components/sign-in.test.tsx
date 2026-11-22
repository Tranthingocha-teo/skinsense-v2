import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
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
  Link: ({ children }: { children: unknown }) => children,
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
    signInWithGoogle: jest.fn(),
    registerAccount: jest.fn(),
  };
});

async function renderSignIn() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
        frame: { x: 0, y: 0, width: 375, height: 812 },
      }}
    >
      <SignInScreen />
    </SafeAreaProvider>,
  );
}

describe('SignInScreen Component (Web-Parity Auth & 4-Role Portal Flow)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Web-matched 4 auth tabs and Google OAuth card without hardcoded 1-touch demo pills', async () => {
    await renderSignIn();

    expect(screen.getByText('SKINSENSE AUTH & XÉT DUYỆT')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Đăng ký' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Bác sĩ duyệt' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Mở Gian hàng' })).toBeTruthy();
    expect(screen.getByText('Tiếp tục bằng Gmail (Google OAuth)')).toBeTruthy();
    expect(screen.queryByText('ĐĂNG NHẬP NHANH 1-CHẠM (4 ROLE)')).toBeNull();
  });

  it('routes Super Admin to /admin after real Supabase sign-in', async () => {
    (auth.signInWithEmail as jest.Mock).mockResolvedValueOnce({
      id: 'admin-1',
      email: 'hattn.23itb@vku.udn.vn',
      role: 'admin',
      status: 'active',
      isSuperAdmin: true,
      fullName: 'Trần Thị Ngọc Hà (Super Admin)',
      phoneNumber: '',
      createdAt: '',
    });

    await renderSignIn();

    await fireEvent.changeText(
      screen.getByPlaceholderText('nhap-email-cua-ban@gmail.com'),
      'hattn.23itb@vku.udn.vn',
    );
    await fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'mypassword');
    await fireEvent.press(screen.getByText('Đăng nhập ngay'));

    await waitFor(() => {
      expect(auth.signInWithEmail).toHaveBeenCalledWith('hattn.23itb@vku.udn.vn', 'mypassword');
      expect(router.replace).toHaveBeenCalledWith('/admin');
    });
  });

  it('switches to Bác sĩ duyệt tab and validates CCHN fields cleanly', async () => {
    await renderSignIn();

    await fireEvent.press(screen.getByRole('tab', { name: 'Bác sĩ duyệt' }));

    expect(screen.getByText('Quy trình xét duyệt Bác sĩ Chuyên khoa Da liễu')).toBeTruthy();
    expect(screen.getByPlaceholderText('Số Chứng chỉ hành nghề (CCHN) *')).toBeTruthy();
    expect(screen.getByPlaceholderText('Đơn vị / Bệnh viện công tác *')).toBeTruthy();

    await fireEvent.press(screen.getByText('Gửi yêu cầu duyệt Bác sĩ'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng nhập Họ và tên Bác sĩ.');
  });

  it('switches to Mở Gian hàng tab and shows GPKD + kho fields', async () => {
    await renderSignIn();

    await fireEvent.press(screen.getByRole('tab', { name: 'Mở Gian hàng' }));

    expect(screen.getByText('Quy trình xét duyệt Mở Gian Hàng Đối Tác')).toBeTruthy();
    expect(screen.getByPlaceholderText('Tên Gian hàng / Thương hiệu kinh doanh *')).toBeTruthy();
    expect(screen.getByPlaceholderText('Mã số thuế / Số ĐKKD mỹ phẩm *')).toBeTruthy();
    expect(screen.getByPlaceholderText('Địa chỉ gian hàng / Kho xuất hàng *')).toBeTruthy();
  });
});
