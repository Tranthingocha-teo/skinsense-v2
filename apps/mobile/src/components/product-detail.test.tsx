import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import '@/i18n';
import { ProductDetail } from './product-detail';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  Link: ({ children }: any) => children,
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('ProductDetail Component', () => {
  it('renders product details for valid productId', async () => {
    await render(
      <ProductDetail productId="skin1004-centella-ampoule" zone="forehead" />,
    );

    expect(screen.getByText('Skin1004')).toBeTruthy();
    expect(screen.getByText(/Madagascar Centella Ampoule/)).toBeTruthy();
    expect(screen.getAllByText('345.000₫').length).toBeGreaterThan(0);
    expect(screen.getByText(/Vì sao sản phẩm này phù hợp với da bạn\?/)).toBeTruthy();
    expect(screen.getByText('Mua hàng chính hãng')).toBeTruthy();
  });

  it('renders Mua hàng chính hãng action button linking to internal market', async () => {
    await render(
      <ProductDetail productId="lrp-effaclar-duo-m" zone="chin" />,
    );

    const buyBtn = screen.getByText('Mua hàng chính hãng');
    expect(buyBtn).toBeTruthy();
    fireEvent.press(buyBtn);
    expect(mockPush).toHaveBeenCalledWith('/market/lrp-effaclar-duo-m');
  });

  it('renders fallback when product is not found', async () => {
    await render(<ProductDetail productId="non-existent-id" />);
    expect(screen.getByText('Không tìm thấy sản phẩm')).toBeTruthy();
  });
});
