import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  formatVnd,
  INITIAL_LISTINGS,
  INITIAL_SHOPS,
  type Order,
  type OrderStatus,
  type PaymentMethod,
  type Product,
  PRODUCTS,
  type Shop,
  type ShopListing,
  type ShopStatus,
  type SkinConditionClass,
  type Zone,
} from '@skinsense/domain';

const SHOPS_KEY = 'skinsense_marketplace_shops';
const LISTINGS_KEY = 'skinsense_marketplace_listings';
const ORDERS_KEY = 'skinsense_marketplace_orders';
const CURRENT_ROLE_KEY = 'skinsense_current_role';
const CUSTOM_PRODUCTS_KEY = 'skinsense_custom_products';

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
    isActive: true,
  };
  listings.unshift(newListing);
  await AsyncStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
  return newListing;
}

// -------------------------------------------------------------
// Orders Management (Direct SkinSense Boutique Orders)
// -------------------------------------------------------------
export async function loadOrders(filter?: {
  shopId?: string;
  customerPhone?: string;
}): Promise<Order[]> {
  const json = await AsyncStorage.getItem(ORDERS_KEY);
  const orders: Order[] = json ? JSON.parse(json) : [];
  if (filter?.shopId) {
    return orders.filter((o) => o.shopId === filter.shopId);
  }
  if (filter?.customerPhone) {
    return orders.filter((o) => o.customerPhone === filter.customerPhone);
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
    createdAt: new Date().toISOString(),
  };

  const orders = await loadOrders();
  orders.unshift(order);
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const orders = await loadOrders();
  const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
}
