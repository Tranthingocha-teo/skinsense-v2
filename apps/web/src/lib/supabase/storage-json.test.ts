import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upload = vi.fn();
let remote: unknown = [];

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(async () => ({ data: { signedUrl: "https://storage.test/x?token=t" } })),
        download: vi.fn(async () => ({ data: null })),
        upload,
        // The store file exists.
        list: vi.fn(async (_dir: string, opts: { search: string }) => ({ data: [{ name: opts.search }], error: null })),
      })),
    },
  })),
}));

const { createPersistentJsonStore } = await import("./storage-json");

function makeStore() {
  const dir = path.join(os.tmpdir(), `storage-json-test-${Math.random().toString(36).slice(2)}`);
  return createPersistentJsonStore<Array<{ id: string; image?: string }>>({
    storagePath: `test/store-${Math.random()}.json`,
    primaryFile: path.join(dir, "a.json"),
    fallbackFile: path.join(dir, "b.json"),
    overrideEnvVar: "STORAGE_JSON_TEST_OVERRIDE_UNSET",
    getInitial: () => [],
    // Like the orders store: fills a missing field on read.
    normalize: (list) => ({ value: list.map((o) => ({ ...o, image: o.image ?? "default" })), changed: list.some((o) => !o.image) }),
  });
}

describe("createPersistentJsonStore", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    upload.mockReset();
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => remote }) as Response);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("a read normalizes but never uploads (it would overwrite writes made meanwhile)", async () => {
    remote = [{ id: "o1" }];
    const store = makeStore();
    expect(await store.readAsync()).toEqual([{ id: "o1", image: "default" }]);
    expect(upload).not.toHaveBeenCalled();
  });

  it("a write whose upload fails throws instead of reporting success", async () => {
    upload.mockResolvedValue({ error: { message: "boom" } });
    const store = makeStore();
    await expect(store.writeAsync([{ id: "o1" }])).rejects.toThrow(/Không lưu được/);
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it("an existing store that cannot be read is not overwritten with the local seed", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, json: async () => null }) as Response);
    const store = makeStore();
    await expect(store.readAsync()).rejects.toThrow(/Không đọc được/);
    expect(upload).not.toHaveBeenCalled();
  });
});
