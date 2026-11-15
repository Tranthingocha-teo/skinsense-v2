#!/usr/bin/env bun
/**
 * One-off: copy shop/specialist roles from user_metadata into app_metadata.
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

let changed = 0;
for (const u of data.users) {
  const um = (u.user_metadata ?? {}) as Record<string, unknown>;
  const am = (u.app_metadata ?? {}) as Record<string, unknown>;
  if ((um.role !== "shop" && um.role !== "specialist") || am.role) continue;
  const claims = { role: um.role, status: typeof um.status === "string" ? um.status : "active" };
  console.log(`${apply ? "SET " : "WOULD SET"} ${u.email} → app_metadata ${JSON.stringify(claims)}`);
  if (apply) {
    const { error: e } = await admin.auth.admin.updateUserById(u.id, { app_metadata: claims });
    if (e) throw e;
  }
  changed++;
}
console.log(`\n${changed} user(s) ${apply ? "updated" : "to update (dry run; add --apply)"}.`);
