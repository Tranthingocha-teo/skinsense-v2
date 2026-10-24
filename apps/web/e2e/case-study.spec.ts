import { expect, test } from "@playwright/test";

// Public page, no test account: safe to run against any base URL (E2E_BASE_URL or the dev server).
// The config's default viewport is the 390×844 phone layout.
const HEADLINE = "A skin diary that measures redness on the device.";

test("/case-study renders at 390px without horizontal overflow", async ({ page }) => {
  await page.goto("/case-study");
  await expect(page.getByRole("heading", { level: 1, name: HEADLINE })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Measured, not claimed." })).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("the vi locale shows the same English page", async ({ context, page, baseURL }) => {
  await context.addCookies([{ name: "locale", value: "vi", url: baseURL! }]);
  await page.goto("/case-study");
  await expect(page.getByRole("heading", { level: 1, name: HEADLINE })).toBeVisible();
});
