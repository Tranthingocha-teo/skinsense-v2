import { NextResponse } from "next/server";
import { requireRoleActor } from "@/lib/session-auth";
import { randomUUID } from "node:crypto";
import { authzClaims, SUPER_ADMIN_EMAIL } from "@/lib/actor-role";
import { shopIdClaim } from "@/lib/shop-utils";
import { getSupabaseAdminClient, readStorageJsonList } from "@/lib/supabase/storage-json";
import {
  ApprovalError,
  REGISTRY_PATHS,
  applyAccountDecision,
  findRegistryEntry,
  isAccountStatus,
  isGrantableRole,
  listAllUsers,
  sortAdminRecords,
  type RegistryEntry,
} from "@/lib/admin-approvals";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function adminClientOr500() {
  const client = getSupabaseAdminClient();
  if (!client) throw new ApprovalError("Máy chủ chưa cấu hình Supabase Service Key.", 500);
  return client;
}

function errorResponse(err: unknown, fallback: string) {
  if (err instanceof ApprovalError) return NextResponse.json({ ok: false, error: err.message }, { status: err.httpStatus });
  return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : fallback }, { status: 500 });
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function GET(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = adminClientOr500();
    const [rawUsers, specialistsRegistry, shopsRegistry] = await Promise.all([
      listAllUsers(supabaseAdmin),
      readStorageJsonList<RegistryEntry>(REGISTRY_PATHS.specialist, supabaseAdmin).catch(() => []),
      readStorageJsonList<RegistryEntry>(REGISTRY_PATHS.shop, supabaseAdmin).catch(() => []),
    ]);

    const mapped = rawUsers.map((u) => {
      const meta = (u.user_metadata || {}) as Record<string, unknown>;
      const appMeta = (u.app_metadata || {}) as Record<string, unknown>;
      const shopDetails = (meta.shop_details as Record<string, unknown> | undefined) ?? {};
      const email = u.email || "";
      const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL;
      const specEntry = findRegistryEntry(specialistsRegistry, u.id, email);
      const shopEntry = findRegistryEntry(shopsRegistry, u.id, email);

      // app_metadata is the authority for runtime rights; if an applicant has an open pending
      // server-side registry application while app_metadata wasn't tagged yet, keep it visible
      // in the admin queue so the admin can review and approve/reject it.
      let role =
        isSuperAdmin || appMeta.role === "admin"
          ? "admin"
          : isGrantableRole(appMeta.role)
            ? appMeta.role
            : "customer";
      let status = isSuperAdmin ? "active" : isAccountStatus(appMeta.status) ? appMeta.status : "active";

      if (!isSuperAdmin && role === "customer") {
        if (specEntry?.status === "pending" || specEntry?.status === "rejected") {
          role = "specialist";
          status = specEntry.status;
        } else if (shopEntry?.status === "pending" || shopEntry?.status === "rejected") {
          role = "shop";
          status = shopEntry.status;
        }
      }

      const submittedAt =
        (role === "specialist" ? text(specEntry?.submittedAt) : role === "shop" ? text(shopEntry?.submittedAt) : "") ||
        text(meta.submitted_at) ||
        u.created_at ||
        "";

      return {
        id: u.id,
        name: isSuperAdmin
          ? "Trần Thị Ngọc Hà (Super Admin)"
          : (role === "specialist" ? text(specEntry?.name) : role === "shop" ? text(shopEntry?.ownerName) : "") ||
            text(meta.full_name) ||
            text(meta.name) ||
            email.split("@")[0] ||
            "Người dùng",
        email,
        phone:
          (role === "specialist" ? text(specEntry?.phone) : role === "shop" ? text(shopEntry?.phone) : "") ||
          text(meta.phone_number) ||
          u.phone ||
          "",
        role,
        status,
        createdAt: u.created_at ? u.created_at.split("T")[0] : "",
        submittedAt,
        avatarUrl: text(meta.avatar_url) || text(meta.picture) || undefined,
        shopDetails:
          role === "shop"
            ? {
                shopName: text(shopEntry?.shopName) || text(meta.shop_name) || text(shopDetails.shopName) || text(meta.full_name),
                license: text(shopEntry?.license) || text(meta.license) || text(shopDetails.license),
                category: text(shopEntry?.category) || text(meta.category) || text(shopDetails.category),
                address: text(shopEntry?.address) || text(meta.address) || text(shopDetails.address),
              }
            : undefined,
        specialistDetails:
          role === "specialist"
            ? {
                hospital: text(specEntry?.hospital) || text(meta.hospital),
                licenseId: text(specEntry?.licenseId) || text(meta.license_id),
                specialty: text(specEntry?.specialty) || text(meta.specialty),
              }
            : undefined,
      };
    });

    const users = sortAdminRecords(mapped);
    return NextResponse.json({ ok: true, users });
  } catch (err) {
    return errorResponse(err, "Không tải được danh sách người dùng.");
  }
}

export async function POST(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    // No shared default password: an account created without one gets a random password nobody
    // knows and signs in with Google or a magic link. ("password123@" let anyone into it.)
    const { email, password = `${randomUUID()}Aa1!`, fullName, role = "customer", phone, shopName, specialty, hospital, licenseId } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Email không hợp lệ." }, { status: 400 });
    }
    if (!isGrantableRole(role)) {
      return NextResponse.json({ ok: false, error: "Vai trò không hợp lệ." }, { status: 400 });
    }

    const supabaseAdmin = adminClientOr500();
    const normalizedEmail = email.trim().toLowerCase();
    // An account the admin creates is approved by that act, whatever its role.
    const initialStatus = "active";
    const userMetadata = {
      full_name: text(fullName) || normalizedEmail.split("@")[0],
      role,
      status: initialStatus,
      phone_number: text(phone),
      shop_name: text(shopName),
      specialty: text(specialty),
      hospital: text(hospital),
      license_id: text(licenseId),
      created_at_local: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      app_metadata: { ...authzClaims(role, initialStatus), ...shopIdClaim(role, {}, userMetadata) },
      user_metadata: userMetadata,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: { id: data.user.id, email: data.user.email, role, status: initialStatus } });
  } catch (err) {
    return errorResponse(err, "Tạo người dùng thất bại.");
  }
}

/** Approve / reject an application, lock / unlock an account, or change its role. */
export async function PATCH(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    // unlock: restore the status from before the lock. expectRole: the application being decided
    // (a shop approval must not approve an account that is not a shop applicant).
    const { userId, role, status, unlock, expectRole } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ ok: false, error: "Thiếu userId." }, { status: 400 });
    }
    if (role !== undefined && !isGrantableRole(role)) {
      return NextResponse.json({ ok: false, error: "Vai trò không hợp lệ (không thể cấp quyền quản trị)." }, { status: 400 });
    }
    if (status !== undefined && !isAccountStatus(status)) {
      return NextResponse.json({ ok: false, error: "Trạng thái không hợp lệ." }, { status: 400 });
    }
    if (expectRole !== undefined && !isGrantableRole(expectRole)) {
      return NextResponse.json({ ok: false, error: "Loại hồ sơ không hợp lệ." }, { status: 400 });
    }
    if (unlock !== undefined && (unlock !== true || role !== undefined || status !== undefined)) {
      return NextResponse.json({ ok: false, error: "Yêu cầu mở khóa không hợp lệ." }, { status: 400 });
    }
    if (role === undefined && status === undefined && !unlock) {
      return NextResponse.json({ ok: false, error: "Không có thay đổi nào." }, { status: 400 });
    }
    if (userId === auth.actor.userId) {
      return NextResponse.json({ ok: false, error: "Không thể tự thay đổi tài khoản của chính mình." }, { status: 403 });
    }

    const user = await applyAccountDecision(adminClientOr500(), userId, {
      role,
      status,
      unlock: unlock === true,
      expectRole,
      approvedBy: auth.actor.fullName,
    });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return errorResponse(err, "Cập nhật người dùng thất bại.");
  }
}

export async function DELETE(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Thiếu userId." }, { status: 400 });
    }
    if (userId === auth.actor.userId) {
      return NextResponse.json({ ok: false, error: "Không thể tự xóa tài khoản của chính mình." }, { status: 403 });
    }

    const supabaseAdmin = adminClientOr500();
    const { data: target } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!target?.user) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy người dùng." }, { status: 404 });
    }
    if (target.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL || target.user.app_metadata?.role === "admin") {
      return NextResponse.json({ ok: false, error: "Không thể xóa tài khoản quản trị viên." }, { status: 403 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Đã xóa người dùng thành công." });
  } catch (err) {
    return errorResponse(err, "Xóa người dùng thất bại.");
  }
}
