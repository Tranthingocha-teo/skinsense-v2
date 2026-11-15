import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface MockSessionUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
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

describe("/api/chat security, isolation, and messaging", () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    currentUser = null;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skinsense-chat-test-"));
    dbPath = path.join(tmpDir, "chat-db.json");
    process.env.SKINSENSE_CHAT_DB_PATH = dbPath;
  });

  afterEach(() => {
    delete process.env.SKINSENSE_CHAT_DB_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it("rejects unauthenticated GET and POST requests with 401", async () => {
    const { GET, POST } = await import("./route");

    const getRes = await GET(new Request("http://localhost:3000/api/chat?forShop=true"));
    expect(getRes.status).toBe(401);

    const customerGetRes = await GET(new Request("http://localhost:3000/api/chat?shopId=larocheposay"));
    expect(customerGetRes.status).toBe(401);

    const postRes = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: "larocheposay", sender: "shop", userId: "cust_1", text: "Hello" }),
      }),
    );
    expect(postRes.status).toBe(401);
  });

  it("forbids customers from reading shop inbox or impersonating shop messages", async () => {
    currentUser = {
      id: "cust_alice",
      email: "alice@example.com",
      user_metadata: { role: "customer", full_name: "Alice" },
    };

    const { GET, POST } = await import("./route");

    const inboxRes = await GET(new Request("http://localhost:3000/api/chat?forShop=true"));
    expect(inboxRes.status).toBe(403);

    const spoofShopRes = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: "larocheposay",
          userId: "cust_bob",
          sender: "shop",
          text: "Fake promo link",
        }),
      }),
    );
    expect(spoofShopRes.status).toBe(403);
  });

  it("isolates third-party shop threads without collapsing into skinsense_mall", async () => {
    currentUser = {
      id: "cust_minh",
      email: "minh@example.com",
      user_metadata: { role: "customer", full_name: "Minh Nguyen" },
    };

    const { POST } = await import("./route");

    const resA = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: "Hana Clinic Store",
          userId: "spoofed_other_user",
          sender: "user",
          text: "Hỏi sản phẩm ở Hana",
        }),
      }),
    );
    const jsonA = await resA.json();
    expect(resA.status).toBe(200);
    expect(jsonA.thread.shopId).toBe("hana_clinic_store");
    expect(jsonA.thread.userId).toBe("cust_minh");
    expect(jsonA.thread.userName).toBe("Minh Nguyen");

    const resB = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: "Klinik Glow Store",
          sender: "user",
          text: "Hỏi sản phẩm ở Klinik",
        }),
      }),
    );
    const jsonB = await resB.json();
    expect(resB.status).toBe(200);
    expect(jsonB.thread.shopId).toBe("klinik_glow_store");
    expect(jsonA.thread.id).not.toBe(jsonB.thread.id);
  });

  it("scopes shop inbox GET and POST strictly to authenticated shop owner", async () => {
    currentUser = {
      id: "shop_hana",
      email: "hana@shop.vn",
      app_metadata: { role: "shop", status: "active" },
      user_metadata: { role: "shop", shop_name: "Hana Clinic Store" },
    };

    const { GET, POST } = await import("./route");

    // Seed message for Hana Clinic Store first by switching temporarily to customer
    currentUser = {
      id: "cust_minh",
      email: "minh@example.com",
      user_metadata: { role: "customer", full_name: "Minh Nguyen" },
    };
    await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: "Hana Clinic Store",
          sender: "user",
          text: "Shop tư vấn serum B5 ạ",
        }),
      }),
    );

    // Switch back to Hana Shop owner
    currentUser = {
      id: "shop_hana",
      email: "hana@shop.vn",
      app_metadata: { role: "shop", status: "active" },
      user_metadata: { role: "shop", shop_name: "Hana Clinic Store" },
    };

    const threadsRes = await GET(
      new Request("http://localhost:3000/api/chat?forShop=true&shopId=bioderma"),
    );
    expect(threadsRes.status).toBe(200);
    const threadsJson = await threadsRes.json();
    expect(threadsJson.threads.length).toBe(1);
    expect(threadsJson.threads[0].shopId).toBe("hana_clinic_store");

    // Shop Hana cannot reply to Bioderma
    const crossShopReply = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: "bioderma",
          userId: "cust_minh",
          sender: "shop",
          text: "Trả lời thay Bioderma",
        }),
      }),
    );
    expect(crossShopReply.status).toBe(403);

    // Valid reply to own shop succeeds
    const validReply = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: "hana_clinic_store",
          userId: "cust_minh",
          sender: "shop",
          text: "Dạ shop gửi hướng dẫn sử dụng chi tiết cho bạn ạ.",
        }),
      }),
    );
    expect(validReply.status).toBe(200);
    const replyJson = await validReply.json();
    expect(replyJson.thread.messages.some((m: { text: string }) => m.text.includes("hướng dẫn sử dụng"))).toBe(true);
  });

  it("validates empty and oversized messages", async () => {
    currentUser = {
      id: "cust_alice",
      email: "alice@example.com",
      user_metadata: { role: "customer", full_name: "Alice" },
    };
    const { POST } = await import("./route");

    const emptyRes = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: "bioderma", text: "   " }),
      }),
    );
    expect(emptyRes.status).toBe(400);

    const longRes = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: "bioderma", text: "a".repeat(2005) }),
      }),
    );
    expect(longRes.status).toBe(400);
  });
});
