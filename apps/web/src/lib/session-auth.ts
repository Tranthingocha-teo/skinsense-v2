import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { normalizeShopId } from "@/lib/shop-utils";

export type ActorRole = "customer" | "specialist" | "shop" | "admin";

export interface AuthenticatedActor {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  role: ActorRole;
  shopName?: string;
  shopId?: string;
}

const SUPER_ADMIN_EMAIL = "hattn.23itb@vku.udn.vn";

/**
 * Xác thực người dùng hiện tại từ Supabase SSR cookie (hoặc Bearer token nếu có).
 * Trả về `null` nếu chưa đăng nhập hoặc token không hợp lệ.
 */
export async function getAuthenticatedActor(request?: Request): Promise<AuthenticatedActor | null> {
  try {
    const supabaseServer = await createServerClient();
    const { data } = await supabaseServer.auth.getUser();
    let user = data?.user ?? null;

    if (!user && request) {
      const authHeader = request.headers.get("authorization");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (authHeader?.startsWith("Bearer ") && url && serviceKey) {
        const token = authHeader.slice(7).trim();
        if (token) {
          const adminClient = createAdminClient(url, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const { data: tokenData } = await adminClient.auth.getUser(token);
          user = tokenData?.user ?? null;
        }
      }
    }

    if (!user) return null;

    const email = (user.email || "").trim().toLowerCase();
    const meta = (user.user_metadata || {}) as Record<string, unknown>;
    const appMeta = (user.app_metadata || {}) as Record<string, unknown>;
    const shopDetails = (meta.shop_details as Record<string, unknown> | undefined) ?? undefined;

    let role: ActorRole = "customer";
    if (email === SUPER_ADMIN_EMAIL || appMeta.role === "admin") {
      role = "admin";
    } else if (appMeta.role === "shop" || meta.role === "shop") {
      role = "shop";
    } else if (appMeta.role === "specialist" || meta.role === "specialist") {
      role = "specialist";
    }

    const fullName = String(
      meta.full_name || meta.name || email.split("@")[0] || "Khách hàng",
    ).trim();

    const phone = String(meta.phone_number || user.phone || "").replace(/[^0-9]/g, "");

    let shopName: string | undefined;
    let shopId: string | undefined;
    if (role === "shop") {
      shopName = String(
        meta.shop_name || shopDetails?.shopName || fullName || "SkinSense Official",
      ).trim();
      const rawShopId = String(meta.shop_id || appMeta.shop_id || shopName);
      shopId = normalizeShopId(rawShopId);
    }

    return {
      userId: user.id,
      email,
      fullName,
      phone,
      role,
      shopName,
      shopId,
    };
  } catch {
    return null;
  }
}
