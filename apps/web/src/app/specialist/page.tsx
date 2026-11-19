"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Stethoscope,
  FileText,
  Plus,
  Eye,
  X,
  Trash2,
  Search,
  Filter,
  Sparkles,
  Clock,
  CheckCircle2,
  Home,
  Activity,
  Check,
  AlertTriangle,
  User,
  ZoomIn,
  ZoomOut,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";
import { SafeProductImage } from "@/components/safe-product-image";
import { PatientPhoto } from "@/components/patient-photo";
import { ImageUploader } from "@/components/cloudinary-product-uploader";
import { AuthModal } from "@/components/auth-modal";
import { detectActiveConflicts, inferUsageSlot } from "@/lib/routine-builder";

function computeFutureDateIso(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

export type CaseStatus = "pending_routine" | "in_treatment" | "completed";
export type SeverityLevel = "mild" | "moderate" | "severe";

export interface RoutineProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  activeIngredients: string;
  stepTime: "morning" | "evening" | "both";
  stepNumber: number;
  dosage: string;
  usageGuide: string;
}

export interface PatientCase {
  id: string;
  caseCode: string;
  patientName: string;
  patientAge: number;
  patientGender: "Nữ" | "Nam";
  phone: string;
  submittedDate: string;
  status: CaseStatus;
  severity: SeverityLevel;
  skinPhotoUrl: string;
  skinType: string;
  fitzpatrickScale: string;
  symptoms: string;
  allergies: string;
  aiAnalysis: {
    skinHealthScore: number;
    rednessIndex: number;
    inflammatorySpots: number;
    affectedZones: string[];
  };
  currentRoutine?: {
    routineTitle: string;
    startDate: string;
    revisitDate: string;
    doctorNotes: string;
    products: RoutineProduct[];
  };
  treatmentDay?: string;
}

export interface DoctorProfile {
  name: string;
  title: string;
  hospital: string;
  licenseNumber: string;
  experienceYears: number;
  avatarUrl: string;
  bio: string;
  email: string;
}

// Preset verified cosmetic products with verified 200-OK photos
export const PRESET_PRODUCTS: Omit<RoutineProduct, "id" | "stepNumber">[] = [
  {
    name: "Sữa rửa mặt CeraVe Hydrating Cleanser",
    brand: "CeraVe Skincare",
    category: "Làm sạch dịu nhẹ",
    activeIngredients: "Ceramides 1, 3, 6-II, Hyaluronic Acid",
    stepTime: "both",
    dosage: "1 pump vừa đủ",
    usageGuide: "Massage nhẹ nhàng với nước ấm 60 giây, thấm khô bằng khăn mềm.",
  },
  {
    name: "Kem giảm mụn La Roche-Posay Effaclar Duo+M",
    brand: "La Roche-Posay",
    category: "Trị mụn & Ngừa thâm",
    activeIngredients: "Phylobioma, Niacinamide, Salicylic Acid, Zinc PCA",
    stepTime: "evening",
    dosage: "1 lượng bằng hạt đậu xanh",
    usageGuide: "Thoa mỏng toàn mặt sau bước serum, vỗ nhẹ cho dưỡng chất thẩm thấu.",
  },
  {
    name: "Serum phục hồi & cấp nước La Roche-Posay Hyalu B5",
    brand: "La Roche-Posay",
    category: "Tinh chất phục hồi",
    activeIngredients: "Vitamin B5 (Panthenol 5%), Hyaluronic Acid, Madecassoside",
    stepTime: "both",
    dosage: "3 giọt tinh chất",
    usageGuide: "Thoa đều khi da còn ẩm, vỗ nhẹ 30 giây trước khi thoa kem dưỡng ẩm.",
  },
  {
    name: "Kem chống nắng kiềm dầu La Roche-Posay Anthelios UVMune 400",
    brand: "La Roche-Posay",
    category: "Chống nắng y khoa",
    activeIngredients: "Mexoryl 400, Airlicium, SPF50+ PA++++",
    stepTime: "morning",
    dosage: "2 đốt ngón tay trỏ",
    usageGuide: "Thoa đều toàn bộ khuôn mặt và cổ mỗi sáng trước khi ra ngoài 20 phút.",
  },
  {
    name: "Kem dưỡng ẩm làm dịu A-Derma Dermalibour+ CICA",
    brand: "A-Derma",
    category: "Phục hồi màng bảo vệ",
    activeIngredients: "Mạ yến mạch Rhealba, Đồng Sulfate & Kẽm Sulfate",
    stepTime: "both",
    dosage: "1 lượng bằng hạt bắp",
    usageGuide: "Thoa lớp mỏng lên vùng da đỏ rát hoặc kích ứng 2 lần/ngày sáng và tối.",
  },
  {
    name: "Nước tẩy trang dịu nhẹ Bioderma Sensibio H2O",
    brand: "Bioderma Laboratoire",
    category: "Làm sạch micellar",
    activeIngredients: "Micellar Water, Chiết xuất dưa leo làm dịu da",
    stepTime: "evening",
    dosage: "Thấm ướt bông tẩy trang",
    usageGuide: "Lau nhẹ nhàng toàn mặt từ trong ra ngoài đến khi bông sạch hoàn toàn.",
  },
];

// Rich Patient Cases initial state
export const INITIAL_PATIENT_CASES: PatientCase[] = [
  {
    id: "365d9ffb-0ee5-41d2-879c-37ef337fe262",
    caseCode: "BA-2026-0891",
    patientName: "Trần Thị Ngọc Hà",
    patientAge: 21,
    patientGender: "Nữ",
    phone: "0905 888 999",
    submittedDate: "14/11/2026",
    status: "in_treatment",
    severity: "moderate",
    skinPhotoUrl: "",
    skinType: "Hỗn hợp thiên dầu",
    fitzpatrickScale: "Loại III (Da sáng Châu Á)",
    symptoms: "Mụn viêm đỏ vùng má trái & cằm; da châm chích nhẹ sau khi đi nắng, tiết dầu nhờn vùng chữ T.",
    allergies: "Dị ứng hương liệu nhân tạo và cồn khô nồng độ cao.",
    treatmentDay: "Ngày thứ 14 / 28",
    aiAnalysis: {
      skinHealthScore: 78,
      rednessIndex: 46,
      inflammatorySpots: 6,
      affectedZones: ["Má trái", "Cằm", "Vùng trán"],
    },
    currentRoutine: {
      routineTitle: "Phác đồ phục hồi hàng rào ẩm & giảm đỏ da (28 ngày)",
      startDate: "2026-11-01",
      revisitDate: "2026-11-28",
      doctorNotes: "Tránh nặn mụn tay trần. Thoa mỏng Duo+M buổi tối tại nốt viêm.",
      products: [
        {
          id: "rp_01",
          name: "Sữa rửa mặt CeraVe Hydrating Cleanser",
          brand: "CeraVe Skincare",
          category: "Làm sạch dịu nhẹ",
          activeIngredients: "Ceramides 1, 3, 6-II, Hyaluronic Acid",
          stepTime: "both",
          stepNumber: 1,
          dosage: "1 pump vừa đủ",
          usageGuide: "Massage nhẹ nhàng với nước ấm 60 giây, thấm khô bằng khăn mềm.",
        },
        {
          id: "rp_02",
          name: "Serum phục hồi & cấp nước La Roche-Posay Hyalu B5",
          brand: "La Roche-Posay",
          category: "Tinh chất phục hồi",
          activeIngredients: "Vitamin B5 (Panthenol 5%), Hyaluronic Acid, Madecassoside",
          stepTime: "both",
          stepNumber: 2,
          dosage: "3 giọt tinh chất",
          usageGuide: "Thoa đều khi da còn ẩm, vỗ nhẹ 30 giây trước khi thoa kem dưỡng ẩm.",
        },
        {
          id: "rp_03",
          name: "Kem giảm mụn La Roche-Posay Effaclar Duo+M",
          brand: "La Roche-Posay",
          category: "Trị mụn & Ngừa thâm",
          activeIngredients: "Phylobioma, Niacinamide, Salicylic Acid, Zinc PCA",
          stepTime: "evening",
          stepNumber: 3,
          dosage: "1 lượng bằng hạt đậu xanh",
          usageGuide: "Chấm mỏng tại vùng má trái và cằm sau serum, vỗ nhẹ cho thẩm thấu.",
        },
        {
          id: "rp_04",
          name: "Kem chống nắng kiềm dầu La Roche-Posay Anthelios UVMune 400",
          brand: "La Roche-Posay",
          category: "Chống nắng y khoa",
          activeIngredients: "Mexoryl 400, Airlicium, SPF50+ PA++++",
          stepTime: "morning",
          stepNumber: 4,
          dosage: "2 đốt ngón tay trỏ",
          usageGuide: "Thoa đều toàn bộ khuôn mặt và cổ mỗi sáng trước khi ra ngoài 20 phút.",
        },
      ],
    },
  },
  {
    id: "case_02",
    caseCode: "BA-2026-0895",
    patientName: "Lê Minh Tuấn",
    patientAge: 24,
    patientGender: "Nam",
    phone: "0912 345 678",
    submittedDate: "12/11/2026",
    status: "pending_routine",
    severity: "severe",
    skinPhotoUrl: "",
    skinType: "Da dầu mụn bùng phát",
    fitzpatrickScale: "Loại IV (Da ngăm khỏe)",
    symptoms: "Bùng mụn bọc sưng đỏ diện rộng 2 bên má sau thức khuya ôn thi, đau nhức khi chạm.",
    allergies: "Chưa ghi nhận tiền sử dị ứng.",
    aiAnalysis: {
      skinHealthScore: 54,
      rednessIndex: 72,
      inflammatorySpots: 14,
      affectedZones: ["Má trái", "Má phải", "Quai hàm"],
    },
  },
  {
    id: "case_03",
    caseCode: "BA-2026-0902",
    patientName: "Nguyễn Thùy Linh",
    patientAge: 27,
    patientGender: "Nữ",
    phone: "0988 776 655",
    submittedDate: "10/11/2026",
    status: "in_treatment",
    severity: "mild",
    skinPhotoUrl: "",
    skinType: "Da khô nhạy cảm",
    fitzpatrickScale: "Loại II (Da trắng sáng)",
    symptoms: "Da khô căng bong tróc nhẹ cánh mũi, ửng đỏ khi thay đổi thời tiết se lạnh.",
    allergies: "Kích ứng nhẹ với Retinol nồng độ > 0.5%.",
    treatmentDay: "Ngày thứ 7 / 21",
    aiAnalysis: {
      skinHealthScore: 82,
      rednessIndex: 34,
      inflammatorySpots: 2,
      affectedZones: ["Mũi", "Gò má"],
    },
    currentRoutine: {
      routineTitle: "Cấp ẩm chuyên sâu & Dịu da nhạy cảm thời tiết",
      startDate: "2026-11-08",
      revisitDate: "2026-11-29",
      doctorNotes: "Không dùng tẩy tế bào chết hóa học trong 2 tuần đầu.",
      products: [
        {
          id: "rp_05",
          name: "Sữa rửa mặt CeraVe Hydrating Cleanser",
          brand: "CeraVe Skincare",
          category: "Làm sạch dịu nhẹ",
          activeIngredients: "Ceramides 1, 3, 6-II, Hyaluronic Acid",
          stepTime: "both",
          stepNumber: 1,
          dosage: "1 pump vừa đủ",
          usageGuide: "Rửa với nước mát, không chà xát mạnh.",
        },
        {
          id: "rp_06",
          name: "Kem dưỡng ẩm làm dịu A-Derma Dermalibour+ CICA",
          brand: "A-Derma",
          category: "Phục hồi màng bảo vệ",
          activeIngredients: "Mạ yến mạch Rhealba, Đồng Sulfate & Kẽm Sulfate",
          stepTime: "both",
          stepNumber: 2,
          dosage: "1 lượng bằng hạt bắp",
          usageGuide: "Thoa dày nhẹ vùng cánh mũi và gò má bị bong tróc.",
        },
      ],
    },
  },
  {
    id: "case_04",
    caseCode: "BA-2026-0915",
    patientName: "Phạm Hoàng Nam",
    patientAge: 29,
    patientGender: "Nam",
    phone: "0934 112 233",
    submittedDate: "13/11/2026",
    status: "pending_routine",
    severity: "moderate",
    skinPhotoUrl: "",
    skinType: "Da hỗn hợp thiên dầu",
    fitzpatrickScale: "Loại III (Da sáng Châu Á)",
    symptoms: "Bít tắc lỗ chân lông vùng mũi & trán, nhiều mụn đầu đen và mụn ẩn li ti.",
    allergies: "Không có.",
    aiAnalysis: {
      skinHealthScore: 71,
      rednessIndex: 38,
      inflammatorySpots: 5,
      affectedZones: ["Vùng chữ T", "Mũi"],
    },
  },
];

function SpecialistContent() {
  const [showSandboxPreview, setShowSandboxPreview] = useState(false);
  const [activeSplitCaseId, setActiveSplitCaseId] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState<1 | 2>(1);
  const [isUpdatingCaseStatus, setIsUpdatingCaseStatus] = useState(false);
  const [approvedShopPresets, setApprovedShopPresets] = useState<Omit<RoutineProduct, "id" | "stepNumber">[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/products", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            ok?: boolean;
            products?: Array<{
              id: string;
              name: string;
              brand?: string;
              shopName?: string;
              category?: string;
              status?: string;
              coverImage?: string;
              description?: string;
            }>;
          } | null,
        ) => {
          if (cancelled || !data?.ok || !Array.isArray(data.products)) return;
          const existingNames = new Set(PRESET_PRODUCTS.map((p) => p.name.toLowerCase()));
          const mapped = data.products
            .filter((p) => p.status === "approved" && p.name && !existingNames.has(p.name.toLowerCase()))
            .map((p) => {
              const slot = inferUsageSlot({ name: p.name, category: p.category });
              return {
                name: p.name,
                brand: p.brand || p.shopName || "Đối tác SkinSense",
                category: p.category || "Dược mỹ phẩm đã duyệt",
                imageUrl: p.coverImage || undefined,
                activeIngredients: p.description ? p.description.slice(0, 80) : "Hoạt chất chuẩn y khoa",
                stepTime: (slot === "AM" ? "morning" : slot === "PM" ? "evening" : "both") as
                  | "morning"
                  | "evening"
                  | "both",
                dosage: "Theo chỉ định Bác sĩ",
                usageGuide: "Sử dụng theo thứ tự bước chăm sóc da Sáng/Tối.",
              };
            });
          setApprovedShopPresets(mapped);
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const presetCatalog = useMemo(
    () => [...PRESET_PRODUCTS, ...approvedShopPresets],
    [approvedShopPresets],
  );

  // Filled from the signed-in account only: the old defaults named a made-up doctor and licence.
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>({
    name: "",
    title: "",
    hospital: "",
    licenseNumber: "",
    experienceYears: 0,
    avatarUrl: "",
    bio: "",
    email: "",
  });

  const [isPending, setIsPending] = useState(false);

  const refreshAuthMe = () => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const pendingDoctor =
            data.user.role === "doctor_pending" ||
            (data.user.role === "specialist" && data.user.status === "pending");
          setIsPending(pendingDoctor);
          setDoctorProfile((prev) => ({
            ...prev,
            name: data.user.fullName || prev.name,
            licenseNumber: data.user.licenseId || prev.licenseNumber,
            hospital: data.user.hospital || prev.hospital,
            email: data.user.email || prev.email,
          }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshAuthMe();
  }, []);

  // Only the cases patients really sent. The sample cases (INITIAL_PATIENT_CASES) used to fill the
  // list whenever the API returned nothing, so a signed-out visitor or a customer saw a "portal" full
  // of patients, and a real specialist prescribed to patients who did not exist.
  const [patientCases, setPatientCases] = useState<PatientCase[]>([]);
  const [access, setAccess] = useState<"loading" | "granted" | "signed-out" | "denied">("loading");
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false);

  const refreshCases = () => {
    fetch("/api/specialist/cases", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return setAccess("signed-out");
        if (res.status === 403) return setAccess("denied");
        const json = await res.json();
        if (json.ok && Array.isArray(json.cases)) {
          setAccess("granted");
          setPatientCases(json.cases);
        }
      })
      .catch((err) => console.error("Failed to load real cases from Supabase:", err));
  };

  useEffect(() => {
    refreshCases();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const [isPrescribeModalOpen, setIsPrescribeModalOpen] = useState(false);
  const [prescribeTargetCase, setPrescribeTargetCase] = useState<PatientCase | null>(null);
  const [routineTitleInput, setRoutineTitleInput] = useState("");
  const [startDateInput, setStartDateInput] = useState(() => new Date().toISOString().split("T")[0]);
  const [revisitDateInput, setRevisitDateInput] = useState(() =>
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [doctorNotesInput, setDoctorNotesInput] = useState("");
  const [modalProducts, setModalProducts] = useState<RoutineProduct[]>([]);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productSource, setProductSource] = useState<"preset" | "custom">("preset");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customProdName, setCustomProdName] = useState("");
  const [customProdBrand, setCustomProdBrand] = useState("");
  const [customProdCategory, setCustomProdCategory] = useState("Serum điều trị");
  const [customProdImage, setCustomProdImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customProdActives, setCustomProdActives] = useState("");
  const [customProdTime, setCustomProdTime] = useState<"morning" | "evening" | "both">("both");
  const [customProdDosage, setCustomProdDosage] = useState("1 hạt đậu");
  const [customProdUsage, setCustomProdUsage] = useState("Thoa sau bước làm sạch, vỗ nhẹ cho thẩm thấu.");

  const filteredCases = useMemo(() => {
    return patientCases.filter((c) => {
      const matchSearch =
        c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchSeverity = severityFilter === "all" || c.severity === severityFilter;
      return matchSearch && matchStatus && matchSeverity;
    });
  }, [patientCases, searchTerm, statusFilter, severityFilter]);

  function handleOpenPrescribeModal(patientCase: PatientCase) {
    setPrescribeTargetCase(patientCase);
    if (patientCase.currentRoutine) {
      setRoutineTitleInput(patientCase.currentRoutine.routineTitle);
      setStartDateInput(patientCase.currentRoutine.startDate);
      setRevisitDateInput(patientCase.currentRoutine.revisitDate);
      setDoctorNotesInput(patientCase.currentRoutine.doctorNotes);
      setModalProducts([...patientCase.currentRoutine.products]);
    } else {
      setRoutineTitleInput(`Phác đồ điều trị da liễu cho ${patientCase.patientName} (14 ngày)`);
      setStartDateInput(new Date().toISOString().split("T")[0]);
      setRevisitDateInput(computeFutureDateIso(14));
      setDoctorNotesInput("Tuân thủ đúng thứ tự bước thoa sáng và tối. Liên hệ bác sĩ nếu có dấu hiệu rát đỏ bất thường.");
      // Để trống khi bệnh nhân chưa có phác đồ (Không dùng dữ liệu mẫu)
      setModalProducts([]);
    }
    setIsPrescribeModalOpen(true);
  }

  function handleAddProductConfirm() {
    let newProd: RoutineProduct;

    if (productSource === "preset") {
      const preset = presetCatalog[selectedPresetIndex] ?? PRESET_PRODUCTS[0];
      newProd = {
        id: `prod_${Date.now()}`,
        name: preset.name,
        brand: preset.brand,
        category: preset.category,
        imageUrl: preset.imageUrl,
        activeIngredients: preset.activeIngredients,
        stepTime: preset.stepTime,
        stepNumber: modalProducts.length + 1,
        dosage: preset.dosage,
        usageGuide: preset.usageGuide,
      };
    } else {
      if (!customProdName.trim()) {
        toast.error("Vui lòng nhập tên sản phẩm!");
        return;
      }
      newProd = {
        id: `prod_${Date.now()}`,
        name: customProdName.trim(),
        brand: customProdBrand.trim() || "Dược mỹ phẩm",
        category: customProdCategory,
        imageUrl: customProdImage.trim() || undefined,
        activeIngredients: customProdActives.trim() || "Hoạt chất da liễu",
        stepTime: customProdTime,
        stepNumber: modalProducts.length + 1,
        dosage: customProdDosage.trim() || "Theo chỉ định",
        usageGuide: customProdUsage.trim() || "Thoa đều toàn mặt sau bước làm sạch.",
      };
    }

    setModalProducts((prev) => [...prev, newProd]);
    setIsAddProductOpen(false);
    toast.success(`Đã thêm "${newProd.name}" vào Routine!`);
  }

  function handleRemoveProduct(id: string) {
    setModalProducts((prev) => prev.filter((p) => p.id !== id).map((p, idx) => ({ ...p, stepNumber: idx + 1 })));
    toast.info("Đã xóa sản phẩm khỏi phác đồ.");
  }

  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  // Success is shown only once the server saved the routine for the patient: it used to toast
  // "sent" before the request and swallow every failure.
  async function handleSaveRoutineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prescribeTargetCase || isSavingRoutine) return;

    if (modalProducts.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm kèm ảnh vào phác đồ!");
      return;
    }

    const target = prescribeTargetCase;
    const updatedRoutine = {
      routineTitle: routineTitleInput.trim() || `Phác đồ điều trị ${target.patientName}`,
      startDate: startDateInput,
      revisitDate: revisitDateInput,
      doctorNotes: doctorNotesInput.trim(),
      products: modalProducts,
    };

    setIsSavingRoutine(true);
    try {
      const res = await fetch("/api/specialist/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: target.id,
          routineTitle: updatedRoutine.routineTitle,
          doctorNotes: updatedRoutine.doctorNotes,
          revisitDate: updatedRoutine.revisitDate,
          products: modalProducts,
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || "Gửi phác đồ thất bại, vui lòng thử lại.");
        return;
      }
    } catch {
      toast.error("Lỗi kết nối khi gửi phác đồ, vui lòng thử lại.");
      return;
    } finally {
      setIsSavingRoutine(false);
    }

    setPatientCases((prev) =>
      prev.map((c) =>
        c.id === target.id ? { ...c, status: "in_treatment", currentRoutine: updatedRoutine } : c,
      ),
    );
    setIsPrescribeModalOpen(false);
    toast.success(`Đã xuất và gửi phác đồ Routine thành công cho bệnh nhân ${target.patientName}!`);
  }

  async function handleToggleCaseCompletion(patientCase: PatientCase) {
    if (isUpdatingCaseStatus) return;
    const nextStatus: CaseStatus = patientCase.status === "completed" ? "in_treatment" : "completed";
    setIsUpdatingCaseStatus(true);
    try {
      const res = await fetch("/api/specialist/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: patientCase.id, status: nextStatus }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; error?: string } | null;
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || "Cập nhật trạng thái bệnh án thất bại.");
        return;
      }
      setPatientCases((prev) =>
        prev.map((c) =>
          c.id === patientCase.id
            ? {
                ...c,
                status: nextStatus,
                treatmentDay: nextStatus === "completed" ? "Đã hoàn tất liệu trình" : c.treatmentDay,
              }
            : c,
        ),
      );
      if (selectedCase?.id === patientCase.id) {
        setSelectedCase((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      }
      toast.success(json.message || "Đã cập nhật trạng thái liệu trình.");
    } catch {
      toast.error("Lỗi kết nối khi cập nhật trạng thái bệnh án.");
    } finally {
      setIsUpdatingCaseStatus(false);
    }
  }

  function formatDateVi(dateStr: string) {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  const pendingCount = patientCases.filter((c) => c.status === "pending_routine").length;
  const inTreatmentCount = patientCases.filter((c) => c.status === "in_treatment").length;
  const completedCount = patientCases.filter((c) => c.status === "completed").length;

  if (access === "signed-out" || access === "denied") {
    return (
      <div className="min-h-screen bg-[#E8E5DE] text-[#191B19] antialiased flex items-center justify-center p-4 sm:p-6">
        <div
          className={`w-full rounded-3xl border border-[#D8D4CA] bg-white p-6 sm:p-8 shadow-xs space-y-5 ${
            access === "denied" && isPending ? "max-w-2xl" : "max-w-md text-center"
          }`}
        >
          <div className={access === "denied" && isPending ? "flex flex-col sm:flex-row sm:items-center gap-4 border-b border-[#D8D4CA]/70 pb-5" : "space-y-4"}>
            <div
              className={`size-14 rounded-2xl bg-[#2D5A43]/10 text-[#2D5A43] flex items-center justify-center shrink-0 ${
                access === "denied" && isPending ? "" : "mx-auto"
              }`}
            >
              <Stethoscope className="size-7" />
            </div>
            <div className={access === "denied" && isPending ? "space-y-1 text-left" : "space-y-2"}>
              <h1 className="font-serif text-2xl font-bold text-[#191B19]">Cổng dành cho Bác sĩ</h1>
              <p className="text-sm text-[#5C605C]">
                {access === "signed-out"
                  ? "Vui lòng đăng nhập bằng tài khoản Bác sĩ đã được duyệt để xem bệnh án."
                  : "Tài khoản của bạn chưa được cấp quyền Bác sĩ. Hồ sơ đăng ký Bác sĩ cần được Ban quản trị duyệt trước."}
              </p>
            </div>
          </div>

          {access === "denied" && isPending && (
            <div className="space-y-4 text-left">
              <div className="rounded-2xl border border-amber-600/30 bg-amber-500/10 p-4 text-xs text-amber-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <Clock className="size-4 text-amber-700 shrink-0" />
                  <span>Hồ sơ Bác sĩ đang chờ Super Admin duyệt</span>
                </div>
                {doctorProfile.licenseNumber && (
                  <div>
                    Số CCHN: <span className="font-mono font-semibold">{doctorProfile.licenseNumber}</span>
                  </div>
                )}
                {doctorProfile.hospital && <div>Đơn vị công tác: {doctorProfile.hospital}</div>}
              </div>

              {/* Thanh tiến trình đối soát 3 bước chuẩn Teledermatology */}
              <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C605C] block">
                  Tiến trình xác minh chứng chỉ hành nghề
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-xl border border-[#2D5A43]/25 bg-white p-3 space-y-1">
                    <span className="inline-flex items-center gap-1 font-bold text-[#2D5A43]">
                      <CheckCircle2 className="size-3.5" /> Bước 1 · Hoàn tất
                    </span>
                    <p className="font-medium text-[#191B19]">Nộp hồ sơ & CCHN</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/40 bg-amber-50/70 p-3 space-y-1">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-900">
                      <Clock className="size-3.5" /> Bước 2 · Đang xử lý
                    </span>
                    <p className="font-medium text-[#191B19]">Admin đối soát chuyên môn</p>
                  </div>
                  <div className="rounded-xl border border-[#D8D4CA] bg-white/60 p-3 space-y-1 text-[#5C605C]">
                    <span className="inline-flex items-center gap-1 font-bold">
                      Bước 3 · Sắp mở khóa
                    </span>
                    <p>Tiếp nhận bệnh án & Kê phác đồ</p>
                  </div>
                </div>
              </div>

              {/* Chế độ xem trước Không gian Bác sĩ (Chỉ đọc, dữ liệu minh họa tĩnh) */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowSandboxPreview((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D5A43] hover:underline cursor-pointer"
                >
                  <Sparkles className="size-3.5" />
                  <span>
                    {showSandboxPreview
                      ? "Thu gọn giao diện xem thử"
                      : "Xem thử Không gian Tiếp nhận Bệnh án (Chế độ chỉ đọc)"}
                  </span>
                  <ArrowRight className="size-3.5" />
                </button>

                {showSandboxPreview && (
                  <div className="rounded-2xl border border-dashed border-[#2D5A43]/40 bg-[#FAF8F5] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8D4CA]/70 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D5A43]">
                        Chế độ chỉ đọc · Hồ sơ minh họa mẫu
                      </span>
                      <span className="rounded-full bg-[#2D5A43]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#2D5A43]">
                        FITZPATRICK III
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                        <span className="text-[#5C605C] block">Chỉ số đỏ da (PIE)</span>
                        <strong className="text-base text-rose-700">42%</strong>
                      </div>
                      <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                        <span className="text-[#5C605C] block">Điểm sức khỏe da</span>
                        <strong className="text-base text-[#2D5A43]">74/100</strong>
                      </div>
                      <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                        <span className="text-[#5C605C] block">Vùng trọng tâm AI</span>
                        <strong className="text-[#191B19]">Má trái · Vùng chữ T</strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5C605C] leading-relaxed">
                      Sau khi Admin phê duyệt CCHN, Bác sĩ có thể phóng to ảnh da bệnh nhân, xem lịch sử dị ứng và xuất phác đồ Morning/Evening Routine trực tiếp về tài khoản người dùng.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`flex flex-col gap-2.5 pt-1 ${access === "denied" && isPending ? "sm:flex-row" : ""}`}>
            {access === "denied" && (
              <AuthModal
                defaultTab="doctor-approval"
                triggerLabel={isPending ? "Cập nhật hồ sơ Bác sĩ" : "Gửi hồ sơ đăng ký Bác sĩ ngay"}
                triggerClassName={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#2D5A43]/40 bg-[#2D5A43]/10 px-5 py-2.5 text-sm font-semibold text-[#2D5A43] hover:bg-[#2D5A43]/20 transition cursor-pointer ${
                  isPending ? "flex-1" : "w-full"
                }`}
                onSubmitted={() => {
                  refreshAuthMe();
                  refreshCases();
                }}
              />
            )}
            <Link
              href={access === "signed-out" ? "/" : "/app"}
              className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D5A43] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition ${
                access === "denied" && isPending ? "flex-1" : "w-full"
              }`}
            >
              <Home className="size-4" />
              <span>{access === "signed-out" ? "Về trang chủ để đăng nhập" : "Về trang soi da"}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8E5DE] text-[#191B19] antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#D8D4CA] bg-[#E8E5DE]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3.5 sm:px-8">
          <div className="flex items-center gap-3.5">
            <Link href="/app" className="flex items-center gap-2.5 group" title="Về trang soi da (Hôm nay)">
              <LogoMark className="size-9 transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight text-[#191B19] leading-tight">
                  SkinSense <span className="text-[#2D5A43] font-sans text-xs font-bold tracking-wider">CLINICAL</span>
                </span>
                <span className="text-xs font-medium text-[#5C605C]">
                  Cổng Bác sĩ Da liễu & Kê Phác đồ
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-5 w-px bg-[#D8D4CA]" />

            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#2D5A43]/30 bg-[#2D5A43]/10 px-3.5 py-1 text-xs font-semibold text-[#2D5A43]">
              <Stethoscope className="size-4" />
              <span>{doctorProfile.name || "Bác sĩ"}</span>
              {doctorProfile.licenseNumber && <span className="opacity-75">({doctorProfile.licenseNumber})</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/specialist/profile"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs font-bold text-[#191B19] shadow-2xs hover:border-[#191B19] transition whitespace-nowrap"
              title="Hồ sơ Bác sĩ"
            >
              <User className="size-4 text-[#2D5A43] shrink-0" />
              <span className="hidden sm:inline">Hồ Sơ Bác Sĩ</span>
              <span className="sm:hidden">Hồ sơ</span>
            </Link>

            <Link
              href="/app"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3 py-2 text-xs font-semibold text-[#5C605C] transition hover:text-[#191B19] whitespace-nowrap"
              title="Về trang soi da (Hôm nay)"
            >
              <Home className="size-4 shrink-0" />
              <span className="hidden sm:inline">Trang chủ (Soi da)</span>
              <span className="sm:hidden">Soi da</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Pending Approval Alert Banner for Doctors */}
      {isPending && (
        <div className="border-b border-amber-600/30 bg-amber-500/15 px-4 py-3 text-amber-950 sm:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center gap-2.5 text-xs sm:text-sm">
            <span className="flex size-2.5 rounded-full bg-amber-600 animate-pulse shrink-0" />
            <span>
              <strong>Hồ sơ Bác sĩ đang chờ phê duyệt:</strong> Yêu cầu cấp phép Chứng chỉ hành nghề (CCHN) của bạn đang được xét duyệt. Vui lòng liên hệ ban quản trị để kích hoạt tài khoản.
            </span>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 space-y-7">
        {/* Title & Introduction */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D4CA] pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#191B19]">
              Quản lý Bệnh án & Xuất Phác đồ gửi Bệnh nhân
            </h2>
            <p className="text-sm text-[#5C605C] mt-1">
              Xem danh sách hồ sơ bệnh nhân gửi về, chọn hồ sơ để xuất phác đồ Routine và gửi trực tiếp về cho người bệnh.
            </p>
          </div>
        </div>

        {/* 1. THỐNG KÊ HÀNG NGANG (CLICK ĐỂ LỌC DANH SÁCH BỆNH ÁN) */}
        <div role="tablist" aria-label="Bộ lọc nhanh trạng thái bệnh án" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Tất cả */}
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "all"}
            aria-controls="cases-list"
            aria-label="Lọc tất cả bệnh án tiếp nhận"
            onClick={() => setStatusFilter("all")}
            className={`flex items-center justify-between p-5 sm:p-6 rounded-3xl border transition-all text-left cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2D5A43] ${
              statusFilter === "all"
                ? "border-[#2D5A43] bg-white ring-2 ring-[#2D5A43]/40 shadow-sm scale-[1.01]"
                : "border-[#D8D4CA] bg-[#FAF8F5] hover:bg-white hover:border-[#2D5A43]/50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`rounded-2xl p-3 shrink-0 transition ${
                  statusFilter === "all"
                    ? "bg-[#2D5A43] text-white"
                    : "bg-[#2D5A43]/10 text-[#2D5A43]"
                }`}
              >
                <FileText className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5C605C] uppercase tracking-wider block">
                  Tổng bệnh án tiếp nhận
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-serif text-[#191B19] mt-0.5">
                  {patientCases.length} <span className="text-xs font-sans font-normal text-[#5C605C]">ca khám</span>
                </div>
              </div>
            </div>
            {statusFilter === "all" ? (
              <span className="rounded-full bg-[#2D5A43]/15 px-2.5 py-1 text-[11px] font-bold text-[#2D5A43]">
                Đang xem ✓
              </span>
            ) : (
              <span className="text-xs text-[#5C605C] font-medium hidden md:inline">
                Nhấp để xem →
              </span>
            )}
          </button>

          {/* Card 2: Chờ xuất phác đồ */}
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "pending_routine"}
            aria-controls="cases-list"
            aria-label="Lọc bệnh án chờ xuất phác đồ"
            onClick={() => setStatusFilter("pending_routine")}
            className={`flex items-center justify-between p-5 sm:p-6 rounded-3xl border transition-all text-left cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#78350F] ${
              statusFilter === "pending_routine"
                ? "border-[#78350F] bg-white ring-2 ring-[#78350F]/40 shadow-sm scale-[1.01]"
                : "border-[#D8D4CA] bg-[#FAF8F5] hover:bg-white hover:border-[#78350F]/50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`rounded-2xl p-3 shrink-0 transition ${
                  statusFilter === "pending_routine"
                    ? "bg-[#78350F] text-white"
                    : "bg-[#78350F]/10 text-[#78350F]"
                }`}
              >
                <Clock className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5C605C] uppercase tracking-wider block">
                  Chờ xuất phác đồ
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-serif text-[#78350F] mt-0.5">
                  {pendingCount} <span className="text-xs font-sans font-normal text-[#5C605C]">ca chờ</span>
                </div>
              </div>
            </div>
            {statusFilter === "pending_routine" ? (
              <span className="rounded-full bg-[#78350F]/15 px-2.5 py-1 text-[11px] font-bold text-[#78350F]">
                Đang xem ✓
              </span>
            ) : (
              <span className="text-xs text-[#5C605C] font-medium hidden md:inline">
                Nhấp để xem →
              </span>
            )}
          </button>

          {/* Card 3: Đang áp dụng liệu trình */}
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "in_treatment"}
            aria-controls="cases-list"
            aria-label="Lọc bệnh nhân đang áp dụng liệu trình"
            onClick={() => setStatusFilter("in_treatment")}
            className={`flex items-center justify-between p-5 sm:p-6 rounded-3xl border transition-all text-left cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2D5A43] ${
              statusFilter === "in_treatment"
                ? "border-[#2D5A43] bg-white ring-2 ring-[#2D5A43]/40 shadow-sm scale-[1.01]"
                : "border-[#D8D4CA] bg-[#FAF8F5] hover:bg-white hover:border-[#2D5A43]/50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`rounded-2xl p-3 shrink-0 transition ${
                  statusFilter === "in_treatment"
                    ? "bg-[#2D5A43] text-white"
                    : "bg-[#2D5A43]/10 text-[#2D5A43]"
                }`}
              >
                <Activity className="size-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5C605C] uppercase tracking-wider block">
                  Đang áp dụng liệu trình
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-serif text-[#2D5A43] mt-0.5">
                  {inTreatmentCount} <span className="text-xs font-sans font-normal text-[#5C605C]">bệnh nhân</span>
                </div>
              </div>
            </div>
            {statusFilter === "in_treatment" ? (
              <span className="rounded-full bg-[#2D5A43]/15 px-2.5 py-1 text-[11px] font-bold text-[#2D5A43]">
                Đang xem ✓
              </span>
            ) : (
              <span className="text-xs text-[#5C605C] font-medium hidden md:inline">
                Nhấp để xem →
              </span>
            )}
          </button>
        </div>

        {/* 2. Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-3.5 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5C605C]" />
            <input
              type="text"
              placeholder="Tìm theo tên bệnh nhân, mã hồ sơ bệnh án (BA-2026)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#D8D4CA] bg-white py-2.5 pl-11 pr-4 text-sm text-[#191B19] placeholder:text-[#5C605C]/70 focus:outline-none focus:border-[#2D5A43]"
            />
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5">
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm sm:flex-none">
              <Filter className="size-4 text-[#5C605C] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Lọc theo trạng thái"
                className="min-w-0 w-full bg-transparent pr-2 text-sm font-medium text-[#191B19] focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái ({patientCases.length})</option>
                <option value="pending_routine">Chờ xuất phác đồ ({pendingCount})</option>
                <option value="in_treatment">Đang điều trị ({inTreatmentCount})</option>
                <option value="completed">Hoàn tất liệu trình ({completedCount})</option>
              </select>
            </div>

            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm sm:flex-none">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                aria-label="Lọc theo mức độ"
                className="min-w-0 w-full bg-transparent pr-2 text-sm font-medium text-[#191B19] focus:outline-none cursor-pointer"
              >
                <option value="all">Mức độ: Tất cả</option>
                <option value="severe">Nặng (Bùng phát)</option>
                <option value="moderate">Trung bình</option>
                <option value="mild">Nhẹ</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. DANH SÁCH BỆNH ÁN: MASTER-DETAIL CLINICAL COCKPIT */}
        <div id="cases-list" className="space-y-4">
          {filteredCases.length === 0 ? (
            <div className="rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-12 text-center space-y-3">
              <FileText className="size-10 text-[#5C605C] mx-auto opacity-50" />
              <h4 className="font-bold text-base text-[#191B19]">
                Không tìm thấy bệnh án phù hợp
              </h4>
              <p className="text-xs text-[#5C605C] max-w-sm mx-auto">
                Không có hồ sơ nào thuộc bộ lọc hiện tại. Nhấn vào thẻ &quot;Tổng bệnh án tiếp nhận&quot; để xem lại toàn bộ danh sách.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setSeverityFilter("all");
                  setSearchTerm("");
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-4 py-2 text-xs font-bold text-white hover:bg-[#234835] transition cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (() => {
            const activeSplitCase = filteredCases.find((c) => c.id === activeSplitCaseId) ?? filteredCases[0];
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:items-start">
                {/* LEFT PANE: TRIAGE QUEUE */}
                <div className="lg:col-span-7 space-y-3.5">
                  {filteredCases.map((patientCase) => {
                    const isFocused = activeSplitCase?.id === patientCase.id;
                    const priorityAccent =
                      patientCase.status === "pending_routine"
                        ? "border-l-amber-600"
                        : patientCase.status === "in_treatment"
                        ? "border-l-[#2D5A43]"
                        : "border-l-stone-400";

                    return (
                      <div
                        key={patientCase.id}
                        onClick={() => {
                          setActiveSplitCaseId(patientCase.id);
                          setPhotoZoom(1);
                        }}
                        className={`rounded-3xl border border-l-4 ${priorityAccent} p-5 transition-all cursor-pointer space-y-4 ${
                          isFocused
                            ? "border-[#2D5A43] bg-white shadow-sm ring-1 ring-[#2D5A43]/25"
                            : "border-[#D8D4CA] bg-[#FAF8F5] shadow-xs hover:border-[#2D5A43]/60 hover:bg-white/90"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          {/* Thông tin bệnh nhân */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative size-16 sm:size-[72px] shrink-0 overflow-hidden rounded-2xl border border-[#D8D4CA] bg-neutral-200 shadow-2xs">
                              <PatientPhoto src={patientCase.skinPhotoUrl} name={patientCase.patientName} seed={patientCase.id} className="size-full" />
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <h4 className="font-bold text-base text-[#191B19] truncate leading-tight">
                                  {patientCase.patientName}
                                </h4>
                                <span className="text-xs text-[#5C605C] shrink-0">
                                  ({patientCase.patientAge}t • {patientCase.patientGender})
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-[#5C605C] font-mono">
                                <span className="font-semibold text-[#191B19]">{patientCase.caseCode}</span>
                                <span>•</span>
                                <span>{patientCase.submittedDate}</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {patientCase.status === "completed" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2.5 py-0.5 text-[11px] font-bold text-[#191B19]">
                                    <CheckCircle2 className="size-3 text-[#2D5A43]" />
                                    Hoàn tất liệu trình
                                  </span>
                                ) : patientCase.status === "in_treatment" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2D5A43]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#2D5A43]">
                                    <CheckCircle2 className="size-3" />
                                    Đang điều trị ({patientCase.treatmentDay || "14 ngày"})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#78350F]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#78350F]">
                                    <Clock className="size-3" />
                                    Chờ kê Routine
                                  </span>
                                )}

                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                    patientCase.severity === "severe"
                                      ? "bg-rose-100 text-rose-800"
                                      : patientCase.severity === "moderate"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {patientCase.severity === "severe"
                                    ? "Mức độ: Nặng"
                                    : patientCase.severity === "moderate"
                                    ? "Mức độ: Vừa"
                                    : "Mức độ: Nhẹ"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Thao tác chính cho hồ sơ */}
                          <div
                            className="flex sm:flex-col items-center gap-2 shrink-0 sm:w-[190px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCase(patientCase);
                                setPhotoZoom(1);
                                setIsCaseDetailOpen(true);
                              }}
                              className="h-10 flex items-center justify-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-xs font-semibold text-[#191B19] hover:bg-[#E8E5DE] transition cursor-pointer w-full"
                            >
                              <Eye className="size-3.5" />
                              <span>Xem Bệnh án</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenPrescribeModal(patientCase)}
                              className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-[#2D5A43] px-3.5 text-xs font-bold text-white shadow-xs hover:bg-[#234835] transition cursor-pointer w-full"
                            >
                              <Stethoscope className="size-3.5" />
                              <span>
                                {patientCase.currentRoutine ? "Xuất & Sửa gửi BN" : "Chọn hồ sơ để xuất"}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Triệu chứng & Chỉ số lâm sàng gọn */}
                        <div className="space-y-2">
                          <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#D8D4CA]/80 text-xs sm:text-sm text-[#191B19]">
                            <span className="font-bold text-[#2D5A43] shrink-0 mr-2">Triệu chứng:</span>
                            <span className="text-[#4A4D4A] truncate">{patientCase.symptoms}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 items-center gap-2 rounded-2xl bg-[#FAF8F5] border border-[#D8D4CA]/80 px-3.5 py-2.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#5C605C] shrink-0">Đỏ (PIE):</span>
                              <span className="font-bold text-rose-700 tabular-nums">{patientCase.aiAnalysis.rednessIndex}%</span>
                            </div>
                            <div className="flex items-center gap-1.5 border-l border-[#D8D4CA]/70 pl-2.5">
                              <span className="text-[#5C605C] shrink-0">Điểm da:</span>
                              <span className="font-bold text-[#191B19] tabular-nums">{patientCase.aiAnalysis.skinHealthScore}/100</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:border-l border-[#D8D4CA]/70 sm:pl-2.5">
                              <span className="text-[#5C605C] shrink-0">Mụn viêm:</span>
                              <span className="font-bold text-amber-800 tabular-nums">{patientCase.aiAnalysis.inflammatorySpots} nốt</span>
                            </div>
                            <div className="flex items-center gap-1.5 border-l border-[#D8D4CA]/70 pl-2.5 min-w-0">
                              <span className="text-[#5C605C] shrink-0">Loại da:</span>
                              <span className="font-bold text-[#191B19] truncate">{patientCase.skinType}</span>
                            </div>
                          </div>

                          {patientCase.currentRoutine ? (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#2D5A43]/6 border border-[#2D5A43]/20 px-3.5 py-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Sparkles className="size-3.5 text-[#2D5A43] shrink-0" />
                                <span className="font-bold text-xs text-[#2D5A43] truncate">
                                  {patientCase.currentRoutine.routineTitle}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {patientCase.currentRoutine.products.map((p) => (
                                  <span key={p.id} title={p.name} className="shrink-0">
                                    <SafeProductImage
                                      src={p.imageUrl}
                                      alt={p.name}
                                      brand={p.brand}
                                      category={p.category}
                                      className="size-7 rounded-lg object-cover border border-[#D8D4CA] shadow-2xs"
                                    />
                                  </span>
                                ))}
                                <span className="text-[11px] text-[#5C605C] font-mono ml-1">
                                  Tái khám: <strong>{formatDateVi(patientCase.currentRoutine.revisitDate)}</strong>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#78350F]/6 border border-dashed border-[#78350F]/30 px-3.5 py-2">
                              <div className="flex items-center gap-2 text-xs text-[#78350F] font-semibold truncate">
                                <Clock className="size-3.5 shrink-0" />
                                <span className="truncate">Chưa thiết lập phác đồ (Chờ xuất Routine)</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPrescribeModal(patientCase);
                                }}
                                className="text-xs font-bold text-[#2D5A43] hover:underline shrink-0 cursor-pointer"
                              >
                                + Kê Routine ngay
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT STICKY CLINICAL COCKPIT (DESKTOP SPLIT VIEW) */}
                {activeSplitCase && (
                  <aside
                    aria-label="Khung soi chi tiết ca bệnh đang chọn"
                    className="hidden lg:block lg:col-span-5 lg:sticky lg:top-24 rounded-3xl border border-[#D8D4CA] bg-white p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[#D8D4CA]/70 pb-3">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D5A43] block">
                          Soi nhanh lâm sàng · {activeSplitCase.caseCode}
                        </span>
                        <p className="text-xs text-[#5C605C] truncate">
                          Chọn thẻ bên trái để chuyển nhanh bệnh nhân cần đối soát
                        </p>
                      </div>
                      <span className="rounded-lg border border-[#D8D4CA] bg-[#FAF8F5] px-2.5 py-1 text-[11px] font-bold text-[#191B19] shrink-0">
                        {activeSplitCase.fitzpatrickScale}
                      </span>
                    </div>

                    {/* Ảnh da bệnh nhân kèm nút Zoom 1x / 2x */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5]">
                      <div
                        className={`h-60 w-full transition-transform duration-300 origin-center ${
                          photoZoom === 2 ? "scale-[1.75]" : "scale-100"
                        }`}
                      >
                        <PatientPhoto
                          src={activeSplitCase.skinPhotoUrl}
                          name={activeSplitCase.patientName}
                          seed={activeSplitCase.id}
                          large
                          className="size-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhotoZoom((z) => (z === 1 ? 2 : 1))}
                        className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-xl border border-[#D8D4CA] bg-white/95 backdrop-blur-xs px-2.5 py-1.5 text-[11px] font-bold text-[#191B19] shadow-xs hover:border-[#2D5A43] cursor-pointer"
                      >
                        {photoZoom === 2 ? <ZoomOut className="size-3.5" /> : <ZoomIn className="size-3.5" />}
                        <span>{photoZoom === 2 ? "Thu nhỏ (1x)" : "Phóng to tổn thương (2x)"}</span>
                      </button>
                    </div>

                    {/* Vùng tổn thương & Cảnh báo dị ứng */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[#5C605C] font-semibold mr-1">Vùng AI ghi nhận:</span>
                        {activeSplitCase.aiAnalysis.affectedZones.map((z) => (
                          <span
                            key={z}
                            className="rounded-md border border-[#D8D4CA] bg-[#FAF8F5] px-2 py-0.5 font-semibold text-[#191B19]"
                          >
                            {z}
                          </span>
                        ))}
                      </div>

                      {activeSplitCase.allergies && !["Không", "Không có", "None"].includes(activeSplitCase.allergies.trim()) ? (
                        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-900 font-medium">
                          <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>
                            Tiền sử dị ứng cần lưu ý: <strong>{activeSplitCase.allergies}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-2.5 text-emerald-900">
                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                          <span>Chưa ghi nhận dị ứng hoạt chất</span>
                        </div>
                      )}
                    </div>

                    {/* Biểu đồ thanh PIE & tóm tắt routine Sáng/Tối */}
                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-3.5 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#5C605C]">Mức độ hồng ban (PIE)</span>
                        <strong className="text-rose-700 tabular-nums">{activeSplitCase.aiAnalysis.rednessIndex}%</strong>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E5DE]">
                        <div
                          className="h-full rounded-full bg-rose-600 transition-all duration-300"
                          style={{ width: `${Math.min(100, activeSplitCase.aiAnalysis.rednessIndex)}%` }}
                        />
                      </div>

                      {activeSplitCase.currentRoutine?.products.length ? (
                        <div className="pt-2 border-t border-[#D8D4CA]/70 space-y-1.5">
                          <span className="font-bold text-[#2D5A43] block">
                            Các bước đang áp dụng ({activeSplitCase.currentRoutine.products.length})
                          </span>
                          <div className="space-y-1">
                            {activeSplitCase.currentRoutine.products.slice(0, 3).map((rp) => (
                              <div key={rp.id} className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="truncate font-medium text-[#191B19]">• {rp.name}</span>
                                <span className="inline-flex items-center gap-0.5 shrink-0 text-[#5C605C] font-semibold">
                                  {rp.stepTime === "morning" ? (
                                    <Sun className="size-3 text-amber-600" />
                                  ) : rp.stepTime === "evening" ? (
                                    <Moon className="size-3 text-[#2D5A43]" />
                                  ) : (
                                    <span>AM/PM</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="pt-1 text-[11px] text-[#78350F] font-medium">
                          Bệnh nhân chưa có phác đồ Routine. Nhấn nút bên dưới để mở biểu mẫu kê đơn.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPrescribeModal(activeSplitCase)}
                        className="w-full h-11 rounded-2xl bg-[#191B19] hover:bg-[#2D5A43] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                      >
                        <Stethoscope className="size-4" />
                        <span>Mở trình kê phác đồ cho ca này</span>
                      </button>

                      {activeSplitCase.status !== "pending_routine" && (
                        <button
                          type="button"
                          onClick={() => handleToggleCaseCompletion(activeSplitCase)}
                          disabled={isUpdatingCaseStatus}
                          className="w-full h-10 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] hover:border-[#2D5A43] hover:text-[#2D5A43] text-xs font-semibold text-[#191B19] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>
                            {activeSplitCase.status === "completed"
                              ? "Mở lại trạng thái Đang điều trị"
                              : "Đánh dấu Hoàn tất liệu trình"}
                          </span>
                        </button>
                      )}
                    </div>
                  </aside>
                )}
              </div>
            );
          })()}
        </div>
      </main>

      {/* MODAL: XEM CHI TIẾT BỆNH ÁN */}
      {isCaseDetailOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
              <div>
                <span className="font-mono text-xs text-[#5C605C]">{selectedCase.caseCode}</span>
                <h4 className="text-lg font-bold text-[#191B19]">
                  Bệnh án Da liễu: {selectedCase.patientName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCaseDetailOpen(false)}
                className="text-[#5C605C] hover:text-[#191B19] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="space-y-2.5">
                <div className="relative overflow-hidden rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF]">
                  <div
                    className={`h-56 w-full transition-transform duration-300 origin-center ${
                      photoZoom === 2 ? "scale-[1.75]" : "scale-100"
                    }`}
                  >
                    <PatientPhoto
                      src={selectedCase.skinPhotoUrl}
                      name={selectedCase.patientName}
                      seed={selectedCase.id}
                      large
                      className="w-full h-56"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoZoom((z) => (z === 1 ? 2 : 1))}
                    className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-xl border border-[#D8D4CA] bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#191B19] shadow-xs hover:border-[#2D5A43] cursor-pointer"
                  >
                    {photoZoom === 2 ? <ZoomOut className="size-3.5" /> : <ZoomIn className="size-3.5" />}
                    <span>{photoZoom === 2 ? "1x" : "2x"}</span>
                  </button>
                </div>
                <div className="text-xs text-[#5C605C] bg-[#F6F4EF] p-2.5 rounded-xl">
                  Vùng tổn thương AI phân tích: <strong className="text-[#191B19]">{selectedCase.aiAnalysis.affectedZones.join(", ")}</strong>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-[#D8D4CA] rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center border-b border-[#D8D4CA]/50 pb-2">
                    <span className="text-[#5C605C]">Bệnh nhân:</span>
                    <strong className="text-[#191B19]">{selectedCase.patientName} ({selectedCase.patientAge}t • {selectedCase.patientGender})</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#5C605C]">Số điện thoại:</span>
                    <strong className="font-mono">{selectedCase.phone}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#5C605C]">Loại da & Cơ địa:</span>
                    <strong>{selectedCase.skinType}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#5C605C]">Phân loại Fitzpatrick:</span>
                    <strong className="bg-[#F6F4EF] px-2 py-0.5 rounded-md border border-[#D8D4CA]">{selectedCase.fitzpatrickScale}</strong>
                  </div>
                  <div className="pt-1">
                    {selectedCase.allergies && !["Không", "Không có", "None"].includes(selectedCase.allergies.trim()) ? (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                        <AlertTriangle className="size-4 shrink-0 text-rose-600" />
                        <span>Cảnh báo tiền sử dị ứng: <strong>{selectedCase.allergies}</strong></span>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-800 bg-emerald-50/60 border border-emerald-200/60 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>Chưa ghi nhận tiền sử dị ứng mỹ phẩm</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#F6F4EF] border border-[#D8D4CA] rounded-2xl p-3.5">
                  <span className="font-bold text-[#191B19] block mb-1">Triệu chứng ghi nhận:</span>
                  <p className="text-[#5C605C] leading-relaxed text-xs sm:text-sm">{selectedCase.symptoms}</p>
                </div>

                <div className="flex gap-2.5">
                  <div className="flex-1 bg-white border border-[#D8D4CA] rounded-xl p-2.5 text-center">
                    <span className="text-xs text-[#5C605C] block">Đỏ da PIE</span>
                    <strong className="text-rose-700 text-base">{selectedCase.aiAnalysis.rednessIndex}%</strong>
                  </div>
                  <div className="flex-1 bg-white border border-[#D8D4CA] rounded-xl p-2.5 text-center">
                    <span className="text-xs text-[#5C605C] block">Mụn viêm</span>
                    <strong className="text-amber-800 text-base">{selectedCase.aiAnalysis.inflammatorySpots} nốt</strong>
                  </div>
                  <div className="flex-1 bg-white border border-[#D8D4CA] rounded-xl p-2.5 text-center">
                    <span className="text-xs text-[#5C605C] block">Điểm da</span>
                    <strong className="text-[#2D5A43] text-base">{selectedCase.aiAnalysis.skinHealthScore}/100</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Phác đồ của bệnh nhân này (Của ai hiển thị cái đó, không mẫu, nếu chưa có thì để trống) */}
            <div className="border-t border-[#D8D4CA] pt-4">
              <span className="font-bold text-[#191B19] text-sm block mb-2">Phác đồ điều trị của bệnh nhân:</span>
              {selectedCase.currentRoutine && selectedCase.currentRoutine.products.length > 0 ? (
                <div className="bg-white border border-[#D8D4CA] rounded-2xl p-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-[#2D5A43]">{selectedCase.currentRoutine.routineTitle}</span>
                    <span className="text-[#5C605C]">Thời gian: {selectedCase.currentRoutine.startDate} → Tái khám: {selectedCase.currentRoutine.revisitDate}</span>
                  </div>
                  {selectedCase.currentRoutine.doctorNotes && (
                    <p className="text-xs text-[#5C605C] italic bg-[#FAF8F5] p-2.5 rounded-xl border border-[#D8D4CA]/50">
                      Chỉ định bác sĩ: {selectedCase.currentRoutine.doctorNotes}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {selectedCase.currentRoutine.products.map((p) => (
                      <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] text-xs">
                        <SafeProductImage src={p.imageUrl} alt={p.name} className="size-10 rounded-lg object-cover border border-[#D8D4CA]" />
                        <div className="min-w-0">
                          <span className="font-semibold text-[#191B19] truncate block">{p.name}</span>
                          <span className="text-[11px] text-[#5C605C]">{p.brand} · {p.dosage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#FAF8F5] border border-dashed border-[#D8D4CA] rounded-2xl p-4 text-center text-xs text-[#5C605C]">
                  Bệnh nhân này chưa có phác đồ điều trị (đang để trống, không dùng dữ liệu mẫu). Bác sĩ có thể nhấn nút bên dưới để bắt đầu xuất phác đồ.
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2.5 pt-3 border-t border-[#D8D4CA]">
              <button
                type="button"
                onClick={() => setIsCaseDetailOpen(false)}
                className="rounded-2xl border border-[#D8D4CA] bg-white px-5 py-2.5 text-sm font-semibold text-[#5C605C]"
              >
                Đóng
              </button>
              {selectedCase.status !== "pending_routine" && (
                <button
                  type="button"
                  onClick={() => handleToggleCaseCompletion(selectedCase)}
                  disabled={isUpdatingCaseStatus}
                  className="flex items-center gap-1.5 rounded-2xl border border-[#2D5A43]/35 bg-[#2D5A43]/8 px-4 py-2.5 text-sm font-semibold text-[#2D5A43] hover:bg-[#2D5A43]/15 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  <span>
                    {selectedCase.status === "completed" ? "Mở lại điều trị" : "Hoàn tất liệu trình"}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsCaseDetailOpen(false);
                  handleOpenPrescribeModal(selectedCase);
                }}
                className="flex items-center gap-2 rounded-2xl bg-[#2D5A43] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
              >
                <Stethoscope className="size-4" />
                <span>Chọn hồ sơ này để xuất phác đồ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHỌN HỒ SƠ ĐỂ XUẤT & KÊ PHÁC ĐỒ GỬI BỆNH NHÂN */}
      {isPrescribeModalOpen && prescribeTargetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
              <div>
                <h4 className="text-lg font-bold text-[#191B19]">
                  Xuất hồ sơ & Kê phác đồ gửi Bệnh nhân: {prescribeTargetCase.patientName} ({prescribeTargetCase.caseCode})
                </h4>
                <p className="text-xs text-[#5C605C] mt-0.5">
                  Phác đồ điều trị kèm ảnh sản phẩm thực tế sẽ được gửi trực tiếp về tài khoản người bệnh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrescribeModalOpen(false)}
                className="text-[#5C605C] hover:text-[#191B19] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoutineSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Tên Phác đồ điều trị</label>
                <input
                  type="text"
                  required
                  value={routineTitleInput}
                  onChange={(e) => setRoutineTitleInput(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-sm text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Ngày bắt đầu áp dụng</label>
                  <input
                    type="date"
                    required
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                  />
                </div>
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Ngày hẹn tái khám</label>
                  <input
                    type="date"
                    required
                    value={revisitDateInput}
                    onChange={(e) => setRevisitDateInput(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Lời dặn của Bác sĩ gửi Bệnh nhân</label>
                <input
                  type="text"
                  value={doctorNotesInput}
                  onChange={(e) => setDoctorNotesInput(e.target.value)}
                  placeholder="Lời dặn kiêng cữ hoặc lưu ý thoa kem..."
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-sm text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                />
              </div>

              {/* Product list */}
              <div className="space-y-3 pt-2 border-t border-[#D8D4CA]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#191B19]">
                    Sản phẩm trong Routine ({modalProducts.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProductSource("preset");
                      setIsAddProductOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>+ Thêm sản phẩm có ảnh</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {modalProducts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#D8D4CA] bg-white/60 p-6 text-center space-y-2">
                      <p className="text-sm font-semibold text-[#191B19]">Chưa có sản phẩm nào trong phác đồ</p>
                      <p className="text-xs text-[#5C605C] max-w-md mx-auto leading-relaxed">
                        Hồ sơ này chưa được thiết lập phác đồ (đang để trống, không chèn dữ liệu mẫu). Bác sĩ hãy nhấn nút <strong>&quot;+ Thêm sản phẩm có ảnh&quot;</strong> ở trên để kê đơn sản phẩm phù hợp.
                      </p>
                    </div>
                  ) : (
                    modalProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between gap-3.5 rounded-2xl border border-[#D8D4CA] bg-white p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <SafeProductImage
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="size-14 rounded-xl object-cover border border-[#D8D4CA] shrink-0"
                          />
                          <div className="min-w-0 text-sm">
                            <h6 className="font-bold text-[#191B19] truncate">{prod.name}</h6>
                            <div className="text-xs text-[#5C605C]">
                              {prod.brand} • Liều: {prod.dosage}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(prod.id)}
                          className="text-rose-600 hover:text-rose-800 p-1.5 cursor-pointer shrink-0"
                        >
                          <Trash2 className="size-4.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Cảnh báo tương tác hoạt chất thời gian thực cho Bác sĩ */}
                {modalProducts.length >= 2 && (() => {
                  const rxConflicts = detectActiveConflicts(
                    modalProducts.map((mp) => ({
                      id: mp.id,
                      name: mp.name,
                      specifications: { actives: mp.activeIngredients },
                    })),
                  );
                  if (rxConflicts.length === 0) return null;
                  return (
                    <div className="space-y-1.5 pt-1">
                      {rxConflicts.map((warn) => (
                        <div
                          key={warn.id}
                          className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 flex items-start gap-2"
                        >
                          <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold">{warn.title}</div>
                            <div className="text-[#5C605C] mt-0.5">{warn.advice}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#D8D4CA]">
                <button
                  type="button"
                  onClick={() => setIsPrescribeModalOpen(false)}
                  className="rounded-2xl border border-[#D8D4CA] bg-white px-5 py-2.5 text-sm font-semibold text-[#5C605C]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingRoutine}
                  className="rounded-2xl bg-[#2D5A43] px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#234835] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                  📤 Xuất & Gửi phác đồ về Bệnh nhân
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: CHỌN SẢN PHẨM CÓ ẢNH */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
              <h5 className="font-bold text-[#191B19] text-base">
                Chọn Sản phẩm (Có ảnh chụp thực tế)
              </h5>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="text-[#5C605C] hover:text-[#191B19] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] p-1 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setProductSource("preset")}
                className={`flex-1 py-2 rounded-lg font-bold cursor-pointer ${
                  productSource === "preset" ? "bg-[#2D5A43] text-white" : "text-[#5C605C]"
                }`}
              >
                Mỹ phẩm có sẵn ảnh đẹp
              </button>
              <button
                type="button"
                onClick={() => setProductSource("custom")}
                className={`flex-1 py-2 rounded-lg font-bold cursor-pointer ${
                  productSource === "custom" ? "bg-[#2D5A43] text-white" : "text-[#5C605C]"
                }`}
              >
                Tự nhập & dán link ảnh
              </button>
            </div>

            {productSource === "preset" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {presetCatalog.map((prod, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPresetIndex(idx)}
                    className={`flex items-center gap-3 rounded-2xl border p-2.5 transition cursor-pointer ${
                      selectedPresetIndex === idx
                        ? "border-[#2D5A43] bg-[#2D5A43]/10 ring-1 ring-[#2D5A43]"
                        : "border-[#D8D4CA] bg-white hover:border-[#2D5A43]/50"
                    }`}
                  >
                    <SafeProductImage
                      src={prod.imageUrl}
                      alt={prod.name}
                      brand={prod.brand}
                      category={prod.category}
                      className="size-16 rounded-xl object-cover border border-[#D8D4CA] shrink-0"
                    />
                    <div className="min-w-0 text-sm">
                      <div className="font-bold text-[#191B19] truncate">{prod.name}</div>
                      <div className="text-xs text-[#78350F] font-semibold">{prod.brand}</div>
                      <div className="text-xs text-[#5C605C] truncate">{prod.dosage}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Tên sản phẩm</label>
                  <input
                    type="text"
                    required
                    value={customProdName}
                    onChange={(e) => setCustomProdName(e.target.value)}
                    placeholder="Tên sản phẩm..."
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm text-[#191B19]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Hãng</label>
                    <input
                      type="text"
                      value={customProdBrand}
                      onChange={(e) => setCustomProdBrand(e.target.value)}
                      placeholder="Thương hiệu..."
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm text-[#191B19]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Thời điểm thoa</label>
                    <select
                      value={customProdTime}
                      onChange={(e) => setCustomProdTime(e.target.value as "morning" | "evening" | "both")}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm text-[#191B19]"
                    >
                      <option value="both">Cả Sáng & Tối</option>
                      <option value="morning">Chỉ Sáng ☀️</option>
                      <option value="evening">Chỉ Tối 🌙</option>
                    </select>
                  </div>
                </div>
                <div>
                  <ImageUploader
                    onUploadingChange={setUploadingImage}
                    images={customProdImage ? [customProdImage] : []}
                    onChange={(next) => setCustomProdImage(next[0] ?? "")}
                    folder="products"
                    label="Ảnh sản phẩm (không bắt buộc)"
                    emptyHint="Không có ảnh: ứng dụng tự vẽ hình sản phẩm."
                  />
                  <div className="mt-2 flex items-center gap-2.5 text-xs text-[#5C605C]">
                    <span>Xem trước:</span>
                    <SafeProductImage
                      src={customProdImage}
                      alt="Xem trước"
                      name={customProdName || "Sản phẩm"}
                      brand={customProdBrand}
                      category={customProdCategory}
                      className="size-10 shrink-0 rounded-xl object-cover border border-[#D8D4CA]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Liều lượng</label>
                    <input
                      type="text"
                      value={customProdDosage}
                      onChange={(e) => setCustomProdDosage(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm text-[#191B19]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Cách dùng</label>
                    <input
                      type="text"
                      value={customProdUsage}
                      onChange={(e) => setCustomProdUsage(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm text-[#191B19]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#D8D4CA]">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="rounded-2xl border border-[#D8D4CA] bg-white px-4 py-2 text-sm font-semibold text-[#5C605C]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddProductConfirm}
                disabled={uploadingImage}
                className="rounded-2xl bg-[#2D5A43] px-5 py-2 text-sm font-bold text-white cursor-pointer"
              >
                Thêm vào Routine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SpecialistPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#E8E5DE] text-sm font-medium text-[#5C605C]">
          Đang tải phân hệ Bác sĩ Da liễu...
        </div>
      }
    >
      <SpecialistContent />
    </Suspense>
  );
}
