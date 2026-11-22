export type UsageSlot = "AM" | "PM" | "AM/PM";
export type RoutineStepCategory = "Cleanser" | "Treatment" | "Moisturizer" | "Sunscreen";

export interface RoutineConflictWarning {
  id: string;
  severity: "caution" | "info";
  title: string;
  advice: string;
  products: string[];
}

export interface RoutineCandidateProduct {
  id: string;
  name: string;
  category?: string;
  howToUse?: string;
  keyActives?: string[];
  specifications?: {
    actives?: string;
    skinType?: string;
    volume?: string;
  };
}

export const ROUTINE_STEP_LABELS: Record<RoutineStepCategory, string> = {
  Cleanser: "Làm sạch",
  Treatment: "Đặc trị",
  Moisturizer: "Dưỡng ẩm & Phục hồi",
  Sunscreen: "Chống nắng",
};

const FALLBACK_NAME_ACTIVES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bhyalu\b|hyaluronic/i, label: "Hyaluronic Acid" },
  { pattern: /\bb5\b|panthenol|cicaplast/i, label: "Panthenol B5" },
  { pattern: /niacinamide/i, label: "Niacinamide" },
  { pattern: /salicylic|\bbha\b/i, label: "Salicylic Acid (BHA)" },
  { pattern: /ceramide/i, label: "Ceramides" },
  { pattern: /retinol|retinal|adapalene/i, label: "Retinol" },
  { pattern: /vitamin\s*c|ascorbic/i, label: "Vitamin C" },
  { pattern: /\baha\b|glycolic|mandelic|lactic/i, label: "AHA" },
  { pattern: /zinc/i, label: "Zinc PCA" },
  { pattern: /azelaic/i, label: "Azelaic Acid" },
];

const PLACEHOLDER_RE = /^(chưa cập nhật|n\/a|none|không)$/i;

/**
 * Extracts up to four clean active-ingredient labels from a product's clinical spec,
 * falling back to known actives mentioned in the product title when specs are missing.
 */
export function extractProductActives(rawActives?: string | string[], productName?: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const pushUnique = (label: string) => {
    const normalized = label.trim().replace(/\s+/g, " ");
    if (!normalized || PLACEHOLDER_RE.test(normalized)) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  };

  if (Array.isArray(rawActives)) {
    for (const part of rawActives) {
      const cleaned = part.replace(/\([^)]*\)/g, "").trim();
      if (cleaned.length > 1) pushUnique(cleaned);
      if (result.length >= 4) break;
    }
  } else if (rawActives && !PLACEHOLDER_RE.test(rawActives.trim())) {
    for (const part of rawActives.split(/[;,/]+/)) {
      const cleaned = part.replace(/\([^)]*\)/g, "").trim();
      if (cleaned.length > 1) pushUnique(cleaned);
      if (result.length >= 4) break;
    }
  }

  if (result.length === 0 && productName) {
    for (const entry of FALLBACK_NAME_ACTIVES) {
      if (entry.pattern.test(productName)) {
        pushUnique(entry.label);
      }
      if (result.length >= 4) break;
    }
  }

  return result;
}

/** Classifies whether a skincare product belongs to AM, PM, or AM/PM usage. */
export function inferUsageSlot(product: Pick<RoutineCandidateProduct, "name" | "category" | "howToUse">): UsageSlot {
  const haystack = `${product.category ?? ""} ${product.name ?? ""} ${product.howToUse ?? ""}`.toLowerCase();

  if (/chống nắng|sunscreen|spf\s*\d+|uvmune|anthelios/.test(haystack)) {
    return "AM";
  }
  if (/retinol|tretinoin|adapalene|ban đêm|buổi tối|tẩy trang|micellar|sensibio h2o|bha peel/.test(haystack)) {
    if (!/sáng và tối|sáng & tối|sáng tối/.test(haystack)) {
      return "PM";
    }
  }
  if (/buổi sáng|ban ngày/.test(haystack) && !/tối/.test(haystack)) {
    return "AM";
  }
  return "AM/PM";
}

/** Maps a product into one of the four core dermatological routine steps. */
export function inferRoutineStepCategory(
  product: Pick<RoutineCandidateProduct, "name" | "category">,
): RoutineStepCategory {
  const haystack = `${product.category ?? ""} ${product.name ?? ""}`.toLowerCase();

  if (/chống nắng|sunscreen|spf/.test(haystack)) return "Sunscreen";
  if (/tẩy trang|sữa rửa mặt|cleanser|micellar|rửa mặt|làm sạch|gel rửa/.test(haystack)) {
    return "Cleanser";
  }
  if (/kem dưỡng|dưỡng ẩm|phục hồi|cicaplast|moisturizer|lotion|balm|gel dưỡng|cream|kem b5/.test(haystack)) {
    return "Moisturizer";
  }
  return "Treatment";
}

function combinedText(p: RoutineCandidateProduct): string {
  const activesText = Array.isArray(p.keyActives) ? p.keyActives.join(" ") : "";
  return `${p.name} ${activesText} ${p.specifications?.actives ?? ""}`.toLowerCase();
}

/** Checks a user-assembled routine for common irritating or destabilizing active combinations. */
export function detectActiveConflicts(products: RoutineCandidateProduct[]): RoutineConflictWarning[] {
  const warnings: RoutineConflictWarning[] = [];

  const retinoids = products.filter((p) => /retinol|retinal|retinoid|tretinoin|adapalene/.test(combinedText(p)));
  const exfoliants = products.filter((p) =>
    /salicylic|\bbha\b|\blha\b|glycolic|mandelic|lactic|\baha\b/.test(combinedText(p)),
  );
  const vitC = products.filter((p) => /vitamin\s*c|ascorbic acid|l-aa/.test(combinedText(p)));
  const benzoyl = products.filter((p) => /benzoyl peroxide|\bbpo\b/.test(combinedText(p)));

  if (retinoids.length > 0 && exfoliants.length > 0) {
    const names = Array.from(new Set([...retinoids, ...exfoliants].map((p) => p.name)));
    if (names.length >= 2) {
      warnings.push({
        id: "retinoid-exfoliant",
        severity: "caution",
        title: "Không dùng chung buổi: Retinol + Acid tẩy da chết (BHA/LHA/AHA)",
        advice: "Nên tách sử dụng cách ngày hoặc dùng BHA/LHA buổi sáng, Retinol buổi tối để tránh đỏ rát hàng rào da.",
        products: names,
      });
    }
  }

  if (retinoids.length > 0 && vitC.length > 0) {
    const names = Array.from(new Set([...retinoids, ...vitC].map((p) => p.name)));
    if (names.length >= 2) {
      warnings.push({
        id: "retinoid-vitc",
        severity: "info",
        title: "Tách buổi: Vitamin C (Sáng) & Retinol (Tối)",
        advice: "Dùng Vitamin C trước kem chống nắng vào buổi sáng và giữ Retinol riêng cho chu trình buổi tối.",
        products: names,
      });
    }
  }

  if (retinoids.length > 0 && benzoyl.length > 0) {
    const names = Array.from(new Set([...retinoids, ...benzoyl].map((p) => p.name)));
    if (names.length >= 2) {
      warnings.push({
        id: "retinoid-bpo",
        severity: "caution",
        title: "Tránh bôi đè: Retinol + Benzoyl Peroxide",
        advice: "Benzoyl Peroxide có thể làm giảm hoạt tính Retinol thông thường. Nên dùng BPO buổi sáng hoặc cách ngày.",
        products: names,
      });
    }
  }

  if (exfoliants.length > 1) {
    warnings.push({
      id: "multi-exfoliant",
      severity: "info",
      title: "Routine có nhiều hơn 1 sản phẩm chứa Acid (BHA/LHA/AHA)",
      advice: "Theo dõi tình trạng khô căng và ưu tiên kết hợp kem phục hồi Panthenol B5 hoặc Ceramides.",
      products: exfoliants.map((p) => p.name),
    });
  }

  return warnings;
}
