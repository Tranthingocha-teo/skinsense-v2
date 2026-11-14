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
  AlertCircle,
  Award,
  Phone,
  Mail,
  MapPin,
  Eye,
  Sun,
  Moon,
  ShieldCheck,
  Activity,
  Check,
  Search,
  Filter,
  ArrowRight,
  User,
  AlertTriangle,
  X,
  Image as ImageIcon,
  Info,
  ChevronRight,
  SlidersHorizontal,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site-header";

// Types definition
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
  note?: string;
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
  previousCosmetics: string;
  allergies: string;
  skinPhotoUrl: string;
  aiAnalysis: {
    skinHealthScore: number;
    rednessIndex: number;
    inflammatorySpots: number;
    comedoneSpots: number;
    primaryConcerns: string[];
    affectedZones: string[];
  };
  currentRoutine?: {
    routineTitle: string;
    prescribedDate: string;
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

// Preset verified cosmetic products with real photos & clinical details
export const PRESET_PRODUCTS: Omit<RoutineProduct, "id" | "stepNumber">[] = [
  {
    name: "Sữa rửa mặt dưỡng ẩm sâu CeraVe Hydrating Cleanser",
    brand: "CeraVe Skincare (Mỹ)",
    category: "Làm sạch & Cân bằng pH",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Ceramides 1, 3, 6-II, Hyaluronic Acid, Glycerin",
    stepTime: "both",
    dosage: "1 lần nhấn pump (khoảng 2ml)",
    usageGuide: "Làm ướt mặt với nước ấm, massage nhẹ 60 giây theo chuyển động tròn từ trong ra ngoài. Rửa sạch và dùng khăn bông thấm nhẹ, không chà xát mạnh.",
    note: "Độ pH chuẩn 5.5, bảo vệ màng lipid tự nhiên của da.",
  },
  {
    name: "Kem dưỡng giảm mụn & phục hồi La Roche-Posay Effaclar Duo+M",
    brand: "La Roche-Posay (Pháp)",
    category: "Điều trị mụn & Ngừa thâm",
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Phylobioma, Niacinamide, Procerad, LHA, Salicylic Acid, Zinc PCA",
    stepTime: "evening",
    dosage: "1 lượng nhỏ bằng hạt đậu xanh",
    usageGuide: "Thoa toàn mặt sau bước làm sạch và serum cấp ẩm. Vỗ nhẹ 30 giây cho kem thẩm thấu. Nếu mới dùng lần đầu, thoa cách ngày Thứ 2 - 4 - 6 trong 7 ngày đầu.",
    note: "Tác động giảm vi khuẩn gây mụn IA1 và ngăn ngừa thâm đỏ sau mụn.",
  },
  {
    name: "Serum phục hồi & cấp nước La Roche-Posay Hyalu B5",
    brand: "La Roche-Posay (Pháp)",
    category: "Tinh chất phục hồi & Giảm đỏ",
    imageUrl: "https://images.unsplash.com/photo-1608248597359-59828d5d4d3d?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Vitamin B5 (Panthenol 5%), Pure Hyaluronic Acid Duo, Madecassoside",
    stepTime: "both",
    dosage: "3 đến 4 giọt tinh chất",
    usageGuide: "Nhỏ 3 giọt lên trán và hai bên má khi da còn hơi ẩm, dùng đầu ngón tay vỗ nhẹ cho tinh chất thấm sâu. Dùng trước bước kem dưỡng ẩm.",
    note: "Tăng cường tái tạo màng bảo vệ da chỉ sau 1 giờ áp dụng.",
  },
  {
    name: "Kem chống nắng kiểm soát bóng dầu La Roche-Posay Anthelios UVMune 400",
    brand: "La Roche-Posay (Pháp)",
    category: "Chống nắng y khoa chuyên sâu",
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Mexoryl 400, Công nghệ Netlock, Airlicium, SPF50+ PA++++",
    stepTime: "morning",
    dosage: "Lượng bằng 2 đốt ngón tay trỏ (khoảng 1.25ml)",
    usageGuide: "Thoa đều toàn bộ khuôn mặt và vùng cổ vào buổi sáng trước khi ra ngoài 20 phút. Thoa lại sau 3-4 tiếng nếu làm việc ngoài trời hoặc ra nhiều mồ hôi.",
    note: "Màng lọc Mexoryl 400 chống lại tia UVA siêu dài (380-400nm) gây thâm sạm.",
  },
  {
    name: "Kem dưỡng ẩm làm dịu cấp cứu A-Derma Dermalibour+ CICA",
    brand: "A-Derma (Pháp)",
    category: "Kem dưỡng phục hồi màng da tổn thương",
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Chiết xuất mạ yến mạch Rhealba, Đồng Sulfate & Kẽm Sulfate",
    stepTime: "both",
    dosage: "1 lượng bằng hạt bắp",
    usageGuide: "Thoa lớp mỏng lên vùng da kích ứng, đỏ rát hoặc sau khi nặn mụn 2 lần/ngày. Giúp kháng khuẩn tự nhiên và thúc đẩy làm lành thương tổn nhanh chóng.",
    note: "Không cồn, không hương liệu, an toàn tuyệt đối cho da nhạy cảm sau peel.",
  },
  {
    name: "Nước tẩy trang dịu nhẹ Bioderma Sensibio H2O Micellar",
    brand: "Bioderma Laboratoire (Pháp)",
    category: "Tẩy trang dịu nhẹ cho da nhạy cảm",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Hạt Micelles ester acid béo sinh học, D.A.F Complex, Chiết xuất dưa leo",
    stepTime: "evening",
    dosage: "Thấm ướt 2 miếng bông cotton",
    usageGuide: "Lau nhẹ nhàng khắp mặt theo hướng từ dưới lên trên và từ trong ra ngoài. Không cần rửa lại với nước nếu da đang quá kích ứng.",
    note: "Làm sạch 99% bụi mịn PM2.5 và cặn trang điểm mà không gây căng rát.",
  },
  {
    name: "Serum kiềm dầu giảm bã nhờn The Ordinary Niacinamide 10% + Zinc 1%",
    brand: "The Ordinary (Canada)",
    category: "Serum cân bằng bã nhờn & Thu nhỏ lỗ chân lông",
    imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Niacinamide (Vitamin B3) 10%, Zinc PCA 1%",
    stepTime: "morning",
    dosage: "2 giọt",
    usageGuide: "Thoa sau bước toner/làm sạch và trước kem chống nắng. Vỗ nhẹ đều hai bên cánh mũi và vùng chữ T dễ tiết dầu.",
    note: "Hỗ trợ ức chế chuyển hóa melanosome giúp mờ thâm mụn.",
  },
  {
    name: "Gel điều trị mụn Klenzit-C / Adapalene & Clindamycin",
    brand: "Glenmark Pharmaceuticals",
    category: "Thuốc bôi đặc trị mụn bọc viêm",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Adapalene 0.1%, Clindamycin Phosphate 1%",
    stepTime: "evening",
    dosage: "Chấm điểm từng nốt mụn (cực kỳ mỏng)",
    usageGuide: "Dùng tăm bông sạch chấm trực tiếp lên các nốt mụn viêm sưng đỏ vào buổi tối. Tuyệt đối không bôi diện rộng toàn mặt. Sử dụng cách ngày trong 2 tuần.",
    note: "Kê đơn y khoa đặc trị. Cần chống nắng nghiêm ngặt vào ban ngày.",
  },
];

// Initial realistic Doctor profile
const INITIAL_DOCTOR_PROFILE: DoctorProfile = {
  name: "BS. CKI Nguyễn Mai Hoa",
  title: "Bác sĩ Chuyên khoa I Da liễu - Thẩm mỹ Da",
  licenseNumber: "014289/BYT-CCHN",
  hospital: "Bệnh viện Da liễu Trung ương & Cố vấn Chuyên môn SkinSense",
  experienceYears: 12,
  avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
  bio: "Tốt nghiệp Bác sĩ Chuyên khoa 1 Da liễu ĐH Y Hà Nội với 12 năm kinh nghiệm lâm sàng trong điều trị mụn trứng cá nặng, thâm đỏ PIE, phục hồi màng bảo vệ da tổn thương sau kem trộn corticoid và phác đồ cá nhân hóa bằng dược mỹ phẩm chuẩn y khoa.",
  education: [
    "Thủ khoa Bác sĩ Đa khoa - Đại học Y Dược TP. Hồ Chí Minh (2014)",
    "Bác sĩ Chuyên khoa I Da liễu - Đại học Y Hà Nội (2018)",
    "Tu nghiệp chuyên sâu Da liễu Thẩm mỹ & Laser tại Seoul National University Hospital (Hàn Quốc)",
  ],
  certifications: [
    "Chứng chỉ Hành nghề Y khoa số 014289/BYT-CCHN do Bộ Y tế cấp",
    "Chứng chỉ Ứng dụng Laser & Thiết bị Phát năng lượng trong Da liễu (BV Da liễu TW)",
    "Thành viên Hội Da liễu Việt Nam (VAD) & Hội Da liễu Châu Á (ADC)",
  ],
  consultationHours: "Thứ 2 - Thứ 7: 08:30 - 20:30 (Trực cấp cứu online 24/7)",
  phone: "024 3828 9999",
  zalo: "0912 345 678",
  email: "bacsi.hoa@skinsense.vn",
  clinicAddress: "Tầng 3, Trung tâm Y khoa SkinSense Clinic, 182 Lê Duẩn, Hà Nội",
  stats: {
    patientsTreated: 1450,
    successRate: 99.4,
    routinesPrescribed: 4280,
    rating: 4.98,
  },
};

// Initial realistic Patient Cases
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
    symptoms: "Bùng phát nhiều mụn bọc viêm đỏ và mụn mủ ở 2 bên má và vùng cằm sau khi thử cushion mới và thức khuya thi học kỳ. Có cảm giác rát châm chích khi rửa mặt với nước ấm.",
    previousCosmetics: "Dùng kem trộn trắng da 1 năm trước, hiện đang dùng sữa rửa mặt tạo bọt mạnh và cồn tẩy trang.",
    allergies: "Dị ứng hương liệu nhân tạo (Fragrance) và cồn khô nồng độ cao.",
    skinPhotoUrl: "/demo-photos/portrait.jpg",
    aiAnalysis: {
      skinHealthScore: 42,
      rednessIndex: 74,
      inflammatorySpots: 18,
      comedoneSpots: 24,
      primaryConcerns: ["Mụn viêm diện rộng", "Tổn thương màng lipid", "Thâm đỏ PIE"],
      affectedZones: ["Má trái", "Má phải", "Vùng cằm"],
    },
    currentRoutine: {
      routineTitle: "Phác đồ Cấp cứu Hàng rào Bảo vệ Da & Giảm Viêm Đỏ Cấp tốc (14 ngày)",
      prescribedDate: "14/11/2026",
      startDate: "15/11/2026",
      revisitDate: "29/11/2026",
      doctorNotes: "Tạm ngưng toàn bộ đồ makeup và tẩy trang dạng dầu trong 14 ngày. Uống đủ 2L nước mỗi ngày, ngủ trước 23h. Nếu thấy ngứa rát thì chỉ dùng nước muối sinh lý và kem A-Derma.",
      products: [
        {
          id: "rp_01",
          name: "Sữa rửa mặt dưỡng ẩm sâu CeraVe Hydrating Cleanser",
          brand: "CeraVe Skincare (Mỹ)",
          category: "Làm sạch dịu nhẹ",
          imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Ceramides 1, 3, 6-II, Hyaluronic Acid",
          stepTime: "both",
          stepNumber: 1,
          dosage: "1 pump vừa đủ",
          usageGuide: "Rửa nhẹ bằng nước ấm, không dùng bọt biển cọ xát. Thấm khô bằng khăn sạch.",
        },
        {
          id: "rp_02",
          name: "Serum phục hồi & cấp nước La Roche-Posay Hyalu B5",
          brand: "La Roche-Posay (Pháp)",
          category: "Phục hồi cấp ẩm",
          imageUrl: "https://images.unsplash.com/photo-1608248597359-59828d5d4d3d?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Vitamin B5 (Panthenol 5%), Madecassoside",
          stepTime: "both",
          stepNumber: 2,
          dosage: "3 giọt tinh chất",
          usageGuide: "Vỗ nhẹ khi da còn ẩm để giữ nước tối đa cho lớp biểu bì.",
        },
        {
          id: "rp_03",
          name: "Kem dưỡng ẩm làm dịu cấp cứu A-Derma Dermalibour+ CICA",
          brand: "A-Derma (Pháp)",
          category: "Khóa ẩm & Kháng viêm",
          imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Chiết xuất yến mạch Rhealba, Đồng & Kẽm Sulfate",
          stepTime: "both",
          stepNumber: 3,
          dosage: "1 lượng bằng hạt đậu xanh",
          usageGuide: "Thoa lớp mỏng đều khắp mặt, tập trung vùng má đỏ rát.",
        },
        {
          id: "rp_04",
          name: "Kem chống nắng kiểm soát bóng dầu La Roche-Posay Anthelios UVMune 400",
          brand: "La Roche-Posay (Pháp)",
          category: "Bảo vệ quang phổ rộng",
          imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Mexoryl 400, SPF50+ PA++++",
          stepTime: "morning",
          stepNumber: 4,
          dosage: "2 đốt ngón tay trỏ",
          usageGuide: "Thoa mỗi sáng trước khi ra đường 20 phút. Thoa lại vào buổi trưa.",
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
    symptoms: "Vùng chữ T tiết dầu nhiều, sợi bã nhờn đậm màu quanh cánh mũi, mụn đầu đen ở trán và một số nốt mụn viêm sưng ở cằm do cạo râu.",
    previousCosmetics: "Chỉ dùng nước lã rửa mặt, thỉnh thoảng dùng xà bông tắm rửa mặt.",
    allergies: "Chưa ghi nhận dị ứng.",
    skinPhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    aiAnalysis: {
      skinHealthScore: 56,
      rednessIndex: 48,
      inflammatorySpots: 8,
      comedoneSpots: 32,
      primaryConcerns: ["Bít tắc lỗ chân lông", "Sợi bã nhờn oxy hóa", "Viêm nang lông vùng cằm"],
      affectedZones: ["Vùng trán", "Cánh mũi", "Cằm"],
    },
  },
  {
    id: "case_003",
    caseCode: "BA-2026-1105",
    patientName: "Vũ Thu Trang",
    patientAge: 28,
    patientGender: "Nữ",
    phone: "0934 567 890",
    skinType: "Da tổn thương sau treatment, lộ mao mạch",
    submittedDate: "10/11/2026",
    severity: "severe",
    status: "in_treatment",
    symptoms: "Da bỏng rát dữ dội sau khi tự ý peel BHA 30% tại nhà mua trên mạng. Da ửng đỏ như tôm luộc, căng bóng bất thường và rỉ dịch nhẹ ở cánh mũi.",
    previousCosmetics: "Dùng Salicylic Acid 30% không rõ nguồn gốc.",
    allergies: "Dị ứng Retinol và dẫn xuất Vitamin A.",
    skinPhotoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    aiAnalysis: {
      skinHealthScore: 28,
      rednessIndex: 88,
      inflammatorySpots: 12,
      comedoneSpots: 6,
      primaryConcerns: ["Bỏng hóa chất biểu bì", "Giãn mao mạch cấp tính", "Mất nước xuyên biểu bì"],
      affectedZones: ["Má trái", "Má phải", "Cánh mũi"],
    },
    currentRoutine: {
      routineTitle: "Phác đồ Cấp cứu Phục hồi Biểu bì & Hạ nhiệt Khẩn cấp (7 ngày)",
      prescribedDate: "10/11/2026",
      startDate: "11/11/2026",
      revisitDate: "18/11/2026",
      doctorNotes: "Không rửa mặt bằng bất kỳ loại sữa rửa mặt nào, chỉ dùng gạc tẩm nước muối sinh lý 0.9% đắp 10 phút. Bôi kem A-Derma dày ngày 3 lần.",
      products: [
        {
          id: "rp_05",
          name: "Kem dưỡng ẩm làm dịu cấp cứu A-Derma Dermalibour+ CICA",
          brand: "A-Derma (Pháp)",
          category: "Kem dưỡng phục hồi",
          imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
          activeIngredients: "Đồng Sulfate, Kẽm Sulfate, Yến mạch Rhealba",
          stepTime: "both",
          stepNumber: 1,
          dosage: "Thoa dày như mặt nạ ngủ",
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
    skinType: "Da hỗn hợp, mụn tuổi dậy thì",
    submittedDate: "13/11/2026",
    severity: "mild",
    status: "pending_routine",
    symptoms: "Nổi mụn cám li ti ở trán và vài nốt mụn viêm nhỏ trước kỳ kinh nguyệt. Da có thâm sau mụn cũ mờ chậm.",
    previousCosmetics: "Sữa rửa mặt trà xanh, nước hoa hồng không cồn.",
    allergies: "Không có dị ứng đặc biệt.",
    skinPhotoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    aiAnalysis: {
      skinHealthScore: 68,
      rednessIndex: 38,
      inflammatorySpots: 5,
      comedoneSpots: 14,
      primaryConcerns: ["Mụn viêm nhẹ", "Thâm đỏ sau mụn", "Lỗ chân lông vùng mũi"],
      affectedZones: ["Vùng trán", "Cằm"],
    },
  },
];

export default function SpecialistPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"records" | "routines" | "profile" | "patient_view">("records");

  // Mode switcher: Doctor View vs Patient View
  const [viewMode, setViewMode] = useState<"doctor" | "patient">("doctor");

  // Doctor state
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>(INITIAL_DOCTOR_PROFILE);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Profile edit form state
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
  const [customProdDosage, setCustomProdDosage] = useState("1 lượng hạt đậu");
  const [customProdUsage, setCustomProdUsage] = useState("Thoa sau bước làm sạch 10 phút, vỗ nhẹ cho thẩm thấu.");

  // Patient view interaction state (ticked steps)
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

  // Handle open Prescribe Routine Modal for a specific patient
  function handleOpenPrescribeModal(patientCase: PatientCase) {
    setPrescribeTargetCase(patientCase);
    if (patientCase.currentRoutine) {
      setRoutineTitleInput(patientCase.currentRoutine.routineTitle);
      setStartDateInput(patientCase.currentRoutine.startDate);
      setRevisitDateInput(patientCase.currentRoutine.revisitDate);
      setDoctorNotesInput(patientCase.currentRoutine.doctorNotes);
      setModalProducts([...patientCase.currentRoutine.products]);
    } else {
      setRoutineTitleInput(`Phác đồ điều trị da liễu cá nhân hóa cho ${patientCase.patientName} (14 ngày)`);
      setStartDateInput(new Date().toISOString().split("T")[0]);
      setRevisitDateInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      setDoctorNotesInput("Tuân thủ đúng thứ tự bước thoa sáng và tối. Nếu có phản ứng kích ứng bất thường, vui lòng chụp ảnh cập nhật qua SkinSense.");
      // Preload 2 gentle standard products
      setModalProducts([
        {
          id: `prod_${Date.now()}_1`,
          ...PRESET_PRODUCTS[0],
          stepNumber: 1,
        },
        {
          id: `prod_${Date.now()}_2`,
          ...PRESET_PRODUCTS[1],
          stepNumber: 2,
        },
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
        note: preset.note,
      };
    } else {
      if (!customProdName.trim()) {
        toast.error("Vui lòng nhập tên sản phẩm!");
        return;
      }
      if (!customProdImage.trim()) {
        toast.error("Vui lòng cung cấp link ảnh sản phẩm (Yêu cầu bắt buộc)!");
        return;
      }
      newProd = {
        id: `prod_${Date.now()}`,
        name: customProdName.trim(),
        brand: customProdBrand.trim() || "Dược mỹ phẩm chính hãng",
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
    toast.success(`Đã thêm sản phẩm "${newProd.name}" vào Routine!`);
  }

  // Remove product from routine
  function handleRemoveProduct(id: string) {
    setModalProducts((prev) => prev.filter((p) => p.id !== id).map((p, idx) => ({ ...p, stepNumber: idx + 1 })));
    toast.info("Đã xóa sản phẩm khỏi phác đồ.");
  }

  // Save Routine to Patient Case
  function handleSaveRoutineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prescribeTargetCase) return;

    if (modalProducts.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm kèm ảnh vào phác đồ!");
      return;
    }

    const updatedRoutine = {
      routineTitle: routineTitleInput.trim() || `Phác đồ điều trị ${prescribeTargetCase.patientName}`,
      prescribedDate: new Date().toLocaleDateString("vi-VN"),
      startDate: startDateInput,
      revisitDate: revisitDateInput,
      doctorNotes: doctorNotesInput.trim(),
      products: modalProducts,
    };

    setPatientCases((prev) =>
      prev.map((c) =>
        c.id === prescribeTargetCase.id
          ? {
              ...c,
              status: "in_treatment",
              currentRoutine: updatedRoutine,
            }
          : c,
      ),
    );

    // Update doctor stats
    setDoctorProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        routinesPrescribed: prev.stats.routinesPrescribed + 1,
      },
    }));

    setIsPrescribeModalOpen(false);
    toast.success(`Đã kê thành công Routine có ảnh sản phẩm cho bệnh nhân ${prescribeTargetCase.patientName}!`);
  }

  // Save Doctor Profile changes
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

  // Format date helper
  function formatDateVi(dateStr: string) {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  // Primary active patient for Patient View demo
  const activePatientCase = patientCases[0];

  return (
    <div className="min-h-screen bg-[#E8E5DE] text-[#191B19] antialiased">
      {/* Top Professional Header */}
      <header className="sticky top-0 z-40 border-b border-[#D8D4CA] bg-[#E8E5DE]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <LogoMark className="size-8 transition group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-[#191B19] leading-tight">
                  SkinSense <span className="text-[#2D5A43] font-sans text-xs tracking-normal font-semibold">CLINICAL</span>
                </span>
                <span className="text-[11px] font-medium text-[#5C605C]">
                  Phân hệ Bác sĩ Da liễu & Kê Routine
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-[#D8D4CA]" />

            {/* Doctor Identity Badge */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#2D5A43]/30 bg-[#2D5A43]/10 px-3 py-1 text-xs font-medium text-[#2D5A43]">
              <Stethoscope className="size-3.5" />
              <span>{doctorProfile.name}</span>
              <span className="text-[10px] opacity-75">({doctorProfile.licenseNumber})</span>
            </div>
          </div>

          {/* Right Mode Switcher & Home return */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Doctor View vs Patient View */}
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
              className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CA] bg-[#F6F4EF] px-3 py-1.5 text-xs font-medium text-[#5C605C] transition hover:border-[#191B19]/30 hover:text-[#191B19]"
            >
              <Home className="size-3.5" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {/* DOCTOR VIEW SECTION */}
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
                  <span>Hồ sơ Bác sĩ (Profile)</span>
                </button>
              </div>

              {/* Quick Action Button */}
              <button
                type="button"
                onClick={() => handleOpenPrescribeModal(patientCases[0])}
                className="flex items-center gap-2 rounded-xl bg-[#2D5A43] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#234835] active:scale-[0.98] cursor-pointer"
              >
                <Plus className="size-4" />
                <span>+ Kê Phác đồ Routine Mới</span>
              </button>
            </div>

            {/* TAB 1: BỆNH ÁN GỬI VỀ */}
            {activeTab === "records" && (
              <div className="space-y-6">
                {/* Clinical Stat Summary Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-[#5C605C]">
                      <span>Tổng ca bệnh án</span>
                      <FileText className="size-4 text-[#2D5A43]" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-[#191B19]">
                      {patientCases.length}
                    </div>
                    <div className="mt-1 text-[11px] text-[#2D5A43] font-medium">
                      +2 ca khám gửi về hôm nay
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-[#5C605C]">
                      <span>Chờ lên phác đồ</span>
                      <Clock className="size-4 text-[#78350F]" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-[#78350F]">
                      {patientCases.filter((c) => c.status === "pending_routine").length}
                    </div>
                    <div className="mt-1 text-[11px] text-[#78350F] font-medium">
                      Cần bác sĩ xử lý sớm
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-[#5C605C]">
                      <span>Đang điều trị</span>
                      <Activity className="size-4 text-[#2D5A43]" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-[#2D5A43]">
                      {patientCases.filter((c) => c.status === "in_treatment").length}
                    </div>
                    <div className="mt-1 text-[11px] text-[#5C605C]">
                      Theo dõi tiến trình 14 ngày
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-[#5C605C]">
                      <span>Tỷ lệ đáp ứng điều trị</span>
                      <ShieldCheck className="size-4 text-[#2D5A43]" />
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-[#191B19]">
                      98.6%
                    </div>
                    <div className="mt-1 text-[11px] text-[#2D5A43] font-medium">
                      Giảm viêm & gom cồi rõ rệt
                    </div>
                  </div>
                </div>

                {/* Filter and Search toolbar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#5C605C]" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên bệnh nhân, số điện thoại, mã bệnh án (BA-2026)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white py-2 pl-10 pr-4 text-xs text-[#191B19] placeholder:text-[#5C605C]/70 focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]">
                      <Filter className="size-3.5 text-[#5C605C]" />
                      <span className="text-[#5C605C]">Trạng thái:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-xs font-medium text-[#191B19] focus:outline-none cursor-pointer"
                      >
                        <option value="all">Tất cả ({patientCases.length})</option>
                        <option value="pending_routine">Chờ lên phác đồ</option>
                        <option value="in_treatment">Đang điều trị</option>
                        <option value="completed">Đã hoàn thành</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs text-[#191B19]">
                      <span className="text-[#5C605C]">Mức độ:</span>
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-transparent text-xs font-medium text-[#191B19] focus:outline-none cursor-pointer"
                      >
                        <option value="all">Tất cả</option>
                        <option value="severe">Nặng / Bùng phát</option>
                        <option value="moderate">Trung bình</option>
                        <option value="mild">Nhẹ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Patient Case Files List */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredCases.map((patientCase) => (
                    <div
                      key={patientCase.id}
                      className="flex flex-col justify-between rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-2xs transition hover:border-[#2D5A43]/50 hover:shadow-xs"
                    >
                      <div className="space-y-4">
                        {/* Header: Patient Info + Severity Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-[#D8D4CA] bg-neutral-200">
                              <img
                                src={patientCase.skinPhotoUrl}
                                alt={patientCase.patientName}
                                className="size-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-[#191B19]">
                                  {patientCase.patientName}
                                </h3>
                                <span className="text-xs text-[#5C605C]">
                                  ({patientCase.patientAge} tuổi • {patientCase.patientGender})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5C605C]">
                                <span className="font-mono font-medium text-[#191B19]">
                                  {patientCase.caseCode}
                                </span>
                                <span>•</span>
                                <span>Gửi: {patientCase.submittedDate}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex flex-col items-end gap-1">
                            {patientCase.status === "in_treatment" ? (
                              <span className="rounded-full bg-[#2D5A43]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#2D5A43]">
                                ● Đang điều trị
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#78350F]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#78350F]">
                                ⏳ Chờ kê Routine
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
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
                                ? "Mức độ: Trung bình"
                                : "Mức độ: Nhẹ"}
                            </span>
                          </div>
                        </div>

                        {/* Skin Symptoms & AI Telehealth Indices */}
                        <div className="rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] p-3 text-xs space-y-2">
                          <div>
                            <span className="font-semibold text-[#191B19]">Triệu chứng gửi về: </span>
                            <span className="text-[#5C605C]">{patientCase.symptoms}</span>
                          </div>
                          <div className="text-[11px]">
                            <span className="font-semibold text-[#191B19]">Loại da: </span>
                            <span className="text-[#5C605C]">{patientCase.skinType}</span>
                            <span className="mx-1.5">•</span>
                            <span className="font-semibold text-[#191B19]">Dị ứng: </span>
                            <span className="text-rose-700">{patientCase.allergies}</span>
                          </div>
                        </div>

                        {/* AI Skin Analysis Metrics Bar */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="rounded-lg border border-[#D8D4CA] bg-white p-2">
                            <span className="block text-[10px] text-[#5C605C]">Điểm da</span>
                            <span className="text-sm font-bold text-[#191B19]">
                              {patientCase.aiAnalysis.skinHealthScore}/100
                            </span>
                          </div>
                          <div className="rounded-lg border border-[#D8D4CA] bg-white p-2">
                            <span className="block text-[10px] text-[#5C605C]">Chỉ số đỏ (PIE)</span>
                            <span className="text-sm font-bold text-rose-700">
                              {patientCase.aiAnalysis.rednessIndex}%
                            </span>
                          </div>
                          <div className="rounded-lg border border-[#D8D4CA] bg-white p-2">
                            <span className="block text-[10px] text-[#5C605C]">Mụn viêm</span>
                            <span className="text-sm font-bold text-amber-800">
                              {patientCase.aiAnalysis.inflammatorySpots}
                            </span>
                          </div>
                          <div className="rounded-lg border border-[#D8D4CA] bg-white p-2">
                            <span className="block text-[10px] text-[#5C605C]">Mụn ẩn/đầu đen</span>
                            <span className="text-sm font-bold text-[#5C605C]">
                              {patientCase.aiAnalysis.comedoneSpots}
                            </span>
                          </div>
                        </div>

                        {/* Current Routine Preview if prescribed */}
                        {patientCase.currentRoutine && (
                          <div className="rounded-xl border border-[#2D5A43]/20 bg-[#2D5A43]/5 p-3 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#2D5A43] flex items-center gap-1.5">
                                <Sparkles className="size-3.5" />
                                {patientCase.currentRoutine.routineTitle}
                              </span>
                              <span className="text-[10px] font-mono text-[#5C605C]">
                                Tái khám: {formatDateVi(patientCase.currentRoutine.revisitDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                              {patientCase.currentRoutine.products.map((prod) => (
                                <div
                                  key={prod.id}
                                  className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CA] bg-white px-2 py-1 shrink-0"
                                >
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    className="size-6 object-cover rounded-md"
                                  />
                                  <span className="text-[10px] font-medium text-[#191B19] max-w-[120px] truncate">
                                    {prod.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons footer */}
                      <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-[#D8D4CA]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCase(patientCase);
                            setIsCaseDetailOpen(true);
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs font-semibold text-[#191B19] transition hover:bg-[#E8E5DE] cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                          <span>Xem Bệnh án & Ảnh soi da</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenPrescribeModal(patientCase)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#234835] active:scale-[0.98] cursor-pointer"
                        >
                          <Plus className="size-3.5" />
                          <span>
                            {patientCase.currentRoutine ? "Cập nhật Routine" : "Kê Routine ngay"}
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
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-[#191B19]">
                        Danh sách Phác đồ Skincare Routine đã kê
                      </h2>
                      <p className="text-xs text-[#5C605C] mt-0.5">
                        Mỗi phác đồ gồm các sản phẩm có ảnh thật sắc nét, hướng dẫn liều lượng và ngày bắt đầu/tái khám.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPrescribeModal(patientCases[0])}
                      className="flex items-center gap-2 rounded-xl bg-[#2D5A43] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>Kê Phác đồ Mới</span>
                    </button>
                  </div>

                  {/* Active Prescribed Routines Cards */}
                  <div className="space-y-6">
                    {patientCases
                      .filter((c) => c.currentRoutine)
                      .map((patientCase) => {
                        const routine = patientCase.currentRoutine!;
                        return (
                          <div
                            key={patientCase.id}
                            className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-5 shadow-2xs space-y-4"
                          >
                            {/* Card Header: Patient & Dates */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#D8D4CA] pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-[#191B19]">
                                    {routine.routineTitle}
                                  </span>
                                  <span className="rounded-full bg-[#2D5A43]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#2D5A43]">
                                    {patientCase.patientName} ({patientCase.caseCode})
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[#5C605C] mt-1">
                                  <span className="flex items-center gap-1 font-mono">
                                    <Calendar className="size-3.5 text-[#2D5A43]" />
                                    Ngày bắt đầu: <strong>{formatDateVi(routine.startDate)}</strong>
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-mono text-[#78350F]">
                                    <Clock className="size-3.5" />
                                    Hẹn tái khám: <strong>{formatDateVi(routine.revisitDate)}</strong>
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenPrescribeModal(patientCase)}
                                className="flex items-center gap-1.5 rounded-lg border border-[#D8D4CA] bg-white px-3 py-1.5 text-xs font-semibold text-[#191B19] hover:bg-[#E8E5DE] cursor-pointer"
                              >
                                <Edit3 className="size-3.5" />
                                <span>Chỉnh sửa phác đồ</span>
                              </button>
                            </div>

                            {/* Doctor Clinical Notes */}
                            {routine.doctorNotes && (
                              <div className="rounded-xl bg-white border border-[#D8D4CA] p-3 text-xs">
                                <span className="font-bold text-[#2D5A43]">Lời dặn của Bác sĩ Hoa: </span>
                                <span className="text-[#5C605C]">{routine.doctorNotes}</span>
                              </div>
                            )}

                            {/* Products Grid with Photo, Actives, Usage Guide */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                                Các sản phẩm trong phác đồ ({routine.products.length} sản phẩm có ảnh):
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {routine.products.map((prod) => (
                                  <div
                                    key={prod.id}
                                    className="flex gap-3.5 rounded-xl border border-[#D8D4CA] bg-white p-3.5 shadow-2xs hover:border-[#2D5A43]/40 transition"
                                  >
                                    {/* Product Image Thumbnail */}
                                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-[#D8D4CA] bg-neutral-100">
                                      <img
                                        src={prod.imageUrl}
                                        alt={prod.name}
                                        className="size-full object-cover"
                                      />
                                      <span className="absolute bottom-1 right-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                        Bước {prod.stepNumber}
                                      </span>
                                    </div>

                                    {/* Product Clinical Details */}
                                    <div className="flex-1 space-y-1 text-xs">
                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-bold text-[#191B19] leading-tight">
                                          {prod.name}
                                        </h5>
                                        <span className="shrink-0 rounded-md bg-[#2D5A43]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2D5A43]">
                                          {prod.stepTime === "morning"
                                            ? "☀️ Buổi sáng"
                                            : prod.stepTime === "evening"
                                            ? "🌙 Buổi tối"
                                            : "☀️ Sáng & 🌙 Tối"}
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-[#5C605C]">
                                        <span className="font-semibold text-[#78350F]">{prod.brand}</span>
                                        <span className="mx-1">•</span>
                                        <span>{prod.category}</span>
                                      </div>

                                      <div className="text-[11px] text-[#191B19] bg-[#F6F4EF] rounded-md px-2 py-1 font-mono">
                                        Hoạt chất: {prod.activeIngredients}
                                      </div>

                                      <div className="text-[11px] pt-1">
                                        <span className="font-semibold text-[#2D5A43]">Liều dùng: </span>
                                        <span className="text-[#5C605C]">{prod.dosage}</span>
                                      </div>

                                      <div className="text-[11px]">
                                        <span className="font-semibold text-[#2D5A43]">Cách dùng: </span>
                                        <span className="text-[#5C605C]">{prod.usageGuide}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: HỒ SƠ BÁC SĨ (PROFILE) */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-2xs space-y-6">
                  {/* Doctor Profile Header Card */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#D8D4CA] pb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl border-2 border-[#2D5A43]/40 shadow-xs">
                        <img
                          src={doctorProfile.avatarUrl}
                          alt={doctorProfile.name}
                          className="size-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 rounded-full bg-[#2D5A43] p-1 text-white">
                          <Check className="size-3" />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-xl font-bold text-[#191B19]">{doctorProfile.name}</h2>
                          <span className="rounded-full bg-[#2D5A43]/15 px-3 py-0.5 text-xs font-bold text-[#2D5A43]">
                            Bác sĩ Da liễu chính
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#78350F]">{doctorProfile.title}</p>
                        <p className="text-xs text-[#5C605C] flex items-center justify-center sm:justify-start gap-1">
                          <MapPin className="size-3.5 text-[#2D5A43]" />
                          <span>{doctorProfile.hospital}</span>
                        </p>
                        <p className="text-xs font-mono text-[#5C605C]">
                          Chứng chỉ hành nghề: <strong>{doctorProfile.licenseNumber}</strong> • {doctorProfile.experienceYears} năm kinh nghiệm
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditProfileOpen(true)}
                      className="flex items-center gap-2 rounded-xl bg-[#191B19] px-4 py-2.5 text-xs font-semibold text-[#FAF8F5] shadow-xs hover:bg-neutral-800 transition cursor-pointer self-stretch sm:self-auto justify-center"
                    >
                      <Edit3 className="size-4" />
                      <span>Chỉnh sửa thông tin Bác sĩ</span>
                    </button>
                  </div>

                  {/* Doctor Clinical Achievements Metrics */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 text-center">
                      <span className="text-xs text-[#5C605C]">Bệnh nhân đã điều trị</span>
                      <div className="mt-1 text-2xl font-bold text-[#2D5A43]">
                        {doctorProfile.stats.patientsTreated}+
                      </div>
                      <span className="text-[10px] text-[#5C605C]">Trên toàn quốc</span>
                    </div>

                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 text-center">
                      <span className="text-xs text-[#5C605C]">Tỷ lệ khỏi bệnh</span>
                      <div className="mt-1 text-2xl font-bold text-[#191B19]">
                        {doctorProfile.stats.successRate}%
                      </div>
                      <span className="text-[10px] text-[#2D5A43] font-medium">Đạt chuẩn y khoa</span>
                    </div>

                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 text-center">
                      <span className="text-xs text-[#5C605C]">Phác đồ Routine đã kê</span>
                      <div className="mt-1 text-2xl font-bold text-[#78350F]">
                        {doctorProfile.stats.routinesPrescribed}
                      </div>
                      <span className="text-[10px] text-[#5C605C]">Cá nhân hóa theo từng ca</span>
                    </div>

                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 text-center">
                      <span className="text-xs text-[#5C605C]">Đánh giá từ người bệnh</span>
                      <div className="mt-1 text-2xl font-bold text-amber-800">
                        ⭐ {doctorProfile.stats.rating}/5.0
                      </div>
                      <span className="text-[10px] text-[#5C605C]">99% hài lòng</span>
                    </div>
                  </div>

                  {/* Detailed Biography, Education & Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    {/* Left: Biography & Philosophy */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-5 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#191B19] flex items-center gap-2">
                          <Info className="size-4 text-[#2D5A43]" />
                          Tiểu sử chuyên môn & Triết lý điều trị
                        </h3>
                        <p className="text-xs leading-relaxed text-[#5C605C]">
                          {doctorProfile.bio}
                        </p>
                      </div>

                      {/* Education & Accreditations */}
                      <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-5 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#191B19] flex items-center gap-2">
                          <Award className="size-4 text-[#78350F]" />
                          Quá trình đào tạo & Bằng cấp chuyên khoa
                        </h3>
                        <ul className="space-y-2 text-xs text-[#5C605C]">
                          {doctorProfile.education.map((edu, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="size-3.5 text-[#2D5A43] shrink-0 mt-0.5" />
                              <span>{edu}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-2 border-t border-[#D8D4CA]">
                          <span className="block text-[11px] font-bold text-[#191B19] mb-1.5">
                            Chứng chỉ chuyên môn:
                          </span>
                          <ul className="space-y-1.5 text-xs text-[#5C605C]">
                            {doctorProfile.certifications.map((cert, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="size-1.5 rounded-full bg-[#78350F] shrink-0 mt-1.5" />
                                <span>{cert}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Right: Contact & Clinic Consultation Hours */}
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-5 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#191B19] flex items-center gap-2">
                          <Clock className="size-4 text-[#2D5A43]" />
                          Lịch tư vấn & Khám da
                        </h3>
                        <div className="rounded-xl bg-white border border-[#D8D4CA] p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between text-[#191B19]">
                            <span>Khám trực tuyến:</span>
                            <span className="font-semibold text-[#2D5A43]">{doctorProfile.consultationHours}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#191B19]">
                            <span>Địa chỉ phòng khám:</span>
                            <span className="font-medium text-[11px] text-[#5C605C] text-right">
                              {doctorProfile.clinicAddress}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <a
                            href={`tel:${doctorProfile.phone}`}
                            className="flex items-center gap-2 rounded-xl border border-[#D8D4CA] bg-white p-2.5 text-xs font-semibold text-[#191B19] hover:bg-[#E8E5DE] transition"
                          >
                            <Phone className="size-4 text-[#2D5A43]" />
                            <span>Hotline: {doctorProfile.phone}</span>
                          </a>

                          <div className="flex items-center gap-2 rounded-xl border border-[#D8D4CA] bg-white p-2.5 text-xs font-semibold text-[#191B19]">
                            <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                              Zalo
                            </span>
                            <span>Tư vấn ca da liễu: {doctorProfile.zalo}</span>
                          </div>

                          <a
                            href={`mailto:${doctorProfile.email}`}
                            className="flex items-center gap-2 rounded-xl border border-[#D8D4CA] bg-white p-2.5 text-xs font-semibold text-[#191B19] hover:bg-[#E8E5DE] transition"
                          >
                            <Mail className="size-4 text-[#78350F]" />
                            <span>{doctorProfile.email}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PATIENT VIEW / USER PERSPECTIVE SECTION */}
        {viewMode === "patient" && (
          <div className="space-y-6">
            {/* Patient Header Banner */}
            <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8D4CA] pb-4">
                <div>
                  <span className="rounded-full bg-[#78350F]/15 px-3 py-1 text-xs font-bold text-[#78350F]">
                    Góc nhìn Bệnh nhân / Khách hàng
                  </span>
                  <h2 className="text-xl font-bold text-[#191B19] mt-2">
                    Hồ sơ Bệnh án & Phác đồ Routine của {activePatientCase.patientName}
                  </h2>
                  <p className="text-xs text-[#5C605C] mt-0.5">
                    Mã hồ sơ: <strong>{activePatientCase.caseCode}</strong> • Ngày gửi khám: {activePatientCase.submittedDate}
                  </p>
                </div>

                {/* Assigned Doctor Card */}
                <div className="flex items-center gap-3 rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-3 shadow-2xs">
                  <img
                    src={doctorProfile.avatarUrl}
                    alt={doctorProfile.name}
                    className="size-12 rounded-xl object-cover border border-[#2D5A43]"
                  />
                  <div>
                    <span className="block text-[10px] text-[#5C605C]">Bác sĩ phụ trách:</span>
                    <span className="font-bold text-xs text-[#191B19]">{doctorProfile.name}</span>
                    <span className="block text-[10px] text-[#2D5A43] font-medium">{doctorProfile.title}</span>
                  </div>
                </div>
              </div>

              {/* Patient AI Skin Snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative rounded-2xl border border-[#D8D4CA] bg-neutral-200 overflow-hidden min-h-[220px]">
                  <img
                    src={activePatientCase.skinPhotoUrl}
                    alt="Ảnh soi da"
                    className="size-full object-cover"
                  />
                  <div className="absolute top-2 left-2 rounded-lg bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                    Ảnh soi da AI mới nhất
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-white/90 p-2 text-[11px] backdrop-blur-xs">
                    <span className="font-bold text-[#191B19]">Chẩn đoán: </span>
                    <span className="text-rose-700 font-medium">Bùng mụn viêm & tổn thương màng bảo vệ da</span>
                  </div>
                </div>

                <div className="md:col-span-2 rounded-2xl border border-[#D8D4CA] bg-[#F6F4EF] p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#191B19] mb-2">
                      Chỉ số da SkinSense AI phân tích
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white p-3 border border-[#D8D4CA] text-center">
                        <span className="text-[10px] text-[#5C605C]">Độ đỏ da (PIE)</span>
                        <div className="text-xl font-bold text-rose-700">
                          {activePatientCase.aiAnalysis.rednessIndex}%
                        </div>
                        <span className="text-[9px] text-rose-600">Cần làm dịu</span>
                      </div>

                      <div className="rounded-xl bg-white p-3 border border-[#D8D4CA] text-center">
                        <span className="text-[10px] text-[#5C605C]">Mụn viêm</span>
                        <div className="text-xl font-bold text-amber-800">
                          {activePatientCase.aiAnalysis.inflammatorySpots} nốt
                        </div>
                        <span className="text-[9px] text-amber-700">Đang hoạt động</span>
                      </div>

                      <div className="rounded-xl bg-white p-3 border border-[#D8D4CA] text-center">
                        <span className="text-[10px] text-[#5C605C]">Sức khỏe biểu bì</span>
                        <div className="text-xl font-bold text-[#2D5A43]">
                          {activePatientCase.aiAnalysis.skinHealthScore}/100
                        </div>
                        <span className="text-[9px] text-[#2D5A43]">Hồi phục dần</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-[#D8D4CA] text-xs">
                    <span className="font-bold text-[#2D5A43]">Lời dặn của Bác sĩ Hoa: </span>
                    <span className="text-[#5C605C]">
                      {activePatientCase.currentRoutine?.doctorNotes || "Vui lòng tuân thủ đúng các bước phác đồ phía dưới."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prescribed Routine Checklist for Patient */}
            {activePatientCase.currentRoutine ? (
              <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#D8D4CA] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#191B19]">
                      {activePatientCase.currentRoutine.routineTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#5C605C]">
                      <span className="font-mono">
                        Bắt đầu: <strong>{formatDateVi(activePatientCase.currentRoutine.startDate)}</strong>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[#78350F] font-bold">
                        Hẹn tái khám: {formatDateVi(activePatientCase.currentRoutine.revisitDate)}
                      </span>
                    </div>
                  </div>

                  {/* Daily Routine Progress */}
                  <div className="rounded-xl border border-[#2D5A43]/30 bg-[#2D5A43]/10 px-4 py-2 text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#2D5A43]">
                      Tiến độ hoàn thành hôm nay
                    </span>
                    <div className="text-sm font-bold text-[#2D5A43]">
                      {
                        Object.values(patientTickedSteps).filter(Boolean).length
                      }{" "}
                      / {activePatientCase.currentRoutine.products.length} bước
                    </div>
                  </div>
                </div>

                {/* Routine Products with Real Photos & Step instructions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                    Các bước skincare theo thứ tự (Bác sĩ chỉ định):
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activePatientCase.currentRoutine.products.map((prod) => {
                      const isTicked = !!patientTickedSteps[prod.id];
                      return (
                        <div
                          key={prod.id}
                          className={`flex gap-4 rounded-2xl border p-4 transition shadow-2xs ${
                            isTicked
                              ? "border-[#2D5A43] bg-[#2D5A43]/5"
                              : "border-[#D8D4CA] bg-white hover:border-[#2D5A43]/40"
                          }`}
                        >
                          {/* Product Photo */}
                          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-[#D8D4CA] bg-neutral-100">
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="size-full object-cover"
                            />
                            <span className="absolute top-1 left-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                              Bước {prod.stepNumber}
                            </span>
                          </div>

                          {/* Product Info & Action */}
                          <div className="flex-1 flex flex-col justify-between text-xs space-y-1">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <h5 className="font-bold text-[#191B19] leading-tight">
                                  {prod.name}
                                </h5>
                                <span className="shrink-0 rounded-md bg-[#2D5A43]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2D5A43]">
                                  {prod.stepTime === "morning"
                                    ? "☀️ Buổi sáng"
                                    : prod.stepTime === "evening"
                                    ? "🌙 Buổi tối"
                                    : "☀️ Sáng & 🌙 Tối"}
                                </span>
                              </div>

                              <p className="text-[11px] text-[#78350F] font-medium mt-0.5">
                                {prod.brand}
                              </p>

                              <p className="text-[11px] text-[#5C605C] mt-1">
                                <strong className="text-[#191B19]">Liều lượng: </strong>
                                {prod.dosage}
                              </p>

                              <p className="text-[11px] text-[#5C605C] mt-0.5 leading-snug">
                                <strong className="text-[#2D5A43]">Cách dùng: </strong>
                                {prod.usageGuide}
                              </p>
                            </div>

                            {/* Tick Completion Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setPatientTickedSteps((prev) => ({
                                  ...prev,
                                  [prod.id]: !prev[prod.id],
                                }));
                                if (!isTicked) {
                                  toast.success(`Đã hoàn thành bước: ${prod.name}!`);
                                }
                              }}
                              className={`mt-2 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition cursor-pointer ${
                                isTicked
                                  ? "bg-[#2D5A43] text-white"
                                  : "border border-[#D8D4CA] bg-[#F6F4EF] text-[#5C605C] hover:text-[#191B19] hover:bg-[#E8E5DE]"
                              }`}
                            >
                              <Check className="size-3.5" />
                              <span>{isTicked ? "Đã dùng hôm nay ✓" : "Đánh dấu đã dùng"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D8D4CA] bg-white p-8 text-center text-xs text-[#5C605C]">
                Chưa có phác đồ Routine nào được kê. Bác sĩ Hoa sẽ sớm liên hệ và cập nhật phác đồ cho bạn!
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: XEM CHI TIẾT BỆNH ÁN & ẢNH SOI DA AI */}
      {isCaseDetailOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
              <div>
                <span className="font-mono text-xs text-[#5C605C]">{selectedCase.caseCode}</span>
                <h3 className="text-lg font-bold text-[#191B19]">
                  Hồ sơ Bệnh án Da liễu: {selectedCase.patientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCaseDetailOpen(false)}
                className="rounded-full p-1 text-[#5C605C] hover:bg-[#E8E5DE] hover:text-[#191B19] transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left: AI Photo Analysis */}
              <div className="space-y-3">
                <div className="relative rounded-2xl border border-[#D8D4CA] bg-black overflow-hidden h-[300px]">
                  <img
                    src={selectedCase.skinPhotoUrl}
                    alt={selectedCase.patientName}
                    className="size-full object-cover"
                  />
                  {/* AI Zones overlay badges */}
                  <div className="absolute top-2 left-2 rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                    Ảnh soi da Telehealth AI
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-white/95 p-2 text-xs backdrop-blur-xs space-y-1">
                    <span className="font-bold text-[#191B19] block">Vùng tổn thương phân tích:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedCase.aiAnalysis.affectedZones.map((zone, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-semibold"
                        >
                          {zone}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] p-3 text-xs space-y-1">
                  <span className="font-bold text-[#191B19]">Tình trạng dị ứng: </span>
                  <span className="text-rose-700 font-semibold">{selectedCase.allergies}</span>
                </div>
              </div>

              {/* Right: Clinical History & Metrics */}
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5 space-y-2">
                  <span className="font-bold text-[#191B19] block text-sm">
                    Thông tin Bệnh nhân
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[#5C605C]">
                    <div>Tuổi: <strong className="text-[#191B19]">{selectedCase.patientAge}</strong></div>
                    <div>Giới tính: <strong className="text-[#191B19]">{selectedCase.patientGender}</strong></div>
                    <div>SĐT: <strong className="text-[#191B19]">{selectedCase.phone}</strong></div>
                    <div>Loại da: <strong className="text-[#191B19]">{selectedCase.skinType}</strong></div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] p-3.5 space-y-1.5">
                  <span className="font-bold text-[#191B19] block">Triệu chứng & tiền sử mỹ phẩm</span>
                  <p className="text-[#5C605C] leading-relaxed">{selectedCase.symptoms}</p>
                  <p className="text-[11px] text-[#78350F] pt-1">
                    Lịch sử sản phẩm: {selectedCase.previousCosmetics}
                  </p>
                </div>

                {/* AI Scores */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl border border-[#D8D4CA] bg-white p-2.5">
                    <span className="text-[10px] text-[#5C605C]">Độ đỏ da (Redness Index)</span>
                    <div className="text-lg font-bold text-rose-700">
                      {selectedCase.aiAnalysis.rednessIndex}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#D8D4CA] bg-white p-2.5">
                    <span className="text-[10px] text-[#5C605C]">Sức khỏe biểu bì</span>
                    <div className="text-lg font-bold text-[#2D5A43]">
                      {selectedCase.aiAnalysis.skinHealthScore}/100
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCaseDetailOpen(false);
                      handleOpenPrescribeModal(selectedCase);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2D5A43] py-2.5 px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>Kê Phác đồ Routine cho ca này</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KÊ PHÁC ĐỒ ROUTINE (CÓ ẢNH SẢN PHẨM BẮT BUỘC, CÁCH DÙNG, NGÀY THÁNG) */}
      {isPrescribeModalOpen && prescribeTargetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
              <div>
                <span className="rounded-full bg-[#2D5A43]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#2D5A43]">
                  Phác đồ Da liễu Chuyên sâu
                </span>
                <h3 className="text-lg font-bold text-[#191B19] mt-1">
                  Kê Routine cho Bệnh nhân: {prescribeTargetCase.patientName} ({prescribeTargetCase.caseCode})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrescribeModalOpen(false)}
                className="rounded-full p-1 text-[#5C605C] hover:bg-[#E8E5DE] hover:text-[#191B19] transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoutineSubmit} className="space-y-5 text-xs">
              {/* Routine metadata: Title, Start Date, Revisit Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-[#191B19] font-semibold mb-1">
                    Tên Phác đồ Điều trị
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Phác đồ phục hồi màng bảo vệ da & giảm viêm đỏ (14 ngày)"
                    value={routineTitleInput}
                    onChange={(e) => setRoutineTitleInput(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#191B19] font-semibold mb-1 flex items-center gap-1">
                    <Calendar className="size-3.5 text-[#2D5A43]" />
                    <span>Ngày bắt đầu áp dụng</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[#191B19] font-semibold mb-1 flex items-center gap-1">
                    <Clock className="size-3.5 text-[#78350F]" />
                    <span>Ngày hẹn tái khám</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={revisitDateInput}
                    onChange={(e) => setRevisitDateInput(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Thời gian liệu trình</label>
                  <div className="rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3 py-2 text-xs font-semibold text-[#2D5A43]">
                    14 ngày (Giai đoạn cấp cứu & giảm viêm)
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[#191B19] font-semibold mb-1">
                    Lời dặn & Hướng dẫn y khoa của Bác sĩ Hoa
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Rửa tay sạch trước khi thoa, uống đủ 2L nước, tránh ánh nắng trực tiếp từ 10h-16h..."
                    value={doctorNotesInput}
                    onChange={(e) => setDoctorNotesInput(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>
              </div>

              {/* Products in Routine Section */}
              <div className="space-y-3 pt-2 border-t border-[#D8D4CA]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#191B19] flex items-center gap-1.5">
                      <ImageIcon className="size-4 text-[#2D5A43]" />
                      <span>Danh sách Sản phẩm Routine (Yêu cầu bắt buộc phải có ảnh)</span>
                    </h4>
                    <p className="text-[11px] text-[#5C605C]">
                      Hiện có {modalProducts.length} sản phẩm trong phác đồ này.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProductSource("preset");
                      setIsAddProductOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>+ Thêm sản phẩm có ảnh</span>
                  </button>
                </div>

                {/* Products List in Modal */}
                {modalProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {modalProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex gap-3 rounded-xl border border-[#D8D4CA] bg-white p-3 shadow-2xs relative group"
                      >
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-[#D8D4CA] bg-neutral-100">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="size-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/80 px-1 py-0.5 text-[8px] font-bold text-white">
                            #{prod.stepNumber}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="font-bold text-[#191B19] text-xs truncate">
                              {prod.name}
                            </h5>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(prod.id)}
                              className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <div className="text-[10px] text-[#5C605C]">
                            <span className="text-[#78350F] font-semibold">{prod.brand}</span>
                            <span className="mx-1">•</span>
                            <span>{prod.category}</span>
                          </div>

                          <div className="text-[10px] text-[#2D5A43] truncate font-medium">
                            Cách dùng: {prod.usageGuide}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#D8D4CA] bg-white p-6 text-center text-xs text-[#5C605C]">
                    Chưa có sản phẩm nào. Nhấp vào <strong>"+ Thêm sản phẩm có ảnh"</strong> để chọn từ thư viện dược mỹ phẩm hoặc nhập sản phẩm tùy ý!
                  </div>
                )}
              </div>

              {/* Submit footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8D4CA]">
                <button
                  type="button"
                  onClick={() => setIsPrescribeModalOpen(false)}
                  className="rounded-xl border border-[#D8D4CA] bg-white px-4 py-2.5 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2D5A43] px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] active:scale-[0.98] cursor-pointer"
                >
                  Xác nhận Kê Routine cho {prescribeTargetCase.patientName}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: CHỌN SẢN PHẨM CÓ ẢNH VÀO ROUTINE */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
              <div>
                <h4 className="text-base font-bold text-[#191B19]">
                  Thêm Sản phẩm vào Routine (Có ảnh sản phẩm)
                </h4>
                <p className="text-[11px] text-[#5C605C]">
                  Chọn từ danh mục dược mỹ phẩm chính hãng có sẵn ảnh hoặc tự dán ảnh sản phẩm tùy ý.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="rounded-full p-1 text-[#5C605C] hover:bg-[#E8E5DE] transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Switch Source: Preset vs Custom */}
            <div className="flex items-center rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] p-1">
              <button
                type="button"
                onClick={() => setProductSource("preset")}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                  productSource === "preset"
                    ? "bg-[#2D5A43] text-white shadow-xs"
                    : "text-[#5C605C] hover:text-[#191B19]"
                }`}
              >
                ✨ Chọn từ Thư viện Dược mỹ phẩm (Ảnh sắc nét)
              </button>
              <button
                type="button"
                onClick={() => setProductSource("custom")}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                  productSource === "custom"
                    ? "bg-[#2D5A43] text-white shadow-xs"
                    : "text-[#5C605C] hover:text-[#191B19]"
                }`}
              >
                + Tự nhập sản phẩm & URL ảnh
              </button>
            </div>

            {/* PRESET PRODUCT SELECTION */}
            {productSource === "preset" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto p-1">
                  {PRESET_PRODUCTS.map((prod, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPresetIndex(idx)}
                      className={`flex gap-3 rounded-xl border p-2.5 transition cursor-pointer ${
                        selectedPresetIndex === idx
                          ? "border-[#2D5A43] bg-[#2D5A43]/10 ring-1 ring-[#2D5A43]"
                          : "border-[#D8D4CA] bg-white hover:border-[#2D5A43]/50"
                      }`}
                    >
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="size-16 rounded-lg object-cover border border-[#D8D4CA] shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-xs space-y-0.5">
                        <h6 className="font-bold text-[#191B19] truncate leading-tight">
                          {prod.name}
                        </h6>
                        <span className="block text-[10px] text-[#78350F] font-semibold">
                          {prod.brand}
                        </span>
                        <span className="block text-[10px] text-[#5C605C] truncate">
                          {prod.category}
                        </span>
                        <span className="block text-[9px] font-mono text-[#2D5A43] truncate">
                          {prod.activeIngredients}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Preset Details Preview */}
                <div className="rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] p-3 text-xs space-y-1">
                  <span className="font-bold text-[#2D5A43]">
                    Cách dùng khuyến nghị từ Bác sĩ:
                  </span>
                  <p className="text-[#5C605C]">
                    {PRESET_PRODUCTS[selectedPresetIndex].usageGuide}
                  </p>
                </div>
              </div>
            )}

            {/* CUSTOM PRODUCT INPUT */}
            {productSource === "custom" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">
                    Tên sản phẩm mỹ phẩm
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Serum SkinCeuticals Discoloration Defense"
                    value={customProdName}
                    onChange={(e) => setCustomProdName(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Thương hiệu</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: SkinCeuticals, Obagi..."
                      value={customProdBrand}
                      onChange={(e) => setCustomProdBrand(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Thời điểm thoa</label>
                    <select
                      value={customProdTime}
                      onChange={(e) => setCustomProdTime(e.target.value as any)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none cursor-pointer"
                    >
                      <option value="both">Cả Sáng & Tối</option>
                      <option value="morning">Chỉ buổi Sáng ☀️</option>
                      <option value="evening">Chỉ buổi Tối 🌙</option>
                    </select>
                  </div>
                </div>

                {/* Photo URL with Instant Preview */}
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">
                    Link ảnh sản phẩm (URL) <span className="text-rose-600">* Bắt buộc</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/... hoặc link ảnh sản phẩm"
                      value={customProdImage}
                      onChange={(e) => setCustomProdImage(e.target.value)}
                      className="flex-1 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                    />
                    {customProdImage && (
                      <img
                        src={customProdImage}
                        alt="Preview"
                        className="size-10 rounded-lg object-cover border border-[#D8D4CA]"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">
                    Hoạt chất & Nồng độ
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tranexamic Acid 3%, Niacinamide 5%, Kojic Acid 1%"
                    value={customProdActives}
                    onChange={(e) => setCustomProdActives(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Liều lượng</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 3 giọt hoặc 1 hạt đậu"
                      value={customProdDosage}
                      onChange={(e) => setCustomProdDosage(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#191B19] font-semibold mb-1">Cách dùng chi tiết</label>
                    <input
                      type="text"
                      placeholder="Thoa sau bước làm sạch..."
                      value={customProdUsage}
                      onChange={(e) => setCustomProdUsage(e.target.value)}
                      className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sub-modal footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D8D4CA]">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="rounded-xl border border-[#D8D4CA] bg-white px-4 py-2 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddProductConfirm}
                className="rounded-xl bg-[#2D5A43] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
              >
                Thêm sản phẩm này vào Routine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA PROFILE BÁC SĨ */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#D8D4CA] pb-3">
              <h3 className="text-base font-bold text-[#191B19]">
                Chỉnh sửa Hồ sơ Bác sĩ Da liễu (Profile)
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="rounded-full p-1 text-[#5C605C] hover:bg-[#E8E5DE] transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Họ và Tên</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Chức danh y khoa</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
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
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#191B19] font-semibold mb-1">Link Ảnh đại diện</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="flex-1 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                  {editAvatar && (
                    <img
                      src={editAvatar}
                      alt="Avatar Preview"
                      className="size-10 rounded-xl object-cover border border-[#D8D4CA]"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#191B19] font-semibold mb-1">
                  Giới thiệu tiểu sử & Triết lý điều trị
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Zalo tư vấn</label>
                  <input
                    type="text"
                    value={editZalo}
                    onChange={(e) => setEditZalo(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#191B19] font-semibold mb-1">Giờ trực khám</label>
                  <input
                    type="text"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#191B19] focus:border-[#2D5A43] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D8D4CA]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="rounded-xl border border-[#D8D4CA] bg-white px-4 py-2 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2D5A43] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#234835] cursor-pointer"
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
