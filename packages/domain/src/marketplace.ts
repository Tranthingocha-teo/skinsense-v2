import type { Product } from "./products";
import { PRODUCTS } from "./products";

export type ShopStatus = "pending" | "approved" | "rejected";

export interface Shop {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  status: ShopStatus;
  rating: number;
  reviewCount: number;
  isOfficial: boolean;
  avatarUrl: string;
  createdAt: string;
}

export interface ShopListing {
  id: string;
  shopId: string;
  productId: string;
  priceVnd: number;
  priceFormatted: string;
  stock: number;
  deliveryTime: string;
  isActive: boolean;
}

export type PaymentMethod = "cod" | "vietqr";
export type OrderStatus = "pending" | "confirmed" | "shipping" | "completed" | "cancelled";

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  productId: string;
  productName: string;
  productImage: string;
  priceVnd: number;
  quantity: number;
  totalVnd: number;
  totalFormatted: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
}

export const INITIAL_SHOPS: Shop[] = [
  {
    id: "shop-skinsense-official",
    shopName: "SkinSense Official Store",
    ownerName: "Ban Quản Trị SkinSense",
    phone: "0901234567",
    address: "Tòa nhà Keangnam Landmark 72, Mễ Trì, Nam Từ Liêm, Hà Nội",
    status: "approved",
    rating: 5.0,
    reviewCount: 4200,
    isOfficial: true,
    avatarUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "shop-duocmypham-hanoi",
    shopName: "Dược Mỹ Phẩm Hà Nội",
    ownerName: "BS. Nguyễn Thu Hà",
    phone: "0912345678",
    address: "158 Nguyễn Thái Học, Ba Đình, Hà Nội",
    status: "approved",
    rating: 4.9,
    reviewCount: 1850,
    isOfficial: true,
    avatarUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80",
    createdAt: "2026-02-15T00:00:00.000Z",
  },
  {
    id: "shop-kbeauty-vietnam",
    shopName: "K-Beauty Mall Vietnam",
    ownerName: "Trần Minh Quân",
    phone: "0987654321",
    address: "248 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh",
    status: "approved",
    rating: 4.8,
    reviewCount: 3100,
    isOfficial: false,
    avatarUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80",
    createdAt: "2026-03-10T00:00:00.000Z",
  },
];

export const INITIAL_LISTINGS: ShopListing[] = [
  // Effaclar Duo+M
  {
    id: "list-1",
    shopId: "shop-skinsense-official",
    productId: "lrp-effaclar-duo-m",
    priceVnd: 385000,
    priceFormatted: "385.000₫",
    stock: 120,
    deliveryTime: "Giao trong 1-2 ngày",
    isActive: true,
  },
  {
    id: "list-2",
    shopId: "shop-duocmypham-hanoi",
    productId: "lrp-effaclar-duo-m",
    priceVnd: 375000,
    priceFormatted: "375.000₫",
    stock: 45,
    deliveryTime: "Giao trong 2-3 ngày",
    isActive: true,
  },
  // Centella Ampoule
  {
    id: "list-3",
    shopId: "shop-skinsense-official",
    productId: "skin1004-centella-ampoule",
    priceVnd: 345000,
    priceFormatted: "345.000₫",
    stock: 90,
    deliveryTime: "Giao trong 1-2 ngày",
    isActive: true,
  },
  {
    id: "list-4",
    shopId: "shop-kbeauty-vietnam",
    productId: "skin1004-centella-ampoule",
    priceVnd: 330000,
    priceFormatted: "330.000₫",
    stock: 60,
    deliveryTime: "Giao trong 2-4 ngày",
    isActive: true,
  },
  // Cicaplast B5+
  {
    id: "list-5",
    shopId: "shop-duocmypham-hanoi",
    productId: "lrp-cicaplast-b5-plus",
    priceVnd: 355000,
    priceFormatted: "355.000₫",
    stock: 80,
    deliveryTime: "Giao trong 2-3 ngày",
    isActive: true,
  },
  {
    id: "list-6",
    shopId: "shop-skinsense-official",
    productId: "lrp-cicaplast-b5-plus",
    priceVnd: 365000,
    priceFormatted: "365.000₫",
    stock: 150,
    deliveryTime: "Giao trong 1-2 ngày",
    isActive: true,
  },
  // Paula's Choice BHA 2%
  {
    id: "list-7",
    shopId: "shop-skinsense-official",
    productId: "paulas-choice-bha-2",
    priceVnd: 890000,
    priceFormatted: "890.000₫",
    stock: 35,
    deliveryTime: "Giao trong 1-2 ngày",
    isActive: true,
  },
];

export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + "₫";
}

export function generateVietQrUrl(params: {
  bankId?: string;
  accountNo?: string;
  amount: number;
  memo: string;
}): string {
  const bank = params.bankId ?? "MB";
  const acc = params.accountNo ?? "999988886666";
  const template = "compact2";
  return `https://img.vietqr.io/image/${bank}-${acc}-${template}.png?amount=${params.amount}&addInfo=${encodeURIComponent(
    params.memo
  )}&accountName=SKINSENSE%20VIETNAM`;
}
