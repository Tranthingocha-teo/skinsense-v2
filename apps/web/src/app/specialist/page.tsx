"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Stethoscope,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Award,
  Phone,
  Mail,
  MapPin,
  Eye,
  Activity,
  Check,
  Search,
  Filter,
  User,
  X,
  Image as ImageIcon,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";

// Types
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
  skinType: string;
  submittedDate: string;
  severity: SeverityLevel;
  status: CaseStatus;
  symptoms: string;
  allergies: string;
  skinPhotoUrl: string;
  aiAnalysis: {
    skinHealthScore: number;
    rednessIndex: number;
    inflammatorySpots: number;
    comedoneSpots: number;
    affectedZones: string[];
  };
  currentRoutine?: {
    routineTitle: string;
    startDate: string;
    revisitDate: string;
    doctorNotes: string;
    products: RoutineProduct[];
  };
}

export interface DoctorProfile {
  name: string;
  title: string;
  licenseNumber: string;
  hospital: string;
  experienceYears: number;
  avatarUrl: string;
  bio: string;
  education: string[];
  certifications: string[];
  consultationHours: string;
  phone: string;
  zalo: string;
  email: string;
  clinicAddress: string;
  stats: {
    patientsTreated: number;
    successRate: number;
    routinesPrescribed: number;
    rating: number;
  };
}

// Preset verified cosmetic products with tested 200-OK working photos
export const PRESET_PRODUCTS: Omit<RoutineProduct, "id" | "stepNumber">[] = [
  {
    name: "Sữa rửa mặt CeraVe Hydrating Cleanser",
    brand: "CeraVe",
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
    usageGuide: "Thoa mỏng toàn mặt sau bước làm sạch và serum, vỗ nhẹ cho thấm.",
  },
  {
    name: "Serum phục hồi & cấp nước La Roche-Posay Hyalu B5",
    brand: "La Roche-Posay",
    category: "Tinh chất phục hồi",
    imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Vitamin B5 (Panthenol 5%), Hyaluronic Acid, Madecassoside",
    stepTime: "both",
    dosage: "3 giọt tinh chất",
    usageGuide: "Thoa đều khi da còn hơi ẩm, vỗ nhẹ 30 giây trước khi bôi kem dưỡng.",
  },
  {
    name: "Kem chống nắng kiềm dầu La Roche-Posay Anthelios UVMune 400",
    brand: "La Roche-Posay",
    category: "Chống nắng y khoa",
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Mexoryl 400, Airlicium, SPF50+ PA++++",
    stepTime: "morning",
    dosage: "2 đốt ngón tay trỏ",
    usageGuide: "Thoa đều mặt và cổ mỗi sáng trước khi ra ngoài 20 phút.",
  },
  {
    name: "Kem dưỡng ẩm làm dịu A-Derma Dermalibour+ CICA",
    brand: "A-Derma",
    category: "Phục hồi màng bảo vệ",
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Mạ yến mạch Rhealba, Đồng Sulfate & Kẽm Sulfate",
    stepTime: "both",
    dosage: "1 lượng bằng hạt bắp",
    usageGuide: "Thoa lớp mỏng lên vùng da đỏ rát hoặc kích ứng 2 lần/ngày.",
  },
  {
    name: "Nước tẩy trang dịu nhẹ Bioderma Sensibio H2O",
    brand: "Bioderma",
    category: "Tẩy trang nhạy cảm",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Micelles sinh học, D.A.F Complex, Chiết xuất dưa leo",
    stepTime: "evening",
    dosage: "Thấm ướt 2 miếng cotton",
    usageGuide: "Lau nhẹ khắp mặt theo chiều nâng cơ, không cần chà xát mạnh.",
  },
  {
    name: "Serum kiềm dầu The Ordinary Niacinamide 10% + Zinc 1%",
    brand: "The Ordinary",
    category: "Kiềm dầu & Thu nhỏ chân lông",
    imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Niacinamide 10%, Zinc PCA 1%",
    stepTime: "morning",
    dosage: "2 giọt",
    usageGuide: "Thoa vùng chữ T và cánh mũi trước bước kem dưỡng ẩm.",
  },
  {
    name: "Gel chấm mụn viêm Klenzit-C",
    brand: "Glenmark",
    category: "Đặc trị mụn viêm",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Adapalene 0.1%, Clindamycin 1%",
    stepTime: "evening",
    dosage: "Chấm điểm từng nốt mụn",
    usageGuide: "Dùng tăm bông chấm trực tiếp lên nốt mụn viêm sưng vào buổi tối.",
  },
];

// Realistic Doctor profile
const INITIAL_DOCTOR_PROFILE: DoctorProfile = {
  name: "BS. CKI Nguyễn Mai Hoa",
  title: "Bác sĩ Chuyên khoa I Da liễu - Thẩm mỹ Da",
  licenseNumber: "014289/BYT-CCHN",
  hospital: "Bệnh viện Da liễu Trung ương",
  experienceYears: 12,
  avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
  bio: "Chuyên khoa 1 Da liễu ĐH Y Hà Nội với 12 năm kinh nghiệm lâm sàng điều trị mụn trứng cá, phục hồi da nhiễm corticoid và phác đồ dược mỹ phẩm chuẩn y khoa.",
  education: [
    "Thủ khoa Bác sĩ Đa khoa - ĐH Y Dược TP.HCM",
    "Bác sĩ Chuyên khoa I Da liễu - ĐH Y Hà Nội",
    "Tu nghiệp Da liễu Thẩm mỹ - Seoul National University Hospital",
  ],
  certifications: [
    "Chứng chỉ Hành nghề Y khoa số 014289/BYT-CCHN (Bộ Y tế cấp)",
    "Chứng chỉ Ứng dụng Laser & Thiết bị năng lượng trong Da liễu (BV Da liễu TW)",
  ],
  consultationHours: "Thứ 2 - Thứ 7: 08:30 - 20:30",
  phone: "024 3828 9999",
  zalo: "0912 345 678",
  email: "bacsi.hoa@skinsense.vn",
  clinicAddress: "Tầng 3, Trung tâm Y khoa SkinSense Clinic, Hà Nội",
  stats: {
    patientsTreated: 1450,
    successRate: 99.4,
    routinesPrescribed: 4280,
    rating: 4.98,
  },
};

// Patient Cases with concise symptoms
const INITIAL_PATIENT_CASES: PatientCase[] = [
  {
    id: "case_001",
    caseCode: "BA-2026-0914",
    patientName: "Trần Thị Ngọc Hà",
    patientAge: 21,
    patientGender: "Nữ",
    phone: "0905 123 456",
    skinType: "Hỗn hợp thiên dầu, nhạy cảm",
    submittedDate: "14/11/2026",
    severity: "severe",
    status: "in_treatment",
    symptoms: "Mụn bọc viêm đỏ má & cằm sau khi thử cushion mới, da châm chích rát nhẹ.",
    allergies: "Dị ứng hương liệu & cồn khô",
    skinPhotoUrl: "/demo-photos/portrait.jpg",
    aiAnalysis: {
      skinHealthScore: 42,
      rednessIndex: 74,
      inflammatorySpots: 18,
      comedoneSpots: 24,
      affectedZones: ["Má trái", "Má phải", "Cằm"],
    },
    currentRoutine: {
      routineTitle: "Phác đồ Cấp cứu Hàng rào Bảo vệ Da & Giảm Viêm (14 ngày)",
      startDate: "15/11/2026",
      revisitDate: "29/11/2026",
      doctorNotes: "Tạm ngưng makeup trong 14 ngày. Uống đủ 2L nước, tránh thức khuya.",
      products: [
        {
          id: "rp_01",
          name: "Sữa rửa mặt CeraVe Hydrating Cleanser",
          brand: "CeraVe",
          category: "Làm sạch dịu nhẹ",
          imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Ceramides, Hyaluronic Acid",
          stepTime: "both",
          stepNumber: 1,
          dosage: "1 pump",
          usageGuide: "Rửa nhẹ với nước ấm, thấm khô bằng khăn mềm.",
        },
        {
          id: "rp_02",
          name: "Serum phục hồi & cấp nước La Roche-Posay Hyalu B5",
          brand: "La Roche-Posay",
          category: "Phục hồi cấp ẩm",
          imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Vitamin B5 (Panthenol 5%), Madecassoside",
          stepTime: "both",
          stepNumber: 2,
          dosage: "3 giọt",
          usageGuide: "Vỗ nhẹ khi da còn hơi ẩm để giữ nước tối đa.",
        },
        {
          id: "rp_03",
          name: "Kem dưỡng ẩm làm dịu A-Derma Dermalibour+ CICA",
          brand: "A-Derma",
          category: "Khóa ẩm & Kháng viêm",
          imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Yến mạch Rhealba, Đồng & Kẽm Sulfate",
          stepTime: "both",
          stepNumber: 3,
          dosage: "1 hạt đậu",
          usageGuide: "Thoa lớp mỏng đều khắp mặt, tập trung vùng má đỏ.",
        },
        {
          id: "rp_04",
          name: "Kem chống nắng kiềm dầu La Roche-Posay Anthelios UVMune 400",
          brand: "La Roche-Posay",
          category: "Chống nắng quang phổ rộng",
          imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Mexoryl 400, SPF50+ PA++++",
          stepTime: "morning",
          stepNumber: 4,
          dosage: "2 đốt ngón tay",
          usageGuide: "Thoa mỗi sáng trước khi ra ngoài 20 phút.",
        },
      ],
    },
  },
  {
    id: "case_002",
    caseCode: "BA-2026-1022",
    patientName: "Lê Hoàng Nam",
    patientAge: 25,
    patientGender: "Nam",
    phone: "0912 345 678",
    skinType: "Da dầu mụn, bít tắc chân lông",
    submittedDate: "12/11/2026",
    severity: "moderate",
    status: "pending_routine",
    symptoms: "Tiết dầu nhiều vùng T, bít tắc lỗ chân lông, nhiều sợi bã nhờn & mụn đầu đen.",
    allergies: "Chưa ghi nhận dị ứng",
    skinPhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    aiAnalysis: {
      skinHealthScore: 56,
      rednessIndex: 48,
      inflammatorySpots: 8,
      comedoneSpots: 32,
      affectedZones: ["Trán", "Cánh mũi", "Cằm"],
    },
  },
  {
    id: "case_003",
    caseCode: "BA-2026-1105",
    patientName: "Vũ Thu Trang",
    patientAge: 28,
    patientGender: "Nữ",
    phone: "0934 567 890",
    skinType: "Da mỏng yếu, lộ mao mạch",
    submittedDate: "10/11/2026",
    severity: "severe",
    status: "in_treatment",
    symptoms: "Da bỏng rát sau khi tự peel BHA 30% tại nhà, rát đỏ, lộ mao mạch.",
    allergies: "Dị ứng Retinol & dẫn xuất Vit A",
    skinPhotoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    aiAnalysis: {
      skinHealthScore: 28,
      rednessIndex: 88,
      inflammatorySpots: 12,
      comedoneSpots: 6,
      affectedZones: ["Má trái", "Má phải", "Cánh mũi"],
    },
    currentRoutine: {
      routineTitle: "Phác đồ Cấp cứu Phục hồi Biểu bì & Hạ nhiệt (7 ngày)",
      startDate: "11/11/2026",
      revisitDate: "18/11/2026",
      doctorNotes: "Chỉ rửa mặt bằng nước muối sinh lý 0.9%. Thoa kem A-Derma ngày 3 lần.",
      products: [
        {
          id: "rp_05",
          name: "Kem dưỡng ẩm làm dịu A-Derma Dermalibour+ CICA",
          brand: "A-Derma",
          category: "Phục hồi cấp cứu",
          imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Đồng & Kẽm Sulfate, Yến mạch Rhealba",
          stepTime: "both",
          stepNumber: 1,
          dosage: "Thoa lớp dày vừa đủ",
          usageGuide: "Bôi ngày 3 lần sau khi chườm mát với nước muối sinh lý.",
        },
      ],
    },
  },
  {
    id: "case_004",
    caseCode: "BA-2026-1110",
    patientName: "Phạm Minh Châu",
    patientAge: 19,
    patientGender: "Nữ",
    phone: "0978 999 222",
    skinType: "Da hỗn hợp, mụn dậy thì",
    submittedDate: "13/11/2026",
    severity: "mild",
    status: "pending_routine",
    symptoms: "Mụn cám li ti ở trán và cằm trước chu kỳ, vết thâm đỏ mờ chậm.",
    allergies: "Không có dị ứng đặc biệt",
    skinPhotoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    aiAnalysis: {
      skinHealthScore: 68,
      rednessIndex: 38,
      inflammatorySpots: 5,
      comedoneSpots: 14,
      affectedZones: ["Trán", "Cằm"],
    },
  },
];

export default function SpecialistPage() {
  const [activeTab, setActiveTab] = useState<"records" | "routines" | "profile" | "patient_view">("records");
  const [viewMode, setViewMode] = useState<"doctor" | "patient">("doctor");

  // Doctor state
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>(INITIAL_DOCTOR_PROFILE);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(INITIAL_DOCTOR_PROFILE.name);
  const [editTitle, setEditTitle] = useState(INITIAL_DOCTOR_PROFILE.title);
  const [editHospital, setEditHospital] = useState(INITIAL_DOCTOR_PROFILE.hospital);
  const [editBio, setEditBio] = useState(INITIAL_DOCTOR_PROFILE.bio);
  const [editPhone, setEditPhone] = useState(INITIAL_DOCTOR_PROFILE.phone);
  const [editZalo, setEditZalo] = useState(INITIAL_DOCTOR_PROFILE.zalo);
  const [editHours, setEditHours] = useState(INITIAL_DOCTOR_PROFILE.consultationHours);
  const [editAvatar, setEditAvatar] = useState(INITIAL_DOCTOR_PROFILE.avatarUrl);

  // Patient Cases state
  const [patientCases, setPatientCases] = useState<PatientCase[]>(INITIAL_PATIENT_CASES);
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false);

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Routine prescription modal state
  const [isPrescribeModalOpen, setIsPrescribeModalOpen] = useState(false);
  const [prescribeTargetCase, setPrescribeTargetCase] = useState<PatientCase | null>(null);
  const [routineTitleInput, setRoutineTitleInput] = useState("");
  const [startDateInput, setStartDateInput] = useState(new Date().toISOString().split("T")[0]);
  const [revisitDateInput, setRevisitDateInput] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [doctorNotesInput, setDoctorNotesInput] = useState("");
  const [modalProducts, setModalProducts] = useState<RoutineProduct[]>([]);

  // Add Product Sub-modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productSource, setProductSource] = useState<"preset" | "custom">("preset");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customProdName, setCustomProdName] = useState("");
  const [customProdBrand, setCustomProdBrand] = useState("");
  const [customProdCategory, setCustomProdCategory] = useState("Serum điều trị");
  const [customProdImage, setCustomProdImage] = useState("https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80");
  const [customProdActives, setCustomProdActives] = useState("");
  const [customProdTime, setCustomProdTime] = useState<"morning" | "evening" | "both">("both");
  const [customProdDosage, setCustomProdDosage] = useState("1 hạt đậu");
  const [customProdUsage, setCustomProdUsage] = useState("Thoa sau bước làm sạch, vỗ nhẹ cho thẩm thấu.");

  // Patient view interaction state
  const [patientTickedSteps, setPatientTickedSteps] = useState<Record<string, boolean>>({
    rp_01: true,
    rp_02: true,
  });

  // Filtered cases
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

  // Open Prescribe Routine Modal
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

  // Add Product to Routine in modal
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

    setDoctorProfile((prev) => ({
      ...prev,
      stats: { ...prev.stats, routinesPrescribed: prev.stats.routinesPrescribed + 1 },
    }));

    setIsPrescribeModalOpen(false);
    toast.success(`Đã lưu phác đồ Routine cho ${prescribeTargetCase.patientName}!`);
  }

  function handleSaveProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDoctorProfile((prev) => ({
      ...prev,
      name: editName.trim(),
      title: editTitle.trim(),
      hospital: editHospital.trim(),
      bio: editBio.trim(),
      phone: editPhone.trim(),
      zalo: editZalo.trim(),
      consultationHours: editHours.trim(),
      avatarUrl: editAvatar.trim() || prev.avatarUrl,
    }));
    setIsEditProfileOpen(false);
    toast.success("Đã cập nhật thông tin Bác sĩ thành công!");
  }

  function formatDateVi(dateStr: string) {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  const activePatientCase = patientCases[0];

  return (
    <div className="min-h-screen bg-[#E8E5DE] text-[#191B19] antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#D8D4CA] bg-[#E8E5DE]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <LogoMark className="size-8 transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-[#191B19] leading-tight">
                  SkinSense <span className="text-[#2D5A43] font-sans text-xs font-semibold">CLINICAL</span>
                </span>
                <span className="text-[11px] font-medium text-[#5C605C]">
                  Phân hệ Bác sĩ Da liễu & Kê Routine
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-[#D8D4CA]" />

            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#2D5A43]/30 bg-[#2D5A43]/10 px-3 py-1 text-xs font-medium text-[#2D5A43]">
              <Stethoscope className="size-3.5" />
              <span>{doctorProfile.name}</span>
              <span className="text-[10px] opacity-75">({doctorProfile.licenseNumber})</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-[#D8D4CA] bg-[#F6F4EF] p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setViewMode("doctor");
                  setActiveTab("records");
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "doctor"
                    ? "bg-[#2D5A43] text-white shadow-xs"
                    : "text-[#5C605C] hover:text-[#191B19]"
                }`}
              >
                <Stethoscope className="size-3.5" />
                <span>Bác sĩ Da liễu</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("patient");
                  setActiveTab("patient_view");
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "patient"
                    ? "bg-[#78350F] text-white shadow-xs"
                    : "text-[#5C605C] hover:text-[#191B19]"
                }`}
              >
                <User className="size-3.5" />
                <span>Góc nhìn Bệnh nhân</span>
              </button>
            </div>

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CA] bg-[#F6F4EF] px-3 py-1.5 text-xs font-medium text-[#5C605C] transition hover:text-[#191B19]"
            >
              <Home className="size-3.5" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {viewMode === "doctor" && (
          <div className="space-y-6">
            {/* Navigation Tabs Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8D4CA] pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("records")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === "records"
                      ? "bg-[#191B19] text-[#FAF8F5] shadow-xs"
                      : "bg-[#F6F4EF] text-[#5C605C] hover:text-[#191B19] hover:bg-[#E8E5DE]"
                  }`}
                >
                  <FileText className="size-4" />
                  <span>Bệnh án gửi về ({patientCases.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("routines")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === "routines"
                      ? "bg-[#191B19] text-[#FAF8F5] shadow-xs"
                      : "bg-[#F6F4EF] text-[#5C605C] hover:text-[#191B19] hover:bg-[#E8E5DE]"
                  }`}
                >
                  <Sparkles className="size-4" />
                  <span>Phác đồ Routine Điều trị</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-[#191B19] text-[#FAF8F5] shadow-xs"
                      : "bg-[#F6F4EF] text-[#5C605C] hover:text-[#191B19] hover:bg-[#E8E5DE]"
                  }`}
                >
                  <Award className="size-4" />
                  <span>Hồ sơ Bác sĩ</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenPrescribeModal(patientCases[0])}
                className="flex items-center gap-2 rounded-xl bg-[#2D5A43] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] transition cursor-pointer"
              >
                <Plus className="size-4" />
                <span>+ Kê Phác đồ Routine</span>
              </button>
            </div>

            {/* TAB 1: BỆNH ÁN GỬI VỀ */}
            {activeTab === "records" && (
              <div className="space-y-5">
                {/* 1. THỐNG KÊ HÀNG NGANG (Gọn gàng, dễ nhìn, bỏ 4 khung vuông gộp lại) */}
                <div className="flex flex-wrap items-center justify-between rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-3 shadow-2xs gap-3">
                  <div className="flex items-center gap-2.5 px-3">
                    <div className="rounded-lg bg-[#2D5A43]/10 p-2 text-[#2D5A43]">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#5C605C] block">Tổng bệnh án</span>
                      <span className="text-sm font-bold text-[#191B19]">{patientCases.length} ca</span>
                    </div>
                  </div>

                  <span className="hidden sm:inline-block h-6 w-px bg-[#D8D4CA]" />

                  <div className="flex items-center gap-2.5 px-3">
                    <div className="rounded-lg bg-[#78350F]/10 p-2 text-[#78350F]">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#5C605C] block">Chờ lên phác đồ</span>
                      <span className="text-sm font-bold text-[#78350F]">
                        {patientCases.filter((c) => c.status === "pending_routine").length} ca
                      </span>
                    </div>
                  </div>

                  <span className="hidden sm:inline-block h-6 w-px bg-[#D8D4CA]" />

                  <div className="flex items-center gap-2.5 px-3">
                    <div className="rounded-lg bg-[#2D5A43]/10 p-2 text-[#2D5A43]">
                      <Activity className="size-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#5C605C] block">Đang điều trị</span>
                      <span className="text-sm font-bold text-[#2D5A43]">
                        {patientCases.filter((c) => c.status === "in_treatment").length} ca
                      </span>
                    </div>
                  </div>

                  <span className="hidden sm:inline-block h-6 w-px bg-[#D8D4CA]" />

                  <div className="flex items-center gap-2.5 px-3">
                    <div className="rounded-lg bg-[#2D5A43]/10 p-2 text-[#2D5A43]">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#5C605C] block">Đáp ứng phục hồi</span>
                      <span className="text-sm font-bold text-[#191B19]">98.6%</span>
                    </div>
                  </div>
                </div>

                {/* Filter and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-3 shadow-2xs">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#5C605C]" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên bệnh nhân, mã bệnh án (BA-2026)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white py-1.5 pl-10 pr-4 text-xs text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs">
                      <Filter className="size-3.5 text-[#5C605C]" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-xs text-[#191B19] focus:outline-none cursor-pointer"
                      >
                        <option value="all">Tất cả ({patientCases.length})</option>
                        <option value="pending_routine">Chờ lên phác đồ</option>
                        <option value="in_treatment">Đang điều trị</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs">
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-transparent text-xs text-[#191B19] focus:outline-none cursor-pointer"
                      >
                        <option value="all">Mức độ: Tất cả</option>
                        <option value="severe">Nặng</option>
                        <option value="moderate">Trung bình</option>
                        <option value="mild">Nhẹ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. DANH SÁCH BỆNH ÁN DẠNG HÀNG NGANG (Dễ nhìn, thông thoáng, không bị 4 khung gộp) */}
                <div className="space-y-3">
                  {filteredCases.map((patientCase) => (
                    <div
                      key={patientCase.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-4 shadow-2xs hover:border-[#2D5A43]/50 transition"
                    >
                      {/* Left: Patient Avatar & Core Info */}
                      <div className="flex items-center gap-3.5 min-w-[260px]">
                        <img
                          src={patientCase.skinPhotoUrl}
                          alt={patientCase.patientName}
                          className="size-14 rounded-xl object-cover border border-[#D8D4CA] shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#191B19]">
                              {patientCase.patientName}
                            </h4>
                            <span className="text-xs text-[#5C605C]">
                              {patientCase.patientAge}t • {patientCase.patientGender}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5C605C]">
                            <span className="font-mono font-medium text-[#191B19]">
                              {patientCase.caseCode}
                            </span>
                            <span>•</span>
                            <span>Gửi: {patientCase.submittedDate}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {patientCase.status === "in_treatment" ? (
                              <span className="rounded-full bg-[#2D5A43]/15 px-2 py-0.5 text-[10px] font-semibold text-[#2D5A43]">
                                ● Đang điều trị
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#78350F]/15 px-2 py-0.5 text-[10px] font-semibold text-[#78350F]">
                                ⏳ Chờ kê Routine
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                patientCase.severity === "severe"
                                  ? "bg-rose-100 text-rose-800"
                                  : patientCase.severity === "moderate"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {patientCase.severity === "severe"
                                ? "Nặng"
                                : patientCase.severity === "moderate"
                                ? "Trung bình"
                                : "Nhẹ"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Symptoms & Clean Horizontal Metrics Line */}
                      <div className="flex-1 space-y-2 text-xs">
                        <div className="text-[#191B19]">
                          <span className="font-semibold text-[#2D5A43]">Triệu chứng: </span>
                          <span className="text-[#5C605C]">{patientCase.symptoms}</span>
                        </div>

                        {/* Thanh chỉ số da hàng ngang (Thay thế 4 khung vuông) */}
                        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white border border-[#D8D4CA] px-3 py-1.5 text-[11px]">
                          <span>
                            Điểm da: <strong className="text-[#191B19]">{patientCase.aiAnalysis.skinHealthScore}/100</strong>
                          </span>
                          <span className="text-[#D8D4CA]">•</span>
                          <span>
                            Đỏ da (PIE): <strong className="text-rose-700">{patientCase.aiAnalysis.rednessIndex}%</strong>
                          </span>
                          <span className="text-[#D8D4CA]">•</span>
                          <span>
                            Mụn viêm: <strong className="text-amber-800">{patientCase.aiAnalysis.inflammatorySpots} nốt</strong>
                          </span>
                          <span className="text-[#D8D4CA]">•</span>
                          <span>
                            Mụn ẩn: <strong className="text-[#5C605C]">{patientCase.aiAnalysis.comedoneSpots} nốt</strong>
                          </span>
                          <span className="text-[#D8D4CA]">•</span>
                          <span className="text-[#5C605C]">
                            Loại da: <strong className="text-[#191B19]">{patientCase.skinType}</strong>
                          </span>
                        </div>

                        {/* Routine preview row if already prescribed */}
                        {patientCase.currentRoutine && (
                          <div className="flex items-center gap-2 text-[11px] text-[#2D5A43]">
                            <Sparkles className="size-3.5 shrink-0" />
                            <span className="font-medium truncate">
                              {patientCase.currentRoutine.routineTitle}
                            </span>
                            <span className="text-[#5C605C] font-mono shrink-0">
                              (Tái khám: {formatDateVi(patientCase.currentRoutine.revisitDate)})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-row lg:flex-col items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCase(patientCase);
                            setIsCaseDetailOpen(true);
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs font-semibold text-[#191B19] hover:bg-[#E8E5DE] transition cursor-pointer w-full"
                        >
                          <Eye className="size-3.5" />
                          <span>Xem Bệnh án</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenPrescribeModal(patientCase)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#2D5A43] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] transition cursor-pointer w-full"
                        >
                          <Plus className="size-3.5" />
                          <span>
                            {patientCase.currentRoutine ? "Sửa Routine" : "Kê Routine"}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: PHÁC ĐỒ ROUTINE ĐIỀU TRỊ */}
            {activeTab === "routines" && (
              <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#191B19]">
                      Phác đồ Skincare Routine đang áp dụng
                    </h3>
                    <p className="text-xs text-[#5C605C]">
                      Mỗi sản phẩm đều có ảnh chụp thực tế rõ ràng, liều dùng và ngày tái khám.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenPrescribeModal(patientCases[0])}
                    className="flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Kê Phác đồ Mới</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {patientCases
                    .filter((c) => c.currentRoutine)
                    .map((patientCase) => {
                      const routine = patientCase.currentRoutine!;
                      return (
                        <div
                          key={patientCase.id}
                          className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 space-y-3"
                        >
                          {/* Routine Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8D4CA] pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#191B19]">
                                  {routine.routineTitle}
                                </span>
                                <span className="rounded-full bg-[#2D5A43]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#2D5A43]">
                                  {patientCase.patientName} ({patientCase.caseCode})
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[#5C605C] mt-0.5 font-mono">
                                <span>Bắt đầu: {formatDateVi(routine.startDate)}</span>
                                <span>•</span>
                                <span className="text-[#78350F] font-bold">
                                  Hẹn tái khám: {formatDateVi(routine.revisitDate)}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenPrescribeModal(patientCase)}
                              className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs font-semibold text-[#191B19] hover:bg-[#E8E5DE] cursor-pointer self-start sm:self-auto"
                            >
                              <Edit3 className="size-3.5" />
                              <span>Sửa phác đồ</span>
                            </button>
                          </div>

                          {routine.doctorNotes && (
                            <div className="text-xs text-[#5C605C] bg-white rounded-xl p-2.5 border border-[#D8D4CA]">
                              <strong className="text-[#2D5A43]">Lời dặn: </strong>
                              {routine.doctorNotes}
                            </div>
                          )}

                          {/* Products Horizontal Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {routine.products.map((prod) => (
                              <div
                                key={prod.id}
                                className="flex gap-3 rounded-xl border border-[#D8D4CA] bg-white p-3 shadow-2xs items-center"
                              >
                                <div className="relative size-18 shrink-0 overflow-hidden rounded-xl border border-[#D8D4CA] bg-neutral-100">
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    className="size-full object-cover"
                                  />
                                  <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[8px] font-bold text-white">
                                    #{prod.stepNumber}
                                  </span>
                                </div>

                                <div className="flex-1 min-w-0 text-xs space-y-0.5">
                                  <div className="flex items-start justify-between gap-1">
                                    <h5 className="font-bold text-[#191B19] truncate leading-tight">
                                      {prod.name}
                                    </h5>
                                    <span className="shrink-0 rounded bg-[#2D5A43]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#2D5A43]">
                                      {prod.stepTime === "morning"
                                        ? "☀️ Sáng"
                                        : prod.stepTime === "evening"
                                        ? "🌙 Tối"
                                        : "☀️ Sáng & 🌙 Tối"}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#78350F] font-medium">
                                    {prod.brand} • {prod.category}
                                  </div>
                                  <div className="text-[11px] text-[#5C605C]">
                                    Liều lượng: <strong>{prod.dosage}</strong>
                                  </div>
                                  <div className="text-[11px] text-[#2D5A43] truncate">
                                    Cách dùng: {prod.usageGuide}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 3: HỒ SƠ BÁC SĨ (PROFILE) */}
            {activeTab === "profile" && (
              <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 border-b border-[#D8D4CA] pb-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <img
                      src={doctorProfile.avatarUrl}
                      alt={doctorProfile.name}
                      className="size-24 rounded-2xl object-cover border-2 border-[#2D5A43]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <h3 className="text-lg font-bold text-[#191B19]">{doctorProfile.name}</h3>
                        <span className="rounded-full bg-[#2D5A43]/15 px-2.5 py-0.5 text-xs font-bold text-[#2D5A43]">
                          Bác sĩ Da liễu
                        </span>
                      </div>
                      <p className="text-xs text-[#78350F] font-medium">{doctorProfile.title}</p>
                      <p className="text-xs text-[#5C605C] flex items-center justify-center sm:justify-start gap-1">
                        <MapPin className="size-3.5 text-[#2D5A43]" />
                        <span>{doctorProfile.hospital}</span>
                      </p>
                      <p className="text-xs font-mono text-[#5C605C]">
                        CCHN: <strong>{doctorProfile.licenseNumber}</strong> • {doctorProfile.experienceYears} năm kinh nghiệm
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#191B19] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 cursor-pointer"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Sửa thông tin</span>
                  </button>
                </div>

                {/* Horizontal Stat Strip (Thay thế 4 khung to) */}
                <div className="flex flex-wrap items-center justify-between rounded-xl bg-[#F6F4EF] border border-[#D8D4CA] p-3 text-xs gap-3">
                  <div className="text-center px-4">
                    <span className="text-[#5C605C] text-[11px] block">Bệnh nhân</span>
                    <strong className="text-base text-[#2D5A43]">{doctorProfile.stats.patientsTreated}+ ca</strong>
                  </div>
                  <span className="hidden sm:inline-block h-6 w-px bg-[#D8D4CA]" />
                  <div className="text-center px-4">
                    <span className="text-[#5C605C] text-[11px] block">Hồi phục</span>
                    <strong className="text-base text-[#191B19]">{doctorProfile.stats.successRate}%</strong>
                  </div>
                  <span className="hidden sm:inline-block h-6 w-px bg-[#D8D4CA]" />
                  <div className="text-center px-4">
                    <span className="text-[#5C605C] text-[11px] block">Routine đã kê</span>
                    <strong className="text-base text-[#78350F]">{doctorProfile.stats.routinesPrescribed}</strong>
                  </div>
                  <span className="hidden sm:inline-block h-6 w-px bg-[#D8D4CA]" />
                  <div className="text-center px-4">
                    <span className="text-[#5C605C] text-[11px] block">Đánh giá</span>
                    <strong className="text-base text-amber-800">⭐ {doctorProfile.stats.rating}/5.0</strong>
                  </div>
                </div>

                {/* Bio & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-[#F6F4EF] border border-[#D8D4CA] p-4 space-y-2">
                    <span className="font-bold text-[#191B19] block">Tiểu sử chuyên môn</span>
                    <p className="text-[#5C605C] leading-relaxed">{doctorProfile.bio}</p>
                    <div className="pt-2">
                      <span className="font-semibold text-[#191B19] block mb-1">Đào tạo & Chứng chỉ:</span>
                      <ul className="space-y-1 text-[#5C605C]">
                        {doctorProfile.education.map((edu, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-[#2D5A43]" />
                            <span>{edu}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#F6F4EF] border border-[#D8D4CA] p-4 space-y-2">
                    <span className="font-bold text-[#191B19] block">Thông tin liên hệ & Giờ khám</span>
                    <div className="space-y-1.5 text-[#5C605C]">
                      <div>Giờ tư vấn: <strong className="text-[#191B19]">{doctorProfile.consultationHours}</strong></div>
                      <div>Phòng khám: <strong className="text-[#191B19]">{doctorProfile.clinicAddress}</strong></div>
                      <div>Hotline: <strong className="text-[#2D5A43]">{doctorProfile.phone}</strong></div>
                      <div>Zalo: <strong className="text-blue-600">{doctorProfile.zalo}</strong></div>
                      <div>Email: <strong className="text-[#78350F]">{doctorProfile.email}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PATIENT VIEW */}
        {viewMode === "patient" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8D4CA] pb-3">
                <div>
                  <span className="rounded-full bg-[#78350F]/15 px-2.5 py-0.5 text-xs font-bold text-[#78350F]">
                    Góc nhìn Bệnh nhân
                  </span>
                  <h3 className="text-lg font-bold text-[#191B19] mt-1">
                    Bệnh án & Phác đồ của {activePatientCase.patientName} ({activePatientCase.caseCode})
                  </h3>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] p-2">
                  <img
                    src={doctorProfile.avatarUrl}
                    alt={doctorProfile.name}
                    className="size-10 rounded-lg object-cover border border-[#2D5A43]"
                  />
                  <div className="text-xs">
                    <span className="block text-[10px] text-[#5C605C]">Bác sĩ phụ trách:</span>
                    <strong className="text-[#191B19]">{doctorProfile.name}</strong>
                  </div>
                </div>
              </div>

              {/* Photo & Snapshot */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <img
                  src={activePatientCase.skinPhotoUrl}
                  alt="Ảnh soi da"
                  className="size-36 rounded-xl object-cover border border-[#D8D4CA]"
                />
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-3 bg-[#F6F4EF] border border-[#D8D4CA] p-2.5 rounded-xl">
                    <span>Độ đỏ da: <strong className="text-rose-700">{activePatientCase.aiAnalysis.rednessIndex}%</strong></span>
                    <span>•</span>
                    <span>Mụn viêm: <strong className="text-amber-800">{activePatientCase.aiAnalysis.inflammatorySpots} nốt</strong></span>
                    <span>•</span>
                    <span>Sức khỏe da: <strong className="text-[#2D5A43]">{activePatientCase.aiAnalysis.skinHealthScore}/100</strong></span>
                  </div>
                  <p className="text-[#5C605C]">
                    <strong className="text-[#2D5A43]">Lời dặn từ Bác sĩ: </strong>
                    {activePatientCase.currentRoutine?.doctorNotes || "Tuân thủ đúng phác đồ hàng ngày."}
                  </p>
                </div>
              </div>
            </div>

            {/* Prescribed Routine for Patient */}
            {activePatientCase.currentRoutine && (
              <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#191B19]">
                      {activePatientCase.currentRoutine.routineTitle}
                    </h4>
                    <span className="text-xs text-[#5C605C] font-mono">
                      Tái khám: {formatDateVi(activePatientCase.currentRoutine.revisitDate)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#2D5A43] bg-[#2D5A43]/10 px-3 py-1 rounded-lg">
                    Đã hoàn thành: {Object.values(patientTickedSteps).filter(Boolean).length}/{activePatientCase.currentRoutine.products.length} bước
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activePatientCase.currentRoutine.products.map((prod) => {
                    const isTicked = !!patientTickedSteps[prod.id];
                    return (
                      <div
                        key={prod.id}
                        className={`flex gap-3 rounded-xl border p-3 items-center transition ${
                          isTicked ? "border-[#2D5A43] bg-[#2D5A43]/5" : "border-[#D8D4CA] bg-white"
                        }`}
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="size-18 rounded-lg object-cover border border-[#D8D4CA] shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-xs space-y-0.5">
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="font-bold text-[#191B19] truncate leading-tight">
                              {prod.name}
                            </h5>
                            <span className="text-[10px] text-[#2D5A43] shrink-0">
                              {prod.stepTime === "morning" ? "☀️ Sáng" : prod.stepTime === "evening" ? "🌙 Tối" : "☀️ Sáng & 🌙 Tối"}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#78350F]">{prod.brand}</div>
                          <div className="text-[11px] text-[#5C605C]">Liều: {prod.dosage}</div>
                          <div className="text-[11px] text-[#2D5A43] truncate">HD: {prod.usageGuide}</div>
                          <button
                            type="button"
                            onClick={() => {
                              setPatientTickedSteps((prev) => ({ ...prev, [prod.id]: !prev[prod.id] }));
                              if (!isTicked) toast.success(`Đã xong: ${prod.name}!`);
                            }}
                            className={`mt-1.5 flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                              isTicked ? "bg-[#2D5A43] text-white" : "border border-[#D8D4CA] bg-[#F6F4EF] text-[#5C605C]"
                            }`}
                          >
                            <Check className="size-3" />
                            <span>{isTicked ? "Đã dùng ✓" : "Đánh dấu đã dùng"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: XEM CHI TIẾT BỆNH ÁN */}
      {isCaseDetailOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-2.5">
              <div>
                <span className="font-mono text-xs text-[#5C605C]">{selectedCase.caseCode}</span>
                <h4 className="text-base font-bold text-[#191B19]">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <img
                  src={selectedCase.skinPhotoUrl}
                  alt={selectedCase.patientName}
                  className="w-full h-48 rounded-xl object-cover border border-[#D8D4CA]"
                />
                <div className="text-[11px] text-[#5C605C] bg-[#F6F4EF] p-2 rounded-lg">
                  Vùng tổn thương: <strong>{selectedCase.aiAnalysis.affectedZones.join(", ")}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-white border border-[#D8D4CA] rounded-xl p-3 space-y-1">
                  <div>Bệnh nhân: <strong>{selectedCase.patientName}</strong> ({selectedCase.patientAge}t • {selectedCase.patientGender})</div>
                  <div>SĐT: <strong>{selectedCase.phone}</strong></div>
                  <div>Loại da: <strong>{selectedCase.skinType}</strong></div>
                  <div>Dị ứng: <strong className="text-rose-700">{selectedCase.allergies}</strong></div>
                </div>

                <div className="bg-[#F6F4EF] border border-[#D8D4CA] rounded-xl p-3">
                  <span className="font-semibold text-[#191B19] block mb-0.5">Triệu chứng:</span>
                  <p className="text-[#5C605C]">{selectedCase.symptoms}</p>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 bg-white border border-[#D8D4CA] rounded-lg p-2 text-center">
                    <span className="text-[10px] text-[#5C605C] block">Đỏ da PIE</span>
                    <strong className="text-rose-700">{selectedCase.aiAnalysis.rednessIndex}%</strong>
                  </div>
                  <div className="flex-1 bg-white border border-[#D8D4CA] rounded-lg p-2 text-center">
                    <span className="text-[10px] text-[#5C605C] block">Mụn viêm</span>
                    <strong className="text-amber-800">{selectedCase.aiAnalysis.inflammatorySpots} nốt</strong>
                  </div>
                  <div className="flex-1 bg-white border border-[#D8D4CA] rounded-lg p-2 text-center">
                    <span className="text-[10px] text-[#5C605C] block">Điểm da</span>
                    <strong className="text-[#2D5A43]">{selectedCase.aiAnalysis.skinHealthScore}/100</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#D8D4CA]">
              <button
                type="button"
                onClick={() => {
                  setIsCaseDetailOpen(false);
                  handleOpenPrescribeModal(selectedCase);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Kê Routine cho ca này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KÊ PHÁC ĐỒ ROUTINE (CÓ ẢNH SẢN PHẨM BẮT BUỘC, CÁCH DÙNG, NGÀY THÁNG) */}
      {isPrescribeModalOpen && prescribeTargetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-2.5">
              <div>
                <h4 className="text-base font-bold text-[#191B19]">
                  Kê Routine cho {prescribeTargetCase.patientName} ({prescribeTargetCase.caseCode})
                </h4>
                <p className="text-[11px] text-[#5C605C]">
                  Yêu cầu bắt buộc mỗi sản phẩm đều có ảnh sản phẩm rõ nét.
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

            <form onSubmit={handleSaveRoutineSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Tên Phác đồ</label>
                <input
                  type="text"
                  required
                  value={routineTitleInput}
                  onChange={(e) => setRoutineTitleInput(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    required
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                  />
                </div>
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Ngày hẹn tái khám</label>
                  <input
                    type="date"
                    required
                    value={revisitDateInput}
                    onChange={(e) => setRevisitDateInput(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Lời dặn của Bác sĩ</label>
                <input
                  type="text"
                  value={doctorNotesInput}
                  onChange={(e) => setDoctorNotesInput(e.target.value)}
                  placeholder="Lời dặn kiêng cữ hoặc lưu ý thoa kem..."
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:outline-none focus:border-[#2D5A43]"
                />
              </div>

              {/* Product list */}
              <div className="space-y-2 pt-2 border-t border-[#D8D4CA]">
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
                    className="flex items-center gap-1 rounded-lg bg-[#2D5A43] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>+ Thêm sản phẩm có ảnh</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {modalProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#D8D4CA] bg-white p-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="size-12 rounded-lg object-cover border border-[#D8D4CA] shrink-0"
                        />
                        <div className="min-w-0">
                          <h6 className="font-bold text-[#191B19] text-xs truncate">{prod.name}</h6>
                          <div className="text-[11px] text-[#5C605C]">
                            {prod.brand} • Liều: {prod.dosage}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(prod.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#D8D4CA]">
                <button
                  type="button"
                  onClick={() => setIsPrescribeModalOpen(false)}
                  className="rounded-xl border border-[#D8D4CA] bg-white px-4 py-2 text-xs font-semibold text-[#5C605C]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2D5A43] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
                >
                  Lưu Phác đồ Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: CHỌN SẢN PHẨM */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-2xl space-y-3.5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-2.5">
              <h5 className="font-bold text-[#191B19] text-sm">
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

            <div className="flex rounded-lg border border-[#D8D4CA] bg-[#F6F4EF] p-1 text-xs">
              <button
                type="button"
                onClick={() => setProductSource("preset")}
                className={`flex-1 py-1.5 rounded-md font-semibold cursor-pointer ${
                  productSource === "preset" ? "bg-[#2D5A43] text-white" : "text-[#5C605C]"
                }`}
              >
                Mỹ phẩm có sẵn ảnh đẹp
              </button>
              <button
                type="button"
                onClick={() => setProductSource("custom")}
                className={`flex-1 py-1.5 rounded-md font-semibold cursor-pointer ${
                  productSource === "custom" ? "bg-[#2D5A43] text-white" : "text-[#5C605C]"
                }`}
              >
                Tự nhập & dán link ảnh
              </button>
            </div>

            {productSource === "preset" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {PRESET_PRODUCTS.map((prod, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPresetIndex(idx)}
                    className={`flex items-center gap-2.5 rounded-xl border p-2 transition cursor-pointer ${
                      selectedPresetIndex === idx
                        ? "border-[#2D5A43] bg-[#2D5A43]/10 ring-1 ring-[#2D5A43]"
                        : "border-[#D8D4CA] bg-white hover:border-[#2D5A43]/50"
                    }`}
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="size-14 rounded-lg object-cover border border-[#D8D4CA] shrink-0"
                    />
                    <div className="min-w-0 text-xs">
                      <div className="font-bold text-[#191B19] truncate">{prod.name}</div>
                      <div className="text-[10px] text-[#78350F]">{prod.brand}</div>
                      <div className="text-[10px] text-[#5C605C] truncate">{prod.dosage}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Tên sản phẩm</label>
                  <input
                    type="text"
                    required
                    value={customProdName}
                    onChange={(e) => setCustomProdName(e.target.value)}
                    placeholder="Tên sản phẩm..."
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Hãng</label>
                    <input
                      type="text"
                      value={customProdBrand}
                      onChange={(e) => setCustomProdBrand(e.target.value)}
                      placeholder="Thương hiệu..."
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Thời điểm thoa</label>
                    <select
                      value={customProdTime}
                      onChange={(e) => setCustomProdTime(e.target.value as any)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                    >
                      <option value="both">Cả Sáng & Tối</option>
                      <option value="morning">Chỉ Sáng ☀️</option>
                      <option value="evening">Chỉ Tối 🌙</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Link ảnh (URL) *</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={customProdImage}
                      onChange={(e) => setCustomProdImage(e.target.value)}
                      className="flex-1 rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                    />
                    {customProdImage && (
                      <img
                        src={customProdImage}
                        alt="Preview"
                        className="size-8 rounded object-cover border border-[#D8D4CA]"
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Liều lượng</label>
                    <input
                      type="text"
                      value={customProdDosage}
                      onChange={(e) => setCustomProdDosage(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Cách dùng</label>
                    <input
                      type="text"
                      value={customProdUsage}
                      onChange={(e) => setCustomProdUsage(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8D4CA]">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C605C]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddProductConfirm}
                className="rounded-xl bg-[#2D5A43] px-4 py-1.5 text-xs font-semibold text-white cursor-pointer"
              >
                Thêm vào Routine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA PROFILE */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-xl space-y-3.5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-2.5">
              <h5 className="font-bold text-[#191B19] text-sm">Chỉnh sửa Hồ sơ Bác sĩ</h5>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-[#5C605C] hover:text-[#191B19] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Họ tên</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                  />
                </div>
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Chức danh</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Nơi công tác</label>
                <input
                  type="text"
                  required
                  value={editHospital}
                  onChange={(e) => setEditHospital(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                />
              </div>

              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Giới thiệu ngắn</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Hotline</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                  />
                </div>
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Zalo</label>
                  <input
                    type="text"
                    value={editZalo}
                    onChange={(e) => setEditZalo(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D8D4CA]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C605C]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2D5A43] px-4 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
