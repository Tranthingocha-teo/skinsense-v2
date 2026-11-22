import { fireEvent, render, screen } from '@testing-library/react-native';

import '@/i18n';
import * as api from '@/lib/api';
import { PrescribedRoutineView } from './prescribed-routine';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('@/lib/api', () => ({
  loadMyClinicalRecordsRemote: jest.fn(),
  fetchApprovedMarketplaceProducts: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.fetchApprovedMarketplaceProducts.mockResolvedValue([]);
});

describe('PrescribedRoutineView', () => {
  it('renders submitted clinical case tracker even before doctor prescribes', async () => {
    mockedApi.loadMyClinicalRecordsRemote.mockResolvedValue({
      fromRemote: true,
      cases: [
        {
          id: 'c1',
          caseCode: 'BA-2026-0011',
          patientName: 'Nguyễn Minh Anh',
          patientAge: 24,
          patientGender: 'Nữ',
          phone: '0901234567',
          submittedDate: '20/11/2026',
          status: 'pending_routine',
          severity: 'moderate',
          skinPhotoUrl: '',
          skinType: 'Da nhạy cảm',
          symptoms: 'Đỏ nhẹ vùng má trái',
          allergies: 'Không',
          assignedDoctor: 'BS. CKI Nguyễn Mai Hoa',
          aiAnalysis: { skinHealthScore: 72, rednessIndex: 38, inflammatorySpots: 4, affectedZones: ['Má trái'] },
        },
      ],
    });

    await render(<PrescribedRoutineView />);

    expect(await screen.findByText('Chưa có phác đồ nào được kê')).toBeTruthy();
    expect(screen.getByText(/BA-2026-0011/)).toBeTruthy();
    expect(screen.getByText(/Đang chờ Bác sĩ duyệt/)).toBeTruthy();
  });

  it('displays doctor-prescribed AM/PM products and filters by morning/evening tabs', async () => {
    mockedApi.loadMyClinicalRecordsRemote.mockResolvedValue({
      fromRemote: true,
      cases: [
        {
          id: 'c2',
          caseCode: 'BA-2026-0012',
          patientName: 'Lê Thu Hà',
          patientAge: 23,
          patientGender: 'Nữ',
          phone: '0909888777',
          submittedDate: '20/11/2026',
          status: 'in_treatment',
          severity: 'mild',
          skinPhotoUrl: '',
          skinType: 'Da dầu mụn',
          symptoms: 'Mụn ẩn cằm',
          allergies: 'Không',
          aiAnalysis: { skinHealthScore: 76, rednessIndex: 30, inflammatorySpots: 3, affectedZones: ['Cằm'] },
          currentRoutine: {
            routineTitle: 'Phác đồ phục hồi hàng rào da',
            startDate: '2026-11-20',
            revisitDate: '2026-12-04',
            doctorNotes: 'Tránh nắng kỹ vào buổi sáng.',
            prescribedBy: 'BS. CKI Nguyễn Mai Hoa',
            products: [
              {
                id: 'p_am',
                name: 'Kem Chống Nắng Anthelios SPF50+',
                brand: 'La Roche-Posay',
                stepTime: 'morning',
                dosage: '2 đốt ngón tay',
                usageGuide: 'Thoa mỗi sáng.',
              },
              {
                id: 'p_pm',
                name: 'Serum Hyalu B5 Phục Hồi',
                brand: 'La Roche-Posay',
                stepTime: 'evening',
                dosage: '3 giọt',
                usageGuide: 'Thoa mỗi tối.',
              },
            ],
          },
        },
      ],
    });

    await render(<PrescribedRoutineView />);

    expect(await screen.findByText('Phác đồ phục hồi hàng rào da')).toBeTruthy();
    expect(screen.getByText('Kem Chống Nắng Anthelios SPF50+')).toBeTruthy();
    expect(screen.getByText('Serum Hyalu B5 Phục Hồi')).toBeTruthy();

    await fireEvent.press(screen.getByRole('tab', { name: /Buổi Sáng/i }));
    expect(screen.getByText('Kem Chống Nắng Anthelios SPF50+')).toBeTruthy();
    expect(screen.queryByText('Serum Hyalu B5 Phục Hồi')).toBeNull();
  });
});
