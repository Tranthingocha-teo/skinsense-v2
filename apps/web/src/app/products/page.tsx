"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBag,
  Search,
  Filter,
  Star,
  ShieldCheck,
  Truck,
  ArrowLeft,
  X,
  Package,
  Sparkles,
  Tag,
  Eye,
  Store,
  BadgeCheck,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";
import { INITIAL_SHOPEE_PRODUCTS, type ShopeeProduct } from "@/app/shop/page";

const BRANDS = [
  "Tất cả",
  "La Roche-Posay",
  "Bioderma",
  "CeraVe",
  "Skin1004",
  "The Ordinary",
  "SkinSense Clinic",
];

const SKIN_TYPES = [
  { id: "all", label: "Tất Cả Loại Da" },
  { id: "oily_acne", label: "🌿 Da Dầu Mụn" },
  { id: "sensitive", label: "💧 Da Nhạy Cảm" },
  { id: "dry", label: "✨ Da Khô Thiếu Ẩm" },
  { id: "recovery", label: "🛡️ Phục Hồi B5" },
];

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function UserProductsMarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryProductId = searchParams.get("productId");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Tất cả");
  const [selectedSkinType, setSelectedSkinType] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc" | "sales">("popular");

  // Danh sách sản phẩm mua hàng (Approved / Active)
  const [productsList, setProductsList] = useState<ShopeeProduct[]>(() => {
    return INITIAL_SHOPEE_PRODUCTS.filter((p) => p.status === "approved" || p.status === "active");
  });

  // Modal Thêm Sản Phẩm Mới (Sử dụng đúng các trường có sẵn trong database public.products)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("La Roche-Posay");
  const [formCategory, setFormCategory] = useState("Chăm sóc da mặt > Kem dưỡng & Trị mụn");
  const [formPrice, setFormPrice] = useState<number>(395000);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(495000);
  const [formImageUrl, setFormImageUrl] = useState("https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80");
  const [formStockCount, setFormStockCount] = useState<number>(100);
  const [formSku, setFormSku] = useState("");
  const [formVolume, setFormVolume] = useState("40ml");
  const [formOrigin, setFormOrigin] = useState("Pháp (L'Oréal Vietnam phân phối)");
  const [formSkinType, setFormSkinType] = useState("Da dầu mụn, da dễ bùng viêm");
  const [formLicenseNo, setFormLicenseNo] = useState("18294/23/CBMP-QLD");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ĐẦU TIÊN Ở TRANG USER SẼ CÓ CÁC SẢN PHẨM (selectedProduct ban đầu là null)
  // Chỉ khi bấm vào nút "Chi Tiết" thì phần chi tiết sản phẩm mới hiển thị ra
  const [selectedProduct, setSelectedProduct] = useState<ShopeeProduct | null>(() => {
    if (queryProductId) {
      return productsList.find((p) => p.id === queryProductId) || null;
    }
    return null;
  });

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Cập nhật khi query param thay đổi
  useEffect(() => {
    if (queryProductId) {
      const found = productsList.find((p) => p.id === queryProductId);
      if (found) {
        setSelectedProduct(found);
        setSelectedVariantIndex(0);
        setActiveImageIndex(0);
        setQuantity(1);
      }
    }
  }, [queryProductId, productsList]);

  // Xử lý thêm sản phẩm mới chuẩn các trường database public.products
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm.");
      return;
    }

    setIsSubmitting(true);
    const newId = `prod_${Date.now()}`;
    const generatedSku = formSku.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    const resolvedImage = formImageUrl.trim() || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80";

    const newProd: ShopeeProduct = {
      id: newId,
      name: formName.trim(),
      brand: formBrand.trim(),
      category: formCategory.trim(),
      priceVnd: Number(formPrice) || 350000,
      originalPriceVnd: Number(formOriginalPrice) || Math.round((Number(formPrice) || 350000) * 1.25),
      discountPercent: Math.max(0, Math.round((((Number(formOriginalPrice) || (Number(formPrice) || 350000) * 1.25) - (Number(formPrice) || 350000)) / (Number(formOriginalPrice) || (Number(formPrice) || 350000) * 1.25)) * 100)),
      stock: Number(formStockCount) || 100,
      soldCount: 0,
      rating: 5.0,
      reviewCount: 0,
      sku: generatedSku,
      coverImage: resolvedImage,
      images: [resolvedImage],
      isMall: true,
      status: "approved",
      specifications: {
        volume: formVolume.trim() || "40ml",
        skinType: formSkinType.trim() || "Mọi loại da",
        healthMinistryLicense: formLicenseNo.trim() || "18294/23/CBMP-QLD",
        expiryMonths: 36,
        packagingWeightGram: 150,
        actives: "Hoạt chất tiêu chuẩn y tế",
      },
      shippingInfo: {
        shippingFrom: "Quận 1, TP. Hồ Chí Minh",
        estimatedDelivery: "Giao từ 1 - 2 ngày (Có Hỏa Tốc)",
        freeshipLabel: "Miễn Phí Vận Chuyển (Freeship Xtra)",
      },
      variants: [
        {
          id: `var_${Date.now()}`,
          name: `Tuýp ${formVolume.trim() || "40ml"}`,
          priceVnd: Number(formPrice) || 350000,
          originalPriceVnd: Number(formOriginalPrice) || Math.round((Number(formPrice) || 350000) * 1.25),
          stock: Number(formStockCount) || 100,
        },
      ],
      description: formDescription.trim() || "Sản phẩm dược mỹ phẩm chính hãng 100% đã được kiểm định chất lượng.",
      origin: formOrigin.trim() || "Pháp",
      shopName: `${formBrand.trim()} Official Store`,
    };

    setProductsList((prev) => [newProd, ...prev]);

    try {
      await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProd.name,
          brand: newProd.brand,
          category: newProd.category,
          price: newProd.priceVnd,
          original_price: newProd.originalPriceVnd,
          stock: newProd.stock,
          sku: newProd.sku,
          coverImage: newProd.coverImage,
          images: newProd.images,
          description: newProd.description,
          origin: newProd.origin,
          volume: formVolume.trim() || "40ml",
          skin_type: formSkinType.trim() || "Mọi loại da",
          license_no: formLicenseNo.trim() || "18294/23/CBMP-QLD",
        }),
      });
    } catch (err) {
      console.warn("Lỗi đồng bộ sản phẩm:", err);
    }

    setIsSubmitting(false);
    setIsAddModalOpen(false);
    toast.success(`Đã thêm sản phẩm "${newProd.name}" thành công!`);
    setFormName("");
    setFormDescription("");
  };

  // Lọc sản phẩm trong danh sách
  const filteredProducts = useMemo(() => {
    return productsList
      .filter((p) => {
        const matchSearch =
          !searchTerm.trim() ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchBrand = selectedBrand === "Tất cả" || p.brand.toLowerCase() === selectedBrand.toLowerCase();

        const matchSkin =
          selectedSkinType === "all" ||
          (selectedSkinType === "oily_acne" && (p.name.toLowerCase().includes("mụn") || p.name.toLowerCase().includes("effaclar") || p.name.toLowerCase().includes("bha"))) ||
          (selectedSkinType === "sensitive" && (p.name.toLowerCase().includes("nhạy cảm") || p.name.toLowerCase().includes("bioderma") || p.name.toLowerCase().includes("dịu nhẹ"))) ||
          (selectedSkinType === "dry" && (p.name.toLowerCase().includes("ẩm") || p.name.toLowerCase().includes("khô") || p.name.toLowerCase().includes("cerave"))) ||
          (selectedSkinType === "recovery" && (p.name.toLowerCase().includes("phục hồi") || p.name.toLowerCase().includes("b5") || p.name.toLowerCase().includes("hyalu")));

        return matchSearch && matchBrand && matchSkin;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.priceVnd - b.priceVnd;
        if (sortBy === "price-desc") return b.priceVnd - a.priceVnd;
        if (sortBy === "sales") return (b.soldCount || 0) - (a.soldCount || 0);
        return b.rating - a.rating;
      });
  }, [productsList, searchTerm, selectedBrand, selectedSkinType, sortBy]);

  // 1. Khi bấm vào "Chi Tiết": Hiển thị trang chi tiết của sản phẩm đó
  const handleOpenDetail = (product: ShopeeProduct) => {
    setSelectedProduct(product);
    setSelectedVariantIndex(0);
    setActiveImageIndex(0);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Quay lại danh sách sản phẩm
  const handleBackToList = () => {
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 2. Khi bấm vào "Mua Ngay": Chuyển ngay sang trang thanh toán của khách hàng
  const handleBuyNow = (productId: string, variantIdx: number, qty: number) => {
    toast.success("Đang chuyển sang trang Thanh toán của Khách hàng...");
    router.push(`/checkout?productId=${productId}&variant=${variantIdx}&quantity=${qty}`);
  };

  const currentVariant = selectedProduct
    ? selectedProduct.variants?.[selectedVariantIndex] || {
        name: "Tuýp tiêu chuẩn",
        priceVnd: selectedProduct.priceVnd,
        originalPriceVnd: selectedProduct.originalPriceVnd,
        stock: selectedProduct.stock,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#191B19]">
      {/* 1. HEADER CHUẨN SHOPEE MALL DÀNH CHO KHÁCH HÀNG (KHÔNG CÓ GIỎ HÀNG, KHÔNG LINK SANG SHOP) */}
      <header className="sticky top-0 z-40 border-b border-[#D8D4CA] bg-[#E8E5DE]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="flex items-center gap-2.5 group text-left cursor-pointer"
            >
              <LogoMark className="size-8 transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-[#191B19] leading-tight">
                  SkinSense <span className="text-[#C2410C] font-sans text-xs font-bold tracking-wider">MALL</span>
                </span>
                <span className="text-[11px] font-medium text-[#5C605C]">
                  Dược Mỹ Phẩm Chính Hãng 100%
                </span>
              </div>
            </button>

            <span className="h-5 w-px bg-[#D8D4CA] hidden sm:inline-block" />

            {/* Badges cam kết */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-[#2D5A43]">
              <span className="flex items-center gap-1 rounded-full bg-[#2D5A43]/10 px-2.5 py-0.5">
                <ShieldCheck className="size-3.5 text-[#2D5A43]" />
                100% Chính Hãng
              </span>
              <span className="flex items-center gap-1 rounded-full bg-[#C2410C]/10 text-[#C2410C] px-2.5 py-0.5">
                <Truck className="size-3.5" />
                Freeship Xtra 0đ
              </span>
            </div>
          </div>

          {/* Ô tìm kiếm sản phẩm */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8C8F8A]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kem chống nắng, serum B5, nước tẩy trang..."
                className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white pl-9 pr-3 text-xs text-[#191B19] placeholder:text-[#8C8F8A] focus:border-[#2D5A43] focus:outline-none shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8F8A] hover:text-[#191B19]"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions Người Mua: Thêm Sản Phẩm, Đơn Mua, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Nút Thêm Sản Phẩm Mới (Theo chuẩn các trường Database) */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#214332] transition shadow-2xs cursor-pointer active:scale-95"
              title="Thêm sản phẩm mới chuẩn các trường database"
            >
              <Plus className="size-3.5" />
              <span>Thêm Sản Phẩm</span>
            </button>

            {/* Link vào xem đơn hàng của Thùy Dung */}
            <Link
              href="/user/profile"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-1.5 text-xs font-bold text-[#191B19] hover:border-[#2D5A43] hover:text-[#2D5A43] transition shadow-2xs"
              title="Xem lịch sử đơn mua, theo dõi tiến trình đơn hàng và Đánh giá"
            >
              <Package className="size-3.5 text-[#C2410C]" />
              <span>Đơn Mua Của Tôi</span>
            </Link>

            {/* Avatar & Tên User */}
            <Link
              href="/user/profile"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] p-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold text-[#191B19] hover:bg-white transition"
              title="Tài khoản: Thùy Dung"
            >
              <div className="size-6 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-[10px] font-bold">
                TD
              </div>
              <span className="hidden md:inline font-bold">Thùy Dung</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. ĐIỀU KIỆN HIỂN THỊ: NẾU BẤM VÀO "CHI TIẾT" MỚI HIỆN TRANG CHI TIẾT SẢN PHẨM */}
      {selectedProduct && currentVariant ? (
        <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 space-y-6">
          {/* Nút quay lại danh sách sản phẩm & Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="flex items-center gap-2 rounded-xl border border-[#D8D4CA] bg-white px-4 py-2 text-xs font-bold text-[#191B19] hover:border-[#2D5A43] hover:text-[#2D5A43] transition shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại Danh Sách Sản Phẩm</span>
            </button>

            <div className="text-xs text-[#5C605C] truncate max-w-xl">
              <span>Mall</span> {">"} <span>{selectedProduct.category}</span> {">"}{" "}
              <strong className="text-[#191B19] font-bold">{selectedProduct.brand}</strong> {">"}{" "}
              <span className="truncate">{selectedProduct.name}</span>
            </div>
          </div>

          {/* KHỐI CHI TIẾT SẢN PHẨM CHÍNH (CHUẨN 100% THEO HÌNH ẢNH USER GỬI) */}
          <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-7 lg:p-9 shadow-sm space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              {/* CỘT TRÁI: GALLERY ẢNH SẢN PHẨM (5 CỘT) */}
              <div className="space-y-4 lg:col-span-5">
                {/* Ảnh bìa chính lớn */}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#D8D4CA]/80 bg-[#F6F4EF] shadow-2xs">
                  <Image
                    src={
                      selectedProduct.images?.[activeImageIndex] ||
                      selectedProduct.coverImage ||
                      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800"
                    }
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Badge Mall đỏ góc trái */}
                  <div className="absolute top-3 left-3 rounded-md bg-[#D0011B] px-2.5 py-1 text-xs font-bold text-white shadow-xs flex items-center gap-1">
                    <BadgeCheck className="size-3.5" />
                    <span>Mall</span>
                  </div>
                  {/* Tag giảm giá vàng cam góc phải */}
                  <span className="absolute top-3 right-3 rounded-md bg-[#FEF08A] px-2 py-0.5 text-xs font-bold text-[#854D0E] shadow-2xs">
                    GIẢM {selectedProduct.discountPercent}%
                  </span>
                </div>

                {/* Hàng ảnh thu nhỏ (Thumbnails) */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {(selectedProduct.images && selectedProduct.images.length > 0
                    ? selectedProduct.images
                    : [selectedProduct.coverImage]
                  ).map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative size-16 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                        activeImageIndex === i
                          ? "border-[#2D5A43] ring-2 ring-[#2D5A43]/20 shadow-xs"
                          : "border-[#D8D4CA] opacity-75 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={imgUrl || selectedProduct.coverImage}
                        alt={`Ảnh góc ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Khối Đảm Bảo Chính Hãng */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D8D4CA]/80 bg-[#FAF8F5] p-3 text-xs text-[#5C605C]">
                  <span className="flex items-center gap-1.5 font-bold text-[#2D5A43]">
                    <ShieldCheck className="size-4 text-[#2D5A43]" />
                    <span>Đảm Bảo Chính Hãng</span>
                  </span>
                  <span className="font-medium">3 Ngày Trả Hàng / Hoàn Tiền 100%</span>
                </div>
              </div>

              {/* CỘT PHẢI: THÔNG TIN SẢN PHẨM & NÚT MUA NGAY (7 CỘT) */}
              <div className="space-y-5 lg:col-span-7 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Badges: Mall + Thương hiệu + Gian hàng + SKU */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#D0011B] px-2 py-0.5 text-xs font-bold text-white">
                      Mall
                    </span>
                    <span className="rounded bg-[#2D5A43]/10 px-2 py-0.5 text-xs font-bold text-[#2D5A43]">
                      {selectedProduct.brand} Chính Hãng
                    </span>
                    <span className="rounded bg-[#FAF8F5] border border-[#D8D4CA] px-2 py-0.5 text-xs font-semibold text-[#191B19] flex items-center gap-1">
                      <Store className="size-3 text-[#2D5A43]" />
                      <span>Gian hàng: {selectedProduct.shopName || selectedProduct.brand}</span>
                    </span>
                    <span className="font-mono text-xs text-[#8C8F8A]">
                      SKU: {selectedProduct.sku}
                    </span>
                  </div>

                  {/* Tên sản phẩm */}
                  <h1 className="text-xl sm:text-2xl font-bold leading-snug text-[#191B19]">
                    {selectedProduct.name}
                  </h1>

                  {/* Điểm đánh giá sao, số lượng đánh giá & đã bán */}
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm pt-0.5">
                    <div className="flex items-center gap-1 text-amber-600 font-bold">
                      <span className="border-b border-amber-600">{selectedProduct.rating}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <span className="text-[#D8D4CA]">•</span>
                    <div>
                      <strong className="border-b border-[#191B19] text-[#191B19]">
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

                  {/* KHỐI GIÁ KHUYẾN MÃI MALL */}
                  <div className="space-y-1.5 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                      <Sparkles className="size-3.5 text-amber-600" />
                      <span>GIÁ KHUYẾN MÃI MALL</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-2xl sm:text-3xl font-black text-[#191B19]">
                        {formatVnd(currentVariant.priceVnd)}
                      </span>
                      <span className="text-sm text-[#8C8F8A] line-through">
                        {formatVnd(currentVariant.originalPriceVnd || Math.round(currentVariant.priceVnd * 1.25))}
                      </span>
                      <span className="rounded bg-[#191B19] px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                        -{selectedProduct.discountPercent}% GIẢM
                      </span>
                    </div>
                  </div>

                  {/* Mã Giảm Giá Của Shop */}
                  {selectedProduct.vouchers && selectedProduct.vouchers.length > 0 && (
                    <div className="space-y-1.5 pt-0.5">
                      <span className="block text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                        MÃ GIẢM GIÁ CỦA SHOP:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedProduct.vouchers.map((vc) => (
                          <div
                            key={vc.id}
                            className="flex items-center gap-1 rounded-lg border border-dashed border-[#D8D4CA] bg-[#FAF8F5] px-2.5 py-1.5 text-xs font-medium text-[#191B19]"
                          >
                            <Tag className="size-3 text-[#C2410C]" />
                            <span>{vc.discountLabel}</span>
                            <span className="text-[10px] font-normal text-[#5C605C]">({vc.minSpendLabel})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vận chuyển Shopee */}
                  <div className="space-y-1.5 rounded-xl border border-[#D8D4CA]/80 bg-[#FAF8F5] p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#2D5A43]">
                      <Truck className="size-4" />
                      <span>Vận Chuyển: Miễn Phí Vận Chuyển (Freeship Xtra)</span>
                    </div>
                    <div className="space-y-0.5 pl-5 text-xs text-[#5C605C]">
                      <div>
                        Gửi hàng từ: <strong className="text-[#191B19]">{selectedProduct.shippingInfo.shippingFrom}</strong>
                      </div>
                      <div>
                        Dự kiến nhận hàng: <strong className="text-[#191B19]">{selectedProduct.shippingInfo.estimatedDelivery}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Phân loại hàng / Dung tích (Variants) */}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                      PHÂN LOẠI HÀNG:
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {(selectedProduct.variants && selectedProduct.variants.length > 0
                        ? selectedProduct.variants
                        : [{ id: "def", name: "Tuýp 40ml", priceVnd: selectedProduct.priceVnd }]
                      ).map((v, idx) => (
                        <button
                          key={v.id || idx}
                          type="button"
                          onClick={() => setSelectedVariantIndex(idx)}
                          className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                            selectedVariantIndex === idx
                              ? "border-[#191B19] bg-[#191B19]/5 text-[#191B19] ring-2 ring-[#191B19]/20 shadow-xs"
                              : "border-[#D8D4CA] bg-white text-[#5C605C] hover:border-[#191B19] hover:text-[#191B19]"
                          }`}
                        >
                          <span>{v.name}</span>
                          <span className="block text-[11px] font-medium opacity-80">{formatVnd(v.priceVnd)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Số lượng */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                      SỐ LƯỢNG:
                    </span>
                    <div className="flex items-center rounded-xl border border-[#D8D4CA] bg-[#FAF8F5]">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-2 text-sm font-bold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-sm font-bold text-[#191B19] tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-3 py-2 text-sm font-bold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-[#5C605C]">
                      Còn <strong>{currentVariant.stock}</strong> sản phẩm trong kho
                    </span>
                  </div>
                </div>

                {/* DUY NHẤT 1 NÚT: [MUA NGAY] (KHÔNG CÓ GIỎ HÀNG) */}
                <div className="pt-4 border-t border-[#D8D4CA]/60">
                  <button
                    type="button"
                    onClick={() => handleBuyNow(selectedProduct.id, selectedVariantIndex, quantity)}
                    className="w-full sm:w-auto sm:min-w-[320px] h-12 rounded-xl bg-[#191B19] hover:bg-[#2D5A43] text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    title="Chuyển trực tiếp sang trang thanh toán của Khách hàng"
                  >
                    <ShoppingBag className="size-4.5" />
                    <span>Mua Ngay</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BẢNG CHI TIẾT THÔNG SỐ SẢN PHẨM (CHUẨN 100% ẢNH USER GỬI) */}
            <div className="space-y-4 border-t border-[#D8D4CA]/70 pt-6">
              <h3 className="text-base font-bold text-[#191B19]">
                Chi Tiết Thông Số Kỹ Thuật Sản Phẩm
              </h3>

              <div className="divide-y divide-[#D8D4CA]/60 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 text-xs">
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 py-2 sm:grid-cols-3">
                  <span className="text-[#5C605C]">Danh Mục</span>
                  <span className="text-[#191B19] font-medium sm:col-span-2">{selectedProduct.category}</span>
                </div>
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 py-2 sm:grid-cols-3">
                  <span className="text-[#5C605C]">Thương Hiệu</span>
                  <span className="font-bold text-[#2D5A43] sm:col-span-2">{selectedProduct.brand} (Mall)</span>
                </div>
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 py-2 sm:grid-cols-3">
                  <span className="text-[#5C605C]">Xuất Xứ</span>
                  <span className="text-[#191B19] font-medium sm:col-span-2">{selectedProduct.origin}</span>
                </div>
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 py-2 sm:grid-cols-3">
                  <span className="text-[#5C605C]">Loại Da Phù Hợp</span>
                  <span className="text-[#191B19] font-medium sm:col-span-2">{selectedProduct.specifications.skinType}</span>
                </div>
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 py-2 sm:grid-cols-3">
                  <span className="text-[#5C605C]">Thành Phần Hoạt Chất</span>
                  <span className="font-bold text-[#2D5A43] sm:col-span-2">{selectedProduct.specifications.actives}</span>
                </div>
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 py-2 sm:grid-cols-3">
                  <span className="text-[#5C605C]">Dung Tích / Khối Lượng</span>
                  <span className="text-[#191B19] font-medium sm:col-span-2">{selectedProduct.specifications.volume}</span>
                </div>
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 py-2 sm:grid-cols-3">
                  <span className="text-[#5C605C]">Hạn Sử Dụng</span>
                  <span className="text-[#191B19] font-medium sm:col-span-2">{selectedProduct.specifications.expiryMonths} tháng kể từ NSX</span>
                </div>
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 py-2 sm:grid-cols-3">
                  <span className="text-[#5C605C]">Số Công Bố (Bộ Y Tế)</span>
                  <span className="font-mono font-bold text-[#191B19] sm:col-span-2">{selectedProduct.specifications.healthMinistryLicense}</span>
                </div>
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 py-2 sm:grid-cols-3">
                  <span className="text-[#5C605C]">Gửi Hàng Từ</span>
                  <span className="text-[#191B19] font-medium sm:col-span-2">{selectedProduct.shippingInfo.shippingFrom}</span>
                </div>
              </div>

              {/* Khối Mô Tả Sản Phẩm Chi Tiết */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-bold text-[#191B19]">
                  Mô Tả Sản Phẩm Chi Tiết
                </h4>
                <div className="space-y-2 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 text-xs leading-relaxed text-[#5C605C]">
                  <p>{selectedProduct.description}</p>
                  <div>
                    <strong className="mb-0.5 block text-[#191B19]">Hướng Dẫn Sử Dụng:</strong>
                    <p>{selectedProduct.howToUse}</p>
                  </div>
                  <div className="rounded-lg border border-[#2D5A43]/20 bg-[#2D5A43]/5 p-2.5 text-[11px] font-bold text-[#2D5A43]">
                    ✓ Cam kết 100% hàng chính hãng, tem phụ tiếng Việt và hóa đơn VAT.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* 3. MÀN HÌNH ĐẦU TIÊN CỦA USER: DANH SÁCH CÁC SẢN PHẨM ĐỂ CHỌN MUA */
        <>
          {/* BANNER GIỚI THIỆU - TUYỆT ĐỐI KHÔNG CÓ NÚT MOMO HAY THANH TOÁN */}
          <section className="bg-gradient-to-r from-[#2D5A43] via-[#356B50] to-[#2D5A43] text-white py-6 px-4 shadow-sm">
            <div className="mx-auto max-w-[1360px] space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold text-white backdrop-blur-xs">
                <Sparkles className="size-3.5 text-amber-300" />
                SkinSense Official Mall • 100% Phân Phối Độc Quyền
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                Sàn Dược Mỹ Phẩm Chuẩn Y Khoa Cho Làn Da Nhạy Cảm
              </h1>
              <p className="text-xs sm:text-sm text-white/85 max-w-2xl">
                Chọn mua sản phẩm đã qua kiểm nghiệm lâm sàng từ La Roche-Posay, Bioderma, CeraVe. Miễn phí vận chuyển toàn quốc và hoàn tiền 200% nếu phát hiện hàng giả.
              </p>
            </div>
          </section>

          {/* BỘ LỌC THƯƠNG HIỆU & LOẠI DA (SHOPPING FILTERS) */}
          <section className="mx-auto max-w-[1360px] px-4 pt-6 sm:px-6 space-y-4">
            {/* Bộ lọc nhanh theo thương hiệu */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-[#5C605C] shrink-0 flex items-center gap-1">
                <Tag className="size-3.5 text-[#C2410C]" />
                Thương hiệu:
              </span>
              {BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedBrand === brand
                      ? "bg-[#2D5A43] text-white shadow-xs"
                      : "border border-[#D8D4CA] bg-white text-[#5C605C] hover:border-[#2D5A43] hover:text-[#191B19]"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>

            {/* Bộ lọc loại da & Sắp xếp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#D8D4CA]/60 pt-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold text-[#5C605C] shrink-0 flex items-center gap-1">
                  <Filter className="size-3.5 text-[#2D5A43]" />
                  Loại da:
                </span>
                {SKIN_TYPES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedSkinType(st.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition shrink-0 cursor-pointer ${
                      selectedSkinType === st.id
                        ? "bg-[#C2410C] text-white shadow-2xs"
                        : "border border-[#D8D4CA]/80 bg-[#FAF8F5] text-[#5C605C] hover:bg-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
                <span className="text-[#5C605C] font-medium">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-8 rounded-lg border border-[#D8D4CA] bg-white px-2.5 text-xs font-bold text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                >
                  <option value="popular">⭐ Đánh giá cao nhất</option>
                  <option value="sales">🔥 Bán chạy nhất</option>
                  <option value="price-asc">💵 Giá: Thấp đến Cao</option>
                  <option value="price-desc">💎 Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>
          </section>

          {/* DANH SÁCH CÁC SẢN PHẨM: MỖI SẢN PHẨM CÓ 2 NÚT [CHI TIẾT] VÀ [MUA NGAY] */}
          <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#191B19] uppercase tracking-wide flex items-center gap-2">
                <span>Danh Sách Sản Phẩm</span>
                <span className="text-xs font-normal text-[#5C605C]">
                  ({filteredProducts.length} sản phẩm sẵn có)
                </span>
              </h2>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#214332] transition shadow-2xs cursor-pointer active:scale-95"
              >
                <Plus className="size-3.5" />
                <span>+ Thêm Sản Phẩm Mới</span>
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#D8D4CA] bg-white p-12 text-center space-y-3">
                <Package className="mx-auto size-12 text-[#8C8F8A]" />
                <p className="text-sm font-bold text-[#191B19]">Không tìm thấy sản phẩm phù hợp</p>
                <p className="text-xs text-[#5C605C]">Vui lòng thử xóa từ khóa tìm kiếm hoặc chọn thương hiệu khác.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedBrand("Tất cả");
                    setSelectedSkinType("all");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2D5A43] text-white text-xs font-bold hover:bg-[#214332] transition"
                >
                  Xóa Bộ Lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
                {filteredProducts.map((prod) => {
                  const defaultVariant = prod.variants?.[0] || { name: "Mặc định", priceVnd: prod.priceVnd };
                  const discountPercent = prod.discountPercent || Math.round(((prod.priceVnd * 1.25 - prod.priceVnd) / (prod.priceVnd * 1.25)) * 100);

                  return (
                    <div
                      key={prod.id}
                      className="group flex flex-col rounded-2xl border border-[#D8D4CA]/80 bg-white p-3 shadow-2xs hover:shadow-md hover:border-[#2D5A43]/50 transition-all duration-200"
                    >
                      {/* Ảnh sản phẩm + Badge Mall */}
                      <div
                        onClick={() => handleOpenDetail(prod)}
                        className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F6F4EF] cursor-pointer mb-2.5"
                      >
                        <Image
                          src={prod.coverImage || prod.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"}
                          alt={prod.name}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        />
                        {/* Badge Mall đỏ Shopee */}
                        <span className="absolute top-2 left-2 rounded-md bg-[#D0011B] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                          Mall
                        </span>
                        {/* Tag giảm giá */}
                        <span className="absolute top-2 right-2 rounded bg-[#FEF08A] px-1.5 py-0.5 text-[9px] font-bold text-[#854D0E] shadow-2xs">
                          -{discountPercent}%
                        </span>
                      </div>

                      {/* Thông tin sản phẩm */}
                      <div className="flex-1 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D5A43] mb-1">
                          {prod.brand}
                        </span>
                        <h3
                          onClick={() => handleOpenDetail(prod)}
                          className="text-xs font-semibold text-[#191B19] line-clamp-2 leading-snug cursor-pointer group-hover:text-[#2D5A43] transition mb-1.5"
                          title={prod.name}
                        >
                          {prod.name}
                        </h3>

                        {/* Đánh giá sao & Đã bán */}
                        <div className="flex items-center gap-1.5 text-[10px] text-[#5C605C] mb-2">
                          <div className="flex items-center text-amber-500">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <span className="font-bold ml-0.5">{prod.rating.toFixed(1)}</span>
                          </div>
                          <span>•</span>
                          <span>Đã bán {prod.soldCount || "1.2k"}</span>
                        </div>

                        {/* Giá tiền */}
                        <div className="mt-auto pt-2 border-t border-[#D8D4CA]/40">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-[#191B19]">
                              {formatVnd(prod.priceVnd)}
                            </span>
                            <span className="text-[10px] text-[#8C8F8A] line-through">
                              {formatVnd(prod.originalPriceVnd || Math.round(prod.priceVnd * 1.25))}
                            </span>
                          </div>

                          <span className="text-[10px] text-[#5C605C] block truncate mt-0.5">
                            Dung tích: {defaultVariant.name}
                          </span>
                        </div>

                        {/* ĐÚNG 2 NÚT BẤM THEO YÊU CẦU: [CHI TIẾT] VÀ [MUA NGAY] */}
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {/* NÚT 1: [Chi Tiết] -> Bấm vào thì phần chi tiết sản phẩm mới hiện */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(prod)}
                            className="flex items-center justify-center gap-1 h-9 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] text-[11px] font-semibold text-[#191B19] hover:bg-white hover:border-[#2D5A43] transition cursor-pointer"
                            title="Bấm để xem chi tiết sản phẩm"
                          >
                            <Eye className="size-3 text-[#5C605C]" />
                            <span>Chi Tiết</span>
                          </button>

                          {/* NÚT 2: [Mua Ngay] -> Bấm vào thì trang thanh toán hiện */}
                          <button
                            type="button"
                            onClick={() => handleBuyNow(prod.id, 0, 1)}
                            className="flex items-center justify-center gap-1 h-9 rounded-xl bg-[#191B19] hover:bg-[#2D5A43] text-[11px] font-bold text-white transition shadow-2xs cursor-pointer active:scale-[0.98]"
                            title="Bấm để mua ngay và chuyển sang trang thanh toán"
                          >
                            <ShoppingBag className="size-3" />
                            <span>Mua Ngay</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      {/* MODAL THÊM SẢN PHẨM MỚI (CHỈ SỬ DỤNG CÁC TRƯỜNG CÓ SẴN TRONG BẢNG PUBLIC.PRODUCTS CỦA DATABASE) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-3xl border border-[#D8D4CA] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D8D4CA] pb-3.5">
              <div>
                <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Mall Flagship
                </span>
                <h3 className="text-lg font-bold text-[#191B19] mt-1 flex items-center gap-2">
                  <Plus className="size-5 text-[#2D5A43]" />
                  <span>Thêm Sản Phẩm Mới Vào Hệ Thống</span>
                </h3>
                <p className="text-xs text-[#5C605C]">
                  Form chuẩn 100% theo các trường có sẵn trong database (Bảng: <code className="font-mono text-[#2D5A43] font-bold">public.products</code>)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1.5 text-[#5C605C] hover:bg-[#FAF8F5] hover:text-[#191B19] transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {/* NHÓM 1: THÔNG TIN CƠ BẢN */}
              <div className="space-y-3 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-4">
                <span className="font-bold uppercase tracking-wider text-[#2D5A43] text-[11px] block">
                  1. Thông tin cơ bản (name, brand, category, sku, volume)
                </span>

                <div>
                  <label className="mb-1 block font-bold text-[#191B19]">
                    Tên sản phẩm (<code className="font-mono font-normal">name</code>) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Kem Dưỡng Giảm Mụn Phục Hồi Effaclar Duo+M 40ml"
                    className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Thương hiệu (<code className="font-mono font-normal">brand</code>) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="VD: La Roche-Posay, CeraVe, Bioderma..."
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Danh mục (<code className="font-mono font-normal">category</code>) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="VD: Kem dưỡng, Sữa rửa mặt, Serum..."
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Mã SKU (<code className="font-mono font-normal">sku</code>)
                    </label>
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="Để trống sẽ tự sinh mã..."
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Dung tích / Quy cách (<code className="font-mono font-normal">volume</code>)
                    </label>
                    <input
                      type="text"
                      value={formVolume}
                      onChange={(e) => setFormVolume(e.target.value)}
                      placeholder="VD: 40ml, 50ml, 100ml..."
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* NHÓM 2: GIÁ & TỒN KHO */}
              <div className="space-y-3 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-4">
                <span className="font-bold uppercase tracking-wider text-[#2D5A43] text-[11px] block">
                  2. Giá bán & Tồn kho (price, original_price, stock_count)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Giá bán VNĐ (<code className="font-mono font-normal">price</code>) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Giá gốc niêm yết (<code className="font-mono font-normal">original_price</code>)
                    </label>
                    <input
                      type="number"
                      value={formOriginalPrice}
                      onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Tồn kho (<code className="font-mono font-normal">stock_count</code>)
                    </label>
                    <input
                      type="number"
                      value={formStockCount}
                      onChange={(e) => setFormStockCount(Number(e.target.value))}
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* NHÓM 3: HÌNH ẢNH & THÔNG SỐ PHÁP LÝ */}
              <div className="space-y-3 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-4">
                <span className="font-bold uppercase tracking-wider text-[#2D5A43] text-[11px] block">
                  3. Hình ảnh & Thông số kiểm định (image_url, origin, skin_type, license_no)
                </span>

                <div>
                  <label className="mb-1 block font-bold text-[#191B19]">
                    URL Hình ảnh sản phẩm (<code className="font-mono font-normal">image_url</code>) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Xuất xứ (<code className="font-mono font-normal">origin</code>)
                    </label>
                    <input
                      type="text"
                      value={formOrigin}
                      onChange={(e) => setFormOrigin(e.target.value)}
                      placeholder="VD: Pháp, Mỹ, Hàn Quốc..."
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Loại da (<code className="font-mono font-normal">skin_type</code>)
                    </label>
                    <input
                      type="text"
                      value={formSkinType}
                      onChange={(e) => setFormSkinType(e.target.value)}
                      placeholder="VD: Da dầu mụn, Da nhạy cảm..."
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-[#191B19]">
                      Số công bố Bộ Y Tế (<code className="font-mono font-normal">license_no</code>)
                    </label>
                    <input
                      type="text"
                      value={formLicenseNo}
                      onChange={(e) => setFormLicenseNo(e.target.value)}
                      placeholder="18294/23/CBMP-QLD"
                      className="w-full h-9 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#191B19]">
                    Mô tả sản phẩm (<code className="font-mono font-normal">description</code>)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả công dụng, hiệu quả chăm sóc da..."
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white p-3 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>
              </div>

              {/* NÚT SUBMIT */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8D4CA]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-[#D8D4CA] bg-white text-xs font-semibold text-[#5C605C] hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-xl bg-[#2D5A43] text-xs font-bold text-white hover:bg-[#214332] shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Đang Thêm..." : "Xác Nhận Thêm Sản Phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserProductsMarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F4EF] p-8 text-center text-xs font-semibold text-[#5C605C] flex items-center justify-center">
          Đang tải Sản Phẩm...
        </div>
      }
    >
      <UserProductsMarketplaceContent />
    </Suspense>
  );
}
