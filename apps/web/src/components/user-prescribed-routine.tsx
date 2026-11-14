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
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight,
  Droplets,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// Routine Item (Sản phẩm trong phác đồ của Bác sĩ)
export interface RoutineProduct {
  id: string;
  stepNumber: number;
  shortStep: string; // e.g. "Bước 1 • Làm sạch", "Bước 2 • Cấp ẩm B5"
  timing: "morning" | "evening" | "both";
  shortName: string; // Tên ngắn gọn tinh tế
  fullName: string;
  brand: string;
  volume: string;
  image: string;
  priceVnd: number;
  originalPriceVnd: number;
  discountPercent: number;
  quickTip: string; // Hướng dẫn siêu ngắn gọn, trực quan
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
  diagnosisFull: string;
  severity: "Nhẹ" | "Vừa" | "Nặng";
  rednessScore: number;
  planTitle: string;
  durationDays: number;
  prescribedDate: string;
  revisitDate: string;
  keyInstructions: string[];
  doctorNotesFull: string;
  doctor: PrescribingDoctor;
  products: RoutineProduct[];
}

// Dữ liệu mẫu phác đồ chuẩn y khoa - Tinh gọn, thoáng mắt
export const DEFAULT_PRESCRIBED_ROUTINE: PrescribedRoutineData = {
  patientName: "Trần Thị Ngọc Hà (21 tuổi)",
  diagnosisShort: "Mụn bọc viêm đỏ má & cằm sau thử cushion; tổn thương màng ẩm biểu bì",
  diagnosisFull:
    "Bùng mụn bọc viêm đỏ má & cằm sau khi thử cushion mới; da châm chích rất nhẹ, màng lipid biểu bì tổn thương.",
  severity: "Nặng",
  rednessScore: 74,
  planTitle: "Phác đồ Cấp Cứu Hàng Rào Da & Giảm Viêm (14 ngày)",
  durationDays: 14,
  prescribedDate: "14/11/2026",
  revisitDate: "28/11/2026",
  keyInstructions: [
    "Tạm ngưng toàn bộ makeup (cushion, phấn phủ)",
    "Rửa mặt nhẹ nhàng với nước ấm, không chà xát",
    "Bôi serum B5 khi da còn ẩm để phục hồi biểu bì",
    "Chấm kem Duo+M trực tiếp lên các nốt mụn viêm",
  ],
  doctorNotesFull:
    "Tạm ngưng toàn bộ mỹ phẩm trang điểm (cushion, phấn phủ). Rửa mặt với nước ấm và sữa rửa mặt dịu nhẹ pH 5.5, tuyệt đối không dùng máy rửa mặt hoặc chà xát mạnh. Thoa serum B5 khi da còn ẩm và chấm kem Duo+M trực tiếp lên các nốt mụn viêm. Bắt buộc chống nắng phổ rộng trước khi ra ngoài 20 phút.",
  doctor: {
    name: "BS. Lê Hoàng Nam",
    title: "Chuyên khoa Da liễu",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    hospital: "Bệnh viện Da liễu Trung ương",
    licenseNumber: "CCHN: 004812/BYT",
  },
  products: [
    {
      id: "rp_01",
      stepNumber: 1,
      shortStep: "Bước 1 • Làm sạch",
      timing: "both",
      shortName: "Sữa rửa mặt CeraVe Hydrating Cleanser",
      fullName: "Sữa Rửa Mặt Dưỡng Ẩm Cho Da Khô & Nhạy Cảm CeraVe Hydrating Cleanser 473ml",
      brand: "CeraVe",
      volume: "473ml",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      priceVnd: 380000,
      originalPriceVnd: 450000,
      discountPercent: 16,
      quickTip: "Massage 60s với nước ấm • Ngày 2 lần",
      productId: "sp_02",
    },
    {
      id: "rp_02",
      stepNumber: 2,
      shortStep: "Bước 2 • Cấp ẩm & Phục hồi",
      timing: "both",
      shortName: "Serum La Roche-Posay Hyalu B5",
      fullName: "Tinh Chất Dưỡng Ẩm & Phục Hồi Da Đa Tầng La Roche-Posay Hyalu B5 Serum 30ml",
      brand: "La Roche-Posay",
      volume: "30ml",
      image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
      priceVnd: 890000,
      originalPriceVnd: 1100000,
      discountPercent: 19,
      quickTip: "3-4 giọt vỗ nhẹ khi da còn ẩm",
      productId: "sp_03",
    },
    {
      id: "rp_03",
      stepNumber: 3,
      shortStep: "Bước 3 • Trị mụn viêm",
      timing: "both",
      shortName: "Kem dưỡng La Roche-Posay Duo+M",
      fullName: "Kem Dưỡng Giảm Mụn, Ngừa Thâm & Phục Hồi La Roche-Posay Effaclar Duo+M 40ml",
      brand: "La Roche-Posay",
      volume: "40ml",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
      priceVnd: 395000,
      originalPriceVnd: 495000,
      discountPercent: 20,
      quickTip: "Thoa mỏng toàn mặt & chấm nốt mụn viêm",
      productId: "sp_01",
    },
    {
      id: "rp_04",
      stepNumber: 4,
      shortStep: "Bước 4 • Chống nắng",
      timing: "morning",
      shortName: "Kem chống nắng Anthelios UVMune 400",
      fullName: "Kem Chống Nắng Kiểm Soát Dầu 12H La Roche-Posay Anthelios UVMune 400 50ml",
      brand: "La Roche-Posay",
      volume: "50ml",
      image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
      priceVnd: 475000,
      originalPriceVnd: 560000,
      discountPercent: 15,
      quickTip: "Thoa trước khi ra ngoài 20 phút (Sáng)",
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
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const filteredProducts = routine.products.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "morning") return p.timing === "morning" || p.timing === "both";
    if (activeTab === "evening") return p.timing === "evening" || p.timing === "both";
    return true;
  });

  const totalPrice = routine.products.reduce((acc, p) => acc + p.priceVnd, 0);
  const totalOriginalPrice = routine.products.reduce((acc, p) => acc + p.originalPriceVnd, 0);
  const totalSaved = totalOriginalPrice - totalPrice;

  function handleBuySingleProduct(product: RoutineProduct) {
    toast.success(`Chuyển sang Shop để mua "${product.shortName}"...`);
    router.push("/shop");
  }

  function handleBuyFullRoutine() {
    toast.success("Đã chọn trọn bộ 4 sản phẩm theo phác đồ vào giỏ hàng Shopee!");
    router.push("/shop");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. KHỐI TÓM TẮT BỆNH ÁN & BÁC SĨ (GỌN GÀNG, THOÁNG MẮT, ÍT CHỮ) */}
      <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Bác sĩ & Phác đồ */}
          <div className="flex items-center gap-3">
            <img
              src={routine.doctor.avatar}
              alt={routine.doctor.name}
              className="size-11 rounded-xl object-cover border-2 border-[#2D5A43] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#191B19]">
                  {routine.doctor.name}
                </h3>
                <span className="text-[10px] text-[#5C605C]">({routine.doctor.hospital})</span>
                <span className="rounded bg-[#2D5A43]/10 text-[#2D5A43] px-2 py-0.2 text-[10px] font-bold">
                  Bác sĩ phụ trách
                </span>
              </div>
              <h4 className="font-serif text-base font-bold text-[#C2410C]">
                {routine.planTitle}
              </h4>
            </div>
          </div>

          {/* Chỉ số nhanh (Pills) */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className="rounded-xl bg-white border border-[#D8D4CA] px-3 py-1 text-[#5C605C] flex items-center gap-1.5">
              <Clock className="size-3.5 text-[#2D5A43]" />
              <span>Tái khám: <strong className="text-[#191B19]">{routine.revisitDate}</strong></span>
            </span>

            <span className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1 text-rose-800 font-bold">
              Đỏ da: {routine.rednessScore}% • Nặng
            </span>
          </div>
        </div>

        {/* 4 Lời dặn chính (Dạng tags ngắn gọn, không chữ dài lòng thòng) */}
        <div className="pt-2 border-t border-[#D8D4CA]/50">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#5C605C] font-semibold text-[11px] shrink-0">
              Chỉ định chính:
            </span>
            {routine.keyInstructions.map((tip, idx) => (
              <span
                key={idx}
                className="rounded-lg bg-white border border-[#D8D4CA] px-2.5 py-1 text-[11px] font-medium text-[#191B19] flex items-center gap-1"
              >
                <Check className="size-3 text-[#2D5A43]" />
                <span>{tip}</span>
              </span>
            ))}

            <button
              type="button"
              onClick={() => setIsDetailsExpanded((prev) => !prev)}
              className="text-[11px] text-[#C2410C] font-bold hover:underline cursor-pointer flex items-center gap-0.5 ml-auto"
            >
              <span>{isDetailsExpanded ? "Thu gọn" : "Xem chi tiết"}</span>
              {isDetailsExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
          </div>

          {/* Chi tiết mở rộng nếu người dùng muốn đọc thêm */}
          {isDetailsExpanded && (
            <div className="mt-3 rounded-xl bg-white border border-[#D8D4CA] p-3 text-xs text-[#5C605C] space-y-1.5 leading-relaxed">
              <p><strong className="text-[#191B19]">Chẩn đoán:</strong> {routine.diagnosisFull}</p>
              <p><strong className="text-[#191B19]">Ghi chú chuyên môn:</strong> {routine.doctorNotesFull}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. TAB LỌC THỜI ĐIỂM (Tất cả / ☀️ Buổi Sáng / 🌙 Buổi Tối) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-serif text-base sm:text-lg font-bold text-[#191B19]">
            Quy Trình 4 Bước
          </span>
          <span className="text-xs text-[#5C605C]">
            (Chính hãng Shopee Mall)
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 font-semibold rounded-lg transition cursor-pointer ${
              activeTab === "all"
                ? "bg-[#2D5A43] text-white shadow-2xs"
                : "text-[#5C605C] hover:text-[#191B19]"
            }`}
          >
            Tất cả (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("morning")}
            className={`flex items-center gap-1 px-3 py-1 font-semibold rounded-lg transition cursor-pointer ${
              activeTab === "morning"
                ? "bg-amber-600 text-white shadow-2xs"
                : "text-[#5C605C] hover:text-[#191B19]"
            }`}
          >
            <Sun className="size-3" />
            <span>Sáng (3)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evening")}
            className={`flex items-center gap-1 px-3 py-1 font-semibold rounded-lg transition cursor-pointer ${
              activeTab === "evening"
                ? "bg-indigo-700 text-white shadow-2xs"
                : "text-[#5C605C] hover:text-[#191B19]"
            }`}
          >
            <Moon className="size-3" />
            <span>Tối (3)</span>
          </button>
        </div>
      </div>

      {/* 3. LƯỚI 2 CỘT CÂN ĐỐI, THOÁNG ĐÃNG, RẤT ÍT CHỮ (KHÔNG CÒN BỊ CHI CHÍT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="group rounded-2xl border border-[#D8D4CA] bg-white p-4 shadow-2xs hover:border-[#C2410C]/60 hover:shadow-xs transition-all flex items-center justify-between gap-3.5"
          >
            {/* Ảnh sản phẩm vừa vặn */}
            <div className="relative size-18 sm:size-20 shrink-0 overflow-hidden rounded-xl border border-[#D8D4CA] bg-neutral-100">
              <img
                src={prod.image}
                alt={prod.shortName}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-1 right-1 rounded bg-black/60 backdrop-blur-xs px-1 text-[9px] font-mono text-white">
                {prod.volume}
              </span>
            </div>

            {/* Nội dung tinh giản: Bước, Tên, Tip ngắn */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="font-bold text-[#C2410C] uppercase tracking-wider">
                  {prod.shortStep}
                </span>
                <span className="text-[#D8D4CA]">•</span>
                {prod.timing === "morning" && (
                  <span className="text-amber-800 font-medium flex items-center gap-0.5">
                    <Sun className="size-2.5" /> Sáng
                  </span>
                )}
                {prod.timing === "evening" && (
                  <span className="text-indigo-800 font-medium flex items-center gap-0.5">
                    <Moon className="size-2.5" /> Tối
                  </span>
                )}
                {prod.timing === "both" && (
                  <span className="text-teal-800 font-medium">Sáng & Tối</span>
                )}
              </div>

              <h4
                className="font-bold text-sm text-[#191B19] leading-snug truncate"
                title={prod.fullName}
              >
                {prod.shortName}
              </h4>

              {/* Tip siêu ngắn thay vì cả đoạn văn dài */}
              <div className="text-[11px] text-[#5C605C] flex items-center gap-1 truncate">
                <Droplets className="size-3 text-[#2D5A43] shrink-0" />
                <span>{prod.quickTip}</span>
              </div>
            </div>

            {/* Giá & Nút Mua Nhỏ Gọn */}
            <div className="flex flex-col items-end gap-1 shrink-0 pl-1 border-l border-[#D8D4CA]/50">
              <div className="text-right">
                <span className="text-sm font-bold font-serif text-[#C2410C] block">
                  {formatMoney(prod.priceVnd)}
                </span>
                <span className="text-[10px] text-[#5C605C] line-through block">
                  {formatMoney(prod.originalPriceVnd)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleBuySingleProduct(prod)}
                className="h-8 px-3 flex items-center gap-1 rounded-lg bg-[#C2410C] text-[11px] font-bold text-white shadow-2xs hover:bg-[#9A3412] transition cursor-pointer"
              >
                <ShoppingBag className="size-3" />
                <span>Mua</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. THANH MUA TRỌN BỘ ROUTINE (TINH GỌN, SANG TRỌNG) */}
      <div className="rounded-2xl border border-[#C2410C]/30 bg-[#FAF8F5] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#191B19]">
                Trọn Bộ Phác Đồ 14 Ngày (4 sản phẩm)
              </span>
              <span className="rounded bg-[#2D5A43]/10 text-[#2D5A43] px-2 py-0.2 text-[10px] font-bold">
                Tiết kiệm {formatMoney(totalSaved)}
              </span>
            </div>
            <p className="text-xs text-[#5C605C]">
              Đầy đủ quy trình sáng & tối • Miễn phí vận chuyển Freeship Xtra
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-[10px] text-[#5C605C] block uppercase">Tổng tiền:</span>
            <span className="text-xl font-bold font-serif text-[#C2410C]">
              {formatMoney(totalPrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleBuyFullRoutine}
            className="h-10 px-5 flex items-center gap-1.5 rounded-xl bg-[#C2410C] text-xs font-bold text-white shadow-xs hover:bg-[#9A3412] active:scale-[0.98] transition cursor-pointer"
          >
            <ShoppingBag className="size-4" />
            <span>Mua Trọn Bộ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
