import { describe, expect, it, vi, beforeEach } from "vitest";

interface MockAuthUser {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

let currentAuthUser: MockAuthUser | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: currentAuthUser },
        error: null,
      })),
    },
  })),
}));

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: vi.fn(() => ({
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/photo.jpg" } }),
          download: vi.fn().mockResolvedValue({
            data: {
              text: async () => JSON.stringify([
                {
                  id: "case-01",
                  caseCode: "BA-2026-0891",
                  patientName: "Trần Thị Ngọc Hà",
                  patientAge: 21,
                  patientGender: "Nữ",
                  phone: "0905 888 999",
                  submittedDate: "14/11/2026",
                  status: "pending_routine",
                  severity: "moderate",
                  skinPhotoUrl: "https://example.com/photo.jpg",
                  skinType: "Hỗn hợp thiên dầu",
                  fitzpatrickScale: "Loại III",
                  symptoms: "Mụn đỏ",
                  allergies: "Không",
                  aiAnalysis: {
                    skinHealthScore: 78,
                    rednessIndex: 46,
                    inflammatorySpots: 6,
                    affectedZones: ["Má trái"],
                  },
                },
              ]),
            },
          }),
          upload: vi.fn().mockResolvedValue({ data: {} }),
        })),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [] }),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: [] }),
      })),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }),
        },
      },
    })),
  };
});

describe("Specialist Cases API (/api/specialist/cases)", () => {
  beforeEach(() => {
    currentAuthUser = {
      id: "spec-01",
      email: "bacsi.hoa@skinsense.vn",
      app_metadata: { role: "specialist", status: "active" },
      user_metadata: { role: "specialist", full_name: "BS. Mai Hoa" },
    };
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("rejects a customer who wrote role specialist into their own user_metadata, or a pending specialist", async () => {
    const { GET } = await import("./route");

    // supabase.auth.updateUser({ data: { role: "specialist" } }) is open to every signed-in user.
    currentAuthUser = { id: "cust-02", email: "xdoctor@gmail.com", user_metadata: { role: "specialist", status: "active" } };
    expect((await GET(new Request("http://localhost:3000/api/specialist/cases"))).status).toBe(403);

    currentAuthUser = {
      id: "spec-02",
      email: "new.doctor@example.com",
      app_metadata: { role: "specialist", status: "pending" },
      user_metadata: { role: "specialist" },
    };
    expect((await GET(new Request("http://localhost:3000/api/specialist/cases"))).status).toBe(403);
  });

  it("rejects unauthenticated (401) and non-specialist customer (403) callers", async () => {
    const { GET, POST } = await import("./route");

    currentAuthUser = null;
    const unauthRes = await GET(new Request("http://localhost:3000/api/specialist/cases"));
    expect(unauthRes.status).toBe(401);

    currentAuthUser = {
      id: "cust-01",
      email: "customer@example.com",
      user_metadata: { role: "customer" },
    };
    const forbiddenGet = await GET(new Request("http://localhost:3000/api/specialist/cases"));
    expect(forbiddenGet.status).toBe(403);

    const forbiddenPost = await POST(
      new Request("http://localhost:3000/api/specialist/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: [] }),
      }),
    );
    expect(forbiddenPost.status).toBe(403);
  });

  it("handles GET request and returns clinical cases list structure", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost:3000/api/specialist/cases"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.cases)).toBe(true);
    expect(json.cases.length).toBeGreaterThan(0);

    const firstCase = json.cases[0];
    expect(firstCase).toHaveProperty("id");
    expect(firstCase).toHaveProperty("patientName");
    expect(firstCase).toHaveProperty("caseCode");
  });

  it("handles POST request to prescribe routine and returns ok", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost:3000/api/specialist/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "test-user-id",
        caseId: "case-01",
        routineTitle: "Phác đồ phục hồi da test",
        doctorNotes: "Thoa kem đều đặn",
        revisitDate: "2026-12-01",
        products: [
          {
            id: "p1",
            name: "Kem dưỡng phục hồi CICA",
            brand: "A-Derma",
            category: "Dưỡng ẩm",
            imageUrl: "https://example.com/cica.jpg",
            stepTime: "both",
            stepNumber: 1,
            dosage: "1 hạt đậu",
            usageGuide: "Thoa sáng và tối",
          },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
