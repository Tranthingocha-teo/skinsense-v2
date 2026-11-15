import { describe, expect, it, vi, beforeEach } from "vitest";

interface MockAuthUser {
  id: string;
  email: string;
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
          createSignedUrl: vi.fn().mockResolvedValue({ data: null }),
          download: vi.fn().mockResolvedValue({
            data: {
              text: async () =>
                JSON.stringify([
                  {
                    id: "case_own",
                    caseCode: "BA-2026-0001",
                    patientUserId: "cust_01",
                    patientEmail: "hattn.23itb@vku.udn.vn",
                    patientName: "Trần Thị Ngọc Hà",
                  },
                  {
                    id: "case_other",
                    caseCode: "BA-2026-0002",
                    patientUserId: "cust_other",
                    patientEmail: "other@example.com",
                    patientName: "Bệnh nhân khác",
                  },
                ]),
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
    currentAuthUser = {
      id: "cust_01",
      email: "patient@example.com",
      user_metadata: { role: "customer", full_name: "Trần Thị Ngọc Hà" },
    };
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  it("rejects unauthenticated GET and POST with 401", async () => {
    currentAuthUser = null;
    const { GET, POST } = await import("./route");

    const getRes = await GET(new Request("http://localhost:3000/api/patient/clinical-records"));
    expect(getRes.status).toBe(401);

    const postRes = await POST(
      new Request("http://localhost:3000/api/patient/clinical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: "Test", symptoms: "Mụn" }),
      }),
    );
    expect(postRes.status).toBe(401);
  });

  it("scopes GET to own records for customer and returns all for specialist", async () => {
    const { GET } = await import("./route");

    const custRes = await GET(new Request("http://localhost:3000/api/patient/clinical-records"));
    expect(custRes.status).toBe(200);
    const custJson = await custRes.json();
    expect(custJson.ok).toBe(true);
    expect(custJson.cases).toHaveLength(1);
    expect(custJson.cases[0].id).toBe("case_own");

    currentAuthUser = {
      id: "spec_01",
      email: "bacsi@skinsense.vn",
      user_metadata: { role: "specialist", full_name: "BS. Mai Hoa" },
    };
    const specRes = await GET(new Request("http://localhost:3000/api/patient/clinical-records"));
    expect(specRes.status).toBe(200);
    const specJson = await specRes.json();
    expect(specJson.cases).toHaveLength(2);
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
        patientUserId: "spoofed_other_user",
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
    expect(json.caseData.patientUserId).toBe("cust_01");
  });
});
