import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedActor, requireRoleActor } from "@/lib/session-auth";
import type { ActorRole } from "@/lib/actor-role";
import { profileFromAuthUser, type ProfileRow, type SpecialistRow } from "@/lib/profile-from-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProfilePayload {
  id?: string;
  email: string;
  role: "customer" | "specialist" | "shop" | "admin";
  fullName: string;
  avatarUrl: string;
  phone?: string;
  specialist?: {
    id?: string;
    hospital?: string;
    licenseNumber?: string;
    specialty?: string;
    experienceYears?: number;
    bio?: string;
  };
  shop?: {
    shopName?: string;
    address?: string;
    phone?: string;
    category?: string;
    license?: string;
  };
  customer?: {
    address?: string;
    skinType?: string;
    allergies?: string;
  };
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  try {
    return createAdminClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch {
    return null;
  }
}

interface RoleProfileDefault extends Record<string, unknown> {
  id: string;
  email: string;
  role: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
  status: string;
  createdAt: string;
}

// Dữ liệu mẫu chuẩn của hệ thống SkinSense v2 theo đúng 4 role
const DEFAULT_ROLE_PROFILES: Record<string, RoleProfileDefault> = {
  admin: {
    id: "admin_super",
    email: "hattn.23itb@vku.udn.vn",
    role: "admin",
    fullName: "Trần Thị Ngọc Hà",
    title: "Super Admin - Trưởng dự án",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    phone: "0905 888 999",
    status: "active",
    department: "Viện CNTT & Y tế Số VKU",
    createdAt: "2026-11-01T00:00:00Z",
    stats: {
      totalModules: 4,
      securityScore: "100%",
      managedAccounts: 1250,
      activeDoctors: 18,
    },
  },
  specialist: {
    id: "spec_01",
    email: "maihoa.dermatology@skinsense.vn",
    role: "specialist",
    fullName: "BS. CKI Nguyễn Mai Hoa",
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    phone: "0905 123 456",
    status: "approved",
    createdAt: "2026-11-05T00:00:00Z",
    specialist: {
      id: "spec_01",
      hospital: "Bệnh viện Da Liễu Trung Ương",
      licenseNumber: "014289/BYT-CCHN",
      specialty: "Chuyên khoa Da liễu & Thẩm mỹ Da",
      experienceYears: 10,
      bio: "Hơn 10 năm kinh nghiệm điều trị mụn trứng cá chuyên sâu, phục hồi hàng rào màng đáy da nhạy cảm và điều trị tăng sắc tố sau viêm.",
      rating: 5.0,
      reviewCount: 142,
      casesCount: 890,
      approvedBy: "Trần Thị Ngọc Hà (Super Admin)",
    },
  },
  shop: {
    id: "shop_01",
    email: "shop.laroche@skinsense.vn",
    role: "shop",
    fullName: "La Roche-Posay Official Flagship Store",
    avatarUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80",
    phone: "1900 123 456",
    status: "approved",
    createdAt: "2026-11-08T00:00:00Z",
    shop: {
      shopName: "La Roche-Posay Official Flagship Store",
      address: "Tầng 12, Tòa nhà Bitexco, Số 2 Hải Triều, P. Bến Nghé, Quận 1, TP. HCM",
      phone: "1900 123 456",
      category: "Dược mỹ phẩm chăm sóc & phục hồi da chuẩn y khoa",
      license: "GPKD-882910-HCM / CBMP-54321/22/CBMP-QLD",
      balance: 145800000,
      rating: 5.0,
      soldCount: 12850,
      productCount: 45,
    },
  },
  customer: {
    id: "cust_01",
    email: "khachhang@gmail.com",
    role: "customer",
    fullName: "Thùy Dung",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    phone: "0987 654 321",
    status: "active",
    createdAt: "2026-11-10T00:00:00Z",
    customer: {
      address: "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      skinType: "Da hỗn hợp thiên dầu, nhạy cảm vùng chữ T (Fitzpatrick III)",
      allergies: "Dị ứng hương liệu nồng (Fragrance) và cồn khô nồng độ cao (Alcohol denat)",
      totalOrders: 4,
      routineStreak: 12,
    },
  },
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedRole = searchParams.get("role");

    const actor = await getAuthenticatedActor(req);

    // 1. Kiểm tra session đăng nhập hiện tại từ Supabase
    let authUser: Awaited<ReturnType<Awaited<ReturnType<typeof createServerClient>>["auth"]["getUser"]>>["data"]["user"] = null;
    try {
      const supabase = await createServerClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        authUser = data.user;
      }
    } catch {}

    // Nếu chưa đăng nhập: chỉ trả dữ liệu mẫu tĩnh theo role (không đọc cache email thật)
    if (!actor && !authUser) {
      const previewRole =
        requestedRole && requestedRole in DEFAULT_ROLE_PROFILES ? requestedRole : "customer";
      const fallback = DEFAULT_ROLE_PROFILES[previewRole] || DEFAULT_ROLE_PROFILES.customer;
      return NextResponse.json({ ok: true, user: fallback, source: "default" });
    }

    const activeRole =
      actor?.role === "admin" && requestedRole
        ? requestedRole
        : actor?.role || requestedRole || (authUser?.user_metadata?.role as string) || "customer";

    // 2. (The local .profiles-cache.json is gone: it was read before the account, was seeded with
    //    the sample persona on save, and on a read-only serverless disk never worked anyway.)
    // 3. The signed-in user's own data: auth record, profiles row and (specialist) specialists row.
    //    Never a sample persona: a new account used to get "Thùy Dung" / "La Roche-Posay" here, with
    //    that persona's address, allergies and licence shown as the user's own.
    if (authUser) {
      const role = (activeRole in DEFAULT_ROLE_PROFILES ? activeRole : "customer") as ActorRole;
      const admin = getSupabaseAdmin();
      let profileRow: ProfileRow | null = null;
      let specRow: SpecialistRow | null = null;
      if (admin) {
        try {
          const { data } = await admin
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", authUser.id)
            .maybeSingle();
          profileRow = data;
          if (role === "specialist" && authUser.email) {
            const { data: spec } = await admin
              .from("specialists")
              .select("id, hospital, license_number, specialty, experience_years, bio")
              .eq("email", authUser.email.toLowerCase())
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            specRow = spec;
          }
        } catch {}
      }
      return NextResponse.json({
        ok: true,
        user: profileFromAuthUser(authUser, role, {
          profile: profileRow,
          specialist: specRow,
          defaultAvatarUrl: DEFAULT_ROLE_PROFILES[role]?.avatarUrl,
        }),
        source: "account",
      });
    }

    // 4. A Bearer-token actor without a cookie session: the sample for its role.
    const fallback = DEFAULT_ROLE_PROFILES[activeRole] || DEFAULT_ROLE_PROFILES.customer;
    return NextResponse.json({ ok: true, user: fallback, source: "default" });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireRoleActor(req);
  if (!auth.ok) return auth.response;
  const { actor } = auth;

  try {
    const body: ProfilePayload = await req.json();

    const effectiveId = actor.role === "admin" && body.id ? body.id : actor.userId;
    const effectiveEmail =
      actor.role === "admin" && body.email ? body.email.trim().toLowerCase() : actor.email;
    const effectiveRole =
      actor.role === "admin" && body.role ? body.role : actor.role;

    if (!body.fullName || !effectiveEmail || !effectiveRole) {
      return NextResponse.json(
        { ok: false, error: "Họ tên, email và vai trò không được để trống." },
        { status: 400 },
      );
    }

    // 1. What the page gets back: exactly what was saved, no sample-persona fields mixed in.
    const updatedUser = {
      ...body,
      id: effectiveId,
      email: effectiveEmail,
      role: effectiveRole,
      updatedAt: new Date().toISOString(),
    };

    // 2. Lưu vào Supabase Session (nếu user đang đăng nhập)
    try {
      const serverClient = await createServerClient();
      const { data: sessionData } = await serverClient.auth.getUser();
      // Only for the user's own profile: an admin editing someone else must not overwrite their own metadata.
      if (sessionData?.user && sessionData.user.id === effectiveId) {
        const u = sessionData.user;
        await serverClient.auth.updateUser({
          data: {
            full_name: body.fullName,
            avatar_url: body.avatarUrl,
            phone_number: body.phone,
            role: effectiveRole,
            ...(body.specialist ? { hospital: body.specialist.hospital, license_id: body.specialist.licenseNumber, specialty: body.specialist.specialty } : {}),
            ...(body.shop ? { shop_name: body.shop.shopName, address: body.shop.address, license: body.shop.license, category: body.shop.category } : {}),
            ...(body.customer ? { address: body.customer.address, skin_type: body.customer.skinType, allergies: body.customer.allergies } : {}),
          },
        });

        await serverClient.from("profiles").upsert({
          id: u.id,
          email: u.email || effectiveEmail,
          role: effectiveRole,
          full_name: body.fullName,
          avatar_url: body.avatarUrl,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {}

    // 3. Lưu vào Supabase Admin Database (TUYỆT ĐỐI chỉ dùng các trường cột CÓ SẴN trong schema)
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("profiles").upsert(
          {
            id: effectiveId,
            email: effectiveEmail,
            role: effectiveRole,
            full_name: body.fullName,
            avatar_url: body.avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

        // Nếu là role specialist: Cập nhật bảng specialists bằng các cột có sẵn
        if (effectiveRole === "specialist" && body.specialist) {
          // The account's own row: the one already stored under its email, else its user id. A
          // missing id used to fall back to "spec_01", so every specialist overwrote the same row.
          const { data: ownRow } = await admin
            .from("specialists")
            .select("id")
            .eq("email", effectiveEmail)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const specId = ownRow?.id ?? effectiveId;
          await admin.from("specialists").upsert(
            {
              id: specId,
              full_name: body.fullName,
              license_number: body.specialist.licenseNumber || "014289/BYT-CCHN",
              specialty: body.specialist.specialty || "Chuyên khoa Da liễu & Thẩm mỹ Da",
              hospital: body.specialist.hospital || "Bệnh viện Da Liễu Trung Ương",
              experience_years: Number(body.specialist.experienceYears || 5),
              phone: body.phone || "0905 123 456",
              email: effectiveEmail,
              avatar_url: body.avatarUrl,
              bio: body.specialist.bio || "",
            },
            { onConflict: "id" },
          );
        }

        // Cập nhật metadata tài khoản Auth cho chính user hợp lệ
        await admin.auth.admin.updateUserById(effectiveId, {
          user_metadata: {
            full_name: body.fullName,
            avatar_url: body.avatarUrl,
            phone_number: body.phone,
            role: effectiveRole,
            ...(body.specialist ? { hospital: body.specialist.hospital, license_id: body.specialist.licenseNumber } : {}),
            ...(body.shop ? { shop_name: body.shop.shopName, address: body.shop.address } : {}),
          },
        });
      } catch (dbErr) {
        console.warn("Lỗi lưu Supabase (tiếp tục với cache):", dbErr);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Đã cập nhật hồ sơ thành công vào cơ sở dữ liệu!",
      user: updatedUser,
    });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed to update profile" }, { status: 500 });
  }
}
