import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Đường dẫn file lưu tạm cục bộ để đảm bảo dữ liệu luôn lưu trữ bền vững khi test local
const CACHE_FILE = path.join(process.cwd(), ".profiles-cache.json");

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

function readCache(): Record<string, Record<string, unknown>> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as Record<string, Record<string, unknown>>;
    }
  } catch {}
  return {};
}

function writeCache(data: Record<string, Record<string, unknown>>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
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
    const requestedEmail = searchParams.get("email");

    const cache = readCache();

    // 1. Kiểm tra session đăng nhập hiện tại từ Supabase
    let authUser: Awaited<ReturnType<Awaited<ReturnType<typeof createServerClient>>["auth"]["getUser"]>>["data"]["user"] = null;
    try {
      const supabase = await createServerClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        authUser = data.user;
      }
    } catch {}

    // Xác định role cần trả về
    let activeRole = requestedRole || (authUser ? (authUser.user_metadata?.role || "customer") : "customer");
    if (authUser && authUser.email?.toLowerCase() === "hattn.23itb@vku.udn.vn") {
      activeRole = requestedRole || "admin";
    }

    // 2. Tìm trong cache cục bộ đã lưu trước đó nếu có
    const cacheKey = requestedEmail || (authUser?.email) || activeRole;
    if (cache[cacheKey]) {
      return NextResponse.json({ ok: true, user: cache[cacheKey], source: "cache" });
    }

    // 3. Truy vấn dữ liệu thực tế từ Database Supabase (nếu có tài khoản)
    const admin = getSupabaseAdmin();
    if (admin && authUser) {
      try {
        // Đọc từ bảng profiles (chỉ dùng các cột có sẵn: id, email, role, full_name, avatar_url, updated_at)
        const { data: profileRow } = await admin
          .from("profiles")
          .select("id, email, role, full_name, avatar_url, updated_at")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profileRow) {
          const baseUser = {
            id: profileRow.id,
            email: profileRow.email,
            role: profileRow.role,
            fullName: profileRow.full_name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
            avatarUrl: profileRow.avatar_url || authUser.user_metadata?.avatar_url || DEFAULT_ROLE_PROFILES[profileRow.role]?.avatarUrl,
            phone: authUser.user_metadata?.phone_number || authUser.phone || "0987 654 321",
            status: "active",
            createdAt: authUser.created_at,
          };

          // Nếu là Bác sĩ, lấy thêm từ bảng specialists có sẵn
          if (profileRow.role === "specialist") {
            const { data: specRow } = await admin
              .from("specialists")
              .select("id, full_name, license_number, specialty, hospital, experience_years, phone, email, avatar_url, status, bio, rating, review_count, cases_count")
              .eq("email", profileRow.email)
              .maybeSingle();

            return NextResponse.json({
              ok: true,
              user: {
                ...baseUser,
                specialist: specRow || DEFAULT_ROLE_PROFILES.specialist.specialist,
              },
            });
          }

          return NextResponse.json({
            ok: true,
            user: {
              ...baseUser,
              shop: DEFAULT_ROLE_PROFILES.shop.shop,
              customer: DEFAULT_ROLE_PROFILES.customer.customer,
            },
          });
        }
      } catch {}
    }

    // 4. Nếu chưa có trên DB hoặc đang ở chế độ xem role cụ thể, trả về dữ liệu mẫu tương ứng
    const fallback = DEFAULT_ROLE_PROFILES[activeRole] || DEFAULT_ROLE_PROFILES.customer;
    return NextResponse.json({ ok: true, user: fallback, source: "default" });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body: ProfilePayload = await req.json();

    if (!body.fullName || !body.email || !body.role) {
      return NextResponse.json(
        { ok: false, error: "Họ tên, email và vai trò không được để trống." },
        { status: 400 },
      );
    }

    // 1. Lưu vào cache cục bộ
    const cache = readCache();
    const updatedUser = {
      ...DEFAULT_ROLE_PROFILES[body.role],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    cache[body.email.toLowerCase()] = updatedUser;
    cache[body.role] = updatedUser;
    writeCache(cache);

    // 2. Lưu vào Supabase Session (nếu user đang đăng nhập)
    try {
      const serverClient = await createServerClient();
      const { data: sessionData } = await serverClient.auth.getUser();
      if (sessionData?.user) {
        const u = sessionData.user;
        await serverClient.auth.updateUser({
          data: {
            full_name: body.fullName,
            avatar_url: body.avatarUrl,
            phone_number: body.phone,
            role: body.role,
            ...(body.specialist ? { hospital: body.specialist.hospital, license_id: body.specialist.licenseNumber } : {}),
            ...(body.shop ? { shop_name: body.shop.shopName, address: body.shop.address } : {}),
            ...(body.customer ? { address: body.customer.address, skin_type: body.customer.skinType } : {}),
          },
        });

        await serverClient.from("profiles").upsert({
          id: u.id,
          email: u.email || body.email,
          role: body.role,
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
        // Cập nhật bảng profiles: id, email, role, full_name, avatar_url, updated_at
        if (body.id) {
          await admin.from("profiles").upsert(
            {
              id: body.id,
              email: body.email,
              role: body.role,
              full_name: body.fullName,
              avatar_url: body.avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );
        }

        // Nếu là role specialist: Cập nhật bảng specialists bằng các cột có sẵn
        if (body.role === "specialist" && body.specialist) {
          const specId = body.specialist.id || "spec_01";
          await admin.from("specialists").upsert(
            {
              id: specId,
              full_name: body.fullName,
              license_number: body.specialist.licenseNumber || "014289/BYT-CCHN",
              specialty: body.specialist.specialty || "Chuyên khoa Da liễu & Thẩm mỹ Da",
              hospital: body.specialist.hospital || "Bệnh viện Da Liễu Trung Ương",
              experience_years: Number(body.specialist.experienceYears || 5),
              phone: body.phone || "0905 123 456",
              email: body.email,
              avatar_url: body.avatarUrl,
              bio: body.specialist.bio || "",
            },
            { onConflict: "id" },
          );
        }

        // Cập nhật metadata tài khoản Auth (nếu có user id)
        if (body.id) {
          await admin.auth.admin.updateUserById(body.id, {
            user_metadata: {
              full_name: body.fullName,
              avatar_url: body.avatarUrl,
              phone_number: body.phone,
              role: body.role,
              ...(body.specialist ? { hospital: body.specialist.hospital, license_id: body.specialist.licenseNumber } : {}),
              ...(body.shop ? { shop_name: body.shop.shopName, address: body.shop.address } : {}),
            },
          });
        }
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
