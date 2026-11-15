import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BackendOrder } from "@/lib/orders-store";

interface MockAuthUser {
  id: string;
  email: string;
  phone?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

let currentAuthUser: MockAuthUser | null = null;
const profileCachePath = path.join(process.cwd(), ".profiles-cache.json");
let previousProfileCacheRaw: string | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: currentAuthUser },
        error: null,
      })),
      updateUser: vi.fn(async () => ({ data: { user: currentAuthUser }, error: null })),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "" } }),
        download: vi.fn().mockResolvedValue({ data: null }),
        upload: vi.fn().mockResolvedValue({ data: {} }),
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [] }),
      upsert: vi.fn().mockResolvedValue({ data: [] }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({
          data: {
            users: [
              {
                id: "cust-01",
                email: "customer@example.com",
                created_at: "2026-11-10T00:00:00Z",
                user_metadata: { role: "customer", full_name: "Thùy Dung", phone_number: "0901234567" },
              },
            ],
          },
          error: null,
        }),
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: "new-user" } }, error: null }),
        getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        updateUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  })),
}));

const ADMIN_ACTOR: MockAuthUser = {
  id: "admin-01",
  email: "hattn.23itb@vku.udn.vn",
  app_metadata: { role: "admin" },
  user_metadata: { role: "admin", full_name: "Trần Thị Ngọc Hà" },
};

const CUSTOMER_ACTOR: MockAuthUser = {
  id: "cust-01",
  email: "customer@example.com",
  user_metadata: { role: "customer", full_name: "Thùy Dung" },
};

const SPECIALIST_ACTOR: MockAuthUser = {
  id: "spec-01",
  email: "bacsi.hoa@skinsense.vn",
  app_metadata: { role: "specialist", status: "active" },
  user_metadata: { role: "specialist", full_name: "BS. Mai Hoa" },
};

const CERAVE_SHOP_ACTOR: MockAuthUser = {
  id: "shop-cerave",
  email: "cerave@skinsense.vn",
  app_metadata: { role: "shop", status: "active" },
  user_metadata: { role: "shop", shop_name: "CeraVe Skincare Official", full_name: "CeraVe Skincare Official" },
};

describe("Server-side API auth & role guardrails", () => {
  let tmpDir: string;

  beforeEach(() => {
    currentAuthUser = null;
    previousProfileCacheRaw = fs.existsSync(profileCachePath)
      ? fs.readFileSync(profileCachePath, "utf-8")
      : null;

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skinsense-sec-test-"));
    const ordersDbPath = path.join(tmpDir, "orders-db.json");
    const seedOrders: BackendOrder[] = [
      {
        id: "ORD-A",
        orderCode: "ORD-A-01",
        customerName: "Thùy Dung",
        customerPhone: "0987654321",
        shippingAddress: "Q1 HCM",
        totalAmount: 395000,
        status: "processing",
        paymentMethod: "momo",
        paymentStatus: "paid",
        shopName: "La Roche-Posay Official Store",
        brand: "La Roche-Posay",
        carrier: "SPX Express",
        items: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: "ORD-B",
        orderCode: "ORD-B-01",
        customerName: "Người Mua Khác",
        customerPhone: "0911222333",
        shippingAddress: "Đà Nẵng",
        totalAmount: 550000,
        status: "pending",
        paymentMethod: "cod",
        paymentStatus: "unpaid",
        shopName: "CeraVe Skincare Official",
        brand: "CeraVe",
        carrier: "SPX Express",
        items: [],
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(ordersDbPath, JSON.stringify(seedOrders, null, 2), "utf-8");

    vi.stubEnv("SKINSENSE_ORDERS_DB_PATH", ordersDbPath);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (previousProfileCacheRaw !== null) {
      fs.writeFileSync(profileCachePath, previousProfileCacheRaw, "utf-8");
    } else if (fs.existsSync(profileCachePath)) {
      fs.unlinkSync(profileCachePath);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("requires admin role for all /api/admin/users methods", async () => {
    const { GET, POST, PATCH, DELETE } = await import("./users/route");

    expect((await GET(new Request("http://localhost:3000/api/admin/users"))).status).toBe(401);
    expect(
      (
        await POST(
          new Request("http://localhost:3000/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "x@y.com" }),
          }),
        )
      ).status,
    ).toBe(401);

    currentAuthUser = CUSTOMER_ACTOR;
    expect((await GET(new Request("http://localhost:3000/api/admin/users"))).status).toBe(403);
    expect(
      (
        await PATCH(
          new Request("http://localhost:3000/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: "cust-01", role: "admin" }),
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (await DELETE(new Request("http://localhost:3000/api/admin/users?userId=cust-01"))).status,
    ).toBe(403);

    currentAuthUser = ADMIN_ACTOR;
    const okRes = await GET(new Request("http://localhost:3000/api/admin/users"));
    expect(okRes.status).toBe(200);
    const data = (await okRes.json()) as { ok: boolean; users: unknown[] };
    expect(data.ok).toBe(true);
    expect(data.users.length).toBe(1);
  });

  it("requires admin role for /api/admin/specialists and /api/admin/orders", async () => {
    const specialistsRoute = await import("./specialists/route");
    const ordersRoute = await import("./orders/route");

    expect((await specialistsRoute.GET(new Request("http://localhost:3000/api/admin/specialists"))).status).toBe(401);
    expect((await ordersRoute.GET(new Request("http://localhost:3000/api/admin/orders"))).status).toBe(401);

    currentAuthUser = SPECIALIST_ACTOR;
    expect((await specialistsRoute.GET(new Request("http://localhost:3000/api/admin/specialists"))).status).toBe(403);
    expect(
      (
        await specialistsRoute.PATCH(
          new Request("http://localhost:3000/api/admin/specialists", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: "spec-01", action: "approve" }),
          }),
        )
      ).status,
    ).toBe(403);

    currentAuthUser = CERAVE_SHOP_ACTOR;
    expect((await ordersRoute.GET(new Request("http://localhost:3000/api/admin/orders"))).status).toBe(403);
    expect(
      (
        await ordersRoute.PATCH(
          new Request("http://localhost:3000/api/admin/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: "ORD-9821", action: "resolve" }),
          }),
        )
      ).status,
    ).toBe(403);

    currentAuthUser = ADMIN_ACTOR;
    expect((await specialistsRoute.GET(new Request("http://localhost:3000/api/admin/specialists"))).status).toBe(200);
    expect((await ordersRoute.GET(new Request("http://localhost:3000/api/admin/orders"))).status).toBe(200);
  });

  it("scopes /api/admin/products draft visibility and enforces POST/PATCH authorization", async () => {
    const { GET, POST, PATCH } = await import("./products/route");

    // Public GET only shows approved products
    const publicRes = await GET(new Request("http://localhost:3000/api/admin/products"));
    expect(publicRes.status).toBe(200);
    const publicJson = (await publicRes.json()) as { products: Array<{ status: string; shopName: string }> };
    expect(publicJson.products.every((p) => p.status === "approved")).toBe(true);

    // Shop GET sees approved + its own pending products, never other shops' pending drafts
    currentAuthUser = CERAVE_SHOP_ACTOR;
    const shopRes = await GET(new Request("http://localhost:3000/api/admin/products"));
    const shopJson = (await shopRes.json()) as { products: Array<{ status: string; shopName: string }> };
    expect(shopJson.products.some((p) => p.status === "pending" && p.shopName === "CeraVe Skincare Official")).toBe(true);
    expect(shopJson.products.some((p) => p.status === "pending" && p.shopName === "Innisfree Beauty Hub")).toBe(false);

    // Shop POST binds shopName to actor.shopName instead of trusting caller-supplied shopName
    const createRes = await POST(
      new Request("http://localhost:3000/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Kem dưỡng CeraVe SA Cream",
          shopName: "La Roche-Posay Official Store",
          price: 420000,
        }),
      }),
    );
    expect(createRes.status).toBe(200);
    const createJson = (await createRes.json()) as { product: { shopName: string; status: string } };
    expect(createJson.product.shopName).toBe("CeraVe Skincare Official");
    expect(createJson.product.status).toBe("pending");

    // Non-admin cannot approve/reject via PATCH
    const forbiddenPatch = await PATCH(
      new Request("http://localhost:3000/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "prod_02", status: "approved" }),
      }),
    );
    expect(forbiddenPatch.status).toBe(403);

    // Customer cannot POST a new product
    currentAuthUser = CUSTOMER_ACTOR;
    const customerPost = await POST(
      new Request("http://localhost:3000/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Fake", price: 1000 }),
      }),
    );
    expect(customerPost.status).toBe(403);

    // Unauthenticated cannot POST or PATCH
    currentAuthUser = null;
    expect(
      (
        await POST(
          new Request("http://localhost:3000/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Guest" }),
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await PATCH(
          new Request("http://localhost:3000/api/admin/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: "prod_02", status: "approved" }),
          }),
        )
      ).status,
    ).toBe(401);

    // Admin sees all statuses and can PATCH
    currentAuthUser = ADMIN_ACTOR;
    const adminGet = await GET(new Request("http://localhost:3000/api/admin/products"));
    const adminJson = (await adminGet.json()) as { products: Array<{ status: string }> };
    expect(adminJson.products.some((p) => p.status === "pending")).toBe(true);
    expect(
      (
        await PATCH(
          new Request("http://localhost:3000/api/admin/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: "prod_02", status: "approved" }),
          }),
        )
      ).status,
    ).toBe(200);
  });

  it("enforces authentication and specialist/admin restrictions on /api/admin/routines", async () => {
    const { GET, PATCH, POST } = await import("./routines/route");

    expect((await GET(new Request("http://localhost:3000/api/admin/routines"))).status).toBe(401);
    expect(
      (
        await PATCH(
          new Request("http://localhost:3000/api/admin/routines", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "customer", stepId: "1", isCompleted: true }),
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await POST(
          new Request("http://localhost:3000/api/admin/routines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "customer", title: "Routine mới" }),
          }),
        )
      ).status,
    ).toBe(401);

    currentAuthUser = CUSTOMER_ACTOR;
    expect((await GET(new Request("http://localhost:3000/api/admin/routines"))).status).toBe(200);
    expect(
      (
        await POST(
          new Request("http://localhost:3000/api/admin/routines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "customer", title: "Hack" }),
          }),
        )
      ).status,
    ).toBe(403);

    currentAuthUser = SPECIALIST_ACTOR;
    expect(
      (
        await POST(
          new Request("http://localhost:3000/api/admin/routines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "customer", title: "Phác đồ chuẩn y khoa" }),
          }),
        )
      ).status,
    ).toBe(200);
  });

  it("prevents unauthenticated email cache reads and role escalation on /api/profile", async () => {
    const { GET, PUT } = await import("../profile/route");

    fs.writeFileSync(
      profileCachePath,
      JSON.stringify({
        "secret@example.com": {
          id: "victim-01",
          email: "secret@example.com",
          role: "customer",
          fullName: "Sensitive Victim Name",
        },
      }),
      "utf-8",
    );

    // Unauthenticated GET must ignore ?email= cache entries and return default static preview
    const unauthGet = await GET(new Request("http://localhost:3000/api/profile?email=secret@example.com"));
    expect(unauthGet.status).toBe(200);
    const unauthJson = (await unauthGet.json()) as { source: string; user: { email: string; fullName: string } };
    expect(unauthJson.source).toBe("default");
    expect(unauthJson.user.email).not.toBe("secret@example.com");

    // Unauthenticated PUT must fail 401
    expect(
      (
        await PUT(
          new Request("http://localhost:3000/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: "victim-01",
              email: "secret@example.com",
              role: "admin",
              fullName: "Attacker",
            }),
          }),
        )
      ).status,
    ).toBe(401);

    // Authenticated customer cannot spoof id/email or escalate role to admin
    currentAuthUser = CUSTOMER_ACTOR;
    const customerPut = await PUT(
      new Request("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "admin-01",
          email: "hattn.23itb@vku.udn.vn",
          role: "admin",
          fullName: "Thùy Dung Updated",
          avatarUrl: "https://example.com/a.jpg",
        }),
      }),
    );
    expect(customerPut.status).toBe(200);
    const putJson = (await customerPut.json()) as { user: { id: string; email: string; role: string } };
    expect(putJson.user.id).toBe(CUSTOMER_ACTOR.id);
    expect(putJson.user.email).toBe(CUSTOMER_ACTOR.email);
    expect(putJson.user.role).toBe("customer");
  });

  it("locks down GET /api/orders to authenticated actors and isolates customer orders", async () => {
    const { GET } = await import("../orders/route");

    expect((await GET(new Request("http://localhost:3000/api/orders"))).status).toBe(401);

    currentAuthUser = CUSTOMER_ACTOR;
    const custOrdersRes = await GET(new Request("http://localhost:3000/api/orders"));
    expect(custOrdersRes.status).toBe(200);
    const custOrdersJson = (await custOrdersRes.json()) as { orders: BackendOrder[] };
    expect(custOrdersJson.orders.map((o) => o.orderCode)).toEqual(["ORD-A-01"]);

    const otherOrderRes = await GET(new Request("http://localhost:3000/api/orders?code=ORD-B-01"));
    expect(otherOrderRes.status).toBe(403);

    currentAuthUser = ADMIN_ACTOR;
    const adminOrdersRes = await GET(new Request("http://localhost:3000/api/orders"));
    const adminOrdersJson = (await adminOrdersRes.json()) as { orders: BackendOrder[] };
    expect(adminOrdersJson.orders).toHaveLength(2);
  });

  it("returns clean empty response on guest GET /api/routine without needing SUPABASE_SERVICE_ROLE_KEY", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { GET } = await import("../routine/route");

    const res = await GET(new Request("http://localhost:3000/api/routine?timeOfDay=evening"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; isPrescribed: boolean; steps: unknown[] };
    expect(json.ok).toBe(true);
    expect(json.isPrescribed).toBe(false);
    expect(json.steps).toEqual([]);
  });
});
