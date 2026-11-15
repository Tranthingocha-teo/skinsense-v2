export type ActorRole = "customer" | "specialist" | "shop" | "admin";

export const SUPER_ADMIN_EMAIL = "hattn.23itb@vku.udn.vn";

/**
 * The role used for authorization. Only `app_metadata` counts: users can rewrite their own
 * `user_metadata` with supabase.auth.updateUser, so anything read from it is display data only.
 * Shops and specialists get their rights only once an admin has set status "active".
 */
export function resolveActorRole(email: string, appMeta: Record<string, unknown> | undefined): ActorRole {
  if (email.trim().toLowerCase() === SUPER_ADMIN_EMAIL) return "admin";
  const role = appMeta?.role;
  if (role === "admin") return "admin";
  if ((role === "shop" || role === "specialist") && appMeta?.status === "active") return role;
  return "customer";
}

/** The app_metadata patch for a user. Admin is granted only by the super admin email, never here. */
export function authzClaims(
  role: Exclude<ActorRole, "admin">,
  status: string = "active",
): { role: Exclude<ActorRole, "admin">; status: string } {
  if (!["customer", "shop", "specialist"].includes(role)) throw new Error(`Refusing to grant role ${role}`);
  return { role, status };
}
