import { NextResponse } from "next/server";
import { getAuthenticatedActor, requireRoleActor } from "@/lib/session-auth";
import { matchesShop } from "@/lib/shop-product-approval";
import { getSupabaseAdminClient, readStorageJsonList, updateStorageJsonList } from "@/lib/supabase/storage-json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRODUCTS_PATH = "products/products_registry.json";
/** What the admin can set. "hidden" takes an approved product off the marketplace. */
const MODERATION_STATUSES = ["approved", "pending", "rejected", "hidden"] as const;
type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export interface ProductItem {
  id: string;
  name: string;
  shopName: string;
  price: number;
  category: string;
  status: ModerationStatus;
  submittedAt: string;
  stock: number;
  brand?: string;
  sku?: string;
  coverImage?: string;
  images?: string[];
  description?: string;
  origin?: string;
}

function storageClient() {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Máy chủ chưa cấu hình Supabase Service Key.");
  return admin;
}

// Initial verified products for core authentic flagship shops. The stored registry overrides them
// by id: an admin decision on a seed product is stored there, not in this instance's memory.
const SEED_PRODUCTS: ProductItem[] = [
  {
    id: "prod_01",
    name: "Kem dưỡng giảm mụn phục hồi La Roche-Posay Effaclar Duo+M 40ml",
    shopName: "La Roche-Posay Official Store",
    brand: "La Roche-Posay",
    price: 395000,
    category: "Trị mụn & Phục hồi",
    status: "approved",
    submittedAt: "2026-11-01",
    stock: 150,
  },
  {
    id: "prod_02",
    name: "Sữa rửa mặt dưỡng ẩm chuyên sâu CeraVe Hydrating Cleanser 473ml",
    shopName: "CeraVe Skincare Official",
    brand: "CeraVe",
    price: 380000,
    category: "Làm sạch & Cân bằng pH",
    status: "pending",
    submittedAt: "2026-11-08",
    stock: 200,
  },
  {
    id: "prod_03",
    name: "Mặt nạ đất sét tro núi lửa Innisfree Super Volcanic Pore Clay 100ml",
    shopName: "Innisfree Beauty Hub",
    brand: "Innisfree",
    price: 290000,
    category: "Mặt nạ hút dầu & Se khít lỗ chân lông",
    status: "pending",
    submittedAt: "2026-11-09",
    stock: 80,
  },
  {
    id: "prod_04",
    name: "Serum phục hồi da La Roche-Posay Hyalu B5 30ml",
    shopName: "La Roche-Posay Official Store",
    brand: "La Roche-Posay",
    price: 790000,
    category: "Chống lão hóa & Cấp ẩm phục hồi",
    status: "approved",
    submittedAt: "2026-10-25",
    stock: 65,
  },
  {
    id: "prod_05",
    name: "Nước tẩy trang làm sạch Bioderma Sébium H2O 500ml",
    shopName: "Bioderma Vietnam Official",
    brand: "Bioderma",
    price: 395000,
    category: "Tẩy trang & Cân bằng bã nhờn",
    status: "approved",
    submittedAt: "2026-11-05",
    stock: 120,
  },
];

function mergeWithSeeds(stored: ProductItem[]): ProductItem[] {
  const merged = new Map<string, ProductItem>();
  SEED_PRODUCTS.forEach((p) => merged.set(p.id, p));
  stored.forEach((p) => merged.set(p.id, p));
  return Array.from(merged.values());
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetShop = searchParams.get("shopName")?.trim();
  const targetStatus = searchParams.get("status")?.trim();
  const actor = await getAuthenticatedActor(request);

  let products: ProductItem[];
  try {
    products = mergeWithSeeds(await readStorageJsonList<ProductItem>(PRODUCTS_PATH, storageClient()));
  } catch (err) {
    // The console must not show a partial list as if it were complete; buyers still get the
    // built-in catalog rather than an empty storefront.
    if (actor?.role === "admin") {
      return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Không tải được sản phẩm." }, { status: 503 });
    }
    products = SEED_PRODUCTS;
  }

  // Enforce draft visibility: unauthenticated / customer visitors only browse approved products;
  // shop owners also see their own pending/rejected/hidden submissions; admin sees everything.
  if (actor?.role === "admin") {
    // Full visibility
  } else if (actor?.role === "shop") {
    const ownShop = actor.shopName || actor.shopId || "";
    products = products.filter((p) => p.status === "approved" || (ownShop && matchesShop(p.shopName, ownShop)));
  } else {
    products = products.filter((p) => p.status === "approved");
  }

  if (targetShop && targetShop !== "all") {
    products = products.filter((p) => matchesShop(p.shopName, targetShop));
  }
  if (targetStatus && targetStatus !== "all") {
    products = products.filter((p) => p.status === targetStatus);
  }

  return NextResponse.json({ ok: true, products });
}

export async function POST(request: Request) {
  const auth = await requireRoleActor(request, ["shop", "admin"]);
  if (!auth.ok) return auth.response;
  const { actor } = auth;

  try {
    const body = await request.json();
    const { name, shopName, price, category, stock, brand, sku, coverImage, images, description, origin } = body;
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ ok: false, error: "Vui lòng nhập tên sản phẩm." }, { status: 400 });
    }

    const effectiveShopName =
      actor.role === "shop" && actor.shopName ? actor.shopName : shopName?.trim() || "Cửa Hàng Đối Tác SkinSense";

    const normalizedImages: string[] = Array.isArray(images)
      ? images
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim())
      : [];
    const resolvedCover = coverImage?.trim() || normalizedImages[0] || "";
    const resolvedImages = normalizedImages.length > 0 ? normalizedImages : resolvedCover ? [resolvedCover] : [];

    const newProd: ProductItem = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      shopName: effectiveShopName,
      price: Number(price) || 350000,
      category: category?.trim() || "Chăm sóc da chuyên sâu",
      // Every new product waits for the admin, whoever submits it.
      status: "pending",
      submittedAt: new Date().toISOString().split("T")[0],
      stock: Number(stock) || 100,
      brand: brand?.trim() || effectiveShopName || "SkinSense Flagship",
      sku: sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      coverImage: resolvedCover,
      images: resolvedImages,
      description: description?.trim() || "Sản phẩm chính hãng đã qua kiểm định.",
      origin: origin?.trim() || "Pháp",
    };

    // Locked and checked: a failed save used to be logged and answered "ok", and a failed read
    // was treated as an empty registry and written back over every product.
    await updateStorageJsonList<ProductItem, void>(PRODUCTS_PATH, storageClient(), (list) => ({
      next: [newProd, ...list.filter((p) => p.id !== newProd.id)],
      result: undefined,
    }));

    return NextResponse.json({ ok: true, product: newProd });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Thêm sản phẩm thất bại" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const { productId, status } = await request.json();

    if (!productId || !status) {
      return NextResponse.json({ ok: false, error: "Thiếu productId hoặc status." }, { status: 400 });
    }
    if (!(MODERATION_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ ok: false, error: "Trạng thái sản phẩm không hợp lệ." }, { status: 400 });
    }

    const product = await updateStorageJsonList<ProductItem, ProductItem | null>(PRODUCTS_PATH, storageClient(), (list) => {
      const current = list.find((p) => p.id === productId) ?? SEED_PRODUCTS.find((p) => p.id === productId);
      if (!current) return { next: null, result: null };
      const updated = { ...current, status: status as ModerationStatus };
      return { next: [updated, ...list.filter((p) => p.id !== productId)], result: updated };
    });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy sản phẩm." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, product, message: "Đã cập nhật trạng thái sản phẩm." });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Cập nhật thất bại" }, { status: 500 });
  }
}
