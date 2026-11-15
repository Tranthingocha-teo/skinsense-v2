import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUser = { id: "test-user-id", email: "test@example.com" };

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: vi.fn(() => ({
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: null }),
          download: vi.fn().mockResolvedValue({ data: null }),
        })),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: "item-1", label: "Rửa mặt", position: 1 },
            { id: "item-2", label: "Kem dưỡng ẩm", position: 2 },
          ],
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      })),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    })),
  };
});

// Mock @/lib/supabase/server
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn(async () => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    })),
  };
});

describe("Routine API Multi-Tenancy (/api/routine)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("handles GET request for morning routine and returns steps with products", async () => {
    const { GET } = await import("./route");
    const req = new Request("http://localhost:3000/api/routine?timeOfDay=morning");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.timeOfDay).toBe("morning");
    expect(Array.isArray(json.steps)).toBe(true);
    expect(json.steps.length).toBeGreaterThan(0);

    const step = json.steps[0];
    expect(step).toHaveProperty("id");
    expect(step).toHaveProperty("label");
  });

  it("handles GET request for evening routine", async () => {
    const { GET } = await import("./route");
    const req = new Request("http://localhost:3000/api/routine?timeOfDay=evening");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.timeOfDay).toBe("evening");
    expect(Array.isArray(json.steps)).toBe(true);
    expect(json.steps.length).toBeGreaterThan(0);
  });

  it("handles PATCH request to toggle routine step completion", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost:3000/api/routine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: "Làm sạch",
        isCompleted: true,
        night: "2026-11-15",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.completedLabels).toContain("Làm sạch");
  });
});
