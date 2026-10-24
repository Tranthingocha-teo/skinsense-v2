import { fireEvent, render, screen } from '@testing-library/react-native';

import '@/i18n';
import { ProductCard, RecommendedProductsSection } from './recommended-products';
import { getProducts } from '@skinsense/domain';

jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('RecommendedProducts Component', () => {
  it('renders ProductCard with product info', async () => {
    const product = getProducts()[0];
    await render(<ProductCard product={product} />);

    expect(screen.getByText(product.brand)).toBeTruthy();
    expect(screen.getByText(product.name)).toBeTruthy();
    expect(screen.getByText(product.priceFormatted)).toBeTruthy();
  });

  it('renders RecommendedProductsSection with zone filter tabs', async () => {
    await render(<RecommendedProductsSection />);

    expect(screen.getByRole('heading', { name: 'Gợi ý sản phẩm cho làn da của bạn' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Tất cả' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Trán' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Mũi' })).toBeTruthy();
  });

  it('switches zone filter when tab is pressed', async () => {
    await render(<RecommendedProductsSection />);

    const noseTab = screen.getByRole('tab', { name: 'Mũi' });
    await fireEvent.press(noseTab);
    expect(noseTab).toBeSelected();
  });
});
