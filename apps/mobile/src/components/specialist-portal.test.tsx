import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import * as api from '@/lib/api';
import * as auth from '@/lib/auth';
import { SpecialistPortal } from './specialist-portal';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

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
  };
});

describe('SpecialistPortal Component (Web Parity)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.loadSpecialistCasesRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        cases: [
          {
            id: 'c-severe',
            caseCode: 'BA-2026-0991',
            patientName: 'Phạm Quỳnh Anh',
            patientAge: 23,
            phone: '0911223344',
            skinType: 'Dầu mụn',
            symptoms: 'Mụn bọc viêm nặng vùng má',
            allergies: 'Không',
            submittedDate: '2026-11-20',
            status: 'pending_routine',
            severity: 'severe',
            aiAnalysis: { skinHealthScore: 54, rednessIndex: 51, inflammatorySpots: 12 },
          },
          {
            id: 'c-mild',
            caseCode: 'BA-2026-0992',
            patientName: 'Vũ Minh Châu',
            patientAge: 25,
            phone: '0922334455',
            skinType: 'Khô',
            symptoms: 'Mẩn đỏ nhẹ hai gò má',
            allergies: 'Cồn khô',
            submittedDate: '2026-11-20',
            status: 'completed',
            severity: 'mild',
            aiAnalysis: { skinHealthScore: 84, rednessIndex: 16, inflammatorySpots: 1 },
          },
        ],
      },
    });
    (api.fetchApprovedMarketplaceProducts as jest.Mock).mockResolvedValue([]);
    (api.prescribeSpecialistCaseRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true },
    });
  });

  it('filters by severity, adds a custom prescription product, and submits prescribeSpecialistCaseRemote', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'doc-1',
      role: 'specialist',
      status: 'active',
      fullName: 'BS. Nguyễn Ngọc Bảo',
      licenseId: 'BYT-12345',
      hospital: 'BV Da Liễu TW',
      specialty: 'Điều trị mụn & Phục hồi',
    });

    await render(<SpecialistPortal />);

    await waitFor(() => {
      expect(screen.getByText('Cổng Bác Sĩ Chuyên Khoa')).toBeTruthy();
      expect(screen.getByText(/Phạm Quỳnh Anh/)).toBeTruthy();
      expect(screen.getByText(/Vũ Minh Châu/)).toBeTruthy();
    });

    await fireEvent.press(screen.getByRole('tab', { name: 'Nặng' }));
    await waitFor(() => {
      expect(screen.getByText(/Phạm Quỳnh Anh/)).toBeTruthy();
      expect(screen.queryByText(/Vũ Minh Châu/)).toBeNull();
    });

    await fireEvent.press(screen.getByText('Kê Phác Đồ & Dặn Dò'));
    expect(await screen.findByText('Tên phác đồ *')).toBeTruthy();

    await fireEvent.press(screen.getByText('Tự thêm sản phẩm'));
    await fireEvent.changeText(
      screen.getByPlaceholderText('Tên sản phẩm kê ngoài *'),
      'B5 Cicaplast Baume',
    );
    await fireEvent.press(screen.getByText('Thêm vào đơn'));

    await fireEvent.press(screen.getByText('Gửi Cho Bệnh Nhân'));

    await waitFor(() => {
      expect(api.prescribeSpecialistCaseRemote).toHaveBeenCalledWith(
        expect.objectContaining({
          caseId: 'c-severe',
          products: expect.arrayContaining([
            expect.objectContaining({ name: 'B5 Cicaplast Baume' }),
          ]),
        }),
      );
    });
  });

  it('locks prescribing in Read-Only Sandbox when doctor CCHN is pending', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'doc-pending',
      role: 'specialist',
      status: 'pending',
      fullName: 'BS. Chờ Duyệt',
      licenseId: 'CCHN-0001',
    });

    await render(<SpecialistPortal />);

    await waitFor(() => {
      expect(screen.getByText('Tài khoản Bác sĩ đang chờ Admin duyệt CCHN')).toBeTruthy();
    });

    fireEvent.press(screen.getAllByText('Kê Phác Đồ & Dặn Dò')[0]);
    expect(api.prescribeSpecialistCaseRemote).not.toHaveBeenCalled();
  });
});
