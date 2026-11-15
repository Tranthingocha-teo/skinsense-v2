import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedActor, requireRoleActor } from "@/lib/session-auth";
import { matchesShop } from "@/lib/shop-product-approval";

export interface ProductItem {
  id: string;
  name: string;
  shopName: string;
  price: number;
  category: string;
  status: "approved" | "pending" | "rejected";
  submittedAt: string;
  stock: number;
  brand?: string;
  sku?: string;
  coverImage?: string;
  images?: string[];
  description?: string;
  origin?: string;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadStorageProducts(): Promise<ProductItem[]> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return [];
    const { data: fileBlob } = await admin.storage
      .from("photos")
      .download("products/products_registry.json");
    if (fileBlob) {
      const list = JSON.parse(await fileBlob.text());
      if (Array.isArray(list)) return list;
    }
  } catch {}
  return [];
}

async function saveStorageProducts(list: ProductItem[]): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await admin.storage.from("photos").upload(
      "products/products_registry.json",
      Buffer.from(JSON.stringify(list, null, 2)),
      { upsert: true, contentType: "application/json" }
    );
  } catch (err) {
    console.warn("Lỗi lưu products_registry:", err);
  }
}

// Initial verified products for core authentic flagship shops
let PRODUCTS_STORE: ProductItem[] = [
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetShop = searchParams.get("shopName")?.trim();
  const targetStatus = searchParams.get("status")?.trim();
  const actor = await getAuthenticatedActor(request);

  // Combine storage and in-memory store
  const storageList = await loadStorageProducts();
  const mergedMap = new Map<string, ProductItem>();
  PRODUCTS_STORE.forEach((p) => mergedMap.set(p.id, p));
  storageList.forEach((sp) => mergedMap.set(sp.id, sp));

  let products = Array.from(mergedMap.values());

  // Enforce draft visibility: unauthenticated / customer visitors only browse approved products;
  // shop owners also see their own pending/rejected submissions; admin sees everything.
  if (actor?.role === "admin") {
    // Full visibility
  } else if (actor?.role === "shop") {
    const ownShop = actor.shopName || actor.shopId || "";
    products = products.filter(
      (p) => p.status === "approved" || (ownShop && matchesShop(p.shopName, ownShop)),
    );
  } else {
    products = products.filter((p) => p.status === "approved");
  }

  // Filter strictly to the specified shop if requested
  if (targetShop && targetShop !== "all") {
    products = products.filter((p) => matchesShop(p.shopName, targetShop));
  }

  // Filter by approval status if requested
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

    const effectiveShopName =
      actor.role === "shop" && actor.shopName
        ? actor.shopName
        : shopName?.trim() || "Cửa Hàng Đối Tác SkinSense";

    const normalizedImages: string[] = Array.isArray(images)
      ? images
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim())
      : [];
    const resolvedCover = coverImage?.trim() || normalizedImages[0] || "";
    const resolvedImages =
      normalizedImages.length > 0
        ? normalizedImages
        : resolvedCover
          ? [resolvedCover]
          : [];

    const newProd: ProductItem = {
      id: `prod_${Date.now()}`,
      name: name?.trim() || "Sản phẩm dược mỹ phẩm mới",
      shopName: effectiveShopName,
      price: Number(price) || 350000,
      category: category?.trim() || "Chăm sóc da chuyên sâu",
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

    PRODUCTS_STORE = [newProd, ...PRODUCTS_STORE];

    // Sync to Supabase Storage
    const storageList = await loadStorageProducts();
    const updatedStorage = [newProd, ...storageList.filter((p) => p.id !== newProd.id)];
    await saveStorageProducts(updatedStorage);

    return NextResponse.json({ ok: true, product: newProd });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Thêm sản phẩm thất bại" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { productId, status } = body; // "approved" | "rejected" | "pending"

    if (!productId || !status) {
      return NextResponse.json({ error: "Thiếu productId hoặc status." }, { status: 400 });
    }

    PRODUCTS_STORE = PRODUCTS_STORE.map((p) => (p.id === productId ? { ...p, status } : p));

    // Sync to Supabase Storage
    const storageList = await loadStorageProducts();
    const updatedStorage = storageList.map((p) => (p.id === productId ? { ...p, status } : p));
    await saveStorageProducts(updatedStorage);

    return NextResponse.json({ ok: true, message: `Đã cập nhật trạng thái sản phẩm thành ${status}` });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Cập nhật thất bại" }, { status: 500 });
  }
}

