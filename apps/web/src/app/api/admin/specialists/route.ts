import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function downloadJsonFromStorage<T = any>(supabase: any, path: string): Promise<T | null> {
  try {
    const { data: signData } = await supabase.storage.from("photos").createSignedUrl(path, 60);
    if (signData?.signedUrl) {
      const res = await fetch(signData.signedUrl + `&_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        return (await res.json()) as T;
      }
    }
    const { data: fileBlob } = await supabase.storage.from("photos").download(path);
    if (fileBlob) {
      return JSON.parse(await fileBlob.text()) as T;
    }
  } catch {}
  return null;
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch from Supabase Storage registry
    const storageSpecialists: any[] = (await downloadJsonFromStorage<any[]>(supabaseAdmin, "specialists/specialists_registry.json")) || [];

    // 2. Fetch from Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const authSpecialists = data.users
      .filter((u) => u.user_metadata?.role === "specialist")
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Bác sĩ Da liễu",
        phone: u.user_metadata?.phone_number || "",
        status: u.user_metadata?.status || "pending",
        specialty: u.user_metadata?.specialty || "Chuyên khoa Da liễu & Thẩm mỹ Da",
        licenseId: u.user_metadata?.license_id || "014289/BYT-CCHN",
        hospital: u.user_metadata?.hospital || "Bệnh viện Da Liễu Trung Ương",
        submittedAt: u.user_metadata?.submitted_at || u.created_at,
        approvedAt: u.user_metadata?.approved_at,
        approvedBy: u.user_metadata?.approved_by,
      }));

    // Merge storage + auth specialists, storage priority
    const combined = [...storageSpecialists];
    for (const as of authSpecialists) {
      if (!combined.some((s) => s.email?.toLowerCase() === as.email?.toLowerCase())) {
        combined.push(as);
      }
    }

    return NextResponse.json({ ok: true, specialists: combined });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, email } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: "Thiếu userId hoặc email bác sĩ" }, { status: 400 });
    }
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const newStatus = action === "approve" ? "active" : "rejected";
    const targetEmail = email?.toLowerCase();

    // 1. Update Supabase Auth user metadata
    try {
      if (userId && userId.length === 36) {
        const { data: userObj } = await supabaseAdmin.auth.admin.getUserById(userId);
        const updatedMetadata = {
          ...(userObj?.user?.user_metadata || {}),
          status: newStatus,
          role: "specialist",
          approved_by: "Trần Thị Ngọc Hà (Super Admin)",
          approved_at: new Date().toISOString(),
        };

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: updatedMetadata,
        });
      }
    } catch {}

    // 2. Update Supabase Storage specialists_registry.json
    try {
      const list = (await downloadJsonFromStorage<any[]>(supabaseAdmin, "specialists/specialists_registry.json")) || [];
      if (list.length > 0) {
        const updatedList = list.map((s) => {
          if (s.id === userId || (targetEmail && s.email?.toLowerCase() === targetEmail)) {
            return {
              ...s,
              status: newStatus,
              approvedBy: "Trần Thị Ngọc Hà (Super Admin)",
              approvedAt: new Date().toISOString(),
            };
          }
          return s;
        });

        await supabaseAdmin.storage.from("photos").upload(
          "specialists/specialists_registry.json",
          Buffer.from(JSON.stringify(updatedList, null, 2)),
          { upsert: true, contentType: "application/json" }
        );
      }
    } catch {}

    return NextResponse.json({
      ok: true,
      status: newStatus,
      message: action === "approve" ? "Đã phê duyệt hồ sơ Bác sĩ thành công!" : "Đã từ chối cấp phép bác sĩ.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cập nhật trạng thái thất bại." },
      { status: 500 },
    );
  }
}
