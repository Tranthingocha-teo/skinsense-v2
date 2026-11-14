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
  walletBalanceVnd?: number;
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
  richDescription?: string;
  images?: string[];
}

export type PaymentMethod = "cod" | "vietqr";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export interface OrderTrackingEvent {
  time: string;
  title: string;
  desc: string;
  completed: boolean;
}

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
  trackingCode?: string;
  shippingProvider?: string;
  trackingTimeline?: OrderTrackingEvent[];
  shopEarningsVnd?: number;
  platformFeeVnd?: number;
  rating?: number;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  shopId: string;
  shopName: string;
  amountVnd: number;
  amountFormatted: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  processedAt?: string;
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
  {
    id: "shop-laroche-official",
    shopName: "La Roche-Posay Official Store",
    ownerName: "Đại lý Dược Mỹ Phẩm La Roche-Posay",
    phone: "0900000003",
    address: "Tầng 1 Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    status: "approved",
    rating: 4.9,
    reviewCount: 2600,
    isOfficial: true,
    avatarUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80",
    createdAt: "2026-03-20T00:00:00.000Z",
  },
  {
    id: "shop-dalieu-saigon",
    shopName: "Nhà Thuốc Da Liễu Sài Gòn",
    ownerName: "Dược sĩ Phan Hoàng Yến",
    phone: "0933112233",
    address: "45 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    status: "approved",
    rating: 5.0,
    reviewCount: 350,
    isOfficial: false,
    avatarUrl: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=200&q=80",
    createdAt: "2026-10-25T08:00:00.000Z",
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
  // La Roche-Posay Official Listings
  {
    id: "list-8",
    shopId: "shop-laroche-official",
    productId: "lrp-effaclar-duo-m",
    priceVnd: 395000,
    priceFormatted: "395.000₫",
    stock: 200,
    deliveryTime: "Giao hỏa tốc 24h",
    isActive: true,
  },
  {
    id: "list-9",
    shopId: "shop-laroche-official",
    productId: "lrp-cicaplast-b5-plus",
    priceVnd: 370000,
    priceFormatted: "370.000₫",
    stock: 140,
    deliveryTime: "Giao hỏa tốc 24h",
    isActive: true,
  },
  {
    id: "list-10",
    shopId: "shop-laroche-official",
    productId: "skin1004-centella-ampoule",
    priceVnd: 350000,
    priceFormatted: "350.000₫",
    stock: 85,
    deliveryTime: "Giao hỏa tốc 24h",
    isActive: true,
  },
];

export function getShopById(id: string): Shop | undefined {
  return INITIAL_SHOPS.find((s) => s.id === id);
}

export function getListingsForProduct(productId: string): ShopListing[] {
  return INITIAL_LISTINGS.filter((l) => l.productId === productId && l.isActive);
}

export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + "₫";
}

export function calculateOrderFinancials(
  totalVnd: number,
  platformCommissionRate = 0.05
): { shopEarningsVnd: number; platformFeeVnd: number } {
  const platformFeeVnd = Math.round(totalVnd * platformCommissionRate);
  const shopEarningsVnd = totalVnd - platformFeeVnd;
  return { shopEarningsVnd, platformFeeVnd };
}

export function generateTrackingTimeline(
  status: OrderStatus,
  trackingCode: string,
  createdAt: string
): OrderTrackingEvent[] {
  const baseTime = new Date(createdAt);
  const formatTime = (offsetMinutes: number) => {
    const d = new Date(baseTime.getTime() + offsetMinutes * 60000);
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")} ${d.getDate()}/${d.getMonth() + 1}`;
  };

  const isShipped = status === "shipping" || status === "delivered" || status === "completed";
  const isDelivered = status === "delivered" || status === "completed";
  const isCompleted = status === "completed";

  return [
    {
      time: formatTime(0),
      title: "Đơn hàng đã được đặt",
      desc: "Người mua đã hoàn tất thông tin và gửi yêu cầu đặt hàng đến người bán.",
      completed: true,
    },
    {
      time: formatTime(30),
      title: "Người bán chuẩn bị hàng",
      desc: "Gian hàng đã xác nhận đơn hàng, đóng gói niêm phong chống sốc.",
      completed: status !== "pending",
    },
    {
      time: formatTime(90),
      title: `Đã bàn giao cho ĐVVC SPX Express (${trackingCode})`,
      desc: "Bưu tá SPX Express đã nhận kiện hàng tại kho xuất hàng và quét mã vận đơn.",
      completed: isShipped,
    },
    {
      time: formatTime(360),
      title: "Đang trung chuyển qua Hub phân loại",
      desc: "Kiện hàng đã xuất kho trung chuyển và đang trên đường đến bưu cục gần bạn nhất.",
      completed: isShipped,
    },
    {
      time: formatTime(720),
      title: "Đang phát hàng đến bạn",
      desc: "Shipper SPX Express đang liên hệ để giao hàng tận tay khách hàng.",
      completed: isDelivered,
    },
    {
      time: formatTime(780),
      title: "Giao hàng thành công & Hoàn tất",
      desc: "Đơn hàng đã được giao thành công. Tiền đã được giải ngân về Ví Người Bán.",
      completed: isCompleted,
    },
  ];
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

// -------------------------------------------------------------
// Validation & State Machine Domain Rules (Modules 1 - 6)
// -------------------------------------------------------------

export interface SellerRegistrationInput {
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  description?: string;
  avatarUrl?: string;
}

export function validateSellerRegistration(input: SellerRegistrationInput): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.shopName || input.shopName.trim().length < 2) {
    errors.shopName = "Tên gian hàng phải có ít nhất 2 ký tự.";
  } else if (input.shopName.trim().length > 100) {
    errors.shopName = "Tên gian hàng không vượt quá 100 ký tự.";
  }

  if (!input.ownerName || input.ownerName.trim().length < 2) {
    errors.ownerName = "Tên người đại diện không được để trống.";
  }

  const phoneClean = input.phone ? input.phone.trim() : "";
  if (!phoneClean || !/^(0|\+84)[0-9]{9,10}$/.test(phoneClean)) {
    errors.phone = "Số điện thoại liên hệ không hợp lệ (ví dụ: 0912345678).";
  }

  const emailClean = input.email ? input.email.trim() : "";
  if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
    errors.email = "Địa chỉ email không hợp lệ.";
  }

  if (!input.address || input.address.trim().length < 5) {
    errors.address = "Địa chỉ kinh doanh phải đầy đủ (tối thiểu 5 ký tự).";
  }

  if (!input.category || !input.category.trim()) {
    errors.category = "Vui lòng chọn ngành hàng kinh doanh.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export interface ShopProfileUpdateInput {
  shopName: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  operatingStatus?: "open" | "temporarily_closed";
}

export function validateShopProfileUpdate(input: ShopProfileUpdateInput): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.shopName || input.shopName.trim().length < 2) {
    errors.shopName = "Tên gian hàng phải có ít nhất 2 ký tự.";
  }
  if (!input.phone || !/^(0|\+84)[0-9]{9,10}$/.test(input.phone.trim())) {
    errors.phone = "Số điện thoại không hợp lệ.";
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = "Email không hợp lệ.";
  }
  if (!input.address || input.address.trim().length < 5) {
    errors.address = "Địa chỉ kinh doanh không đủ chi tiết.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export interface ProductInput {
  name: string;
  brand: string;
  category: string;
  priceVnd: number;
  originalPriceVnd?: number;
  stock: number;
  summary?: string;
  description?: string;
  ingredients?: string;
  skinTypeCompatibility?: string[];
  howToUse?: string;
  caution?: string;
  origin?: string;
  images?: string[];
}

export function validateProductInput(input: ProductInput): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length < 3) {
    errors.name = "Tên sản phẩm phải từ 3 ký tự trở lên.";
  }
  if (!input.brand || !input.brand.trim()) {
    errors.brand = "Vui lòng nhập tên thương hiệu sản phẩm.";
  }
  if (!input.category || !input.category.trim()) {
    errors.category = "Vui lòng chọn danh mục sản phẩm.";
  }
  if (typeof input.priceVnd !== "number" || input.priceVnd < 0) {
    errors.priceVnd = "Giá bán phải là số nguyên lớn hơn hoặc bằng 0.";
  }
  if (input.originalPriceVnd !== undefined && input.originalPriceVnd < input.priceVnd) {
    errors.originalPriceVnd = "Giá gốc không được nhỏ hơn giá niêm yết.";
  }
  if (typeof input.stock !== "number" || input.stock < 0) {
    errors.stock = "Số lượng tồn kho không được âm.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateOrderStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): { allowed: boolean; reason?: string } {
  if (currentStatus === nextStatus) return { allowed: true };

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ["processing", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipping", "cancelled"],
    shipping: ["delivered", "completed", "refunded"],
    delivered: ["completed", "refunded"],
    completed: ["refunded"],
    cancelled: [],
    refunded: [],
  };

  const allowed = validTransitions[currentStatus]?.includes(nextStatus) ?? false;
  if (!allowed) {
    return {
      allowed: false,
      reason: `Không thể chuyển trạng thái đơn hàng từ '${currentStatus}' sang '${nextStatus}'.`,
    };
  }
  return { allowed: true };
}

export type DateRangePreset = "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "custom";

export function filterOrdersByDateRange(orders: Order[], range: DateRangePreset, customStart?: Date, customEnd?: Date): Order[] {
  const now = new Date();

  return orders.filter((order) => {
    const created = new Date(order.createdAt);
    if (isNaN(created.getTime())) return false;

    if (range === "today") {
      return (
        created.getDate() === now.getDate() &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }

    if (range === "yesterday") {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      return (
        created.getDate() === yest.getDate() &&
        created.getMonth() === yest.getMonth() &&
        created.getFullYear() === yest.getFullYear()
      );
    }

    if (range === "last7days") {
      const cutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      return created >= cutoff && created <= now;
    }

    if (range === "last30days") {
      const cutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      return created >= cutoff && created <= now;
    }

    if (range === "thisMonth") {
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }

    if (range === "custom" && customStart && customEnd) {
      return created >= customStart && created <= customEnd;
    }

    return true;
  });
}

