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
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";

export type CaseStatus = "pending_routine" | "in_treatment" | "completed";
export type SeverityLevel = "mild" | "moderate" | "severe";

export interface RoutineProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
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
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Ceramides 1, 3, 6-II, Hyaluronic Acid",
    stepTime: "both",
    dosage: "1 pump vừa đủ",
    usageGuide: "Massage nhẹ nhàng với nước ấm 60 giây, thấm khô bằng khăn mềm.",
  },
  {
    name: "Kem giảm mụn La Roche-Posay Effaclar Duo+M",
    brand: "La Roche-Posay",
    category: "Trị mụn & Ngừa thâm",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Phylobioma, Niacinamide, Salicylic Acid, Zinc PCA",
    stepTime: "evening",
    dosage: "1 lượng bằng hạt đậu xanh",
    usageGuide: "Thoa mỏng toàn mặt sau bước serum, vỗ nhẹ cho dưỡng chất thẩm thấu.",
  },
  {
    name: "Serum phục hồi & cấp nước La Roche-Posay Hyalu B5",
    brand: "La Roche-Posay",
    category: "Tinh chất phục hồi",
    imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Vitamin B5 (Panthenol 5%), Hyaluronic Acid, Madecassoside",
    stepTime: "both",
    dosage: "3 giọt tinh chất",
    usageGuide: "Thoa đều khi da còn ẩm, vỗ nhẹ 30 giây trước khi thoa kem dưỡng ẩm.",
  },
  {
    name: "Kem chống nắng kiềm dầu La Roche-Posay Anthelios UVMune 400",
    brand: "La Roche-Posay",
    category: "Chống nắng y khoa",
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Mexoryl 400, Airlicium, SPF50+ PA++++",
    stepTime: "morning",
    dosage: "2 đốt ngón tay trỏ",
    usageGuide: "Thoa đều toàn bộ khuôn mặt và cổ mỗi sáng trước khi ra ngoài 20 phút.",
  },
  {
    name: "Kem dưỡng ẩm làm dịu A-Derma Dermalibour+ CICA",
    brand: "A-Derma",
    category: "Phục hồi màng bảo vệ",
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Mạ yến mạch Rhealba, Đồng Sulfate & Kẽm Sulfate",
    stepTime: "both",
    dosage: "1 lượng bằng hạt bắp",
    usageGuide: "Thoa lớp mỏng lên vùng da đỏ rát hoặc kích ứng 2 lần/ngày sáng và tối.",
  },
  {
    name: "Nước tẩy trang dịu nhẹ Bioderma Sensibio H2O",
    brand: "Bioderma Laboratoire",
    category: "Làm sạch micellar",
    imageUrl: "https://images.unsplash.com/photo-1556228722-d0b77e8a93a0?w=400&auto=format&fit=crop&q=80",
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
    skinPhotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
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
          imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
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
          imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&auto=format&fit=crop&q=80",
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
          imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
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
          imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
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
    skinPhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
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
    skinPhotoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
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
          imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
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
          imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
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
    skinPhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
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
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>({
    name: "BS. CKI Nguyễn Mai Hoa",
    title: "Bác sĩ Chuyên khoa Da liễu & Thẩm mỹ Da",
    hospital: "Bệnh viện Da Liễu Trung Ương",
    licenseNumber: "CCHN-008812/BYT",
    experienceYears: 8,
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    bio: "Chuyên sâu điều trị mụn trứng cá viêm nặng, phục hồi hàng rào bảo vệ da sau treatment kích ứng.",
    email: "bacsi.hoa@skinsense.vn",
  });

  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          if (data.user.role === "doctor_pending") {
            setIsPending(true);
          }
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
  }, []);

  const [patientCases, setPatientCases] = useState<PatientCase[]>(INITIAL_PATIENT_CASES);
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false);

  const refreshCases = () => {
    fetch("/api/specialist/cases")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.cases) && json.cases.length > 0) {
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
  const [customProdImage, setCustomProdImage] = useState(
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
  );
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
      setRevisitDateInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      setDoctorNotesInput("Tuân thủ đúng thứ tự bước thoa sáng và tối. Liên hệ bác sĩ nếu có dấu hiệu rát đỏ bất thường.");
      setModalProducts([
        { id: `prod_${Date.now()}_1`, ...PRESET_PRODUCTS[0], stepNumber: 1 },
        { id: `prod_${Date.now()}_2`, ...PRESET_PRODUCTS[1], stepNumber: 2 },
      ]);
    }
    setIsPrescribeModalOpen(true);
  }

  function handleAddProductConfirm() {
    let newProd: RoutineProduct;

    if (productSource === "preset") {
      const preset = PRESET_PRODUCTS[selectedPresetIndex];
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
      if (!customProdImage.trim()) {
        toast.error("Vui lòng cung cấp link ảnh sản phẩm!");
        return;
      }
      newProd = {
        id: `prod_${Date.now()}`,
        name: customProdName.trim(),
        brand: customProdBrand.trim() || "Dược mỹ phẩm",
        category: customProdCategory,
        imageUrl: customProdImage.trim(),
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

  function handleSaveRoutineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prescribeTargetCase) return;

    if (modalProducts.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm kèm ảnh vào phác đồ!");
      return;
    }

    const updatedRoutine = {
      routineTitle: routineTitleInput.trim() || `Phác đồ điều trị ${prescribeTargetCase.patientName}`,
      startDate: startDateInput,
      revisitDate: revisitDateInput,
      doctorNotes: doctorNotesInput.trim(),
      products: modalProducts,
    };

    setPatientCases((prev) =>
      prev.map((c) =>
        c.id === prescribeTargetCase.id
          ? { ...c, status: "in_treatment", currentRoutine: updatedRoutine }
          : c,
      ),
    );

    setIsPrescribeModalOpen(false);
    toast.success(`Đã xuất và gửi phác đồ Routine thành công cho bệnh nhân ${prescribeTargetCase.patientName}!`);

    // Persist to Supabase Postgres & Storage
    fetch("/api/specialist/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: prescribeTargetCase.id,
        caseId: prescribeTargetCase.id,
        routineTitle: updatedRoutine.routineTitle,
        doctorNotes: updatedRoutine.doctorNotes,
        revisitDate: updatedRoutine.revisitDate,
        products: modalProducts,
      }),
    }).catch(() => {});
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
              <span>{doctorProfile.name}</span>
              <span className="opacity-75">({doctorProfile.licenseNumber})</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3.5 py-2 text-xs font-semibold text-[#5C605C] transition hover:text-[#191B19]"
              title="Về trang soi da (Hôm nay)"
            >
              <Home className="size-4" />
              <span>Trang chủ (Soi da)</span>
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

        {/* 1. THỐNG KÊ HÀNG NGANG */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-4 px-2">
            <div className="rounded-2xl bg-[#2D5A43]/10 p-3 text-[#2D5A43] shrink-0">
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

          <div className="flex items-center gap-4 px-2 border-t sm:border-t-0 sm:border-l border-[#D8D4CA]/70 pt-3 sm:pt-0">
            <div className="rounded-2xl bg-[#78350F]/10 p-3 text-[#78350F] shrink-0">
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

          <div className="flex items-center gap-4 px-2 border-t sm:border-t-0 sm:border-l border-[#D8D4CA]/70 pt-3 sm:pt-0">
            <div className="rounded-2xl bg-[#2D5A43]/10 p-3 text-[#2D5A43] shrink-0">
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

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm">
              <Filter className="size-4 text-[#5C605C]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-[#191B19] focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái ({patientCases.length})</option>
                <option value="pending_routine">Chờ xuất phác đồ</option>
                <option value="in_treatment">Đang điều trị</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-[#191B19] focus:outline-none cursor-pointer"
              >
                <option value="all">Mức độ: Tất cả</option>
                <option value="severe">Nặng (Bùng phát)</option>
                <option value="moderate">Trung bình</option>
                <option value="mild">Nhẹ</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. DANH SÁCH BỆNH ÁN: CHỌN HỒ SƠ ĐỂ XUẤT */}
        <div className="space-y-4">
          {filteredCases.map((patientCase) => (
            <div
              key={patientCase.id}
              className="rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-xs hover:border-[#2D5A43]/60 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-6 min-h-[224px]"
            >
              {/* Cột 1: Thông tin bệnh nhân */}
              <div className="flex items-center gap-4 w-full xl:w-[290px] shrink-0">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#D8D4CA] bg-neutral-200 shadow-2xs">
                  <img
                    src={patientCase.skinPhotoUrl}
                    alt={patientCase.patientName}
                    className="size-full object-cover"
                  />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base sm:text-lg text-[#191B19] truncate leading-tight">
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

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {patientCase.status === "in_treatment" ? (
                      <span className="rounded-full bg-[#2D5A43]/15 px-3 py-0.5 text-xs font-bold text-[#2D5A43]">
                        ● Đang điều trị ({patientCase.treatmentDay || "14 ngày"})
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#78350F]/15 px-3 py-0.5 text-xs font-bold text-[#78350F]">
                        ⏳ Chờ kê Routine
                      </span>
                    )}

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
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

              {/* Cột 2: Triệu chứng & Chỉ số lâm sàng & Phác đồ Routine */}
              <div className="flex-1 min-w-0 space-y-2.5 flex flex-col justify-between">
                {/* Hàng 1: Triệu chứng */}
                <div className="h-11 flex items-center px-4 rounded-2xl bg-white/80 border border-[#D8D4CA] text-sm text-[#191B19]">
                  <span className="font-bold text-[#2D5A43] shrink-0 mr-2">Triệu chứng:</span>
                  <span className="text-[#4A4D4A] truncate">{patientCase.symptoms}</span>
                </div>

                {/* Hàng 2: Thanh chỉ số lâm sàng */}
                <div className="h-12 grid grid-cols-2 sm:grid-cols-4 items-center gap-3 rounded-2xl bg-white border border-[#D8D4CA] px-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#5C605C] font-medium shrink-0">Đỏ (PIE):</span>
                    <span className="font-bold text-rose-700">{patientCase.aiAnalysis.rednessIndex}%</span>
                    <div className="w-12 h-2 rounded-full bg-neutral-200 overflow-hidden hidden md:block shrink-0">
                      <div
                        className="h-full bg-rose-600 rounded-full"
                        style={{ width: `${patientCase.aiAnalysis.rednessIndex}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-[#D8D4CA]/60 pl-3">
                    <span className="text-[#5C605C] font-medium shrink-0">Điểm da:</span>
                    <span className="font-bold text-[#191B19]">
                      {patientCase.aiAnalysis.skinHealthScore}/100
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-[#D8D4CA]/60 pl-3">
                    <span className="text-[#5C605C] font-medium shrink-0">Mụn viêm:</span>
                    <span className="font-bold text-amber-800">
                      {patientCase.aiAnalysis.inflammatorySpots} nốt
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-[#D8D4CA]/60 pl-3 min-w-0">
                    <span className="text-[#5C605C] font-medium shrink-0">Loại da:</span>
                    <span className="font-bold text-[#191B19] truncate">
                      {patientCase.skinType}
                    </span>
                  </div>
                </div>

                {/* Hàng 3: Phác đồ Routine */}
                {patientCase.currentRoutine ? (
                  <div className="h-[52px] flex items-center justify-between gap-3 rounded-2xl bg-[#2D5A43]/5 border border-[#2D5A43]/20 px-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sparkles className="size-4 text-[#2D5A43] shrink-0" />
                      <span className="font-bold text-xs sm:text-sm text-[#2D5A43] truncate">
                        {patientCase.currentRoutine.routineTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {patientCase.currentRoutine.products.map((p) => (
                        <img
                          key={p.id}
                          src={p.imageUrl}
                          alt={p.name}
                          title={p.name}
                          className="size-8 rounded-lg object-cover border border-[#D8D4CA] shadow-2xs"
                        />
                      ))}
                      <span className="text-xs text-[#5C605C] font-mono ml-1">
                        Tái khám: <strong>{formatDateVi(patientCase.currentRoutine.revisitDate)}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[52px] flex items-center justify-between gap-3 rounded-2xl bg-[#78350F]/5 border border-dashed border-[#78350F]/30 px-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[#78350F] font-semibold truncate">
                      <Clock className="size-4 shrink-0" />
                      <span>Chưa thiết lập phác đồ (Đang chờ Bác sĩ chọn hồ sơ xuất Routine)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenPrescribeModal(patientCase)}
                      className="text-xs font-bold text-[#2D5A43] hover:underline shrink-0 cursor-pointer"
                    >
                      + Kê Routine ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Cột 3: Nút thao tác: Xem Bệnh án & Chọn hồ sơ để xuất gửi bệnh nhân */}
              <div className="flex sm:flex-row xl:flex-col items-center justify-center gap-2.5 shrink-0 w-full xl:w-[220px]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCase(patientCase);
                    setIsCaseDetailOpen(true);
                  }}
                  className="h-11 flex items-center justify-center gap-2 rounded-2xl border border-[#D8D4CA] bg-white px-4 text-sm font-semibold text-[#191B19] hover:bg-[#E8E5DE] transition cursor-pointer w-full"
                >
                  <Eye className="size-4" />
                  <span>Xem Bệnh án</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrescribeModal(patientCase)}
                  className="h-11 flex items-center justify-center gap-2 rounded-2xl bg-[#2D5A43] px-4 text-sm font-bold text-white shadow-xs hover:bg-[#234835] transition cursor-pointer w-full"
                >
                  <Stethoscope className="size-4" />
                  <span>
                    {patientCase.currentRoutine ? "Xuất & Sửa gửi BN" : "Chọn hồ sơ để xuất"}
                  </span>
                </button>
              </div>
            </div>
          ))}
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
                <img
                  src={selectedCase.skinPhotoUrl}
                  alt={selectedCase.patientName}
                  className="w-full h-56 rounded-2xl object-cover border border-[#D8D4CA]"
                />
                <div className="text-xs text-[#5C605C] bg-[#F6F4EF] p-2.5 rounded-xl">
                  Vùng tổn thương AI phân tích: <strong className="text-[#191B19]">{selectedCase.aiAnalysis.affectedZones.join(", ")}</strong>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-[#D8D4CA] rounded-2xl p-4 space-y-1.5">
                  <div>Bệnh nhân: <strong>{selectedCase.patientName}</strong> ({selectedCase.patientAge}t • {selectedCase.patientGender})</div>
                  <div>SĐT: <strong>{selectedCase.phone}</strong></div>
                  <div>Loại da: <strong>{selectedCase.skinType}</strong></div>
                  <div>Phân loại Fitzpatrick: <strong>{selectedCase.fitzpatrickScale}</strong></div>
                  <div>Dị ứng: <strong className="text-rose-700">{selectedCase.allergies}</strong></div>
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

            <div className="flex justify-end gap-3 pt-3 border-t border-[#D8D4CA]">
              <button
                type="button"
                onClick={() => setIsCaseDetailOpen(false)}
                className="rounded-2xl border border-[#D8D4CA] bg-white px-5 py-2.5 text-sm font-semibold text-[#5C605C]"
              >
                Đóng
              </button>
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
                  {modalProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between gap-3.5 rounded-2xl border border-[#D8D4CA] bg-white p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
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
                  ))}
                </div>
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
                  className="rounded-2xl bg-[#2D5A43] px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
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
                {PRESET_PRODUCTS.map((prod, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPresetIndex(idx)}
                    className={`flex items-center gap-3 rounded-2xl border p-2.5 transition cursor-pointer ${
                      selectedPresetIndex === idx
                        ? "border-[#2D5A43] bg-[#2D5A43]/10 ring-1 ring-[#2D5A43]"
                        : "border-[#D8D4CA] bg-white hover:border-[#2D5A43]/50"
                    }`}
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
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
                  <label className="block text-[#191B19] font-semibold mb-1">Link ảnh (URL) *</label>
                  <div className="flex gap-2.5">
                    <input
                      type="url"
                      required
                      value={customProdImage}
                      onChange={(e) => setCustomProdImage(e.target.value)}
                      className="flex-1 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-sm text-[#191B19]"
                    />
                    {customProdImage && (
                      <img
                        src={customProdImage}
                        alt="Preview"
                        className="size-10 rounded-xl object-cover border border-[#D8D4CA]"
                      />
                    )}
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
