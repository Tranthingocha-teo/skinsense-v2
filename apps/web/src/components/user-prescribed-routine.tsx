"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  BadgeCheck,
  ArrowRight,
  Sun,
  Moon,
  Info,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

// Routine Item (Sản phẩm trong phác đồ của Bác sĩ)
export interface RoutineProduct {
  id: string;
  stepNumber: number;
  stepName: string; // e.g. "Bước 1: Làm sạch dịu nhẹ", "Bước 2: Cấp ẩm & Phục hồi", "Bước 3: Điều trị & Giảm viêm"
  timing: "morning" | "evening" | "both";
  name: string;
  brand: string;
  volume: string;
  image: string;
  priceVnd: number;
  originalPriceVnd: number;
  discountPercent: number;
  instruction: string; // Lời dặn dò cách bôi
  shopUrl: string; // Đường link chuyển sang /shop
  productId: string; // Link đến sản phẩm trên sàn
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
  diagnosis: string;
  severity: "Nhẹ" | "Vừa" | "Nặng";
  rednessScore: number;
  planTitle: string;
  durationDays: number;
  prescribedDate: string;
  revisitDate: string;
  doctorNotes: string;
  doctor: PrescribingDoctor;
  products: RoutineProduct[];
}

// Dữ liệu mẫu phác đồ chuẩn y khoa
export const DEFAULT_PRESCRIBED_ROUTINE: PrescribedRoutineData = {
  patientName: "Trần Thị Ngọc Hà (21 tuổi - Nữ)",
  diagnosis: "Bùng mụn bọc viêm đỏ má & cằm sau khi thử cushion mới; da châm chích rất nhẹ, màng lipid biểu bì tổn thương.",
  severity: "Nặng",
  rednessScore: 74,
  planTitle: "Phác đồ Cấp cứu Hàng rào Bảo vệ Da & Giảm Viêm Cấp (14 ngày)",
  durationDays: 14,
  prescribedDate: "14/11/2026",
  revisitDate: "28/11/2026",
  doctorNotes:
    "Tạm ngưng toàn bộ mỹ phẩm trang điểm (cushion, phấn phủ). Rửa mặt với nước ấm và sữa rửa mặt dịu nhẹ pH 5.5, tuyệt đối không dùng máy rửa mặt hoặc chà xát mạnh. Thoa serum B5 khi da còn ẩm và chấm kem Duo+M trực tiếp lên các nốt mụn viêm. Bắt buộc chống nắng phổ rộng trước khi ra ngoài 20 phút.",
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
      stepName: "Bước 1: Làm sạch dịu nhẹ phục hồi màng ẩm",
      timing: "both",
      name: "Sữa Rửa Mặt Dưỡng Ẩm Chuyên Sâu Cho Da Khô & Nhạy Cảm CeraVe Hydrating Cleanser 473ml",
      brand: "CeraVe Skincare (Shopee Mall)",
      volume: "473ml",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
      priceVnd: 380000,
      originalPriceVnd: 450000,
      discountPercent: 16,
      instruction: "Dùng 1 pump, tạo bọt nhẹ với nước ấm và massage mặt nhẹ nhàng trong 60 giây, ngày 2 lần sáng và tối.",
      shopUrl: "/shop",
      productId: "sp_02",
    },
    {
      id: "rp_02",
      stepNumber: 2,
      stepName: "Bước 2: Cấp nước đa tầng & Hạ nhiệt da đỏ rát",
      timing: "both",
      name: "Tinh Chất Dưỡng Ẩm & Phục Hồi Da Đa Tầng La Roche-Posay Hyalu B5 Serum 30ml",
      brand: "La Roche-Posay Chính Hãng",
      volume: "30ml",
      image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
      priceVnd: 890000,
      originalPriceVnd: 1100000,
      discountPercent: 19,
      instruction: "Nhỏ 3-4 giọt lên trán và 2 má khi da còn hơi ẩm, vỗ nhẹ nhàng khắp mặt cho ngấm sâu.",
      shopUrl: "/shop",
      productId: "sp_03",
    },
    {
      id: "rp_03",
      stepNumber: 3,
      stepName: "Bước 3: Đặc trị mụn bọc & Ngăn ngừa sẹo thâm",
      timing: "both",
      name: "Kem Dưỡng Giảm Mụn, Ngừa Thâm & Phục Hồi La Roche-Posay Effaclar Duo+M 40ml",
      brand: "La Roche-Posay Shopee Mall",
      volume: "40ml",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
      priceVnd: 395000,
      originalPriceVnd: 495000,
      discountPercent: 20,
      instruction: "Thoa một lớp mỏng toàn mặt, chấm thêm một lớp nhỏ lên các nốt mụn sưng viêm đỏ.",
      shopUrl: "/shop",
      productId: "sp_01",
    },
    {
      id: "rp_04",
      stepNumber: 4,
      stepName: "Bước 4: Bảo vệ da khỏi tia UVA dài & Khói bụi",
      timing: "morning",
      name: "Kem Chống Nắng Kiểm Soát Dầu 12H La Roche-Posay Anthelios UVMune 400 50ml",
      brand: "La Roche-Posay Chính Hãng",
      volume: "50ml",
      image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
      priceVnd: 475000,
      originalPriceVnd: 560000,
      discountPercent: 15,
      instruction: "Thoa vào mỗi buổi sáng trước khi ra ngoài 20 phút. Thoa lại vào đầu giờ chiều nếu ra nắng nhiều.",
      shopUrl: "/shop",
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
  const [filterTiming, setFilterTiming] = useState<"all" | "morning" | "evening">("all");

  const filteredProducts = routine.products.filter((p) => {
    if (filterTiming === "all") return true;
    if (filterTiming === "morning") return p.timing === "morning" || p.timing === "both";
    if (filterTiming === "evening") return p.timing === "evening" || p.timing === "both";
    return true;
  });

  const totalPrice = routine.products.reduce((acc, p) => acc + p.priceVnd, 0);
  const totalOriginalPrice = routine.products.reduce((acc, p) => acc + p.originalPriceVnd, 0);
  const totalSaved = totalOriginalPrice - totalPrice;

  function handleBuySingleProduct(product: RoutineProduct) {
    toast.success(`Đang chuyển sang gian hàng Shopee để mua "${product.name}"...`);
    router.push("/shop");
  }

  function handleBuyFullRoutine() {
    toast.success(
      `Đã chuyển trọn bộ ${routine.products.length} sản phẩm theo phác đồ của Bác sĩ vào giỏ hàng Shopee!`,
    );
    router.push("/shop");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. KHỐI HEADER BỆNH ÁN & BÁC SĨ PHỤ TRÁCH */}
      <div className="rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D8D4CA]/70 pb-5">
          <div className="flex items-center gap-4">
            <img
              src={routine.doctor.avatar}
              alt={routine.doctor.name}
              className="size-16 rounded-2xl object-cover border-2 border-[#2D5A43] shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#2D5A43] px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                  <BadgeCheck className="size-3" />
                  <span>Bác Sĩ Da Liễu Đã Kê Đơn</span>
                </span>
                <span className="text-xs text-[#5C605C] font-mono">{routine.doctor.licenseNumber}</span>
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#191B19] mt-0.5">
                {routine.doctor.name}
              </h3>
              <p className="text-xs text-[#5C605C]">{routine.doctor.hospital}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs bg-white border border-[#D8D4CA] rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-[#5C605C]">
              <Calendar className="size-4 text-[#C2410C]" />
              <span>Ngày kê: <strong>{routine.prescribedDate}</strong></span>
            </div>
            <span className="hidden sm:inline text-[#D8D4CA]">•</span>
            <div className="flex items-center gap-1.5 text-[#2D5A43] font-semibold">
              <Clock className="size-4" />
              <span>Hẹn tái khám: {routine.revisitDate}</span>
            </div>
          </div>
        </div>

        {/* Chẩn đoán & Lời dặn dò */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#C2410C]" />
              <h4 className="font-bold text-base text-[#191B19]">
                {routine.planTitle}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#5C605C]">Độ đỏ da (PIE): <strong className="text-rose-600">{routine.rednessScore}%</strong></span>
              <span className="rounded-full bg-rose-600/10 text-rose-700 px-2.5 py-0.5 font-bold">
                Mức độ: {routine.severity}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#D8D4CA] p-4 text-xs sm:text-sm text-[#4A4D4A] space-y-2">
            <div>
              <strong className="text-[#191B19]">Triệu chứng ghi nhận:</strong> {routine.diagnosis}
            </div>
            <div className="text-[#2D5A43] font-medium pt-1 border-t border-[#D8D4CA]/50">
              <strong className="text-[#191B19]">Lời dặn chuyên môn của Bác sĩ:</strong> {routine.doctorNotes}
            </div>
          </div>
        </div>
      </div>

      {/* 2. THANH LỌC THỜI ĐIỂM (Tất cả / Buổi sáng / Buổi tối) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#191B19]">
            Danh Sách Sản Phẩm Trong Routine ({filteredProducts.length} bước)
          </h3>
          <p className="text-xs text-[#5C605C]">
            Các sản phẩm chính hãng đã được bác sĩ chỉ định. Bấm Mua Tại Shop để đặt hàng giao tận nhà.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] p-1">
          <button
            type="button"
            onClick={() => setFilterTiming("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filterTiming === "all" ? "bg-[#2D5A43] text-white" : "text-[#5C605C] hover:text-[#191B19]"
            }`}
          >
            Tất cả ({routine.products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTiming("morning")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filterTiming === "morning" ? "bg-amber-600 text-white" : "text-[#5C605C] hover:text-[#191B19]"
            }`}
          >
            <Sun className="size-3" />
            <span>Buổi Sáng</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTiming("evening")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filterTiming === "evening" ? "bg-indigo-700 text-white" : "text-[#5C605C] hover:text-[#191B19]"
            }`}
          >
            <Moon className="size-3" />
            <span>Buổi Tối</span>
          </button>
        </div>
      </div>

      {/* 3. DANH SÁCH CÁC SẢN PHẨM TRONG ROUTINE (KÈM NÚT SANG SHOP MUA) */}
      <div className="space-y-4">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="rounded-2xl border border-[#D8D4CA] bg-white p-4 sm:p-5 shadow-xs hover:border-[#C2410C]/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Cột Trái: Ảnh sản phẩm + Tên + Hướng dẫn bôi */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl border border-[#D8D4CA] bg-neutral-100">
                <img src={prod.image} alt={prod.name} className="size-full object-cover" />
                <span className="absolute top-1 left-1 rounded bg-[#2D5A43] px-1.5 py-0.2 text-[9px] font-bold text-white">
                  Bước {prod.stepNumber}
                </span>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-[#C2410C] uppercase tracking-wider">
                    {prod.stepName}
                  </span>
                  {prod.timing === "morning" && (
                    <span className="flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                      <Sun className="size-2.5" /> Dùng Buổi Sáng
                    </span>
                  )}
                  {prod.timing === "evening" && (
                    <span className="flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.2 text-[10px] font-bold text-indigo-800">
                      <Moon className="size-2.5" /> Dùng Buổi Tối
                    </span>
                  )}
                  {prod.timing === "both" && (
                    <span className="flex items-center gap-1 rounded bg-teal-50 border border-teal-200 px-2 py-0.2 text-[10px] font-bold text-teal-800">
                      Sáng & Tối
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm sm:text-base text-[#191B19] leading-snug line-clamp-2">
                  {prod.name}
                </h4>

                <div className="rounded-xl bg-[#FAF8F5] border border-[#D8D4CA]/70 p-2 text-xs text-[#4A4D4A]">
                  <strong className="text-[#191B19]">Cách dùng:</strong> {prod.instruction}
                </div>
              </div>
            </div>

            {/* Cột Phải: Giá bán Shopee + Nút Mua Tại Shop */}
            <div className="flex sm:flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#D8D4CA]/60">
              <div className="text-left md:text-right">
                <span className="text-[10px] text-[#5C605C] block uppercase font-semibold">
                  Giá bán Shopee:
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-base sm:text-lg font-bold font-serif text-[#C2410C]">
                    {formatMoney(prod.priceVnd)}
                  </span>
                  <span className="text-xs text-[#5C605C] line-through">
                    {formatMoney(prod.originalPriceVnd)}
                  </span>
                </div>
              </div>

              {/* Nút: Chuyển sang Shop để mua sản phẩm này */}
              <button
                type="button"
                onClick={() => handleBuySingleProduct(prod)}
                className="h-9 px-4 flex items-center gap-1.5 rounded-xl bg-[#C2410C] text-xs font-bold text-white shadow-2xs hover:bg-[#9A3412] transition cursor-pointer"
              >
                <ShoppingBag className="size-3.5" />
                <span>Mua Tại Shop</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. THANH TỔNG HỢP & NÚT MUA TRỌN BỘ ROUTINE */}
      <div className="rounded-3xl border-2 border-[#C2410C]/40 bg-gradient-to-r from-[#FAF8F5] to-white p-5 sm:p-7 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="rounded-md bg-[#C2410C] px-2 py-0.5 text-xs font-bold text-white">
              Gói Phác Đồ 14 Ngày
            </span>
            <span className="text-xs font-bold text-[#2D5A43]">
              Tiết kiệm {formatMoney(totalSaved)} khi mua cả bộ
            </span>
          </div>
          <h4 className="font-serif text-lg sm:text-xl font-bold text-[#191B19]">
            Mua Trọn Bộ Routine Theo Chỉ Định Của Bác Sĩ
          </h4>
          <p className="text-xs text-[#5C605C]">
            Bao gồm đầy đủ 4 sản phẩm theo thứ tự các bước sáng/tối. Miễn phí vận chuyển Freeship Xtra.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
          <div className="text-center sm:text-right">
            <span className="text-xs text-[#5C605C] block">Tổng tiền trọn bộ:</span>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-[#C2410C]">
              {formatMoney(totalPrice)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleBuyFullRoutine}
            className="w-full sm:w-auto h-12 px-7 flex items-center justify-center gap-2 rounded-2xl bg-[#C2410C] text-sm font-bold text-white shadow-md hover:bg-[#9A3412] active:scale-[0.98] transition cursor-pointer"
          >
            <ShoppingBag className="size-5" />
            <span>Mua Trọn Bộ Tại Shop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
