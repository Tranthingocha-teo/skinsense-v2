"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  ShoppingBag,
  Truck,
  MapPin,
  Tag,
  CreditCard,
  QrCode,
  Wallet,
  Coins,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  BadgeCheck,
  Sparkles,
  HelpCircle,
  Clock,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";

interface CheckoutItem {
  id: string;
  name: string;
  brand: string;
  variant: string;
  volume: string;
  image: string;
  priceVnd: number;
  originalPriceVnd: number;
  quantity: number;
}

// Default items in checkout (based on prescribed routine)
const DEFAULT_CHECKOUT_ITEMS: CheckoutItem[] = [
  {
    id: "co_01",
    name: "Kem Dưỡng Giảm Mụn & Ngừa Thâm La Roche-Posay Effaclar Duo+M",
    brand: "La Roche-Posay",
    variant: "Tuýp 40ml",
    volume: "40ml",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    priceVnd: 395000,
    originalPriceVnd: 495000,
    quantity: 1,
  },
  {
    id: "co_02",
    name: "Sữa Rửa Mặt Dưỡng Ẩm Chuyên Sâu CeraVe Hydrating Cleanser",
    brand: "CeraVe Skincare",
    variant: "Chai 473ml Tiết Kiệm",
    volume: "473ml",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    priceVnd: 380000,
    originalPriceVnd: 450000,
    quantity: 1,
  },
  {
    id: "co_03",
    name: "Tinh Chất Phục Hồi & Cấp Nước Đa Tầng La Roche-Posay Hyalu B5 Serum",
    brand: "La Roche-Posay",
    variant: "Chai 30ml",
    volume: "30ml",
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
    priceVnd: 890000,
    originalPriceVnd: 1100000,
    quantity: 1,
  },
  {
    id: "co_04",
    name: "Kem Chống Nắng Kiểm Soát Dầu 12H La Roche-Posay Anthelios UVMune 400",
    brand: "La Roche-Posay",
    variant: "Tuýp 50ml",
    volume: "50ml",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
    priceVnd: 475000,
    originalPriceVnd: 560000,
    quantity: 1,
  },
];

function formatMoney(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0₫";
}

export default function ShopCheckoutPage() {
  const router = useRouter();

  // Items in checkout
  const [items, setItems] = useState<CheckoutItem[]>(DEFAULT_CHECKOUT_ITEMS);

  // Address
  const [recipientName, setRecipientName] = useState("Trần Thị Ngọc Hà");
  const [recipientPhone, setRecipientPhone] = useState("(+84) 987 654 321");
  const [recipientAddress, setRecipientAddress] = useState("Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Note for seller
  const [sellerNote, setSellerNote] = useState("Gói hàng kỹ kèm túi chống sốc giúp mình nha shop.");

  // Payment method: "cod" | "qr" | "shopeepay" | "card"
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "qr" | "shopeepay" | "card">("cod");

  // Vouchers & Coins
  const [useShopVoucher, setUseShopVoucher] = useState(true);
  const [useCoins, setUseCoins] = useState(false);
  const coinDiscountVnd = 20000;
  const shopVoucherDiscountVnd = 50000;
  const shippingFeeVnd = 40000;
  const shippingDiscountVnd = 40000; // Freeship Xtra

  // Success modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  // Quantity helpers
  function updateQuantity(id: string, delta: number) {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CheckoutItem[],
    );
  }

  // Calculations
  const rawTotal = items.reduce((acc, item) => acc + item.priceVnd * item.quantity, 0);
  const voucherDiscount = useShopVoucher ? shopVoucherDiscountVnd : 0;
  const coinsDeduction = useCoins ? coinDiscountVnd : 0;
  const finalTotal = Math.max(0, rawTotal + (shippingFeeVnd - shippingDiscountVnd) - voucherDiscount - coinsDeduction);

  function handlePlaceOrder() {
    if (items.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống!");
      return;
    }

    const randomOrderNumber = `SHOPEE-SS-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderCode(randomOrderNumber);
    setIsSuccessModalOpen(true);
    toast.success("Đặt hàng thành công! Đơn hàng đang được chuẩn bị.");
  }

  return (
    <div className="min-h-screen bg-[#E8E5DE] text-[#191B19] antialiased">
      {/* Header - Shopee Mall Checkout Style */}
      <header className="sticky top-0 z-40 border-b border-[#D8D4CA] bg-[#E8E5DE]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/shop" className="flex items-center gap-2.5 group">
              <LogoMark className="size-8 transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-[#191B19] leading-tight">
                  SkinSense <span className="text-[#C2410C] font-sans text-xs font-bold tracking-wider">SHOPEE MALL</span>
                </span>
                <span className="text-[11px] font-medium text-[#5C605C]">
                  Thanh Toán Đơn Hàng An Toàn
                </span>
              </div>
            </Link>

            <span className="h-5 w-px bg-[#D8D4CA] hidden sm:inline-block" />

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#C2410C]">
              <span className="rounded-full bg-[#C2410C]/10 px-3 py-1">
                Thanh Toán Đơn Hàng Dược Mỹ Phẩm
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3 py-1.5 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition"
            >
              <ArrowLeft className="size-3.5" />
              <span>Quay lại Shop</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 space-y-5">
        {/* KHỐI 1: ĐỊA CHỈ NHẬN HÀNG (VIỀN PHONG THƯ ĐẶC TRƯNG SHOPEE) */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white overflow-hidden shadow-xs">
          {/* Sọc phong thư Shopee */}
          <div className="h-1.5 w-full bg-[repeating-linear-gradient(45deg,#E11D48,#E11D48_24px,#fff_24px,#fff_32px,#2563EB_32px,#2563EB_56px,#fff_56px,#fff_64px)]" />

          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#C2410C] font-bold text-sm uppercase tracking-wider">
                <MapPin className="size-4.5" />
                <span>Địa Chỉ Nhận Hàng</span>
              </div>

              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                Thay đổi
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm text-[#191B19]">
              <div className="font-bold shrink-0">
                {recipientName} {recipientPhone}
              </div>
              <span className="hidden sm:inline text-[#D8D4CA]">•</span>
              <div className="text-[#4A4D4A] flex-1">
                {recipientAddress}
              </div>
              <span className="rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 shrink-0 self-start sm:self-auto">
                Mặc định
              </span>
            </div>
          </div>
        </div>

        {/* KHỐI 2: DANH SÁCH SẢN PHẨM THANH TOÁN (SHOPEE MALL STORE) */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          {/* Shop Header */}
          <div className="flex items-center justify-between border-b border-[#D8D4CA]/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                Shopee Mall
              </span>
              <span className="font-bold text-sm text-[#191B19] flex items-center gap-1.5">
                <Store className="size-4 text-[#C2410C]" />
                <span>La Roche-Posay Official Store</span>
              </span>
            </div>

            <span className="text-xs text-[#2D5A43] font-semibold flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              <span>Chính Hãng 100%</span>
            </span>
          </div>

          {/* Product Items Table */}
          <div className="divide-y divide-[#D8D4CA]/50 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {/* Ảnh & Tên */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-16 rounded-xl object-cover border border-[#D8D4CA] shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-[#191B19] leading-snug line-clamp-1">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#5C605C]">
                      <span>Phân loại: <strong className="text-[#191B19]">{item.variant}</strong></span>
                      <span>•</span>
                      <span>Dung tích: {item.volume}</span>
                    </div>
                  </div>
                </div>

                {/* Đơn giá, Số lượng, Thành tiền */}
                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-19 sm:pl-0">
                  <div className="text-right">
                    <span className="font-bold text-xs sm:text-sm text-[#191B19] block">
                      {formatMoney(item.priceVnd)}
                    </span>
                    <span className="text-[10px] text-[#5C605C] line-through block">
                      {formatMoney(item.originalPriceVnd)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-lg border border-[#D8D4CA] bg-[#FAF8F5]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="px-2 py-0.5 text-xs font-bold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-2 py-0.5 text-xs font-bold text-[#191B19] font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="px-2 py-0.5 text-xs font-bold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <span className="text-xs sm:text-sm font-bold font-serif text-[#C2410C]">
                      {formatMoney(item.priceVnd * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lời nhắn cho Shop */}
          <div className="pt-3 border-t border-[#D8D4CA]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#FAF8F5] p-3 rounded-2xl">
            <span className="text-[#5C605C] shrink-0 font-medium">Lời nhắn cho Người bán:</span>
            <input
              type="text"
              value={sellerNote}
              onChange={(e) => setSellerNote(e.target.value)}
              placeholder="Lưu ý cho đơn vị bán hàng và đóng gói..."
              className="flex-1 rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
            />
          </div>
        </div>

        {/* KHỐI 3: VẬN CHUYỂN SHOPEE EXPRESS */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2D5A43] uppercase tracking-wider">
              <Truck className="size-4" />
              <span>Phương thức vận chuyển: Shopee Express (Hỏa Tốc Y Khoa)</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#5C605C] line-through">{formatMoney(shippingFeeVnd)}</span>
              <span className="font-bold text-[#2D5A43]">MIỄN PHÍ 0₫</span>
              <span className="rounded bg-[#2D5A43] px-1.5 py-0.2 text-[9px] font-bold text-white">
                Freeship Xtra
              </span>
            </div>
          </div>

          <div className="text-xs text-[#5C605C] bg-[#FAF8F5] p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-[#C2410C]" />
              <span>Dự kiến giao hàng: <strong>Từ 1 - 2 ngày làm việc</strong> (Nhận hàng kiểm tra trước khi thanh toán)</span>
            </div>
            <span className="text-[#2D5A43] font-semibold text-[11px] hidden sm:inline">
              ✓ Đảm bảo hoàn tiền 100% nếu bể vỡ
            </span>
          </div>
        </div>

        {/* KHỐI 4: VOUCHERS & XU SHOPEE */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-6 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#C2410C]">
              <Tag className="size-4" />
              <span>Shopee Voucher & Mã Giảm Giá</span>
            </div>

            <div className="flex items-center gap-2">
              {useShopVoucher ? (
                <span className="rounded-lg border border-dashed border-[#C2410C] bg-[#C2410C]/10 px-2.5 py-1 text-xs font-bold text-[#C2410C]">
                  Đã áp dụng: Giảm 50.000₫ (Voucher Shop)
                </span>
              ) : (
                <span className="text-xs text-[#5C605C]">Chưa áp dụng voucher</span>
              )}
              <button
                type="button"
                onClick={() => setUseShopVoucher(!useShopVoucher)}
                className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer ml-1"
              >
                {useShopVoucher ? "Bỏ chọn" : "Áp dụng"}
              </button>
            </div>
          </div>

          {/* Dùng Xu Shopee */}
          <div className="pt-2 border-t border-[#D8D4CA]/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-amber-500" />
              <span className="text-[#191B19]">
                Dùng <strong>20.000 Xu Shopee</strong> (Tiết kiệm {formatMoney(coinDiscountVnd)})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setUseCoins(!useCoins)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                useCoins
                  ? "bg-amber-600 text-white"
                  : "border border-[#D8D4CA] text-[#5C605C] hover:text-[#191B19]"
              }`}
            >
              {useCoins ? "Đã dùng" : "Dùng Xu"}
            </button>
          </div>
        </div>

        {/* KHỐI 5: PHƯƠNG THỨC THANH TOÁN (ĐA DẠNG & CÓ MÃ QR ĐỘNG) */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8D4CA]/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#191B19] flex items-center gap-1.5">
              <CreditCard className="size-4 text-[#C2410C]" />
              <span>Phương Thức Thanh Toán</span>
            </span>
            <span className="text-xs text-[#5C605C]">
              Bảo mật SSL 256-bit chuẩn ngân hàng
            </span>
          </div>

          {/* 4 Phương thức thanh toán */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. COD */}
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={`rounded-2xl border p-3.5 text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                paymentMethod === "cod"
                  ? "border-[#C2410C] bg-[#C2410C]/5 ring-2 ring-[#C2410C]/25"
                  : "border-[#D8D4CA] bg-[#FAF8F5] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#191B19]">Thanh Toán Khi Nhận Hàng</span>
                <span className={`size-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === "cod" ? "border-[#C2410C] bg-[#C2410C]" : "border-[#D8D4CA]"
                }`}>
                  {paymentMethod === "cod" && <span className="size-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="text-[11px] text-[#5C605C]">Thanh toán tiền mặt cho shipper (COD) khi nhận bưu phẩm.</p>
            </button>

            {/* 2. QR Code VietQR */}
            <button
              type="button"
              onClick={() => setPaymentMethod("qr")}
              className={`rounded-2xl border p-3.5 text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                paymentMethod === "qr"
                  ? "border-[#C2410C] bg-[#C2410C]/5 ring-2 ring-[#C2410C]/25"
                  : "border-[#D8D4CA] bg-[#FAF8F5] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#191B19] flex items-center gap-1">
                  <QrCode className="size-3.5 text-[#C2410C]" />
                  <span>Quét Mã VietQR</span>
                </span>
                <span className={`size-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === "qr" ? "border-[#C2410C] bg-[#C2410C]" : "border-[#D8D4CA]"
                }`}>
                  {paymentMethod === "qr" && <span className="size-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="text-[11px] text-[#5C605C]">Chuyển khoản 24/7 qua mã QR tự động điền số tiền và nội dung.</p>
            </button>

            {/* 3. ShopeePay / MoMo */}
            <button
              type="button"
              onClick={() => setPaymentMethod("shopeepay")}
              className={`rounded-2xl border p-3.5 text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                paymentMethod === "shopeepay"
                  ? "border-[#C2410C] bg-[#C2410C]/5 ring-2 ring-[#C2410C]/25"
                  : "border-[#D8D4CA] bg-[#FAF8F5] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#191B19] flex items-center gap-1">
                  <Wallet className="size-3.5 text-[#C2410C]" />
                  <span>Ví ShopeePay</span>
                </span>
                <span className={`size-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === "shopeepay" ? "border-[#C2410C] bg-[#C2410C]" : "border-[#D8D4CA]"
                }`}>
                  {paymentMethod === "shopeepay" && <span className="size-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="text-[11px] text-[#5C605C]">Giảm thêm 10k khi thanh toán bằng ví điện tử ShopeePay.</p>
            </button>

            {/* 4. Thẻ Quốc Tế Visa / Mastercard */}
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`rounded-2xl border p-3.5 text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                paymentMethod === "card"
                  ? "border-[#C2410C] bg-[#C2410C]/5 ring-2 ring-[#C2410C]/25"
                  : "border-[#D8D4CA] bg-[#FAF8F5] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#191B19]">Thẻ Visa / Master</span>
                <span className={`size-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === "card" ? "border-[#C2410C] bg-[#C2410C]" : "border-[#D8D4CA]"
                }`}>
                  {paymentMethod === "card" && <span className="size-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="text-[11px] text-[#5C605C]">Hỗ trợ thẻ tín dụng và thẻ ghi nợ quốc tế mọi ngân hàng.</p>
            </button>
          </div>

          {/* Nếu chọn Quét QR: Hiển thị Demo mã VietQR thanh toán ngay */}
          {paymentMethod === "qr" && (
            <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 flex flex-col sm:flex-row items-center gap-4 text-xs">
              <div className="size-28 bg-white border border-[#D8D4CA] rounded-xl p-2 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                <QrCode className="size-20 text-[#191B19]" />
                <span className="text-[9px] font-mono font-bold text-[#C2410C]">VIETQR 24/7</span>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <span className="font-bold text-sm text-[#191B19] block">
                  Quét Mã Để Thanh Toán {formatMoney(finalTotal)}
                </span>
                <p className="text-[#5C605C]">Ngân hàng: <strong>Vietcombank (Chi nhánh Sài Gòn)</strong></p>
                <p className="text-[#5C605C]">Số tài khoản: <strong className="font-mono text-[#191B19]">1038 9999 8888</strong></p>
                <p className="text-[#5C605C]">Nội dung chuyển khoản: <strong className="font-mono text-[#C2410C]">SKINSENSE {recipientPhone.slice(-4)}</strong></p>
              </div>
            </div>
          )}
        </div>

        {/* KHỐI 6: CHI TIẾT THANH TOÁN & NÚT ĐẶT HÀNG (ORDER SUMMARY & CTA) */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 text-xs sm:text-sm">
            {/* Điều khoản & Cam kết Shopee */}
            <div className="space-y-1.5 text-xs text-[#5C605C] max-w-md">
              <div className="flex items-center gap-1.5 text-[#2D5A43] font-bold">
                <ShieldCheck className="size-4" />
                <span>Shopee Đảm Bảo - An Tâm Mua Sắm Dược Mỹ Phẩm</span>
              </div>
              <p>
                Nhấn "Đặt Hàng" đồng nghĩa với việc bạn đồng ý tuân theo Điều Khoản Dịch Vụ Shopee Mall và Chính Sách Hoàn Tiền 100% của SkinSense.
              </p>
            </div>

            {/* Bảng Chi Tiết Tiền */}
            <div className="space-y-2 min-w-[280px]">
              <div className="flex justify-between text-[#5C605C]">
                <span>Tổng tiền hàng ({items.reduce((acc, i) => acc + i.quantity, 0)} món):</span>
                <span className="text-[#191B19] font-medium">{formatMoney(rawTotal)}</span>
              </div>

              <div className="flex justify-between text-[#5C605C]">
                <span>Phí vận chuyển:</span>
                <span>{formatMoney(shippingFeeVnd)}</span>
              </div>

              <div className="flex justify-between text-[#2D5A43]">
                <span>Giảm giá phí vận chuyển:</span>
                <span>-{formatMoney(shippingDiscountVnd)}</span>
              </div>

              {useShopVoucher && (
                <div className="flex justify-between text-[#C2410C]">
                  <span>Voucher giảm giá của Shop:</span>
                  <span>-{formatMoney(shopVoucherDiscountVnd)}</span>
                </div>
              )}

              {useCoins && (
                <div className="flex justify-between text-amber-700">
                  <span>Dùng Xu Shopee:</span>
                  <span>-{formatMoney(coinDiscountVnd)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#D8D4CA] flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#191B19]">Tổng thanh toán:</span>
                <span className="text-2xl sm:text-3xl font-bold font-serif text-[#C2410C]">
                  {formatMoney(finalTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Nút Đặt Hàng To Bản */}
          <div className="pt-2 border-t border-[#D8D4CA]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#5C605C] hidden sm:block">
              Phương thức: <strong>{
                paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" :
                paymentMethod === "qr" ? "Quét mã VietQR" :
                paymentMethod === "shopeepay" ? "Ví ShopeePay" : "Thẻ Visa / Master"
              }</strong>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              className="w-full sm:w-auto h-12 px-10 flex items-center justify-center gap-2 rounded-2xl bg-[#C2410C] text-sm font-bold text-white shadow-md hover:bg-[#9A3412] active:scale-[0.98] transition cursor-pointer"
            >
              <ShoppingBag className="size-5" />
              <span>Đặt Hàng ({formatMoney(finalTotal)})</span>
            </button>
          </div>
        </div>
      </main>

      {/* MODAL: ĐẶT HÀNG THÀNH CÔNG */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="size-16 rounded-full bg-[#2D5A43]/10 text-[#2D5A43] flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-10" />
            </div>

            <div className="space-y-1">
              <span className="rounded-md bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white">
                Shopee Mall Chính Hãng
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#191B19] mt-2">
                Đặt Hàng Thành Công!
              </h3>
              <p className="text-xs text-[#5C605C]">
                Cảm ơn bạn đã tin dùng sản phẩm theo phác đồ y khoa của SkinSense.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#D8D4CA] p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-[#5C605C]">Mã vận đơn Shopee:</span>
                <strong className="font-mono text-[#C2410C] text-sm">{orderCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C605C]">Tổng thanh toán:</span>
                <strong className="font-bold text-[#191B19]">{formatMoney(finalTotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C605C]">Hình thức thanh toán:</span>
                <span className="font-semibold text-[#191B19]">
                  {paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản VietQR"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C605C]">Giao tới:</span>
                <span className="font-semibold text-[#191B19] truncate max-w-[250px]">{recipientAddress}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/shop"
                className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white text-xs font-bold text-[#191B19] hover:bg-[#E8E5DE] transition"
              >
                <span>Tiếp Tục Mua Sắm</span>
              </Link>
              <Link
                href="/user/routine"
                className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl bg-[#C2410C] text-xs font-bold text-white shadow-xs hover:bg-[#9A3412] transition"
              >
                <span>Xem Lại Phác Đồ Routine</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SỬA ĐỊA CHỈ NHẬN HÀNG */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
              <h4 className="font-bold text-base text-[#191B19]">Thay Đổi Địa Chỉ Nhận Hàng</h4>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-[#5C605C] hover:text-[#191B19] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Họ và tên người nhận</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Địa chỉ giao hàng chi tiết</label>
                <textarea
                  rows={2}
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D8D4CA]">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="rounded-xl border border-[#D8D4CA] bg-white px-4 py-2 text-xs font-semibold text-[#5C605C]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddressModalOpen(false);
                  toast.success("Đã cập nhật địa chỉ giao hàng!");
                }}
                className="rounded-xl bg-[#C2410C] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#9A3412]"
              >
                Lưu Địa Chỉ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
