import { NextResponse } from "next/server";
import { requireRoleActor } from "@/lib/session-auth";
import { getSupabaseAdminClient, readStorageJsonList } from "@/lib/supabase/storage-json";
import {
  ApprovalError,
  REGISTRY_PATHS,
  applyAccountDecision,
  isAccountStatus,
  listAllUsers,
} from "@/lib/admin-approvals";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SpecialistRegistryItem {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
  status?: string;
  specialty?: string;
  licenseId?: string;
  hospital?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

function errorResponse(err: unknown, fallback: string) {
  if (err instanceof ApprovalError) return NextResponse.json({ ok: false, error: err.message }, { status: err.httpStatus });
  return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : fallback }, { status: 500 });
}

/** Doctor accounts with their application details. Status comes from app_metadata only. */
export async function GET(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const admin = getSupabaseAdminClient();
    if (!admin) throw new ApprovalError("Máy chủ chưa cấu hình Supabase Service Key.", 500);
    const [registry, users] = await Promise.all([
      readStorageJsonList<SpecialistRegistryItem>(REGISTRY_PATHS.specialist, admin),
      listAllUsers(admin),
    ]);

    const specialists = users
      .filter((u) => u.app_metadata?.role === "specialist")
      .map((u) => {
        const email = (u.email ?? "").toLowerCase();
        const entry = registry.find((s) => s.id === u.id || s.email?.toLowerCase() === email) ?? {};
        const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
        return {
          ...entry,
          id: u.id,
          email,
          name: entry.name || meta.full_name || email.split("@")[0],
          phone: entry.phone || meta.phone_number || "",
          specialty: entry.specialty || meta.specialty || "",
          licenseId: entry.licenseId || meta.license_id || "",
          hospital: entry.hospital || meta.hospital || "",
          submittedAt: entry.submittedAt || meta.submitted_at || u.created_at,
          status: isAccountStatus(u.app_metadata?.status) ? u.app_metadata.status : "active",
        };
      });

    return NextResponse.json({ ok: true, specialists });
  } catch (err) {
    return errorResponse(err, "Không tải được danh sách bác sĩ.");
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const { userId, action } = await request.json();
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ ok: false, error: "Thiếu userId của bác sĩ." }, { status: 400 });
    }
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ ok: false, error: "Hành động không hợp lệ." }, { status: 400 });
    }
    const admin = getSupabaseAdminClient();
    if (!admin) throw new ApprovalError("Máy chủ chưa cấu hình Supabase Service Key.", 500);

    const status = action === "approve" ? "active" : "rejected";
    const user = await applyAccountDecision(admin, userId, { status, expectRole: "specialist", approvedBy: auth.actor.fullName });

    return NextResponse.json({
      ok: true,
      status: user.status,
      user,
      message: action === "approve" ? "Đã phê duyệt hồ sơ Bác sĩ." : "Đã từ chối hồ sơ Bác sĩ.",
    });
  } catch (err) {
    return errorResponse(err, "Cập nhật trạng thái thất bại.");
  }
}
