import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local
const envPath = resolve(process.cwd(), "apps/web/.env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2]?.replace(/^['"]|['"]$/g, "");
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("Đang đồng bộ dữ liệu Bác sĩ & Bệnh án lên Supabase Storage...");

  // 1. Specialists Registry
  const specialists = [
    {
      id: "f0ebf688-dc15-40fa-8711-5c89923044e8",
      email: "bacsi.hoa@skinsense.vn",
      name: "BS. CKI Nguyễn Mai Hoa",
      title: "Bác sĩ Chuyên khoa I Da liễu",
      licenseId: "014289/BYT-CCHN",
      hospital: "Bệnh viện Da Liễu Trung Ương",
      phone: "0905 123 456",
      specialty: "Chuyên khoa Da liễu & Thẩm mỹ Da",
      status: "active", // Approved doctor!
      experienceYears: 10,
      avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
      bio: "Hơn 10 năm kinh nghiệm điều trị mụn trứng cá chuyên sâu, phục hồi hàng rào màng đáy da nhạy cảm và điều trị tăng sắc tố sau viêm.",
      approvedBy: "Trần Thị Ngọc Hà (Super Admin)",
      approvedAt: "2026-11-14T10:00:00.000Z",
    },
    {
      id: "45894773-911a-4dcc-890a-69a50154f839",
      email: "dr.ha@gmail.com",
      name: "BS. Trần Thị Ngọc Hà",
      title: "Bác sĩ Cố vấn Y khoa SkinSense",
      licenseId: "034189/BYT-CCHN",
      hospital: "Bệnh viện Da Liễu Đà Nẵng",
      phone: "0905 888 999",
      specialty: "Da liễu tổng quát & Laser Thẩm mỹ",
      status: "active", // Approved doctor!
      experienceYears: 8,
      avatarUrl: "https://images.unsplash.com/photo-1594824813637-29556a3451df?w=400&auto=format&fit=crop&q=80",
      bio: "Chuyên gia cố vấn phác đồ điều trị mụn bọc, mụn viêm và phục hồi da nhiễm corticoid chuẩn y khoa.",
      approvedBy: "Trần Thị Ngọc Hà (Super Admin)",
      approvedAt: "2026-11-14T11:00:00.000Z",
    },
  ];

  await supabase.storage.from("photos").upload(
    "specialists/specialists_registry.json",
    Buffer.from(JSON.stringify(specialists, null, 2)),
    { upsert: true, contentType: "application/json" }
  );
  console.log("✓ Đã đồng bộ specialists_registry.json lên Supabase Storage.");

  // Also update metadata in Supabase Auth
  for (const s of specialists) {
    try {
      await supabase.auth.admin.updateUserById(s.id, {
        user_metadata: {
          role: "specialist",
          status: "active",
          full_name: s.name,
          license_id: s.licenseId,
          hospital: s.hospital,
          specialty: s.specialty,
          phone_number: s.phone,
          approved_by: s.approvedBy,
          approved_at: s.approvedAt,
        },
      });
      console.log(`✓ Đã kích hoạt vai trò Specialist (active) cho ${s.email} trong Supabase Auth.`);
    } catch (e: any) {
      console.warn(`! Cảnh báo user auth ${s.email}:`, e.message);
    }
  }

  // 2. Clinical Records (Bệnh án xuất gửi bác sĩ)
  const clinicalCases = [
    {
      id: "case_01",
      caseCode: "BA-2026-0001",
      patientName: "Trần Thị Ngọc Hà",
      patientEmail: "hattn.23itb@vku.udn.vn",
      patientAge: 21,
      patientGender: "Nữ",
      phone: "0905 888 999",
      skinType: "Hỗn hợp thiên dầu",
      fitzpatrickScale: "Loại III (Châu Á)",
      submittedDate: "14/11/2026",
      severity: "moderate",
      status: "in_treatment",
      treatmentDay: "Ngày 3/14",
      symptoms: "Bùng mụn bọc viêm đỏ má & cằm; da châm chích rát nhẹ sau khi tiếp xúc bụi nắng.",
      allergies: "Dị ứng hương liệu nhân tạo & cồn khô nồng độ cao",
      skinPhotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
      aiAnalysis: {
        skinHealthScore: 68,
        rednessIndex: 52,
        inflammatorySpots: 8,
        comedoneSpots: 14,
        affectedZones: ["Má trái", "Má phải", "Cằm"],
      },
      currentRoutine: {
        routineTitle: "Phác đồ Cấp cứu Hàng rào Bảo vệ Da & Giảm Viêm (14 ngày)",
        startDate: "2026-11-14",
        revisitDate: "2026-11-28",
        doctorNotes: "Tuân thủ đúng thứ tự bước thoa sáng và tối. Uống đủ 2L nước mỗi ngày, tuyệt đối không tự ý nặn mụn.",
        prescribedBy: "BS. CKI Nguyễn Mai Hoa",
        products: [
          {
            id: "step_01",
            name: "Nước tẩy trang Bioderma Sensibio H2O 500ml",
            brand: "Bioderma",
            category: "Làm sạch dịu nhẹ",
            imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
            activeIngredients: "Micellar sinh học, Chiết xuất dưa leo",
            stepTime: "evening",
            stepNumber: 1,
            dosage: "1-2 miếng bông cotton thấm đẫm",
            usageGuide: "Lau nhẹ nhàng theo chiều nâng cơ, không chà xát mạnh vùng má đang viêm.",
          },
          {
            id: "step_02",
            name: "Sữa rửa mặt CeraVe Hydrating Cleanser 473ml",
            brand: "CeraVe",
            category: "Làm sạch & Cân bằng pH 5.5",
            imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
            activeIngredients: "3 Ceramides thiết yếu, Hyaluronic Acid",
            stepTime: "both",
            stepNumber: 2,
            dosage: "1 pump vừa đủ",
            usageGuide: "Tạo bọt nhẹ, massage 60 giây và rửa sạch bằng nước mát.",
          },
          {
            id: "step_03",
            name: "Serum phục hồi làm dịu da La Roche-Posay Hyalu B5 30ml",
            brand: "La Roche-Posay",
            category: "Cấp nước & Tái tạo mô liên kết",
            imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
            activeIngredients: "Pure Vitamin B5, Hyaluronic Acid kép",
            stepTime: "both",
            stepNumber: 3,
            dosage: "3–4 giọt",
            usageGuide: "Vỗ nhẹ toàn mặt cho tinh chất thẩm thấu sâu.",
          },
          {
            id: "step_04",
            name: "Kem dưỡng La Roche-Posay Effaclar Duo+M 40ml",
            brand: "La Roche-Posay",
            category: "Đặc trị mụn & Phục hồi",
            imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
            activeIngredients: "Phylobioma, Niacinamide, Procerad độc quyền",
            stepTime: "both",
            stepNumber: 4,
            dosage: "1 lượng bằng hạt đậu xanh",
            usageGuide: "Thoa mỏng toàn mặt, thoa kỹ vùng mụn viêm.",
          },
        ],
      },
    },
    {
      id: "case_02",
      caseCode: "BA-2026-0002",
      patientName: "Lê Hoàng Yến",
      patientEmail: "hoangyen.le@gmail.com",
      patientAge: 23,
      patientGender: "Nữ",
      phone: "0912 345 678",
      skinType: "Da dầu mụn nhạy cảm",
      fitzpatrickScale: "Loại IV (Châu Á)",
      submittedDate: "14/11/2026",
      severity: "severe",
      status: "pending_routine",
      symptoms: "Mụn nang viêm cục bộ quai hàm, sưng tấy đau nhức; da bóng nhờn vùng chữ T.",
      allergies: "Dị ứng mủ cao su & Benzoyl Peroxide nồng độ cao",
      skinPhotoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
      aiAnalysis: {
        skinHealthScore: 54,
        rednessIndex: 68,
        inflammatorySpots: 16,
        comedoneSpots: 22,
        affectedZones: ["Má trái", "Má phải", "Quai hàm", "Trán"],
      },
    },
  ];

  await supabase.storage.from("photos").upload(
    "clinical_records/cases_registry.json",
    Buffer.from(JSON.stringify(clinicalCases, null, 2)),
    { upsert: true, contentType: "application/json" }
  );
  console.log("✓ Đã đồng bộ clinical_records/cases_registry.json lên Supabase Storage.");

  console.log("Hoàn tất thiết lập dữ liệu thật Bác sĩ & Bệnh án!");
}

seed().catch(console.error);
