import type { SupabaseClient } from "@supabase/supabase-js";
import { authzClaims, SUPER_ADMIN_EMAIL } from "@/lib/actor-role";
import { shopIdClaim } from "@/lib/shop-utils";
import { updateStorageJsonList } from "@/lib/supabase/storage-json";

/**
 * Account status, stored in app_metadata (the authority for rights, lib/actor-role.ts):
 * - pending: a shop or doctor application waiting for the admin
 * - active: approved (or a plain customer)
 * - rejected: the application was refused; the account keeps customer rights only
 * - suspended: locked by the admin; the account is banned in Supabase Auth and every API refuses it
 */
export const ACCOUNT_STATUSES = ["pending", "active", "rejected", "suspended"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export type GrantableRole = "customer" | "shop" | "specialist";

export function isAccountStatus(value: unknown): value is AccountStatus {
  return typeof value === "string" && (ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export function isGrantableRole(value: unknown): value is GrantableRole {
  return value === "customer" || value === "shop" || value === "specialist";
}

export const REGISTRY_PATHS = {
  shop: "shops/shops_registry.json",
  specialist: "specialists/specialists_registry.json",
} as const;

/** Long enough to mean "until unlocked"; Supabase takes a Go duration. */
const LOCK_BAN_DURATION = "876000h";

type RegistryEntry = { id?: string; email?: string; status?: string } & Record<string, unknown>;

export class ApprovalError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
  ) {
    super(message);
  }
}

/**
 * Sets an account's role and status: app_metadata first (it grants the rights), then the
 * user_metadata mirror and the shop/doctor registry the UI reads. Throws ApprovalError on any
 * failure, so the admin console never shows a success the backend did not store.
 */
export async function applyAccountDecision(
  admin: SupabaseClient,
  userId: string,
  change: { role?: GrantableRole; status?: AccountStatus; unlock?: boolean; approvedBy?: string; expectRole?: GrantableRole },
): Promise<{ id: string; email: string; role: GrantableRole; status: AccountStatus }> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) throw new ApprovalError("Không tìm thấy người dùng.", 404);
  const user = data.user;
  const email = (user.email ?? "").toLowerCase();
  if (email === SUPER_ADMIN_EMAIL) throw new ApprovalError("Không thể thay đổi tài khoản Super Admin.", 403);

  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (appMeta.role === "admin") throw new ApprovalError("Không thể thay đổi tài khoản quản trị viên.", 403);
  if (change.expectRole && appMeta.role !== change.expectRole) {
    throw new ApprovalError("Tài khoản này không có hồ sơ đăng ký phù hợp để duyệt.", 409);
  }

  const role: GrantableRole = change.role ?? (isGrantableRole(appMeta.role) ? appMeta.role : "customer");
  const current: AccountStatus = isAccountStatus(appMeta.status) ? appMeta.status : "active";
  // Unlocking restores the status the account had when it was locked: a pending or rejected
  // application that was locked must not come back approved.
  let status: AccountStatus;
  if (change.unlock) {
    if (current !== "suspended") throw new ApprovalError("Tài khoản này không bị khóa.", 409);
    const before = appMeta.status_before_lock;
    status = isAccountStatus(before) && before !== "suspended" ? before : "active";
  } else {
    status = change.status ?? current;
  }
  const lockNote =
    status === "suspended"
      ? { status_before_lock: current === "suspended" ? (appMeta.status_before_lock ?? "active") : current }
      : { status_before_lock: null };
  const now = new Date().toISOString();
  const decided = !change.unlock && (change.status === "active" || change.status === "rejected");

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    // Supabase merges app_metadata keys; null removes one.
    app_metadata: { ...authzClaims(role, status), ...shopIdClaim(role, appMeta, userMeta), ...lockNote },
    user_metadata: {
      ...userMeta,
      role,
      status,
      updated_at: now,
      ...(decided ? { approved_at: now, approved_by: change.approvedBy ?? "Super Admin" } : {}),
    },
    ban_duration: status === "suspended" ? LOCK_BAN_DURATION : "none",
  });
  if (updateError) throw new ApprovalError(`Không cập nhật được tài khoản: ${updateError.message}`, 502);

  // The registries hold the application details shown in the console; their status mirrors
  // app_metadata so the two never disagree. Only entries that already exist are updated.
  const syncErrors: string[] = [];
  for (const [registryRole, path] of Object.entries(REGISTRY_PATHS)) {
    const matches = (entry: RegistryEntry) =>
      entry.id === userId || (typeof entry.email === "string" && entry.email.toLowerCase() === email);
    try {
      await updateStorageJsonList<RegistryEntry, void>(path, admin, (list) => {
        if (!list.some(matches)) return { next: null, result: undefined };
        // An entry for a role the account no longer has is not an open application any more.
        const entryStatus = registryRole === role ? status : "rejected";
        return {
          next: list.map((entry) =>
            matches(entry)
              ? { ...entry, status: entryStatus, ...(decided ? { approvedAt: now, approvedBy: change.approvedBy ?? "Super Admin" } : {}) }
              : entry,
          ),
          result: undefined,
        };
      });
    } catch (err) {
      syncErrors.push(err instanceof Error ? err.message : `lỗi lưu ${path}`);
    }
  }
  if (syncErrors.length > 0) {
    // The rights are already stored; say exactly what is out of date instead of failing silently.
    throw new ApprovalError(
      `Đã cập nhật quyền tài khoản nhưng chưa đồng bộ được hồ sơ (${syncErrors.join("; ")}). Vui lòng thử lại.`,
      502,
    );
  }

  return { id: userId, email, role, status };
}

/** Every auth user, page by page (a single listUsers call stops at its page size). */
export async function listAllUsers(admin: SupabaseClient) {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new ApprovalError(error.message, 502);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}
