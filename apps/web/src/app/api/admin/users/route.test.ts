import { beforeEach, describe, expect, it, vi } from "vitest";

interface MockUser {
  id: string;
  email: string;
  phone?: string;
  created_at?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

let currentUser: MockUser | null = null;
let allUsers: MockUser[] = [];
let files: Record<string, unknown> = {};
const updateUserById = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: currentUser }, error: null })),
    },
  })),
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
          data: Object.keys(files)
            .filter((k) => k.endsWith(opts.search))
            .map(() => ({ name: opts.search })),
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
        listUsers: vi.fn(async () => ({ data: { users: allUsers }, error: null })),
        getUserById: vi.fn(async (id: string) => ({
          data: { user: allUsers.find((u) => u.id === id) ?? null },
          error: null,
        })),
        updateUserById,
      },
    },
  })),
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-key");
  currentUser = {
    id: "admin-1",
    email: "hattn.23itb@vku.udn.vn",
    app_metadata: { role: "admin", status: "active" },
    user_metadata: { full_name: "Super Admin" },
  };
  files = {
    "specialists/specialists_registry.json": [],
    "shops/shops_registry.json": [],
  };
  allUsers = [];
  updateUserById.mockReset().mockImplementation(async (id: string, patch: Record<string, unknown>) => {
    const existing = allUsers.find((u) => u.id === id);
    const updated = {
      ...existing,
      id,
      app_metadata: { ...(existing?.app_metadata || {}), ...((patch.app_metadata as Record<string, unknown>) || {}) },
      user_metadata: { ...(existing?.user_metadata || {}), ...((patch.user_metadata as Record<string, unknown>) || {}) },
    };
    return { data: { user: updated }, error: null };
  });
  global.fetch = vi.fn(async (url: string | URL | Request) => {
    const path = String(url).replace("https://storage.test/", "").split("?")[0];
    return { ok: path in files, json: async () => files[path] } as Response;
  });
});

describe("Admin doctor listing & returning applicant registration", () => {
  it("merges specialists_registry.json details, surfaces legacy pending registry applicants, and sorts pending doctors first", async () => {
    allUsers = [
      {
        id: "active-doc",
        email: "active.doc@example.com",
        created_at: "2026-11-18T10:00:00Z",
        app_metadata: { role: "specialist", status: "active" },
        user_metadata: { full_name: "BS Active", license_id: "CCHN-1", hospital: "BV A" },
      },
      {
        id: "old-cust-reapplied",
        email: "reapplied.doc@example.com",
        created_at: "2026-11-01T00:00:00Z",
        app_metadata: { role: "specialist", status: "pending" },
        user_metadata: { full_name: "BS Mới Nộp" },
      },
      {
        id: "legacy-pending",
        email: "legacy.doc@example.com",
        created_at: "2026-11-02T00:00:00Z",
        app_metadata: {},
        user_metadata: { full_name: "BS Legacy" },
      },
    ];
    files["specialists/specialists_registry.json"] = [
      {
        id: "old-cust-reapplied",
        email: "reapplied.doc@example.com",
        name: "BS Mới Nộp",
        licenseId: "CCHN-NEW-999",
        hospital: "BV Da Liễu Trung Ương",
        specialty: "Da liễu thẩm mỹ",
        phone: "0905111222",
        status: "pending",
        submittedAt: "2026-11-19T06:00:00Z",
      },
      {
        id: "legacy-pending",
        email: "legacy.doc@example.com",
        name: "BS Legacy Registry",
        licenseId: "CCHN-LEG-123",
        hospital: "BV Chợ Rẫy",
        specialty: "Mụn trứng cá",
        status: "pending",
        submittedAt: "2026-11-18T08:00:00Z",
      },
    ];

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost:3000/api/admin/users"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      users: Array<{
        id: string;
        role: string;
        status: string;
        submittedAt?: string;
        specialistDetails?: { licenseId: string; hospital: string };
      }>;
    };

    expect(json.users.map((u) => u.id)).toEqual(["old-cust-reapplied", "legacy-pending", "active-doc"]);
    expect(json.users[0]).toMatchObject({
      id: "old-cust-reapplied",
      role: "specialist",
      status: "pending",
      submittedAt: "2026-11-19T06:00:00Z",
      specialistDetails: { licenseId: "CCHN-NEW-999", hospital: "BV Da Liễu Trung Ương" },
    });
    expect(json.users[1]).toMatchObject({
      id: "legacy-pending",
      role: "specialist",
      status: "pending",
      specialistDetails: { licenseId: "CCHN-LEG-123", hospital: "BV Chợ Rẫy" },
    });
  });
});
