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

describe('ShopPortal Component (Shopee Seller Center)', () => {
  it('renders shop portal header and active shop details', async () => {
    await render(<ShopPortal />);

    await waitFor(() => {
      expect(screen.getByText('Kênh Người Bán')).toBeTruthy();
      expect(screen.getByText('Shopee Seller Center')).toBeTruthy();
      expect(screen.getByText(/Gian hàng đang quản lý/i)).toBeTruthy();
      expect(screen.getByText('SkinSense Official Store')).toBeTruthy();
      expect(screen.getByText(/Đơn \(/i)).toBeTruthy();
      expect(screen.getByText(/Kho \(/i)).toBeTruthy();
      expect(screen.getByText('Ví Shop')).toBeTruthy();
    });
  });

  it('switches to inventory tab and shows products with pricing', async () => {
    await render(<ShopPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Kho \(/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Kho \(/i));

    await waitFor(() => {
      expect(screen.getAllByText(/La Roche-Posay/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Sửa Giá & Kho|\+ Đăng Bán SP/i).length).toBeGreaterThan(0);
    });
  });

  it('opens edit listing modal when clicking Sửa Giá & Kho', async () => {
    await render(<ShopPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Kho \(/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Kho \(/i));

    await waitFor(() => {
      expect(screen.getAllByText(/La Roche-Posay/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Sửa Giá & Kho|\+ Đăng Bán SP/i).length).toBeGreaterThan(0);
    });

    const editBtns = screen.getAllByText(/Sửa Giá & Kho|\+ Đăng Bán SP/i);
    fireEvent.press(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Thiết Lập Giá & Kho Bán')).toBeTruthy();
      expect(screen.getByText('Giá bán của shop (VNĐ)')).toBeTruthy();
      expect(screen.getByText('Số lượng tồn kho (Hộp)')).toBeTruthy();
      expect(screen.getByText(/Bài viết \/ Mô tả sản phẩm của Shop/i)).toBeTruthy();
      expect(screen.getByText(/Hình ảnh sản phẩm của Shop/i)).toBeTruthy();
      expect(screen.getByText('Lưu Niêm Yết')).toBeTruthy();
    });
  });

  it('switches to Ví Shop tab and displays Shopee Balance & Withdraw button', async () => {
    await render(<ShopPortal />);

    await waitFor(() => {
      expect(screen.getByText('Ví Shop')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Ví Shop'));

    await waitFor(() => {
      expect(screen.getByText('Số Dư Ví Người Bán (Shopee Balance)')).toBeTruthy();
      expect(screen.getByText('Rút Tiền Về Tài Khoản Ngân Hàng')).toBeTruthy();
      expect(screen.getByText(/Lịch sử yêu cầu rút tiền/i)).toBeTruthy();
    });

    // Open withdrawal modal
    fireEvent.press(screen.getByText('Rút Tiền Về Tài Khoản Ngân Hàng'));

    await waitFor(() => {
      expect(screen.getByText('Số tiền muốn rút (VNĐ) *')).toBeTruthy();
      expect(screen.getByText('Chọn ngân hàng thụ hưởng *')).toBeTruthy();
      expect(screen.getByText('Xác Nhận Rút Tiền')).toBeTruthy();
    });
  });
});
