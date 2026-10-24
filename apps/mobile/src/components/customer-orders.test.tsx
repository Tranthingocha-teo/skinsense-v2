import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import { CustomerOrders } from './customer-orders';
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

describe('CustomerOrders Component', () => {
  it('renders empty orders placeholder when no orders exist', async () => {
    jest.spyOn(marketplace, 'loadOrders').mockResolvedValueOnce([]);

    await render(<CustomerOrders />);

    await waitFor(() => {
      expect(screen.getByText('Đơn mua của tôi')).toBeTruthy();
      expect(screen.getByText('Chưa có đơn hàng nào')).toBeTruthy();
    });
  });

  it('renders orders list and displays status badges', async () => {
    jest.spyOn(marketplace, 'loadOrders').mockResolvedValueOnce([
      {
        id: 'ORD-TEST-1234',
        shopId: 'shop-1',
        shopName: 'SkinSense Official Store',
        productId: 'lrp-effaclar-duo-m',
        productName: 'Effaclar Duo+M Giảm Mụn & Ngừa Thâm 40ml',
        productImage: 'https://example.com/test.jpg',
        priceVnd: 385000,
        quantity: 1,
        totalVnd: 385000,
        totalFormatted: '385.000₫',
        customerName: 'Nguyễn Văn Test',
        customerPhone: '0901234567',
        customerAddress: '123 Test Street, Hà Nội',
        paymentMethod: 'vietqr',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ]);

    await render(<CustomerOrders />);

    await waitFor(() => {
      expect(screen.getByText('SkinSense Official Store')).toBeTruthy();
      expect(screen.getByText(/Effaclar Duo\+M/i)).toBeTruthy();
      expect(screen.getByText('385.000₫')).toBeTruthy();
      expect(screen.getAllByText('Chờ xác nhận').length).toBeGreaterThan(0);
      expect(screen.getByText('Xem mã VietQR')).toBeTruthy();
      expect(screen.getByText('Huỷ đơn')).toBeTruthy();
    });
  });

  it('opens VietQR modal when clicking Xem mã VietQR', async () => {
    jest.spyOn(marketplace, 'loadOrders').mockResolvedValueOnce([
      {
        id: 'ORD-TEST-9999',
        shopId: 'shop-1',
        shopName: 'SkinSense Official Store',
        productId: 'lrp-effaclar-duo-m',
        productName: 'Effaclar Duo+M Giảm Mụn & Ngừa Thâm 40ml',
        productImage: 'https://example.com/test.jpg',
        priceVnd: 385000,
        quantity: 1,
        totalVnd: 385000,
        totalFormatted: '385.000₫',
        customerName: 'Nguyễn Văn Test',
        customerPhone: '0901234567',
        customerAddress: '123 Test Street, Hà Nội',
        paymentMethod: 'vietqr',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ]);

    await render(<CustomerOrders />);

    await waitFor(() => {
      expect(screen.getByText('Xem mã VietQR')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Xem mã VietQR'));

    await waitFor(() => {
      expect(screen.getByText('Mã QR Thanh Toán')).toBeTruthy();
      expect(screen.getByText('MB Bank (Quân Đội)')).toBeTruthy();
    });
  });
});
