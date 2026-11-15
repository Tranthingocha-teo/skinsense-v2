import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BackendOrder } from "@/lib/orders-store";

interface MockSessionUser {
  id: string;
  email: string;
  phone?: string;
  user_metadata?: Record<string, unknown>;
}

let currentUser: MockSessionUser | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: currentUser },
        error: null,
      })),
    },
  })),
}));

describe("/api/user/orders POST security and workflow validation", () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    currentUser = null;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skinsense-orders-test-"));
    dbPath = path.join(tmpDir, "orders-db.json");
    process.env.SKINSENSE_ORDERS_DB_PATH = dbPath;

    const now = new Date().toISOString();
    const seedOrders: BackendOrder[] = [
      {
        id: "ORD-UNPAID",
        orderCode: "ORD-UNPAID-01",
        customerName: "Thùy Dung",
        customerPhone: "0987654321",
        shippingAddress: "Q1 HCM",
        totalAmount: 330000,
        status: "pending",
        paymentMethod: "momo",
        paymentStatus: "unpaid",
        shopName: "La Roche-Posay Flagship Store",
        brand: "La Roche-Posay",
        carrier: "SPX Express",
        items: [],
        createdAt: now,
      },
      {
        id: "ORD-DELIVERING",
        orderCode: "ORD-DELIV-02",
        customerName: "Thùy Dung",
        customerPhone: "0987654321",
        shippingAddress: "Q1 HCM",
        totalAmount: 485000,
        status: "delivering",
        paymentMethod: "momo",
        paymentStatus: "paid",
        shopName: "Bioderma Official Store",
        brand: "Bioderma",
        carrier: "SPX Express",
        items: [],
        paidAt: now,
        createdAt: now,
      },
      {
        id: "ORD-COD-DELIVERING",
        orderCode: "ORD-COD-03",
        customerName: "Thùy Dung",
        customerPhone: "0987654321",
        shippingAddress: "Q1 HCM",
        totalAmount: 250000,
        status: "delivering",
        paymentMethod: "cod",
        paymentStatus: "unpaid",
        shopName: "Bioderma Official Store",
        brand: "Bioderma",
        carrier: "SPX Express",
        items: [],
        createdAt: now,
      },
    ];
    fs.writeFileSync(dbPath, JSON.stringify(seedOrders, null, 2), "utf-8");
  });

  afterEach(() => {
    delete process.env.SKINSENSE_ORDERS_DB_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it("rejects unauthenticated mutations with 401", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          orderCode: "ORD-UNPAID-01",
          status: "delivered",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("blocks pending unpaid MoMo order from bypassing payment to delivered", async () => {
    currentUser = {
      id: "cust_dung",
      email: "dung@example.com",
      user_metadata: { role: "customer", full_name: "Thùy Dung" },
    };
    const { POST } = await import("./route");

    const bypassRes = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          orderCode: "ORD-UNPAID-01",
          status: "delivered",
        }),
      }),
    );
    expect(bypassRes.status).toBe(409);

    const persisted = JSON.parse(fs.readFileSync(dbPath, "utf-8")) as BackendOrder[];
    const target = persisted.find((o) => o.orderCode === "ORD-UNPAID-01");
    expect(target?.status).toBe("pending");
    expect(target?.paymentStatus).toBe("unpaid");
  });

  it("rejects invalid status enum values with 400 and blocks other users (403)", async () => {
    currentUser = {
      id: "cust_dung",
      email: "dung@example.com",
      user_metadata: { role: "customer", full_name: "Thùy Dung" },
    };
    const { POST } = await import("./route");

    const invalidStatusRes = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          orderCode: "ORD-DELIV-02",
          status: "invalid_fake_status",
        }),
      }),
    );
    expect(invalidStatusRes.status).toBe(400);

    // Another customer cannot mutate Thùy Dung's order
    currentUser = {
      id: "cust_attacker",
      email: "attacker@example.com",
      user_metadata: { role: "customer", full_name: "Attacker" },
    };
    const crossUserRes = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          orderCode: "ORD-UNPAID-01",
          status: "cancelled",
        }),
      }),
    );
    expect(crossUserRes.status).toBe(403);
  });

  it("allows customer receipt confirmation from delivering -> delivered and review submission", async () => {
    currentUser = {
      id: "cust_dung",
      email: "dung@example.com",
      user_metadata: { role: "customer", full_name: "Thùy Dung" },
    };
    const { POST } = await import("./route");

    // Cannot review before delivered
    const earlyReview = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_review",
          orderCode: "ORD-DELIV-02",
          review: { rating: 5, comment: "Nice" },
        }),
      }),
    );
    expect(earlyReview.status).toBe(409);

    // Confirm delivering -> delivered
    const deliverRes = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          orderCode: "ORD-DELIV-02",
          status: "delivered",
        }),
      }),
    );
    expect(deliverRes.status).toBe(200);

    // Invalid star rating (> 5) returns 400
    const badRatingRes = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_review",
          orderCode: "ORD-DELIV-02",
          review: { rating: 9, comment: "Too high" },
        }),
      }),
    );
    expect(badRatingRes.status).toBe(400);

    // Valid review persists
    const validReviewRes = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_review",
          orderCode: "ORD-DELIV-02",
          review: { rating: 5, comment: "Giao nhanh và chính hãng", tags: ["Chính hãng"] },
        }),
      }),
    );
    expect(validReviewRes.status).toBe(200);
    const reviewJson = await validReviewRes.json();
    expect(reviewJson.order.review.rating).toBe(5);
    expect(reviewJson.order.review.comment).toBe("Giao nhanh và chính hãng");
  });

  it("settles COD payment to paid upon delivery and prevents cross-shop access", async () => {
    currentUser = {
      id: "cust_dung",
      email: "dung@example.com",
      user_metadata: { role: "customer", full_name: "Thùy Dung" },
    };
    const { POST } = await import("./route");

    const codRes = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          orderCode: "ORD-COD-03",
          status: "delivered",
        }),
      }),
    );
    expect(codRes.status).toBe(200);
    const codJson = await codRes.json();
    expect(codJson.order.paymentStatus).toBe("paid");
    expect(codJson.order.paidAt).toBeTruthy();

    // La Roche-Posay shop cannot modify Bioderma shop order
    currentUser = {
      id: "shop_lrp",
      email: "lrp@shop.vn",
      user_metadata: { role: "shop", shop_name: "La Roche-Posay Flagship Store" },
    };
    const crossShop = await POST(
      new Request("http://localhost:3000/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          orderCode: "ORD-DELIV-02",
          status: "delivered",
        }),
      }),
    );
    expect(crossShop.status).toBe(403);
  });
});
