import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { admin } from "./auth";
import { STORES, cleanupUsers, collectPageErrors, readJsonStore, runTag, type TestUser } from "./roles";

// The landing page's doctor and shop applications (AuthModal -> /api/auth/register). Each run
// registers a brand-new @skinsense.test address with a throwaway password generated here and
// never printed; the account is deleted in afterAll with its registry entry. An application must
// leave the account pending: no specialist or shop rights until the super admin approves it.

const users: TestUser[] = [];
test.afterAll(async () => cleanupUsers(users));

async function trackUser(email: string, fullName: string, shopName?: string): Promise<TestUser> {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data.users.find((u) => u.email === email);
  expect(user, `account ${email} was created`).toBeTruthy();
  const tracked = { email, userId: user!.id, fullName, shopName };
  users.push(tracked);
  return tracked;
}

async function openForm(page: Page, trigger: string) {
  await page.goto("/");
  await page.getByRole("button", { name: trigger }).first().click();
}

test("a doctor applies from the landing page and stays pending", async ({ page }) => {
  const errors = collectPageErrors(page);
  const tag = runTag();
  const email = `e2e-doctor-${tag}@skinsense.test`;
  const name = `BS. E2E ${tag}`;

  await openForm(page, "Doctor registration");
  await page.getByPlaceholder("ThS. BS Trần Quốc Tuấn").fill(name);
  await page.getByPlaceholder("CCHN-008812/BYT").fill(`CCHN-E2E-${tag}`);
  await page.getByPlaceholder("Bệnh viện Da Liễu Trung Ương").fill("E2E Hospital");
  await page.getByPlaceholder("bacsi.tuan@gmail.com").fill(email);
  await page.getByPlaceholder("0918 222 333").fill("0900000003");
  await page.getByPlaceholder("••••••••").fill(`${randomUUID()}Aa1!`);
  await page.getByRole("button", { name: "Gửi yêu cầu duyệt Bác sĩ" }).click();
  await expect(page.getByText(/Hồ sơ Bác sĩ đã được gửi thành công/)).toBeVisible({ timeout: 20_000 });

  const tracked = await trackUser(email, name);
  const { data } = await admin.auth.admin.getUserById(tracked.userId);
  expect(data.user?.app_metadata).toMatchObject({ role: "specialist", status: "pending" });
  const entry = (await readJsonStore(STORES.specialists)).find((s) => s.email === email);
  expect(entry).toMatchObject({ status: "pending", name });

  // Submitting the same email again (signed out) is refused, not overwritten.
  await page.getByPlaceholder("••••••••").fill(`${randomUUID()}Aa1!`);
  await page.getByRole("button", { name: "Gửi yêu cầu duyệt Bác sĩ" }).click();
  await expect(page.getByText(/Email đã được đăng ký/)).toBeVisible({ timeout: 20_000 });

  expect(errors).toEqual([]);
});

test("a shop applies from the landing page and stays pending", async ({ page }) => {
  const errors = collectPageErrors(page);
  const tag = runTag();
  const email = `e2e-store-${tag}@skinsense.test`;
  const shopName = `E2E Shop ${tag}`;
  const owner = `E2E Owner ${tag}`;

  await openForm(page, "Store registration");
  await page.getByPlaceholder("La Roche-Posay Official Store / Innisfree Beauty Hub").fill(shopName);
  await page.getByPlaceholder("Nguyễn Thị Mai").fill(owner);
  await page.getByPlaceholder("GPKD-882910-HCM hoặc MST").fill(`GPKD-E2E-${tag}`);
  await page.getByPlaceholder("Số 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh").fill("3 E2E Street");
  await page.getByPlaceholder("shop.laroche@skinsense.vn").fill(email);
  await page.getByPlaceholder("028 3822 5588").fill("0900000004");
  await page.getByPlaceholder("••••••••").fill(`${randomUUID()}Aa1!`);
  await page.getByRole("button", { name: "Gửi yêu cầu mở gian hàng" }).click();
  await expect(page.getByText(/Hồ sơ mở Gian hàng đã được gửi thành công/)).toBeVisible({ timeout: 20_000 });

  const tracked = await trackUser(email, owner, shopName);
  const { data } = await admin.auth.admin.getUserById(tracked.userId);
  // Pending, and its tenancy is fixed in app_metadata (not the user-editable shop name).
  expect(data.user?.app_metadata).toMatchObject({ role: "shop", status: "pending", shop_id: `e2e_shop_${tag}` });
  const entry = (await readJsonStore(STORES.shops)).find((s) => s.email === email);
  expect(entry).toMatchObject({ status: "pending", shopName });

  expect(errors).toEqual([]);
});

test("registration refuses the admin role and the super admin email", async ({ request }) => {
  const asAdmin = await request.post("/api/auth/register", {
    data: { email: `e2e-admin-${runTag()}@skinsense.test`, password: `${randomUUID()}Aa1!`, role: "admin" },
  });
  expect(asAdmin.status()).toBe(400);
  const superAdmin = await request.post("/api/auth/register", {
    data: { email: "hattn.23itb@vku.udn.vn", password: `${randomUUID()}Aa1!`, role: "customer" },
  });
  expect(superAdmin.status()).toBe(409);
});
