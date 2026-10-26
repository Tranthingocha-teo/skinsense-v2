import { fireEvent, render, screen } from '@testing-library/react-native';

import '@/i18n';
import * as auth from '@/lib/auth';
import { Today } from './today';

jest.mock('@/lib/trends', () => ({ loadTrends: jest.fn(), signedPhotoUrls: jest.fn() }));
jest.mock('@/lib/routine', () => ({ loadRoutine: jest.fn(), saveEntry: jest.fn() }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('@/lib/auth', () => ({
  useCurrentUser: jest.fn(),
  signOut: jest.fn(),
}));

describe('Today Screen - Distinct 4 Role Workstations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Specialist Workstation when logged in as specialist', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'spec-1',
      fullName: 'BS. CKI Nguyễn Mai Hoa',
      role: 'specialist',
      specialty: 'Da liễu & Điều trị mụn chuyên sâu',
      email: 'bacsi.hoa@skinsense.vn',
      phoneNumber: '0900000002',
    });

    await render(<Today />);

    expect(screen.getByText('Bác Sĩ / Chuyên Viên Da Liễu')).toBeTruthy();
    expect(screen.getByText('BS. CKI Nguyễn Mai Hoa')).toBeTruthy();
    expect(screen.getByText('24')).toBeTruthy(); // 24 patients
    expect(screen.getByText('8 ca')).toBeTruthy(); // 8 waiting
    expect(screen.getByText('Trần Thị Ngọc Hà')).toBeTruthy();

    // Verify prescribing action buttons exist
    const prescribeButtons = screen.getAllByText('Kê Phác Đồ & Dặn Dò');
    expect(prescribeButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.press(prescribeButtons[0]);

    // Modal opens
    expect(await screen.findByText('Gửi Cho Bệnh Nhân')).toBeTruthy();
    fireEvent.press(screen.getByText('Gửi Cho Bệnh Nhân'));
    expect(await screen.findByText(/Đã gửi phác đồ điều trị thành công/)).toBeTruthy();
  });

  it('renders Super Admin Workstation when logged in as admin', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'admin-1',
      fullName: 'Ban Quản Trị Hệ Thống',
      role: 'admin',
      email: 'admin@skinsense.vn',
      phoneNumber: '0900000001',
    });

    await render(<Today />);

    expect(screen.getByText('Quản Trị Viên Tối Cao')).toBeTruthy();
    expect(screen.getByText('Ban Quản Trị Hệ Thống')).toBeTruthy();
    expect(screen.getByText('740.000₫')).toBeTruthy();
    expect(screen.getByText('Vào Cổng Quản Trị Hệ Thống (Admin)')).toBeTruthy();
  });

  it('renders Shop Merchant Workstation when logged in as shop partner', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'shop-1',
      fullName: 'Đại lý La Roche-Posay',
      role: 'shop',
      shopName: 'La Roche-Posay Official Store',
      email: 'shop.laroche@skinsense.vn',
      phoneNumber: '0900000003',
    });

    await render(<Today />);

    expect(screen.getByText('Gian Hàng Đối Tác')).toBeTruthy();
    expect(screen.getByText('La Roche-Posay Official Store')).toBeTruthy();
    expect(screen.getAllByText('395.000₫').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Quản Trị Gian Hàng & Đăng Bán Sản Phẩm')).toBeTruthy();
  });
});
