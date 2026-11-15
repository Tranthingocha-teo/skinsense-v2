import { render, screen } from '@testing-library/react-native';

import { InitialsAvatar, ProductImage, QrImage } from './artwork';

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('artwork', () => {
  it('draws the product instead of showing a stock photo', async () => {
    await render(
      <ProductImage uri="https://images.unsplash.com/photo-1?w=600" name="Cicaplast Baume B5+" brand="La Roche-Posay" category="Kem dưỡng" />,
    );
    expect(screen.getByLabelText('Cicaplast Baume B5+')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain('unsplash');
  });

  it("keeps a shop's own upload", async () => {
    const uri = 'https://res.cloudinary.com/demo/image/upload/v1/p.jpg';
    await render(<ProductImage uri={uri} name="Serum" />);
    expect(JSON.stringify(screen.toJSON())).toContain(uri);
  });

  it('shows initials for a shop without its own avatar', async () => {
    await render(<InitialsAvatar name="Dược Mỹ Phẩm Hà Nội" seed="shop-1" />);
    expect(screen.getByText('DN')).toBeTruthy();
  });

  it('draws a QR code on the device', async () => {
    await render(<QrImage value="000201010212" label="Mã VietQR" />);
    expect(screen.getByLabelText('Mã VietQR')).toBeTruthy();
  });
});
