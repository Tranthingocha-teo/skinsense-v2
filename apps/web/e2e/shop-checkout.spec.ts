import { expect, test } from "@playwright/test";
import {
  STORES,
  cleanupUsers,
  collectPageErrors,
  createRoleUser,
  readJsonStore,
  runTag,
  signIn,
  type TestUser,
} from "./roles";

// A buyer walks the storefront: product -> checkout -> MoMo QR -> pays on a "phone" (a second,
// signed-out browser context opening the pay-demo link) -> the QR closes by itself -> the order
// shows up as paid in the buyer's own order list. The shop portals are Vietnamese-only.

const users: TestUser[] = [];
const orderCodes: string[] = [];
test.afterAll(async () => cleanupUsers(users, { orderCodes }));

test("a buyer checks out with MoMo, pays from the phone link, and sees the paid order", async ({ browser, context, page }) => {
  const errors = collectPageErrors(page);
  const buyer = await createRoleUser("customer", { tag: runTag() });
  users.push(buyer);
  await signIn(context, buyer);

  await page.goto("/shop");
  await page.getByRole("button", { name: "Mua Hàng", exact: true }).click();
  await page.getByRole("button", { name: "Mua Ngay", exact: true }).first().click();
  await expect(page).toHaveURL(/\/shop\/checkout\?productId=/);

  // The recipient is the signed-in buyer, not a fixed sample person.
  await expect(page.getByText(buyer.fullName).first()).toBeVisible();
  await expect(page.getByText("Trần Thị Ngọc Hà")).toHaveCount(0);

  // No phone or address on file yet: placing the order asks for them first.
  await page.getByRole("button", { name: /Thanh toán mô phỏng \(\d/ }).click();
  await expect(page.getByText("Cập Nhật Địa Chỉ Nhận Hàng")).toBeVisible();
  await page.locator('label:text-is("Số điện thoại") + input').fill("0900 000 001");
  await page.locator('label:text-is("Địa chỉ giao hàng chi tiết") + textarea').fill("1 E2E Street, Da Nang");
  await page.getByRole("button", { name: "Lưu Địa Chỉ" }).click();

  await page.getByRole("button", { name: /Thanh toán mô phỏng \(\d/ }).click();
  await expect(page.getByText("Quét mã QR thanh toán (demo)")).toBeVisible();
  const codeText = await page.getByText(/^SS-\d{6}$/).first().textContent();
  const orderCode = codeText!.trim();
  orderCodes.push(orderCode);

  // The order is saved before the QR opens, bound to this buyer.
  await expect
    .poll(async () => (await readJsonStore(STORES.orders)).find((o) => o.orderCode === orderCode)?.customerId, { timeout: 15_000 })
    .toBe(buyer.userId);

  // The phone: signed out, opens the pay-demo link from the QR and confirms.
  const phone = await browser.newContext();
  try {
    const phonePage = await phone.newPage();
    const phoneErrors = collectPageErrors(phonePage);
    await phonePage.goto(`/pay-demo?orderCode=${encodeURIComponent(orderCode)}`);
    await expect(phonePage.getByText(orderCode)).toBeVisible();
    await phonePage.getByRole("button", { name: /XÁC NHẬN THANH TOÁN/ }).click();
    await expect(phonePage.getByText("THANH TOÁN THÀNH CÔNG!")).toBeVisible({ timeout: 20_000 });
    expect(phoneErrors).toEqual([]);
  } finally {
    await phone.close();
  }

  // The desktop QR closes by itself and the success screen opens.
  await expect(page.getByText("Đặt Hàng Thành Công!")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Quét mã QR thanh toán (demo)")).toHaveCount(0);

  // The buyer's own order list has it, paid and being prepared.
  await page.goto("/user/profile");
  await expect(page.getByText(buyer.fullName).first()).toBeVisible();
  await page.getByRole("button", { name: /Đơn Mua Của Tôi/ }).click();
  await expect(page.getByText(orderCode).first()).toBeVisible({ timeout: 20_000 });

  expect(errors).toEqual([]);
});

test("paying an unknown order code is refused instead of creating a paid order", async ({ request }) => {
  const code = `SS-E2E${runTag()}`;
  const res = await request.get(`/api/orders/${code}/pay`);
  expect(res.status()).toBe(404);
  const fallback = await request.get(`/api/orders/pay`);
  expect(fallback.status()).toBe(400);
  expect((await readJsonStore(STORES.orders)).some((o) => o.orderCode === code)).toBe(false);
});

test("a signed-out visitor cannot place an order", async ({ request }) => {
  const res = await request.post("/api/orders", { data: { orderCode: `SS-E2E${runTag()}`, totalAmount: 1000 } });
  expect(res.status()).toBe(401);
});

test("the pay-demo page without an order code pays nothing", async ({ page }) => {
  await page.goto("/pay-demo");
  // No order to pay: the button is disabled and the page says where the link comes from.
  await expect(page.getByRole("button", { name: /XÁC NHẬN THANH TOÁN/ })).toBeDisabled();
  await expect(page.getByText(/Trang này mở từ mã QR/)).toBeVisible();
  await expect(page.getByText("THANH TOÁN THÀNH CÔNG!")).toHaveCount(0);
});
