export interface RoutineStep {
  id: string;
  stepNumber: number;
  label: string;
  productName: string;
  brand: string;
  category: string;
  imageUrl: string;
  activeIngredients: string;
  stepTime: "morning" | "evening" | "both";
  dosage: string;
  usageGuide: string;
  isCompleted?: boolean;
}

export interface RoleRoutine {
  role: "customer" | "specialist" | "shop" | "admin";
  title: string;
  description: string;
  targetUser: string;
  allocatedBy: string;
  treatmentDuration: string;
  skinConcern: string;
  steps: RoutineStep[];
}

export const DEFAULT_ROLE_ROUTINES: Record<string, RoleRoutine> = {
  customer: {
    role: "customer",
    title: "Routine Chăm Sóc Da Trị Mụn & Phục Hồi Hàng Rào Ẩm (14 Ngày)",
    description: "Phác đồ cá nhân hóa hàng ngày: Làm sạch sâu dịu nhẹ, kháng khuẩn ổ mụn và củng cố hàng rào lipid bảo vệ da.",
    targetUser: "Khách hàng Trần Thị Ngọc Hà (khachhang@gmail.com)",
    allocatedBy: "Super Admin Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn)",
    treatmentDuration: "14 ngày",
    skinConcern: "Da dầu mụn, bít tắc chân lông & đỏ ửng vùng má",
    steps: [
      {
        id: "step_cust_01",
        stepNumber: 1,
        label: "Tẩy trang dịu nhẹ",
        productName: "Nước tẩy trang Bioderma Sensibio H2O 500ml",
        brand: "Bioderma",
        category: "Tẩy trang Micellar sinh học",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Hạt Micellar sinh học, Chiết xuất dưa leo, Không cồn & paraben",
        stepTime: "evening",
        dosage: "1-2 miếng bông cotton thấm đẫm dung dịch",
        usageGuide: "Lau nhẹ nhàng theo chiều cấu tạo da từ dưới lên trên, từ trong ra ngoài. Giữ 5 giây ở vùng mắt & môi, không chà xát mạnh gây tổn thương màng ẩm.",
        isCompleted: true,
      },
      {
        id: "step_cust_02",
        stepNumber: 2,
        label: "Sữa rửa mặt cấp ẩm cân bằng",
        productName: "Sữa rửa mặt dưỡng ẩm CeraVe Hydrating Cleanser 473ml",
        brand: "CeraVe Skincare",
        category: "Làm sạch & Cân bằng pH 5.5",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "3 Ceramides thiết yếu (1, 3, 6-II), Hyaluronic Acid nguyên chất",
        stepTime: "both",
        dosage: "1 pump vừa đủ",
        usageGuide: "Làm ướt mặt bằng nước ấm nhẹ, massage nhẹ nhàng theo chuyển động tròn trong 60 giây, tập trung vùng chữ T tiết dầu. Rửa sạch bằng nước mát và thấm khô bằng khăn bông sạch.",
        isCompleted: true,
      },
      {
        id: "step_cust_03",
        stepNumber: 3,
        label: "Tẩy tế bào chết hóa học sâu",
        productName: "Dung dịch tẩy da chết Paula's Choice 2% BHA Liquid Exfoliant 118ml",
        brand: "Paula's Choice",
        category: "Tẩy tế bào chết BHA",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "2% Salicylic Acid (BHA), Chiết xuất trà xanh làm dịu chống oxy hóa",
        stepTime: "evening",
        dosage: "3-4 giọt",
        usageGuide: "Vỗ nhẹ trực tiếp lên da hoặc qua bông mỏng. Chờ 10-15 phút để BHA thẩm thấu và làm sạch sâu lỗ chân lông trước khi bôi serum/kem dưỡng tiếp theo.",
        isCompleted: false,
      },
      {
        id: "step_cust_04",
        stepNumber: 4,
        label: "Kem dưỡng giảm mụn & ngừa thâm",
        productName: "Kem dưỡng giảm mụn phục hồi La Roche-Posay Effaclar Duo+M 40ml",
        brand: "La Roche-Posay",
        category: "Đặc trị mụn & Phục hồi",
        imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Phylobioma kháng vi khuẩn mụn, Niacinamide, Procerad độc quyền mờ thâm",
        stepTime: "both",
        dosage: "1 lượng bằng hạt đậu xanh",
        usageGuide: "Thoa mỏng toàn mặt, thoa kỹ hơn ở nốt mụn sưng viêm và vùng thâm. Tránh thoa sát khóe mắt và khóe miệng.",
        isCompleted: true,
      },
      {
        id: "step_cust_05",
        stepNumber: 5,
        label: "Bảo vệ chống nắng quang phổ rộng",
        productName: "Kem chống nắng kiểm soát dầu La Roche-Posay Anthelios UVMune 400 SPF50+ 50ml",
        brand: "La Roche-Posay",
        category: "Chống nắng kiềm dầu quang phổ rộng",
        imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Màng lọc Mexoryl 400 độc quyền ngăn tia UV dài, Airlicium kiềm dầu 12h",
        stepTime: "morning",
        dosage: "Đường kem dài 2 đốt ngón tay trỏ",
        usageGuide: "Thoa đều khắp mặt và cổ trước khi ra nắng 20 phút. Vỗ nhẹ cho tệp vào da. Thoa dặm lại sau mỗi 3-4 tiếng nếu làm việc ngoài trời hoặc đổ nhiều mồ hôi.",
        isCompleted: false,
      },
    ],
  },

  specialist: {
    role: "specialist",
    title: "Phác Đồ Kê Đơn Chuyên Khoa: Kiểm Soát Mụn Bọc & Giảm Đỏ Cấp Tốc (21 Ngày)",
    description: "Chỉ định chuyên khoa y tế: Kháng sinh bôi ổ viêm vi khuẩn C.acnes, làm dịu ban đỏ sau tổn thương màng đáy.",
    targetUser: "Bệnh nhân lâm sàng: Trần Thị Ngọc Hà (Mã BA-2026-0001)",
    allocatedBy: "BS. CKI Nguyễn Mai Hoa (CCHN-003419/BYT) & Super Admin duyệt",
    treatmentDuration: "21 ngày (tái khám ngày thứ 14)",
    skinConcern: "Mụn mủ bọc sưng viêm, da mỏng đỏ sau khi dùng cushion có cồn",
    steps: [
      {
        id: "step_spec_01",
        stepNumber: 1,
        label: "Làm sạch y khoa kháng viêm",
        productName: "Gel rửa mặt làm dịu da Avene Cleanance Cleansing Gel 200ml",
        brand: "Eau Thermale Avene",
        category: "Sữa rửa mặt dược mỹ phẩm y khoa",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Nước khoáng nhiệt Avene 60.7%, Comedoclastin 0.7%, Kẽm Gluconate",
        stepTime: "both",
        dosage: "1 lượng nhỏ bằng hạt bắp",
        usageGuide: "Tạo bọt kỹ với nước ấm, thoa áp nhẹ nhàng không miết xước nốt mụn viêm. Dùng khăn bông vô khuẩn thấm khô.",
        isCompleted: true,
      },
      {
        id: "step_spec_02",
        stepNumber: 2,
        label: "Kháng sinh bôi gom cồi mụn",
        productName: "Gel chấm mụn kháng khuẩn Klenzit-C (Clindamycin Phosphate 1%) 15g",
        brand: "Glenmark Pharmaceuticals",
        category: "Thuốc bôi da liễu kê đơn",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Clindamycin Phosphate 1%, tá dược gel Carbomer 940",
        stepTime: "evening",
        dosage: "Chấm tăm bông 1 điểm nhỏ",
        usageGuide: "Dùng tăm bông sạch chấm trực tiếp lên chóp nốt mụn mủ/viêm sưng. Không thoa lan ra vùng da lành. Chỉ dùng vào buổi tối.",
        isCompleted: true,
      },
      {
        id: "step_spec_03",
        stepNumber: 3,
        label: "Tái tạo biểu bì & Giảm ban đỏ",
        productName: "Kem phục hồi làm dịu da La Roche-Posay Cicaplast Baume B5+ 40ml",
        brand: "La Roche-Posay",
        category: "Phục hồi cấp cứu hàng rào sinh học",
        imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Panthenol 5% (Pro-Vitamin B5), Madecassoside, Phức hợp Tribioma",
        stepTime: "both",
        dosage: "1 lượng bằng hạt đậu xanh",
        usageGuide: "Thoa sau khi thuốc chấm mụn khô 10 phút. Làm ấm kem giữa 2 đầu ngón tay rồi áp nhẹ lên vùng má đỏ rát.",
        isCompleted: false,
      },
      {
        id: "step_spec_04",
        stepNumber: 4,
        label: "Chống nắng phục hồi ngăn thâm đỏ",
        productName: "Kem chống nắng phổ rộng MartiDerm The Originals Proteos Screen SPF50+ 40ml",
        brand: "MartiDerm",
        category: "Bảo vệ quang học chuyên sâu sau điều trị",
        imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Proteoglycans, Spectrum Complex (UVA/UVB/IR/HEV), Hyaluronic Acid",
        stepTime: "morning",
        dosage: "Đường kem dài 2 đốt ngón tay",
        usageGuide: "Vỗ nhẹ khắp mặt mỗi sáng sau bước kem B5. Tuyệt đối không để vùng da mụn viêm tiếp xúc trực tiếp tia UV.",
        isCompleted: false,
      },
    ],
  },

  shop: {
    role: "shop",
    title: "Bộ Routine Trị Mụn & Phục Hồi Chuẩn Hãng La Roche-Posay Flagship (3 Bước 1 Chạm)",
    description: "Bộ sản phẩm bán chạy nhất gian hàng: Tiết kiệm 20% khi mua trọn bộ, tích hợp giao nhanh 2h.",
    targetUser: "Khách mua hàng gian hàng La Roche-Posay Official Store",
    allocatedBy: "Chủ Cửa hàng La Roche-Posay Flagship VN",
    treatmentDuration: "Gói chu kỳ 30 ngày",
    skinConcern: "Da dầu mụn, sợi bã nhờn & vết thâm sau mụn",
    steps: [
      {
        id: "step_shop_01",
        stepNumber: 1,
        label: "Gel rửa mặt tạo bọt kiềm dầu",
        productName: "La Roche-Posay Effaclar Purifying Foaming Gel 200ml (395.000đ)",
        brand: "La Roche-Posay VN",
        category: "Làm sạch sâu da dầu",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Nước khoáng La Roche-Posay, Zinc PCA thanh lọc da",
        stepTime: "both",
        dosage: "1 pump tạo bọt với nước",
        usageGuide: "Tạo bọt bông mịn trên lòng bàn tay rồi massage lên mặt 1 phút. Rửa sạch bằng nước mát.",
        isCompleted: true,
      },
      {
        id: "step_shop_02",
        stepNumber: 2,
        label: "Nước hoa hồng se khít chân lông",
        productName: "La Roche-Posay Effaclar Astringent Lotion 200ml (420.000đ)",
        brand: "La Roche-Posay VN",
        category: "Toner cân bằng & Kiềm dầu",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "LHA vi tẩy tế bào chết, Nước khoáng làm dịu",
        stepTime: "both",
        dosage: "3-4 giọt ra bông cotton",
        usageGuide: "Lau nhẹ lên vùng chữ T và cánh mũi ngay sau khi rửa mặt. Giúp se khít lỗ chân lông rõ rệt.",
        isCompleted: true,
      },
      {
        id: "step_shop_03",
        stepNumber: 3,
        label: "Kem dưỡng giảm mụn mờ thâm",
        productName: "La Roche-Posay Effaclar Duo+M 40ml (495.000đ)",
        brand: "La Roche-Posay VN",
        category: "Giảm mụn & Mờ thâm trong 8h",
        imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Phylobioma, Niacinamide, Procerad",
        stepTime: "both",
        dosage: "1 lượng bằng hạt đậu",
        usageGuide: "Thoa toàn mặt buổi sáng trước kem chống nắng và buổi tối trước khi đi ngủ.",
        isCompleted: true,
      },
    ],
  },

  admin: {
    role: "admin",
    title: "Phác Đồ Mẫu Hệ Thống Toàn Diện (Master System Protocol)",
    description: "Bộ khung chuẩn y khoa do Super Admin Trần Thị Ngọc Hà ban hành để tự động phân bổ cho người dùng mới.",
    targetUser: "Toàn bộ tài khoản người dùng đăng ký mới trên hệ thống SkinSense",
    allocatedBy: "Super Admin Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn)",
    treatmentDuration: "Giao thức tiêu chuẩn 30 ngày",
    skinConcern: "Mọi loại da: Chăm sóc cơ bản, Phục hồi & Phòng ngừa mụn tái phát",
    steps: [
      {
        id: "step_adm_01",
        stepNumber: 1,
        label: "Tẩy trang dịu nhẹ",
        productName: "Bioderma Sensibio H2O Micellar Water 500ml",
        brand: "Bioderma",
        category: "Làm sạch màng ẩm",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Micellar Technology sinh học, Chiết xuất dưa leo",
        stepTime: "evening",
        dosage: "1 miếng bông cotton",
        usageGuide: "Lau nhẹ toàn mặt buổi tối trước bước rửa mặt.",
        isCompleted: true,
      },
      {
        id: "step_adm_02",
        stepNumber: 2,
        label: "Sữa rửa mặt cân bằng pH",
        productName: "CeraVe Hydrating Cleanser 473ml",
        brand: "CeraVe",
        category: "Cân bằng pH sinh lý 5.5",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Ceramides 1, 3, 6-II, Hyaluronic Acid",
        stepTime: "both",
        dosage: "1 pump vừa đủ",
        usageGuide: "Rửa sạch với nước mát sáng và tối trong 60 giây.",
        isCompleted: true,
      },
      {
        id: "step_adm_03",
        stepNumber: 3,
        label: "Serum phục hồi B5 màng ẩm",
        productName: "Serum phục hồi La Roche-Posay Hyalu B5 30ml",
        brand: "La Roche-Posay",
        category: "Cấp ẩm & Phục hồi",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Vitamin B5 tinh khiết, Hyaluronic Acid kép, Madecassoside",
        stepTime: "both",
        dosage: "3-4 giọt",
        usageGuide: "Thoa đều khắp mặt và vỗ nhẹ 30 giây để dưỡng chất thẩm thấu sâu.",
        isCompleted: true,
      },
      {
        id: "step_adm_04",
        stepNumber: 4,
        label: "Kem khóa ẩm chuyên sâu ngừa mụn",
        productName: "La Roche-Posay Effaclar Duo+M 40ml",
        brand: "La Roche-Posay",
        category: "Khóa ẩm & Ngừa mụn",
        imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Phylobioma, Niacinamide, Aqua Posae",
        stepTime: "both",
        dosage: "1 hạt đậu",
        usageGuide: "Khóa ẩm bước cuối cùng buổi tối và trước kem chống nắng buổi sáng.",
        isCompleted: true,
      },
      {
        id: "step_adm_05",
        stepNumber: 5,
        label: "Chống nắng bảo vệ quang phổ rộng",
        productName: "La Roche-Posay Anthelios UVMune 400 SPF50+ 50ml",
        brand: "La Roche-Posay",
        category: "Chống tia UV dài",
        imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Mexoryl 400, SPF50+ PA++++",
        stepTime: "morning",
        dosage: "2 đốt ngón tay",
        usageGuide: "Bảo vệ da mỗi buổi sáng trước khi ra khỏi nhà 20 phút.",
        isCompleted: false,
      },
    ],
  },
};

export function getProductForStep(
  label: string,
  timeOfDay: "morning" | "evening" = "evening",
  index = 0
): RoutineStep {
  const norm = (label || "").trim().toLowerCase();

  // If time of day is MORNING (Routine Sáng)
  if (timeOfDay === "morning") {
    // Step 1: Cleanser
    if (index === 0 || norm.includes("rửa mặt") || norm.includes("cleanser") || norm.includes("clean")) {
      return {
        id: "step_am_01",
        stepNumber: 1,
        label: "Rửa mặt dịu nhẹ",
        productName: "Sữa rửa mặt dưỡng ẩm CeraVe Hydrating Cleanser 473ml",
        brand: "CeraVe Skincare",
        category: "Làm sạch cân bằng pH 5.5",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "3 Ceramides thiết yếu (1, 3, 6-II), Hyaluronic Acid nguyên chất",
        stepTime: "morning",
        dosage: "1 pump vừa đủ",
        usageGuide: "Làm ướt mặt bằng nước ấm, massage nhẹ nhàng theo chuyển động tròn trong 60 giây. Rửa sạch bằng nước mát và thấm khô.",
      };
    }
    // Step 2: Hydrating Serum B5
    if (index === 1 || norm.includes("serum") || norm.includes("b5") || norm.includes("cấp ẩm")) {
      return {
        id: "step_am_02",
        stepNumber: 2,
        label: "Serum phục hồi B5",
        productName: "Serum phục hồi màng ẩm La Roche-Posay Hyalu B5 30ml",
        brand: "La Roche-Posay",
        category: "Cấp nước & Tái tạo mô liên kết",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Pure Vitamin B5 (Panthenol), Hyaluronic Acid kép, Madecassoside",
        stepTime: "morning",
        dosage: "3–4 giọt",
        usageGuide: "Nhỏ 3-4 giọt lên trán và 2 má, vỗ nhẹ 30 giây bằng đầu ngón tay cho tinh chất ngấm sâu trước khi bôi kem dưỡng.",
      };
    }
    // Step 3: Lightweight Moisturizer
    if (index === 2 || norm.includes("dưỡng") || norm.includes("moisturizer") || norm.includes("cream")) {
      return {
        id: "step_am_03",
        stepNumber: 3,
        label: "Khóa ẩm mỏng nhẹ",
        productName: "Kem dưỡng giảm mụn mờ thâm La Roche-Posay Effaclar Duo+M 40ml",
        brand: "La Roche-Posay",
        category: "Khóa ẩm & Ngừa vi khuẩn mụn",
        imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
        activeIngredients: "Phylobioma, Niacinamide, Procerad độc quyền",
        stepTime: "morning",
        dosage: "1 lượng bằng hạt đậu xanh",
        usageGuide: "Thoa đều toàn mặt theo chiều nâng cơ, vỗ nhẹ để kem khóa chặt độ ẩm của serum B5.",
      };
    }
    // Step 4: Broad Spectrum Sunscreen
    return {
      id: "step_am_04",
      stepNumber: 4,
      label: "Kem chống nắng bảo vệ",
      productName: "Kem chống nắng kiểm soát dầu La Roche-Posay Anthelios UVMune 400 SPF50+ 50ml",
      brand: "La Roche-Posay",
      category: "Chống nắng kiềm dầu quang phổ rộng",
      imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&auto=format&fit=crop&q=80",
      activeIngredients: "Màng lọc độc quyền Mexoryl 400, Airlicium kiểm soát bã nhờn 12h",
      stepTime: "morning",
      dosage: "Đường kem dài 2 đốt ngón tay trỏ",
      usageGuide: "Thoa đều khắp mặt và cổ trước khi ra ngoài 20 phút. Vỗ nhẹ cho tệp màu vào da. Thoa dặm lại sau 3-4 tiếng.",
    };
  }

  // If time of day is EVENING (Routine Tối)
  // Step 1: Makeup Remover
  if (index === 0 || norm.includes("tẩy trang") || norm.includes("makeup") || norm.includes("remover") || norm.includes("micellar")) {
    return {
      id: "step_pm_01",
      stepNumber: 1,
      label: "Tẩy trang dịu nhẹ",
      productName: "Nước tẩy trang Bioderma Sensibio H2O 500ml",
      brand: "Bioderma",
      category: "Tẩy trang Micellar sinh học",
      imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
      activeIngredients: "Hạt Micellar sinh học, Chiết xuất dưa leo làm dịu biểu bì",
      stepTime: "evening",
      dosage: "1-2 miếng bông cotton thấm đẫm",
      usageGuide: "Lau nhẹ nhàng theo chiều cấu tạo da từ dưới lên trên, từ trong ra ngoài. Giữ 5 giây ở mắt & môi, không chà xát mạnh.",
    };
  }
  // Step 2: Deep Cleanser
  if (index === 1 || norm.includes("rửa mặt") || norm.includes("cleanser") || norm.includes("cleanse")) {
    return {
      id: "step_pm_02",
      stepNumber: 2,
      label: "Rửa mặt làm sạch sâu",
      productName: "Sữa rửa mặt dưỡng ẩm CeraVe Hydrating Cleanser 473ml",
      brand: "CeraVe Skincare",
      category: "Làm sạch & Cân bằng pH 5.5",
      imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
      activeIngredients: "3 Ceramides thiết yếu (1, 3, 6-II), Hyaluronic Acid nguyên chất",
      stepTime: "evening",
      dosage: "1 pump vừa đủ",
      usageGuide: "Làm ướt mặt bằng nước ấm, massage nhẹ nhàng theo chuyển động tròn trong 60 giây, tập trung vùng chữ T. Rửa sạch bằng nước mát và thấm khô.",
    };
  }
  // Step 3: Acne Treatment Serum BHA
  if (index === 2 || norm.includes("serum") || norm.includes("trị mụn") || norm.includes("bha") || norm.includes("acne")) {
    return {
      id: "step_pm_03",
      stepNumber: 3,
      label: "Serum trị mụn BHA",
      productName: "Dung dịch tẩy da chết Paula's Choice 2% BHA Liquid Exfoliant 118ml",
      brand: "Paula's Choice",
      category: "Tẩy tế bào chết BHA thông thoáng nang lông",
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80",
      activeIngredients: "2% Salicylic Acid (BHA), Chiết xuất trà xanh chống oxy hóa",
      stepTime: "evening",
      dosage: "3–4 giọt",
      usageGuide: "Vỗ nhẹ trực tiếp lên da hoặc qua bông mỏng. Chờ 10–15 phút để BHA thẩm thấu và làm sạch sâu lỗ chân lông trước khi bôi kem dưỡng.",
    };
  }
  // Step 4: Barrier Recovery Moisturizer
  return {
    id: "step_pm_04",
    stepNumber: 4,
    label: "Kem dưỡng phục hồi",
    productName: "Kem dưỡng giảm mụn phục hồi La Roche-Posay Effaclar Duo+M 40ml",
    brand: "La Roche-Posay",
    category: "Đặc trị mụn & Phục hồi hàng rào ẩm",
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop&q=80",
    activeIngredients: "Phylobioma kháng vi khuẩn mụn, Niacinamide, Procerad độc quyền",
    stepTime: "evening",
    dosage: "1 lượng bằng hạt đậu xanh",
    usageGuide: "Thoa mỏng toàn mặt, thoa kỹ hơn ở nốt mụn sưng viêm và vùng thâm. Tránh thoa sát khóe mắt và khóe miệng.",
  };
}
