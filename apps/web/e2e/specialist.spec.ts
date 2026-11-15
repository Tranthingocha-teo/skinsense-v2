import { expect, test } from "@playwright/test";
import { STORES, cleanupUsers, collectPageErrors, readJsonStore, runTag, signIn, userPool, type TestUser } from "./roles";

// Patient -> specialist -> patient: the patient exports a clinical record from Today, the
// specialist finds it in the portal and prescribes a routine, and the patient's routine page shows
// exactly that prescription. Plus the portal's gate for visitors without specialist rights.

const users: TestUser[] = [];
const pool = userPool(users);
test.afterAll(async () => cleanupUsers(users));

test("a patient's shared record gets a routine from a specialist", async ({ browser }) => {
  test.setTimeout(180_000);
  const tag = runTag();
  const patient = await pool("customer");
  const doctor = await pool("specialist");

  const patientContext = await browser.newContext();
  const doctorContext = await browser.newContext();
  try {
    await signIn(patientContext, patient);
    await signIn(doctorContext, doctor);
    const patientPage = await patientContext.newPage();
    const doctorPage = await doctorContext.newPage();
    const patientErrors = collectPageErrors(patientPage);
    const doctorErrors = collectPageErrors(doctorPage);

    // Before any prescription the routine page says so (no sample doctor or products).
    await patientPage.goto("/user/routine");
    await expect(patientPage.getByText("Chưa có phác đồ nào được kê")).toBeVisible();

    // Patient: Today -> export the record to a doctor.
    await patientPage.goto("/app");
    await patientPage.getByRole("button", { name: "Export record for a doctor" }).click();
    await expect(patientPage.getByText("Hồ Sơ Lâm Sàng & Phân Tích Da Y Khoa")).toBeVisible();
    // Filed under the patient's own name (it used to default to a real person's).
    await expect.poll(() => patientPage.locator("form input").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toContain(patient.fullName);
    await patientPage.getByPlaceholder("09xx xxx xxx").fill("0900000005");
    await patientPage.getByPlaceholder(/Da đỏ ửng sau khi ra nắng/).fill(`E2E symptoms ${tag}`);
    await patientPage.getByRole("button", { name: /Xuất & Gửi Bệnh Án Tới Bác Sĩ/ }).click();
    await expect(patientPage.getByText(/Bệnh Án Y Khoa: BA-/)).toBeVisible({ timeout: 20_000 });
    const shared = (await readJsonStore(STORES.cases)).find((c) => c.patientUserId === patient.userId);
    expect(shared).toMatchObject({ patientName: patient.fullName, patientEmail: patient.email });

    // Specialist: the case is in the portal; prescribe one preset product.
    await doctorPage.goto("/specialist");
    await doctorPage.getByPlaceholder(/Tìm theo tên bệnh nhân/).fill(patient.fullName);
    await doctorPage.getByRole("button", { name: /Chọn hồ sơ để xuất/ }).first().click({ timeout: 15_000 });
    const title = `E2E routine ${tag}`;
    await doctorPage.locator("form").getByRole("textbox").first().fill(title);
    await doctorPage.getByRole("button", { name: /\+ Thêm sản phẩm có ảnh/ }).click();
    await doctorPage.getByRole("button", { name: "Thêm vào Routine" }).click();
    await doctorPage.getByRole("button", { name: /Xuất & Gửi phác đồ về Bệnh nhân/ }).click();
    await expect(doctorPage.getByText(/Đã xuất và gửi phác đồ Routine thành công/)).toBeVisible({ timeout: 20_000 });

    // Patient: the routine page shows this prescription, by this doctor.
    await patientPage.goto("/user/routine");
    await expect(patientPage.getByText(title).first()).toBeVisible({ timeout: 20_000 });
    await expect(patientPage.getByText(doctor.fullName).first()).toBeVisible();
    await expect(patientPage.getByText("Sữa rửa mặt CeraVe Hydrating Cleanser").first()).toBeVisible();

    expect(patientErrors).toEqual([]);
    expect(doctorErrors).toEqual([]);
  } finally {
    await patientContext.close();
    await doctorContext.close();
  }
});

test("the specialist portal is closed to visitors and customers", async ({ browser, page }) => {
  await page.goto("/specialist");
  await expect(page.getByText(/Vui lòng đăng nhập bằng tài khoản Bác sĩ/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Xem Bệnh án/ })).toHaveCount(0);

  const customer = await pool("customer");
  const context = await browser.newContext();
  try {
    await signIn(context, customer);
    const customerPage = await context.newPage();
    await customerPage.goto("/specialist");
    await expect(customerPage.getByText(/chưa được cấp quyền Bác sĩ/)).toBeVisible();
    expect((await context.request.get("/api/specialist/cases")).status()).toBe(403);
    expect(
      (await context.request.post("/api/specialist/cases", { data: { caseId: "x", products: [{ name: "x" }] } })).status(),
    ).toBe(403);
  } finally {
    await context.close();
  }
});

test("prescribing for a case that maps to no account is refused", async ({ browser }) => {
  const doctor = await pool("specialist");
  const context = await browser.newContext();
  try {
    await signIn(context, doctor);
    const res = await context.request.post("/api/specialist/cases", {
      data: { caseId: `no-such-case-${runTag()}`, products: [{ name: "E2E product" }] },
    });
    expect(res.status()).toBe(404);
  } finally {
    await context.close();
  }
});
