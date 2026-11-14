"use client";

import { useState } from "react";
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

// Dữ liệu mẫu phác đồ chuẩn y khoa - Cân đối, đầy đủ, không chi chít
export const DEFAULT_PRESCRIBED_ROUTINE: PrescribedRoutineData = {
  patientName: "Trần Thị Ngọc Hà (21 tuổi - Nữ)",
  diagnosisShort: "Mụn bọc viêm đỏ má & cằm sau khi thử cushion mới; tổn thương màng lipid biểu bì.",
  diagnosisDetails:
    "Bùng mụn bọc viêm đỏ má & cằm sau khi thử cushion mới; da châm chích nhẹ, màng lipid biểu bì suy yếu. Cần phục hồi cấp ẩm và giảm viêm tại chỗ.",
  severity: "Nặng",
  rednessScore: 74,
  planTitle: "Phác đồ Cấp Cứu Hàng Rào Da & Giảm Viêm Mụn (14 ngày)",
  durationDays: 14,
  prescribedDate: "14/11/2026",
  revisitDate: "28/11/2026",
  doctorInstructions: [
    "Tạm ngưng hoàn toàn trang điểm (cushion, phấn phủ, kem nền) trong suốt 14 ngày điều trị.",
    "Rửa mặt nhẹ nhàng với nước ấm, không dùng máy rửa mặt hoặc chà xát mạnh gây vỡ mụn viêm.",
    "Thoa serum B5 khi da còn ẩm để thẩm thấu sâu, sau đó chấm kem Duo+M trực tiếp lên các nốt mụn sưng đỏ.",
    "Bắt buộc thoa kem chống nắng phổ rộng mỗi buổi sáng trước khi ra ngoài 20 phút để ngừa thâm sau viêm (PIE).",
  ],
  doctor: {
    name: "ThS. BS CKII Lê Hoàng Nam",
    title: "Chuyên gia Da liễu & Thẩm mỹ Da Y khoa",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    hospital: "Bệnh viện Da liễu Trung ương",
    licenseNumber: "CCHN: 004812/BYT-CCHN",
  },
  products: [
    {
      id: "rp_01",
      stepNumber: 1,
      stepName: "Bước 1 • Làm sạch & Cân bằng ẩm",
      targetGoal: "Làm sạch bụi bẩn, dịu kích ứng và bảo toàn màng lipid pH 5.5",
      timing: "both",
      timingLabel: "Sáng & Tối",
      name: "Sữa Rửa Mặt Dưỡng Ẩm CeraVe Hydrating Cleanser",
      brand: "CeraVe Skincare",
      volume: "473ml",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      actives: "3 Ceramides thiết yếu (1, 3, 6-II), Hyaluronic Acid, Glycerin",
      usageGuide: "Lấy 1 pump, tạo bọt nhẹ với nước ấm và massage mặt nhẹ nhàng 60 giây.",
      priceVnd: 380000,
      originalPriceVnd: 450000,
      discountPercent: 16,
      productId: "sp_02",
    },
    {
      id: "rp_02",
      stepNumber: 2,
      stepName: "Bước 2 • Cấp nước & Phục hồi đa tầng",
      targetGoal: "Làm dịu da đỏ buốt, bù nước tầng sâu và kích thích tái sinh biểu bì",
      timing: "both",
      timingLabel: "Sáng & Tối",
      name: "Tinh Chất Phục Hồi La Roche-Posay Hyalu B5 Serum",
      brand: "La Roche-Posay",
      volume: "30ml",
      image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
      actives: "Pure Hyaluronic Acid Duo, Vitamin B5 (Panthenol 5%), Madecassoside",
      usageGuide: "Nhỏ 3-4 giọt lên trán và má khi da còn hơi ẩm, vỗ nhẹ nhàng khắp mặt.",
      priceVnd: 890000,
      originalPriceVnd: 1100000,
      discountPercent: 19,
      productId: "sp_03",
    },
    {
      id: "rp_03",
      stepNumber: 3,
      stepName: "Bước 3 • Giảm viêm & Ngừa sẹo thâm",
      targetGoal: "Cân bằng hệ vi sinh da, tiêu diệt vi khuẩn mụn và làm mờ thâm đỏ",
      timing: "both",
      timingLabel: "Sáng & Tối",
      name: "Kem Dưỡng Giảm Mụn La Roche-Posay Effaclar Duo+M",
      brand: "La Roche-Posay",
      volume: "40ml",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
      actives: "Hoạt chất độc quyền Phylobioma, Niacinamide, Salicylic Acid, Zinc PCA",
      usageGuide: "Thoa một lớp mỏng toàn mặt, chấm thêm một lớp nhỏ lên các nốt mụn sưng viêm.",
      priceVnd: 395000,
      originalPriceVnd: 495000,
      discountPercent: 20,
      productId: "sp_01",
    },
    {
      id: "rp_04",
      stepNumber: 4,
      stepName: "Bước 4 • Màng lọc bảo vệ da phổ rộng",
      targetGoal: "Chống tia UVA dài (380-400nm) và kiểm soát bã nhờn suốt 12 tiếng",
      timing: "morning",
      timingLabel: "Chỉ Dùng Buổi Sáng",
      name: "Kem Chống Nắng La Roche-Posay Anthelios UVMune 400",
      brand: "La Roche-Posay",
      volume: "50ml",
      image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
      actives: "Màng lọc độc quyền Mexoryl 400, Công nghệ kiềm dầu Airlicium, Netlock",
      usageGuide: "Thoa đều trước khi ra ngoài 20 phút. Thoa lại vào đầu giờ chiều nếu ra nắng nhiều.",
      priceVnd: 475000,
      originalPriceVnd: 560000,
      discountPercent: 15,
      productId: "sp_04",
    },
  ],
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0₫";
}

export function UserPrescribedRoutine({
  routine = DEFAULT_PRESCRIBED_ROUTINE,
}: {
  routine?: PrescribedRoutineData;
}) {
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

  function handleGoToShop() {
    toast.success("Đang chuyển hướng sang trang sản phẩm của Shop...");
    router.push("/shop");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. KHỐI THÔNG TIN BỆNH ÁN & BÁC SĨ (ĐẦY ĐẶN, THOÁNG ĐÃNG, VỪA KHUNG MÀN HÌNH) */}
      <div className="rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D8D4CA]/70 pb-4">
          {/* Thông tin Bác sĩ */}
          <div className="flex items-center gap-3.5">
            <img
              src={routine.doctor.avatar}
              alt={routine.doctor.name}
              className="size-14 rounded-2xl object-cover border-2 border-[#2D5A43] shadow-xs shrink-0"
            />
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
              <p className="text-xs text-[#5C605C]">{routine.doctor.hospital} • {routine.doctor.title}</p>
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
            Chi Tiết 4 Bước Routine Được Kê Đơn
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
            Tất cả 4 bước
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
            <span>Buổi Sáng (3)</span>
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
            <span>Buổi Tối (3)</span>
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
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 backdrop-blur-xs px-1.5 py-0.2 text-[10px] font-mono text-white">
                  {prod.volume}
                </span>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#5C605C] uppercase tracking-wider block">
                  {prod.brand} (Shopee Mall)
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

            {/* Giá tham khảo tại Shop (KHÔNG CÓ NÚT MUA LẺ) */}
            <div className="pt-2 border-t border-[#D8D4CA]/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#5C605C]">
                <ShieldCheck className="size-4 text-[#2D5A43]" />
                <span>Chính Hãng 100% Shopee Mall</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-[#5C605C]">Giá tham khảo:</span>
                <span className="text-base font-bold font-serif text-[#C2410C]">
                  {formatMoney(prod.priceVnd)}
                </span>
                <span className="text-xs text-[#5C605C] line-through">
                  {formatMoney(prod.originalPriceVnd)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. THANH HÀNH ĐỘNG DƯỚI CÙNG: DUY NHẤT 1 NÚT ĐI ĐẾN TRANG SẢN PHẨM ĐỂ MUA HÀNG */}
      <div className="rounded-3xl border-2 border-[#C2410C]/40 bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="rounded-md bg-[#C2410C] px-2.5 py-0.5 text-xs font-bold text-white">
              Trọn Bộ 4 Sản Phẩm Theo Phác Đồ Bác Sĩ
            </span>
            <span className="rounded-md bg-[#2D5A43]/10 text-[#2D5A43] px-2.5 py-0.5 text-xs font-bold">
              Tiết kiệm {formatMoney(totalSaved)} khi mua cả bộ
            </span>
            <span className="text-xs text-[#5C605C]">• Freeship Xtra toàn quốc</span>
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#191B19]">
            Hoàn Tất Đơn Kê & Mua Sản Phẩm Tại Gian Hàng Shopee
          </h3>
          <p className="text-xs text-[#5C605C]">
            Tất cả 4 sản phẩm chính hãng sẽ được chuẩn bị sẵn tại Shop để bạn đặt hàng và nhận thuốc/dược mỹ phẩm tại nhà.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 shrink-0 w-full md:w-auto justify-between md:justify-end">
          <div className="text-center sm:text-right">
            <span className="text-xs text-[#5C605C] block">Tổng chi phí dự kiến:</span>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-[#C2410C]">
              {formatMoney(totalPrice)}
            </div>
          </div>

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
