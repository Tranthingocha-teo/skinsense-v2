import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_STORAGE_BUCKET = "photos";

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

/**
 * Downloads and parses a JSON file stored inside the private Supabase Storage bucket.
 * Falls back cleanly to `null` if unavailable or invalid.
 */
export async function downloadStorageJson<T = unknown>(
  storagePath: string,
  client?: SupabaseClient | null,
): Promise<T | null> {
  const admin = client ?? getSupabaseAdminClient();
  if (!admin) return null;

  try {
    const { data: signData } = await admin.storage
      .from(DEFAULT_STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60);

    if (signData?.signedUrl) {
      const separator = signData.signedUrl.includes("?") ? "&" : "?";
      const res = await fetch(`${signData.signedUrl}${separator}_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        return (await res.json()) as T;
      }
    }

    const { data: fileBlob } = await admin.storage
      .from(DEFAULT_STORAGE_BUCKET)
      .download(storagePath);

    if (fileBlob) {
      return JSON.parse(await fileBlob.text()) as T;
    }
  } catch {}

  return null;
}

/**
 * Uploads a JSON-serializable payload to the private Supabase Storage bucket.
 */
export async function uploadStorageJson(
  storagePath: string,
  data: unknown,
  client?: SupabaseClient | null,
): Promise<boolean> {
  const admin = client ?? getSupabaseAdminClient();
  if (!admin) return false;

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

/**
 * Runs read-modify-write steps on one Storage JSON file one at a time. The queue is per file path
 * for the whole process (on globalThis), so every route that writes the file shares it even if the
 * module is instantiated per route bundle. Separate serverless instances do not share it.
 */
export function withStoreLock<R>(storagePath: string, fn: () => Promise<R>): Promise<R> {
  const queues = ((globalThis as { __skinsenseStoreLocks?: Map<string, Promise<void>> }).__skinsenseStoreLocks ??=
    new Map<string, Promise<void>>());
  const run = (queues.get(storagePath) ?? Promise.resolve()).then(fn, fn);
  queues.set(
    storagePath,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
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

export interface PersistentJsonStoreOptions<T> {
  storagePath: string;
  primaryFile: string;
  fallbackFile: string;
  overrideEnvVar: string;
  getInitial: () => T;
  normalize?: (data: T) => { value: T; changed: boolean };
}

/**
 * Creates a hybrid JSON store that persists to Supabase Storage on serverless deployments
 * and falls back to local / tmp disk files for offline dev or test overrides.
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

  async function readAsync(): Promise<T> {
    const override = process.env[options.overrideEnvVar]?.trim();
    if (override) {
      return readDisk();
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return readDisk();
    }

    const remote = await downloadStorageJson<T>(options.storagePath, admin);
    if (remote !== null && (!Array.isArray(options.getInitial()) || Array.isArray(remote))) {
      // Normalization is applied on every read and saved by the next locked write. A read must
      // not upload: plain reads (the checkout polls status every second) run outside the lock,
      // and uploading the snapshot they read overwrote writes made meanwhile — a payment
      // confirmed from the phone was lost this way and the QR never closed.
      const { value } = applyNormalize(remote);
      writeDisk(value);
      return value;
    }

    // Seed the remote store only when it really does not exist. A read that merely failed
    // (network, timeout) used to upload this instance's local copy — on a serverless instance the
    // seed data — over the real store, wiping every order or chat written since.
    if (await storageObjectExists(options.storagePath, admin)) {
      throw new Error(`Không đọc được ${options.storagePath}, vui lòng thử lại.`);
    }
    const local = readDisk();
    await uploadStorageJson(options.storagePath, local, admin);
    return local;
  }

  async function writeAsync(data: T): Promise<void> {
    writeDisk(data);
    const override = process.env[options.overrideEnvVar]?.trim();
    if (override) return;
    const admin = getSupabaseAdminClient();
    if (!admin) return; // offline / local-disk mode, like readAsync
    // A failed upload used to be ignored, so the API answered "saved" for data that was not.
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
