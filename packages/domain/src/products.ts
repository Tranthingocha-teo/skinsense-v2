import type { Zone } from "./zones";

export type SkinConditionClass =
  | "acne_blemish"
  | "calming_redness"
  | "barrier_repair"
  | "brightening_tone"
  | "pore_oil_control"
  | "gentle_maintenance";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceVnd: number;
  priceFormatted: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  affiliateUrl: string;
  targetZones: Zone[];
  targetClasses: SkinConditionClass[];
  keyActives: string[];
  summary: string;
  description: string;
  howToUse: string;
  caution?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "lrp-effaclar-duo-m",
    name: "Effaclar Duo+M Giảm Mụn & Ngừa Thâm 40ml",
    brand: "La Roche-Posay",
    category: "Chấm mụn & Điều trị",
    priceVnd: 395000,
    priceFormatted: "395.000₫",
    rating: 4.9,
    reviewsCount: 14200,
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=la%20roche%20posay%20effaclar%20duo%2B%20m%20chinh%20hang",
    targetZones: ["forehead", "leftCheek", "rightCheek", "nose", "chin"],
    targetClasses: ["acne_blemish", "brightening_tone"],
    keyActives: ["Phylobioma", "Procerad", "Niacinamide", "LHA & Salicylic Acid"],
    summary: "Đặc trị mụn sưng viêm, gom cồi mụn sau 8 giờ và ngăn ngừa thâm mụn tái phát.",
    description: "Công thức cải tiến mới với hoạt chất sinh học Phylobioma giúp cân bằng hệ vi sinh da, ức chế vi khuẩn C.acnes phylotype IA1 gây mụn viêm nặng. Kết hợp cùng Procerad và Niacinamide giúp ngăn ngừa đốm nâu và sẹo thâm sau mụn hiệu quả.",
    howToUse: "Sử dụng 1-2 lần mỗi ngày (sáng và tối) sau bước làm sạch và toner. Thoa một lượng nhỏ lên toàn mặt hoặc chấm trực tiếp lên các nốt mụn viêm sưng.",
    caution: "Chứa BHA tự nhiên, ban ngày luôn kết hợp cùng kem chống nắng SPF 50+.",
  },
  {
    id: "skin1004-centella-ampoule",
    name: "Tinh Chất Rau Má Madagascar Centella Ampoule 100ml",
    brand: "Skin1004",
    category: "Tinh chất phục hồi",
    priceVnd: 345000,
    priceFormatted: "345.000₫",
    rating: 4.9,
    reviewsCount: 28900,
    imageUrl: "https://images.unsplash.com/photo-1608248597359-56330089a8dc?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=skin1004%20madagascar%20centella%20ampoule%20100ml%20chinh%20hang",
    targetZones: ["forehead", "leftCheek", "rightCheek", "nose", "chin"],
    targetClasses: ["calming_redness", "barrier_repair"],
    keyActives: ["100% Chiết xuất Rau Má Madagascar (Centella Asiatica)"],
    summary: "Làm dịu mẩn đỏ tức thì, kháng viêm tự nhiên và cấp ẩm sâu cho da nhạy cảm.",
    description: "Chứa 100% tinh chất chiết xuất từ rau má hữu cơ vùng Madagascar giàu Asiaticoside, Madecassic Acid và Asiatic Acid giúp làm lành vết thương, giảm nóng rát, mẩn đỏ do kích ứng hoặc sau nặn mụn.",
    howToUse: "Sau bước toner, nhỏ 2-3 giọt tinh chất lên trán và hai má, vỗ nhẹ nhàng khắp mặt cho dưỡng chất thẩm thấu hoàn toàn.",
  },
  {
    id: "lrp-cicaplast-b5-plus",
    name: "Kem Dưỡng Phục Hồi Cicaplast Baume B5+ 40ml",
    brand: "La Roche-Posay",
    category: "Kem dưỡng phục hồi",
    priceVnd: 365000,
    priceFormatted: "365.000₫",
    rating: 4.9,
    reviewsCount: 22100,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=cicaplast%20baume%20b5%2B%20chinh%20hang",
    targetZones: ["leftCheek", "rightCheek", "forehead", "chin"],
    targetClasses: ["calming_redness", "barrier_repair"],
    keyActives: ["Panthenol 5% (Vitamin B5)", "Madecassoside", "Phức hợp vi sinh Tribioma"],
    summary: "Tái tạo màng ẩm bảo vệ da, giảm bong tróc rát buốt và làm dịu vùng da tổn thương.",
    description: "Phiên bản B5+ nâng cấp độc quyền với Tribioma giúp phục hồi hàng rào sinh học của da. Nồng độ 5% Panthenol xoa dịu cảm giác khó chịu, bỏng rát tức thì, thích hợp dùng khi da treatment hoặc khô căng.",
    howToUse: "Thoa 2 lần mỗi ngày lên vùng da cần phục hồi sau các bước tinh chất. Có thể bôi một lớp dày như mặt nạ ngủ phục hồi ban đêm.",
  },
  {
    id: "paulas-choice-bha-2",
    name: "Dung Dịch Tẩy Tế Bào Chết Skin Perfecting 2% BHA Liquid 118ml",
    brand: "Paula's Choice",
    category: "Tẩy tế bào chết hoá học",
    priceVnd: 899000,
    priceFormatted: "899.000₫",
    rating: 4.8,
    reviewsCount: 9500,
    imageUrl: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=paula%20choice%202%20bha%20liquid%20chinh%20hang",
    targetZones: ["nose", "forehead", "chin"],
    targetClasses: ["pore_oil_control", "acne_blemish"],
    keyActives: ["Salicylic Acid 2% (BHA)", "Chiết xuất Trà xanh Camellia Oleifera"],
    summary: "Làm sạch sâu bã nhờn trong lỗ chân lông, giải quyết sợi bã nhờn và mụn đầu đen vùng chữ T.",
    description: "Salicylic Acid 2% tan trong dầu len lỏi sâu vào lỗ chân lông để làm mềm và hòa tan bã nhờn bít tắc, loại bỏ tế bào chết trên bề mặt và cải thiện kích thước lỗ chân lông rõ rệt.",
    howToUse: "Dùng vào buổi tối sau bước làm sạch. Thấm ra bông tẩy trang hoặc đổ ra tay thoa đều vùng trán, mũi và cằm. Bắt đầu dùng 2-3 lần/tuần.",
    caution: "Bắt buộc dùng kem chống nắng phổ rộng vào ban ngày.",
  },
  {
    id: "the-ordinary-niacinamide-10-zinc-1",
    name: "Tinh Chất Niacinamide 10% + Zinc 1% High-Strength 30ml",
    brand: "The Ordinary",
    category: "Tinh chất sáng da & Kiềm dầu",
    priceVnd: 245000,
    priceFormatted: "245.000₫",
    rating: 4.7,
    reviewsCount: 31000,
    imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=the%20ordinary%20niacinamide%2010%20zinc%201%20chinh%20hang",
    targetZones: ["forehead", "leftCheek", "rightCheek", "nose", "chin"],
    targetClasses: ["brightening_tone", "pore_oil_control"],
    keyActives: ["Niacinamide 10% (Vitamin B3)", "Kẽm PCA 1% (Zinc PCA)"],
    summary: "Kiểm soát lượng dầu thừa, se khít lỗ chân lông và làm mờ vết thâm sau mụn.",
    description: "Hàm lượng cao Vitamin B3 10% kết hợp cùng muối kẽm của axit carboxylic pyrrolidone giúp cân bằng hoạt động bài tiết bã nhờn, làm đều màu các mảng da tối sạm và tăng cường sức đề kháng cho da.",
    howToUse: "Thoa vài giọt lên toàn khuôn mặt vào buổi sáng và buổi tối trước các bước kem dưỡng ẩm dạng đặc.",
  },
  {
    id: "cerave-pm-lotion",
    name: "Sữa Dưỡng Ban Đêm CeraVe PM Facial Moisturizing Lotion 89ml",
    brand: "CeraVe",
    category: "Kem dưỡng ẩm",
    priceVnd: 390000,
    priceFormatted: "390.000₫",
    rating: 4.8,
    reviewsCount: 16800,
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=cerave%20pm%20facial%20moisturizing%20lotion%20chinh%20hang",
    targetZones: ["forehead", "leftCheek", "rightCheek", "chin"],
    targetClasses: ["barrier_repair", "gentle_maintenance"],
    keyActives: ["3 Ceramide thiết yếu (1, 3, 6-II)", "Niacinamide", "Hyaluronic Acid"],
    summary: "Cấp ẩm liên tục suốt đêm với công nghệ MVE, khôi phục hàng rào bảo vệ tự nhiên.",
    description: "Phát triển bởi các bác sĩ da liễu, CeraVe PM bổ sung lượng lipid tương thích sinh học giúp hàn gắn các vết đứt gãy trên màng da, giữ nước sâu mà không gây bết dính hay bí tắc lỗ chân lông.",
    howToUse: "Bơm 1-2 lần thoa đều khắp mặt và cổ vào ban đêm như bước khóa ẩm cuối cùng trong routine.",
  },
  {
    id: "cosrx-acne-patch",
    name: "Miếng Dán Mụn Acne Pimple Master Patch (24 Miếng)",
    brand: "COSRX",
    category: "Miếng dán mụn",
    priceVnd: 75000,
    priceFormatted: "75.000₫",
    rating: 4.9,
    reviewsCount: 45000,
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=cosrx%20acne%20pimple%20master%20patch%20chinh%20hang",
    targetZones: ["forehead", "leftCheek", "rightCheek", "nose", "chin"],
    targetClasses: ["acne_blemish"],
    keyActives: ["Băng dán Hydrocolloid cao cấp"],
    summary: "Hút sạch mủ mụn, cách ly vi khuẩn và bụi bẩn, bảo vệ nốt mụn không để lại sẹo thâm.",
    description: "Miếng dán mỏng nhẹ tàng hình với vật liệu Hydrocolloid y tế giúp hút dịch mủ màu trắng ra khỏi nốt mụn viêm trong vòng vài giờ, ngăn ngừa thói quen sờ tay lên nốt mụn gây nhiễm trùng.",
    howToUse: "Rửa sạch và lau khô da hoàn toàn. Chọn kích thước miếng dán vừa vặn và dán trực tiếp lên nốt mụn trước các bước skincare khác.",
  },
  {
    id: "anua-heartleaf-77-toner",
    name: "Nước Hoa Hồng Làm Dịu Da Anua Heartleaf 77% Soothing Toner 250ml",
    brand: "Anua",
    category: "Toner làm dịu",
    priceVnd: 380000,
    priceFormatted: "380.000₫",
    rating: 4.9,
    reviewsCount: 19400,
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=anua%20heartleaf%2077%20soothing%20toner%20chinh%20hang",
    targetZones: ["forehead", "leftCheek", "rightCheek", "nose", "chin"],
    targetClasses: ["calming_redness", "gentle_maintenance"],
    keyActives: ["77% Chiết xuất Lá Diếp cá (Houttuynia Cordata)"],
    summary: "Cân bằng độ pH tức thì, làm dịu các vùng da đỏ rát và kháng viêm nhẹ nhàng.",
    description: "Toner diếp cá bán chạy số 1 Hàn Quốc với 77% chiết xuất diếp cá tinh khiết giúp hạ nhiệt độ bề mặt da, làm dịu nhanh chóng các nốt kích ứng và chuẩn bị nền da tối ưu cho các bước dưỡng kế tiếp.",
    howToUse: "Đổ một lượng vừa đủ ra lòng bàn tay rồi vỗ nhẹ lên mặt, hoặc thấm ra bông đắp toner pad làm dịu vùng má/trán trong 5-10 phút.",
  },
  {
    id: "klairs-midnight-blue-cream",
    name: "Kem Dưỡng Làm Dịu Da Klairs Midnight Blue Calming Cream 60ml",
    brand: "Dear, Klairs",
    category: "Kem dưỡng phục hồi",
    priceVnd: 375000,
    priceFormatted: "375.000₫",
    rating: 4.8,
    reviewsCount: 18200,
    imageUrl: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=klairs%20midnight%20blue%20calming%20cream%20chinh%20hang",
    targetZones: ["leftCheek", "rightCheek", "forehead", "chin"],
    targetClasses: ["calming_redness", "barrier_repair"],
    keyActives: ["Guaiazulene (tinh dầu hoa cúc xanh)", "Chiết xuất Rau má", "Ceramide 3"],
    summary: "Kem màu xanh tự nhiên đặc trị da cháy nắng, kích ứng mẩn đỏ và da sau laser.",
    description: "Guaiazulene chiết xuất từ hoa cúc La Mã mang sắc xanh biếc đặc trưng có khả năng làm dịu thần tốc vùng da kích ứng nhiệt độ, kháng viêm mạnh mẽ và tái tạo màng ẩm tự nhiên.",
    howToUse: "Sử dụng ở bước cuối cùng trong chu trình dưỡng da buổi tối, thoa đều và massage nhẹ nhàng khắp mặt.",
  },
  {
    id: "torriden-dive-in-serum",
    name: "Serum Cấp Ẩm Đa Tầng Torriden DIVE-IN Low Molecular Hyaluronic Acid 50ml",
    brand: "Torriden",
    category: "Serum cấp nước",
    priceVnd: 360000,
    priceFormatted: "360.000₫",
    rating: 4.9,
    reviewsCount: 24000,
    imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80",
    affiliateUrl: "https://shopee.vn/search?keyword=torriden%20dive%20in%20serum%20chinh%20hang",
    targetZones: ["forehead", "leftCheek", "rightCheek", "nose", "chin"],
    targetClasses: ["barrier_repair", "gentle_maintenance"],
    keyActives: ["Phức hợp 5 loại Hyaluronic Acid", "D-Panthenol B5", "Ceramide NP"],
    summary: "Cấp nước đa tầng thẩm thấu tức thì, giúp bề mặt da căng mọng, mượt mà và ngậm nước.",
    description: "Công thức chứa 5 kích thước phân tử Hyaluronic Acid từ siêu nhỏ đến lớn len lỏi qua từng tầng biểu bì, khóa ẩm suốt 24 giờ mà không gây nhờn dính, phù hợp với mọi loại da kể cả da dầu thiếu nước.",
    howToUse: "Sau bước toner, lấy 3-4 giọt thoa đều khắp mặt và cổ. Vỗ nhẹ cho tinh chất thấm sâu.",
  },
];

export function getProducts(): Product[] {
  return PRODUCTS;
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export interface ZoneTelemetry {
  redness: number;
  unevenness: number;
  spotCount: number;
}

/**
 * Predicts the primary skin condition class for a facial zone based on measurements.
 */
export function classifyZoneCondition(zone: Zone, telemetry: ZoneTelemetry): SkinConditionClass {
  const { redness, unevenness, spotCount } = telemetry;
  if (spotCount > 0) {
    return "acne_blemish";
  }
  if (redness > 1.5) {
    return "calming_redness";
  }
  if (zone === "nose" && unevenness > 1.4) {
    return "pore_oil_control";
  }
  if (unevenness > 2.0) {
    return "brightening_tone";
  }
  if (redness < -1.2 || unevenness > 1.5) {
    return "barrier_repair";
  }
  return "gentle_maintenance";
}

/**
 * Explains clearly why a product is clinically recommended for the user's specific zone measurement.
 */
export function explainProductRecommendation(product: Product, zone: Zone, telemetry: ZoneTelemetry): string {
  const zoneNames: Record<Zone, string> = {
    forehead: "Vùng trán",
    leftCheek: "Vùng má trái",
    rightCheek: "Vùng má phải",
    nose: "Vùng mũi",
    chin: "Vùng cằm",
  };
  const name = zoneNames[zone] ?? "Làn da";

  if (telemetry.spotCount > 0 && product.targetClasses.includes("acne_blemish")) {
    return `Mô hình phát hiện ${telemetry.spotCount} nốt mụn tại ${name.toLowerCase()}. ${product.name} chứa ${product.keyActives[0]} giúp gom cồi, kháng viêm và bảo vệ nốt mụn không để lại thâm.`;
  }
  if (telemetry.redness > 1.0 && product.targetClasses.includes("calming_redness")) {
    return `${name} có chỉ số mẩn đỏ đạt ${telemetry.redness.toFixed(1)} (cao hơn nền da). Hoạt chất ${product.keyActives.slice(0, 2).join(", ")} sẽ nhanh chóng làm dịu kích ứng và hạ nhiệt cho da.`;
  }
  if (zone === "nose" && product.targetClasses.includes("pore_oil_control")) {
    return `Vùng mũi có độ không đều màu ${telemetry.unevenness.toFixed(1)} thường do tích tụ sợi bã nhờn. ${product.name} giúp làm sạch sâu lỗ chân lông và kiềm dầu hiệu quả.`;
  }
  if (product.targetClasses.includes("barrier_repair")) {
    return `${name} cần củng cố hàng rào bảo vệ ẩm để cải thiện độ mịn màng. Sản phẩm này cung cấp dưỡng chất phục hồi màng lipid tự nhiên.`;
  }
  return `${product.name} phù hợp cho bước chăm sóc và duy trì nền da ${name.toLowerCase()} khỏe mạnh, cân bằng ẩm hàng ngày.`;
}

/**
 * Returns prioritized products tailored for a specific facial zone and its telemetry.
 */
export function recommendProductsForZone(
  zone: Zone,
  telemetry: ZoneTelemetry,
  targetClass?: SkinConditionClass,
): Product[] {
  const condition = targetClass ?? classifyZoneCondition(zone, telemetry);
  const matched = PRODUCTS.filter((p) => p.targetZones.includes(zone) && p.targetClasses.includes(condition));
  if (matched.length > 0) return matched;
  // Fallback to products covering the zone
  return PRODUCTS.filter((p) => p.targetZones.includes(zone));
}
