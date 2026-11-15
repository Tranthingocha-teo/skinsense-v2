#!/usr/bin/env bun
/**
 * One-off: copy shop/specialist roles from user_metadata into app_metadata, and give shops
 * approved before 2026-11-16 a frozen app_metadata.shop_id (tenancy must not follow user_metadata).
 *
 * Since the authz fix, API rights come only from app_metadata (apps/web/src/lib/actor-role.ts),
 * because users can rewrite their own user_metadata. Accounts approved before the fix carry their
 * role only in user_metadata and would lose access without this backfill.
 *
 *   bun run scripts/backfill-app-metadata.ts           # dry run, prints what would change
 *   bun run scripts/backfill-app-metadata.ts --apply   # writes app_metadata
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from apps/web/.env.local.
 * Review the dry run first: a user who tampered with their user_metadata would be promoted too.
 */
import { createClient } from "@supabase/supabase-js";
import { normalizeShopId } from "../apps/web/src/lib/shop-utils";
import { readFileSync } from "node:fs";

const envFile = new URL("../apps/web/.env.local", import.meta.url);
for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const apply = process.argv.includes("--apply");
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (error) throw error;

// Exactly what session-auth derived before the claim existed, so the shop keeps its orders and chats.
function legacyShopId(um: Record<string, unknown>): string {
  const details = (um.shop_details ?? {}) as Record<string, unknown>;
  const name = String(um.shop_name || details.shopName || um.full_name || "SkinSense Official").trim();
  return normalizeShopId(String(um.shop_id || name));
}

let changed = 0;
for (const u of data.users) {
  const um = (u.user_metadata ?? {}) as Record<string, unknown>;
  const am = (u.app_metadata ?? {}) as Record<string, unknown>;
  const role = (am.role ?? um.role) as string | undefined;
  if (role !== "shop" && role !== "specialist") continue;
  // Shops approved before the shop_id claim existed: freeze their shop_id from today's name.
  const needsShopId = role === "shop" && !am.shop_id;
  if (am.role && !needsShopId) continue;
  const claims = {
    ...(am.role ? {} : { role, status: typeof um.status === "string" ? um.status : "active" }),
    ...(needsShopId ? { shop_id: legacyShopId(um) } : {}),
  };
  console.log(`${apply ? "SET " : "WOULD SET"} ${u.email} → app_metadata ${JSON.stringify(claims)}`);
  if (apply) {
    const { error: e } = await admin.auth.admin.updateUserById(u.id, { app_metadata: claims });
    if (e) throw e;
  }
  changed++;
}
console.log(`\n${changed} user(s) ${apply ? "updated" : "to update (dry run; add --apply)"}.`);
