import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import * as api from '@/lib/api';
import { ClinicalStorefront } from './clinical-storefront';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  Link: ({ children }: any) => children,
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('@/lib/api', () => ({
  fetchApprovedMarketplaceProducts: jest.fn(),
  loadPersonalRoutineRemote: jest.fn(),
  loadLocalCustomRoutineProductIds: jest.fn(),
  savePersonalRoutineRemote: jest.fn(),
  apiJson: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.fetchApprovedMarketplaceProducts.mockResolvedValue([
    {
      id: 'remote_b5',
      name: 'Serum Phục Hồi Hyalu B5 Partner 30ml',
      shopName: 'Dermatology Partner Hub',
      brand: 'La Roche-Posay',
      category: 'Phục hồi & Cấp ẩm',
      price: 850000,
      status: 'approved',
      description: 'Vitamin B5 phục hồi hàng rào da.',
    },
  ]);
  mockedApi.loadPersonalRoutineRemote.mockResolvedValue({ ok: false, status: 401, data: null });
  mockedApi.loadLocalCustomRoutineProductIds.mockResolvedValue([]);
  mockedApi.savePersonalRoutineRemote.mockResolvedValue({
    ok: true,
    status: 200,
    data: { ok: true, savedCount: 1, protocolProductIds: ['remote_b5'], message: 'Đã lưu' },
  });
});

describe('ClinicalStorefront (Mobile Store)', () => {
  it('renders approved partner products alongside domain catalog with AM/PM badges and concern filters', async () => {
    await render(<ClinicalStorefront />);

    expect(screen.getByText('Sàn Dược Mỹ Phẩm Chuẩn Y Khoa')).toBeTruthy();
    expect(await screen.findByText('Serum Phục Hồi Hyalu B5 Partner 30ml')).toBeTruthy();
    expect(screen.getByText('Tất cả')).toBeTruthy();
    expect(screen.getByText('Da Dầu & Mụn')).toBeTruthy();
  });

  it('adds products into Routine Builder, runs active-ingredient checks, and saves to backend', async () => {
    await render(<ClinicalStorefront />);
    await screen.findByText('Serum Phục Hồi Hyalu B5 Partner 30ml');

    const addButtons = screen.getAllByRole('button', { name: /\+ Routine/i });
    await fireEvent.press(addButtons[0]);

    expect(await screen.findByText('Xây dựng Routine & Kiểm tra hoạt chất')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Lưu vào Routine của tôi/i }));

    await waitFor(() => expect(mockedApi.savePersonalRoutineRemote).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Đã lưu/)).toBeTruthy();
  });
});
