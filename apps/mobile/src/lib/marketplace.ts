import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  formatVnd,
  INITIAL_LISTINGS,
  INITIAL_SHOPS,
  type Order,
  type OrderStatus,
  type PaymentMethod,
  type Shop,
  type ShopListing,
  type ShopStatus,
} from '@skinsense/domain';

const SHOPS_KEY = 'skinsense_marketplace_shops';
const LISTINGS_KEY = 'skinsense_marketplace_listings';
const ORDERS_KEY = 'skinsense_marketplace_orders';
const CURRENT_ROLE_KEY = 'skinsense_current_role';

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
// Shops Management
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
// Orders Management
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
  shopId: string;
  shopName: string;
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
    shopId: input.shopId,
    shopName: input.shopName,
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
