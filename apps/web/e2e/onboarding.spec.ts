import { expect, test } from "@playwright/test";
import { signedInCookies } from "./auth";

// Signs the test account in against the project the env points at (production), reads only: run after Dinh approves.
const TEST_EMAIL = "e2e@skinsense.test";

test("onboarding appears once per device after sign-in, and Xem thử never shows it", async ({ context, page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "A skin diary, one photo a night." })).toBeHidden();

  const { cookies } = await signedInCookies(TEST_EMAIL);
  await context.addCookies(cookies);

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "A skin diary, one photo a night." })).toBeVisible();
  await expect(page.getByRole("navigation")).toBeHidden();
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.getByRole("heading", { name: "A skin diary, one photo a night." })).toBeHidden();
});
