import { expect, test } from "@playwright/test";
import { cleanupUsers, collectPageErrors, runTag, signIn, userPool, type TestUser } from "./roles";

// Each role's profile page shows that account's own data (never a sample persona), a customer can
// edit and keep theirs, and the admin API refuses everyone who is not the super admin.

const users: TestUser[] = [];
const pool = userPool(users);
test.afterAll(async () => cleanupUsers(users));

test("a customer sees and edits their own profile", async ({ context, page }) => {
  const errors = collectPageErrors(page);
  const customer = await pool("customer");
  await signIn(context, customer);

  await page.goto("/user/profile");
  await expect(page.getByText(customer.email).first()).toBeVisible();
  await expect(page.getByText(customer.fullName).first()).toBeVisible();
  for (const sample of ["Thùy Dung", "khachhang@gmail.com", "Số 123 Đường Nguyễn Huệ"]) {
    await expect(page.getByText(sample)).toHaveCount(0);
  }

  await page.getByRole("button", { name: "Chỉnh Sửa Hồ Sơ" }).click();
  const address = `4 E2E Street ${runTag()}`;
  await page.getByPlaceholder("Số nhà, đường, phường, quận...").fill(address);
  await page.getByPlaceholder("Dị ứng cồn khô, hương liệu...").fill("E2E allergy");
  await page.getByRole("button", { name: "Lưu Thay Đổi" }).click();
  await expect(page.getByText(/Đã cập nhật hồ sơ thành công/)).toBeVisible();

  await page.reload();
  await expect(page.getByText(address).first()).toBeVisible();
  await expect(page.getByText("E2E allergy").first()).toBeVisible();

  // /profile picks the page for the account's role.
  await page.goto("/profile");
  await expect(page.getByText(customer.email).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("a shop and a specialist see their own profile", async ({ browser }) => {
  const shop = await pool("shop");
  const doctor = await pool("specialist");

  for (const [user, path, sample] of [
    [shop, "/shop/profile", "shop.laroche@skinsense.vn"],
    [doctor, "/specialist/profile", "maihoa.dermatology@skinsense.vn"],
  ] as const) {
    const context = await browser.newContext();
    try {
      await signIn(context, user);
      const page = await context.newPage();
      const errors = collectPageErrors(page);
      await page.goto(path);
      await expect(page.getByText(user.email).first()).toBeVisible();
      await expect(page.getByText(user.shopName ?? user.fullName).first()).toBeVisible();
      await expect(page.getByText(sample)).toHaveCount(0);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("the admin API and console refuse visitors and non-admin roles", async ({ browser, request }) => {
  const endpoints = ["/api/admin/users", "/api/admin/orders", "/api/admin/specialists"];
  for (const path of endpoints) {
    expect((await request.get(path)).status(), `${path} signed out`).toBe(401);
  }

  for (const role of ["customer", "shop", "specialist"] as const) {
    const user = await pool(role);
    const context = await browser.newContext();
    try {
      await signIn(context, user);
      for (const path of endpoints) {
        expect((await context.request.get(path)).status(), `${path} as ${role}`).toBe(403);
      }
      const patch = await context.request.patch("/api/admin/users", { data: { userId: user.userId, role: "shop", status: "active" } });
      expect(patch.status(), `PATCH /api/admin/users as ${role}`).toBe(403);
      const page = await context.newPage();
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/$/);
    } finally {
      await context.close();
    }
  }
});
