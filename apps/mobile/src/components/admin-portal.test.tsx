import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import * as api from '@/lib/api';
import * as auth from '@/lib/auth';
import { AdminPortal } from './admin-portal';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@/lib/auth', () => ({
  useCurrentUser: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    loadAdminUsersRemote: jest.fn(),
    loadAdminSpecialistsRemote: jest.fn(),
    loadAdminRoutinesRemote: jest.fn(),
    loadAdminProductsRemote: jest.fn(),
    loadAdminOrdersRemote: jest.fn(),
    patchAdminUserRemote: jest.fn(),
    decideSpecialistApplicationRemote: jest.fn(),
    moderateProductRemote: jest.fn(),
    updateAdminOrderStatusRemote: jest.fn(),
  };
});

describe('AdminPortal Component (7-Tab Web Admin Parity)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'super-admin',
      fullName: 'Trần Thị Ngọc Hà',
      email: 'hattn.23itb@vku.udn.vn',
      role: 'admin',
      isSuperAdmin: true,
      status: 'active',
    });

    (api.loadAdminUsersRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        users: [
          {
            id: 'u-admin',
            name: 'Trần Thị Ngọc Hà',
            email: 'hattn.23itb@vku.udn.vn',
            role: 'admin',
            status: 'active',
          },
          {
            id: 'u-shop-pending',
            name: 'An Tâm Cosmetics',
            email: 'antam@shop.vn',
            role: 'shop',
            status: 'pending',
            shopDetails: { shopName: 'An Tâm Mall', license: 'GPKD-777' },
          },
        ],
      },
    });
    (api.loadAdminSpecialistsRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        specialists: [
          {
            id: 'doc-1',
            name: 'BS. Nguyễn Lan Anh',
            email: 'lananh@clinic.vn',
            licenseId: 'CCHN-9988',
            hospital: 'BV Da Liễu Đà Nẵng',
            specialty: 'Chuyên khoa I Da liễu',
            status: 'pending',
          },
        ],
      },
    });
    (api.loadAdminRoutinesRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true, routines: {} },
    });
    (api.loadAdminProductsRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        products: [
          {
            id: 'p-pend',
            name: 'Serum Niacinamide 10%',
            shopName: 'An Tâm Mall',
            price: 320000,
            stock: 50,
            status: 'pending',
          },
        ],
      },
    });
    (api.loadAdminOrdersRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        orders: [
          {
            id: 'ord-1',
            orderCode: 'SS-123456',
            customerName: 'Nguyễn Minh',
            shopName: 'An Tâm Mall',
            totalAmount: 300000,
            commission: 24000,
            status: 'pending',
            paymentStatus: 'unpaid',
            paymentMethod: 'cod',
            createdAt: '2026-11-20T00:00:00Z',
          },
          {
            id: 'ord-2',
            orderCode: 'SS-654321',
            customerName: 'Trần Hà',
            shopName: 'An Tâm Mall',
            totalAmount: 650000,
            commission: 52000,
            status: 'delivered',
            paymentStatus: 'paid',
            paymentMethod: 'vietqr',
            createdAt: '2026-11-20T01:00:00Z',
          },
        ],
      },
    });
    (api.patchAdminUserRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true },
    });
    (api.decideSpecialistApplicationRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true },
    });
    (api.moderateProductRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true },
    });
    (api.updateAdminOrderStatusRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true },
    });
  });

  it('renders Super Admin header, users tab, and approves pending shop partner', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText('Cổng Quản Trị Hệ Thống Sàn')).toBeTruthy();
      expect(screen.getByText('An Tâm Cosmetics')).toBeTruthy();
      expect(screen.getByText('Duyệt Shop')).toBeTruthy();
    });

    await fireEvent.press(screen.getByText('Duyệt Shop'));
    await waitFor(() => {
      expect(api.patchAdminUserRemote).toHaveBeenCalledWith({
        userId: 'u-shop-pending',
        status: 'active',
        expectRole: 'shop',
      });
    });
  });

  it('approves doctor CCHN inside Duyệt Bác sĩ Da liễu tab', async () => {
    await render(<AdminPortal />);

    const specTab = await screen.findByText('Duyệt Bác sĩ Da liễu');
    await fireEvent.press(specTab);
    await waitFor(() => {
      expect(screen.getByText('BS. Nguyễn Lan Anh')).toBeTruthy();
      expect(screen.getByText('CCHN: CCHN-9988')).toBeTruthy();
      expect(screen.getByText('Phê duyệt CCHN')).toBeTruthy();
    });

    await fireEvent.press(screen.getByText('Phê duyệt CCHN'));
    await waitFor(() => {
      expect(api.decideSpecialistApplicationRemote).toHaveBeenCalledWith('doc-1', 'approve');
    });
  });

  it('moderates pending products inside Duyệt Sản phẩm Shop tab', async () => {
    await render(<AdminPortal />);

    const prodTab = await screen.findByText('Duyệt Sản phẩm Shop');
    await fireEvent.press(prodTab);
    await waitFor(() => {
      expect(screen.getByText('Serum Niacinamide 10%')).toBeTruthy();
      expect(screen.getByText('Phê duyệt')).toBeTruthy();
    });

    await fireEvent.press(screen.getByText('Phê duyệt'));
    await waitFor(() => {
      expect(api.moderateProductRemote).toHaveBeenCalledWith('p-pend', 'approved');
    });
  });

  it('manages orders, analytics revenue, and platform settings across tabs', async () => {
    await render(<AdminPortal />);

    const ordTab = await screen.findByText('Đơn hàng');
    await fireEvent.press(ordTab);
    expect(await screen.findByText('SS-123456')).toBeTruthy();
    await fireEvent.press(screen.getByText('Xác nhận đơn'));
    await waitFor(() => {
      expect(api.updateAdminOrderStatusRemote).toHaveBeenCalledWith('SS-123456', 'processing');
    });

    await fireEvent.press(screen.getByText('Doanh thu & Hoa hồng'));
    expect(await screen.findByText('Tổng doanh thu thực')).toBeTruthy();
    expect(screen.getByText('650.000₫')).toBeTruthy();
    expect(screen.getByText('52.000₫')).toBeTruthy();

    await fireEvent.press(screen.getByText('Cấu hình Sàn'));
    expect(await screen.findByText('Cấu hình vận hành sàn')).toBeTruthy();
  });
});
