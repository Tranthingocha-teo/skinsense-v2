/**
 * The `shop_id` app_metadata claim for a shop account, frozen when the role is granted. Tenancy
 * (which orders and chats a shop sees) must come from app_metadata: `shop_name` lives in
 * user_metadata, which users can rewrite themselves, so deriving the shop from it let a shop
 * rename itself into another shop's orders and inbox. An existing claim is kept.
 */
export function shopIdClaim(
  role: string,
  appMeta: Record<string, unknown>,
  userMeta: Record<string, unknown>,
): { shop_id?: string } {
  if (role !== "shop") return {};
  if (typeof appMeta.shop_id === "string" && appMeta.shop_id.trim()) return { shop_id: appMeta.shop_id };
  const details = (userMeta.shop_details as Record<string, unknown> | undefined) ?? {};
  const name = [userMeta.shop_name, details.shopName, userMeta.full_name].find(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
  return name ? { shop_id: normalizeShopId(name) } : {};
}

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
