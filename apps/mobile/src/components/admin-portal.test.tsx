import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import { AdminPortal } from './admin-portal';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
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

describe('AdminPortal Component', () => {
  it('renders store admin header and core metrics', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText('Quản Trị Cửa Hàng SkinSense')).toBeTruthy();
      expect(screen.getByText('Doanh thu thực')).toBeTruthy();
      expect(screen.getByText('Đơn đặt hàng')).toBeTruthy();
      expect(screen.getByText('Kho hàng')).toBeTruthy();
    });
  });

  it('switches between tabs: Đơn hàng, Bán thêm sản phẩm, Báo cáo doanh số', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Bán thêm sản phẩm/i)).toBeTruthy();
      expect(screen.getByText(/Báo cáo doanh số/i)).toBeTruthy();
    });

    // Switch to Products tab
    fireEvent.press(screen.getByText(/Bán thêm sản phẩm/i));

    await waitFor(() => {
      expect(screen.getByText(/\+ Bán thêm sản phẩm mới/i)).toBeTruthy();
      expect(screen.getAllByText(/SkinSense Gốc/i).length).toBeGreaterThan(0);
    });

    // Switch to Analytics tab
    fireEvent.press(screen.getByText(/Báo cáo doanh số/i));

    await waitFor(() => {
      expect(screen.getByText('Hiệu quả kinh doanh độc quyền')).toBeTruthy();
    });
  });

  it('opens modal to add new product when clicking + Bán thêm sản phẩm mới', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Bán thêm sản phẩm/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Bán thêm sản phẩm/i));

    await waitFor(() => {
      expect(screen.getByText(/\+ Bán thêm sản phẩm mới/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/\+ Bán thêm sản phẩm mới/i));

    await waitFor(() => {
      expect(screen.getByText('Lưu & Bày bán ngay')).toBeTruthy();
      expect(screen.getByText('Chọn ảnh sản phẩm mẫu')).toBeTruthy();
    });
  });
});
