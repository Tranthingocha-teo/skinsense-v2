import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import path from "node:path";
import { cleanupUsers, collectPageErrors, runTag, signIn, userPool, type TestUser } from "./roles";

// Seller Center (/seller/*): an approved shop walks every page and adds a product; everyone else
// is sent to the application page, and signed-out visitors to the landing page.

const users: TestUser[] = [];
const pool = userPool(users);
// Images this file uploaded to Cloudinary, destroyed again afterwards (same signed API the app uses).
const uploaded: string[] = [];
test.afterAll(async () => {
  await cleanupUsers(users);
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  for (const publicId of uploaded) {
    if (!cloud || !key || !secret) break;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${secret}`).digest("hex");
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
      method: "POST",
      body: new URLSearchParams({ public_id: publicId, timestamp, api_key: key, signature }),
    }).catch(() => {});
  }
});

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

  // The product photo comes from the device (no URL field): upload a small local fixture.
  await expect(dialog.getByRole("textbox", { name: /https/ })).toHaveCount(0);
  const uploadDone = page.waitForResponse((r) => r.url().includes("/api/upload/cloudinary") && r.request().method() === "POST");
  await dialog.getByTestId("product-file-input").setInputFiles(path.join(__dirname, "fixtures/upload-square.png"));
  const upload = await (await uploadDone).json();
  expect(upload.ok, JSON.stringify(upload)).toBe(true);
  uploaded.push(upload.publicId);
  await expect(dialog.locator(`img[src="${upload.url}"]`)).toBeVisible();
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
