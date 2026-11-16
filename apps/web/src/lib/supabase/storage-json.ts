import { AsyncLocalStorage } from "node:async_hooks";
import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_STORAGE_BUCKET = "photos";

/**
 * The app's JSON stores (orders, chat, registries, cases, routines) live in the Postgres table
 * `app_json_stores` (packages/domain/drizzle/0007_app_json_stores.sql), one row per store keyed by
 * the Storage path the file used to have. They used to be JSON files in the "photos" bucket, read
 * and re-uploaded whole: two serverless instances that read the same list both wrote it back and
 * the later upload erased the other's row. Every write is now a compare-and-swap on `version`.
 *
 * Until the table exists (PostgREST answers "no such table") every function here keeps the old
 * Storage behaviour, so the code can ship before or after the migration. Once a key has a row the
 * Storage file is never written again; a key without a row is seeded once from its legacy file.
 */
export const JSON_STORE_TABLE = "app_json_stores";

/** How many times a conflicting write re-reads and re-applies its change before giving up. */
const MAX_ATTEMPTS = 8;

/**
 * Creates a server-only Supabase Admin client using `SUPABASE_SERVICE_ROLE_KEY`.
 * Returns `null` when required credentials are absent so callers can degrade or fail safely.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------------------------
// The table, through PostgREST.

class TableMissingError extends Error {}

/** A write lost the compare-and-swap: someone else wrote the store since it was read. */
export class StoreConflictError extends Error {
  constructor(key: string) {
    super(`${key} vừa được cập nhật ở nơi khác, vui lòng thử lại.`);
  }
}

interface Row<T> {
  data: T;
  version: number;
}

function check(error: { code?: string; message?: string } | null, key: string): void {
  if (!error) return;
  // PGRST205: the table is not in PostgREST's schema cache; 42P01: Postgres "undefined_table".
  if (error.code === "PGRST205" || error.code === "42P01") throw new TableMissingError(error.message);
  throw new Error(`Lỗi kho dữ liệu ${key}: ${error.message ?? error.code ?? "unknown"}`);
}

async function selectRow<T>(client: SupabaseClient, key: string): Promise<Row<T> | null> {
  const { data, error } = await client.from(JSON_STORE_TABLE).select("data, version").eq("key", key).maybeSingle();
  check(error, key);
  return data ? { data: data.data as T, version: Number(data.version) } : null;
}

/** INSERT ... ON CONFLICT (key) DO NOTHING. True when this call created the row. */
async function insertRow(client: SupabaseClient, key: string, data: unknown): Promise<boolean> {
  const { data: rows, error } = await client
    .from(JSON_STORE_TABLE)
    .upsert({ key, data }, { onConflict: "key", ignoreDuplicates: true })
    .select("key");
  check(error, key);
  return Array.isArray(rows) && rows.length === 1;
}

/** UPDATE ... WHERE key = $k AND version = $v. The new version, or null when the row moved on. */
async function swapRow(client: SupabaseClient, key: string, data: unknown, version: number): Promise<number | null> {
  const { data: rows, error } = await client
    .from(JSON_STORE_TABLE)
    .update({ data, version: version + 1, updated_at: new Date().toISOString() })
    .eq("key", key)
    .eq("version", version)
    .select("version");
  check(error, key);
  return Array.isArray(rows) && rows.length === 1 ? version + 1 : null;
}

function backoff(attempt: number): Promise<void> {
  const ms = Math.min(400, 15 * 2 ** attempt) * (0.5 + Math.random());
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------------------------
// Optimistic concurrency inside withStoreLock.
//
// A locked step reads the store, changes it and writes it back. The read records the version it
// saw; the write is a compare-and-swap against it and throws StoreConflictError if another process
// wrote meanwhile, and withStoreLock then runs the whole step again on fresh data. Callers keep
// their read/modify/write code unchanged.

interface LockContext {
  key: string;
  /** undefined: not read yet; null: read, no row; number: read at this version. */
  version: number | null | undefined;
}

const globals = globalThis as {
  __skinsenseStoreLocks?: Map<string, Promise<void>>;
  __skinsenseStoreContext?: AsyncLocalStorage<LockContext>;
  __skinsenseLegacyAbsent?: Set<string>;
};
const lockContext = (globals.__skinsenseStoreContext ??= new AsyncLocalStorage<LockContext>());
/** Keys whose legacy Storage file is known not to exist (legacy files are never created again). */
const legacyAbsent = (globals.__skinsenseLegacyAbsent ??= new Set<string>());

function remember(key: string, version: number | null): void {
  const ctx = lockContext.getStore();
  if (ctx && ctx.key === key) ctx.version = version;
}

/**
 * Runs read-modify-write steps on one store one at a time in this process (the queue is on
 * globalThis, shared by every route bundle) and, across processes, retries the step when its write
 * loses the compare-and-swap. `fn` may therefore run more than once: keep it to reading, computing
 * and writing the store.
 */
export function withStoreLock<R>(storagePath: string, fn: () => Promise<R>): Promise<R> {
  const queues = (globals.__skinsenseStoreLocks ??= new Map<string, Promise<void>>());
  const attempt = async (): Promise<R> => {
    for (let i = 1; ; i++) {
      try {
        return await lockContext.run({ key: storagePath, version: undefined }, fn);
      } catch (err) {
        if (!(err instanceof StoreConflictError) || i >= MAX_ATTEMPTS) throw err;
        await backoff(i);
      }
    }
  };
  const run = (queues.get(storagePath) ?? Promise.resolve()).then(attempt, attempt);
  queues.set(
    storagePath,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

// ---------------------------------------------------------------------------------------------
// Legacy Storage files: read when the table is missing, and once per key to seed its row.

async function legacyDownload<T>(storagePath: string, admin: SupabaseClient): Promise<T | null> {
  try {
    const { data: signData } = await admin.storage.from(DEFAULT_STORAGE_BUCKET).createSignedUrl(storagePath, 60);

    if (signData?.signedUrl) {
      const separator = signData.signedUrl.includes("?") ? "&" : "?";
      const res = await fetch(`${signData.signedUrl}${separator}_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        return (await res.json()) as T;
      }
    }

    const { data: fileBlob } = await admin.storage.from(DEFAULT_STORAGE_BUCKET).download(storagePath);

    if (fileBlob) {
      return JSON.parse(await fileBlob.text()) as T;
    }
  } catch {}

  return null;
}

async function legacyUpload(storagePath: string, data: unknown, admin: SupabaseClient): Promise<boolean> {
  try {
    const { error } = await admin.storage
      .from(DEFAULT_STORAGE_BUCKET)
      .upload(storagePath, Buffer.from(JSON.stringify(data, null, 2)), {
        upsert: true,
        contentType: "application/json",
      });

    return !error;
  } catch {
    return false;
  }
}

/** Whether an object exists in the bucket. Errors count as "exists" so callers never overwrite blindly. */
export async function storageObjectExists(storagePath: string, client: SupabaseClient): Promise<boolean> {
  const slash = storagePath.lastIndexOf("/");
  const dir = slash === -1 ? "" : storagePath.slice(0, slash);
  const name = storagePath.slice(slash + 1);
  try {
    const { data, error } = await client.storage.from(DEFAULT_STORAGE_BUCKET).list(dir, { search: name, limit: 100 });
    if (error || !data) return true;
    return data.some((entry) => entry.name === name);
  } catch {
    return true;
  }
}

/** The legacy file's content, `undefined` when it does not exist; throws when it exists but cannot be read. */
async function readLegacyStrict<T>(key: string, client: SupabaseClient): Promise<T | undefined> {
  if (legacyAbsent.has(key)) return undefined;
  const data = await legacyDownload<T>(key, client);
  if (data !== null) return data;
  if (await storageObjectExists(key, client)) throw new Error(`Không đọc được ${key}, vui lòng thử lại.`);
  legacyAbsent.add(key);
  return undefined;
}

// ---------------------------------------------------------------------------------------------
// One store, table first.

type Loaded<T> = { mode: "table"; row: Row<T> | null } | { mode: "legacy" };

/**
 * Reads a store's row, seeding it from the legacy Storage file the first time. Throws when the
 * store exists but cannot be read; `{ mode: "legacy" }` when the table does not exist yet.
 */
async function loadStore<T>(key: string, client: SupabaseClient): Promise<Loaded<T>> {
  try {
    let row = await selectRow<T>(client, key);
    if (!row) {
      const legacy = await readLegacyStrict<T>(key, client);
      if (legacy !== undefined) {
        await insertRow(client, key, legacy);
        row = await selectRow<T>(client, key);
      }
    }
    remember(key, row ? row.version : null);
    return { mode: "table", row };
  } catch (err) {
    if (err instanceof TableMissingError) return { mode: "legacy" };
    throw err;
  }
}

/**
 * Writes a store's row. Inside withStoreLock, after the store was read there, it is a
 * compare-and-swap against what was read and throws StoreConflictError if it lost (the lock reruns
 * the step). Elsewhere it is a last-writer-wins write that still never interleaves with another.
 * `"legacy"` when the table does not exist yet.
 */
async function storeRow(key: string, data: unknown, client: SupabaseClient): Promise<"ok" | "legacy"> {
  try {
    const ctx = lockContext.getStore();
    if (ctx && ctx.key === key && ctx.version !== undefined) {
      const next = ctx.version === null ? ((await insertRow(client, key, data)) ? 1 : null) : await swapRow(client, key, data, ctx.version);
      if (next === null) throw new StoreConflictError(key);
      ctx.version = next;
      return "ok";
    }
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const row = await selectRow(client, key);
      const done = row ? (await swapRow(client, key, data, row.version)) !== null : await insertRow(client, key, data);
      if (done) return "ok";
      await backoff(i);
    }
    throw new StoreConflictError(key);
  } catch (err) {
    if (err instanceof TableMissingError) return "legacy";
    throw err;
  }
}

// ---------------------------------------------------------------------------------------------
// The helpers the routes call. Signatures and error behaviour are the Storage-era ones.

/**
 * Reads one JSON store. `null` when it does not exist or cannot be read.
 */
export async function downloadStorageJson<T = unknown>(
  storagePath: string,
  client?: SupabaseClient | null,
): Promise<T | null> {
  const admin = client ?? getSupabaseAdminClient();
  if (!admin) return null;

  try {
    const loaded = await loadStore<T>(storagePath, admin);
    if (loaded.mode === "table") return loaded.row ? loaded.row.data : null;
  } catch {
    return null;
  }
  return legacyDownload<T>(storagePath, admin);
}

/**
 * Replaces one JSON store. False when the write failed. Inside withStoreLock it is checked against
 * the version read there (see storeRow).
 */
export async function uploadStorageJson(
  storagePath: string,
  data: unknown,
  client?: SupabaseClient | null,
): Promise<boolean> {
  const admin = client ?? getSupabaseAdminClient();
  if (!admin) return false;

  try {
    if ((await storeRow(storagePath, data, admin)) === "ok") return true;
  } catch (err) {
    if (err instanceof StoreConflictError) throw err;
    return false;
  }
  return legacyUpload(storagePath, data, admin);
}

/**
 * Reads a JSON array store that must exist or be legitimately missing. A failed read of an
 * existing store throws: callers used to treat it as an empty list and wrote that back, wiping
 * every registry entry.
 */
export async function readStorageJsonList<T>(storagePath: string, client: SupabaseClient): Promise<T[]> {
  const loaded = await loadStore<T[]>(storagePath, client);
  if (loaded.mode === "table") {
    if (!loaded.row) return [];
    if (Array.isArray(loaded.row.data)) return loaded.row.data;
    throw new Error(`Không đọc được ${storagePath}, vui lòng thử lại.`);
  }
  const list = await legacyDownload<T[]>(storagePath, client);
  if (Array.isArray(list)) return list;
  if (await storageObjectExists(storagePath, client)) {
    throw new Error(`Không đọc được ${storagePath}, vui lòng thử lại.`);
  }
  return [];
}

/**
 * Atomic read-modify-write of a JSON array store. `mutate` returns the next list, or `null` to
 * leave the store untouched; it may run more than once (a lost compare-and-swap re-reads and
 * re-applies it), so it must only compute. Throws when the read or the write fails, so a route
 * never answers "saved" for data that was not.
 */
export function updateStorageJsonList<T, R = T[]>(
  storagePath: string,
  client: SupabaseClient,
  mutate: (list: T[]) => { next: T[] | null; result: R },
): Promise<R> {
  return withStoreLock(storagePath, async () => {
    const list = await readStorageJsonList<T>(storagePath, client);
    const { next, result } = mutate(list);
    if (next !== null && !(await uploadStorageJson(storagePath, next, client))) {
      throw new Error(`Không lưu được ${storagePath}, vui lòng thử lại.`);
    }
    return result;
  });
}

export interface PersistentJsonStoreOptions<T> {
  storagePath: string;
  primaryFile: string;
  fallbackFile: string;
  overrideEnvVar: string;
  getInitial: () => T;
  normalize?: (data: T) => { value: T; changed: boolean };
}

/**
 * Creates a hybrid JSON store that persists to the app_json_stores table (Storage before the
 * migration) on serverless deployments and falls back to local / tmp disk files for offline dev or
 * test overrides.
 */
export function createPersistentJsonStore<T>(options: PersistentJsonStoreOptions<T>) {
  function resolveReadPath(): string {
    const override = process.env[options.overrideEnvVar]?.trim();
    if (override) return override;
    if (fs.existsSync(/*turbopackIgnore: true*/ options.primaryFile)) return options.primaryFile;
    if (fs.existsSync(/*turbopackIgnore: true*/ options.fallbackFile)) return options.fallbackFile;
    return options.primaryFile;
  }

  function writeDisk(data: T): void {
    const payload = JSON.stringify(data, null, 2);
    const override = process.env[options.overrideEnvVar]?.trim();
    const target = override || options.primaryFile;
    try {
      fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(target), { recursive: true });
      fs.writeFileSync(/*turbopackIgnore: true*/ target, payload, "utf-8");
      return;
    } catch {
      if (override) return;
    }
    try {
      fs.writeFileSync(/*turbopackIgnore: true*/ options.fallbackFile, payload, "utf-8");
    } catch {}
  }

  function applyNormalize(raw: T): { value: T; changed: boolean } {
    return options.normalize ? options.normalize(raw) : { value: raw, changed: false };
  }

  function readDisk(): T {
    const filePath = resolveReadPath();
    try {
      if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
        const initial = options.getInitial();
        writeDisk(initial);
        return initial;
      }
      const content = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf-8");
      const parsed = JSON.parse(content) as T;
      const { value, changed } = applyNormalize(parsed);
      if (changed) {
        writeDisk(value);
      }
      return value;
    } catch {
      return options.getInitial();
    }
  }

  function hasExpectedShape(remote: unknown): remote is T {
    return remote !== null && remote !== undefined && (!Array.isArray(options.getInitial()) || Array.isArray(remote));
  }

  // Normalization is applied on every read and saved by the next locked write. A read must not
  // write: plain reads (the checkout polls status every second) run outside the lock, and writing
  // the snapshot they read overwrote writes made meanwhile — a payment confirmed from the phone was
  // lost this way and the QR never closed.
  function fromRemote(remote: T): T {
    const { value } = applyNormalize(remote);
    writeDisk(value);
    return value;
  }

  async function readAsync(): Promise<T> {
    const override = process.env[options.overrideEnvVar]?.trim();
    if (override) {
      return readDisk();
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return readDisk();
    }

    const loaded = await loadStore<T>(options.storagePath, admin);
    if (loaded.mode === "table") {
      if (loaded.row) {
        if (!hasExpectedShape(loaded.row.data)) throw new Error(`Không đọc được ${options.storagePath}, vui lòng thử lại.`);
        return fromRemote(loaded.row.data);
      }
      // No row and no legacy file: the store really does not exist yet. Seed it with this
      // instance's local data unless another instance just did, and read back whichever won.
      await insertRow(admin, options.storagePath, readDisk());
      const seeded = await loadStore<T>(options.storagePath, admin);
      if (seeded.mode === "table" && seeded.row && hasExpectedShape(seeded.row.data)) return fromRemote(seeded.row.data);
      throw new Error(`Không đọc được ${options.storagePath}, vui lòng thử lại.`);
    }

    const remote = await legacyDownload<T>(options.storagePath, admin);
    if (hasExpectedShape(remote)) return fromRemote(remote);

    // Seed the remote store only when it really does not exist. A read that merely failed
    // (network, timeout) used to upload this instance's local copy — on a serverless instance the
    // seed data — over the real store, wiping every order or chat written since.
    if (await storageObjectExists(options.storagePath, admin)) {
      throw new Error(`Không đọc được ${options.storagePath}, vui lòng thử lại.`);
    }
    const local = readDisk();
    await legacyUpload(options.storagePath, local, admin);
    return local;
  }

  async function writeAsync(data: T): Promise<void> {
    writeDisk(data);
    const override = process.env[options.overrideEnvVar]?.trim();
    if (override) return;
    const admin = getSupabaseAdminClient();
    if (!admin) return; // offline / local-disk mode, like readAsync
    // A failed write used to be ignored, so the API answered "saved" for data that was not.
    if (!(await uploadStorageJson(options.storagePath, data, admin)) && !(await uploadStorageJson(options.storagePath, data, admin))) {
      throw new Error(`Không lưu được ${options.storagePath}, vui lòng thử lại.`);
    }
  }

  function withLock<R>(fn: () => Promise<R>): Promise<R> {
    return withStoreLock(options.storagePath, fn);
  }

  return {
    readSync: readDisk,
    writeSync: writeDisk,
    readAsync,
    writeAsync,
    withLock,
  };
}
