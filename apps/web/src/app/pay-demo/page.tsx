"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Store,
  Wallet,
  Clock,
  ArrowRight,
  Sparkles,
  QrCode,
} from "lucide-react";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0₫";
}

function PayDemoInner() {
  const searchParams = useSearchParams();

  // Ưu tiên đọc trực tiếp từ window.location.search hoặc useSearchParams
  const [orderCode, setOrderCode] = useState(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const c = sp.get("orderCode") || sp.get("code");
      if (c) return c;
    }
    return searchParams.get("orderCode") || searchParams.get("code") || "";
  });

  const [amount, setAmount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const a = sp.get("amount");
      if (a && parseInt(a, 10) > 0) return parseInt(a, 10);
    }
    const a = searchParams.get("amount");
    return a ? parseInt(a, 10) : 0;
  });

  const [shopName, setShopName] = useState(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get("shop");
      if (s) return s;
    }
    return searchParams.get("shop") || "SkinSense Mall Flagship";
  });

  // Tự động đồng bộ với Backend: Lấy chính xác giá và mã đơn hàng vừa bấm trên máy tính
  useEffect(() => {
    let code = orderCode;
    let amt = amount;
    let shop = shopName;

    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (!code) code = sp.get("orderCode") || sp.get("code") || "";
      if (!amt) {
        const a = sp.get("amount");
        if (a) amt = parseInt(a, 10);
      }
      if (!shop || shop === "SkinSense Mall Flagship") {
        const s = sp.get("shop");
        if (s) shop = s;
      }
    }

    if (code) setOrderCode(code);
    if (amt > 0) setAmount(amt);
    if (shop) setShopName(shop);

    // Only the order in the QR: without a code there is nothing to pay (it used to load
    // whichever customer's order was pending first).
    if (!code) return;

    fetch(`/api/orders/${encodeURIComponent(code)}/status?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) {
          if (data.orderCode) setOrderCode(data.orderCode);
          if (typeof data.totalAmount === "number" && data.totalAmount > 0) {
            setAmount(data.totalAmount);
          }
          if (data.shopName) setShopName(data.shopName);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleConfirmPayment() {
    if (loading || success) return;
    setLoading(true);
    setErrorMsg("");

    let confirmed = false;
    let activeCode = orderCode;
    if (!activeCode && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      activeCode = sp.get("orderCode") || sp.get("code") || "";
    }
    if (!activeCode) {
      setErrorMsg("Thiếu mã đơn hàng. Vui lòng quét lại mã QR trên trang thanh toán.");
      setLoading(false);
      return;
    }

    // 1. Thử gọi API GET /api/orders/[id]/pay (Simple request: Không bị chặn CORS trên mọi trình duyệt điện thoại)
    // A definite answer from the server (unknown or cancelled order) is shown as is; the fallbacks
    // below are only for requests that never reached it.
    let serverError = "";
    try {
      const getRes1 = await fetch(`/api/orders/${encodeURIComponent(activeCode)}/pay?t=${Date.now()}`);
      const data = await getRes1.json().catch(() => null);
      if (getRes1.ok && data?.ok) confirmed = true;
      else if (getRes1.status === 404 || getRes1.status === 409) serverError = data?.error || "Không thể thanh toán đơn hàng này.";
    } catch {}

    if (serverError) {
      setErrorMsg(serverError);
      setLoading(false);
      return;
    }

    // 2. Thử gọi API POST /api/orders/[id]/pay
    if (!confirmed) {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(activeCode)}/pay?t=${Date.now()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderCode: activeCode }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) confirmed = true;
        }
      } catch {}
    }

    // 3. Thử gọi API fallback GET /api/orders/pay?code=...
    if (!confirmed) {
      try {
        const getRes2 = await fetch(`/api/orders/pay?code=${encodeURIComponent(activeCode)}&t=${Date.now()}`);
        if (getRes2.ok) {
          const data = await getRes2.json();
          if (data.ok) confirmed = true;
        }
      } catch {}
    }

    // 4. Thử gọi API fallback POST /api/orders/pay
    if (!confirmed) {
      try {
        const fbRes = await fetch(`/api/orders/pay?code=${encodeURIComponent(activeCode)}&t=${Date.now()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderCode: activeCode }),
        });
        if (fbRes.ok) {
          const data = await fbRes.json();
          if (data.ok) confirmed = true;
        }
      } catch {}
    }

    if (confirmed) {
      setSuccess(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate([100, 50, 100]); } catch {}
      }
    } else {
      setErrorMsg("Không thể gửi xác nhận đến máy chủ. Vui lòng kiểm tra terminal máy tính đã chạy 'bun run dev' chưa và điện thoại có chung Wi-Fi không nhé.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-start sm:justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-xl overflow-hidden border border-neutral-200">
        {/* Header MoMo chuẩn mobile app */}
        <div className="bg-[#1C1F1C] p-5 text-white text-center space-y-1">
          <div className="size-12 rounded-2xl bg-white text-[#1C1F1C] flex items-center justify-center font-bold text-xl mx-auto shadow-md">
            <QrCode className="size-5" aria-hidden />
          </div>
          <h2 className="font-bold text-base tracking-wide">Thanh toán mô phỏng (demo)</h2>
          <p className="text-[11px] text-stone-300 flex items-center justify-center gap-1">
            <ShieldCheck className="size-3.5" />
            <span>Không trừ tiền thật</span>
          </p>
        </div>

        {/* Nội dung thanh toán */}
        <div className="p-5 space-y-4">
          {!success ? (
            <>
              {/* Thẻ số tiền */}
              <div className="rounded-2xl bg-stone-50/70 border border-stone-100 p-4 text-center space-y-1">
                <span className="text-xs text-[#5C605C] font-medium">Số tiền thanh toán:</span>
                <div className="font-serif font-bold text-3xl text-[#1C1F1C]">
                  {amount > 0 ? formatMoney(amount) : "..."}
                </div>
                <div className="text-[11px] text-[#5C605C] font-mono">
                  Mã đơn: <strong>{orderCode || "(thiếu mã đơn)"}</strong>
                </div>
              </div>

              {/* Thông tin đơn hàng & Người nhận */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Store className="size-3.5 text-neutral-400" />
                    <span>Cửa hàng:</span>
                  </span>
                  <span className="font-bold text-neutral-800 text-right max-w-[180px] truncate">
                    {shopName}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Wallet className="size-3.5 text-neutral-400" />
                    <span>Nguồn tiền:</span>
                  </span>
                  <span className="font-semibold text-neutral-800">Ví demo (số dư mô phỏng: 5.250.000₫)</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Clock className="size-3.5 text-neutral-400" />
                    <span>Thời gian:</span>
                  </span>
                  <span className="text-neutral-600 font-mono">Vừa tạo</span>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 text-center font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Form & Nút bấm Xác nhận Thanh toán tối ưu cảm ứng màn hình điện thoại */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConfirmPayment();
                }}
                className="w-full pt-1"
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[52px] rounded-2xl bg-[#1C1F1C] hover:bg-[#2C302C] active:bg-black active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-black/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 select-none touch-manipulation"
                >
                  {loading ? (
                    <>
                      <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Đang xử lý giao dịch...</span>
                    </>
                  ) : (
                    <>
                      <span>XÁC NHẬN THANH TOÁN</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-[10px] text-neutral-400 text-center leading-tight">
                Bấm xác nhận trên điện thoại sẽ kích hoạt Backend và tự động tắt mã QR trên màn hình máy tính của bạn.
              </p>
            </>
          ) : (
            /* Màn hình thành công trên điện thoại */
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-lg text-emerald-800">
                  THANH TOÁN THÀNH CÔNG!
                </h3>
                <p className="font-serif font-bold text-2xl text-[#191B19]">
                  {amount > 0 ? formatMoney(amount) : ""}
                </p>
                <p className="text-xs text-neutral-500 font-mono mt-1">
                  Mã giao dịch: {orderCode}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="size-4 text-emerald-600" />
                  <span>Máy tính của bạn đã được cập nhật!</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Cửa sổ mã QR trên màn hình máy tính đã <strong>tự động tắt</strong> và đơn hàng đã chuyển sang trạng thái chuẩn bị giao.
                </p>
              </div>

              <p className="text-xs text-neutral-400">
                Bạn có thể an tâm đóng tab này trên điện thoại.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PayDemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm flex items-center gap-3">
            <span className="size-5 rounded-full border-2 border-[#1C1F1C] border-t-transparent animate-spin" />
            <span className="text-sm font-semibold text-neutral-800">Đang tải thanh toán mô phỏng...</span>
          </div>
        </div>
      }
    >
      <PayDemoInner />
    </Suspense>
  );
}
