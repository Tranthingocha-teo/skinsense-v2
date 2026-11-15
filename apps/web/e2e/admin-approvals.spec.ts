import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { admin } from "./auth";
import { STORES, cleanupUsers, collectPageErrors, readJsonStore, runTag, signIn, userPool, type TestUser } from "./roles";

// The admin console's approval flows, driven in the browser by a throwaway @skinsense.test admin
// (app_metadata role "admin", minted with the service role: the app never grants it). Every
// decision is checked where it matters: the console after a reload, the account's app_metadata
// (the authority for rights), the registry the console reads, and what the applicant can now do.

const users: TestUser[] = [];
const orderCodes: string[] = [];
const pool = userPool(users);
test.afterAll(async () => cleanupUsers(users, { orderCodes }));

async function trackUser(email: string, fullName: string, shopName?: string): Promise<TestUser> {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data.users.find((u) => u.email === email);
  expect(user, `account ${email} was created`).toBeTruthy();
  const tracked = { email, userId: user!.id, fullName, shopName };
  users.push(tracked);
  return tracked;
}

async function appMeta(user: TestUser) {
  const { data } = await admin.auth.admin.getUserById(user.userId);
  return data.user?.app_metadata;
}

/** An application posted the way the landing modal posts it, from a signed-out context. */
async function applyByApi(request: APIRequestContext, role: "shop" | "specialist", tag: string): Promise<TestUser> {
  const email = `e2e-apply-${role}-${tag}@skinsense.test`;
  const fullName = `E2E Applicant ${tag}`;
  const shopName = role === "shop" ? `E2E Shop ${tag}` : undefined;
  const res = await request.post("/api/auth/register", {
    data: {
      email,
      password: `${randomUUID()}Aa1!`,
      role,
      ...(role === "shop"
        ? { shopName, ownerName: fullName, license: `GPKD-${tag}`, address: "1 E2E Street" }
        : { doctorName: fullName, licenseId: `CCHN-${tag}`, hospital: "E2E Hospital" }),
    },
  });
  expect(res.ok(), await res.text()).toBe(true);
  return trackUser(email, fullName, shopName);
}

async function withContext<T>(browser: Browser, user: TestUser | null, fn: (context: BrowserContext, page: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext();
  try {
    if (user) await signIn(context, user);
    const page = await context.newPage();
    return await fn(context, page);
  } finally {
    await context.close();
  }
}

/** The admin console, filtered to one account; returns that account's row in the users table. */
async function openUserRow(page: Page, email: string) {
  await page.goto("/admin");
  await page.getByPlaceholder("Tìm tên, email, SĐT, cửa hàng...").fill(email);
  const row = page.getByRole("row").filter({ hasText: email });
  await expect(row).toHaveCount(1, { timeout: 20_000 });
  return row;
}

async function productPost(request: APIRequestContext, name: string) {
  return request.post("/api/admin/products", { data: { name, price: 210000, brand: "E2E Brand" } });
}

async function marketplaceHas(request: APIRequestContext, productId: string): Promise<boolean> {
  const json = (await (await request.get("/api/admin/products")).json()) as { products: Array<{ id: string }> };
  return json.products.some((p) => p.id === productId);
}


test("a shop applies on the landing page, waits, is approved by the admin and can then sell", async ({ browser, page }) => {
  test.setTimeout(180_000);
  const errors = collectPageErrors(page);
  const tag = runTag();
  const email = `e2e-store-${tag}@skinsense.test`;
  const shopName = `E2E Shop ${tag}`;
  const owner = `E2E Owner ${tag}`;

  // 1. The application, from the landing page's "Gian hàng" modal.
  await page.goto("/");
  await page.getByRole("button", { name: "🏪 Store registration" }).first().click();
  await page.getByPlaceholder("La Roche-Posay Official Store / Innisfree Beauty Hub").fill(shopName);
  await page.getByPlaceholder("Nguyễn Thị Mai").fill(owner);
  await page.getByPlaceholder("GPKD-882910-HCM hoặc MST").fill(`GPKD-E2E-${tag}`);
  await page.getByPlaceholder("Số 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh").fill("3 E2E Street");
  await page.getByPlaceholder("shop.laroche@skinsense.vn").fill(email);
  await page.getByPlaceholder("028 3822 5588").fill("0900000004");
  await page.getByPlaceholder("••••••••").fill(`${randomUUID()}Aa1!`);
  await page.getByRole("button", { name: "Gửi yêu cầu mở Gian hàng Shopee" }).click();
  await expect(page.getByText(/Hồ sơ mở Gian hàng đã được gửi thành công/)).toBeVisible({ timeout: 20_000 });
  const shop = await trackUser(email, owner, shopName);
  expect((await readJsonStore(STORES.shops)).find((s) => s.email === email)).toMatchObject({ status: "pending", shopName });

  // 2. Pending: no Seller Center, no product submissions.
  const applicant = await browser.newContext();
  try {
    await signIn(applicant, shop);
    const applicantPage = await applicant.newPage();
    await applicantPage.goto("/seller/dashboard");
    await expect(applicantPage).toHaveURL(/\/seller\/register$/);
    expect((await productPost(applicant.request, `E2E pending ${tag}`)).status()).toBe(403);

    // 3. The admin sees the application and approves it.
    const adminUser = await pool("admin");
    await withContext(browser, adminUser, async (_ctx, adminPage) => {
      const adminErrors = collectPageErrors(adminPage);
      let row = await openUserRow(adminPage, email);
      await expect(row.getByText("Chờ duyệt")).toBeVisible();
      await expect(row.getByText(shopName)).toBeVisible();
      await row.getByRole("button", { name: "Duyệt", exact: true }).click();
      await expect(adminPage.getByText(`Đã phê duyệt Cửa hàng: "${owner}"`)).toBeVisible({ timeout: 20_000 });
      await expect(row.getByText("Đang hoạt động")).toBeVisible();

      // It stays approved after a reload.
      row = await openUserRow(adminPage, email);
      await expect(row.getByText("Đang hoạt động")).toBeVisible();
      expect(adminErrors).toEqual([]);
    });

    // 4. Rights, tenancy and the registry agree.
    expect(await appMeta(shop)).toMatchObject({ role: "shop", status: "active", shop_id: `e2e_shop_${tag}` });
    expect((await readJsonStore(STORES.shops)).find((s) => s.email === email)).toMatchObject({ status: "active" });

    // 5. The same session (its JWT still says "pending") now opens the Seller Center and lists a product.
    await applicantPage.goto("/seller/dashboard");
    await expect(applicantPage).toHaveURL(/\/seller\/dashboard$/);
    await expect(applicantPage.getByRole("heading", { level: 1, name: /Bảng Điều Khiển/ })).toBeVisible();
    const created = await productPost(applicant.request, `E2E Serum ${tag}`);
    expect(created.status()).toBe(200);
    const { product } = (await created.json()) as { product: { id: string; status: string; shopName: string } };
    expect(product).toMatchObject({ status: "pending", shopName });
    const me = (await (await applicant.request.get("/api/auth/me")).json()) as { user: { role: string; status: string } };
    expect(me.user).toMatchObject({ role: "shop", status: "active" });
  } finally {
    await applicant.close();
  }
  expect(errors).toEqual([]);
});

test("the admin rejects a shop application: it is marked rejected and gets no seller rights", async ({ browser, request }) => {
  const tag = runTag();
  const shop = await applyByApi(request, "shop", tag);
  const adminUser = await pool("admin");

  await withContext(browser, adminUser, async (_ctx, adminPage) => {
    const errors = collectPageErrors(adminPage);
    let row = await openUserRow(adminPage, shop.email);
    await row.getByRole("button", { name: "Xem hồ sơ shop" }).click();
    await adminPage.getByRole("button", { name: "Từ chối cấp phép" }).click();
    await expect(adminPage.getByText(`Đã từ chối hồ sơ Cửa hàng: "${shop.fullName}"`)).toBeVisible({ timeout: 20_000 });
    await expect(row.getByText("Bị từ chối")).toBeVisible();
    row = await openUserRow(adminPage, shop.email);
    await expect(row.getByText("Bị từ chối")).toBeVisible();
    // A rejected application can be reconsidered, but not "unlocked" into an approval by mistake.
    await expect(row.getByRole("button", { name: "Duyệt lại" })).toBeVisible();
    await expect(row.getByRole("button", { name: "Mở khóa tài khoản" })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  expect(await appMeta(shop)).toMatchObject({ role: "shop", status: "rejected" });
  expect((await readJsonStore(STORES.shops)).find((s) => s.email === shop.email)).toMatchObject({ status: "rejected" });
  await withContext(browser, shop, async (context, shopPage) => {
    await shopPage.goto("/seller/dashboard");
    await expect(shopPage).toHaveURL(/\/seller\/register$/);
    expect((await productPost(context.request, `E2E rejected ${tag}`)).status()).toBe(403);
  });
});

test("the admin locks and unlocks a shop: locked means no API access and no Seller Center", async ({ browser }) => {
  const shop = await pool("shop", "locked");
  const adminUser = await pool("admin");
  const shopContext = await browser.newContext();
  try {
    await signIn(shopContext, shop);
    const shopPage = await shopContext.newPage();
    expect((await productPost(shopContext.request, `E2E before lock ${runTag()}`)).status()).toBe(200);

    await withContext(browser, adminUser, async (_ctx, adminPage) => {
      const errors = collectPageErrors(adminPage);
      let row = await openUserRow(adminPage, shop.email);
      await row.getByRole("button", { name: "Khóa tài khoản" }).click();
      await expect(adminPage.getByText(`Đã tạm khóa tài khoản của ${shop.fullName}`)).toBeVisible({ timeout: 20_000 });
      await expect(row.getByText("Đã tạm khóa")).toBeVisible();

      expect(await appMeta(shop)).toMatchObject({ role: "shop", status: "suspended" });
      expect((await productPost(shopContext.request, `E2E locked ${runTag()}`)).status()).toBe(401);
      await shopPage.goto("/seller/dashboard");
      await expect(shopPage).toHaveURL(/\/seller\/register$/);

      row = await openUserRow(adminPage, shop.email);
      await expect(row.getByText("Đã tạm khóa")).toBeVisible();
      await row.getByRole("button", { name: "Mở khóa tài khoản" }).click();
      await expect(adminPage.getByText(`Đã mở khóa tài khoản cho ${shop.fullName}`)).toBeVisible({ timeout: 20_000 });
      await expect(row.getByText("Đang hoạt động")).toBeVisible();
      expect(errors).toEqual([]);
    });

    expect(await appMeta(shop)).toMatchObject({ role: "shop", status: "active" });
    expect((await productPost(shopContext.request, `E2E unlocked ${runTag()}`)).status()).toBe(200);
    await shopPage.goto("/seller/dashboard");
    await expect(shopPage).toHaveURL(/\/seller\/dashboard$/);
  } finally {
    await shopContext.close();
  }
});

test("a doctor applies on the landing page, is approved in Duyệt Bác sĩ, and the portal opens", async ({ browser, page }) => {
  test.setTimeout(180_000);
  const tag = runTag();
  const email = `e2e-doctor-${tag}@skinsense.test`;
  const name = `BS. E2E ${tag}`;

  await page.goto("/");
  await page.getByRole("button", { name: "🩺 Doctor registration" }).first().click();
  await page.getByPlaceholder("ThS. BS Trần Quốc Tuấn").fill(name);
  await page.getByPlaceholder("CCHN-008812/BYT").fill(`CCHN-E2E-${tag}`);
  await page.getByPlaceholder("Bệnh viện Da Liễu Trung Ương").fill("E2E Hospital");
  await page.getByPlaceholder("bacsi.tuan@gmail.com").fill(email);
  await page.getByPlaceholder("0918 222 333").fill("0900000003");
  await page.getByPlaceholder("••••••••").fill(`${randomUUID()}Aa1!`);
  await page.getByRole("button", { name: "Gửi yêu cầu duyệt Bác sĩ" }).click();
  await expect(page.getByText(/Hồ sơ Bác sĩ đã được gửi thành công/)).toBeVisible({ timeout: 20_000 });
  const doctor = await trackUser(email, name);

  const doctorContext = await browser.newContext();
  try {
    await signIn(doctorContext, doctor);
    expect((await doctorContext.request.get("/api/specialist/cases")).status()).toBe(403);

    const adminUser = await pool("admin");
    await withContext(browser, adminUser, async (_ctx, adminPage) => {
      const errors = collectPageErrors(adminPage);
      await openUserRow(adminPage, email);
      await adminPage.getByRole("button", { name: /Duyệt Bác sĩ Da liễu/ }).click();
      let row = adminPage.getByRole("row").filter({ hasText: email });
      await expect(row.getByText("Chờ xét duyệt")).toBeVisible();
      await expect(row.getByText(`CCHN-E2E-${tag}`)).toBeVisible();
      await row.getByRole("button", { name: "Phê duyệt" }).click();
      await expect(adminPage.getByText(`Đã phê duyệt CCHN & kích hoạt tài khoản Bác sĩ: "${name}"`)).toBeVisible({ timeout: 20_000 });
      await expect(row.getByText("Đã phê duyệt")).toBeVisible();

      await openUserRow(adminPage, email);
      await adminPage.getByRole("button", { name: /Duyệt Bác sĩ Da liễu/ }).click();
      row = adminPage.getByRole("row").filter({ hasText: email });
      await expect(row.getByText("Đã phê duyệt")).toBeVisible();
      expect(errors).toEqual([]);
    });

    expect(await appMeta(doctor)).toMatchObject({ role: "specialist", status: "active" });
    expect((await readJsonStore(STORES.specialists)).find((s) => s.email === email)).toMatchObject({ status: "active" });
    expect((await doctorContext.request.get("/api/specialist/cases")).status()).toBe(200);
    const portal = await doctorContext.newPage();
    await portal.goto("/specialist");
    await expect(portal.getByPlaceholder(/Tìm theo tên bệnh nhân/)).toBeVisible({ timeout: 20_000 });
  } finally {
    await doctorContext.close();
  }
});

test("the admin rejects a doctor application: rejected, and the portal stays closed", async ({ browser, request }) => {
  const doctor = await applyByApi(request, "specialist", runTag());
  const adminUser = await pool("admin");

  await withContext(browser, adminUser, async (_ctx, adminPage) => {
    const errors = collectPageErrors(adminPage);
    await openUserRow(adminPage, doctor.email);
    await adminPage.getByRole("button", { name: /Duyệt Bác sĩ Da liễu/ }).click();
    const row = adminPage.getByRole("row").filter({ hasText: doctor.email });
    await row.getByRole("button", { name: "Từ chối" }).click();
    await expect(adminPage.getByText(`Đã từ chối hồ sơ Bác sĩ: "${doctor.fullName}"`)).toBeVisible({ timeout: 20_000 });
    await expect(row.getByText("Bị từ chối")).toBeVisible();
    expect(errors).toEqual([]);
  });

  expect(await appMeta(doctor)).toMatchObject({ role: "specialist", status: "rejected" });
  expect((await readJsonStore(STORES.specialists)).find((s) => s.email === doctor.email)).toMatchObject({ status: "rejected" });
  await withContext(browser, doctor, async (context) => {
    expect((await context.request.get("/api/specialist/cases")).status()).toBe(403);
  });
});

test("product moderation: a pending product is hidden from buyers until approved, then sold, then hidden again", async ({ browser }) => {
  test.setTimeout(180_000);
  const tag = runTag();
  const shop = await pool("shop", "seller");
  const customer = await pool("customer");
  const adminUser = await pool("admin");
  const productName = `E2E Moderated Serum ${tag}`;

  const productId = await withContext(browser, shop, async (context) => {
    const res = await productPost(context.request, productName);
    expect(res.status()).toBe(200);
    return ((await res.json()) as { product: { id: string } }).product.id;
  });

  const customerContext = await browser.newContext();
  try {
    await signIn(customerContext, customer);
    expect(await marketplaceHas(customerContext.request, productId)).toBe(false);
    const buyerPage = await customerContext.newPage();
    const buyerErrors = collectPageErrors(buyerPage);
    await buyerPage.goto("/shop");
    await buyerPage.getByRole("button", { name: "Mua Hàng", exact: true }).click();
    await expect(buyerPage.getByText(productName)).toHaveCount(0);

    await withContext(browser, adminUser, async (_ctx, adminPage) => {
      const errors = collectPageErrors(adminPage);
      await adminPage.goto("/admin");
      await adminPage.getByRole("button", { name: /Duyệt Sản phẩm Shop/ }).click();
      const row = adminPage.getByRole("row").filter({ hasText: productName });
      await expect(row.getByText("Chờ Admin duyệt")).toBeVisible({ timeout: 20_000 });
      await row.getByRole("button", { name: "Phê duyệt" }).click();
      await expect(adminPage.getByText(`Đã phê duyệt sản phẩm: "${productName}"`)).toBeVisible({ timeout: 20_000 });
      expect(errors).toEqual([]);
    });

    // Approved: buyers see it and can buy exactly this product.
    expect(await marketplaceHas(customerContext.request, productId)).toBe(true);
    await buyerPage.goto(`/shop/checkout?productId=${productId}&variant=0&quantity=1`);
    await expect(buyerPage.getByText(productName).first()).toBeVisible({ timeout: 20_000 });

    await withContext(browser, adminUser, async (_ctx, adminPage) => {
      await adminPage.goto("/admin");
      await adminPage.getByRole("button", { name: /Duyệt Sản phẩm Shop/ }).click();
      await adminPage.getByRole("button", { name: /Đã duyệt lên sàn/ }).click();
      const row = adminPage.getByRole("row").filter({ hasText: productName });
      await expect(row.getByText("Đang bán trên sàn")).toBeVisible({ timeout: 20_000 });
      await row.getByRole("button", { name: "Ẩn khỏi sàn" }).click();
      await expect(adminPage.getByText(`Đã ẩn sản phẩm khỏi sàn: "${productName}"`)).toBeVisible({ timeout: 20_000 });
      await adminPage.reload();
      await adminPage.getByRole("button", { name: /Duyệt Sản phẩm Shop/ }).click();
      await adminPage.getByRole("button", { name: /Tất cả/ }).first().click();
      await expect(adminPage.getByRole("row").filter({ hasText: productName }).getByText("Đã ẩn khỏi sàn")).toBeVisible({ timeout: 20_000 });
    });

    expect(await marketplaceHas(customerContext.request, productId)).toBe(false);
    await buyerPage.goto(`/shop/checkout?productId=${productId}&variant=0&quantity=1`);
    await expect(buyerPage.getByText("Sản phẩm này không còn được bán trên sàn.")).toBeVisible({ timeout: 20_000 });
    expect(buyerErrors).toEqual([]);
  } finally {
    await customerContext.close();
  }
});

test("the admin sees every order and its status changes persist", async ({ browser }) => {
  const customer = await pool("customer", "buyer");
  const adminUser = await pool("admin");
  const orderCode = `SHOPEE-SS-E2E${runTag()}`;
  orderCodes.push(orderCode);

  await withContext(browser, customer, async (context) => {
    const res = await context.request.post("/api/orders", {
      data: { orderCode, totalAmount: 250000, paymentMethod: "cod", shopName: "E2E Order Shop", items: [] },
    });
    expect(res.status()).toBe(200);
  });

  await withContext(browser, adminUser, async (_ctx, adminPage) => {
    const errors = collectPageErrors(adminPage);
    await adminPage.goto("/admin");
    await adminPage.getByRole("button", { name: /Đơn hàng/ }).first().click();
    let row = adminPage.getByRole("row").filter({ hasText: orderCode });
    await expect(row.getByText("Chờ xác nhận")).toBeVisible({ timeout: 20_000 });
    await row.getByRole("button", { name: "Xác nhận đơn" }).click();
    await expect(adminPage.getByText(`Đơn ${orderCode}: Shop đang đóng gói`)).toBeVisible({ timeout: 20_000 });

    await adminPage.reload();
    await adminPage.getByRole("button", { name: /Đơn hàng/ }).first().click();
    row = adminPage.getByRole("row").filter({ hasText: orderCode });
    await expect(row.getByText("Shop đang đóng gói")).toBeVisible({ timeout: 20_000 });
    expect(errors).toEqual([]);
  });

  expect((await readJsonStore(STORES.orders)).find((o) => o.orderCode === orderCode)).toMatchObject({ status: "processing" });
});

test("routine allocation goes to the named account only; an unknown email is refused", async ({ browser }) => {
  const customer = await pool("customer", "routine");
  const adminUser = await pool("admin");

  await withContext(browser, adminUser, async (_ctx, adminPage) => {
    const errors = collectPageErrors(adminPage);
    await adminPage.goto("/admin");
    await adminPage.getByRole("button", { name: /Routine/ }).first().click();
    const recipient = adminPage.getByPlaceholder("email@example.com");
    await expect(recipient).toHaveValue("");

    await recipient.fill(`nobody-${runTag()}@skinsense.test`);
    await adminPage.getByRole("button", { name: "Phân bổ", exact: true }).click();
    await expect(adminPage.getByText(/Không tìm thấy tài khoản/)).toBeVisible({ timeout: 20_000 });

    await recipient.fill(customer.email);
    await adminPage.getByRole("button", { name: "Phân bổ", exact: true }).click();
    await expect(adminPage.getByText(/Đã phân bổ Routine CUSTOMER thành công/)).toBeVisible({ timeout: 20_000 });
    expect(errors).toEqual([]);
  });

  const { data } = await admin.storage.from("photos").createSignedUrl(`routines/protocol_${customer.userId}.json`, 60);
  const protocol = (await (await fetch(`${data!.signedUrl}&_t=${Date.now()}`)).json()) as { userId: string; targetUser: string };
  expect(protocol).toMatchObject({ userId: customer.userId, targetUser: customer.email });
});

test("the admin APIs refuse to mint admins or touch admin accounts", async ({ browser }) => {
  const adminUser = await pool("admin");
  const target = await pool("customer", "target");
  await withContext(browser, adminUser, async (context) => {
    expect((await context.request.patch("/api/admin/users", { data: { userId: target.userId, role: "admin" } })).status()).toBe(400);
    expect((await context.request.patch("/api/admin/users", { data: { userId: target.userId, status: "bogus" } })).status()).toBe(400);
    expect((await context.request.patch("/api/admin/users", { data: { userId: adminUser.userId, status: "suspended" } })).status()).toBe(403);
    // Approving a customer through the doctor endpoint is not a way to make a doctor.
    expect((await context.request.patch("/api/admin/specialists", { data: { userId: target.userId, action: "approve" } })).status()).toBe(409);
    expect((await context.request.patch("/api/admin/products", { data: { productId: "prod_01", status: "bogus" } })).status()).toBe(400);
  });
  expect(await appMeta(target)).toMatchObject({ role: "customer", status: "active" });
});
