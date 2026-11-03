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

  it('switches between tabs: Đơn hàng, Bán thêm sản phẩm, Tài chính & Ví Shop', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Bán thêm sản phẩm/i)).toBeTruthy();
      expect(screen.getByText(/Tài chính & Ví Shop/i)).toBeTruthy();
    });

    // Switch to Products tab
    fireEvent.press(screen.getByText(/Bán thêm sản phẩm/i));

    await waitFor(() => {
      expect(screen.getByText(/\+ Bán thêm sản phẩm mới/i)).toBeTruthy();
      expect(screen.getAllByText(/SkinSense Gốc/i).length).toBeGreaterThan(0);
    });

    // Switch to Finance / Analytics tab
    fireEvent.press(screen.getByText(/Tài chính & Ví Shop/i));

    await waitFor(() => {
      expect(screen.getByText('Tài Chính & Doanh Thu Sàn SkinSense')).toBeTruthy();
      expect(screen.getByText(/Duyệt Lệnh Rút Tiền Ví Shop/i)).toBeTruthy();
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

  it('switches to Duyệt Shop tab and renders shop management controls', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Duyệt Shop/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Duyệt Shop/i));

    await waitFor(() => {
      expect(screen.getByText(/\+ Tạo Shop Bán Hàng Mới/i)).toBeTruthy();
      expect(screen.getAllByText(/La Roche-Posay Official Store/i).length).toBeGreaterThan(0);
    });

    // Tap + Tạo Shop Bán Hàng Mới
    fireEvent.press(screen.getByText(/\+ Tạo Shop Bán Hàng Mới/i));

    await waitFor(() => {
      expect(screen.getByText('Tạo & Nộp Duyệt')).toBeTruthy();
      expect(screen.getByPlaceholderText(/Cocolux Dược Mỹ Phẩm/i)).toBeTruthy();
    });
  });

  it('switches to Người dùng tab and displays users list with lock status', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Người dùng/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Người dùng/i));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Tìm theo tên, email, SĐT...')).toBeTruthy();
      expect(screen.getAllByText(/Hoạt động|Đang bị khóa/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Khóa tài khoản|Tài khoản cố định/i).length).toBeGreaterThan(0);
    });
  });
});
