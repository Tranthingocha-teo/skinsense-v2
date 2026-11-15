import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import { BuyerOrdersModal } from './buyer-orders';
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

describe('BuyerOrdersModal Component (My Orders)', () => {
  it('renders order tabs and active orders list', async () => {
    await render(<BuyerOrdersModal visible={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Đơn Mua Của Tôi')).toBeTruthy();
      expect(screen.getByText('Chờ xác nhận')).toBeTruthy();
      expect(screen.getByText('Chờ lấy hàng')).toBeTruthy();
      expect(screen.getByText('Đang giao')).toBeTruthy();
      expect(screen.getByText('Đã giao')).toBeTruthy();
    });
  });

  it('displays shipping tracking and order details', async () => {
    await render(<BuyerOrdersModal visible={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText('Giao nhanh').length).toBeGreaterThan(0);
      expect(screen.getAllByText('MALL').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tổng thanh toán:/i).length).toBeGreaterThan(0);
    });
  });

  it('opens SPX tracking timeline modal when tapping Theo dõi vận đơn', async () => {
    await render(<BuyerOrdersModal visible={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText('Theo dõi vận đơn').length).toBeGreaterThan(0);
    });

    const trackingBtns = screen.getAllByText('Theo dõi vận đơn');
    fireEvent.press(trackingBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Hành Trình Vận Đơn')).toBeTruthy();
      expect(screen.getByText(/Trạng thái di chuyển kiện hàng/i)).toBeTruthy();
      expect(screen.getByText('Đã Hiểu')).toBeTruthy();
    });
  });

  it('opens rating modal when tapping Đã nhận hàng', async () => {
    await render(<BuyerOrdersModal visible={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText('Đã nhận hàng').length).toBeGreaterThan(0);
    });

    const deliveredBtns = screen.getAllByText('Đã nhận hàng');
    fireEvent.press(deliveredBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Xác Nhận & Đánh Giá Đơn Hàng')).toBeTruthy();
      expect(screen.getByText(/Chất lượng sản phẩm & Dịch vụ gian hàng/i)).toBeTruthy();
      expect(screen.getByText(/Tuyệt vời \(5\/5\)/i)).toBeTruthy();
      expect(screen.getByText('Xác Nhận Đã Nhận & Gửi Đánh Giá')).toBeTruthy();
    });
  });
});
