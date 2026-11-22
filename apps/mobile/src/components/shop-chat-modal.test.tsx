import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import * as api from '@/lib/api';
import { ShopChatModal } from './shop-chat-modal';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    loadCustomerChatRemote: jest.fn(),
    sendChatMessageRemote: jest.fn(),
  };
});

describe('ShopChatModal (Native /api/chat)', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads chat messages for the target shop and sends custom reply', async () => {
    (api.loadCustomerChatRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        thread: {
          id: 't1',
          shopId: 'la_roche_posay_official',
          shopName: 'La Roche-Posay Official',
          userId: 'u1',
          userName: 'Ngọc Hà',
          messages: [
            {
              id: 'm1',
              sender: 'shop',
              senderName: 'La Roche-Posay Official',
              text: 'Xin chào, shop có thể tư vấn giúp bạn không?',
              time: '09:30',
            },
          ],
        },
      },
    });
    (api.sendChatMessageRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        thread: {
          id: 't1',
          shopId: 'la_roche_posay_official',
          shopName: 'La Roche-Posay Official',
          userId: 'u1',
          userName: 'Ngọc Hà',
          messages: [
            {
              id: 'm1',
              sender: 'shop',
              senderName: 'La Roche-Posay Official',
              text: 'Xin chào, shop có thể tư vấn giúp bạn không?',
              time: '09:30',
            },
            {
              id: 'm2',
              sender: 'user',
              text: 'Sản phẩm còn hạn sử dụng đến bao giờ ạ?',
              time: '09:31',
            },
          ],
        },
      },
    });

    await render(
      <ShopChatModal
        visible
        onClose={onClose}
        shopName="La Roche-Posay Official"
        orderCode="SS-1001"
      />,
    );

    expect(await screen.findByText('Xin chào, shop có thể tư vấn giúp bạn không?')).toBeTruthy();
    expect(screen.getByText('Trao đổi về đơn SS-1001')).toBeTruthy();
    expect(api.loadCustomerChatRemote).toHaveBeenCalledWith('la_roche_posay_official');

    await fireEvent.changeText(
      screen.getByPlaceholderText('Nhập tin nhắn gửi Gian hàng...'),
      'Sản phẩm còn hạn sử dụng đến bao giờ ạ?',
    );
    await fireEvent.press(screen.getByLabelText('Gửi tin nhắn'));

    await waitFor(() => {
      expect(api.sendChatMessageRemote).toHaveBeenCalledWith({
        shopId: 'la_roche_posay_official',
        shopName: 'La Roche-Posay Official',
        orderCode: 'SS-1001',
        sender: 'user',
        text: 'Sản phẩm còn hạn sử dụng đến bao giờ ạ?',
      });
    });

    expect(await screen.findByText('Sản phẩm còn hạn sử dụng đến bao giờ ạ?')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Đóng hộp thoại'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends quick prompt when empty thread shows quick suggestions', async () => {
    (api.loadCustomerChatRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        thread: {
          id: 't-empty',
          shopId: 'skinsense_mall',
          shopName: 'SkinSense Official',
          userId: 'u1',
          userName: 'Ngọc Hà',
          messages: [],
        },
      },
    });
    (api.sendChatMessageRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        thread: {
          id: 't-empty',
          shopId: 'skinsense_mall',
          shopName: 'SkinSense Official',
          userId: 'u1',
          userName: 'Ngọc Hà',
          messages: [
            {
              id: 'm1',
              sender: 'user',
              text: 'Kiểm tra giúp mình trạng thái đơn hàng nhé.',
              time: '10:00',
            },
          ],
        },
      },
    });

    await render(<ShopChatModal visible onClose={onClose} />);

    const quickBtn = await screen.findByText('Kiểm tra giúp mình trạng thái đơn hàng nhé.');
    await fireEvent.press(quickBtn);

    await waitFor(() => {
      expect(api.sendChatMessageRemote).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId: 'skinsense_mall',
          sender: 'user',
          text: 'Kiểm tra giúp mình trạng thái đơn hàng nhé.',
        }),
      );
    });
  });
});
