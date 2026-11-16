// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The app_json_stores path of storage-json.ts against a real Postgres (PGlite) running the
// committed migration, behind a small stand-in for the three PostgREST calls it makes. Every call
// yields for a random moment first, so concurrent writers really interleave between read and write.

let current: SupabaseClient;
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => current) }));
const { createPersistentJsonStore, readStorageJsonList, updateStorageJsonList } = await import("./storage-json");

const MIGRATION = new URL("../../../../../packages/domain/drizzle/0007_app_json_stores.sql", import.meta.url);

async function freshDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec("CREATE ROLE authenticated NOLOGIN; CREATE ROLE anon NOLOGIN;");
  for (const stmt of readFileSync(MIGRATION, "utf8").split("--> statement-breakpoint")) if (stmt.trim()) await db.exec(stmt);
  return db;
}

const jitter = () => new Promise((r) => setTimeout(r, Math.random() * 3));

interface Fake {
  client: SupabaseClient;
  /** Legacy Storage files, by path. */
  files: Record<string, unknown>;
  /** Paths whose legacy file exists but cannot be downloaded. */
  unreadable: Set<string>;
  uploads: string[];
}

/** `db: null` plays a project where the migration has not been applied yet. */
function fakeClient(db: PGlite | null): Fake {
  const files: Record<string, unknown> = {};
  const unreadable = new Set<string>();
  const uploads: string[] = [];

  const from = (table: string) => {
    expect(table).toBe("app_json_stores");
    let op: "select" | "upsert" | "update" | undefined;
    let payload: Record<string, unknown> = {};
    const eqs: Record<string, unknown> = {};
    const exec = async () => {
      await jitter();
      if (!db) return { data: null, error: { code: "PGRST205", message: "Could not find the table 'public.app_json_stores'" } };
      if (op === "upsert") {
        const r = await db.query(`INSERT INTO app_json_stores (key, data) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING RETURNING key`, [
          payload.key,
          JSON.stringify(payload.data),
        ]);
        return { data: r.rows, error: null };
      }
      if (op === "update") {
        const r = await db.query(
          `UPDATE app_json_stores SET data = $1::jsonb, version = $2, updated_at = $3 WHERE key = $4 AND version = $5 RETURNING version`,
          [JSON.stringify(payload.data), payload.version, payload.updated_at, eqs.key, eqs.version],
        );
        return { data: r.rows, error: null };
      }
      const r = await db.query(`SELECT data, version FROM app_json_stores WHERE key = $1`, [eqs.key]);
      return { data: r.rows[0] ?? null, error: null };
    };
    const builder = {
      select: () => ((op ??= "select"), builder),
      upsert: (row: Record<string, unknown>, opts: { onConflict: string; ignoreDuplicates: boolean }) => {
        expect(opts).toEqual({ onConflict: "key", ignoreDuplicates: true });
        op = "upsert";
        payload = row;
        return builder;
      },
      update: (patch: Record<string, unknown>) => ((op = "update"), (payload = patch), builder),
      eq: (col: string, value: unknown) => ((eqs[col] = value), builder),
      maybeSingle: () => builder,
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => exec().then(resolve, reject),
    };
    return builder;
  };

  const storage = {
    from: () => ({
      createSignedUrl: async (p: string) => ({ data: { signedUrl: `https://storage.test/${p}?token=t` } }),
      download: async () => ({ data: null }),
      list: async (dir: string, opts: { search: string }) => ({
        data: Object.keys(files)
          .filter((f) => f === (dir ? `${dir}/${opts.search}` : opts.search))
          .map(() => ({ name: opts.search })),
        error: null,
      }),
      upload: async (p: string, body: Buffer) => {
        const list = JSON.parse(body.toString());
        await jitter();
        uploads.push(p);
        files[p] = list;
        return { error: null };
      },
    }),
  };

  global.fetch = vi.fn(async (url: string | URL | Request) => {
    const p = String(url).replace("https://storage.test/", "").split("?")[0];
    await jitter();
    const ok = p in files && !unreadable.has(p);
    const snapshot = ok ? JSON.parse(JSON.stringify(files[p])) : null;
    return { ok, json: async () => snapshot } as Response;
  });

  return { client: { from, storage } as unknown as SupabaseClient, files, unreadable, uploads };
}

/** Each call gets a lock queue of its own, as if every writer ran on a different serverless instance. */
function onOwnInstance<R>(fn: () => Promise<R>): Promise<R> {
  delete (globalThis as { __skinsenseStoreLocks?: unknown }).__skinsenseStoreLocks;
  return fn();
}

async function rowOf(db: PGlite, key: string) {
  return (await db.query<{ data: unknown; version: number }>("SELECT data, version FROM app_json_stores WHERE key = $1", [key])).rows[0];
}

const append = (fake: Fake, key: string, id: string) =>
  updateStorageJsonList<{ id: string }, void>(key, fake.client, (list) => ({ next: [...list, { id }], result: undefined }));

let key: string;
beforeEach(() => {
  key = `test/${Math.random().toString(36).slice(2)}.json`;
});

describe("updateStorageJsonList on app_json_stores", () => {
  it("loses no update when 20 instances append to the same list at once", async () => {
    const db = await freshDb();
    const fake = fakeClient(db);
    const ids = Array.from({ length: 20 }, (_, i) => `id${i}`);
    await Promise.all(ids.map((id) => onOwnInstance(() => append(fake, key, id))));
    const row = await rowOf(db, key);
    expect((row.data as { id: string }[]).map((e) => e.id).sort()).toEqual([...ids].sort());
    expect(row.version).toBe(20); // created at 1, then 19 compare-and-swaps
    expect(fake.uploads).toEqual([]);
  }, 60_000);

  it("(control) the old Storage read-modify-write loses some of those same appends", async () => {
    const fake = fakeClient(null);
    fake.files[key] = [];
    const ids = Array.from({ length: 20 }, (_, i) => `id${i}`);
    await Promise.all(ids.map((id) => onOwnInstance(() => append(fake, key, id))));
    expect((fake.files[key] as unknown[]).length).toBeLessThan(20);
  }, 60_000);

  it("re-reads and re-applies the change when another writer got in between read and write", async () => {
    const db = await freshDb();
    const fake = fakeClient(db);
    await append(fake, key, "a");
    let calls = 0;
    await updateStorageJsonList<{ id: string }, void>(key, fake.client, (list) => {
      calls++;
      if (calls === 1) {
        // Another instance writes after this one read (queued in Postgres ahead of this write), so
        // this compare-and-swap must fail.
        void db.query(`UPDATE app_json_stores SET data = data || '[{"id":"other"}]', version = version + 1 WHERE key = $1`, [key]);
      }
      return { next: [...list, { id: "mine" }], result: undefined };
    });
    expect(calls).toBe(2);
    const row = await rowOf(db, key);
    expect((row.data as { id: string }[]).map((e) => e.id).sort()).toEqual(["a", "mine", "other"]);
  }, 60_000);

  it("seeds a store from its legacy Storage file once, then never writes the file again", async () => {
    const db = await freshDb();
    const fake = fakeClient(db);
    fake.files[key] = [{ id: "legacy" }];
    await Promise.all(["x", "y", "z"].map((id) => onOwnInstance(() => append(fake, key, id))));
    const row = await rowOf(db, key);
    expect((row.data as { id: string }[]).map((e) => e.id).sort()).toEqual(["legacy", "x", "y", "z"]);
    expect(fake.uploads).toEqual([]);
    fake.files[key] = [{ id: "changed later" }];
    expect((await readStorageJsonList<{ id: string }>(key, fake.client)).map((e) => e.id)).not.toContain("changed later");
  }, 60_000);

  it("does not seed or write when the legacy file exists but cannot be read", async () => {
    const db = await freshDb();
    const fake = fakeClient(db);
    fake.files[key] = [{ id: "legacy" }];
    fake.unreadable.add(key);
    await expect(append(fake, key, "x")).rejects.toThrow(/Không đọc được/);
    expect(await rowOf(db, key)).toBeUndefined();
  }, 60_000);

  it("falls back to the Storage file while the table does not exist", async () => {
    const fake = fakeClient(null);
    fake.files[key] = [{ id: "a" }];
    await append(fake, key, "b");
    expect(fake.files[key]).toEqual([{ id: "a" }, { id: "b" }]);
    expect(fake.uploads).toEqual([key]);
  }, 60_000);
});

describe("createPersistentJsonStore on app_json_stores", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
  });
  afterEach(() => vi.unstubAllEnvs());

  function makeStore() {
    const dir = path.join(os.tmpdir(), `storage-json-table-${Math.random().toString(36).slice(2)}`);
    return createPersistentJsonStore<Array<{ id: string }>>({
      storagePath: key,
      primaryFile: path.join(dir, "a.json"),
      fallbackFile: path.join(dir, "b.json"),
      overrideEnvVar: "STORAGE_JSON_TEST_OVERRIDE_UNSET",
      getInitial: () => [{ id: "seed" }],
    });
  }

  it("keeps every order when instances create them concurrently (the orders/chat withLock pattern)", async () => {
    const db = await freshDb();
    current = fakeClient(db).client;
    const store = makeStore();
    const ids = Array.from({ length: 10 }, (_, i) => `o${i}`);
    await Promise.all(
      ids.map((id) =>
        onOwnInstance(() =>
          store.withLock(async () => {
            const list = await store.readAsync();
            await store.writeAsync([{ id }, ...list]);
          }),
        ),
      ),
    );
    const row = await rowOf(db, key);
    expect((row.data as { id: string }[]).map((e) => e.id).sort()).toEqual(["seed", ...ids].sort());
  }, 60_000);

  it("seeds a store with no row and no legacy file from the local initial data", async () => {
    const db = await freshDb();
    current = fakeClient(db).client;
    expect(await makeStore().readAsync()).toEqual([{ id: "seed" }]);
    expect((await rowOf(db, key)).data).toEqual([{ id: "seed" }]);
  }, 60_000);
});
