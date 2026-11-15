"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  ShoppingBag,
  Plus,
  Trash2,
  Star,
  Truck,
  Tag,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  X,
  Home,
  Percent,
  BadgeCheck,
  FileText,
  Grid3X3,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";
import { AuthModal } from "@/components/auth-modal";
import { CloudinaryProductUploader } from "@/components/cloudinary-product-uploader";
import {
  type ShopUserSession,
  canShopSignIn,
  isProductVisibleToBuyer,
  getProductApprovalBadge,
  matchesShop,
  filterProductsByShop,
} from "@/lib/shop-product-approval";

function ProductImagePlaceholder({
  label = "Chưa có ảnh",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-1.5 bg-surface-2 text-muted-foreground">
      <Package className={compact ? "size-5 opacity-50" : "size-8 opacity-40"} />
      {label ? (
        <span className={compact ? "text-[10px] font-medium" : "text-[11px] font-medium"}>
          {label}
        </span>
      ) : null}
    </div>
  );
}

// Shopee Product Variant
export interface ProductVariant {
  id: string;
  name: string; // e.g. "Tuýp 40ml", "Chai 100ml", "Chai 200ml"
  priceVnd: number;
  originalPriceVnd: number;
  stock: number;
  sku: string;
}

// Shopee Shop Voucher
export interface ShopVoucher {
  id: string;
  code: string;
  discountLabel: string;
  minSpendLabel: string;
}

// Full Shopee Product Definition with ALL Shopee fields
export type ShopeeProductStatus = "active" | "pending" | "approved" | "rejected" | "hidden" | "out_of_stock";

export interface ShopeeProduct {
  id: string;
  shopName: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  origin: string;
  isMall: boolean; // Shopee Mall badge
  isPreferredPlus: boolean; // Yêu thích+
  images: string[];
  coverImage: string;
  priceVnd: number;
  originalPriceVnd: number;
  discountPercent: number;
  stock: number;
  soldCount: number;
  rating: number;
  reviewCount: number;
  shippingInfo: {
    freeShipExtra: boolean;
    shippingFrom: string;
    estimatedDelivery: string;
    shippingFeeVnd: number;
  };
  variants: ProductVariant[];
  vouchers: ShopVoucher[];
  specifications: {
    skinType: string;
    volume: string;
    expiryMonths: number;
    actives: string;
    healthMinistryLicense: string;
    packagingWeightGram: number;
  };
  description: string;
  howToUse: string;
  status: "active" | "pending" | "approved" | "rejected" | "hidden" | "out_of_stock";
  createdAt: string;
}

const PRODUCT_FORM_FIELD_CLASS =
  "min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

// 9 Verified authentic cosmetic products with consistent single-product gallery images
export const INITIAL_SHOPEE_PRODUCTS: ShopeeProduct[] = [
  {
    id: "sp_01",
    shopName: "La Roche-Posay Official Store",
    sku: "LRP-DUO-PLUS-M-40ML",
    name: "Kem Dưỡng Giảm Mụn & Ngừa Thâm La Roche-Posay Effaclar Duo+M 40ml (Shopee Mall)",
    category: "Chăm sóc da mặt > Kem dưỡng & Trị mụn",
    brand: "La Roche-Posay",
    origin: "Pháp (L'Oréal Vietnam phân phối)",
    isMall: true,
    isPreferredPlus: true,
    coverImage: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&crop=top&q=80",
    ],
    priceVnd: 395000,
    originalPriceVnd: 495000,
    discountPercent: 20,
    stock: 350,
    soldCount: 14200,
    rating: 4.9,
    reviewCount: 3840,
    shippingInfo: {
      freeShipExtra: true,
      shippingFrom: "Quận 1, TP. Hồ Chí Minh",
      estimatedDelivery: "Giao từ 1 - 2 ngày (Có Hỏa Tốc)",
      shippingFeeVnd: 0,
    },
    variants: [
      { id: "var_01", name: "Tuýp 40ml", priceVnd: 395000, originalPriceVnd: 495000, stock: 250, sku: "LRP-DUO-40ML" },
      { id: "var_02", name: "Combo 40ml + Quà", priceVnd: 459000, originalPriceVnd: 590000, stock: 100, sku: "LRP-DUO-COMBO" },
    ],
    vouchers: [
      { id: "vc_01", code: "LRP15K", discountLabel: "Giảm 15.000₫", minSpendLabel: "Đơn từ 300.000₫" },
      { id: "vc_02", code: "LRP50K", discountLabel: "Giảm 50.000₫", minSpendLabel: "Đơn từ 800.000₫" },
    ],
    specifications: {
      skinType: "Da dầu mụn, da dễ bùng viêm",
      volume: "40ml",
      expiryMonths: 36,
      actives: "Phylobioma, Niacinamide, Procerad, LHA, Salicylic Acid, Zinc PCA",
      healthMinistryLicense: "18294/23/CBMP-QLD",
      packagingWeightGram: 80,
    },
    description: "Phiên bản Duo+M cải tiến mới nhất bổ sung hoạt chất Phylobioma giúp cân bằng hệ vi sinh da, giảm mụn viêm và ngừa thâm mụn chỉ sau 8 giờ.",
    howToUse: "Thoa một lớp mỏng đều khắp mặt sau bước làm sạch sáng và tối.",
    status: "active",
    createdAt: "2026-10-15",
  },
  {
    id: "sp_02",
    shopName: "CeraVe Skincare Official",
    sku: "CERAVE-HYDRATING-473ML",
    name: "Sữa Rửa Mặt Dưỡng Ẩm Cho Da Khô CeraVe Hydrating Cleanser 473ml",
    category: "Chăm sóc da mặt > Sữa rửa mặt",
    brand: "CeraVe Skincare",
    origin: "Mỹ (Nhập khẩu chính hãng)",
    isMall: true,
    isPreferredPlus: true,
    coverImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&crop=center&q=80",
    ],
    priceVnd: 380000,
    originalPriceVnd: 450000,
    discountPercent: 16,
    stock: 220,
    soldCount: 28900,
    rating: 4.9,
    reviewCount: 6150,
    shippingInfo: {
      freeShipExtra: true,
      shippingFrom: "Đống Đa, Hà Nội",
      estimatedDelivery: "Giao từ 1 - 3 ngày",
      shippingFeeVnd: 0,
    },
    variants: [
      { id: "var_04", name: "Chai 473ml Tiết Kiệm", priceVnd: 380000, originalPriceVnd: 450000, stock: 130, sku: "CERAVE-473ML" },
      { id: "var_03", name: "Chai 236ml", priceVnd: 280000, originalPriceVnd: 330000, stock: 90, sku: "CERAVE-236ML" },
    ],
    vouchers: [
      { id: "vc_03", code: "CERAVE20K", discountLabel: "Giảm 20.000₫", minSpendLabel: "Đơn từ 350.000₫" },
      { id: "vc_04", code: "FREESHIP", discountLabel: "Freeship Xtra", minSpendLabel: "Tối đa 70.000₫" },
    ],
    specifications: {
      skinType: "Da thường, da khô, da nhạy cảm",
      volume: "473ml",
      expiryMonths: 36,
      actives: "3 Ceramides thiết yếu (1, 3, 6-II), Hyaluronic Acid, Glycerin",
      healthMinistryLicense: "10942/22/CBMP-QLD",
      packagingWeightGram: 550,
    },
    description: "Công nghệ MVE giải phóng dưỡng chất suốt 24 giờ. Độ pH 5.5 dịu nhẹ không phá vỡ màng ẩm tự nhiên.",
    howToUse: "Làm ướt mặt, massage nhẹ nhàng 60 giây và rửa sạch bằng nước ấm.",
    status: "active",
    createdAt: "2026-10-18",
  },
  {
    id: "sp_03",
    shopName: "La Roche-Posay Official Store",
    sku: "LRP-HYALU-B5-SERUM-30ML",
    name: "Tinh Chất Phục Hồi & Cấp Nước Đa Tầng La Roche-Posay Hyalu B5 Serum 30ml",
    category: "Chăm sóc da mặt > Serum & Tinh chất",
    brand: "La Roche-Posay",
    origin: "Pháp (L'Oréal Vietnam)",
    isMall: true,
    isPreferredPlus: true,
    coverImage: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&crop=bottom&q=80",
    ],
    priceVnd: 890000,
    originalPriceVnd: 1100000,
    discountPercent: 19,
    stock: 180,
    soldCount: 9400,
    rating: 4.8,
    reviewCount: 2190,
    shippingInfo: {
      freeShipExtra: true,
      shippingFrom: "Quận 1, TP. Hồ Chí Minh",
      estimatedDelivery: "Giao 24h nội thành",
      shippingFeeVnd: 0,
    },
    variants: [
      { id: "var_05", name: "Chai 30ml", priceVnd: 890000, originalPriceVnd: 1100000, stock: 130, sku: "LRP-B5-30ML" },
      { id: "var_06", name: "Chai 50ml Jumbo", priceVnd: 1250000, originalPriceVnd: 1550000, stock: 50, sku: "LRP-B5-50ML" },
    ],
    vouchers: [
      { id: "vc_05", code: "LRP50K", discountLabel: "Giảm 50.000₫", minSpendLabel: "Đơn từ 800.000₫" },
      { id: "vc_06", code: "FREESHIP", discountLabel: "Freeship Xtra", minSpendLabel: "Toàn quốc" },
    ],
    specifications: {
      skinType: "Mọi loại da, da thiếu ẩm, da có nếp nhăn li ti",
      volume: "30ml",
      expiryMonths: 36,
      actives: "Pure Hyaluronic Acid Duo, Vitamin B5 (Panthenol 5%), Madecassoside",
      healthMinistryLicense: "14820/21/CBMP-QLD",
      packagingWeightGram: 120,
    },
    description: "Bộ đôi phân tử HA cấp ẩm tầng sâu kết hợp Panthenol 5% phục hồi da mỏng yếu, giảm kích ứng chỉ sau 1 đêm.",
    howToUse: "Nhỏ 3-4 giọt lên mặt khi da còn ẩm, vỗ nhẹ cho tinh chất thẩm thấu.",
    status: "active",
    createdAt: "2026-10-22",
  },
  {
    id: "sp_04",
    shopName: "La Roche-Posay Official Store",
    sku: "LRP-ANTHELIOS-UVMUNE-50ML",
    name: "Kem Chống Nắng Kiểm Soát Dầu 12H La Roche-Posay Anthelios UVMune 400 50ml",
    category: "Chăm sóc da mặt > Kem chống nắng",
    brand: "La Roche-Posay",
    origin: "Pháp",
    isMall: true,
    isPreferredPlus: true,
    coverImage: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&crop=center&q=80",
    ],
    priceVnd: 475000,
    originalPriceVnd: 560000,
    discountPercent: 15,
    stock: 410,
    soldCount: 34100,
    rating: 4.9,
    reviewCount: 8900,
    shippingInfo: {
      freeShipExtra: true,
      shippingFrom: "Quận 1, TP. Hồ Chí Minh",
      estimatedDelivery: "Giao từ 1 - 2 ngày",
      shippingFeeVnd: 0,
    },
    variants: [
      { id: "var_07", name: "Chai 50ml", priceVnd: 475000, originalPriceVnd: 560000, stock: 410, sku: "LRP-UV-50ML" },
    ],
    vouchers: [
      { id: "vc_07", code: "LRP15K", discountLabel: "Giảm 15.000₫", minSpendLabel: "Đơn từ 300.000₫" },
      { id: "vc_08", code: "FREESHIP", discountLabel: "Freeship Xtra", minSpendLabel: "Tối đa 70.000₫" },
    ],
    specifications: {
      skinType: "Da dầu mụn, da hỗn hợp thiên dầu",
      volume: "50ml",
      expiryMonths: 36,
      actives: "Màng lọc độc quyền Mexoryl 400, Công nghệ Airlicium, Netlock",
      healthMinistryLicense: "19402/23/CBMP-QLD",
      packagingWeightGram: 90,
    },
    description: "Màng lọc Mexoryl 400 chặn tia UVA dài 380-400nm. Hạt vi chất Airlicium kiểm soát bã nhờn suốt 12 giờ khô thoáng.",
    howToUse: "Lắc kỹ trước khi sử dụng. Thoa 20 phút trước khi ra nắng và thoa lại sau 3-4 giờ.",
    status: "active",
    createdAt: "2026-10-25",
  },
  {
    id: "sp_05",
    shopName: "La Roche-Posay Official Store",
    sku: "LRP-CICAPLAST-B5-PLUS-40ML",
    name: "Kem Dưỡng Làm Dịu & Phục Hồi Biểu Bì La Roche-Posay Cicaplast Baume B5+ 40ml",
    category: "Chăm sóc da mặt > Kem dưỡng & Trị mụn",
    brand: "La Roche-Posay",
    origin: "Pháp (Chính Hãng)",
    isMall: true,
    isPreferredPlus: true,
    coverImage: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&crop=top&q=80",
    ],
    priceVnd: 360000,
    originalPriceVnd: 420000,
    discountPercent: 14,
    stock: 290,
    soldCount: 21500,
    rating: 4.9,
    reviewCount: 5400,
    shippingInfo: {
      freeShipExtra: true,
      shippingFrom: "Quận 1, TP. Hồ Chí Minh",
      estimatedDelivery: "Giao từ 1 - 2 ngày",
      shippingFeeVnd: 0,
    },
    variants: [
      { id: "var_08", name: "Tuýp 40ml", priceVnd: 360000, originalPriceVnd: 420000, stock: 180, sku: "LRP-B5-40ML" },
      { id: "var_09", name: "Tuýp 100ml", priceVnd: 590000, originalPriceVnd: 720000, stock: 110, sku: "LRP-B5-100ML" },
    ],
    vouchers: [
      { id: "vc_09", code: "LRP15K", discountLabel: "Giảm 15.000₫", minSpendLabel: "Đơn từ 300.000₫" },
      { id: "vc_10", code: "FREESHIP", discountLabel: "Freeship Xtra", minSpendLabel: "Toàn sàn" },
    ],
    specifications: {
      skinType: "Da nhạy cảm, da sau peel, laser, da khô nứt nẻ",
      volume: "40ml",
      expiryMonths: 36,
      actives: "Tribioma, Madecassoside, 5% Panthenol, Đồng - Kẽm - Mangan",
      healthMinistryLicense: "16301/22/CBMP-QLD",
      packagingWeightGram: 75,
    },
    description: "Công thức B5+ cải tiến với phức hợp lợi khuẩn Tribioma giúp phục hồi hàng rào bảo vệ da sau peel và laser cực nhanh.",
    howToUse: "Thoa 2 lần/ngày lên vùng da cần phục hồi sau bước làm sạch.",
    status: "active",
    createdAt: "2026-10-27",
  },
  {
    id: "sp_06",
    shopName: "La Roche-Posay Official Store",
    sku: "LRP-MICELLAR-OILY-400ML",
    name: "Nước Tẩy Trang Sạch Sâu Kiềm Dầu La Roche-Posay Effaclar Micellar Water 400ml",
    category: "Chăm sóc da mặt > Nước tẩy trang",
    brand: "La Roche-Posay",
    origin: "Pháp (L'Oréal Vietnam)",
    isMall: true,
    isPreferredPlus: true,
    coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&crop=center&q=80",
    ],
    priceVnd: 435000,
    originalPriceVnd: 515000,
    discountPercent: 16,
    stock: 195,
    soldCount: 17800,
    rating: 4.8,
    reviewCount: 4210,
    shippingInfo: {
      freeShipExtra: true,
      shippingFrom: "Quận 1, TP. Hồ Chí Minh",
      estimatedDelivery: "Giao 1 - 2 ngày",
      shippingFeeVnd: 0,
    },
    variants: [
      { id: "var_11", name: "Chai 400ml Tiết Kiệm", priceVnd: 435000, originalPriceVnd: 515000, stock: 120, sku: "LRP-MICELLAR-400ML" },
      { id: "var_10", name: "Chai 200ml", priceVnd: 285000, originalPriceVnd: 340000, stock: 75, sku: "LRP-MICELLAR-200ML" },
    ],
    vouchers: [
      { id: "vc_11", code: "FREESHIP", discountLabel: "Freeship Xtra", minSpendLabel: "Tối đa 70.000₫" },
    ],
    specifications: {
      skinType: "Da dầu mụn, da dễ bít tắc lỗ chân lông",
      volume: "400ml",
      expiryMonths: 36,
      actives: "Hạt Micellar, Zinc PCA, Nước khoáng La Roche-Posay",
      healthMinistryLicense: "12844/21/CBMP-QLD",
      packagingWeightGram: 450,
    },
    description: "Công nghệ Glyco Micellar làm sạch 99% cặn trang điểm và bụi mịn PM2.5 mà không gây cay mắt hay khô căng.",
    howToUse: "Thấm dung dịch ra bông tẩy trang và lau nhẹ nhàng khắp mặt, mắt và môi.",
    status: "active",
    createdAt: "2026-10-29",
  },
  {
    id: "sp_07",
    shopName: "SkinCeuticals Vietnam Flagship",
    sku: "SKINCEUT-B5-GEL-30ML",
    name: "Serum Cấp Nước Phục Hồi Chuyên Sâu SkinCeuticals Hydrating B5 Gel 30ml",
    category: "Chăm sóc da mặt > Serum & Tinh chất",
    brand: "SkinCeuticals",
    origin: "Mỹ (Chính Hãng)",
    isMall: true,
    isPreferredPlus: true,
    coverImage: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&crop=top&q=80",
    ],
    priceVnd: 1850000,
    originalPriceVnd: 2200000,
    discountPercent: 16,
    stock: 95,
    soldCount: 4200,
    rating: 5.0,
    reviewCount: 980,
    shippingInfo: {
      freeShipExtra: true,
      shippingFrom: "Quận 1, TP. Hồ Chí Minh",
      estimatedDelivery: "Giao hỏa tốc 2h",
      shippingFeeVnd: 0,
    },
    variants: [
      { id: "var_12", name: "Chai 30ml", priceVnd: 1850000, originalPriceVnd: 2200000, stock: 95, sku: "SKINCEUT-B5-30ML" },
    ],
    vouchers: [
      { id: "vc_12", code: "VIP100K", discountLabel: "Giảm 100.000₫", minSpendLabel: "Đơn từ 1.500.000₫" },
      { id: "vc_13", code: "FREESHIP", discountLabel: "Freeship Xtra", minSpendLabel: "Toàn quốc" },
    ],
    specifications: {
      skinType: "Mọi loại da, da sau can thiệp y khoa chuyên sâu",
      volume: "30ml",
      expiryMonths: 36,
      actives: "Hyaluronic Acid phân tử tinh khiết, Calcium Pantothenate (B5)",
      healthMinistryLicense: "17203/23/CBMP-QLD",
      packagingWeightGram: 110,
    },
    description: "Serum cấp nước đỉnh cao y khoa giữ ẩm liên tục 24h, tăng hiệu quả của các liệu trình trị liệu da liễu.",
    howToUse: "Nhỏ 2-3 giọt tinh chất lên trán và má sau bước toner, massage nhẹ nhàng.",
    status: "active",
    createdAt: "2026-11-01",
  },
  {
    id: "sp_08",
    shopName: "Obagi Medical Vietnam Flagship",
    sku: "OBAGI-CLENZIDERM-148ML",
    name: "Dung Dịch Giảm Bã Nhờn & Mụn Obagi Medical Clenziderm MD Pore Therapy 148ml",
    category: "Chăm sóc da mặt > Kem dưỡng & Trị mụn",
    brand: "Obagi Medical",
    origin: "Mỹ (Chính Hãng)",
    isMall: true,
    isPreferredPlus: true,
    coverImage: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&crop=center&q=80",
    ],
    priceVnd: 820000,
    originalPriceVnd: 960000,
    discountPercent: 15,
    stock: 140,
    soldCount: 8600,
    rating: 4.8,
    reviewCount: 1950,
    shippingInfo: {
      freeShipExtra: true,
      shippingFrom: "Cầu Giấy, Hà Nội",
      estimatedDelivery: "Giao từ 1 - 2 ngày",
      shippingFeeVnd: 0,
    },
    variants: [
      { id: "var_13", name: "Chai 148ml", priceVnd: 820000, originalPriceVnd: 960000, stock: 140, sku: "OBAGI-BHA-148ML" },
    ],
    vouchers: [
      { id: "vc_14", code: "OBAGI50K", discountLabel: "Giảm 50.000₫", minSpendLabel: "Đơn từ 800.000₫" },
      { id: "vc_15", code: "FREESHIP", discountLabel: "Freeship Xtra", minSpendLabel: "Tối đa 70.000₫" },
    ],
    specifications: {
      skinType: "Da dầu mụn, mụn đầu đen, bít tắc lỗ chân lông",
      volume: "148ml",
      expiryMonths: 36,
      actives: "Salicylic Acid 2% (BHA), Menthol, Glycerin",
      healthMinistryLicense: "15980/22/CBMP-QLD",
      packagingWeightGram: 210,
    },
    description: "BHA 2% thẩm thấu sâu loại bỏ bã nhờn, làm thông thoáng lỗ chân lông và hỗ trợ gom cồi mụn ẩn nhanh chóng.",
    howToUse: "Bơm tinh chất ra bông cotton và thoa nhẹ vùng chữ T hoặc toàn mặt (tránh vùng mắt).",
    status: "active",
    createdAt: "2026-11-03",
  },
  {
    id: "sp_09",
    shopName: "Glenmark Pharma Store",
    sku: "KLENZIT-MS-15G",
    name: "Gel Giảm Mụn Ẩn & Gom Cồi Nhanh Klenzit-MS Adapalene 0.1% 15g",
    category: "Chăm sóc da mặt > Kem dưỡng & Trị mụn",
    brand: "Glenmark Pharmaceuticals",
    origin: "Ấn Độ (Nhập khẩu chính ngạch)",
    isMall: true,
    isPreferredPlus: true,
    coverImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&crop=top&q=80",
    ],
    priceVnd: 125000,
    originalPriceVnd: 155000,
    discountPercent: 19,
    stock: 480,
    soldCount: 52000,
    rating: 4.9,
    reviewCount: 14500,
    shippingInfo: {
      freeShipExtra: true,
      shippingFrom: "Quận 1, TP. Hồ Chí Minh",
      estimatedDelivery: "Giao 1 - 2 ngày",
      shippingFeeVnd: 0,
    },
    variants: [
      { id: "var_14", name: "Tuýp 15g", priceVnd: 125000, originalPriceVnd: 155000, stock: 480, sku: "KLENZIT-MS-15G" },
    ],
    vouchers: [
      { id: "vc_16", code: "FREESHIP", discountLabel: "Freeship Xtra", minSpendLabel: "Đơn từ 99.000₫" },
    ],
    specifications: {
      skinType: "Da mụn ẩn, mụn đầu trắng, da sần sùi bít tắc",
      volume: "15g",
      expiryMonths: 24,
      actives: "Adapalene 0.1% dạng vi cầu (Microspheres)",
      healthMinistryLicense: "VN-19820-16",
      packagingWeightGram: 35,
    },
    description: "Adapalene dạng vi cầu thẩm thấu trúng đích vào nang lông, điều hòa sừng hóa và đào thải nhân mụn êm dịu.",
    howToUse: "Thoa một lượng nhỏ bằng hạt đậu lên vùng da mụn vào buổi tối sau kem dưỡng ẩm.",
    status: "active",
    createdAt: "2026-11-05",
  },
];

interface ShopCurrentUser extends ShopUserSession {
  id?: string;
  isSuperAdmin?: boolean;
  shopDetails?: {
    shopName?: string;
    ownerName?: string;
    license?: string;
    category?: string;
    address?: string;
    phone?: string;
  };
}

interface AdminProductApiRecord {
  id: string;
  shopName?: string;
  sku?: string;
  name: string;
  category?: string;
  brand?: string;
  origin?: string;
  images?: unknown[];
  coverImage?: string;
  price: number;
  stock?: number;
  description?: string;
  status: string;
  submittedAt?: string;
}

export default function ShopProductPage() {
  const router = useRouter();
  // Page mode: "seller" (Shopee Seller Center) vs "buyer" (Shopee Marketplace Storefront)
  const [viewMode, setViewMode] = useState<"seller" | "buyer">("seller");

  // User session & approval state
  const [currentUser, setCurrentUser] = useState<ShopCurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Products state - Exactly 9 authentic products
  const [products, setProducts] = useState<ShopeeProduct[]>(INITIAL_SHOPEE_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<ShopeeProduct>(INITIAL_SHOPEE_PRODUCTS[0]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [buyerQuantity, setBuyerQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Load session from /api/auth/me
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));
  }, []);

  // Load products from /api/admin/products to sync approval status
  useEffect(() => {
    fetch("/api/admin/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.products)) {
          setProducts((prev) => {
            const updated = prev.map((p) => {
              const match = (data.products as AdminProductApiRecord[]).find(
                (ap) =>
                  ap.id === p.id ||
                  ap.name.toLowerCase() === p.name.toLowerCase() ||
                  (ap.sku && ap.sku === p.sku)
              );
              if (match) {
                return {
                  ...p,
                  status: (match.status === "approved" ? "active" : match.status) as ShopeeProductStatus,
                };
              }
              return p;
            });

            // Append any new products added by shops from admin products
            const existingNames = new Set(updated.map((p) => p.name.toLowerCase()));
            const newAdminItems: ShopeeProduct[] = [];
            (data.products as AdminProductApiRecord[]).forEach((ap) => {
              if (!existingNames.has(ap.name.toLowerCase())) {
                const apiImages = Array.isArray(ap.images)
                  ? ap.images.filter((img: unknown): img is string => typeof img === "string" && img.trim().length > 0)
                  : [];
                const resolvedCover =
                  (typeof ap.coverImage === "string" && ap.coverImage.trim()) || apiImages[0] || "";
                const resolvedGallery =
                  apiImages.length > 0 ? apiImages : resolvedCover ? [resolvedCover] : [];

                newAdminItems.push({
                  id: ap.id,
                  shopName: ap.shopName || "SkinSense Flagship",
                  sku: ap.sku || `SKU-${ap.id}`,
                  name: ap.name,
                  category: ap.category || "Chăm sóc da mặt > Kem dưỡng & Trị mụn",
                  brand: ap.brand || ap.shopName || "SkinSense Flagship",
                  origin: ap.origin || "Pháp",
                  isMall: true,
                  isPreferredPlus: false,
                  images: resolvedGallery,
                  coverImage: resolvedCover,
                  priceVnd: ap.price,
                  originalPriceVnd: Math.round(ap.price * 1.25),
                  discountPercent: 20,
                  stock: ap.stock || 100,
                  soldCount: 0,
                  rating: 5.0,
                  reviewCount: 0,
                  shippingInfo: {
                    freeShipExtra: true,
                    shippingFrom: "TP. Hồ Chí Minh",
                    estimatedDelivery: "Giao 1-2 ngày",
                    shippingFeeVnd: 0,
                  },
                  variants: [{
                    id: `var_${ap.id}`,
                    name: "Dung tích tiêu chuẩn",
                    priceVnd: ap.price,
                    originalPriceVnd: Math.round(ap.price * 1.25),
                    stock: ap.stock || 100,
                    sku: ap.sku || `SKU-${ap.id}`,
                  }],
                  vouchers: [],
                  specifications: {
                    skinType: "Mọi loại da",
                    volume: "50ml",
                    expiryMonths: 36,
                    actives: "Thành phần tự nhiên",
                    healthMinistryLicense: "Đã nộp hồ sơ công bố",
                    packagingWeightGram: 100,
                  },
                  description: ap.description || "Sản phẩm chính hãng đã qua kiểm định.",
                  howToUse: "Thoa sau bước làm sạch.",
                  status: (ap.status === "approved" ? "active" : ap.status) as ShopeeProductStatus,
                  createdAt: ap.submittedAt || new Date().toISOString().split("T")[0],
                });
              }
            });

            return [...newAdminItems, ...updated];
          });
        }
      })
      .catch(() => {});
  }, []);

  // Per-card sub-tab state for Seller Center ("sales" | "specs" | "variants")
  const [cardActiveTab, setCardActiveTab] = useState<Record<string, "sales" | "specs" | "variants">>({});

  // Inspector Modal for full detailed view of any product's Shopee specs
  const [inspectingProduct, setInspectingProduct] = useState<ShopeeProduct | null>(null);

  // Search & Filter state for seller
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal: Add New Shopee Product state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("Chăm sóc da mặt > Serum & Tinh chất");
  const [formBrand, setFormBrand] = useState("La Roche-Posay");
  const [formOrigin, setFormOrigin] = useState("Pháp");
  const [formPrice, setFormPrice] = useState<number>(350000);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(450000);
  const [formStock, setFormStock] = useState<number>(100);
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [formSkinType, setFormSkinType] = useState("Mọi loại da, da mụn nhạy cảm");
  const [formVolume, setFormVolume] = useState("50ml");
  const [formActives, setFormActives] = useState("Niacinamide, B5, Salicylic Acid");
  const [formLicense, setFormLicense] = useState("20491/24/CBMP-QLD");
  const [formDescription, setFormDescription] = useState("");
  const [formHowToUse, setFormHowToUse] = useState("");
  const [formWeight, setFormWeight] = useState<number>(120);

  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";
  const isShopUser = currentUser?.role === "shop";
  const currentShopName =
    currentUser?.shopDetails?.shopName?.trim() ||
    (isShopUser ? currentUser?.fullName?.trim() : "") ||
    "";

  // Super Admin shop inspection filter
  const [adminShopFilter, setAdminShopFilter] = useState<string>("all");

  // Unique registered & verified shops
  const availableShops = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.shopName?.trim()) set.add(p.shopName.trim());
    });
    if (currentShopName) set.add(currentShopName);
    return Array.from(set);
  }, [products, currentShopName]);

  // Seller products strictly filtered to the active shop account
  const sellerProducts = useMemo(() => {
    if (isSuperAdmin) {
      if (adminShopFilter && adminShopFilter !== "all") {
        return filterProductsByShop(products, adminShopFilter, false);
      }
      return products;
    }
    if (currentShopName) {
      return filterProductsByShop(products, currentShopName, false);
    }
    return [];
  }, [products, isSuperAdmin, adminShopFilter, currentShopName]);

  // Filtered products list for Seller Center
  const filteredProducts = useMemo(() => {
    return sellerProducts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.shopName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === "all" || p.category.includes(categoryFilter);
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? p.status === "active" || p.status === "approved"
          : p.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [sellerProducts, searchTerm, categoryFilter, statusFilter]);

  // Buyer products: strictly only approved or active products!
  const buyerProducts = useMemo(() => {
    return products.filter((p) => isProductVisibleToBuyer(p.status));
  }, [products]);

  // Handle Add Product submit
  function handleAddProductSubmit(e: React.FormEvent) {
    e.preventDefault();

    const shopAccess = canShopSignIn(currentUser);
    if (!shopAccess.allowed) {
      toast.error(
        shopAccess.reason ||
          "Gian hàng của bạn chưa được Super Admin phê duyệt để thực hiện đăng bán sản phẩm!"
      );
      return;
    }

    if (!formName.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm!");
      return;
    }
    if (formPrice <= 0 || formOriginalPrice <= 0) {
      toast.error("Giá sản phẩm phải lớn hơn 0!");
      return;
    }
    if (formStock < 0) {
      toast.error("Tồn kho không được âm!");
      return;
    }
    if (isUploadingImages) {
      toast.info("Ảnh sản phẩm đang được tải lên, vui lòng đợi...");
      return;
    }

    const resolvedImages = formImages.map((u) => u.trim()).filter(Boolean);
    const resolvedCoverImage = resolvedImages[0] || formCoverImage.trim();
    const galleryImages =
      resolvedImages.length > 0
        ? resolvedImages
        : resolvedCoverImage
          ? [resolvedCoverImage]
          : [];

    const discountPct = Math.max(
      0,
      Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100),
    );

    const newShopeeProduct: ShopeeProduct = {
      id: `sp_${Date.now()}`,
      shopName: currentShopName || formBrand.trim() || "Gian Hàng Đối Tác SkinSense",
      sku: formSku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      name: formName.trim(),
      category: formCategory,
      brand: formBrand.trim() || "Chính Hãng",
      origin: formOrigin.trim() || "Nhập khẩu",
      isMall: true,
      isPreferredPlus: true,
      coverImage: resolvedCoverImage,
      images: galleryImages,
      priceVnd: Number(formPrice),
      originalPriceVnd: Number(formOriginalPrice),
      discountPercent: discountPct,
      stock: Number(formStock),
      soldCount: 0,
      rating: 5.0,
      reviewCount: 0,
      shippingInfo: {
        freeShipExtra: true,
        shippingFrom: currentUser?.shopDetails?.address || "Kho hàng TP. Đà Nẵng / Hà Nội / TP.HCM",
        estimatedDelivery: "Giao từ 1 - 2 ngày",
        shippingFeeVnd: 0,
      },
      variants: [
        {
          id: `var_${Date.now()}`,
          name: `Dung tích ${formVolume}`,
          priceVnd: Number(formPrice),
          originalPriceVnd: Number(formOriginalPrice),
          stock: Number(formStock),
          sku: formSku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        },
      ],
      vouchers: [
        { id: `vc_${Date.now()}`, code: "NEWSHOP15", discountLabel: "Giảm 15.000₫", minSpendLabel: "Đơn từ 200.000₫" },
      ],
      specifications: {
        skinType: formSkinType.trim(),
        volume: formVolume.trim(),
        expiryMonths: 36,
        actives: formActives.trim(),
        healthMinistryLicense: formLicense.trim(),
        packagingWeightGram: Number(formWeight) || 100,
      },
      description: formDescription.trim() || "Sản phẩm dược mỹ phẩm chính hãng 100%, có tem phụ tiếng Việt và hóa đơn VAT.",
      howToUse: formHowToUse.trim() || "Thoa sau bước làm sạch và vỗ nhẹ cho tinh chất thẩm thấu.",
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    };

    // Saved first, shown after: the product used to appear with a success toast while the save
    // was fired and forgotten, so a refused or failed save still looked submitted for approval.
    fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newShopeeProduct.name,
        shopName: newShopeeProduct.shopName,
        price: newShopeeProduct.priceVnd,
        category: newShopeeProduct.category,
        stock: newShopeeProduct.stock,
        brand: newShopeeProduct.brand,
        sku: newShopeeProduct.sku,
        coverImage: newShopeeProduct.coverImage,
        images: newShopeeProduct.images,
        description: newShopeeProduct.description,
        origin: newShopeeProduct.origin,
      }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; product?: { id: string } } | null;
        if (!res.ok || !data?.ok || !data.product) throw new Error(data?.error || "Lưu sản phẩm thất bại.");
        const savedId = data.product.id;
        setProducts((prev) => [{ ...newShopeeProduct, id: savedId }, ...prev]);
        setFormImages([]);
        setFormCoverImage("");
        setIsAddModalOpen(false);
        toast.info(`Sản phẩm "${newShopeeProduct.name}" đã được gửi và đang chờ Admin phê duyệt trước khi mở bán trên sàn.`, {
          duration: 6000,
        });
      })
      .catch((err: Error) => toast.error(`Không lưu được sản phẩm: ${err.message}`));
  }

  // Delete product
  function handleDeleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.info("Đã xóa sản phẩm khỏi kho bán hàng.");
  }

  // Format VND helper with non-breaking space
  function formatMoney(amount: number) {
    return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0₫";
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Top Header - Shopee Style with SkinSense Palette */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-3 lg:justify-start">
            <Link href="/" className="flex items-center gap-2.5 group">
              <LogoMark className="size-8 transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-display text-lg font-medium tracking-tight text-foreground leading-tight">
                  SkinSense <span className="font-sans text-[11px] font-semibold tracking-wider text-primary">GIAN HÀNG</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Quản lý sản phẩm và gian hàng
                </span>
              </div>
            </Link>

            <span className="hidden h-4 w-px bg-border lg:inline-block" />

            <div className="hidden items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary lg:flex">
              <Store className="size-3.5" />
              <span>
                {currentUser?.shopDetails?.shopName ||
                  (currentUser?.isSuperAdmin ? "SkinSense Super Admin Hub" : "La Roche-Posay Official Store")}
              </span>
              {currentUser?.status === "pending" ? (
                <span className="rounded bg-amber-500/20 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 text-[9px] font-bold">
                  Chờ duyệt
                </span>
              ) : currentUser?.status === "active" ? (
                <span className="rounded bg-emerald-700/20 text-emerald-900 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold">
                  Đã duyệt
                </span>
              ) : (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                  Gian hàng
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:gap-2.5">
            {/* View Mode Toggle: Seller Center vs Buyer Storefront */}
            <div className="flex w-full items-center rounded-xl border border-border bg-card p-1 shadow-xs sm:w-auto">
              <button
                type="button"
                aria-pressed={viewMode === "seller"}
                onClick={() => setViewMode("seller")}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition cursor-pointer sm:flex-none sm:text-xs ${
                  viewMode === "seller"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Store className="size-3.5" />
                <span>Kênh Người Bán</span>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "buyer"}
                onClick={() => setViewMode("buyer")}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition cursor-pointer sm:flex-none sm:text-xs ${
                  viewMode === "buyer"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <ShoppingBag className="size-3.5" />
                <span>Mua Hàng</span>
              </button>
            </div>

            <AuthModal
              defaultTab="shop-approval"
              triggerLabel="🏪 Đăng ký mở Gian hàng"
              triggerClassName="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-amber-600/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 transition hover:border-amber-600 hover:bg-amber-500/20 cursor-pointer shadow-2xs whitespace-nowrap"
            />

            <Link
              href="/shop/checkout"
              className="flex items-center gap-1.5 rounded-xl border border-[#C2410C]/40 bg-[#C2410C]/10 px-3 py-1.5 text-xs font-bold text-[#C2410C] hover:bg-[#C2410C] hover:text-white transition shadow-2xs"
            >
              <ShoppingBag className="size-3.5" />
              <span>Thanh Toán</span>
            </Link>

            <Link
              href={viewMode === "seller" ? "/shop/profile" : "/user/profile"}
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs font-bold text-[#191B19] hover:border-[#191B19] transition shadow-2xs"
              title={viewMode === "seller" ? "Xem hồ sơ Cửa hàng (Shop)" : "Xem hồ sơ Người mua (Khách hàng)"}
            >
              <User className="size-3.5 text-[#C2410C]" />
              <span className="hidden sm:inline">
                {viewMode === "seller" ? "Hồ Sơ Shop" : "Hồ Sơ"}
              </span>
            </Link>

            <Link
              href="/app"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
              title="Về trang soi da (Hôm nay)"
            >
              <Home className="size-3.5" />
              <span className="hidden sm:inline">Trang soi da (Trang chủ)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6">
        {/* SELLER CENTER MODE (QUẢN LÝ ĐĂNG BÁN SẢN PHẨM CHUẨN SHOPEE) */}
        {viewMode === "seller" && (
          !canShopSignIn(currentUser).allowed ? (
            currentUser?.role === "shop" && currentUser?.status === "pending" ? (
              /* MÀN HÌNH KHÓA CHỜ DUYỆT GIAN HÀNG */
              <div className="rounded-3xl border border-amber-600/30 bg-amber-500/5 p-6 sm:p-10 space-y-6 max-w-3xl mx-auto shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    <Clock className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                      <AlertTriangle className="size-3.5" />
                      <span>Hồ sơ gian hàng đang chờ phê duyệt</span>
                    </div>
                    <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground">
                      Gian Hàng Đang Chờ Super Admin Trần Thị Ngọc Hà Phê Duyệt
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Hồ sơ đăng ký mở gian hàng của <strong>{currentUser?.shopDetails?.shopName || currentUser?.fullName}</strong> đã được nộp thành công lên hệ thống. Nhằm đảm bảo an toàn mỹ phẩm và quyền lợi người tiêu dùng, tài khoản cần được Super Admin Trần Thị Ngọc Hà kiểm duyệt Giấy phép ĐKKD, mã số thuế và kho hàng trước khi được kích hoạt chức năng Kênh Người Bán.
                    </p>
                  </div>
                </div>

                {/* THÔNG TIN HỒ SƠ ĐÃ NỘP */}
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Store className="size-4 text-primary" />
                    <span>Thông tin hồ sơ đã tiếp nhận</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>Tên gian hàng: <strong className="text-foreground">{currentUser?.shopDetails?.shopName || "Chưa cập nhật"}</strong></div>
                    <div>Chủ sở hữu: <strong className="text-foreground">{currentUser?.shopDetails?.ownerName || currentUser?.fullName}</strong></div>
                    <div>Mã số thuế / GPKD: <strong className="font-mono text-primary">{currentUser?.shopDetails?.license || "Đang chờ kiểm duyệt"}</strong></div>
                    <div>Ngành hàng kinh doanh: <strong className="text-foreground">{currentUser?.shopDetails?.category || "Dược mỹ phẩm & Trị mụn"}</strong></div>
                    <div className="sm:col-span-2">Kho xuất hàng: <strong className="text-foreground">{currentUser?.shopDetails?.address || "Việt Nam"}</strong></div>
                  </div>
                </div>

                {/* CẢNH BÁO TẠM KHÓA */}
                <div className="rounded-xl border border-dashed border-amber-600/40 bg-amber-500/10 p-3.5 text-xs text-amber-950 dark:text-amber-200">
                  🔒 <strong>Chức năng Kênh Người Bán tạm khóa:</strong> Bạn chưa thể đăng bán sản phẩm mới, cập nhật tồn kho hoặc xử lý đơn hàng cho đến khi Super Admin phê duyệt.
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      fetch("/api/auth/me", { cache: "no-store" })
                        .then((r) => r.json())
                        .then((d) => {
                          if (d?.user) setCurrentUser(d.user);
                          toast.info("Đã làm mới trạng thái duyệt gian hàng!");
                        });
                    }}
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-2 transition cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Làm mới trạng thái</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("buyer")}
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition cursor-pointer"
                  >
                    <ShoppingBag className="size-3.5" />
                    <span>Chuyển sang Kênh Mua Hàng</span>
                  </button>
                </div>
              </div>
            ) : (
              /* MÀN HÌNH YÊU CẦU ĐĂNG NHẬP GIAN HÀNG */
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 text-center space-y-4 max-w-2xl mx-auto shadow-md">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Store className="size-7" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  Kênh Quản Lý Người Bán Shopee Mall
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Kênh Người Bán chỉ dành cho các Gian hàng Dược mỹ phẩm đối tác đã được Super Admin Trần Thị Ngọc Hà kiểm duyệt và cấp phép. Vui lòng đăng nhập tài khoản Gian hàng hoặc nộp hồ sơ xin mở gian hàng để bắt đầu.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <AuthModal
                    defaultTab="sign-in"
                    triggerLabel="🔑 Đăng nhập Gian hàng"
                    triggerClassName="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition cursor-pointer"
                  />
                  <AuthModal
                    defaultTab="shop-approval"
                    triggerLabel="🏪 Nộp hồ sơ Mở Gian hàng"
                    triggerClassName="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-600/40 bg-amber-500/10 px-5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:border-amber-600 hover:bg-amber-500/20 transition cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setViewMode("buyer")}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground transition cursor-pointer"
                  >
                    <ShoppingBag className="size-4" />
                    <span>Xem Kênh Mua Hàng</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
            {/* Top Seller Overview Stats - Compact & Balanced */}
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
              <div className="flex items-center gap-3 px-1">
                <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Package className="size-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sản phẩm đang bán
                  </span>
                  <div className="font-display text-xl font-medium text-foreground sm:text-2xl">
                    {sellerProducts.length} <span className="font-sans text-xs font-normal text-muted-foreground">mặt hàng</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-border px-1 sm:border-l sm:pl-4 xl:border-l">
                <div className="shrink-0 rounded-xl bg-success/10 p-2.5 text-success">
                  <ShoppingBag className="size-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tổng lượt đã bán
                  </span>
                  <div className="font-display text-xl font-medium text-success sm:text-2xl">
                    {sellerProducts.reduce((acc, p) => acc + p.soldCount, 0).toLocaleString()} <span className="font-sans text-xs font-normal text-muted-foreground">đã giao</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-border px-1 sm:border-l sm:pl-4 xl:border-l">
                <div className="rounded-xl bg-amber-700/10 p-2.5 text-amber-800 shrink-0">
                  <Star className="size-5 fill-amber-700" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Đánh giá Shop
                  </span>
                  <div className="font-display text-xl font-medium text-amber-900 sm:text-2xl">
                    4.9 / 5.0 <span className="font-sans text-xs font-normal text-muted-foreground">(99%)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-border px-1 sm:border-l sm:pl-4 xl:border-l">
                <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Truck className="size-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Vận chuyển Shopee
                  </span>
                  <div className="font-display text-xl font-medium text-foreground sm:text-2xl">
                    100% <span className="font-sans text-xs font-normal text-primary">Freeship</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar: Title, Search & "+ Thêm Sản Phẩm Mới" */}
            <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Grid3X3 className="size-5 text-primary" />
                  <h2 className="font-display text-lg font-medium text-foreground sm:text-xl">
                    Danh Mục Sản Phẩm ({filteredProducts.length} mặt hàng)
                  </h2>
                  {currentShopName && !isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <Store className="size-3" />
                      <span>{currentShopName}</span>
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {isSuperAdmin
                    ? "Chế độ Super Admin: Kiểm soát kho hàng thật của từng gian hàng đối tác."
                    : `Sản phẩm thật của gian hàng ${currentShopName || "bạn"}. Đúng tên shop mới lấy về hiển thị.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex min-h-11 items-center justify-center gap-1.5 self-start rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-[0.98] cursor-pointer sm:self-auto"
              >
                <Plus className="size-4" />
                <span>+ Đăng Bán Sản Phẩm Mới</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm theo tên, mã SKU, thương hiệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* Super Admin Shop Filter Dropdown */}
                {isSuperAdmin && (
                  <div className="flex min-h-11 min-w-0 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                    <Store className="size-3.5 text-primary" />
                    <span className="font-semibold text-primary hidden md:inline">Shop:</span>
                    <select
                      value={adminShopFilter}
                      onChange={(e) => setAdminShopFilter(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tất cả gian hàng ({products.length} SP)</option>
                      {availableShops.map((sn) => {
                        const count = filterProductsByShop(products, sn, false).length;
                        return (
                          <option key={sn} value={sn}>
                            🏪 {sn} ({count} SP)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="flex min-h-11 min-w-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs">
                  <Filter className="size-3.5 text-muted-foreground" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả ngành hàng</option>
                    <option value="Trị mụn">Kem dưỡng & Trị mụn</option>
                    <option value="Sữa rửa mặt">Sữa rửa mặt</option>
                    <option value="Serum">Serum & Tinh chất</option>
                    <option value="Kem chống nắng">Kem chống nắng</option>
                    <option value="Nước tẩy trang">Nước tẩy trang</option>
                  </select>
                </div>

                <div className="flex min-h-11 min-w-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả trạng thái ({sellerProducts.length})</option>
                    <option value="pending">🟡 Chờ Admin duyệt ({sellerProducts.filter((p) => p.status === "pending").length})</option>
                    <option value="active">🟢 Đang bán trên sàn ({sellerProducts.filter((p) => p.status === "active" || p.status === "approved").length})</option>
                    <option value="rejected">🔴 Bị từ chối ({sellerProducts.filter((p) => p.status === "rejected").length})</option>
                    <option value="out_of_stock">Tạm hết hàng</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PRODUCT GRID OR EMPTY STATE */}
            {sellerProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/60 p-8 sm:p-12 text-center space-y-4">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Store className="size-7" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Gian hàng chưa có sản phẩm thật nào
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hệ thống lọc chính xác theo gian hàng <strong>{currentShopName || "của bạn"}</strong>. Đúng tên shop mới lấy về là sản phẩm thật. Hiện tại gian hàng chưa đăng tải sản phẩm nào.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>+ Đăng Bán Sản Phẩm Thật Cho Gian Hàng</span>
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center space-y-3">
                <Search className="size-8 mx-auto text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">
                  Không tìm thấy sản phẩm nào
                </h3>
                <p className="text-xs text-muted-foreground">
                  Không có sản phẩm nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại của bạn.
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((prod) => {
                const activeTab = cardActiveTab[prod.id] || "sales";

                return (
                  <div
                    key={prod.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    {/* KHỐI 1: HÌNH ẢNH SẢN PHẨM (Bấm vào xem ngay trang chi tiết sản phẩm chuẩn sàn) */}
                    <div>
                      <div
                        onClick={() => {
                          setSelectedProduct(prod);
                          setSelectedVariantIndex(0);
                          setActiveImageIndex(0);
                          setViewMode("buyer");
                        }}
                        className="relative aspect-square w-full overflow-hidden border-b border-border bg-surface-2 cursor-pointer"
                        title="Bấm để xem trang chi tiết sản phẩm trên sàn"
                      >
                        {prod.coverImage ? (
                          <img
                            src={prod.coverImage}
                            alt={prod.name}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <ProductImagePlaceholder />
                        )}
                        {/* Overlay Badges Shopee Mall & Freeship & Approval Status */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                          {prod.status === "pending" && (
                            <span className="flex items-center gap-1 rounded bg-amber-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                              <Clock className="size-2.5" />
                              <span>Chờ Admin duyệt</span>
                            </span>
                          )}
                          {prod.status === "rejected" && (
                            <span className="flex items-center gap-1 rounded bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                              <XCircle className="size-2.5" />
                              <span>Bị từ chối</span>
                            </span>
                          )}
                          {(prod.status === "active" || prod.status === "approved") && (
                            <span className="flex items-center gap-1 rounded bg-emerald-700 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                              <CheckCircle2 className="size-2.5" />
                              <span>Đang bán</span>
                            </span>
                          )}
                          {prod.isMall && (
                            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs flex items-center gap-1">
                              <BadgeCheck className="size-2.5" />
                              <span>Mall</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 rounded bg-success px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground shadow-xs">
                            <Truck className="size-2.5" />
                            <span>Freeship Xtra</span>
                          </span>
                        </div>

                        <span className="absolute top-2.5 right-2.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          -{prod.discountPercent}%
                        </span>
                      </div>

                      {/* KHỐI 2: BRAND, SKU, TIÊU ĐỀ & ĐÁNH GIÁ (Bấm tiêu đề xem chi tiết) */}
                      <div className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                          <span className="max-w-[150px] truncate font-semibold uppercase tracking-wider text-primary flex items-center gap-1" title={prod.shopName || prod.brand}>
                            <Store className="size-2.5 shrink-0" />
                            <span className="truncate">{prod.shopName || prod.brand}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                            {prod.sku}
                          </span>
                        </div>

                        <h3
                          onClick={() => {
                            setSelectedProduct(prod);
                            setSelectedVariantIndex(0);
                            setActiveImageIndex(0);
                            setViewMode("buyer");
                          }}
                          className="min-h-[40px] line-clamp-2 text-sm font-semibold leading-snug text-foreground cursor-pointer hover:text-primary transition"
                          title="Bấm để xem chi tiết sản phẩm"
                        >
                          {prod.name}
                        </h3>

                        {/* Điểm sao & Đã bán */}
                        <div className="flex items-center justify-between pt-0.5 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1 text-amber-800 font-bold">
                            <Star className="size-3 fill-amber-700 text-amber-700" />
                            <span>{prod.rating}</span>
                            <span className="text-[10px] font-normal text-muted-foreground">({prod.reviewCount})</span>
                          </div>
                          <div>
                            Đã bán: <strong className="text-foreground">{prod.soldCount.toLocaleString()}</strong>
                          </div>
                        </div>

                        {/* 3 NÚT TAB ĐỒNG NHẤT - Không có viền tròn bao ngoài, vuông bo góc chuẩn chỉ */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            aria-pressed={activeTab === "sales"}
                            onClick={() =>
                              setCardActiveTab((prev) => ({ ...prev, [prod.id]: "sales" }))
                            }
                            className={`min-h-10 flex-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold transition text-center cursor-pointer ${
                              activeTab === "sales"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "border border-border bg-background text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                            }`}
                          >
                            Giá & Voucher
                          </button>
                          <button
                            type="button"
                            aria-pressed={activeTab === "specs"}
                            onClick={() =>
                              setCardActiveTab((prev) => ({ ...prev, [prod.id]: "specs" }))
                            }
                            className={`min-h-10 flex-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold transition text-center cursor-pointer ${
                              activeTab === "specs"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "border border-border bg-background text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                            }`}
                          >
                            Thông Số
                          </button>
                          <button
                            type="button"
                            aria-pressed={activeTab === "variants"}
                            onClick={() =>
                              setCardActiveTab((prev) => ({ ...prev, [prod.id]: "variants" }))
                            }
                            className={`min-h-10 flex-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold transition text-center cursor-pointer ${
                              activeTab === "variants"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "border border-border bg-background text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                            }`}
                          >
                            Biến Thể ({prod.variants.length})
                          </button>
                        </div>

                        {/* NỘI DUNG TỪNG PHẦN ĐƯỢC TÁCH RA VỪA VẶN */}
                        <div className="min-h-[120px] pt-1">
                          {/* PHẦN A: GIÁ BÁN & VOUCHERS */}
                          {activeTab === "sales" && (
                            <div className="space-y-2">
                              {/* Hộp Giá Shopee */}
                              <div className="flex items-baseline justify-between rounded-xl border border-border bg-background p-3">
                                <div>
                                  <span className="block text-[9px] font-semibold uppercase text-muted-foreground">
                                    Giá Shopee:
                                  </span>
                                  <div className="font-display text-base font-semibold text-primary">
                                    {formatMoney(prod.priceVnd)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="block text-[11px] text-muted-foreground line-through">
                                    {formatMoney(prod.originalPriceVnd)}
                                  </span>
                                  <span className="text-[10px] font-semibold text-success">
                                    Kho: {prod.stock}
                                  </span>
                                </div>
                              </div>

                              {/* Vouchers của Shop */}
                              <div className="flex flex-wrap gap-1">
                                {prod.vouchers.map((vc) => (
                                  <span
                                    key={vc.id}
                                    className="rounded border border-dashed border-primary/40 bg-primary/5 px-1.5 py-0.5 text-[9px] font-semibold text-primary"
                                  >
                                    {vc.discountLabel}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* PHẦN B: BẢNG THÔNG SỐ KỸ THUẬT Y TẾ */}
                          {activeTab === "specs" && (
                            <div className="space-y-1 divide-y divide-border/50 rounded-xl border border-border bg-background p-2.5 text-[11px]">
                              <div className="flex justify-between items-center py-0.5">
                                <span className="text-muted-foreground">Loại da:</span>
                                <span className="max-w-[130px] truncate font-semibold text-foreground" title={prod.specifications.skinType}>
                                  {prod.specifications.skinType}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-0.5">
                                <span className="text-muted-foreground">Dung tích:</span>
                                <span className="font-semibold text-foreground">{prod.specifications.volume}</span>
                              </div>
                              <div className="flex justify-between items-center py-0.5">
                                <span className="text-muted-foreground">Số CB:</span>
                                <span className="font-mono text-[10px] font-semibold text-primary">
                                  {prod.specifications.healthMinistryLicense}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-0.5">
                                <span className="text-muted-foreground">Hạn dùng:</span>
                                <span className="font-semibold text-foreground">{prod.specifications.expiryMonths} tháng</span>
                              </div>
                            </div>
                          )}

                          {/* PHẦN C: CÁC BIẾN THỂ DUNG TÍCH (Variants) */}
                          {activeTab === "variants" && (
                            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                              {prod.variants.map((v) => (
                                <div
                                  key={v.id}
                                  className="flex items-center justify-between rounded-lg border border-border bg-background p-2 text-[11px]"
                                >
                                  <div>
                                    <strong className="block text-foreground">{v.name}</strong>
                                    <span className="font-mono text-[9px] text-muted-foreground">{v.sku}</span>
                                  </div>
                                  <div className="text-right">
                                    <strong className="block font-mono text-primary">{formatMoney(v.priceVnd)}</strong>
                                    <span className="text-[9px] text-success">Kho: {v.stock}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 3: THANH NÚT THAO TÁC */}
                    <div className="flex flex-wrap items-center gap-1.5 p-3.5 pt-0">
                      <button
                        type="button"
                        onClick={() => setInspectingProduct(prod)}
                        className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-background text-[11px] font-semibold text-foreground transition hover:bg-surface-2 cursor-pointer"
                        title="Xem đầy đủ mọi trường thông số Shopee"
                      >
                        <FileText className="size-3 text-muted-foreground" />
                        <span>Thông Số</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(prod);
                          setSelectedVariantIndex(0);
                          setActiveImageIndex(0);
                          setViewMode("buyer");
                        }}
                        className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-primary/30 bg-primary/5 text-primary text-[11px] font-semibold hover:bg-primary/10 transition cursor-pointer"
                        title="Xem giao diện mua hàng chuẩn sàn Shopee"
                      >
                        <Eye className="size-3" />
                        <span>Chi Tiết</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          router.push(`/shop/checkout?productId=${prod.id}&variant=0&quantity=1`);
                        }}
                        className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-primary text-[11px] font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 cursor-pointer"
                        title="Mua ngay sản phẩm này và chuyển đến trang thanh toán"
                      >
                        <ShoppingBag className="size-3" />
                        <span>Mua Ngay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="size-11 flex shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-background text-destructive transition hover:bg-destructive/10 cursor-pointer"
                        title="Xóa khỏi gian hàng"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
          )
        )}

        {/* BUYER STOREFRONT MODE (GIAO DIỆN MUA HÀNG CHUẨN 100% SHOPEE MALL) */}
        {viewMode === "buyer" && selectedProduct && (
          <div className="space-y-6">
            {/* Back button & Breadcrumbs */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMode("seller")}
                className="flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-2 cursor-pointer"
              >
                <ArrowRight className="size-3.5 rotate-180" />
                <span>Quay lại Kênh Quản Lý Người Bán</span>
              </button>

              <div className="hidden text-xs text-muted-foreground sm:block">
                Shopee {">"} {selectedProduct.category} {">"} <strong className="text-foreground">{selectedProduct.brand}</strong>
              </div>
            </div>

            {/* Banner cảnh báo kiểm duyệt nếu sản phẩm đang pending hoặc rejected */}
            {selectedProduct.status === "pending" && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-600/40 bg-amber-500/10 p-4 text-xs text-amber-950 dark:text-amber-200">
                <Clock className="size-5 shrink-0 text-amber-800 dark:text-amber-300 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Sản phẩm đang chờ Super Admin Trần Thị Ngọc Hà phê duyệt
                    </strong>
                    <span className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      Chờ duyệt
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Sản phẩm này đang trong quy trình kiểm duyệt hồ sơ pháp lý, số công bố mỹ phẩm và nguồn gốc xuất xứ. Sản phẩm tạm thời chưa mở bán công khai cho người mua cho đến khi được Admin phê duyệt.
                  </p>
                </div>
              </div>
            )}
            {selectedProduct.status === "rejected" && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-600/40 bg-rose-500/10 p-4 text-xs text-rose-950 dark:text-rose-200">
                <XCircle className="size-5 shrink-0 text-rose-800 dark:text-rose-300 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    Sản phẩm bị từ chối phê duyệt
                  </strong>
                  <p className="text-muted-foreground">
                    Sản phẩm này không đủ điều kiện mở bán trên sàn SkinSense theo đánh giá của Super Admin.
                  </p>
                </div>
              </div>
            )}

            {/* SHOPEE MAIN PRODUCT CARD - TÁCH CÁC PHẦN RÕ RÀNG */}
            <div className="space-y-6 rounded-3xl border border-border bg-card p-4 shadow-xs sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                {/* Left: Product Gallery Images (5 cols) - Cùng 1 mặt hàng */}
                <div className="space-y-3.5 lg:col-span-5">
                  {/* Big Cover Image */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-xs">
                    {selectedProduct.images[activeImageIndex] || selectedProduct.coverImage ? (
                      <img
                        src={selectedProduct.images[activeImageIndex] || selectedProduct.coverImage}
                        alt={selectedProduct.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ProductImagePlaceholder label="Shop chưa thêm ảnh sản phẩm" />
                    )}
                    {selectedProduct.isMall && (
                      <div className="absolute top-3 left-3 rounded-md bg-rose-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs flex items-center gap-1">
                        <BadgeCheck className="size-3.5" />
                        <span>Shopee Mall</span>
                      </div>
                    )}
                    <span className="absolute top-3 right-3 rounded-md bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                      GIẢM {selectedProduct.discountPercent}%
                    </span>
                  </div>

                  {/* Thumbnail Row - Các ảnh đều là 1 mặt hàng */}
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {selectedProduct.images.map((imgUrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImageIndex(i)}
                        className={`size-16 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                          activeImageIndex === i ? "border-primary ring-2 ring-primary/20" : "border-border opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img src={imgUrl} alt={`Góc chụp ${i + 1}`} className="size-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Shopee Guarantee banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2/50 p-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <ShieldCheck className="size-4 text-success" />
                      <span>Shopee Đảm Bảo</span>
                    </span>
                    <span>3 Ngày Trả Hàng / Hoàn Tiền 100%</span>
                  </div>
                </div>

                {/* Right: Product Details & Buying Actions (7 cols) */}
                <div className="space-y-5 lg:col-span-7">
                  {/* Title & Brand */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                        Mall
                      </span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {selectedProduct.brand} Chính Hãng
                      </span>
                      <span className="rounded bg-primary/5 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary flex items-center gap-1">
                        <Store className="size-3" />
                        <span>Gian hàng: {selectedProduct.shopName || selectedProduct.brand}</span>
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        SKU: {selectedProduct.sku}
                      </span>
                    </div>

                    <h1 className="font-display text-xl font-medium leading-snug text-foreground sm:text-2xl">
                      {selectedProduct.name}
                    </h1>

                    {/* Rating, Reviews & Sold counters */}
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm pt-0.5">
                      <div className="flex items-center gap-1 text-amber-800 font-bold">
                        <span className="border-b border-amber-800">{selectedProduct.rating}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="size-3.5 fill-amber-700 text-amber-700" />
                          ))}
                        </div>
                      </div>
                      <span className="text-border">•</span>
                      <div>
                        <strong className="border-b border-foreground text-foreground">
                          {selectedProduct.reviewCount.toLocaleString()}
                        </strong>{" "}
                        <span className="text-muted-foreground">Đánh Giá</span>
                      </div>
                      <span className="text-border">•</span>
                      <div>
                        <strong className="text-foreground">{selectedProduct.soldCount.toLocaleString()}</strong>{" "}
                        <span className="text-muted-foreground">Đã Bán</span>
                      </div>
                    </div>
                  </div>

                  {/* SHOPEE FLASH SALE PRICE BOX (Nền kem cam đặc trưng Shopee) */}
                  <div className="space-y-1.5 rounded-2xl border border-primary/25 bg-surface-2/50 p-4 sm:p-5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                      <Sparkles className="size-3.5" />
                      <span>Giá Khuyến Mãi Shopee Mall</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-display text-2xl font-semibold text-primary sm:text-3xl">
                        {formatMoney(
                          selectedProduct.variants[selectedVariantIndex]?.priceVnd || selectedProduct.priceVnd,
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatMoney(
                          selectedProduct.variants[selectedVariantIndex]?.originalPriceVnd || selectedProduct.originalPriceVnd,
                        )}
                      </span>
                      <span className="rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-xs">
                        -{selectedProduct.discountPercent}% GIẢM
                      </span>
                    </div>
                  </div>

                  {/* Shop Vouchers */}
                  <div className="space-y-1.5 pt-0.5">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Mã Giảm Giá Của Shop:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedProduct.vouchers.map((vc) => (
                        <div
                          key={vc.id}
                          className="flex items-center gap-1 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary"
                        >
                          <Tag className="size-3" />
                          <span>{vc.discountLabel}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">({vc.minSpendLabel})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vận chuyển Shopee */}
                  <div className="space-y-1.5 rounded-xl border border-border bg-surface-2/50 p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-success">
                      <Truck className="size-4" />
                      <span>Vận Chuyển: Miễn Phí Vận Chuyển (Freeship Xtra)</span>
                    </div>
                    <div className="space-y-0.5 pl-5 text-xs text-muted-foreground">
                      <div>Gửi hàng từ: <strong className="text-foreground">{selectedProduct.shippingInfo.shippingFrom}</strong></div>
                      <div>Dự kiến nhận hàng: <strong className="text-foreground">{selectedProduct.shippingInfo.estimatedDelivery}</strong></div>
                    </div>
                  </div>

                  {/* Phân loại hàng / Dung tích (Variants) */}
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Phân Loại Hàng:
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {selectedProduct.variants.map((v, idx) => (
                        <button
                          key={v.id}
                          type="button"
                          aria-pressed={selectedVariantIndex === idx}
                          onClick={() => setSelectedVariantIndex(idx)}
                          className={`min-h-11 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                            selectedVariantIndex === idx
                              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                              : "border-border bg-background text-foreground hover:border-primary"
                          }`}
                        >
                          <span>{v.name}</span>
                          <span className="block text-[11px] opacity-75 font-mono">{formatMoney(v.priceVnd)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Số lượng */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Số Lượng:
                    </span>
                    <div className="flex min-h-11 items-center rounded-xl border border-border bg-background">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        onClick={() => setBuyerQuantity((q) => Math.max(1, q - 1))}
                        className="min-h-11 min-w-11 px-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3.5 py-1 text-sm font-semibold text-foreground tabular-nums">
                        {buyerQuantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        onClick={() => setBuyerQuantity((q) => q + 1)}
                        className="min-h-11 min-w-11 px-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Còn <strong>{selectedProduct.variants[selectedVariantIndex]?.stock || selectedProduct.stock}</strong> sản phẩm trong kho
                    </span>
                  </div>

                  {/* 2 Nút lớn Shopee - Khóa khi sản phẩm đang chờ duyệt */}
                  <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={selectedProduct.status === "pending" || selectedProduct.status === "rejected"}
                      onClick={() => toast.success(`Đã thêm ${buyerQuantity} sản phẩm vào Giỏ Hàng Shopee!`)}
                      className="min-h-12 w-full flex-1 flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary/5 px-5 text-sm font-semibold text-primary transition hover:bg-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag className="size-4.5" />
                      <span>{selectedProduct.status === "pending" ? "Đang Chờ Duyệt (Chưa Bán)" : "Thêm Vào Giỏ Hàng"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={selectedProduct.status === "pending" || selectedProduct.status === "rejected"}
                      onClick={() => {
                        toast.success(`Đang chuyển sang trang thanh toán đơn hàng ${formatMoney(selectedProduct.priceVnd * buyerQuantity)}...`);
                        router.push(`/shop/checkout?productId=${selectedProduct.id}&variant=${selectedVariantIndex}&quantity=${buyerQuantity}`);
                      }}
                      className="min-h-12 w-full flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{selectedProduct.status === "pending" ? "Chờ Admin Duyệt" : "Mua Ngay"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BẢNG CHI TIẾT THÔNG SỐ SẢN PHẨM (SPECIFICATIONS TABLE CHUẨN SHOPEE) */}
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="font-display text-base font-medium text-foreground">
                  Chi Tiết Thông Số Kỹ Thuật Sản Phẩm
                </h3>

                <div className="divide-y divide-border/70 rounded-xl border border-border bg-surface-2/50 p-4 text-xs">
                  <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 py-2 sm:grid-cols-3">
                    <span className="text-muted-foreground">Danh Mục</span>
                    <span className="text-foreground font-medium sm:col-span-2">{selectedProduct.category}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 py-2 sm:grid-cols-3">
                    <span className="text-muted-foreground">Thương Hiệu</span>
                    <span className="font-semibold text-primary sm:col-span-2">{selectedProduct.brand} (Shopee Mall)</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 py-2 sm:grid-cols-3">
                    <span className="text-muted-foreground">Xuất Xứ</span>
                    <span className="text-foreground font-medium sm:col-span-2">{selectedProduct.origin}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 py-2 sm:grid-cols-3">
                    <span className="text-muted-foreground">Loại Da Phù Hợp</span>
                    <span className="text-foreground font-medium sm:col-span-2">{selectedProduct.specifications.skinType}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 py-2 sm:grid-cols-3">
                    <span className="text-muted-foreground">Thành Phần Hoạt Chất</span>
                    <span className="font-semibold text-success sm:col-span-2">{selectedProduct.specifications.actives}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 py-2 sm:grid-cols-3">
                    <span className="text-muted-foreground">Dung Tích / Khối Lượng</span>
                    <span className="text-foreground font-medium sm:col-span-2">{selectedProduct.specifications.volume}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 py-2 sm:grid-cols-3">
                    <span className="text-muted-foreground">Hạn Sử Dụng</span>
                    <span className="text-foreground font-medium sm:col-span-2">{selectedProduct.specifications.expiryMonths} tháng kể từ NSX</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 py-2 sm:grid-cols-3">
                    <span className="text-muted-foreground">Số Công Bố (Bộ Y Tế)</span>
                    <span className="font-mono font-medium text-foreground sm:col-span-2">{selectedProduct.specifications.healthMinistryLicense}</span>
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-2 py-2 sm:grid-cols-3">
                    <span className="text-muted-foreground">Gửi Hàng Từ</span>
                    <span className="text-foreground font-medium sm:col-span-2">{selectedProduct.shippingInfo.shippingFrom}</span>
                  </div>
                </div>

                {/* Mô tả sản phẩm chi tiết */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    Mô Tả Sản Phẩm Chi Tiết
                  </h4>
                  <div className="space-y-2 rounded-xl border border-border bg-surface-2/50 p-4 text-xs leading-relaxed text-muted-foreground">
                    <p>{selectedProduct.description}</p>
                    <div>
                      <strong className="mb-0.5 block text-foreground">Hướng Dẫn Sử Dụng:</strong>
                      <p>{selectedProduct.howToUse}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-2.5 text-[11px] font-medium text-success">
                      ✓ Cam kết 100% hàng chính hãng, tem phụ tiếng Việt và hóa đơn VAT.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CÁC SẢN PHẨM KHÁC ĐÃ ĐƯỢC DUYỆT TRÊN GIAN HÀNG */}
            {buyerProducts.filter((p) => p.id !== selectedProduct.id).length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-primary" />
                    <h3 className="font-display text-base font-semibold text-foreground">
                      Sản Phẩm Đã Được Kiểm Định Khác ({buyerProducts.filter((p) => p.id !== selectedProduct.id).length} mặt hàng)
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Chỉ hiển thị các sản phẩm đã được Super Admin phê duyệt</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {buyerProducts
                    .filter((p) => p.id !== selectedProduct.id)
                    .map((bp) => (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(bp);
                          setSelectedVariantIndex(0);
                          setActiveImageIndex(0);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:border-primary/50 hover:shadow-md cursor-pointer"
                      >
                        <div className="relative aspect-square w-full overflow-hidden border-b border-border bg-surface-2">
                          {bp.coverImage ? (
                            <img
                              src={bp.coverImage}
                              alt={bp.name}
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <ProductImagePlaceholder />
                          )}
                          <span className="absolute top-2 right-2 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                            -{bp.discountPercent}%
                          </span>
                        </div>
                        <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1 text-[9px]">
                              <span className="font-semibold uppercase text-primary truncate">{bp.brand}</span>
                              <span className="text-muted-foreground truncate flex items-center gap-0.5 shrink-0 max-w-[100px]" title={bp.shopName || bp.brand}>
                                <Store className="size-2.5 shrink-0" />
                                <span className="truncate">{bp.shopName || bp.brand}</span>
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{bp.name}</h4>
                          </div>
                          <div className="pt-1 flex items-baseline justify-between">
                            <strong className="text-xs font-bold text-primary font-mono">{formatMoney(bp.priceVnd)}</strong>
                            <span className="text-[10px] text-muted-foreground">Đã bán {bp.soldCount}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: XEM ĐẦY ĐỦ THÔNG SỐ SHOPEE CỦA SẢN PHẨM (INSPECTOR MODAL) */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 max-h-[90vh] w-full max-w-3xl space-y-5 overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-3">
                {inspectingProduct.coverImage ? (
                  <img
                    src={inspectingProduct.coverImage}
                    alt={inspectingProduct.name}
                    className="size-12 shrink-0 rounded-xl border border-border object-cover"
                  />
                ) : (
                  <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-border">
                    <ProductImagePlaceholder label="" compact />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                      Shopee Mall
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">{inspectingProduct.sku}</span>
                  </div>
                  <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-foreground sm:text-base">
                    {inspectingProduct.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="min-h-11 min-w-11 text-muted-foreground transition hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* CÁC KHỐI THÔNG TIN TÁCH BIỆT RÕ RÀNG */}
            <div className="space-y-4 text-xs">
              {/* KHỐI 1: BẢNG THÔNG SỐ KỸ THUẬT & PHÁP LÝ Y TẾ */}
              <div className="space-y-2.5 rounded-xl border border-border bg-background p-4">
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <ShieldCheck className="size-3.5" />
                  <span>1. Thông số kỹ thuật & Pháp lý Y tế (Shopee Standards)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-surface-2 p-2">
                    <span className="block text-[10px] text-muted-foreground">Gian hàng sở hữu:</span>
                    <strong className="text-primary flex items-center gap-1">
                      <Store className="size-3" />
                      <span>{inspectingProduct.shopName || inspectingProduct.brand}</span>
                    </strong>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <span className="block text-[10px] text-muted-foreground">Thương hiệu & Xuất xứ:</span>
                    <strong className="text-foreground">{inspectingProduct.brand} • {inspectingProduct.origin}</strong>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <span className="block text-[10px] text-muted-foreground">Số công bố Mỹ phẩm (Bộ Y Tế):</span>
                    <strong className="font-mono text-primary">{inspectingProduct.specifications.healthMinistryLicense}</strong>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <span className="block text-[10px] text-muted-foreground">Dung tích & Trọng lượng:</span>
                    <strong className="text-foreground">{inspectingProduct.specifications.volume} ({inspectingProduct.specifications.packagingWeightGram}g)</strong>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <span className="block text-[10px] text-muted-foreground">Hạn sử dụng:</span>
                    <strong className="text-foreground">{inspectingProduct.specifications.expiryMonths} tháng kể từ NSX</strong>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2 sm:col-span-2">
                    <span className="block text-[10px] text-muted-foreground">Loại da chỉ định:</span>
                    <strong className="text-foreground">{inspectingProduct.specifications.skinType}</strong>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2 sm:col-span-2">
                    <span className="block text-[10px] text-muted-foreground">Thành phần hoạt chất chính:</span>
                    <strong className="text-success">{inspectingProduct.specifications.actives}</strong>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: PHÂN LOẠI BIẾN THỂ (VARIANTS) */}
              <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Layers className="size-3.5" />
                  <span>2. Danh sách phân loại biến thể (Dung tích / SKU)</span>
                </h4>
                <div className="space-y-1.5">
                  {inspectingProduct.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-2.5 text-xs"
                    >
                      <div>
                        <strong className="block text-foreground">{v.name}</strong>
                        <span className="font-mono text-[10px] text-muted-foreground">{v.sku}</span>
                      </div>
                      <div className="text-right">
                        <strong className="block font-mono text-primary">{formatMoney(v.priceVnd)}</strong>
                        <span className="text-[10px] font-medium text-success">Kho: {v.stock} sp</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KHỐI 3: VẬN CHUYỂN & CHÍNH SÁCH SHOPEE */}
              <div className="space-y-1.5 rounded-xl border border-border bg-background p-4 text-xs">
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Truck className="size-3.5" />
                  <span>3. Vận chuyển & Cam kết Shopee Mall</span>
                </h4>
                <div className="space-y-0.5 rounded-lg bg-surface-2 p-2.5 text-xs">
                  <div>Vận chuyển: <strong className="text-success">Freeship Xtra (Miễn phí toàn quốc)</strong></div>
                  <div>Gửi từ: <strong className="text-foreground">{inspectingProduct.shippingInfo.shippingFrom}</strong></div>
                  <div>Thời gian giao hàng: <strong className="text-foreground">{inspectingProduct.shippingInfo.estimatedDelivery}</strong></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-2.5 border-t border-border pt-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="min-h-11 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-surface-2 hover:text-foreground cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(inspectingProduct);
                  setSelectedVariantIndex(0);
                  setActiveImageIndex(0);
                  setInspectingProduct(null);
                  setViewMode("buyer");
                }}
                className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 cursor-pointer"
              >
                <Eye className="size-3" />
                <span>Xem Trên Sàn Shopee</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ĐĂNG BÁN SẢN PHẨM MỚI CHUẨN ĐẦY ĐỦ CÁC TRƯỜNG SHOPEE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 max-h-[90vh] w-full max-w-4xl space-y-5 overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Quản lý gian hàng
                </span>
                <h3 className="mt-0.5 font-display text-lg font-medium text-foreground sm:text-xl">
                  Đăng bán sản phẩm mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="min-h-11 min-w-11 text-muted-foreground transition hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-5 text-xs">
              {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
              <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
                <h4 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Package className="size-3.5" />
                  <span>1. Thông tin cơ bản</span>
                </h4>

                <div>
                  <label className="mb-1 block font-medium text-foreground">
                    Tên Sản Phẩm <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kem Dưỡng Giảm Mụn La Roche-Posay Effaclar Duo+M 40ml..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={PRODUCT_FORM_FIELD_CLASS}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block font-medium text-foreground">Mã SKU Sản Phẩm</label>
                    <input
                      type="text"
                      placeholder="SKU-LRP-01..."
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-medium text-foreground">Thương Hiệu</label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-medium text-foreground">Xuất Xứ</label>
                    <input
                      type="text"
                      value={formOrigin}
                      onChange={(e) => setFormOrigin(e.target.value)}
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-foreground">Ngành Hàng</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`${PRODUCT_FORM_FIELD_CLASS} cursor-pointer`}
                  >
                    <option value="Chăm sóc da mặt > Serum & Tinh chất">Chăm sóc da mặt &gt; Serum & Tinh chất</option>
                    <option value="Chăm sóc da mặt > Kem dưỡng & Trị mụn">Chăm sóc da mặt &gt; Kem dưỡng & Trị mụn</option>
                    <option value="Chăm sóc da mặt > Sữa rửa mặt">Chăm sóc da mặt &gt; Sữa rửa mặt</option>
                    <option value="Chăm sóc da mặt > Kem chống nắng">Chăm sóc da mặt &gt; Kem chống nắng</option>
                    <option value="Chăm sóc da mặt > Nước tẩy trang">Chăm sóc da mặt &gt; Nước tẩy trang</option>
                  </select>
                </div>

                {/* Tải ảnh từ thiết bị / chụp camera lên Cloudinary (không bắt buộc link mẫu) */}
                <div>
                  <CloudinaryProductUploader
                    images={formImages}
                    onChange={(next) => {
                      setFormImages(next);
                      setFormCoverImage(next[0] || "");
                    }}
                    shopName={currentShopName}
                    onUploadingChange={setIsUploadingImages}
                  />
                </div>
              </div>

              {/* PHẦN 2: THÔNG TIN BÁN HÀNG */}
              <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
                <h4 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Percent className="size-3.5" />
                  <span>2. Thông tin bán hàng & Giá Shopee</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block font-medium text-foreground">
                      Giá Niêm Yết (Gốc) VNĐ <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formOriginalPrice}
                      onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-foreground">
                      Giá Bán Khuyến Mãi VNĐ <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-foreground">
                      Kho Hàng (Tồn kho) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-2.5 text-xs text-muted-foreground">
                  <span>Tỷ lệ giảm giá tự động:</span>
                  <strong className="text-primary">
                    {Math.max(0, Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100))}% GIẢM
                  </strong>
                </div>
              </div>

              {/* PHẦN 3: THÔNG SỐ SẢN PHẨM & Y TẾ */}
              <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
                <h4 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <ShieldCheck className="size-3.5" />
                  <span>3. Thông số kỹ thuật & Pháp lý mỹ phẩm</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-medium text-foreground">Dung tích / Quy cách</label>
                    <input
                      type="text"
                      value={formVolume}
                      onChange={(e) => setFormVolume(e.target.value)}
                      placeholder="40ml hoặc 100ml..."
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-medium text-foreground">Trọng lượng đóng gói (Gram)</label>
                    <input
                      type="number"
                      value={formWeight}
                      onChange={(e) => setFormWeight(Number(e.target.value))}
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-medium text-foreground">Loại da phù hợp</label>
                    <input
                      type="text"
                      value={formSkinType}
                      onChange={(e) => setFormSkinType(e.target.value)}
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-medium text-foreground">Số Công Bố Mỹ Phẩm (Bộ Y Tế)</label>
                    <input
                      type="text"
                      value={formLicense}
                      onChange={(e) => setFormLicense(e.target.value)}
                      className={PRODUCT_FORM_FIELD_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-foreground">Thành phần hoạt chất chính</label>
                  <input
                    type="text"
                    value={formActives}
                    onChange={(e) => setFormActives(e.target.value)}
                    className={PRODUCT_FORM_FIELD_CLASS}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-foreground">Mô tả sản phẩm</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả công dụng sản phẩm..."
                    className={PRODUCT_FORM_FIELD_CLASS}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-foreground">Hướng dẫn sử dụng</label>
                  <input
                    type="text"
                    value={formHowToUse}
                    onChange={(e) => setFormHowToUse(e.target.value)}
                    placeholder="Thoa sau bước làm sạch..."
                    className={PRODUCT_FORM_FIELD_CLASS}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse justify-end gap-2.5 border-t border-border pt-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-11 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-surface-2 hover:text-foreground cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded-xl bg-primary px-6 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-[0.98] cursor-pointer"
                >
                  Xác Nhận Đăng Bán Lên Shopee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
