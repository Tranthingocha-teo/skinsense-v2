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
  let lockQueue: Promise<void> = Promise.resolve();

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
      const { value, changed } = applyNormalize(remote);
      writeDisk(value);
      if (changed) {
        await uploadStorageJson(options.storagePath, value, admin);
      }
      return value;
    }

    const local = readDisk();
    await uploadStorageJson(options.storagePath, local, admin);
    return local;
  }

  async function writeAsync(data: T): Promise<void> {
    writeDisk(data);
    const override = process.env[options.overrideEnvVar]?.trim();
    if (override) return;
    await uploadStorageJson(options.storagePath, data);
  }

  function withLock<R>(fn: () => Promise<R>): Promise<R> {
    const run = lockQueue.then(fn, fn);
    lockQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  return {
    readSync: readDisk,
    writeSync: writeDisk,
    readAsync,
    writeAsync,
    withLock,
  };
}
