import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import { MarketProductShops } from './market-product-shops';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  Link: ({ children }: any) => children,
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

describe('MarketProductShops Component', () => {
  it('renders direct official order screen for SkinSense product', async () => {
    await render(<MarketProductShops productId="lrp-effaclar-duo-m" />);

    await waitFor(() => {
      expect(screen.getByText('Đặt Mua Chính Hãng SkinSense')).toBeTruthy();
      expect(screen.getByText(/La Roche-Posay/i)).toBeTruthy();
      expect(screen.getByText(/Effaclar Duo\+M/i)).toBeTruthy();
      expect(screen.getByText('100% Chính Hãng')).toBeTruthy();
      expect(screen.getByText('Xác nhận đặt hàng')).toBeTruthy();
      expect(screen.getByText(/Thanh toán khi nhận hàng \(COD\)/)).toBeTruthy();
    });
  });

  it('renders fallback for non-existent product', async () => {
    await render(<MarketProductShops productId="unknown-xyz" />);

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeTruthy();
      expect(screen.getByText('Quay lại')).toBeTruthy();
    });
  });

  it('allows increasing and decreasing purchase quantity', async () => {
    await render(<MarketProductShops productId="skin1004-centella-ampoule" />);

    await waitFor(() => {
      expect(screen.getByText('Số lượng mua')).toBeTruthy();
    });

    const plusBtn = screen.getByLabelText('Tăng số lượng');
    fireEvent.press(plusBtn);

    const minusBtn = screen.getByLabelText('Giảm số lượng');
    fireEvent.press(minusBtn);
  });
});
