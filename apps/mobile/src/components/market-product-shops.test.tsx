import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import { MarketProductShops } from './market-product-shops';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
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
  it('renders verified shops offering the product', async () => {
    await render(<MarketProductShops productId="lrp-effaclar-duo-m" />);

    await waitFor(() => {
      expect(screen.getByText('Gian hàng chính hãng')).toBeTruthy();
      expect(screen.getByText(/La Roche-Posay/i)).toBeTruthy();
      expect(screen.getByText(/Effaclar Duo\+M/i)).toBeTruthy();
    });

    // Should list approved shops
    await waitFor(() => {
      expect(screen.getByText('SkinSense Official Store')).toBeTruthy();
      expect(screen.getByText('Dược Mỹ Phẩm Hà Nội')).toBeTruthy();
    });
  });

  it('renders fallback for non-existent product', async () => {
    await render(<MarketProductShops productId="unknown-xyz" />);

    expect(screen.getByText('Không tìm thấy sản phẩm')).toBeTruthy();
    expect(screen.getByText('Quay lại')).toBeTruthy();
  });

  it('opens checkout modal when clicking Chọn mua', async () => {
    await render(<MarketProductShops productId="lrp-effaclar-duo-m" />);

    await waitFor(() => {
      expect(screen.getAllByText('Chọn mua').length).toBeGreaterThan(0);
    });

    const buyButtons = screen.getAllByText('Chọn mua');
    fireEvent.press(buyButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Xác nhận đặt hàng')).toBeTruthy();
      expect(screen.getByText('Hình thức thanh toán')).toBeTruthy();
    });
  });
});
