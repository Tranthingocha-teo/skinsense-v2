import { render, screen } from '@testing-library/react-native';

import '@/i18n';
import * as api from '@/lib/api';
import { ProductCard, RecommendedProductsSection } from './recommended-products';

jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
  router: { push: jest.fn() },
}));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('@/lib/api', () => ({ fetchApprovedMarketplaceProducts: jest.fn() }));

const real = {
  id: 'prod_real_1',
  name: 'Kem phục hồi thật',
  brand: 'La Roche-Posay',
  shopName: 'Shop Thật',
  category: 'Kem dưỡng',
  price: 365000,
  status: 'approved',
};

describe('RecommendedProducts (real data)', () => {
  it('renders ProductCard from a real marketplace product', async () => {
    await render(<ProductCard product={real} />);
    expect(screen.getByText('La Roche-Posay')).toBeTruthy();
    expect(screen.getByText('Kem phục hồi thật')).toBeTruthy();
  });

  it('lists only approved products loaded from the API', async () => {
    (api.fetchApprovedMarketplaceProducts as jest.Mock).mockResolvedValue([real]);
    await render(<RecommendedProductsSection />);
    expect(await screen.findByText('Kem phục hồi thật')).toBeTruthy();
  });

  it('renders nothing when there are no real products', async () => {
    (api.fetchApprovedMarketplaceProducts as jest.Mock).mockResolvedValue([]);
    await render(<RecommendedProductsSection />);
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
