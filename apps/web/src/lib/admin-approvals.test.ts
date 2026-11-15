import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApprovalError, applyAccountDecision } from "./admin-approvals";

interface FakeUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

let user: FakeUser;
let files: Record<string, unknown>;
const updateUserById = vi.fn();

function fakeClient(): SupabaseClient {
  return {
    auth: {
      admin: {
        getUserById: vi.fn(async (id: string) => (id === user.id ? { data: { user }, error: null } : { data: { user: null }, error: { message: "nope" } })),
        updateUserById,
      },
    },
    storage: {
      from: () => ({
        createSignedUrl: async (path: string) => ({ data: { signedUrl: `https://storage.test/${path}?token=t` } }),
        download: async () => ({ data: null }),
        list: async (_dir: string, opts: { search: string }) => ({
          data: Object.keys(files).filter((f) => f.endsWith(opts.search)).map(() => ({ name: opts.search })),
          error: null,
        }),
        upload: async (path: string, body: Buffer) => {
          files[path] = JSON.parse(body.toString());
          return { error: null };
        },
      }),
    },
  } as unknown as SupabaseClient;
}

beforeEach(() => {
  user = {
    id: "u1",
    email: "shop@example.test",
    app_metadata: { role: "shop", status: "pending", shop_id: "my_shop" },
    user_metadata: { shop_name: "My Shop", role: "shop", status: "pending" },
  };
  files = {
    "shops/shops_registry.json": [{ id: "u1", email: "shop@example.test", status: "pending" }, { id: "other", status: "pending" }],
    "specialists/specialists_registry.json": [],
  };
  updateUserById.mockReset().mockResolvedValue({ data: { user }, error: null });
  global.fetch = vi.fn(async (url: string | URL | Request) => {
    const path = String(url).replace("https://storage.test/", "").split("?")[0];
    return { ok: path in files, json: async () => files[path] } as Response;
  });
});

describe("applyAccountDecision", () => {
  it("approves into app_metadata (keeping the frozen shop_id) and mirrors the registry entry only", async () => {
    const result = await applyAccountDecision(fakeClient(), "u1", { status: "active" });
    expect(result).toMatchObject({ role: "shop", status: "active" });
    const patch = updateUserById.mock.calls[0][1];
    expect(patch.app_metadata).toEqual({ role: "shop", status: "active", shop_id: "my_shop", status_before_lock: null });
    expect(patch.ban_duration).toBe("none");
    expect(files["shops/shops_registry.json"]).toEqual([
      expect.objectContaining({ id: "u1", status: "active" }),
      { id: "other", status: "pending" },
    ]);
  });

  it("locking bans the account and marks it suspended", async () => {
    user.app_metadata.status = "active";
    await applyAccountDecision(fakeClient(), "u1", { status: "suspended" });
    const patch = updateUserById.mock.calls[0][1];
    expect(patch.app_metadata.status).toBe("suspended");
    expect(patch.ban_duration).toBe("876000h");
    expect(patch.app_metadata.status_before_lock).toBe("active");
  });

  it("unlocking restores the pre-lock status: a locked application does not come back approved", async () => {
    user.app_metadata = { role: "shop", status: "suspended", shop_id: "my_shop", status_before_lock: "pending" };
    const result = await applyAccountDecision(fakeClient(), "u1", { unlock: true });
    expect(result.status).toBe("pending");
    const patch = updateUserById.mock.calls[0][1];
    expect(patch.app_metadata).toMatchObject({ status: "pending", status_before_lock: null });
    expect(patch.ban_duration).toBe("none");
    expect(patch.user_metadata.approved_at).toBeUndefined();

    user.app_metadata = { role: "shop", status: "active" };
    await expect(applyAccountDecision(fakeClient(), "u1", { unlock: true })).rejects.toMatchObject({ httpStatus: 409 });
  });

  it("refuses admins, the super admin and the wrong kind of application", async () => {
    user.app_metadata = { role: "admin" };
    await expect(applyAccountDecision(fakeClient(), "u1", { status: "suspended" })).rejects.toMatchObject({ httpStatus: 403 });
    user.app_metadata = { role: "customer", status: "active" };
    await expect(applyAccountDecision(fakeClient(), "u1", { status: "active", expectRole: "specialist" })).rejects.toMatchObject({ httpStatus: 409 });
    user.email = "hattn.23itb@vku.udn.vn";
    await expect(applyAccountDecision(fakeClient(), "u1", { status: "active" })).rejects.toBeInstanceOf(ApprovalError);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("a failed auth update is an error, not a success", async () => {
    updateUserById.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(applyAccountDecision(fakeClient(), "u1", { status: "active" })).rejects.toMatchObject({ httpStatus: 502 });
    expect(files["shops/shops_registry.json"]).toEqual(expect.arrayContaining([expect.objectContaining({ id: "u1", status: "pending" })]));
  });

  it("an unreadable registry is reported instead of being overwritten", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, json: async () => null }) as Response);
    await expect(applyAccountDecision(fakeClient(), "u1", { status: "active" })).rejects.toThrow(/chưa đồng bộ được hồ sơ/);
    expect(files["shops/shops_registry.json"]).toHaveLength(2);
  });
});
