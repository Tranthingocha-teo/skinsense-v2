/**
 * Chuẩn hóa tên hoặc mã gian hàng thành slug `shopId` duy nhất.
 * Ánh xạ các thương hiệu chuẩn của hệ thống về ID cố định và slug hóa các shop khác
 * để tránh ghi đè chéo dữ liệu giữa nhiều gian hàng độc lập.
 */
export function normalizeShopId(shopNameOrId?: string | null): string {
  const raw = (shopNameOrId || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();

  if (!raw) return "skinsense_mall";
  if (raw.includes("roche") || raw.includes("laroche")) return "larocheposay";
  if (raw.includes("bioderma")) return "bioderma";
  if (raw.includes("cerave")) return "cerave";

  if (
    raw === "skinsense_mall" ||
    raw.includes("skinsense") ||
    raw === "gian hang mall" ||
    raw === "gian hang shopee mall" ||
    raw === "shopee mall flagship"
  ) {
    return "skinsense_mall";
  }

  const slug = raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return slug || "skinsense_mall";
}
