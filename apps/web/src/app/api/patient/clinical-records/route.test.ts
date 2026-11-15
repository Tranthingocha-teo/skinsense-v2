import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: vi.fn(() => ({
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: null }),
          download: vi.fn().mockResolvedValue({
            data: {
              text: async () => JSON.stringify([]),
            },
          }),
          upload: vi.fn().mockResolvedValue({ error: null }),
        })),
      },
    })),
  };
});

describe("Patient Clinical Records API (/api/patient/clinical-records)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("handles GET and returns existing cases list", async () => {
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.cases)).toBe(true);
  });

  it("rejects POST when missing required patientName or symptoms", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost:3000/api/patient/clinical-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientName: "", symptoms: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("successfully creates a new clinical record with caseCode format BA-2026-XXXX", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost:3000/api/patient/clinical-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: "Trần Thị Ngọc Hà",
        patientEmail: "hattn.23itb@vku.udn.vn",
        patientAge: 21,
        patientGender: "Nữ",
        phone: "0905 888 999",
        skinType: "Hỗn hợp thiên dầu",
        symptoms: "Mụn viêm đỏ má trái",
        rednessIndex: 48,
        spotsCount: 6,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.caseCode).toMatch(/^BA-2026-\d{4}$/);
    expect(json.caseData).toBeDefined();
    expect(json.caseData.patientName).toBe("Trần Thị Ngọc Hà");
  });
});
