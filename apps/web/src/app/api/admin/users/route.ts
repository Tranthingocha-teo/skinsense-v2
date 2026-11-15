import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const users = data.users.map((u) => {
      const meta = u.user_metadata || {};
      const isSuperAdmin = u.email?.toLowerCase() === "hattn.23itb@vku.udn.vn";
      const role = isSuperAdmin ? "admin" : (meta.role || "customer");
      const status = isSuperAdmin ? "active" : (meta.status || "active");

      return {
        id: u.id,
        name: isSuperAdmin
          ? "Trần Thị Ngọc Hà (Super Admin)"
          : (meta.full_name || meta.name || u.email?.split("@")[0] || "Người dùng"),
        email: u.email || "",
        phone: meta.phone_number || u.phone || "0905 123 456",
        role,
        status,
        createdAt: u.created_at ? u.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        avatarUrl: meta.avatar_url || meta.picture,
        shopDetails: role === "shop" ? {
          shopName: meta.shop_name || "Cửa Hàng Dược Mỹ Phẩm SkinSense",
          license: meta.license || "GPKD-882910-HCM",
          category: meta.category || "Dược mỹ phẩm chăm sóc & phục hồi da",
          address: meta.address || "Quận 1, TP. Hồ Chí Minh",
        } : undefined,
        specialistDetails: role === "specialist" ? {
          hospital: meta.hospital || "Bệnh viện Da Liễu Trung Ương",
          licenseId: meta.license_id || "CCHN-003419/BYT",
          specialty: meta.specialty || "Da liễu thẩm mỹ & Trị mụn",
        } : undefined,
      };
    });

    return NextResponse.json({ ok: true, users });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load real users." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password = "password123@", fullName, role = "customer", phone, shopName, specialty, hospital, licenseId } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName?.trim() || normalizedEmail.split("@")[0],
        role,
        status: role === "specialist" ? "pending" : "active",
        phone_number: phone?.trim() || "",
        shop_name: shopName?.trim() || "",
        specialty: specialty?.trim() || "",
        hospital: hospital?.trim() || "",
        license_id: licenseId?.trim() || "",
        created_at_local: new Date().toISOString(),
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: data.user });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Tạo người dùng thất bại." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, status } = body;

    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: userRes, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (fetchErr || !userRes.user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const updatedMetadata = {
      ...userRes.user.user_metadata,
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: data.user });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cập nhật người dùng thất bại." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Đã xóa người dùng thành công." });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Xóa người dùng thất bại." },
      { status: 500 },
    );
  }
}
