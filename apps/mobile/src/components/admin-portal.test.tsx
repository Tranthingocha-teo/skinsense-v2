import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import { AdminPortal } from './admin-portal';
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

describe('AdminPortal Component', () => {
  it('renders admin portal header and platform metrics', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText('Quản Trị Viên Tối Cao')).toBeTruthy();
      expect(screen.getByText('SkinSense Marketplace Admin')).toBeTruthy();
      expect(screen.getByText('Tổng GMV sàn')).toBeTruthy();
      expect(screen.getByText('Gian hàng duyệt')).toBeTruthy();
    });
  });

  it('renders shops list with action buttons', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText('SkinSense Official Store')).toBeTruthy();
      expect(screen.getByText('Dược Mỹ Phẩm Hà Nội')).toBeTruthy();
      expect(screen.getByText('K-Beauty Mall Vietnam')).toBeTruthy();
    });
  });

  it('switches between tabs: Gian hàng, Đơn hàng, Danh mục', async () => {
    await render(<AdminPortal />);

    await waitFor(() => {
      expect(screen.getByText(/Danh mục/i)).toBeTruthy();
    });

    // Switch to Catalog
    fireEvent.press(screen.getByText(/Danh mục/i));

    await waitFor(() => {
      expect(screen.getAllByText(/La Roche-Posay/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Skin1004/i).length).toBeGreaterThan(0);
    });

    // Switch to Orders
    fireEvent.press(screen.getByText(/Đơn hàng/i));

    await waitFor(() => {
      expect(screen.getAllByText('Tất cả').length).toBeGreaterThan(0);
    });
  });
});
