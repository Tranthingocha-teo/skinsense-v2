import { expect, test } from "@playwright/test";
import { cleanupUsers, collectPageErrors, runTag, signIn, userPool, type TestUser } from "./roles";

// Seller Center (/seller/*): an approved shop walks every page and adds a product; everyone else
// is sent to the application page, and signed-out visitors to the landing page.

const users: TestUser[] = [];
const pool = userPool(users);
test.afterAll(async () => cleanupUsers(users));

const PAGES: Array<[string, string]> = [
  ["/seller/dashboard", "Bảng Điều Khiển"],
  ["/seller/products", "Quản Lý Sản Phẩm"],
  ["/seller/orders", "Quản Lý Đơn Hàng"],
  ["/seller/shop", "Hồ Sơ Cửa Hàng"],
  ["/seller/analytics", "Phân Tích"],
  ["/seller/wallet", "Ví"],
];

test("an approved shop opens every Seller Center page and adds a product", async ({ context, page }) => {
  const errors = collectPageErrors(page);
  const shop = await pool("shop");
  await signIn(context, shop);

  await page.goto("/seller");
  await expect(page).toHaveURL(/\/seller\/dashboard$/);
  for (const [path, heading] of PAGES) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1, name: new RegExp(heading) })).toBeVisible();
  }

  await page.goto("/seller/products");
  await page.getByRole("button", { name: "Thêm sản phẩm mới" }).click();
  const dialog = page.getByRole("dialog");
  const productName = `E2E Serum ${runTag()}`;
  await dialog.getByPlaceholder("Tên sản phẩm đầy đủ...").fill(productName);
  await dialog.getByPlaceholder("La Roche-Posay, Skin1004...").fill("E2E Brand");
  await dialog.getByRole("button", { name: "Lưu sản phẩm" }).click();
  await expect(page.getByText(productName).first()).toBeVisible();

  expect(errors).toEqual([]);
});

test("a customer is sent to the seller application instead of the Seller Center", async ({ context, page }) => {
  const customer = await pool("customer");
  await signIn(context, customer);
  await page.goto("/seller/dashboard");
  await expect(page).toHaveURL(/\/seller\/register$/);
  await expect(page.getByRole("heading", { name: /Đăng Ký Trở Thành Người Bán/ })).toBeVisible();
});

test("a signed-out visitor is sent to the landing page", async ({ page }) => {
  await page.goto("/seller/orders");
  await expect(page).toHaveURL(/\/$/);
});
