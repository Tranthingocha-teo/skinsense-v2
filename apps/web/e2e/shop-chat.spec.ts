import { expect, test } from "@playwright/test";
import { cleanupUsers, collectPageErrors, runTag, signIn, userPool, type TestUser } from "./roles";

// Customer <-> shop chat (components/role-profile-view.tsx + /api/chat): the customer writes to the
// shop of one of their orders, the shop owner sees the thread in its own inbox and replies, and the
// reply reaches the customer without a reload. A second shop must not see the conversation.

const users: TestUser[] = [];
const pool = userPool(users);
const orderCodes: string[] = [];
test.afterAll(async () => cleanupUsers(users, { orderCodes }));

test("a customer chats with the shop of an order and the shop replies", async ({ browser }) => {
  test.setTimeout(180_000);
  const tag = runTag();
  const shop = await pool("shop");
  const otherShop = await pool("shop", "other-shop");
  const customer = await pool("customer");

  const customerContext = await browser.newContext();
  const shopContext = await browser.newContext();
  const otherShopContext = await browser.newContext();
  try {
    await signIn(customerContext, customer);
    await signIn(shopContext, shop);
    await signIn(otherShopContext, otherShop);
    const customerPage = await customerContext.newPage();
    const shopPage = await shopContext.newPage();
    const customerErrors = collectPageErrors(customerPage);
    const shopErrors = collectPageErrors(shopPage);

    // Setup: an order from this shop, placed by the customer through the API the checkout uses.
    const orderCode = `SS-E2E${tag}`;
    orderCodes.push(orderCode);
    const created = await customerPage.request.post("/api/orders", {
      data: {
        orderCode,
        customerName: customer.fullName,
        customerPhone: "0900000002",
        shippingAddress: "2 E2E Street",
        totalAmount: 120000,
        paymentMethod: "cod",
        shopName: shop.shopName,
        brand: "E2E",
        items: [{ id: "e2e", name: "E2E Cleanser", price: 120000, quantity: 1, variant: "50ml" }],
      },
    });
    expect(created.status()).toBe(200);

    // Customer: My orders -> the order -> Chat Shop -> send.
    await customerPage.goto("/user/profile");
    await customerPage.getByRole("button", { name: /Đơn Mua Của Tôi/ }).click();
    const card = customerPage.locator("div", { hasText: orderCode }).filter({ has: customerPage.getByRole("button", { name: "Chat Shop" }) }).last();
    await card.getByRole("button", { name: "Chat Shop" }).click();
    const question = `E2E question ${tag}`;
    await customerPage.getByPlaceholder(`Nhắn tin cho ${shop.shopName}...`).fill(question);
    await customerPage.getByRole("button", { name: "Gửi tin nhắn" }).click();
    await expect(customerPage.getByText(question).last()).toBeVisible();
    // The shop's automatic acknowledgement.
    await expect(customerPage.getByText(/đã nhận được tin nhắn/).last()).toBeVisible({ timeout: 15_000 });

    // Shop: its inbox has the thread; reply.
    await shopPage.goto("/shop/profile");
    await shopPage.getByRole("button", { name: /Tin Nhắn Khách Hàng/ }).click();
    await expect(shopPage.getByText(question).last()).toBeVisible({ timeout: 20_000 });
    const answer = `E2E answer ${tag}`;
    await shopPage.getByPlaceholder(`Nhập tin nhắn phản hồi cho ${customer.fullName}...`).fill(answer);
    await shopPage.getByRole("button", { name: "Gửi Cho Khách" }).click();
    await expect(shopPage.getByText(answer).last()).toBeVisible();

    // Customer: the reply arrives in the open chat without a reload.
    await expect(customerPage.getByText(answer).last()).toBeVisible({ timeout: 30_000 });

    // The shop's order list has the order; another shop's does not.
    await shopPage.getByRole("button", { name: /Quản Lý Đơn Hàng Shop Mall/ }).click();
    await expect(shopPage.getByText(orderCode).first()).toBeVisible({ timeout: 20_000 });
    const otherOrders = await otherShopContext.request.get("/api/user/orders");
    expect(JSON.stringify(await otherOrders.json())).not.toContain(orderCode);

    // Another shop's inbox does not contain this conversation.
    const otherInbox = await otherShopContext.request.get("/api/chat?forShop=true");
    expect(otherInbox.status()).toBe(200);
    expect(JSON.stringify(await otherInbox.json())).not.toContain(question);

    expect(customerErrors).toEqual([]);
    expect(shopErrors).toEqual([]);
  } finally {
    await customerContext.close();
    await shopContext.close();
    await otherShopContext.close();
  }
});

test("a customer cannot post as a shop, and chat needs a session", async ({ browser, request }) => {
  expect((await request.get("/api/chat?shopId=skinsense_mall")).status()).toBe(401);
  expect((await request.post("/api/chat", { data: { text: "hi" } })).status()).toBe(401);

  const customer = await pool("customer");
  const context = await browser.newContext();
  try {
    await signIn(context, customer);
    const asShop = await context.request.post("/api/chat", {
      data: { sender: "shop", shopId: "skinsense_mall", userId: customer.userId, text: "spoof" },
    });
    expect(asShop.status()).toBe(403);
    expect((await context.request.get("/api/chat?forShop=true")).status()).toBe(403);
  } finally {
    await context.close();
  }
});
