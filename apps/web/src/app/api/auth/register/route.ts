import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      role = "customer",
      phoneNumber,
      shopName,
      specialty,
      licenseId,
      hospital,
    } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Vui lòng nhập email và mật khẩu." }, { status: 400 });
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: "Máy chủ chưa cấu hình Supabase Service Key." }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedEmail = email.trim().toLowerCase();
    const isAdminEmail = normalizedEmail === "hattn.23itb@vku.udn.vn";
    const effectiveRole = isAdminEmail ? "admin" : role;
    
    // Specialists start as "pending" approval unless it is the super admin
    const status = isAdminEmail
      ? "active"
      : effectiveRole === "specialist"
      ? "pending"
      : "active";

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: isAdminEmail
          ? "Trần Thị Ngọc Hà (Super Admin)"
          : fullName?.trim() || normalizedEmail.split("@")[0],
        role: effectiveRole,
        status,
        phone_number: phoneNumber?.trim() || "",
        shop_name: shopName?.trim() || "",
        specialty: specialty?.trim() || "",
        license_id: licenseId?.trim() || "",
        hospital: hospital?.trim() || "",
        is_super_admin: isAdminEmail,
        submitted_at: new Date().toISOString(),
      },
    });

    if (error) {
      const msg = error.message.includes("already registered")
        ? "Email này đã được đăng ký trên hệ thống. Vui lòng chuyển sang tab Đăng nhập."
        : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      user: data.user,
      status,
      message:
        effectiveRole === "specialist"
          ? "Yêu cầu đăng ký Bác sĩ Da liễu đã được gửi tới Admin Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn) để xét duyệt."
          : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Đăng ký thất bại, vui lòng thử lại." },
      { status: 500 },
    );
  }
}
