import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import * as api from '@/lib/api';
import * as auth from '@/lib/auth';
import { Today } from './today';

jest.mock('@/lib/trends', () => ({ loadTrends: jest.fn(), signedPhotoUrls: jest.fn() }));
jest.mock('@/lib/history', () => ({ uploadPhotoToCloudinary: jest.fn() }));
jest.mock('@/lib/routine', () => ({ loadRoutine: jest.fn(), saveEntry: jest.fn() }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('@/lib/auth', () => ({
  useCurrentUser: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    loadSpecialistCasesRemote: jest.fn(),
    fetchApprovedMarketplaceProducts: jest.fn(),
    prescribeSpecialistCaseRemote: jest.fn(),
    updateSpecialistCaseStatusRemote: jest.fn(),
    loadAdminOrdersRemote: jest.fn(),
    loadAdminUsersRemote: jest.fn(),
    loadAdminProductsRemote: jest.fn(),
    loadAdminSpecialistsRemote: jest.fn(),
    loadUserOrdersRemote: jest.fn(),
  };
});

const SAMPLE_CASES: api.ClinicalCaseRecordItem[] = [
  {
    id: 'case-1',
    caseCode: 'BA-2026-0101',
    patientName: 'Trần Thị Ngọc Hà',
    patientAge: 21,
    patientGender: 'Nữ',
    phone: '0901112233',
    skinType: 'Dầu mụn',
    symptoms: 'Mụn sưng viêm vùng cằm và má',
    allergies: 'Không ghi nhận',
    skinPhotoUrl: '',
    submittedDate: '2026-11-20',
    status: 'pending_routine',
    severity: 'moderate',
    aiAnalysis: { skinHealthScore: 68, rednessIndex: 38, inflammatorySpots: 6, affectedZones: ['chin', 'cheeks'] },
  },
  {
    id: 'case-2',
    caseCode: 'BA-2026-0102',
    patientName: 'Đỗ Thu Trang',
    patientAge: 22,
    patientGender: 'Nữ',
    phone: '0904445566',
    skinType: 'Nhạy cảm',
    symptoms: 'Phục hồi tốt sau tuần đầu',
    allergies: 'Hương liệu',
    skinPhotoUrl: '',
    submittedDate: '2026-11-20',
    status: 'in_treatment',
    severity: 'mild',
    aiAnalysis: { skinHealthScore: 86, rednessIndex: 18, inflammatorySpots: 1, affectedZones: ['forehead'] },
  },
];

describe('Today Screen - Distinct 4 Role Workstations (Web Parity)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.loadSpecialistCasesRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true, cases: SAMPLE_CASES },
    });
    (api.fetchApprovedMarketplaceProducts as jest.Mock).mockResolvedValue([]);
    (api.prescribeSpecialistCaseRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true },
    });
  });

  it('renders Specialist Workstation backed by real cases API when logged in as specialist', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'spec-1',
      fullName: 'BS. CKI Nguyễn Mai Hoa',
      role: 'specialist',
      status: 'active',
      specialty: 'Da liễu & Điều trị mụn chuyên sâu',
      email: 'bacsi.hoa@skinsense.vn',
      phoneNumber: '0900000002',
    });

    await render(<Today />);

    await waitFor(() => {
      expect(screen.getByText('Bác Sĩ / Chuyên Viên Da Liễu')).toBeTruthy();
      expect(screen.getByText('BS. CKI Nguyễn Mai Hoa')).toBeTruthy();
      expect(screen.getByText(/Trần Thị Ngọc Hà/)).toBeTruthy();
      expect(screen.getByText('Cổng Bác sĩ')).toBeTruthy();
    });

    const prescribeButtons = screen.getAllByText('Kê Phác Đồ & Dặn Dò');
    fireEvent.press(prescribeButtons[0]);

    expect(await screen.findByText('Gửi Cho Bệnh Nhân')).toBeTruthy();
    fireEvent.press(screen.getByText('Gửi Cho Bệnh Nhân'));

    await waitFor(() => {
      expect(api.prescribeSpecialistCaseRemote).toHaveBeenCalledTimes(1);
    });
  });

  it('shows CCHN pending sandbox banner when doctor account is pending and zooms clinical photo', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'spec-pending',
      fullName: 'BS. Trần Minh Khoa',
      role: 'specialist',
      status: 'pending',
      licenseId: '009911/BYT-CCHN',
      email: 'bs.pending@skinsense.vn',
      phoneNumber: '0900000011',
    });

    await render(<Today />);

    await waitFor(() => {
      expect(screen.getByText('Tài khoản Bác sĩ đang chờ Admin duyệt CCHN')).toBeTruthy();
      expect(screen.getByText(/Chế độ Xem trước \(Read-Only Sandbox\)/)).toBeTruthy();
      expect(screen.getAllByText('Ảnh & Hồ sơ').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.press(screen.getAllByText('Ảnh & Hồ sơ')[0]);
    expect(await screen.findByText('1x')).toBeTruthy();
    fireEvent.press(screen.getByText('1x'));
    expect(await screen.findByText('2x Zoom')).toBeTruthy();
  });

  it('filters patient queue by status inside Specialist Workstation', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'spec-1',
      fullName: 'BS. CKI Nguyễn Mai Hoa',
      role: 'specialist',
      status: 'active',
      email: 'bacsi.hoa@skinsense.vn',
    });

    await render(<Today />);

    await waitFor(() => {
      expect(screen.getByText(/Trần Thị Ngọc Hà/)).toBeTruthy();
      expect(screen.getByText(/Đỗ Thu Trang/)).toBeTruthy();
    });

    await fireEvent.press(screen.getByRole('tab', { name: 'Đang điều trị' }));
    expect(screen.getByText(/Đỗ Thu Trang/)).toBeTruthy();
    expect(screen.queryByText(/Trần Thị Ngọc Hà/)).toBeNull();
  });

  it('renders Super Admin Workstation backed by live /api/admin/* endpoints', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'admin-1',
      fullName: 'Trần Thị Ngọc Hà',
      role: 'admin',
      isSuperAdmin: true,
      status: 'active',
      email: 'hattn.23itb@vku.udn.vn',
    });

    (api.loadAdminOrdersRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        orders: [
          {
            id: 'o1',
            orderCode: 'SS-880011',
            customerName: 'Nguyễn Minh',
            shopName: 'SkinSense Official',
            totalAmount: 520000,
            commission: 41600,
            status: 'delivered',
            paymentStatus: 'paid',
            paymentMethod: 'vietqr',
            createdAt: '2026-11-20T00:00:00Z',
          },
          {
            id: 'o2',
            orderCode: 'SS-880012',
            customerName: 'Lê Lan',
            shopName: 'SkinSense Official',
            totalAmount: 400000,
            commission: 32000,
            status: 'pending',
            paymentStatus: 'unpaid',
            paymentMethod: 'cod',
            createdAt: '2026-11-20T01:00:00Z',
          },
        ],
      },
    });
    (api.loadAdminUsersRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        users: [
          { id: 'u-shop', name: 'Shop VKU', email: 'shop@test.vn', role: 'shop', status: 'active' },
        ],
      },
    });
    (api.loadAdminProductsRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true, products: [] },
    });
    (api.loadAdminSpecialistsRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true, specialists: [] },
    });

    await render(<Today />);

    await waitFor(() => {
      expect(screen.getByText('Quản Trị Viên Tối Cao')).toBeTruthy();
      expect(screen.getByText('920.000₫')).toBeTruthy();
      expect(screen.getByText(/SS-880011/)).toBeTruthy();
      expect(screen.getByText('Vào Cổng Quản Trị Hệ Thống (Admin)')).toBeTruthy();
    });
  });

  it('renders Shop Merchant Workstation with live orders & GPKD pending gate', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'shop-1',
      fullName: 'Đại lý La Roche-Posay',
      role: 'shop',
      status: 'pending',
      shopName: 'La Roche-Posay Official Store',
      email: 'shop.laroche@skinsense.vn',
    });

    (api.loadUserOrdersRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        orders: [
          {
            id: 'ord-s1',
            orderCode: 'SS-301122',
            customerName: 'Trần Anh',
            totalAmount: 1200000,
            status: 'delivered',
            paymentMethod: 'cod',
            createdAt: '2026-11-20T00:00:00Z',
            items: [{ id: 'p1', name: 'Effaclar Duo+M', quantity: 2 }],
          },
        ],
      },
    });
    (api.loadAdminProductsRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true, products: [] },
    });

    await render(<Today />);

    await waitFor(() => {
      expect(screen.getByText('Gian Hàng Đối Tác')).toBeTruthy();
      expect(screen.getByText('La Roche-Posay Official Store')).toBeTruthy();
      expect(screen.getByText('Hồ sơ gian hàng đang chờ Admin SkinSense duyệt GPKD')).toBeTruthy();
      expect(screen.getAllByText('1.200.000₫').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Quản Trị Gian Hàng & Đăng Bán Sản Phẩm')).toBeTruthy();
    });
  });

  it('allows management roles (admin, specialist, shop) to switch to Trang Soi Da AI on Today screen', async () => {
    const trends = require('@/lib/trends');
    const routine = require('@/lib/routine');
    (trends.loadTrends as jest.Mock).mockResolvedValue({
      photos: [],
      readings: [],
      spots: [],
      entries: [],
      notes: [],
    });
    (routine.loadRoutine as jest.Mock).mockResolvedValue({
      items: [{ id: 'i1', label: 'Cleanser', position: 0 }],
      entry: null,
    });

    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'shop-1',
      fullName: 'Đại lý La Roche-Posay',
      role: 'shop',
      status: 'active',
      shopName: 'La Roche-Posay Official Store',
      email: 'shop.laroche@skinsense.vn',
    });

    await render(<Today />);
    expect(await screen.findByText('Trang Soi Da AI')).toBeTruthy();

    await fireEvent.press(screen.getByText('Trang Soi Da AI'));

    await waitFor(() => {
      expect(screen.getByText('Sàn & Xếp Routine')).toBeTruthy();
      expect(screen.getByText('Phác Đồ Bác Sĩ')).toBeTruthy();
    });
  });
});
