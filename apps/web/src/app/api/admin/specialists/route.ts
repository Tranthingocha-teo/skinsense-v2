import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase credentials." }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const specialists = data.users
      .filter((u) => u.user_metadata?.role === "specialist")
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Bác sĩ Da liễu",
        phone: u.user_metadata?.phone_number || "",
        status: u.user_metadata?.status || "pending",
        specialty: u.user_metadata?.specialty || "Da liễu tổng quát",
        licenseId: u.user_metadata?.license_id || "Đang bổ sung CCHN",
        hospital: u.user_metadata?.hospital || "Chưa cập nhật",
        createdAt: u.created_at,
      }));

    return NextResponse.json({ ok: true, specialists });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load specialists." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, action } = body; // action: "approve" | "reject"

    if (!userId || !action) {
      return NextResponse.json({ error: "Thiếu userId hoặc action." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase credentials." }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const newStatus = action === "approve" ? "active" : "suspended";

    const { data: userRes, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userRes.user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản người dùng." }, { status: 404 });
    }

    const updatedMetadata = {
      ...userRes.user.user_metadata,
      status: newStatus,
      approved_by: "hattn.23itb@vku.udn.vn",
      approved_at: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: newStatus,
      message: action === "approve" ? "Đã phê duyệt bác sĩ thành công!" : "Đã từ chối cấp phép bác sĩ.",
      user: updated.user,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cập nhật trạng thái thất bại." },
      { status: 500 },
    );
  }
}
