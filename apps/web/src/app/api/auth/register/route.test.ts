import { beforeEach, describe, expect, it, vi } from "vitest";

interface MockUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

let actor: { userId: string; email: string } | null = null;
let existingUsers: MockUser[] = [];
let files: Record<string, unknown> = {};
const updateUserById = vi.fn();

vi.mock("@/lib/session-auth", () => ({
  getAuthenticatedActor: vi.fn(async () => actor),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: () => ({
        createSignedUrl: vi.fn(async (path: string) => ({
          data: { signedUrl: `https://storage.test/${path}?token=1` },
        })),
        download: vi.fn(async () => ({ data: null })),
        list: vi.fn(async (_dir: string, opts: { search: string }) => ({
          data: Object.keys(files).filter((k) => k.endsWith(opts.search)).map(() => ({ name: opts.search })),
          error: null,
        })),
        upload: vi.fn(async (path: string, body: Buffer) => {
          files[path] = JSON.parse(body.toString());
          return { error: null };
        }),
      }),
    },
    auth: {
      admin: {
        listUsers: vi.fn(async () => ({ data: { users: existingUsers }, error: null })),
        updateUserById,
      },
    },
  })),
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-key");
  actor = null;
  files = { "specialists/specialists_registry.json": [] };
  existingUsers = [
    {
      id: "google-cust-1",
      email: "google.doc@gmail.com",
      app_metadata: { role: "customer", status: "active" },
      user_metadata: { full_name: "Google Customer" },
    },
    {
      id: "admin-2",
      email: "other.admin@skinsense.vn",
      app_metadata: { role: "admin", status: "active" },
      user_metadata: { full_name: "Admin 2" },
    },
  ];
  updateUserById.mockReset().mockImplementation(async (id: string, patch: Record<string, unknown>) => {
    const user = existingUsers.find((u) => u.id === id);
    return {
      data: {
        user: {
          ...user,
          app_metadata: { ...user?.app_metadata, ...(patch.app_metadata as Record<string, unknown>) },
          user_metadata: { ...user?.user_metadata, ...(patch.user_metadata as Record<string, unknown>) },
        },
      },
      error: null,
    };
  });
  global.fetch = vi.fn(async (url: string | URL | Request) => {
    const path = String(url).replace("https://storage.test/", "").split("?")[0];
    return { ok: path in files, json: async () => files[path] } as Response;
  });
});

describe("POST /api/auth/register specialist flow", () => {
  it("allows an already signed-in Google customer to apply as specialist without password", async () => {
    actor = { userId: "google-cust-1", email: "google.doc@gmail.com" };
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "google.doc@gmail.com",
          fullName: "BS Google",
          role: "specialist",
          phoneNumber: "0912345678",
          licenseId: "CCHN-GOOG-01",
          hospital: "BV Đà Nẵng",
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith(
      "google-cust-1",
      expect.objectContaining({
        app_metadata: { role: "specialist", status: "pending" },
      }),
    );
    expect(files["specialists/specialists_registry.json"]).toEqual([
      expect.objectContaining({
        id: "google-cust-1",
        email: "google.doc@gmail.com",
        status: "pending",
        licenseId: "CCHN-GOOG-01",
      }),
    ]);
  });

  it("refuses downgrading an admin account through the registration endpoint", async () => {
    actor = { userId: "admin-2", email: "other.admin@skinsense.vn" };
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "other.admin@skinsense.vn",
          fullName: "Admin 2",
          role: "specialist",
          licenseId: "CCHN-1",
          hospital: "BV",
        }),
      }),
    );
    expect(res.status).toBe(409);
  });
});
