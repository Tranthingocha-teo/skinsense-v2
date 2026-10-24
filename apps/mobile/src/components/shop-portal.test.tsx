import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import { ShopPortal } from './shop-portal';
import * as marketplace from '@/lib/marketplace';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
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

describe('ShopPortal Component', () => {
  it('renders shop portal header and active shop details', async () => {
    await render(<ShopPortal />);

    await waitFor(() => {
      expect(screen.getByText('Kênh Người Bán')).toBeTruthy();
      expect(screen.getByText(/Gian hàng đang quản lý/i)).toBeTruthy();
      expect(screen.getByText('SkinSense Official Store')).toBeTruthy();
      expect(screen.getByText('Doanh thu')).toBeTruthy();
      expect(screen.getByText('Đơn hàng')).toBeTruthy();
    });
  });

  it('switches to inventory tab and shows products', async () => {
    await render(<ShopPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Kho & Bảng giá/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Kho & Bảng giá/i));

    await waitFor(() => {
      expect(screen.getAllByText('La Roche-Posay').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Chỉnh sửa').length).toBeGreaterThan(0);
    });
  });

  it('opens edit listing modal when clicking Chỉnh sửa', async () => {
    await render(<ShopPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Kho & Bảng giá/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Kho & Bảng giá/i));

    await waitFor(() => {
      expect(screen.getAllByText('Chỉnh sửa').length).toBeGreaterThan(0);
    });

    const editBtns = screen.getAllByText('Chỉnh sửa');
    fireEvent.press(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Thiết lập giá & kho hàng')).toBeTruthy();
      expect(screen.getByText('Giá bán gian hàng (VND)')).toBeTruthy();
      expect(screen.getByText('Lưu thay đổi')).toBeTruthy();
    });
  });
});
