import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createOrder,
  deleteCustomProduct,
  getCurrentRole,
  loadAllStoreProducts,
  loadCustomProducts,
  loadListings,
  loadOrders,
  loadShops,
  registerShop,
  saveCustomProduct,
  saveListing,
  setCurrentRole,
  updateOrderStatus,
  updateShopStatus,
} from './marketplace';

describe('Marketplace Storage & Management Service', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('manages current user role', async () => {
    expect(await getCurrentRole()).toBe('customer');
    await setCurrentRole('shop');
    expect(await getCurrentRole()).toBe('shop');
    await setCurrentRole('admin');
    expect(await getCurrentRole()).toBe('admin');
  });

  it('loads initial shops when empty', async () => {
    const shops = await loadShops();
    expect(shops.length).toBeGreaterThanOrEqual(3);
    expect(shops[0].status).toBe('approved');
  });

  it('registers a new shop with pending status', async () => {
    const shop = await registerShop({
      shopName: 'Beauty Boutique',
      ownerName: 'Le Thu Trang',
      phone: '0933333333',
      address: 'Cau Giay, Ha Noi',
    });

    expect(shop.status).toBe('pending');
    expect(shop.shopName).toBe('Beauty Boutique');

    const all = await loadShops();
    expect(all.some((s) => s.id === shop.id)).toBe(true);
  });

  it('admin approves a shop', async () => {
    const shop = await registerShop({
      shopName: 'Test Shop',
      ownerName: 'Nguyen Van A',
      phone: '0911111111',
      address: 'Dong Da, Ha Noi',
    });

    await updateShopStatus(shop.id, 'approved');
    const all = await loadShops();
    const updated = all.find((s) => s.id === shop.id);
    expect(updated?.status).toBe('approved');
  });

  it('creates and tracks customer orders', async () => {
    const order = await createOrder({
      shopId: 'shop-skinsense-official',
      shopName: 'SkinSense Official Store',
      productId: 'lrp-effaclar-duo-m',
      productName: 'Effaclar Duo+M',
      productImage: 'https://example.com/p.jpg',
      priceVnd: 385000,
      quantity: 1,
      customerName: 'Tran Thi Ngoc Ha',
      customerPhone: '0988888888',
      customerAddress: 'Quan 1, TP. HCM',
      paymentMethod: 'vietqr',
    });

    expect(order.id).toMatch(/^ORD-/);
    expect(order.status).toBe('pending');
    expect(order.totalVnd).toBe(385000);

    const orders = await loadOrders();
    expect(orders.length).toBe(1);
    expect(orders[0].customerName).toBe('Tran Thi Ngoc Ha');

    // Update status
    await updateOrderStatus(order.id, 'confirmed');
    const updatedOrders = await loadOrders();
    expect(updatedOrders[0].status).toBe('confirmed');
  });

  it('manages shop product listings and stock', async () => {
    const listing = await saveListing({
      shopId: 'shop-test-1',
      productId: 'skin1004-centella-ampoule',
      priceVnd: 340000,
      stock: 50,
    });

    expect(listing.priceVnd).toBe(340000);
    expect(listing.stock).toBe(50);

    const listings = await loadListings('skin1004-centella-ampoule');
    expect(listings.some((l) => l.shopId === 'shop-test-1')).toBe(true);
  });

  it('allows admin to add, list and delete custom products for selling', async () => {
    const custom = await saveCustomProduct({
      name: 'Serum B5 SkinSense Tái Tạo',
      brand: 'SkinSense Clinic',
      category: 'Serum phục hồi',
      priceVnd: 420000,
      summary: 'Phục hồi cấp ẩm chuyên sâu',
      description: 'Công thức độc quyền từ phòng khám SkinSense',
    });

    expect(custom.id).toMatch(/^custom-/);
    expect(custom.name).toBe('Serum B5 SkinSense Tái Tạo');
    expect(custom.priceVnd).toBe(420000);
    expect(custom.isCustom).toBe(true);

    const storeProducts = await loadAllStoreProducts();
    expect(storeProducts.some((p) => p.id === custom.id)).toBe(true);

    await deleteCustomProduct(custom.id);
    const updatedStore = await loadAllStoreProducts();
    expect(updatedStore.some((p) => p.id === custom.id)).toBe(false);
  });

  it('creates order with default SkinSense boutique info when shopId is omitted', async () => {
    const order = await createOrder({
      productId: 'skin1004-centella-ampoule',
      productName: 'Rau má Centella',
      productImage: 'https://example.com/centella.jpg',
      priceVnd: 345000,
      customerName: 'Hoang My',
      customerPhone: '0977112233',
      customerAddress: 'Ba Dinh, Ha Noi',
      paymentMethod: 'cod',
    });

    expect(order.shopName).toContain('SkinSense');
    expect(order.totalVnd).toBe(345000);
    expect(order.status).toBe('pending');
  });
});
