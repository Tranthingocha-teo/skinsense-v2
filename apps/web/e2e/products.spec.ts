import { expect, test } from "@playwright/test";
import { cleanupUsers, collectPageErrors, signIn, userPool, type TestUser } from "./roles";

// The buyer storefront (/products): approved products only, a detail view, and "Mua Ngay" hands
// the chosen product, variant and quantity to /shop/checkout, where the recipient is the signed-in
// buyer. Adding products belongs to the Seller Center, never to this page. Vietnamese-only.

const users: TestUser[] = [];
const pool = userPool(users);
test.afterAll(async () => cleanupUsers(users));

test("a visitor browses the storefront without seller tools or a sample persona", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/products");

  await expect(page.getByRole("heading", { name: /Danh Sách Sản Phẩm/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mua Ngay", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Thêm Sản Phẩm/ })).toHaveCount(0);
  for (const sample of ["Thùy Dung", "Trần Thị Ngọc Hà"]) {
    await expect(page.getByText(sample)).toHaveCount(0);
  }

  // Brand filter narrows the list; clearing it brings everything back.
  const all = page.getByRole("button", { name: "Chi Tiết", exact: true });
  const total = await all.count();
  expect(total).toBeGreaterThan(1);
  await page.getByRole("button", { name: "La Roche-Posay", exact: true }).click();
  const filtered = await all.count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(total);
  await page.getByRole("button", { name: "Tất cả", exact: true }).click();
  await expect(all).toHaveCount(total);

  // Detail view and back.
  await all.first().click();
  await expect(page.getByText("Chi Tiết Thông Số Kỹ Thuật Sản Phẩm")).toBeVisible();
  await page.getByRole("button", { name: "Quay lại Danh Sách Sản Phẩm" }).click();
  await expect(page.getByRole("heading", { name: /Danh Sách Sản Phẩm/ })).toBeVisible();

  expect(errors).toEqual([]);
});

test("a buyer picks a quantity on the detail view and checks out as themselves", async ({ context, page }) => {
  const errors = collectPageErrors(page);
  const buyer = await pool("customer");
  await signIn(context, buyer);

  await page.goto("/products");
  await page.getByRole("button", { name: "Chi Tiết", exact: true }).first().click();
  await page.getByRole("button", { name: "Tăng số lượng" }).click();
  await page.getByRole("main").getByRole("button", { name: "Mua Ngay", exact: true }).click();

  await expect(page).toHaveURL(/\/shop\/checkout\?productId=[^&]+&variant=0&quantity=2$/);
  await expect(page.getByText(buyer.fullName).first()).toBeVisible();
  await expect(page.getByText("Trần Thị Ngọc Hà")).toHaveCount(0);

  // Opening a product straight from a link shows its detail view.
  const productId = new URL(page.url()).searchParams.get("productId")!;
  await page.goto(`/products?productId=${encodeURIComponent(productId)}`);
  await expect(page.getByText("Chi Tiết Thông Số Kỹ Thuật Sản Phẩm")).toBeVisible();

  expect(errors).toEqual([]);
});
