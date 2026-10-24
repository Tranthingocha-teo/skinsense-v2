import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import '@/i18n';
import { ProductDetail } from './product-detail';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
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

  it('triggers Linking.openURL when clicking Mua hàng chính hãng', async () => {
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);

    await render(
      <ProductDetail productId="lrp-effaclar-duo-m" zone="chin" />,
    );

    const buyBtn = screen.getByText('Mua hàng chính hãng');
    await fireEvent.press(buyBtn);

    expect(canOpenSpy).toHaveBeenCalled();
  });

  it('renders fallback when product is not found', async () => {
    await render(<ProductDetail productId="non-existent-id" />);
    expect(screen.getByText('Không tìm thấy sản phẩm')).toBeTruthy();
  });
});
