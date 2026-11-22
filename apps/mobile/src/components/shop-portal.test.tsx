import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import * as picker from 'expo-image-picker';

import * as api from '@/lib/api';
import * as auth from '@/lib/auth';
import { ShopPortal } from './shop-portal';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@/lib/auth', () => ({
  useCurrentUser: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    loadUserOrdersRemote: jest.fn(),
    loadAdminProductsRemote: jest.fn(),
    mutateUserOrderRemote: jest.fn(),
    createProductRemote: jest.fn(),
    uploadImageRemote: jest.fn(),
    loadShopChatThreadsRemote: jest.fn(),
    sendChatMessageRemote: jest.fn(),
  };
});

describe('ShopPortal Component (Web Seller Center Parity)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'shop-1',
      role: 'shop',
      status: 'active',
      fullName: 'Nguyễn Minh Shop',
      email: 'shop@skinsense.vn',
      shopName: 'La Roche-Posay Official',
      shopDetails: {
        shopName: 'La Roche-Posay Official',
        ownerName: 'Nguyễn Minh Shop',
        license: 'GPKD-888999',
        address: 'Hải Châu, Đà Nẵng',
      },
    });
    (api.loadUserOrdersRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        orders: [
          {
            id: 'ord-1',
            orderCode: 'SS-9001',
            customerName: 'Lê Thảo',
            customerPhone: '0901122334',
            shopName: 'La Roche-Posay Official',
            totalAmount: 500000,
            status: 'delivered',
            paymentMethod: 'vietqr',
            createdAt: '2026-11-20T00:00:00Z',
            items: [{ id: 'p1', name: 'Effaclar Duo+M', quantity: 1 }],
          },
          {
            id: 'ord-2',
            orderCode: 'SS-9002',
            customerName: 'Trần Bảo',
            customerPhone: '0905566778',
            shopName: 'La Roche-Posay Official',
            totalAmount: 350000,
            status: 'pending',
            paymentMethod: 'cod',
            createdAt: '2026-11-20T01:00:00Z',
            items: [{ id: 'p2', name: 'B5 Serum', quantity: 1 }],
          },
        ],
      },
    });
    (api.loadAdminProductsRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        products: [
          {
            id: 'prod-1',
            name: 'Kem Dưỡng Cicaplast B5',
            shopName: 'La Roche-Posay Official',
            price: 390000,
            stock: 42,
            status: 'approved',
          },
          {
            id: 'prod-2',
            name: 'Sữa Rửa Mặt Chờ Duyệt',
            shopName: 'La Roche-Posay Official',
            price: 290000,
            stock: 15,
            status: 'pending',
          },
        ],
      },
    });
    (api.mutateUserOrderRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true, message: 'Đã xác nhận đơn' },
    });
    (api.createProductRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      data: { ok: true },
    });
    (api.loadShopChatThreadsRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        threads: [
          {
            id: 'thread-1',
            shopId: 'la_roche_posay_official',
            shopName: 'La Roche-Posay Official',
            userId: 'cust-1',
            userName: 'Lê Thảo',
            orderCode: 'SS-9001',
            messages: [
              {
                id: 'msg-1',
                sender: 'user',
                senderName: 'Lê Thảo',
                text: 'Shop gói kỹ giúp mình nhé!',
                time: '09:15',
              },
            ],
          },
        ],
      },
    });
    (api.sendChatMessageRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        thread: {
          id: 'thread-1',
          shopId: 'la_roche_posay_official',
          shopName: 'La Roche-Posay Official',
          userId: 'cust-1',
          userName: 'Lê Thảo',
          orderCode: 'SS-9001',
          messages: [
            {
              id: 'msg-1',
              sender: 'user',
              senderName: 'Lê Thảo',
              text: 'Shop gói kỹ giúp mình nhé!',
              time: '09:15',
            },
            {
              id: 'msg-2',
              sender: 'shop',
              senderName: 'La Roche-Posay Official',
              text: 'Dạ Shop đã đóng gói chống sốc cẩn thận ạ.',
              time: '09:16',
            },
          ],
        },
      },
    });
  });

  it('renders shop header, live orders, and triggers order confirmation via API', async () => {
    await render(<ShopPortal />);

    await waitFor(() => {
      expect(screen.getByText('Kênh Người Bán SkinSense')).toBeTruthy();
      expect(screen.getByText('La Roche-Posay Official')).toBeTruthy();
      expect(screen.getByText('Xem Sàn')).toBeTruthy();
      expect(screen.getByText('SS-9001')).toBeTruthy();
      expect(screen.getByText('SS-9002')).toBeTruthy();
    });

    await fireEvent.press(await screen.findByText('Xác nhận đơn'));
    await waitFor(() => {
      expect(api.mutateUserOrderRemote).toHaveBeenCalledWith({
        orderCode: 'SS-9002',
        action: 'confirm',
      });
    });
  });

  it('switches to products tab, displays approval badges, and submits new product for Admin review', async () => {
    await render(<ShopPortal />);

    const prodTab = await screen.findByText(/Sản phẩm/);
    await fireEvent.press(prodTab);

    expect(await screen.findByText('Kem Dưỡng Cicaplast B5')).toBeTruthy();
    expect(screen.getByText('Sữa Rửa Mặt Chờ Duyệt')).toBeTruthy();

    await fireEvent.press(screen.getByText('+ Đăng bán sản phẩm mới'));
    expect(await screen.findByText('Thêm sản phẩm mới')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('Tên sản phẩm *'), 'Toner Rau Má');
    await fireEvent.press(screen.getByText('Gửi duyệt & Đăng bán'));

    await waitFor(() => {
      expect(api.createProductRemote).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Toner Rau Má',
          shopName: 'La Roche-Posay Official',
        }),
      );
    });
  });

  describe('product image on Cloudinary', () => {
    const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v1/products/shop/toner.jpg';
    const pick = picker.launchImageLibraryAsync as jest.Mock;
    const perm = picker.requestMediaLibraryPermissionsAsync as jest.Mock;
    const upload = api.uploadImageRemote as jest.Mock;

    async function openForm() {
      await render(<ShopPortal />);
      await fireEvent.press(await screen.findByText(/Sản phẩm/));
      await fireEvent.press(await screen.findByText('+ Đăng bán sản phẩm mới'));
      await screen.findByText('Thêm sản phẩm mới');
      await fireEvent.changeText(screen.getByPlaceholderText('Tên sản phẩm *'), 'Toner Rau Má');
      await fireEvent.changeText(screen.getByPlaceholderText('Giá bán VNĐ *'), '250000');
    }

    it('uploads the picked image to the products folder and sends the Cloudinary link as coverImage', async () => {
      perm.mockResolvedValue({ granted: true });
      pick.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///toner.jpg' }] });
      upload.mockResolvedValue({ ok: true, url: CLOUD });
      (api.createProductRemote as jest.Mock).mockResolvedValue({ ok: true, status: 200, data: { ok: true } });

      await openForm();
      await fireEvent.press(screen.getByText(/Chọn ảnh sản phẩm/));
      await fireEvent.press(screen.getByText('Gửi duyệt & Đăng bán'));

      await waitFor(() =>
        expect(upload).toHaveBeenCalledWith(expect.objectContaining({ uri: 'file:///toner.jpg', folder: 'products' })),
      );
      await waitFor(() =>
        expect(api.createProductRemote).toHaveBeenCalledWith(expect.objectContaining({ coverImage: CLOUD, images: [CLOUD] })),
      );
    });

    it('does not create the product when the image upload fails', async () => {
      perm.mockResolvedValue({ granted: true });
      pick.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///toner.jpg' }] });
      upload.mockResolvedValue({ ok: false, error: 'HTTP 503' });

      await openForm();
      await fireEvent.press(screen.getByText(/Chọn ảnh sản phẩm/));
      await fireEvent.press(screen.getByText('Gửi duyệt & Đăng bán'));

      expect(await screen.findByText('HTTP 503')).toBeTruthy();
      expect(api.createProductRemote).not.toHaveBeenCalled();
    });

    it('still creates a product without an image and uploads nothing', async () => {
      (api.createProductRemote as jest.Mock).mockResolvedValue({ ok: true, status: 200, data: { ok: true } });
      await openForm();
      await fireEvent.press(screen.getByText('Gửi duyệt & Đăng bán'));
      await waitFor(() => expect(api.createProductRemote).toHaveBeenCalled());
      expect(upload).not.toHaveBeenCalled();
      expect((api.createProductRemote as jest.Mock).mock.calls[0][0].coverImage).toBeUndefined();
    });

    it('refuses the picker when the photo-library permission is denied', async () => {
      perm.mockResolvedValue({ granted: false });
      await openForm();
      await fireEvent.press(screen.getByText(/Chọn ảnh sản phẩm/));
      expect(await screen.findByText(/quyền thư viện ảnh/)).toBeTruthy();
      expect(pick).not.toHaveBeenCalled();
    });
  });

  it('computes net revenue (after 8% platform fee) in Doanh thu tab and renders GPKD profile', async () => {
    await render(<ShopPortal />);

    const walletTab = await screen.findByText('Doanh thu');
    await fireEvent.press(walletTab);
    expect(await screen.findByText(/Doanh thu thực nhận \(Sau phí sàn 8%\)/)).toBeTruthy();
    expect(screen.getByText('460.000₫')).toBeTruthy();

    await fireEvent.press(screen.getByText('Hồ sơ Shop'));
    expect(await screen.findByText(/GPKD-888999/)).toBeTruthy();
  });

  it('blocks product creation when shop status is pending Admin GPKD approval', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'shop-pending',
      role: 'shop',
      status: 'pending',
      fullName: 'Chờ duyệt Shop',
      shopName: 'Pending Beauty Store',
    });

    await render(<ShopPortal />);

    expect(await screen.findByText(/đang chờ Super Admin/i)).toBeTruthy();

    const prodTab = await screen.findByText(/Sản phẩm/);
    await fireEvent.press(prodTab);
    const addBtn = await screen.findByText('+ Đăng bán sản phẩm mới');
    await fireEvent.press(addBtn);
    expect(screen.queryByText('Thêm sản phẩm mới')).toBeNull();
  });

  it('switches to Tin nhắn tab, displays customer chat thread, and sends shop reply', async () => {
    await render(<ShopPortal />);

    const chatTab = await screen.findByText(/Tin nhắn/);
    await fireEvent.press(chatTab);

    expect(await screen.findByText('Shop gói kỹ giúp mình nhé!')).toBeTruthy();

    await fireEvent.changeText(
      screen.getByPlaceholderText('Trả lời khách hàng...'),
      'Dạ Shop đã đóng gói chống sốc cẩn thận ạ.',
    );
    await fireEvent.press(screen.getByLabelText('Gửi phản hồi'));

    await waitFor(() => {
      expect(api.sendChatMessageRemote).toHaveBeenCalledWith({
        shopId: 'la_roche_posay_official',
        shopName: 'La Roche-Posay Official',
        userId: 'cust-1',
        userName: 'Lê Thảo',
        orderCode: 'SS-9001',
        sender: 'shop',
        text: 'Dạ Shop đã đóng gói chống sốc cẩn thận ạ.',
      });
    });

    expect(await screen.findByText('Dạ Shop đã đóng gói chống sốc cẩn thận ạ.')).toBeTruthy();
  });
});
