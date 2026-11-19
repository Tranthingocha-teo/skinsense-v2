"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Sparkles,
  ShoppingBag,
  BadgeCheck,
  Sun,
  Moon,
  ArrowRight,
  Droplets,
  Check,
  ShieldCheck,
  FlaskConical,
  Stethoscope,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { SafeProductImage } from "@/components/safe-product-image";
import { InitialsAvatar } from "@/components/initials-avatar";
import { ownImageUrl } from "@skinsense/domain";

// Routine Item (Sản phẩm trong phác đồ của Bác sĩ)
export interface RoutineProduct {
  id: string;
  stepNumber: number;
  stepName: string; // e.g. "Bước 1: Làm sạch & Cân bằng màng ẩm"
  targetGoal: string; // Tác dụng chính
  timing: "morning" | "evening" | "both";
  timingLabel: string;
  name: string;
  brand: string;
  volume: string;
  image: string;
  actives: string; // Hoạt chất chính
  usageGuide: string; // Hướng dẫn sử dụng chuẩn y khoa
  priceVnd: number;
  originalPriceVnd: number;
  discountPercent: number;
  productId: string;
}

// Bác sĩ đã khám và kê đơn
export interface PrescribingDoctor {
  name: string;
  title: string;
  avatar: string;
  hospital: string;
  licenseNumber: string;
}

// Phác đồ Routine hoàn chỉnh
export interface PrescribedRoutineData {
  patientName: string;
  diagnosisShort: string;
  diagnosisDetails: string;
  severity: "Nhẹ" | "Vừa" | "Nặng";
  rednessScore: number;
  planTitle: string;
  durationDays: number;
  prescribedDate: string;
  revisitDate: string;
  doctorInstructions: string[];
  doctor: PrescribingDoctor;
  products: RoutineProduct[];
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0₫";
}

export function UserPrescribedRoutine({ routine }: { routine: PrescribedRoutineData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "morning" | "evening">("all");

  const filteredProducts = routine.products.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "morning") return p.timing === "morning" || p.timing === "both";
    if (activeTab === "evening") return p.timing === "evening" || p.timing === "both";
    return true;
  });

  const totalPrice = routine.products.reduce((acc, p) => acc + p.priceVnd, 0);
  const totalOriginalPrice = routine.products.reduce((acc, p) => acc + p.originalPriceVnd, 0);
  const totalSaved = totalOriginalPrice - totalPrice;
  const morningCount = routine.products.filter((p) => p.timing === "morning" || p.timing === "both").length;
  const eveningCount = routine.products.filter((p) => p.timing === "evening" || p.timing === "both").length;

  function handleGoToShop() {
    const matchedIds = routine.products.map((p) => p.productId).filter(Boolean);
    toast.success("Đang chuyển đến trang thanh toán...");
    if (matchedIds.length > 0) {
      router.push(`/shop/checkout?productIds=${encodeURIComponent(matchedIds.join(","))}`);
      return;
    }
    router.push("/products");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. KHỐI THÔNG TIN BỆNH ÁN & BÁC SĨ (ĐẦY ĐẶN, THOÁNG ĐÃNG, VỪA KHUNG MÀN HÌNH) */}
      <div className="rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D8D4CA]/70 pb-4">
          {/* Thông tin Bác sĩ */}
          <div className="flex items-center gap-3.5">
            {ownImageUrl(routine.doctor.avatar) ? (
              <InitialsAvatar
                name={routine.doctor.name}
                src={routine.doctor.avatar}
                label={routine.doctor.name}
                className="size-14 rounded-2xl border-2 border-[#2D5A43] shadow-xs"
              />
            ) : (
              <span className="size-14 rounded-2xl border-2 border-[#2D5A43] bg-[#2D5A43]/10 text-[#2D5A43] flex items-center justify-center shrink-0">
                <Stethoscope className="size-6" />
              </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#2D5A43] px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                  <BadgeCheck className="size-3" />
                  <span>Bác Sĩ Phụ Trách</span>
                </span>
                <span className="text-xs text-[#5C605C] font-mono">{routine.doctor.licenseNumber}</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#191B19] mt-0.5">
                {routine.doctor.name}
              </h3>
              <p className="text-xs text-[#5C605C]">
                {[routine.doctor.hospital, routine.doctor.title].filter(Boolean).join(" • ")}
              </p>
            </div>
          </div>

          {/* Phác đồ & Lịch khám */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="rounded-2xl bg-white border border-[#D8D4CA] px-3.5 py-2">
              <span className="text-[10px] text-[#5C605C] block uppercase font-semibold">Tên Phác Đồ:</span>
              <strong className="text-[#C2410C] text-sm font-serif">{routine.planTitle}</strong>
            </div>

            <div className="rounded-2xl bg-white border border-[#D8D4CA] px-3.5 py-2">
              <span className="text-[10px] text-[#5C605C] block uppercase font-semibold">Tái Khám:</span>
              <strong className="text-[#191B19] flex items-center gap-1">
                <Calendar className="size-3 text-[#2D5A43]" />
                {routine.revisitDate}
              </strong>
            </div>

            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-3.5 py-2">
              <span className="text-[10px] text-rose-700 block uppercase font-semibold">Độ Đỏ PIE:</span>
              <strong className="text-rose-800 text-sm">{routine.rednessScore}% • Mức độ: {routine.severity}</strong>
            </div>
          </div>
        </div>

        {/* Lời dặn chuyên môn của Bác sĩ (Trình bày dạng 4 thẻ chỉ dẫn rõ ràng, không bị dồn cục) */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#191B19] block mb-2 flex items-center gap-1.5">
            <Stethoscope className="size-4 text-[#2D5A43]" />
            <span>Chỉ Định & Lời Dặn Chuyên Môn Của Bác Sĩ (14 ngày):</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {routine.doctorInstructions.map((instruction, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#D8D4CA] p-3 text-xs text-[#3A3D3A] flex items-start gap-2 shadow-2xs"
              >
                <span className="size-5 rounded-full bg-[#2D5A43]/10 text-[#2D5A43] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{instruction}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. THANH LỌC THỜI ĐIỂM (Tất cả / ☀️ Buổi Sáng / 🌙 Buổi Tối) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#191B19]">
            Chi Tiết {routine.products.length} Bước Routine Được Kê Đơn
          </h2>
          <p className="text-xs text-[#5C605C] mt-0.5">
            Các sản phẩm dược mỹ phẩm chính hãng theo đúng liều lượng và phác đồ điều trị của Bác sĩ.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 font-bold rounded-xl transition cursor-pointer ${
              activeTab === "all"
                ? "bg-[#2D5A43] text-white shadow-xs"
                : "text-[#5C605C] hover:text-[#191B19]"
            }`}
          >
            Tất cả {routine.products.length} bước
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("morning")}
            className={`flex items-center gap-1 px-3.5 py-1.5 font-bold rounded-xl transition cursor-pointer ${
              activeTab === "morning"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-[#5C605C] hover:text-[#191B19]"
            }`}
          >
            <Sun className="size-3.5" />
            <span>Buổi Sáng ({morningCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evening")}
            className={`flex items-center gap-1 px-3.5 py-1.5 font-bold rounded-xl transition cursor-pointer ${
              activeTab === "evening"
                ? "bg-indigo-700 text-white shadow-xs"
                : "text-[#5C605C] hover:text-[#191B19]"
            }`}
          >
            <Moon className="size-3.5" />
            <span>Buổi Tối ({eveningCount})</span>
          </button>
        </div>
      </div>

      {/* 3. LƯỚI 2x2 CÂN ĐỐI, VỪA VẶN MÀN HÌNH - KHÔNG CÓ NÚT MUA LẺ Ở TỪNG MÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="group rounded-3xl border border-[#D8D4CA] bg-white p-5 shadow-xs hover:border-[#C2410C]/60 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            {/* Header Thẻ: Bước & Thời điểm dùng */}
            <div className="flex items-center justify-between border-b border-[#D8D4CA]/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-[#2D5A43] px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  {prod.stepName.split("•")[0].trim()}
                </span>
                <span className="text-xs font-semibold text-[#C2410C]">
                  {prod.stepName.split("•")[1]?.trim()}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {prod.timing === "morning" && (
                  <span className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800 font-bold text-[11px]">
                    <Sun className="size-3" /> Buổi Sáng
                  </span>
                )}
                {prod.timing === "evening" && (
                  <span className="flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-indigo-800 font-bold text-[11px]">
                    <Moon className="size-3" /> Buổi Tối
                  </span>
                )}
                {prod.timing === "both" && (
                  <span className="rounded-lg bg-teal-50 border border-teal-200 px-2 py-0.5 text-teal-800 font-bold text-[11px]">
                    Sáng & Tối
                  </span>
                )}
              </div>
            </div>

            {/* Thân Thẻ: Ảnh to rõ + Tên sản phẩm + Hoạt chất + Cách dùng (Đầy đặn vừa vặn) */}
            <div className="flex items-start gap-4">
              <div className="relative size-24 sm:size-28 shrink-0 overflow-hidden rounded-2xl border border-[#D8D4CA] bg-neutral-100 shadow-2xs">
                <SafeProductImage
                  src={prod.image}
                  alt={prod.name}
                  brand={prod.brand}
                  seed={prod.productId}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {prod.volume && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/60 backdrop-blur-xs px-1.5 py-0.2 text-[10px] font-mono text-white">
                    {prod.volume}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#5C605C] uppercase tracking-wider block">
                  {prod.brand} (SkinSense Mall)
                </span>

                <h4 className="font-bold text-base text-[#191B19] leading-snug">
                  {prod.name}
                </h4>

                <p className="text-xs text-[#2D5A43] font-medium leading-relaxed">
                  <strong>Mục tiêu:</strong> {prod.targetGoal}
                </p>
              </div>
            </div>

            {/* Chi tiết hoạt chất y tế & Hướng dẫn sử dụng */}
            <div className="rounded-2xl bg-[#FAF8F5] border border-[#D8D4CA]/80 p-3.5 text-xs space-y-2">
              <div className="flex items-start gap-1.5 text-[#4A4D4A]">
                <FlaskConical className="size-3.5 text-[#C2410C] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#191B19]">Hoạt chất:</strong> {prod.actives}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-[#4A4D4A]">
                <Droplets className="size-3.5 text-[#2D5A43] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#191B19]">Cách dùng:</strong> {prod.usageGuide}
                </span>
              </div>
            </div>

            {/* Giá tham khảo tại Shop + Liên kết chi tiết nếu sản phẩm đang bán trên sàn */}
            <div className="pt-2 border-t border-[#D8D4CA]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#5C605C]">
                <ShieldCheck className="size-4 text-[#2D5A43]" />
                <span>Chính hãng tại SkinSense Mall</span>
                {prod.productId && (
                  <Link
                    href={`/products?productId=${encodeURIComponent(prod.productId)}`}
                    className="font-bold text-[#2D5A43] hover:underline"
                  >
                    Xem sản phẩm →
                  </Link>
                )}
              </div>

              {prod.priceVnd > 0 && <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-[#5C605C]">Giá tham khảo:</span>
                <span className="text-base font-bold font-serif text-[#C2410C]">
                  {formatMoney(prod.priceVnd)}
                </span>
                <span className="text-xs text-[#5C605C] line-through">
                  {formatMoney(prod.originalPriceVnd)}
                </span>
              </div>}
            </div>
          </div>
        ))}
      </div>

      {/* 4. THANH HÀNH ĐỘNG DƯỚI CÙNG: DUY NHẤT 1 NÚT ĐI ĐẾN TRANG SẢN PHẨM ĐỂ MUA HÀNG */}
      <div className="rounded-3xl border-2 border-[#C2410C]/40 bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="rounded-md bg-[#C2410C] px-2.5 py-0.5 text-xs font-bold text-white">
              Trọn Bộ {routine.products.length} Sản Phẩm Theo Phác Đồ Bác Sĩ
            </span>
            {totalSaved > 0 && (
              <span className="rounded-md bg-[#2D5A43]/10 text-[#2D5A43] px-2.5 py-0.5 text-xs font-bold">
                Tiết kiệm {formatMoney(totalSaved)} khi mua cả bộ
              </span>
            )}
            <span className="text-xs text-[#5C605C]">• Miễn phí vận chuyển toàn quốc</span>
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#191B19]">
            Hoàn Tất Đơn Kê & Mua Sản Phẩm Tại Gian Hàng SkinSense
          </h3>
          <p className="text-xs text-[#5C605C]">
            Tất cả {routine.products.length} sản phẩm chính hãng sẽ được chuẩn bị sẵn tại Shop để bạn đặt hàng và nhận thuốc/dược mỹ phẩm tại nhà.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 shrink-0 w-full md:w-auto justify-between md:justify-end">
          {totalPrice > 0 && (
            <div className="text-center sm:text-right">
              <span className="text-xs text-[#5C605C] block">Tổng chi phí dự kiến:</span>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-[#C2410C]">
                {formatMoney(totalPrice)}
              </div>
            </div>
          )}

          {/* Nút hành động duy nhất: ĐI ĐẾN TRANG SẢN PHẨM ĐỂ MUA HÀNG */}
          <button
            type="button"
            onClick={handleGoToShop}
            className="w-full sm:w-auto h-12 px-7 flex items-center justify-center gap-2.5 rounded-2xl bg-[#C2410C] text-sm font-bold text-white shadow-md hover:bg-[#9A3412] active:scale-[0.98] transition cursor-pointer"
          >
            <ShoppingBag className="size-5" />
            <span>Đi Đến Trang Sản Phẩm Để Mua Hàng</span>
            <ArrowRight className="size-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
