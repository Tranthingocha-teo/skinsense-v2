import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { downloadStorageJson } from "@/lib/supabase/storage-json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, role: "guest" });
    }

    const email = user.email?.trim().toLowerCase() || "";

    // 1. Super Admin
    if (email === "hattn.23itb@vku.udn.vn") {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email,
          fullName: "Trần Thị Ngọc Hà (Super Admin)",
          role: "admin",
          status: "active",
          isSuperAdmin: true,
        },
      });
    }

    // 2. Check Specialist registry from Supabase Storage
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    interface SpecialistRecord {
      email?: string;
      status?: string;
      name?: string;
      licenseId?: string;
      hospital?: string;
      specialty?: string;
    }
    interface ShopRecord {
      email?: string;
      status?: string;
      shopName?: string;
      ownerName?: string;
      license?: string;
      category?: string;
      address?: string;
      phone?: string;
    }
    // Both registries are read in parallel: each read is a round trip to Supabase Storage.
    let specialistRecord: SpecialistRecord | null = null;
    let shopRecord: ShopRecord | null = null;
    if (url && serviceKey) {
      const adminClient = createAdminClient(url, serviceKey);
      const [specialists, shops] = await Promise.all([
        downloadStorageJson<SpecialistRecord[]>("specialists/specialists_registry.json", adminClient).catch(() => null),
        downloadStorageJson<ShopRecord[]>("shops/shops_registry.json", adminClient).catch(() => null),
      ]);
      if (Array.isArray(specialists)) specialistRecord = specialists.find((s) => s.email?.toLowerCase() === email) ?? null;
      if (Array.isArray(shops)) shopRecord = shops.find((s) => s.email?.toLowerCase() === email) ?? null;
    }

    interface AuthUserMetadata {
      role?: string;
      status?: string;
      full_name?: string;
      name?: string;
      phone_number?: string;
      shop_name?: string;
      license?: string;
      category?: string;
      address?: string;
      license_id?: string;
      hospital?: string;
      specialty?: string;
      shop_details?: {
        shopName?: string;
        license?: string;
        category?: string;
        address?: string;
      };
    }

    const meta = (user.user_metadata || {}) as AuthUserMetadata;

    const appMeta = (user.app_metadata || {}) as Record<string, unknown>;
    // Role and status come from app_metadata, which is what grants the rights. They used to come
    // from the registries (or user_metadata) first, so after an approval or a lock the app and
    // the APIs disagreed about what the account could do. The registries only add details.
    const appRole = typeof appMeta.role === "string" ? appMeta.role : "customer";
    const role = appRole === "admin" || appRole === "shop" || appRole === "specialist" ? appRole : "customer";
    const isSpecialist = role === "specialist";
    const isShop = role === "shop";
    const status = typeof appMeta.status === "string" ? appMeta.status : "active";

    const shopDetails = isShop
      ? {
          shopName: shopRecord?.shopName || meta.shop_name || meta.shop_details?.shopName || "Cửa Hàng Dược Mỹ Phẩm SkinSense",
          ownerName: shopRecord?.ownerName || meta.full_name || meta.name || "Chủ Gian Hàng",
          license: shopRecord?.license || meta.license || meta.shop_details?.license || "GPKD-Đang duyệt",
          category: shopRecord?.category || meta.category || meta.shop_details?.category || "Dược mỹ phẩm & Trị mụn",
          address: shopRecord?.address || meta.address || meta.shop_details?.address || "Việt Nam",
          phone: shopRecord?.phone || meta.phone_number || "",
        }
      : undefined;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email,
        fullName:
          specialistRecord?.name ||
          (isShop ? shopRecord?.shopName || meta.shop_name : undefined) ||
          meta.full_name ||
          meta.name ||
          (isSpecialist ? "Bác sĩ Da liễu" : isShop ? "Chủ Gian Hàng" : email.split("@")[0]),
        role,
        status,
        shopDetails,
        licenseId: specialistRecord?.licenseId || meta.license_id || (isSpecialist ? "014289/BYT-CCHN" : undefined),
        hospital: specialistRecord?.hospital || meta.hospital || (isSpecialist ? "Bệnh viện Da Liễu Trung Ương" : undefined),
        specialty: specialistRecord?.specialty || meta.specialty || (isSpecialist ? "Chuyên khoa Da liễu & Thẩm mỹ Da" : undefined),
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, error: "Failed to check session" }, { status: 500 });
  }
}
