import { randomUUID } from "node:crypto";
import type { BrowserContext, Page } from "@playwright/test";
import { admin, signedInCookies } from "./auth";
import { normalizeShopId } from "../src/lib/shop-utils";
import { JSON_STORE_TABLE, readStorageJsonList, updateStorageJsonList } from "../src/lib/supabase/storage-json";

// The multi-role specs (shop, seller, specialist, chat, registration) run against the real
// Supabase project, so every account they sign in is a fresh @skinsense.test user that the
// spec creates here and removes again in afterAll, together with whatever it wrote into the
// JSON stores in Storage. Rights come only from app_metadata (lib/actor-role.ts).

// "admin" exists for the approval specs only: the app itself never grants it (authzClaims refuses
// it and the register/admin APIs reject it), so a test admin is minted here with the service role.
export type TestRole = "customer" | "shop" | "specialist" | "admin";

export interface TestUser {
  email: string;
  userId: string;
  fullName: string;
  shopName?: string;
}

/** A unique tag per call, so parallel workers and reruns never share an account or a row. */
export function runTag(): string {
  return randomUUID().slice(0, 8);
}

export async function createRoleUser(
  role: TestRole,
  opts: { tag: string; fullName?: string; shopName?: string; status?: string },
): Promise<TestUser> {
  const email = `e2e-${role}-${opts.tag}@skinsense.test`;
  const fullName = opts.fullName ?? `E2E ${role} ${opts.tag}`;
  const shopName = role === "shop" ? (opts.shopName ?? `E2E Shop ${opts.tag}`) : undefined;
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    // What /api/admin/users grants on approval (shop_id: lib/shop-utils.ts shopIdClaim).
    app_metadata: { role, status: opts.status ?? "active", ...(shopName ? { shop_id: normalizeShopId(shopName) } : {}) },
    user_metadata: { full_name: fullName, name: fullName, ...(shopName ? { shop_name: shopName } : {}) },
  });
  if (created.error) throw created.error;
  return { email, userId: created.data.user.id, fullName, shopName };
}

/**
 * Accounts shared by the tests of one spec file: `pool("customer")` creates the account on first
 * use and records it in `users` for the file's afterAll cleanup. A key gives a second account of
 * the same role (`pool("shop", "other")`).
 */
export function userPool(users: TestUser[]) {
  const made = new Map<string, Promise<TestUser>>();
  return (role: TestRole, key: string = role, opts: { fullName?: string; shopName?: string; status?: string } = {}): Promise<TestUser> => {
    let user = made.get(key);
    if (!user) {
      user = createRoleUser(role, { tag: runTag(), ...opts }).then((u) => {
        users.push(u);
        return u;
      });
      made.set(key, user);
    }
    return user;
  };
}

// One magic-link sign-in per account per worker: Supabase rate-limits verifications per IP, so
// tests in a file share their accounts and reuse the session cookies.
const sessions = new Map<string, Awaited<ReturnType<typeof signedInCookies>>["cookies"]>();

export async function signIn(context: BrowserContext, user: TestUser): Promise<void> {
  let cookies = sessions.get(user.email);
  if (!cookies) {
    cookies = (await signedInCookies(user.email)).cookies;
    sessions.set(user.email, cookies);
  }
  await context.addCookies(cookies);
}

/** Uncaught page errors are bugs whatever the flow: collect them and assert none at the end. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const BUCKET = "photos";

/**
 * Removes exactly the entries `isOurs` matches from a JSON array store; leaves the rest untouched.
 * Through the app's own helper, so it is the same compare-and-swap on app_json_stores (or the
 * Storage file before migration 0007): a prune can no longer undo a write the app made meanwhile.
 */
export async function pruneJsonStore(path: string, isOurs: (entry: Record<string, unknown>) => boolean): Promise<void> {
  await updateStorageJsonList<Record<string, unknown>, void>(path, admin, (list) => {
    const kept = list.filter((entry) => !isOurs(entry));
    return { next: kept.length === list.length ? null : kept, result: undefined };
  });
}

export async function readJsonStore(path: string): Promise<Array<Record<string, unknown>>> {
  return readStorageJsonList<Record<string, unknown>>(path, admin);
}

export const STORES = {
  orders: "orders/orders_registry.json",
  chat: "chat/chat_registry.json",
  shops: "shops/shops_registry.json",
  specialists: "specialists/specialists_registry.json",
  cases: "clinical_records/cases_registry.json",
  products: "products/products_registry.json",
} as const;

/** Deletes the test users and every store entry, routine row and protocol file that points at them. */
export async function cleanupUsers(users: TestUser[], extra?: { orderCodes?: string[] }): Promise<void> {
  if (users.length === 0 && !extra?.orderCodes?.length) return;
  const ids = new Set(users.map((u) => u.userId));
  const emails = new Set(users.map((u) => u.email));
  const names = new Set(users.flatMap((u) => [u.fullName, u.shopName].filter(Boolean) as string[]).map((n) => n.toLowerCase()));
  const codes = new Set((extra?.orderCodes ?? []).map((c) => c.toLowerCase()));
  const lower = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : "");

  await pruneJsonStore(STORES.orders, (o) =>
    ids.has(String(o.customerId ?? "")) || names.has(lower(o.customerName)) || names.has(lower(o.shopName)) || codes.has(lower(o.orderCode)),
  );
  await pruneJsonStore(STORES.chat, (t) => ids.has(String(t.userId ?? "")) || names.has(lower(t.shopName)) || names.has(lower(t.userName)));
  await pruneJsonStore(STORES.shops, (s) => emails.has(lower(s.email)) || ids.has(String(s.id ?? "")));
  await pruneJsonStore(STORES.specialists, (s) => emails.has(lower(s.email)) || ids.has(String(s.id ?? "")));
  await pruneJsonStore(STORES.products, (p) => names.has(lower(p.shopName)));
  await pruneJsonStore(STORES.cases, (c) => ids.has(String(c.patientUserId ?? "")) || emails.has(lower(c.patientEmail)));

  for (const user of users) {
    const protocol = `routines/protocol_${user.userId}.json`;
    await admin.storage.from(BUCKET).remove([protocol]);
    await admin.from(JSON_STORE_TABLE).delete().eq("key", protocol); // an error here = no table yet
    await admin.from("routine_items").delete().eq("user_id", user.userId);
    await admin.auth.admin.deleteUser(user.userId);
  }
}
