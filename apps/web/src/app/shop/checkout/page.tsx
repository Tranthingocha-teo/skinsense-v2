"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Package,
  Smartphone,
  ExternalLink,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";
import { INITIAL_SHOPEE_PRODUCTS, ShopeeProduct } from "@/app/shop/page";

// ============================================================================
// 1. CẤU HÌNH SHOP & MÃ QR MOMO CỐ ĐỊNH CHO TỪNG GIAN HÀNG ("MỖI SHOP 1 MÃ CỐ ĐỊNH")
// ============================================================================
export interface ShopMoMoProfile {
  shopId: string;
  shopName: string;
  brand: string;
  momoReceiver: string;
  momoPhone: string;
  momoCode: string;
  badge: string;
  address: string;
}

export const SHOP_MOMO_PROFILES: Record<string, ShopMoMoProfile> = {
  "La Roche-Posay": {
    shopId: "shop_lrp",
    shopName: "La Roche-Posay Flagship Store",
    brand: "La Roche-Posay",
    momoReceiver: "L'OREAL VIETNAM - LA ROCHE-POSAY",
    momoPhone: "0901 234 567",
    momoCode: "MOMO-LRP-MALL",
    badge: "Shopee Mall Chính Hãng",
    address: "Tòa nhà L'Oreal, Quận 1, TP. Hồ Chí Minh",
  },
  "CeraVe": {
    shopId: "shop_cerave",
    shopName: "CeraVe Vietnam Official Store",
    brand: "CeraVe",
    momoReceiver: "CERAVE OFFICIAL STORE VN",
    momoPhone: "0902 345 678",
    momoCode: "MOMO-CERAVE-MALL",
    badge: "Shopee Mall Chính Hãng",
    address: "Tòa nhà CentrePoint, Quận Phú Nhuận, TP. HCM",
  },
  "Paula's Choice": {
    shopId: "shop_paula",
    shopName: "Paula's Choice Skincare Vietnam",
    brand: "Paula's Choice",
    momoReceiver: "PAULA CHOICE VN CO., LTD",
    momoPhone: "0903 456 789",
    momoCode: "MOMO-PAULA-MALL",
    badge: "Shopee Mall Chính Hãng",
    address: "Phường Thảo Điền, TP. Thủ Đức, TP. HCM",
  },
  "Skin1004": {
    shopId: "shop_skin1004",
    shopName: "Skin1004 Official Vietnam",
    brand: "Skin1004",
    momoReceiver: "SKIN1004 VIETNAM STORE",
    momoPhone: "0905 678 901",
    momoCode: "MOMO-SKIN1004-MALL",
    badge: "Shopee Mall Chính Hãng",
    address: "Phường 2, Quận Tân Bình, TP. HCM",
  },
  "The Ordinary": {
    shopId: "shop_to",
    shopName: "The Ordinary Authentic Mall",
    brand: "The Ordinary",
    momoReceiver: "DECIEM BEAUTY VIETNAM",
    momoPhone: "0906 789 012",
    momoCode: "MOMO-TO-MALL",
    badge: "Shopee Mall Chính Hãng",
    address: "Tòa nhà Bitexco, Quận 1, TP. HCM",
  },
  "Anua": {
    shopId: "shop_anua",
    shopName: "Anua Skincare Official Store",
    brand: "Anua",
    momoReceiver: "ANUA KOREA & VIETNAM",
    momoPhone: "0907 890 123",
    momoCode: "MOMO-ANUA-MALL",
    badge: "Shopee Mall Chính Hãng",
    address: "Quận Hoàn Kiếm, Hà Nội",
  },
  "Dear Klairs": {
    shopId: "shop_klairs",
    shopName: "Klairs Official Vietnam Store",
    brand: "Dear Klairs",
    momoReceiver: "KLAIRS OFFICIAL VIETNAM",
    momoPhone: "0908 901 234",
    momoCode: "MOMO-KLAIRS-MALL",
    badge: "Shopee Mall Chính Hãng",
    address: "Phường Đa Kao, Quận 1, TP. HCM",
  },
  "COSRX": {
    shopId: "shop_cosrx",
    shopName: "COSRX Official Flagship Store",
    brand: "COSRX",
    momoReceiver: "COSRX VIETNAM STORE",
    momoPhone: "0909 012 345",
    momoCode: "MOMO-COSRX-MALL",
    badge: "Shopee Mall Chính Hãng",
    address: "Quận Cầu Giấy, Hà Nội",
  },
  default: {
    shopId: "shop_skinsense",
    shopName: "SkinSense Official Medical Mall",
    brand: "SkinSense",
    momoReceiver: "SKINSENSE CLINIC & PHARMACY",
    momoPhone: "0901 888 999",
    momoCode: "MOMO-SKINSENSE-MALL",
    badge: "Shopee Mall Chính Hãng",
    address: "Tòa nhà Landmark 72, Nam Từ Liêm, Hà Nội",
  },
};

/** "16 Tháng 11 - 18 Tháng 11": today to two days out (this used to be a fixed date in the copy). */
// Vietnam time on purpose: the server renders in UTC, so getDate() there and in the browser gave
// different days for 7 hours each night (React hydration error #418).
function deliveryWindowLabel(now: Date): string {
  const label = (d: Date) => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "numeric" }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value;
    return `${get("day")} Tháng ${get("month")}`;
  };
  return `${label(now)} - ${label(new Date(now.getTime() + 2 * 86_400_000))}`;
}

interface CheckoutItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  variant: string;
  volume: string;
  image: string;
  priceVnd: number;
  originalPriceVnd: number;
  quantity: number;
  selected: boolean;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0₫";
}

// ============================================================================
// 2. CHECKOUT INNER COMPONENT (WRAPPED IN SUSPENSE FOR NEXT.JS)
// ============================================================================
function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productIdParam = searchParams.get("productId");
  const variantParam = parseInt(searchParams.get("variant") || "0", 10);
  const qtyParam = Math.max(1, parseInt(searchParams.get("quantity") || searchParams.get("qty") || "1", 10));
  const modeParam = searchParams.get("mode");

  // Khởi tạo sản phẩm thanh toán: Ưu tiên đúng 1 sản phẩm được bấm "Mua Ngay"
  const [items, setItems] = useState<CheckoutItem[]>(() => {
    if (productIdParam) {
      const found = INITIAL_SHOPEE_PRODUCTS.find((p) => p.id === productIdParam);
      if (found) {
        const chosenVariant = found.variants[variantParam] || found.variants[0];
        return [
          {
            id: `item_${found.id}`,
            productId: found.id,
            name: found.name,
            brand: found.brand,
            variant: chosenVariant ? chosenVariant.name : `Dung tích ${found.specifications.volume}`,
            volume: found.specifications.volume,
            image: found.coverImage,
            priceVnd: chosenVariant ? chosenVariant.priceVnd : found.priceVnd,
            originalPriceVnd: chosenVariant ? chosenVariant.originalPriceVnd : found.originalPriceVnd,
            quantity: qtyParam,
            selected: true,
          },
        ];
      }
    }

    if (modeParam === "routine") {
      const routineProds = INITIAL_SHOPEE_PRODUCTS.slice(0, 4);
      return routineProds.map((p) => ({
        id: `item_${p.id}`,
        productId: p.id,
        name: p.name,
        brand: p.brand,
        variant: p.variants[0]?.name || `Dung tích ${p.specifications.volume}`,
        volume: p.specifications.volume,
        image: p.coverImage,
        priceVnd: p.priceVnd,
        originalPriceVnd: p.originalPriceVnd,
        quantity: 1,
        selected: true,
      }));
    }

    const defaultProd = INITIAL_SHOPEE_PRODUCTS[0];
    return [
      {
        id: `item_${defaultProd.id}`,
        productId: defaultProd.id,
        name: defaultProd.name,
        brand: defaultProd.brand,
        variant: defaultProd.variants[0]?.name || `Dung tích ${defaultProd.specifications.volume}`,
        volume: defaultProd.specifications.volume,
        image: defaultProd.coverImage,
        priceVnd: defaultProd.priceVnd,
        originalPriceVnd: defaultProd.originalPriceVnd,
        quantity: 1,
        selected: true,
      },
    ];
  });

  // Tự động cập nhật sản phẩm khi query param thay đổi (VD: bấm "Mua Ngay" sản phẩm khác trên shop)
  useEffect(() => {
    if (productIdParam) {
      const found = INITIAL_SHOPEE_PRODUCTS.find((p) => p.id === productIdParam);
      if (found) {
        const chosenVariant = found.variants[variantParam] || found.variants[0];
        setItems([
          {
            id: `item_${found.id}`,
            productId: found.id,
            name: found.name,
            brand: found.brand,
            variant: chosenVariant ? chosenVariant.name : `Dung tích ${found.specifications.volume}`,
            volume: found.specifications.volume,
            image: found.coverImage,
            priceVnd: chosenVariant ? chosenVariant.priceVnd : found.priceVnd,
            originalPriceVnd: chosenVariant ? chosenVariant.originalPriceVnd : found.originalPriceVnd,
            quantity: qtyParam,
            selected: true,
          },
        ]);
      }
    }
  }, [productIdParam, variantParam, qtyParam]);

  // Thông tin địa chỉ giao hàng
  // Prefilled from the signed-in buyer's own profile. It used to be one fixed person's name, phone
  // and home address for every buyer, so orders went out under someone else's identity.
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then(async (me: { authenticated?: boolean }) => {
        if (!me?.authenticated) return;
        const res = await fetch("/api/profile?role=customer", { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          user?: { fullName?: string; phone?: string; customer?: { address?: string } };
        };
        if (cancelled || !data?.ok || !data.user) return;
        const u = data.user;
        setRecipientName((prev) => prev || u.fullName || "");
        setRecipientPhone((prev) => prev || u.phone || "");
        setRecipientAddress((prev) => prev || u.customer?.address || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [deliveryWindow] = useState(() => deliveryWindowLabel(new Date()));

  // Lời nhắn cho shop
  const [sellerNote, setSellerNote] = useState("Gói hàng kỹ kèm túi chống sốc giúp mình nha shop.");

  // PHƯƠNG THỨC THANH TOÁN (Mặc định là MoMo theo chỉ đạo của Hà)
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "cod" | "vietqr" | "card">("momo");

  // Vouchers & Xu Shopee
  const [useShopVoucher, setUseShopVoucher] = useState(true);
  const [useCoins, setUseCoins] = useState(false);
  const coinDiscountVnd = 20000;
  const shopVoucherDiscountVnd = 50000;
  const shippingFeeVnd = 40000;
  const shippingDiscountVnd = 40000; // Freeship Xtra

  // Mã đơn hàng được sinh ra khi thanh toán (Khởi tạo sẵn để mã QR luôn luôn có mã chuẩn xác, không bao giờ rỗng)
  // Generated in the browser only: a random value in the initial state differs between the
  // server render and hydration. Every submit makes its own fresh code anyway.
  const [orderCode, setOrderCode] = useState("");
  useEffect(() => {
    setOrderCode((code) => code || `SHOPEE-SS-${Math.floor(100000 + Math.random() * 900000)}`);
  }, []);
  const [modalOpenedAt, setModalOpenedAt] = useState<number>(0);

  // ==========================================================================
  // STATE CHO POPUP MÃ QR MOMO ("SAU QUÉT TỰ TẮT")
  // ==========================================================================
  const [isMomoModalOpen, setIsMomoModalOpen] = useState(false);
  const [momoScanningState, setMomoScanningState] = useState<"waiting" | "success">("waiting");
  const [momoCountdown, setMomoCountdown] = useState(300); // 5 phút

  // Modal đơn hàng thành công sau khi popup MoMo tự tắt
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Helper tính toán các sản phẩm được chọn
  const selectedItems = useMemo(() => items.filter((i) => i.selected), [items]);

  // Xác định Shop và Mã MoMo cố định tương ứng với sản phẩm đang thanh toán
  const activeShop = useMemo(() => {
    const primaryBrand = selectedItems[0]?.brand;
    if (primaryBrand && SHOP_MOMO_PROFILES[primaryBrand]) {
      return SHOP_MOMO_PROFILES[primaryBrand];
    }
    return SHOP_MOMO_PROFILES.default;
  }, [selectedItems]);

  const rawTotal = selectedItems.reduce((acc, item) => acc + item.priceVnd * item.quantity, 0);
  const voucherDiscount = useShopVoucher && rawTotal >= 300000 ? shopVoucherDiscountVnd : 0;
  const coinsDeduction = useCoins ? Math.min(rawTotal, coinDiscountVnd) : 0;
  const finalTotal = Math.max(0, rawTotal + (shippingFeeVnd - shippingDiscountVnd) - voucherDiscount - coinsDeduction);

  // ==========================================================================
  // XÁC ĐỊNH ĐƯỜNG LINK QUÉT THANH TOÁN CHO ĐIỆN THOẠI (CÙNG MẠNG WI-FI HOẶC TEST)
  // ==========================================================================
  const [hostIp, setHostIp] = useState("192.168.1.3");
  const [port, setPort] = useState("3000");

  // On a deployment the phone opens this same origin. It used to be http://<host>:<port || 3000>,
  // which on https://…vercel.app became http://…vercel.app:3000 — a QR no phone could open.
  // Only a local dev server (localhost) needs the LAN address guess.
  const [deployedOrigin, setDeployedOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPort(window.location.port || "3000");
      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        setHostIp(window.location.hostname);
        setDeployedOrigin(window.location.origin);
      }
    }
  }, []);

  const payDemoPath = useMemo(() => {
    if (!orderCode) return "";
    return `/pay-demo?orderCode=${encodeURIComponent(orderCode)}&amount=${finalTotal}&shop=${encodeURIComponent(activeShop.shopName)}`;
  }, [orderCode, finalTotal, activeShop.shopName]);

  const mobilePayUrl = useMemo(() => {
    if (!payDemoPath) return "";
    return `${deployedOrigin || `http://${hostIp}:${port}`}${payDemoPath}`;
  }, [deployedOrigin, hostIp, port, payDemoPath]);

  // Tạo mã QR bằng thư viện qrcode nội bộ, đảm bảo 100% offline, sắc nét, không bị trễ hay lỗi mạng ngoài
  const [qrBase64, setQrBase64] = useState<string>("");

  useEffect(() => {
    if (!mobilePayUrl) return;
    import("qrcode")
      .then((QRCode) => {
        QRCode.toDataURL(mobilePayUrl, {
          errorCorrectionLevel: "H",
          margin: 1,
          width: 280,
          color: {
            dark: "#191B19",
            light: "#FFFFFF",
          },
        })
          .then(setQrBase64)
          .catch(() => {});
      })
      .catch(() => {});
  }, [mobilePayUrl]);

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

  // Switch product helper (cho phép đổi nhanh sang món khác)
  function handleSelectAnotherProduct(prodId: string) {
    const p = INITIAL_SHOPEE_PRODUCTS.find((item) => item.id === prodId);
    if (!p) return;

    setItems([
      {
        id: `item_${p.id}`,
        productId: p.id,
        name: p.name,
        brand: p.brand,
        variant: p.variants[0]?.name || `Dung tích ${p.specifications.volume}`,
        volume: p.specifications.volume,
        image: p.coverImage,
        priceVnd: p.priceVnd,
        originalPriceVnd: p.originalPriceVnd,
        quantity: 1,
        selected: true,
      },
    ]);
    toast.info(`Đã chọn sản phẩm của Shop: ${p.brand}`);
  }

  // ==========================================================================
  // XỬ LÝ ĐẶT HÀNG / GỌI BACKEND TẠO ĐƠN HÀNG MỚI (STATUS: PENDING)
  // ==========================================================================
  async function handlePlaceOrder() {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
      return;
    }

    if (!recipientName.trim() || !recipientPhone.trim() || !recipientAddress.trim()) {
      toast.error("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.");
      setIsAddressModalOpen(true);
      return;
    }

    // A fresh code per order: reusing the previous one would collide with the order just placed.
    const activeOrderCode = `SHOPEE-SS-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderCode(activeOrderCode);
    const nowTimestamp = Date.now();
    setModalOpenedAt(nowTimestamp);

    // Lưu đơn hàng vào backend API /api/orders (Trạng thái pending). The QR or the success screen
    // only opens once the order is saved: it used to open even when saving failed (signed out,
    // network), so the buyer "paid" for an order that did not exist.
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: activeOrderCode,
          customerName: recipientName,
          customerPhone: recipientPhone,
          shippingAddress: recipientAddress,
          totalAmount: finalTotal,
          paymentMethod,
          shopName: activeShop.shopName,
          brand: activeShop.brand,
          items: selectedItems.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.priceVnd,
            quantity: i.quantity,
            variant: i.variant,
          })),
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(
          res.status === 401
            ? "Vui lòng đăng nhập để đặt hàng."
            : json?.error || "Không thể tạo đơn hàng, vui lòng thử lại.",
        );
        return;
      }
    } catch {
      toast.error("Lỗi kết nối khi tạo đơn hàng, vui lòng thử lại.");
      return;
    }

    if (paymentMethod === "momo" || paymentMethod === "vietqr") {
      // Bật Popup hiển thị Mã QR MoMo cố định của shop
      setMomoScanningState("waiting");
      setMomoCountdown(300);
      setIsMomoModalOpen(true);
      toast.info(`Đang mở mã QR MoMo của Shop ${activeShop.shopName}...`);
    } else {
      // Với COD hoặc Thẻ: Thành công ngay lập tức
      setIsSuccessModalOpen(true);
      toast.success("Đặt hàng thành công! Đơn hàng đang được chuẩn bị.");
    }
  }

  // ==========================================================================
  // REAL BACKEND POLLING: Kiểm tra trạng thái thanh toán từ điện thoại
  // Khi điện thoại bấm "Xác nhận thanh toán" -> Backend đổi trạng thái đơn hàng ->
  // Màn hình máy tính nhận được tín hiệu -> TỰ ĐỘNG TẮT POPUP MÃ QR!
  // ==========================================================================
  useEffect(() => {
    if (!isMomoModalOpen || !orderCode) return;

    let hasHandledSuccess = false;

    // 1. Đếm ngược thời gian hết hạn mã (1s/lần)
    const countdownInterval = setInterval(() => {
      setMomoCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // 2. Polling Backend: Hỏi /api/orders/[id]/status mỗi 1.0 giây (Kèm since để chống lệch mã)
    const pollingInterval = setInterval(async () => {
      if (hasHandledSuccess) return;
      try {
        const sinceParam = modalOpenedAt > 0 ? modalOpenedAt : Date.now() - 30000;
        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderCode)}/status?t=${Date.now()}&since=${sinceParam}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          },
        );

        let data: { ok?: boolean; paid?: boolean } | null = null;
        if (res.ok) {
          data = await res.json();
        } else {
          // Fallback tới endpoint phụ /api/orders/status
          const fbRes = await fetch(
            `/api/orders/status?code=${encodeURIComponent(orderCode)}&t=${Date.now()}&since=${sinceParam}`,
          );
          if (fbRes.ok) {
            data = await fbRes.json();
          }
        }

        if (data && data.ok && data.paid) {
          hasHandledSuccess = true;
          clearInterval(pollingInterval);
          setMomoScanningState("success");
          toast.success("🎉 Điện thoại đã thanh toán MoMo thành công!");

          // "SAU QUÉT TỰ TẮT": Đợi 1.2 giây để thấy thông báo thành công rồi tự động đóng popup!
          setTimeout(() => {
            setIsMomoModalOpen(false);
            setIsSuccessModalOpen(true);
          }, 1200);
        }
      } catch {
        // Bỏ qua lỗi kết nối polling nếu mạng chập chờn
      }
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(pollingInterval);
    };
  }, [isMomoModalOpen, orderCode, modalOpenedAt]);


  // Format đếm ngược mm:ss
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
                Thanh Toán MoMo & Dược Mỹ Phẩm Chính Hãng
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3.5 py-1.5 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition"
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
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
              >
                Thay đổi
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
              <div className="font-bold text-[#191B19]">
                {recipientName || "Chưa có người nhận"}{" "}
                {recipientPhone && <span className="font-mono font-medium text-[#5C605C]">({recipientPhone})</span>}
              </div>
              <div className="text-[#5C605C] flex-1 line-clamp-2">
                {recipientAddress || "Chưa có địa chỉ, bấm “Thay đổi” để nhập."}
              </div>
              <span className="self-start sm:self-auto rounded-md border border-[#C2410C] bg-[#C2410C]/5 px-2 py-0.5 text-[10px] font-bold text-[#C2410C]">
                Mặc định
              </span>
            </div>
          </div>
        </div>

        {/* KHỐI 2: DANH SÁCH SẢN PHẨM THANH TOÁN (THEO TỪNG GIAN HÀNG) */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white overflow-hidden shadow-xs">
          {/* Header Shop Shopee Mall & Mã Cố Định */}
          <div className="border-b border-[#D8D4CA] bg-[#FAF8F5] px-5 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="rounded-md bg-[#C2410C] px-2 py-0.5 text-[11px] font-bold text-white">
                Shopee Mall
              </span>
              <Store className="size-4 text-[#5C605C]" />
              <span className="font-serif font-bold text-sm text-[#191B19]">
                {activeShop.shopName}
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-600" />
                <span>100% Chính Hãng</span>
              </span>
            </div>

            {/* Thông tin mã MoMo cố định của shop */}
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-lg bg-pink-50 border border-pink-200 px-2.5 py-1 text-[11px] font-bold text-[#A50064] flex items-center gap-1.5">
                <Smartphone className="size-3.5" />
                <span>Mã MoMo Shop: <strong className="font-mono">{activeShop.momoCode}</strong></span>
              </span>
            </div>
          </div>

          {/* Ô chọn đổi nhanh sản phẩm khác nếu muốn */}
          <div className="bg-[#FFFBEB] border-b border-amber-200/80 px-5 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-900 font-medium">
              <Sparkles className="size-4 text-amber-600 shrink-0" />
              <span>Đang thanh toán cho gian hàng <strong>{activeShop.brand}</strong>. Muốn đổi món khác?</span>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="prodSelect" className="text-amber-800 font-semibold text-[11px]">Đổi sản phẩm:</label>
              <select
                id="prodSelect"
                value={selectedItems[0]?.productId || ""}
                onChange={(e) => handleSelectAnotherProduct(e.target.value)}
                className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs text-[#191B19] focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer"
              >
                {INITIAL_SHOPEE_PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.brand}] - {p.name.slice(0, 45)}... ({formatMoney(p.priceVnd)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bảng sản phẩm */}
          <div className="divide-y divide-[#D8D4CA]/60">
            {items.map((item) => (
              <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => {
                      setItems((prev) =>
                        prev.map((i) => (i.id === item.id ? { ...i, selected: e.target.checked } : i)),
                      );
                    }}
                    className="size-4 rounded border-[#D8D4CA] text-[#C2410C] focus:ring-[#C2410C] cursor-pointer"
                  />

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-20 rounded-2xl border border-[#D8D4CA] object-cover bg-white shrink-0"
                    />
                  ) : (
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-[#D8D4CA] bg-white px-1 text-center text-[10px] font-medium text-neutral-400">
                      Chưa có ảnh
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        {item.brand}
                      </span>
                      <span className="text-[11px] font-mono text-[#5C605C] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#D8D4CA]">
                        {item.volume}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-[#191B19] line-clamp-2 leading-snug">
                      {item.name}
                    </h4>

                    <div className="text-[11px] text-[#5C605C]">
                      Phân loại: <span className="font-medium text-[#191B19]">{item.variant}</span>
                    </div>
                  </div>
                </div>

                {/* Cột giá & số lượng */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-[#D8D4CA]/40">
                  <div className="text-right">
                    <div className="font-serif font-bold text-sm text-[#C2410C]">
                      {formatMoney(item.priceVnd)}
                    </div>
                    {item.originalPriceVnd > item.priceVnd && (
                      <div className="text-[11px] text-[#5C605C] line-through">
                        {formatMoney(item.originalPriceVnd)}
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="size-7 flex items-center justify-center text-[#5C605C] hover:bg-white transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#191B19]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="size-7 flex items-center justify-center text-[#5C605C] hover:bg-white transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="min-w-[100px] text-right font-serif font-bold text-sm text-[#191B19]">
                    {formatMoney(item.priceVnd * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lời nhắn cho shop */}
          <div className="border-t border-[#D8D4CA] bg-[#FAF8F5]/50 px-5 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#5C605C]">
              <span>Lời nhắn cho shop:</span>
              <input
                type="text"
                value={sellerNote}
                onChange={(e) => setSellerNote(e.target.value)}
                placeholder="Lưu ý cho Người bán..."
                className="flex-1 sm:w-80 rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19] focus:outline-none focus:border-[#C2410C]"
              />
            </div>

            <div className="flex items-center gap-2 text-[#5C605C] text-[11px]">
              <Truck className="size-4 text-[#2D5A43]" />
              <span>Được đồng kiểm khi nhận hàng</span>
            </div>
          </div>
        </div>

        {/* KHỐI 3: PHƯƠNG THỨC VẬN CHUYỂN (FREESHIP XTRA) */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-[#191B19]">
              <Truck className="size-4.5 text-[#2D5A43]" />
              <span>Phương Thức Vận Chuyển</span>
            </div>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Freeship Xtra
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-[#191B19]">
                <span>Nhanh - SPX Express (Giao Tiết Kiệm)</span>
                <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                  Miễn phí
                </span>
              </div>
              <p className="text-[11px] text-[#5C605C]">
                Nhận hàng vào <strong>{deliveryWindow}</strong> (Giao hỏa tốc dược mỹ phẩm đóng gói cẩn thận)
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#5C605C] line-through mr-2">{formatMoney(shippingFeeVnd)}</span>
              <span className="font-serif font-bold text-sm text-[#2D5A43]">0&nbsp;₫</span>
            </div>
          </div>
        </div>

        {/* KHỐI 4: VOUCHER GIẢM GIÁ & XU SHOPEE */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-[#191B19]">
              <Tag className="size-4.5 text-[#C2410C]" />
              <span>Shopee Voucher & Khuyến Mãi Shop</span>
            </div>

            <span className="text-xs font-semibold text-[#C2410C]">
              Tiết kiệm đến 90.000&nbsp;₫
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Voucher Shop */}
            <div
              onClick={() => setUseShopVoucher(!useShopVoucher)}
              className={`rounded-2xl border p-3.5 flex items-center justify-between transition cursor-pointer ${
                useShopVoucher
                  ? "border-[#C2410C] bg-[#C2410C]/5"
                  : "border-[#D8D4CA] bg-[#FAF8F5] opacity-80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-[#C2410C] text-white flex items-center justify-center font-bold text-xs">
                  %
                </div>
                <div>
                  <div className="font-bold text-[#191B19]">Voucher Shop Giảm 50.000₫</div>
                  <div className="text-[11px] text-[#5C605C]">Áp dụng cho đơn từ 300k</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useShopVoucher}
                onChange={() => {}}
                className="size-4 rounded text-[#C2410C] focus:ring-[#C2410C] cursor-pointer"
              />
            </div>

            {/* Dùng Xu */}
            <div
              onClick={() => setUseCoins(!useCoins)}
              className={`rounded-2xl border p-3.5 flex items-center justify-between transition cursor-pointer ${
                useCoins
                  ? "border-amber-500 bg-amber-50/60"
                  : "border-[#D8D4CA] bg-[#FAF8F5] opacity-80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  <Coins className="size-4" />
                </div>
                <div>
                  <div className="font-bold text-[#191B19]">Dùng 20.000 Xu Shopee</div>
                  <div className="text-[11px] text-[#5C605C]">Giảm trực tiếp 20.000₫</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useCoins}
                onChange={() => {}}
                className="size-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* KHỐI 5: PHƯƠNG THỨC THANH TOÁN (ƯU TIÊN QUÉT MÃ MOMO CỐ ĐỊNH CỦA SHOP) */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[#191B19]">
              <Wallet className="size-4.5 text-[#A50064]" />
              <span>Phương Thức Thanh Toán</span>
            </div>

            <span className="text-xs font-semibold text-[#A50064] bg-pink-50 border border-pink-200 rounded-full px-3 py-0.5 flex items-center gap-1">
              <Zap className="size-3" />
              <span>Quét MoMo - Tự động tắt sau khi quét</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. VÍ MOMO (MÃ QR SHOP CỐ ĐỊNH) - THEO YÊU CẦU CỦA HÀ */}
            <button
              type="button"
              onClick={() => setPaymentMethod("momo")}
              className={`rounded-2xl border p-3.5 text-left transition cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                paymentMethod === "momo"
                  ? "border-[#A50064] bg-pink-50/70 ring-2 ring-[#A50064]/25"
                  : "border-[#D8D4CA] bg-[#FAF8F5] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#A50064] flex items-center gap-1.5">
                  <Smartphone className="size-4 text-[#A50064]" />
                  <span>Ví Điện Tử MoMo</span>
                </span>
                <span className={`size-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === "momo" ? "border-[#A50064] bg-[#A50064]" : "border-[#D8D4CA]"
                }`}>
                  {paymentMethod === "momo" && <span className="size-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="text-[11px] text-[#5C605C]">
                Hiện mã QR MoMo cố định của shop, quét xong tự tắt và tạo đơn hàng.
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#A50064] pt-1">
                <span className="rounded bg-pink-200/60 px-1.5 py-0.5">Khuyên dùng</span>
                <span>{activeShop.momoCode}</span>
              </div>
            </button>

            {/* 2. Thanh toán COD */}
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

            {/* 3. VietQR Ngân Hàng */}
            <button
              type="button"
              onClick={() => setPaymentMethod("vietqr")}
              className={`rounded-2xl border p-3.5 text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                paymentMethod === "vietqr"
                  ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/25"
                  : "border-[#D8D4CA] bg-[#FAF8F5] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#191B19] flex items-center gap-1">
                  <QrCode className="size-3.5 text-blue-600" />
                  <span>Quét Mã VietQR</span>
                </span>
                <span className={`size-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === "vietqr" ? "border-blue-600 bg-blue-600" : "border-[#D8D4CA]"
                }`}>
                  {paymentMethod === "vietqr" && <span className="size-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <p className="text-[11px] text-[#5C605C]">Chuyển khoản 24/7 qua mã VietQR liên ngân hàng.</p>
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
              <p className="text-[11px] text-[#5C605C]">Hỗ trợ thẻ tín dụng và ghi nợ quốc tế mọi ngân hàng.</p>
            </button>
          </div>

          {/* Banner hướng dẫn thanh toán MoMo cố định theo lời Hà */}
          {paymentMethod === "momo" && (
            <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-[#A50064] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  M
                </div>
                <div>
                  <h5 className="font-bold text-[#A50064] flex items-center gap-1.5">
                    <span>Mã QR MoMo Cố Định - {activeShop.shopName}</span>
                  </h5>
                  <p className="text-[11px] text-[#5C605C]">
                    Số tài khoản: <strong>{activeShop.momoPhone}</strong> ({activeShop.momoReceiver}) • Mã nhận diện: <strong>{activeShop.momoCode}</strong>
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-pink-700 bg-pink-100/70 border border-pink-300 rounded-xl px-3 py-1 font-medium">
                ⚡ Khi bấm &quot;Thanh Toán&quot;, quét bằng điện thoại và bấm xác nhận để màn hình tự động tắt mã.
              </div>
            </div>
          )}
        </div>

        {/* KHỐI 6: TỔNG KẾT CHI PHÍ & NÚT ĐẶT HÀNG / THANH TOÁN MOMO */}
        <div className="rounded-3xl border border-[#D8D4CA] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-end items-end gap-2 text-xs">
            <div className="w-full sm:w-96 space-y-2">
              <div className="flex justify-between text-[#5C605C]">
                <span>Tổng tiền hàng ({selectedItems.length} sản phẩm):</span>
                <span className="font-medium text-[#191B19]">{formatMoney(rawTotal)}</span>
              </div>

              <div className="flex justify-between text-[#5C605C]">
                <span>Phí vận chuyển:</span>
                <span>{formatMoney(shippingFeeVnd)}</span>
              </div>

              <div className="flex justify-between text-[#2D5A43]">
                <span>Giảm giá phí vận chuyển (Freeship):</span>
                <span>-{formatMoney(shippingDiscountVnd)}</span>
              </div>

              {useShopVoucher && voucherDiscount > 0 && (
                <div className="flex justify-between text-[#C2410C]">
                  <span>Voucher giảm giá của Shop:</span>
                  <span>-{formatMoney(shopVoucherDiscountVnd)}</span>
                </div>
              )}

              {useCoins && (
                <div className="flex justify-between text-amber-700">
                  <span>Dùng Xu Shopee:</span>
                  <span>-{formatMoney(coinsDeduction)}</span>
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
                paymentMethod === "momo" ? `Ví MoMo (QR Shop ${activeShop.brand})` :
                paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" :
                paymentMethod === "vietqr" ? "Quét mã VietQR" : "Thẻ Visa / Master"
              }</strong>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              className={`w-full sm:w-auto h-12 px-10 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-md active:scale-[0.98] transition cursor-pointer ${
                paymentMethod === "momo"
                  ? "bg-[#A50064] hover:bg-[#880052] shadow-pink-900/20"
                  : "bg-[#C2410C] hover:bg-[#9A3412]"
              }`}
            >
              {paymentMethod === "momo" ? (
                <>
                  <Smartphone className="size-5" />
                  <span>Thanh Toán MoMo ({formatMoney(finalTotal)})</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="size-5" />
                  <span>Đặt Hàng ({formatMoney(finalTotal)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* MODAL MÃ QR MOMO ("QUÉT ĐIỆN THOẠI THẬT, BACKEND XÁC NHẬN TỰ TẮT") */}
      {/* ==================================================================== */}
      {isMomoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-[#D8D4CA] bg-white overflow-hidden shadow-2xl space-y-0 text-center">
            {/* Header MoMo chuẩn nhận diện thương hiệu */}
            <div className="bg-gradient-to-r from-[#A50064] via-[#C2185B] to-[#D82D8B] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-left">
                <div className="size-9 rounded-2xl bg-white text-[#A50064] flex items-center justify-center font-bold text-base shadow-sm">
                  M
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-wide leading-tight">Thanh Toán Ví MoMo</h4>
                  <p className="text-[11px] text-pink-100">Quét Camera Điện Thoại • {activeShop.shopName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMomoModalOpen(false)}
                className="size-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Nội dung Popup QR */}
            <div className="p-6 space-y-3.5">
              {/* Thẻ thông tin Shop & Số tiền */}
              <div className="rounded-2xl bg-pink-50/60 border border-pink-100 p-3.5 text-xs text-left space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#5C605C]">Gian hàng nhận tiền:</span>
                  <span className="font-bold text-[#191B19]">{activeShop.shopName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C605C]">Chủ tài khoản MoMo:</span>
                  <span className="font-semibold text-[#191B19]">{activeShop.momoReceiver}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C605C]">Số điện thoại MoMo:</span>
                  <span className="font-mono font-bold text-[#A50064]">{activeShop.momoPhone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C605C]">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-[#191B19]">{orderCode}</span>
                </div>
                <div className="pt-1 border-t border-pink-200/80 flex justify-between items-center text-sm">
                  <span className="font-bold text-[#191B19]">Số tiền cần thanh toán:</span>
                  <span className="font-serif font-bold text-lg text-[#A50064]">
                    {formatMoney(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Khung hiển thị Mã QR MoMo + Tia Laser quét */}
              <div className="relative mx-auto w-64 h-64 rounded-3xl border-2 border-pink-300 bg-white p-3 shadow-inner flex flex-col items-center justify-center overflow-hidden">
                {/* Tia Laser Quét Động */}
                {momoScanningState === "waiting" && (
                  <div className="absolute inset-x-3 h-1 bg-gradient-to-r from-transparent via-[#D82D8B] to-transparent shadow-[0_0_12px_#D82D8B] animate-bounce pointer-events-none z-10 opacity-80" />
                )}

                {/* Mã QR dẫn trực tiếp tới trang xác nhận điện thoại pay-demo (Base64 nội bộ cực nét, quét nhạy 100%) */}
                <img
                  src={
                    qrBase64 ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(mobilePayUrl || `http://${hostIp}:${port}/pay-demo?orderCode=${orderCode}&amount=${finalTotal}`)}`
                  }
                  alt="Mã QR Quét MoMo"
                  className="w-full h-full object-contain rounded-xl select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://quickchart.io/qr?text=${encodeURIComponent(mobilePayUrl || `http://${hostIp}:${port}/pay-demo?orderCode=${orderCode}&amount=${finalTotal}`)}&size=260&margin=1`;
                  }}
                />

                {/* Lớp phủ thông báo khi quét xong ("SAU QUÉT TỰ TẮT") */}
                {momoScanningState === "success" && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in zoom-in-95 duration-200 z-20">
                    <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 animate-bounce">
                      <CheckCircle2 className="size-10" />
                    </div>
                    <h5 className="font-bold text-sm text-emerald-700">Đã Nhận Thanh Toán!</h5>
                    <p className="text-[11px] text-[#5C605C] mt-1">Cửa sổ sẽ tự đóng trong giây lát...</p>
                  </div>
                )}
              </div>

              {/* Nút bấm test mở nhanh trang điện thoại trên tab mới (không cần điện thoại vẫn test được) */}
              <div className="rounded-2xl bg-pink-50 border border-pink-200 p-2.5 flex items-center justify-between gap-2 text-left">
                <div className="text-[11px] text-[#A50064] font-medium leading-tight">
                  <span className="font-bold">📱 Test trực tiếp:</span> Dùng camera điện thoại quét QR hoặc:
                </div>
                <button
                  type="button"
                  onClick={() => window.open(payDemoPath, "_blank")}
                  className="rounded-xl bg-[#A50064] hover:bg-[#880052] active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="size-3" />
                  <span>Mở Tab Điện Thoại</span>
                </button>
              </div>

              {/* Trạng thái quét & Thời gian đếm ngược */}
              <div className="space-y-1">
                {momoScanningState === "waiting" ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#A50064]">
                    <span className="size-2 rounded-full bg-[#A50064] animate-ping" />
                    <span>Đang chờ điện thoại quét mã & bấm xác nhận...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    <span>Backend xác nhận thành công! Đang chuyển hướng...</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#5C605C]">
                  <Clock className="size-3.5" />
                  <span>Mã có hiệu lực trong: <strong className="font-mono text-[#191B19]">{formatCountdown(momoCountdown)}</strong></span>
                </div>
              </div>

              {/* Nút đóng / đổi phương thức */}
              <div className="pt-2 border-t border-[#D8D4CA]/50 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsMomoModalOpen(false)}
                  className="rounded-xl border border-[#D8D4CA] px-4 py-2 text-xs font-semibold text-[#5C605C] hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Đóng / Đổi phương thức khác
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ĐẶT HÀNG / THANH TOÁN THÀNH CÔNG */}
      {/* ==================================================================== */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
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
                Cảm ơn bạn đã tin dùng sản phẩm chăm sóc da chính hãng từ gian hàng <strong>{activeShop.shopName}</strong>.
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
              <div className="flex justify-between items-center">
                <span className="text-[#5C605C]">Hình thức thanh toán:</span>
                <span className="font-semibold text-[#191B19]">
                  {paymentMethod === "momo" ? (
                    <span className="text-[#A50064] font-bold">Ví MoMo (Đã thanh toán qua mã QR của shop)</span>
                  ) : paymentMethod === "cod" ? (
                    "Thanh toán khi nhận hàng (COD)"
                  ) : (
                    "Chuyển khoản VietQR"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C605C]">Đơn vị vận chuyển:</span>
                <span className="text-[#191B19]">SPX Express (Freeship Xtra)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C605C]">Dự kiến nhận hàng:</span>
                <span className="font-medium text-[#2D5A43]">{deliveryWindow}</span>
              </div>
              <div className="pt-2 border-t border-[#D8D4CA]/60 flex justify-between">
                <span className="text-[#5C605C]">Địa chỉ giao:</span>
                <span className="text-[#191B19] text-right max-w-[240px] truncate">{recipientAddress}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/shop"
                className="flex-1 rounded-2xl bg-[#C2410C] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#9A3412] text-center"
              >
                Tiếp Tục Mua Sắm
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  router.push("/shop");
                }}
                className="flex-1 rounded-2xl border border-[#D8D4CA] bg-white py-3 text-xs font-semibold text-[#191B19] hover:bg-[#FAF8F5]"
              >
                Về Trang Chủ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SỬA ĐỊA CHỈ NHẬN HÀNG */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#D8D4CA] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
              <h4 className="font-bold text-sm text-[#191B19]">Cập Nhật Địa Chỉ Nhận Hàng</h4>
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

// Default export wrapped in Suspense for Next.js App Router
export default function ShopCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#E8E5DE] flex items-center justify-center p-6">
          <div className="rounded-2xl border border-[#D8D4CA] bg-white p-6 shadow-sm flex items-center gap-3">
            <span className="size-5 rounded-full border-2 border-[#C2410C] border-t-transparent animate-spin" />
            <span className="text-sm font-semibold text-[#191B19]">Đang tải trang thanh toán Shopee...</span>
          </div>
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
