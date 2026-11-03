import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  calculateOrderFinancials,
  formatVnd,
  generateTrackingTimeline,
  INITIAL_LISTINGS,
  INITIAL_SHOPS,
  type Order,
  type OrderStatus,
  type OrderTrackingEvent,
  type PaymentMethod,
  type Product,
  PRODUCTS,
  type Shop,
  type ShopListing,
  type ShopStatus,
  type SkinConditionClass,
  type WithdrawalRequest,
  type Zone,
} from '@skinsense/domain';

const SHOPS_KEY = 'skinsense_marketplace_shops';
const LISTINGS_KEY = 'skinsense_marketplace_listings';
const ORDERS_KEY = 'skinsense_marketplace_orders';
const CURRENT_ROLE_KEY = 'skinsense_current_role';
const CUSTOM_PRODUCTS_KEY = 'skinsense_custom_products';
const WITHDRAWALS_KEY = 'skinsense_marketplace_withdrawals';

// -------------------------------------------------------------
// Cross-role Reactive Event Emitter
// -------------------------------------------------------------
type MarketplaceListener = () => void;
const listeners = new Set<MarketplaceListener>();

export function onMarketplaceChange(callback: MarketplaceListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function notifyMarketplaceChange(): void {
  for (const cb of Array.from(listeners)) {
    try {
      cb();
    } catch {}
  }
}

export const SKINSENSE_STORE_INFO = {
  id: 'shop-skinsense-official',
  shopName: 'SkinSense Boutique (Chính Hãng)',
  ownerName: 'Phòng Khám Da Liễu SkinSense',
  phone: '0901234567',
  address: 'Tòa nhà Keangnam Landmark 72, Mễ Trì, Nam Từ Liêm, Hà Nội',
  rating: 5.0,
  reviewCount: 4800,
};

function uid(): string {
  try {
    const id = Crypto.randomUUID();
    if (id) return id.slice(0, 8);
  } catch {}
  return Math.random().toString(36).slice(2, 10);
}

export type UserRole = 'customer' | 'shop' | 'admin';

export async function getCurrentRole(): Promise<UserRole> {
  const role = await AsyncStorage.getItem(CURRENT_ROLE_KEY);
  if (role === 'shop' || role === 'admin') return role;
  return 'customer';
}

export async function setCurrentRole(role: UserRole): Promise<void> {
  await AsyncStorage.setItem(CURRENT_ROLE_KEY, role);
}

// -------------------------------------------------------------
// Store Products (Standard + Custom Added by Admin)
// -------------------------------------------------------------
export interface StoreProduct extends Product {
  isCustom?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export async function loadCustomProducts(): Promise<StoreProduct[]> {
  const json = await AsyncStorage.getItem(CUSTOM_PRODUCTS_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json) as StoreProduct[];
  } catch {
    return [];
  }
}

export async function saveCustomProduct(input: {
  name: string;
  brand?: string;
  category?: string;
  priceVnd: number;
  imageUrl?: string;
  summary: string;
  description: string;
  howToUse?: string;
  caution?: string;
  targetZones?: Zone[];
  targetClasses?: SkinConditionClass[];
  keyActives?: string[];
}): Promise<StoreProduct> {
  const customProducts = await loadCustomProducts();
  const id = `custom-${Date.now()}-${uid().slice(0, 4)}`;
  const priceVnd = Math.max(0, input.priceVnd);

  const newProd: StoreProduct = {
    id,
    name: input.name.trim(),
    brand: input.brand?.trim() || 'SkinSense Clinic',
    category: input.category?.trim() || 'Chăm sóc da liễu',
    priceVnd,
    priceFormatted: formatVnd(priceVnd),
    rating: 5.0,
    reviewsCount: 1,
    imageUrl:
      input.imageUrl?.trim() ||
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    affiliateUrl: '',
    targetZones: input.targetZones ?? ['forehead', 'leftCheek', 'rightCheek', 'nose', 'chin'],
    targetClasses: input.targetClasses ?? ['barrier_repair', 'calming_redness'],
    keyActives: input.keyActives ?? ['Panthenol B5', 'Ceramide NP', 'Centella Asiatica'],
    summary: input.summary.trim(),
    description: input.description.trim(),
    howToUse: input.howToUse?.trim() || 'Thoa đều 1-2 lần mỗi ngày sau bước làm sạch mặt.',
    caution: input.caution?.trim(),
    isCustom: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  customProducts.unshift(newProd);
  await AsyncStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));
  return newProd;
}

export async function deleteCustomProduct(id: string): Promise<void> {
  const customProducts = await loadCustomProducts();
  const filtered = customProducts.filter((p) => p.id !== id);
  await AsyncStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(filtered));
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
  const customProducts = await loadCustomProducts();
  const index = customProducts.findIndex((p) => p.id === id);
  if (index >= 0) {
    customProducts[index].isActive = isActive;
    await AsyncStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));
  }
}

export async function loadAllStoreProducts(): Promise<StoreProduct[]> {
  const custom = await loadCustomProducts();
  const standard: StoreProduct[] = PRODUCTS.map((p) => ({
    ...p,
    isCustom: false,
    isActive: true,
  }));
  return [...custom, ...standard];
}

export async function getStoreProductById(id: string): Promise<StoreProduct | undefined> {
  const custom = await loadCustomProducts();
  const foundCustom = custom.find((p) => p.id === id);
  if (foundCustom) return foundCustom;
  const standard = PRODUCTS.find((p) => p.id === id);
  if (standard) {
    return { ...standard, isCustom: false, isActive: true };
  }
  return undefined;
}

// -------------------------------------------------------------
// Legacy Shops Management (Retained for Compatibility)
// -------------------------------------------------------------
export async function loadShops(): Promise<Shop[]> {
  const json = await AsyncStorage.getItem(SHOPS_KEY);
  if (!json) {
    await AsyncStorage.setItem(SHOPS_KEY, JSON.stringify(INITIAL_SHOPS));
    return INITIAL_SHOPS;
  }
  return JSON.parse(json) as Shop[];
}

export async function registerShop(input: {
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
}): Promise<Shop> {
  const shops = await loadShops();
  const newShop: Shop = {
    id: `shop-${uid()}`,
    shopName: input.shopName,
    ownerName: input.ownerName,
    phone: input.phone,
    address: input.address,
    status: 'pending',
    rating: 5.0,
    reviewCount: 0,
    isOfficial: false,
    avatarUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date().toISOString(),
  };

  shops.unshift(newShop);
  await AsyncStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
  return newShop;
}

export async function updateShopStatus(shopId: string, status: ShopStatus): Promise<void> {
  const shops = await loadShops();
  const updated = shops.map((s) => (s.id === shopId ? { ...s, status } : s));
  await AsyncStorage.setItem(SHOPS_KEY, JSON.stringify(updated));
}

export async function toggleShopOfficial(shopId: string): Promise<boolean> {
  const shops = await loadShops();
  let nextStatus = false;
  const updated = shops.map((s) => {
    if (s.id === shopId) {
      nextStatus = !s.isOfficial;
      return { ...s, isOfficial: nextStatus };
    }
    return s;
  });
  await AsyncStorage.setItem(SHOPS_KEY, JSON.stringify(updated));
  return nextStatus;
}

export interface ProductShopVendor {
  listingId: string;
  shop: Shop;
  priceVnd: number;
  priceFormatted: string;
  stock: number;
  deliveryTime: string;
  richDescription?: string;
  images?: string[];
}

export async function loadProductShopVendors(productId: string): Promise<ProductShopVendor[]> {
  const [allShops, allListings, product] = await Promise.all([
    loadShops(),
    loadListings(),
    getStoreProductById(productId),
  ]);

  const approvedShops = allShops.filter((s) => s.status === 'approved');
  const basePrice = product?.priceVnd ?? 350000;

  // Find explicit listings for this product
  const explicit = allListings.filter((l) => l.productId === productId && l.isActive);

  const vendors: ProductShopVendor[] = [];
  const handledShopIds = new Set<string>();

  for (const listing of explicit) {
    const shop = approvedShops.find((s) => s.id === listing.shopId);
    if (shop) {
      vendors.push({
        listingId: listing.id,
        shop,
        priceVnd: listing.priceVnd,
        priceFormatted: listing.priceFormatted || formatVnd(listing.priceVnd),
        stock: listing.stock,
        deliveryTime: listing.deliveryTime,
        richDescription: listing.richDescription,
        images: listing.images,
      });
      handledShopIds.add(shop.id);
    }
  }

  // Generate authentic multi-vendor offers for remaining approved shops
  for (const shop of approvedShops) {
    if (!handledShopIds.has(shop.id)) {
      let varianceFactor = 1.0;
      let delivery = 'Giao trong 1-2 ngày';
      if (shop.id === 'shop-duocmypham-hanoi') {
        varianceFactor = 0.96;
        delivery = 'Giao 2-3 ngày';
      } else if (shop.id === 'shop-kbeauty-vietnam') {
        varianceFactor = 0.94;
        delivery = 'Giao 2-4 ngày';
      } else if (shop.isOfficial) {
        varianceFactor = 1.0;
        delivery = 'Giao hỏa tốc 24h';
      } else {
        varianceFactor = 0.95;
        delivery = 'Giao 2-3 ngày';
      }

      const shopPrice = Math.round((basePrice * varianceFactor) / 1000) * 1000;
      vendors.push({
        listingId: `dyn-${shop.id}-${productId}`,
        shop,
        priceVnd: shopPrice,
        priceFormatted: formatVnd(shopPrice),
        stock: 50,
        deliveryTime: delivery,
      });
    }
  }

  return vendors;
}

// -------------------------------------------------------------
// Listings Management
// -------------------------------------------------------------
export async function loadListings(productId?: string): Promise<ShopListing[]> {
  const json = await AsyncStorage.getItem(LISTINGS_KEY);
  const listings: ShopListing[] = json ? JSON.parse(json) : INITIAL_LISTINGS;
  if (!json) {
    await AsyncStorage.setItem(LISTINGS_KEY, JSON.stringify(INITIAL_LISTINGS));
  }
  if (productId) {
    return listings.filter((l) => l.productId === productId && l.isActive);
  }
  return listings;
}

export async function saveListing(input: {
  shopId: string;
  productId: string;
  priceVnd: number;
  stock: number;
  deliveryTime?: string;
  richDescription?: string;
  images?: string[];
}): Promise<ShopListing> {
  const listings = await loadListings();
  const existingIndex = listings.findIndex(
    (l) => l.shopId === input.shopId && l.productId === input.productId,
  );

  const priceFormatted = formatVnd(input.priceVnd);
  if (existingIndex >= 0) {
    listings[existingIndex] = {
      ...listings[existingIndex],
      priceVnd: input.priceVnd,
      priceFormatted,
      stock: input.stock,
      deliveryTime: input.deliveryTime ?? listings[existingIndex].deliveryTime,
      richDescription: input.richDescription !== undefined ? input.richDescription : listings[existingIndex].richDescription,
      images: input.images !== undefined ? input.images : listings[existingIndex].images,
      isActive: true,
    };
    await AsyncStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
    return listings[existingIndex];
  }

  const newListing: ShopListing = {
    id: `list-${uid()}`,
    shopId: input.shopId,
    productId: input.productId,
    priceVnd: input.priceVnd,
    priceFormatted,
    stock: input.stock,
    deliveryTime: input.deliveryTime ?? 'Giao trong 2-3 ngày',
    richDescription: input.richDescription,
    images: input.images,
    isActive: true,
  };
  listings.unshift(newListing);
  await AsyncStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
  return newListing;
}

// -------------------------------------------------------------
// Orders Management (Shopee Multi-Vendor Operational Lifecycle)
// -------------------------------------------------------------

const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ORD-982104-SPX1',
    shopId: 'shop-duocmypham-hanoi',
    shopName: 'Dược Mỹ Phẩm Hà Nội',
    productId: 'lrp-effaclar-duo-m',
    productName: 'Effaclar Duo+M Giảm Mụn & Ngừa Thâm 40ml',
    productImage:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
    priceVnd: 375000,
    quantity: 1,
    totalVnd: 375000,
    totalFormatted: '375.000₫',
    customerName: 'Trần Thị Ngọc Hà',
    customerPhone: '0912345678',
    customerAddress: 'Tòa Landmark 72, Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội',
    note: 'Giao giờ hành chính giúp em',
    paymentMethod: 'cod',
    status: 'shipping',
    trackingCode: 'SPX-VN982104',
    shippingProvider: 'SPX Express',
    trackingTimeline: generateTrackingTimeline(
      'shipping',
      'SPX-VN982104',
      new Date(Date.now() - 3600000 * 5).toISOString(),
    ),
    shopEarningsVnd: 356250,
    platformFeeVnd: 18750,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ORD-639201-SPX2',
    shopId: 'shop-kbeauty-vietnam',
    shopName: 'K-Beauty Mall Vietnam',
    productId: 'skin1004-centella-ampoule',
    productName: 'Tinh Chất Rau Má Madagascar Centella Ampoule 100ml',
    productImage:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
    priceVnd: 330000,
    quantity: 1,
    totalVnd: 330000,
    totalFormatted: '330.000₫',
    customerName: 'Trần Thị Ngọc Hà',
    customerPhone: '0912345678',
    customerAddress: 'Tòa Landmark 72, Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội',
    note: '',
    paymentMethod: 'vietqr',
    status: 'processing',
    trackingCode: 'SPX-VN639201',
    shippingProvider: 'SPX Express',
    trackingTimeline: generateTrackingTimeline(
      'processing',
      'SPX-VN639201',
      new Date(Date.now() - 3600000 * 12).toISOString(),
    ),
    shopEarningsVnd: 313500,
    platformFeeVnd: 16500,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'ORD-119832-SPX3',
    shopId: 'shop-skinsense-official',
    shopName: 'SkinSense Official Store',
    productId: 'lrp-cicaplast-b5-plus',
    productName: 'Cicaplast Baume B5+ Phục Hồi & Làm Dịu Da 40ml',
    productImage:
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80',
    priceVnd: 365000,
    quantity: 1,
    totalVnd: 365000,
    totalFormatted: '365.000₫',
    customerName: 'Trần Thị Ngọc Hà',
    customerPhone: '0912345678',
    customerAddress: 'Tòa Landmark 72, Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội',
    paymentMethod: 'vietqr',
    status: 'completed',
    trackingCode: 'SPX-VN119832',
    shippingProvider: 'SPX Express',
    trackingTimeline: generateTrackingTimeline(
      'completed',
      'SPX-VN119832',
      new Date(Date.now() - 3600000 * 48).toISOString(),
    ),
    shopEarningsVnd: 346750,
    platformFeeVnd: 18250,
    rating: 5,
    reviewComment: 'Kem dùng rất thích, đóng gói cẩn thận 100% chính hãng!',
    reviewedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

export async function loadOrders(filter?: {
  shopId?: string;
  customerPhone?: string;
  status?: OrderStatus;
}): Promise<Order[]> {
  const json = await AsyncStorage.getItem(ORDERS_KEY);
  let orders: Order[] = json ? JSON.parse(json) : [];
  if (!json) {
    orders = INITIAL_DEMO_ORDERS;
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
  }

  if (filter?.shopId) {
    orders = orders.filter((o) => o.shopId === filter.shopId);
  }
  if (filter?.customerPhone) {
    orders = orders.filter((o) => o.customerPhone === filter.customerPhone);
  }
  if (filter?.status) {
    orders = orders.filter((o) => o.status === filter.status);
  }
  return orders;
}

export async function createOrder(input: {
  shopId?: string;
  shopName?: string;
  productId: string;
  productName: string;
  productImage: string;
  priceVnd: number;
  quantity?: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string;
  paymentMethod: PaymentMethod;
}): Promise<Order> {
  const qty = input.quantity ?? 1;
  const totalVnd = input.priceVnd * qty;
  const { shopEarningsVnd, platformFeeVnd } = calculateOrderFinancials(totalVnd);
  const trackingCode = `SPX-VN${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const order: Order = {
    id: `ORD-${Date.now().toString().slice(-6)}-${uid().slice(0, 4).toUpperCase()}`,
    shopId: input.shopId ?? SKINSENSE_STORE_INFO.id,
    shopName: input.shopName ?? SKINSENSE_STORE_INFO.shopName,
    productId: input.productId,
    productName: input.productName,
    productImage: input.productImage,
    priceVnd: input.priceVnd,
    quantity: qty,
    totalVnd,
    totalFormatted: formatVnd(totalVnd),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    note: input.note,
    paymentMethod: input.paymentMethod,
    status: 'pending',
    trackingCode,
    shippingProvider: 'SPX Express',
    trackingTimeline: generateTrackingTimeline('pending', trackingCode, now),
    shopEarningsVnd,
    platformFeeVnd,
    createdAt: now,
    updatedAt: now,
  };

  const orders = await loadOrders();
  orders.unshift(order);
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  notifyMarketplaceChange();
  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
  const orders = await loadOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index < 0) return null;

  const current = orders[index];
  const now = new Date().toISOString();
  const updated: Order = {
    ...current,
    status,
    updatedAt: now,
    trackingTimeline: generateTrackingTimeline(
      status,
      current.trackingCode || `SPX-VN${Math.floor(100000 + Math.random() * 900000)}`,
      current.createdAt,
    ),
  };

  orders[index] = updated;
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  notifyMarketplaceChange();
  return updated;
}

export async function confirmShopOrder(orderId: string): Promise<Order | null> {
  return updateOrderStatus(orderId, 'processing');
}

export async function shipShopOrder(orderId: string): Promise<Order | null> {
  return updateOrderStatus(orderId, 'shipping');
}

export async function completeOrder(
  orderId: string,
  rating?: number,
  reviewComment?: string,
): Promise<Order | null> {
  const orders = await loadOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index < 0) return null;

  const current = orders[index];
  const now = new Date().toISOString();
  const updated: Order = {
    ...current,
    status: 'completed',
    rating: rating ?? 5,
    reviewComment: reviewComment ?? 'Sản phẩm chính hãng chất lượng rất tốt!',
    reviewedAt: now,
    updatedAt: now,
    trackingTimeline: generateTrackingTimeline(
      'completed',
      current.trackingCode || `SPX-VN${Math.floor(100000 + Math.random() * 900000)}`,
      current.createdAt,
    ),
  };

  orders[index] = updated;
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  // Deposit earnings into shop wallet
  if (current.shopId && current.shopEarningsVnd) {
    await addShopWalletBalance(current.shopId, current.shopEarningsVnd);
  }

  notifyMarketplaceChange();
  return updated;
}

export async function cancelOrder(orderId: string, reason?: string): Promise<Order | null> {
  const orders = await loadOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index < 0) return null;

  const current = orders[index];
  const now = new Date().toISOString();
  const updated: Order = {
    ...current,
    status: 'cancelled',
    note: reason ? `${current.note ? current.note + ' | ' : ''}Lý do hủy: ${reason}` : current.note,
    updatedAt: now,
  };

  orders[index] = updated;
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  notifyMarketplaceChange();
  return updated;
}

// -------------------------------------------------------------
// Shop Wallet & Financial Balance Management
// -------------------------------------------------------------

export async function getShopWallet(shopId: string): Promise<{
  balanceVnd: number;
  balanceFormatted: string;
  pendingVnd: number;
  pendingFormatted: string;
  totalEarningsVnd: number;
  totalEarningsFormatted: string;
  completedOrdersCount: number;
}> {
  const [shops, orders] = await Promise.all([loadShops(), loadOrders({ shopId })]);
  const shop = shops.find((s) => s.id === shopId);
  const baseBalance = shop?.walletBalanceVnd ?? 1500000;

  const completed = orders.filter((o) => o.status === 'completed');
  const inProgress = orders.filter(
    (o) => o.status === 'pending' || o.status === 'processing' || o.status === 'shipping',
  );

  const pendingVnd = inProgress.reduce((sum, o) => sum + (o.shopEarningsVnd ?? Math.round(o.totalVnd * 0.95)), 0);
  const totalEarningsVnd = completed.reduce(
    (sum, o) => sum + (o.shopEarningsVnd ?? Math.round(o.totalVnd * 0.95)),
    baseBalance,
  );

  return {
    balanceVnd: baseBalance,
    balanceFormatted: formatVnd(baseBalance),
    pendingVnd,
    pendingFormatted: formatVnd(pendingVnd),
    totalEarningsVnd,
    totalEarningsFormatted: formatVnd(totalEarningsVnd),
    completedOrdersCount: completed.length,
  };
}

export async function addShopWalletBalance(shopId: string, amountVnd: number): Promise<void> {
  const shops = await loadShops();
  const updated = shops.map((s) => {
    if (s.id === shopId) {
      const currentBalance = s.walletBalanceVnd ?? 1500000;
      return { ...s, walletBalanceVnd: currentBalance + amountVnd };
    }
    return s;
  });
  await AsyncStorage.setItem(SHOPS_KEY, JSON.stringify(updated));
  notifyMarketplaceChange();
}

export async function deductShopWalletBalance(shopId: string, amountVnd: number): Promise<boolean> {
  const shops = await loadShops();
  let success = false;
  const updated = shops.map((s) => {
    if (s.id === shopId) {
      const currentBalance = s.walletBalanceVnd ?? 1500000;
      if (currentBalance >= amountVnd) {
        success = true;
        return { ...s, walletBalanceVnd: currentBalance - amountVnd };
      }
    }
    return s;
  });
  if (success) {
    await AsyncStorage.setItem(SHOPS_KEY, JSON.stringify(updated));
    notifyMarketplaceChange();
  }
  return success;
}

// -------------------------------------------------------------
// Withdrawal Requests (Ví Người Bán -> Ngân Hàng)
// -------------------------------------------------------------

const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'WD-001-MB',
    shopId: 'shop-duocmypham-hanoi',
    shopName: 'Dược Mỹ Phẩm Hà Nội',
    amountVnd: 500000,
    amountFormatted: '500.000₫',
    bankName: 'MB Bank',
    accountNumber: '0912345678',
    accountHolder: 'NGUYEN THU HA',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export async function loadWithdrawalRequests(shopId?: string): Promise<WithdrawalRequest[]> {
  const json = await AsyncStorage.getItem(WITHDRAWALS_KEY);
  let list: WithdrawalRequest[] = json ? JSON.parse(json) : [];
  if (!json) {
    list = INITIAL_WITHDRAWALS;
    await AsyncStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(INITIAL_WITHDRAWALS));
  }
  if (shopId) {
    return list.filter((w) => w.shopId === shopId);
  }
  return list;
}

export async function requestShopWithdrawal(input: {
  shopId: string;
  shopName: string;
  amountVnd: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}): Promise<WithdrawalRequest> {
  const deducted = await deductShopWalletBalance(input.shopId, input.amountVnd);
  if (!deducted) {
    throw new Error('Số dư ví người bán không đủ để thực hiện rút tiền.');
  }

  const newRequest: WithdrawalRequest = {
    id: `WD-${Date.now().toString().slice(-6)}-${uid().slice(0, 3).toUpperCase()}`,
    shopId: input.shopId,
    shopName: input.shopName,
    amountVnd: input.amountVnd,
    amountFormatted: formatVnd(input.amountVnd),
    bankName: input.bankName,
    accountNumber: input.accountNumber,
    accountHolder: input.accountHolder.toUpperCase(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const list = await loadWithdrawalRequests();
  list.unshift(newRequest);
  await AsyncStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(list));
  notifyMarketplaceChange();
  return newRequest;
}

export async function approveWithdrawal(requestId: string): Promise<void> {
  const list = await loadWithdrawalRequests();
  const updated = list.map((w) =>
    w.id === requestId ? { ...w, status: 'approved' as const, processedAt: new Date().toISOString() } : w,
  );
  await AsyncStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(updated));
  notifyMarketplaceChange();
}

export async function rejectWithdrawal(requestId: string, reason?: string): Promise<void> {
  const list = await loadWithdrawalRequests();
  let refundedShopId = '';
  let refundAmount = 0;

  const updated = list.map((w) => {
    if (w.id === requestId) {
      refundedShopId = w.shopId;
      refundAmount = w.amountVnd;
      return { ...w, status: 'rejected' as const, processedAt: new Date().toISOString() };
    }
    return w;
  });

  if (refundedShopId && refundAmount > 0) {
    await addShopWalletBalance(refundedShopId, refundAmount);
  }

  await AsyncStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(updated));
  notifyMarketplaceChange();
}

// -------------------------------------------------------------
// Admin Platform Financial Stats
// -------------------------------------------------------------

export async function getPlatformFinancialStats(): Promise<{
  totalGmvVnd: number;
  totalGmvFormatted: string;
  platformFeeVnd: number;
  platformFeeFormatted: string;
  totalOrdersCount: number;
  completedOrdersCount: number;
  activeShopsCount: number;
  pendingWithdrawalsCount: number;
}> {
  const [orders, shops, withdrawals] = await Promise.all([
    loadOrders(),
    loadShops(),
    loadWithdrawalRequests(),
  ]);

  const totalGmvVnd = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalVnd : 0), 0);
  const platformFeeVnd = orders.reduce(
    (sum, o) => sum + (o.status === 'completed' ? o.platformFeeVnd ?? Math.round(o.totalVnd * 0.05) : 0),
    0,
  );

  const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;
  const activeShopsCount = shops.filter((s) => s.status === 'approved').length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;

  return {
    totalGmvVnd,
    totalGmvFormatted: formatVnd(totalGmvVnd),
    platformFeeVnd,
    platformFeeFormatted: formatVnd(platformFeeVnd),
    totalOrdersCount: orders.length,
    completedOrdersCount,
    activeShopsCount,
    pendingWithdrawalsCount,
  };
}
