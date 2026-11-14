"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";

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
export interface ShopeeProduct {
  id: string;
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
  status: "active" | "hidden" | "out_of_stock";
  createdAt: string;
}

// 9 Verified authentic cosmetic products with consistent single-product gallery images
export const INITIAL_SHOPEE_PRODUCTS: ShopeeProduct[] = [
  {
    id: "sp_01",
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
      { id: "var_03", name: "Chai 236ml", priceVnd: 280000, originalPriceVnd: 330000, stock: 90, sku: "CERAVE-236ML" },
      { id: "var_04", name: "Chai 473ml Tiết Kiệm", priceVnd: 380000, originalPriceVnd: 450000, stock: 130, sku: "CERAVE-473ML" },
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
      { id: "var_10", name: "Chai 200ml", priceVnd: 285000, originalPriceVnd: 340000, stock: 75, sku: "LRP-MICELLAR-200ML" },
      { id: "var_11", name: "Chai 400ml Tiết Kiệm", priceVnd: 435000, originalPriceVnd: 515000, stock: 120, sku: "LRP-MICELLAR-400ML" },
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

export default function ShopProductPage() {
  const router = useRouter();
  // Page mode: "seller" (Shopee Seller Center) vs "buyer" (Shopee Marketplace Storefront)
  const [viewMode, setViewMode] = useState<"seller" | "buyer">("seller");

  // Products state - Exactly 9 authentic products
  const [products, setProducts] = useState<ShopeeProduct[]>(INITIAL_SHOPEE_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<ShopeeProduct>(INITIAL_SHOPEE_PRODUCTS[0]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [buyerQuantity, setBuyerQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

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
  const [formCoverImage, setFormCoverImage] = useState(
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  );
  const [formSkinType, setFormSkinType] = useState("Mọi loại da, da mụn nhạy cảm");
  const [formVolume, setFormVolume] = useState("50ml");
  const [formActives, setFormActives] = useState("Niacinamide, B5, Salicylic Acid");
  const [formLicense, setFormLicense] = useState("20491/24/CBMP-QLD");
  const [formDescription, setFormDescription] = useState("");
  const [formHowToUse, setFormHowToUse] = useState("");
  const [formWeight, setFormWeight] = useState<number>(120);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === "all" || p.category.includes(categoryFilter);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Handle Add Product submit
  function handleAddProductSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    if (!formCoverImage.trim()) {
      toast.error("Vui lòng nhập link ảnh sản phẩm!");
      return;
    }

    const discountPct = Math.max(
      0,
      Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100),
    );

    const newShopeeProduct: ShopeeProduct = {
      id: `sp_${Date.now()}`,
      sku: formSku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      name: formName.trim(),
      category: formCategory,
      brand: formBrand.trim() || "Chính Hãng",
      origin: formOrigin.trim() || "Nhập khẩu",
      isMall: true,
      isPreferredPlus: true,
      coverImage: formCoverImage.trim(),
      images: [formCoverImage.trim()],
      priceVnd: Number(formPrice),
      originalPriceVnd: Number(formOriginalPrice),
      discountPercent: discountPct,
      stock: Number(formStock),
      soldCount: 0,
      rating: 5.0,
      reviewCount: 0,
      shippingInfo: {
        freeShipExtra: true,
        shippingFrom: "TP. Hồ Chí Minh",
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
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setProducts((prev) => [newShopeeProduct, ...prev]);
    setIsAddModalOpen(false);
    toast.success(`Đã đăng bán thành công sản phẩm "${newShopeeProduct.name}" lên sàn Shopee!`);
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
    <div className="min-h-screen bg-[#E8E5DE] text-[#191B19] antialiased">
      {/* Top Header - Shopee Style with SkinSense Palette */}
      <header className="sticky top-0 z-40 border-b border-[#D8D4CA] bg-[#E8E5DE]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <LogoMark className="size-8 transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-[#191B19] leading-tight">
                  SkinSense <span className="text-[#C2410C] font-sans text-[11px] font-bold tracking-wider">SHOPEE MALL</span>
                </span>
                <span className="text-[11px] font-medium text-[#5C605C]">
                  Kênh Bán Hàng & Quản Lý Sản Phẩm Chuẩn Shopee
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-[#D8D4CA]" />

            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-[#C2410C]/30 bg-[#C2410C]/10 px-3 py-0.5 text-xs font-bold text-[#C2410C]">
              <Store className="size-3.5" />
              <span>La Roche-Posay Official Store</span>
              <span className="rounded bg-rose-600 px-1 py-0.2 text-[9px] text-white font-bold">Shopee Mall</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle: Seller Center vs Buyer Storefront */}
            <div className="flex items-center rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("seller")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "seller"
                    ? "bg-[#C2410C] text-white shadow-xs"
                    : "text-[#5C605C] hover:text-[#191B19]"
                }`}
              >
                <Store className="size-3.5" />
                <span>Kênh Người Bán</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("buyer")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  viewMode === "buyer"
                    ? "bg-[#2D5A43] text-white shadow-xs"
                    : "text-[#5C605C] hover:text-[#191B19]"
                }`}
              >
                <ShoppingBag className="size-3.5" />
                <span>Xem Giao Diện Mua Hàng</span>
              </button>
            </div>

            <Link
              href="/shop/checkout"
              className="flex items-center gap-1.5 rounded-xl border border-[#C2410C]/40 bg-[#C2410C]/10 px-3 py-1.5 text-xs font-bold text-[#C2410C] hover:bg-[#C2410C] hover:text-white transition shadow-2xs"
            >
              <ShoppingBag className="size-3.5" />
              <span>Thanh Toán</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3 py-1.5 text-xs font-semibold text-[#5C605C] transition hover:text-[#191B19]"
            >
              <Home className="size-3.5" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 space-y-6">
        {/* SELLER CENTER MODE (QUẢN LÝ ĐĂNG BÁN SẢN PHẨM CHUẨN SHOPEE) */}
        {viewMode === "seller" && (
          <div className="space-y-6">
            {/* Top Seller Overview Stats - Compact & Balanced */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3 px-1">
                <div className="rounded-xl bg-[#C2410C]/10 p-2.5 text-[#C2410C] shrink-0">
                  <Package className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#5C605C] uppercase tracking-wider block">
                    Sản phẩm đang bán
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-serif text-[#191B19]">
                    {products.length} <span className="text-xs font-sans font-normal text-[#5C605C]">mặt hàng</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-1 border-l border-[#D8D4CA]/70">
                <div className="rounded-xl bg-[#2D5A43]/10 p-2.5 text-[#2D5A43] shrink-0">
                  <ShoppingBag className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#5C605C] uppercase tracking-wider block">
                    Tổng lượt đã bán
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-serif text-[#2D5A43]">
                    {products.reduce((acc, p) => acc + p.soldCount, 0).toLocaleString()} <span className="text-xs font-sans font-normal text-[#5C605C]">đã giao</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-1 border-l border-[#D8D4CA]/70">
                <div className="rounded-xl bg-amber-700/10 p-2.5 text-amber-800 shrink-0">
                  <Star className="size-5 fill-amber-700" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#5C605C] uppercase tracking-wider block">
                    Đánh giá Shop
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-serif text-amber-900">
                    4.9 / 5.0 <span className="text-xs font-sans font-normal text-[#5C605C]">(99%)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-1 border-l border-[#D8D4CA]/70">
                <div className="rounded-xl bg-[#C2410C]/10 p-2.5 text-[#C2410C] shrink-0">
                  <Truck className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#5C605C] uppercase tracking-wider block">
                    Vận chuyển Shopee
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-serif text-[#191B19]">
                    100% <span className="text-xs font-sans font-normal text-[#C2410C]">Freeship</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar: Title, Search & "+ Thêm Sản Phẩm Mới" */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8D4CA] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Grid3X3 className="size-5 text-[#C2410C]" />
                  <h2 className="text-lg sm:text-xl font-bold font-serif text-[#191B19]">
                    Danh Mục Sản Phẩm ({filteredProducts.length} mặt hàng)
                  </h2>
                </div>
                <p className="text-xs text-[#5C605C] mt-0.5">
                  Bố cục dạng Khối vừa vặn, gọn gàng, tách biệt các trường thông tin chuẩn sàn Shopee.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#C2410C] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#9A3412] transition active:scale-[0.98] cursor-pointer self-start sm:self-auto"
              >
                <Plus className="size-4" />
                <span>+ Đăng Bán Sản Phẩm Mới</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-3 shadow-2xs">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#5C605C]" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm theo tên, mã SKU, thương hiệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white py-2 pl-10 pr-3 text-xs text-[#191B19] placeholder:text-[#5C605C]/70 focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs">
                  <Filter className="size-3.5 text-[#5C605C]" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-xs font-medium text-[#191B19] focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả ngành hàng</option>
                    <option value="Trị mụn">Kem dưỡng & Trị mụn</option>
                    <option value="Sữa rửa mặt">Sữa rửa mặt</option>
                    <option value="Serum">Serum & Tinh chất</option>
                    <option value="Kem chống nắng">Kem chống nắng</option>
                    <option value="Nước tẩy trang">Nước tẩy trang</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-medium text-[#191B19] focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang bán trên sàn</option>
                    <option value="out_of_stock">Hết hàng</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PRODUCT GRID - 4 CỘT VỪA VẶN, BỎ VẠCH ĐEN, 3 NÚT ĐỒNG NHẤT, BỎ GẠCH DƯỚI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {filteredProducts.map((prod) => {
                const activeTab = cardActiveTab[prod.id] || "sales";

                return (
                  <div
                    key={prod.id}
                    className="group rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] overflow-hidden shadow-2xs hover:border-[#C2410C]/60 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    {/* KHỐI 1: HÌNH ẢNH SẢN PHẨM (Không có vệt đen che ảnh, ảnh 1:1 trong sáng) */}
                    <div>
                      <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden border-b border-[#D8D4CA]/80">
                        <img
                          src={prod.coverImage}
                          alt={prod.name}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Overlay Badges Shopee Mall & Freeship */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                          {prod.isMall && (
                            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs flex items-center gap-1">
                              <BadgeCheck className="size-2.5" />
                              <span>Mall</span>
                            </span>
                          )}
                          <span className="rounded bg-[#2D5A43] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs flex items-center gap-1">
                            <Truck className="size-2.5" />
                            <span>Freeship Xtra</span>
                          </span>
                        </div>

                        <span className="absolute top-2.5 right-2.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          -{prod.discountPercent}%
                        </span>
                      </div>

                      {/* KHỐI 2: BRAND, SKU, TIÊU ĐỀ & ĐÁNH GIÁ (Sạch sẽ, không bị màu đen che) */}
                      <div className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] text-[#5C605C]">
                          <span className="font-semibold text-[#C2410C] uppercase tracking-wider truncate max-w-[150px]">
                            {prod.brand}
                          </span>
                          <span className="font-mono text-[10px] text-[#5C605C] shrink-0">
                            {prod.sku}
                          </span>
                        </div>

                        <h3
                          className="font-bold text-sm text-[#191B19] leading-snug line-clamp-2 min-h-[38px]"
                          title={prod.name}
                        >
                          {prod.name}
                        </h3>

                        {/* Điểm sao & Đã bán */}
                        <div className="flex items-center justify-between text-[11px] text-[#5C605C] pt-0.5">
                          <div className="flex items-center gap-1 text-amber-800 font-bold">
                            <Star className="size-3 fill-amber-700 text-amber-700" />
                            <span>{prod.rating}</span>
                            <span className="text-[10px] font-normal text-[#5C605C]">({prod.reviewCount})</span>
                          </div>
                          <div>
                            Đã bán: <strong className="text-[#191B19]">{prod.soldCount.toLocaleString()}</strong>
                          </div>
                        </div>

                        {/* 3 NÚT TAB ĐỒNG NHẤT - Không có viền tròn bao ngoài, vuông bo góc chuẩn chỉ */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCardActiveTab((prev) => ({ ...prev, [prod.id]: "sales" }))
                            }
                            className={`flex-1 py-1 px-1.5 text-[11px] font-bold rounded-lg transition text-center cursor-pointer ${
                              activeTab === "sales"
                                ? "bg-[#C2410C] text-white shadow-2xs"
                                : "bg-white text-[#5C605C] border border-[#D8D4CA] hover:text-[#191B19]"
                            }`}
                          >
                            Giá & Voucher
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCardActiveTab((prev) => ({ ...prev, [prod.id]: "specs" }))
                            }
                            className={`flex-1 py-1 px-1.5 text-[11px] font-bold rounded-lg transition text-center cursor-pointer ${
                              activeTab === "specs"
                                ? "bg-[#C2410C] text-white shadow-2xs"
                                : "bg-white text-[#5C605C] border border-[#D8D4CA] hover:text-[#191B19]"
                            }`}
                          >
                            Thông Số
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCardActiveTab((prev) => ({ ...prev, [prod.id]: "variants" }))
                            }
                            className={`flex-1 py-1 px-1.5 text-[11px] font-bold rounded-lg transition text-center cursor-pointer ${
                              activeTab === "variants"
                                ? "bg-[#C2410C] text-white shadow-2xs"
                                : "bg-white text-[#5C605C] border border-[#D8D4CA] hover:text-[#191B19]"
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
                              <div className="rounded-xl bg-white border border-[#D8D4CA] p-2.5 flex items-baseline justify-between">
                                <div>
                                  <span className="text-[9px] text-[#5C605C] block uppercase font-semibold">
                                    Giá Shopee:
                                  </span>
                                  <div className="text-base font-bold font-serif text-[#C2410C]">
                                    {formatMoney(prod.priceVnd)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[11px] text-[#5C605C] line-through block">
                                    {formatMoney(prod.originalPriceVnd)}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#2D5A43]">
                                    Kho: {prod.stock}
                                  </span>
                                </div>
                              </div>

                              {/* Vouchers của Shop */}
                              <div className="flex flex-wrap gap-1">
                                {prod.vouchers.map((vc) => (
                                  <span
                                    key={vc.id}
                                    className="rounded border border-dashed border-[#C2410C]/40 bg-[#C2410C]/5 px-1.5 py-0.5 text-[9px] font-bold text-[#C2410C]"
                                  >
                                    {vc.discountLabel}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* PHẦN B: BẢNG THÔNG SỐ KỸ THUẬT Y TẾ */}
                          {activeTab === "specs" && (
                            <div className="rounded-xl bg-white border border-[#D8D4CA] p-2.5 text-[11px] space-y-1 divide-y divide-[#D8D4CA]/50">
                              <div className="flex justify-between items-center py-0.5">
                                <span className="text-[#5C605C]">Loại da:</span>
                                <span className="font-semibold text-[#191B19] truncate max-w-[130px]" title={prod.specifications.skinType}>
                                  {prod.specifications.skinType}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-0.5">
                                <span className="text-[#5C605C]">Dung tích:</span>
                                <span className="font-semibold text-[#191B19]">{prod.specifications.volume}</span>
                              </div>
                              <div className="flex justify-between items-center py-0.5">
                                <span className="text-[#5C605C]">Số CB:</span>
                                <span className="font-mono font-semibold text-[#C2410C] text-[10px]">
                                  {prod.specifications.healthMinistryLicense}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-0.5">
                                <span className="text-[#5C605C]">Hạn dùng:</span>
                                <span className="font-semibold text-[#191B19]">{prod.specifications.expiryMonths} tháng</span>
                              </div>
                            </div>
                          )}

                          {/* PHẦN C: CÁC BIẾN THỂ DUNG TÍCH (Variants) */}
                          {activeTab === "variants" && (
                            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                              {prod.variants.map((v) => (
                                <div
                                  key={v.id}
                                  className="rounded-lg border border-[#D8D4CA] bg-white p-2 flex items-center justify-between text-[11px]"
                                >
                                  <div>
                                    <strong className="text-[#191B19] block">{v.name}</strong>
                                    <span className="text-[9px] text-[#5C605C] font-mono">{v.sku}</span>
                                  </div>
                                  <div className="text-right">
                                    <strong className="text-[#C2410C] font-mono block">{formatMoney(v.priceVnd)}</strong>
                                    <span className="text-[9px] text-[#2D5A43]">Kho: {v.stock}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* KHỐI 3: THANH NÚT THAO TÁC - ĐÃ BỎ GẠCH KẺ NGANG THEO ĐÚNG YÊU CẦU */}
                    <div className="p-3.5 pt-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInspectingProduct(prod)}
                        className="flex-1 h-9 flex items-center justify-center gap-1 rounded-xl border border-[#D8D4CA] bg-white text-[11px] font-bold text-[#191B19] hover:bg-[#E8E5DE] transition cursor-pointer"
                        title="Xem đầy đủ mọi trường thông số Shopee"
                      >
                        <FileText className="size-3 text-[#5C605C]" />
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
                        className="flex-1 h-9 flex items-center justify-center gap-1 rounded-xl bg-[#C2410C] text-[11px] font-bold text-white shadow-2xs hover:bg-[#9A3412] transition cursor-pointer"
                        title="Xem giao diện mua hàng chuẩn sàn Shopee"
                      >
                        <Eye className="size-3" />
                        <span>Xem Trên Sàn</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="size-9 flex items-center justify-center rounded-xl border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 transition cursor-pointer shrink-0"
                        title="Xóa khỏi gian hàng"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BUYER STOREFRONT MODE (GIAO DIỆN MUA HÀNG CHUẨN 100% SHOPEE MALL) */}
        {viewMode === "buyer" && selectedProduct && (
          <div className="space-y-6">
            {/* Back button & Breadcrumbs */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMode("seller")}
                className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-1.5 text-xs font-bold text-[#191B19] hover:bg-[#E8E5DE] transition cursor-pointer"
              >
                <ArrowRight className="size-3.5 rotate-180" />
                <span>Quay lại Kênh Quản Lý Người Bán</span>
              </button>

              <div className="text-xs text-[#5C605C] hidden sm:block">
                Shopee {">"} {selectedProduct.category} {">"} <strong className="text-[#191B19]">{selectedProduct.brand}</strong>
              </div>
            </div>

            {/* SHOPEE MAIN PRODUCT CARD - TÁCH CÁC PHẦN RÕ RÀNG */}
            <div className="rounded-3xl border border-[#D8D4CA] bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left: Product Gallery Images (5 cols) - Cùng 1 mặt hàng */}
                <div className="lg:col-span-5 space-y-3.5">
                  {/* Big Cover Image */}
                  <div className="relative aspect-square w-full rounded-2xl border border-[#D8D4CA] bg-neutral-100 overflow-hidden shadow-2xs">
                    <img
                      src={selectedProduct.images[activeImageIndex] || selectedProduct.coverImage}
                      alt={selectedProduct.name}
                      className="size-full object-cover"
                    />
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
                          activeImageIndex === i ? "border-[#C2410C] ring-2 ring-[#C2410C]/20" : "border-[#D8D4CA] opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img src={imgUrl} alt={`Góc chụp ${i + 1}`} className="size-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Shopee Guarantee banner */}
                  <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] border border-[#D8D4CA] p-3 text-xs text-[#5C605C]">
                    <span className="flex items-center gap-1.5 font-semibold text-[#191B19]">
                      <ShieldCheck className="size-4 text-[#2D5A43]" />
                      <span>Shopee Đảm Bảo</span>
                    </span>
                    <span>3 Ngày Trả Hàng / Hoàn Tiền 100%</span>
                  </div>
                </div>

                {/* Right: Product Details & Buying Actions (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Title & Brand */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                        Mall
                      </span>
                      <span className="rounded bg-[#C2410C]/15 px-2 py-0.5 text-xs font-bold text-[#C2410C]">
                        {selectedProduct.brand} Chính Hãng
                      </span>
                      <span className="text-xs text-[#5C605C] font-mono">
                        SKU: {selectedProduct.sku}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-[#191B19] leading-snug">
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
                      <span className="text-[#D8D4CA]">•</span>
                      <div>
                        <strong className="text-[#191B19] border-b border-[#191B19]">
                          {selectedProduct.reviewCount.toLocaleString()}
                        </strong>{" "}
                        <span className="text-[#5C605C]">Đánh Giá</span>
                      </div>
                      <span className="text-[#D8D4CA]">•</span>
                      <div>
                        <strong className="text-[#191B19]">{selectedProduct.soldCount.toLocaleString()}</strong>{" "}
                        <span className="text-[#5C605C]">Đã Bán</span>
                      </div>
                    </div>
                  </div>

                  {/* SHOPEE FLASH SALE PRICE BOX (Nền kem cam đặc trưng Shopee) */}
                  <div className="rounded-2xl bg-[#FAF8F5] border border-[#C2410C]/25 p-4 sm:p-5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C2410C]">
                      <Sparkles className="size-3.5" />
                      <span>Giá Khuyến Mãi Shopee Mall</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-2xl sm:text-3xl font-bold font-serif text-[#C2410C]">
                        {formatMoney(
                          selectedProduct.variants[selectedVariantIndex]?.priceVnd || selectedProduct.priceVnd,
                        )}
                      </span>
                      <span className="text-sm text-[#5C605C] line-through">
                        {formatMoney(
                          selectedProduct.variants[selectedVariantIndex]?.originalPriceVnd || selectedProduct.originalPriceVnd,
                        )}
                      </span>
                      <span className="rounded bg-[#C2410C] px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                        -{selectedProduct.discountPercent}% GIẢM
                      </span>
                    </div>
                  </div>

                  {/* Shop Vouchers */}
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-xs font-bold text-[#5C605C] uppercase tracking-wider block">
                      Mã Giảm Giá Của Shop:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedProduct.vouchers.map((vc) => (
                        <div
                          key={vc.id}
                          className="flex items-center gap-1 rounded-lg border border-dashed border-[#C2410C] bg-[#C2410C]/5 px-2.5 py-1 text-xs font-bold text-[#C2410C]"
                        >
                          <Tag className="size-3" />
                          <span>{vc.discountLabel}</span>
                          <span className="text-[10px] text-[#5C605C] font-normal">({vc.minSpendLabel})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vận chuyển Shopee */}
                  <div className="rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#2D5A43] font-bold">
                      <Truck className="size-4" />
                      <span>Vận Chuyển: Miễn Phí Vận Chuyển (Freeship Xtra)</span>
                    </div>
                    <div className="text-xs text-[#5C605C] pl-5 space-y-0.5">
                      <div>Gửi hàng từ: <strong className="text-[#191B19]">{selectedProduct.shippingInfo.shippingFrom}</strong></div>
                      <div>Dự kiến nhận hàng: <strong className="text-[#191B19]">{selectedProduct.shippingInfo.estimatedDelivery}</strong></div>
                    </div>
                  </div>

                  {/* Phân loại hàng / Dung tích (Variants) */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#5C605C] uppercase tracking-wider block">
                      Phân Loại Hàng:
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {selectedProduct.variants.map((v, idx) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantIndex(idx)}
                          className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                            selectedVariantIndex === idx
                              ? "border-[#C2410C] bg-[#C2410C]/10 text-[#C2410C] ring-2 ring-[#C2410C]/30"
                              : "border-[#D8D4CA] bg-white text-[#191B19] hover:border-[#C2410C]"
                          }`}
                        >
                          <span>{v.name}</span>
                          <span className="block text-[11px] opacity-75 font-mono">{formatMoney(v.priceVnd)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Số lượng */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs font-bold text-[#5C605C] uppercase tracking-wider">
                      Số Lượng:
                    </span>
                    <div className="flex items-center rounded-xl border border-[#D8D4CA] bg-white">
                      <button
                        type="button"
                        onClick={() => setBuyerQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1 text-sm font-bold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3.5 py-1 text-xs font-bold text-[#191B19] font-mono">
                        {buyerQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBuyerQuantity((q) => q + 1)}
                        className="px-3 py-1 text-sm font-bold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-[#5C605C]">
                      Còn <strong>{selectedProduct.variants[selectedVariantIndex]?.stock || selectedProduct.stock}</strong> sản phẩm trong kho
                    </span>
                  </div>

                  {/* 2 Nút lớn Shopee - ĐÃ XÓA CHỮ (FLASHSALE) THEO ĐÚNG YÊU CẦU */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => toast.success(`Đã thêm ${buyerQuantity} sản phẩm vào Giỏ Hàng Shopee!`)}
                      className="h-11 flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#C2410C] bg-[#C2410C]/10 px-5 text-sm font-bold text-[#C2410C] hover:bg-[#C2410C]/20 transition cursor-pointer w-full"
                    >
                      <ShoppingBag className="size-4.5" />
                      <span>Thêm Vào Giỏ Hàng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        toast.success(`Đang chuyển sang trang thanh toán đơn hàng ${formatMoney(selectedProduct.priceVnd * buyerQuantity)}...`);
                        router.push("/shop/checkout");
                      }}
                      className="h-11 flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#C2410C] px-5 text-sm font-bold text-white shadow-xs hover:bg-[#9A3412] transition active:scale-[0.98] cursor-pointer w-full"
                    >
                      <span>Mua Ngay</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BẢNG CHI TIẾT THÔNG SỐ SẢN PHẨM (SPECIFICATIONS TABLE CHUẨN SHOPEE) */}
              <div className="border-t border-[#D8D4CA] pt-6 space-y-4">
                <h3 className="text-base font-bold font-serif text-[#191B19]">
                  Chi Tiết Thông Số Kỹ Thuật Sản Phẩm
                </h3>

                <div className="rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 divide-y divide-[#D8D4CA]/70 text-xs">
                  <div className="py-2 grid grid-cols-3">
                    <span className="text-[#5C605C]">Danh Mục</span>
                    <span className="col-span-2 text-[#191B19] font-medium">{selectedProduct.category}</span>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <span className="text-[#5C605C]">Thương Hiệu</span>
                    <span className="col-span-2 text-[#C2410C] font-bold">{selectedProduct.brand} (Shopee Mall)</span>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <span className="text-[#5C605C]">Xuất Xứ</span>
                    <span className="col-span-2 text-[#191B19] font-medium">{selectedProduct.origin}</span>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <span className="text-[#5C605C]">Loại Da Phù Hợp</span>
                    <span className="col-span-2 text-[#191B19] font-medium">{selectedProduct.specifications.skinType}</span>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <span className="text-[#5C605C]">Thành Phần Hoạt Chất</span>
                    <span className="col-span-2 text-[#2D5A43] font-semibold">{selectedProduct.specifications.actives}</span>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <span className="text-[#5C605C]">Dung Tích / Khối Lượng</span>
                    <span className="col-span-2 text-[#191B19] font-medium">{selectedProduct.specifications.volume}</span>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <span className="text-[#5C605C]">Hạn Sử Dụng</span>
                    <span className="col-span-2 text-[#191B19] font-medium">{selectedProduct.specifications.expiryMonths} tháng kể từ NSX</span>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <span className="text-[#5C605C]">Số Công Bố (Bộ Y Tế)</span>
                    <span className="col-span-2 text-[#191B19] font-mono font-medium">{selectedProduct.specifications.healthMinistryLicense}</span>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <span className="text-[#5C605C]">Gửi Hàng Từ</span>
                    <span className="col-span-2 text-[#191B19] font-medium">{selectedProduct.shippingInfo.shippingFrom}</span>
                  </div>
                </div>

                {/* Mô tả sản phẩm chi tiết */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-sm font-bold text-[#191B19]">
                    Mô Tả Sản Phẩm Chi Tiết
                  </h4>
                  <div className="rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 text-xs text-[#4A4D4A] leading-relaxed space-y-2">
                    <p>{selectedProduct.description}</p>
                    <div>
                      <strong className="text-[#191B19] block mb-0.5">Hướng Dẫn Sử Dụng Chuẩn Y Khoa:</strong>
                      <p>{selectedProduct.howToUse}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-[#D8D4CA] p-2.5 text-[11px] text-[#2D5A43] font-medium">
                      ✓ Cam kết 100% hàng chính hãng, tem phụ tiếng Việt và hóa đơn VAT.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: XEM ĐẦY ĐỦ THÔNG SỐ SHOPEE CỦA SẢN PHẨM (INSPECTOR MODAL) */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 sm:p-7 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D8D4CA] pb-3.5">
              <div className="flex items-center gap-3">
                <img
                  src={inspectingProduct.coverImage}
                  alt={inspectingProduct.name}
                  className="size-12 rounded-xl object-cover border border-[#D8D4CA] shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                      Shopee Mall
                    </span>
                    <span className="text-[11px] font-mono text-[#5C605C]">{inspectingProduct.sku}</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#191B19] mt-0.5 line-clamp-1">
                    {inspectingProduct.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="text-[#5C605C] hover:text-[#191B19] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* CÁC KHỐI THÔNG TIN TÁCH BIỆT RÕ RÀNG */}
            <div className="space-y-4 text-xs">
              {/* KHỐI 1: BẢNG THÔNG SỐ KỸ THUẬT & PHÁP LÝ Y TẾ */}
              <div className="rounded-xl border border-[#D8D4CA] bg-white p-4 space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  <span>1. Thông số kỹ thuật & Pháp lý Y tế (Shopee Standards)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#FAF8F5]">
                    <span className="text-[#5C605C] text-[10px] block">Thương hiệu & Xuất xứ:</span>
                    <strong className="text-[#191B19]">{inspectingProduct.brand} • {inspectingProduct.origin}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAF8F5]">
                    <span className="text-[#5C605C] text-[10px] block">Số công bố Mỹ phẩm (Bộ Y Tế):</span>
                    <strong className="text-[#C2410C] font-mono">{inspectingProduct.specifications.healthMinistryLicense}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAF8F5]">
                    <span className="text-[#5C605C] text-[10px] block">Dung tích & Trọng lượng:</span>
                    <strong className="text-[#191B19]">{inspectingProduct.specifications.volume} ({inspectingProduct.specifications.packagingWeightGram}g)</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAF8F5]">
                    <span className="text-[#5C605C] text-[10px] block">Hạn sử dụng:</span>
                    <strong className="text-[#191B19]">{inspectingProduct.specifications.expiryMonths} tháng kể từ NSX</strong>
                  </div>
                  <div className="sm:col-span-2 p-2 rounded-lg bg-[#FAF8F5]">
                    <span className="text-[#5C605C] text-[10px] block">Loại da chỉ định:</span>
                    <strong className="text-[#191B19]">{inspectingProduct.specifications.skinType}</strong>
                  </div>
                  <div className="sm:col-span-2 p-2 rounded-lg bg-[#FAF8F5]">
                    <span className="text-[#5C605C] text-[10px] block">Thành phần hoạt chất chính:</span>
                    <strong className="text-[#2D5A43]">{inspectingProduct.specifications.actives}</strong>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: PHÂN LOẠI BIẾN THỂ (VARIANTS) */}
              <div className="rounded-xl border border-[#D8D4CA] bg-white p-4 space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] flex items-center gap-1.5">
                  <Layers className="size-3.5" />
                  <span>2. Danh sách phân loại biến thể (Dung tích / SKU)</span>
                </h4>
                <div className="space-y-1.5">
                  {inspectingProduct.variants.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-lg border border-[#D8D4CA] bg-[#FAF8F5] p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-[#191B19] block">{v.name}</strong>
                        <span className="text-[10px] text-[#5C605C] font-mono">{v.sku}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-[#C2410C] font-mono block">{formatMoney(v.priceVnd)}</strong>
                        <span className="text-[10px] text-[#2D5A43] font-medium">Kho: {v.stock} sp</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KHỐI 3: VẬN CHUYỂN & CHÍNH SÁCH SHOPEE */}
              <div className="rounded-xl border border-[#D8D4CA] bg-white p-4 space-y-1.5 text-xs">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] flex items-center gap-1.5">
                  <Truck className="size-3.5" />
                  <span>3. Vận chuyển & Cam kết Shopee Mall</span>
                </h4>
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] space-y-0.5 text-xs">
                  <div>Vận chuyển: <strong className="text-[#2D5A43]">Freeship Xtra (Miễn phí toàn quốc)</strong></div>
                  <div>Gửi từ: <strong className="text-[#191B19]">{inspectingProduct.shippingInfo.shippingFrom}</strong></div>
                  <div>Thời gian giao hàng: <strong className="text-[#191B19]">{inspectingProduct.shippingInfo.estimatedDelivery}</strong></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D8D4CA]">
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="rounded-xl border border-[#D8D4CA] bg-white px-4 py-2 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
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
                className="rounded-xl bg-[#C2410C] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#9A3412] cursor-pointer flex items-center gap-1"
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
          <div className="w-full max-w-4xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 sm:p-7 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3.5">
              <div>
                <span className="rounded-md bg-[#C2410C]/15 px-2 py-0.5 text-[10px] font-bold text-[#C2410C]">
                  Shopee Seller Center
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-[#191B19] mt-0.5">
                  Đăng Bán Sản Phẩm Mỹ Phẩm Mới (Đầy đủ các trường Shopee)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#5C605C] hover:text-[#191B19] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-5 text-xs">
              {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
              <div className="rounded-2xl border border-[#D8D4CA] bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#C2410C] uppercase tracking-wider flex items-center gap-1">
                  <Package className="size-3.5" />
                  <span>1. Thông tin cơ bản</span>
                </h4>

                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">
                    Tên Sản Phẩm <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kem Dưỡng Giảm Mụn La Roche-Posay Effaclar Duo+M 40ml..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Mã SKU Sản Phẩm</label>
                    <input
                      type="text"
                      placeholder="SKU-LRP-01..."
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Thương Hiệu</label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Xuất Xứ</label>
                    <input
                      type="text"
                      value={formOrigin}
                      onChange={(e) => setFormOrigin(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Ngành Hàng</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C] cursor-pointer"
                  >
                    <option value="Chăm sóc da mặt > Serum & Tinh chất">Chăm sóc da mặt &gt; Serum & Tinh chất</option>
                    <option value="Chăm sóc da mặt > Kem dưỡng & Trị mụn">Chăm sóc da mặt &gt; Kem dưỡng & Trị mụn</option>
                    <option value="Chăm sóc da mặt > Sữa rửa mặt">Chăm sóc da mặt &gt; Sữa rửa mặt</option>
                    <option value="Chăm sóc da mặt > Kem chống nắng">Chăm sóc da mặt &gt; Kem chống nắng</option>
                    <option value="Chăm sóc da mặt > Nước tẩy trang">Chăm sóc da mặt &gt; Nước tẩy trang</option>
                  </select>
                </div>

                {/* Link ảnh bìa với preview */}
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">
                    Link Ảnh Bìa Sản Phẩm (Tỷ lệ 1:1) <span className="text-rose-600">* Bắt buộc</span>
                  </label>
                  <div className="flex gap-2.5">
                    <input
                      type="url"
                      required
                      value={formCoverImage}
                      onChange={(e) => setFormCoverImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                    {formCoverImage && (
                      <img
                        src={formCoverImage}
                        alt="Preview"
                        className="size-9 rounded-lg object-cover border border-[#D8D4CA]"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* PHẦN 2: THÔNG TIN BÁN HÀNG */}
              <div className="rounded-2xl border border-[#D8D4CA] bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#C2410C] uppercase tracking-wider flex items-center gap-1">
                  <Percent className="size-3.5" />
                  <span>2. Thông tin bán hàng & Giá Shopee</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">
                      Giá Niêm Yết (Gốc) VNĐ <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formOriginalPrice}
                      onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">
                      Giá Bán Khuyến Mãi VNĐ <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">
                      Kho Hàng (Tồn kho) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-[#FAF8F5] border border-[#D8D4CA] p-2.5 text-xs text-[#5C605C] flex items-center justify-between">
                  <span>Tỷ lệ giảm giá tự động:</span>
                  <strong className="text-[#C2410C]">
                    {Math.max(0, Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100))}% GIẢM
                  </strong>
                </div>
              </div>

              {/* PHẦN 3: THÔNG SỐ SẢN PHẨM & Y TẾ */}
              <div className="rounded-2xl border border-[#D8D4CA] bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#C2410C] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="size-3.5" />
                  <span>3. Thông số kỹ thuật & Pháp lý mỹ phẩm</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Dung tích / Quy cách</label>
                    <input
                      type="text"
                      value={formVolume}
                      onChange={(e) => setFormVolume(e.target.value)}
                      placeholder="40ml hoặc 100ml..."
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Trọng lượng đóng gói (Gram)</label>
                    <input
                      type="number"
                      value={formWeight}
                      onChange={(e) => setFormWeight(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Loại da phù hợp</label>
                    <input
                      type="text"
                      value={formSkinType}
                      onChange={(e) => setFormSkinType(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Số Công Bố Mỹ Phẩm (Bộ Y Tế)</label>
                    <input
                      type="text"
                      value={formLicense}
                      onChange={(e) => setFormLicense(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Thành phần hoạt chất chính</label>
                  <input
                    type="text"
                    value={formActives}
                    onChange={(e) => setFormActives(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Mô tả sản phẩm</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả công dụng sản phẩm..."
                    className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Hướng dẫn sử dụng</label>
                  <input
                    type="text"
                    value={formHowToUse}
                    onChange={(e) => setFormHowToUse(e.target.value)}
                    placeholder="Thoa sau bước làm sạch..."
                    className="w-full rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D8D4CA]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-[#D8D4CA] bg-white px-4 py-2 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#C2410C] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#9A3412] active:scale-[0.98] cursor-pointer"
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
