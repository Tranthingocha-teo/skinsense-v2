#!/usr/bin/env bun
/**
 * One-off: copy the web app's JSON stores from the "photos" Storage bucket into app_json_stores
 * (packages/domain/drizzle/0007_app_json_stores.sql). Optional: the app seeds a store lazily the
 * first time it touches it; this only does it up front, for every known key at once.
 *
 *   bun run scripts/migrate-json-stores.ts           # dry run, prints what would be copied
 *   bun run scripts/migrate-json-stores.ts --apply   # inserts the missing rows
 *
 * Insert-only (ON CONFLICT DO NOTHING): a key that already has a row is left alone, so it is safe
 * to re-run and never overwrites what the app wrote since. Storage files are not modified.
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from apps/web/.env.local.
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
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const BUCKET = "photos";
const TABLE = "app_json_stores";

// Every Storage path the web app reads or writes as a JSON store (grep storage-json in apps/web).
const FIXED_KEYS = [
  "orders/orders_registry.json",
  "chat/chat_registry.json",
  "shops/shops_registry.json",
  "specialists/specialists_registry.json",
  "products/products_registry.json",
  "clinical_records/cases_registry.json",
  "admin/role_routines_registry.json",
];

async function protocolKeys(): Promise<string[]> {
  const keys: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(BUCKET).list("routines", { limit: 1000, offset });
    if (error) throw error;
    keys.push(...data.filter((f) => /^protocol_.+\.json$/.test(f.name)).map((f) => `routines/${f.name}`));
    if (data.length < 1000) return keys;
  }
}

async function readLegacy(path: string): Promise<{ found: false } | { found: true; data: unknown }> {
  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, 60);
  if (!signed?.signedUrl) return { found: false };
  const res = await fetch(`${signed.signedUrl}&_t=${Date.now()}`, { cache: "no-store" });
  if (res.status === 400 || res.status === 404) return { found: false };
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return { found: true, data: await res.json() };
}

const probe = await admin.from(TABLE).select("key").limit(1);
if (probe.error) {
  throw new Error(`${TABLE} is not reachable (${probe.error.code}: ${probe.error.message}). Apply migration 0007 first.`);
}

const keys = [...FIXED_KEYS, ...(await protocolKeys())];
let copied = 0;
for (const k of keys) {
  const { data: row, error } = await admin.from(TABLE).select("version").eq("key", k).maybeSingle();
  if (error) throw error;
  if (row) {
    console.log(`= ${k}: already in ${TABLE} (version ${row.version}), left alone`);
    continue;
  }
  const legacy = await readLegacy(k);
  if (!legacy.found) {
    console.log(`- ${k}: no Storage file, nothing to copy`);
    continue;
  }
  const size = Array.isArray(legacy.data) ? `${legacy.data.length} entries` : "object";
  if (!apply) {
    console.log(`+ ${k}: would copy (${size})`);
    copied++;
    continue;
  }
  const { data: inserted, error: insertError } = await admin
    .from(TABLE)
    .upsert({ key: k, data: legacy.data }, { onConflict: "key", ignoreDuplicates: true })
    .select("key");
  if (insertError) throw insertError;
  console.log(inserted?.length ? `+ ${k}: copied (${size})` : `= ${k}: the app seeded it meanwhile, left alone`);
  if (inserted?.length) copied++;
}
console.log(`${apply ? "Copied" : "Would copy"} ${copied} of ${keys.length} stores.${apply ? "" : " Re-run with --apply to write."}`);
