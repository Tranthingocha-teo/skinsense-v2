import { expect, test } from "@playwright/test";
import { admin, signedInCookies } from "./auth";

// Writes one feedback row to the project the env points at (production): run only after Dinh approves.
const TEST_EMAIL = "e2e@skinsense.test";

test("feedback submit stores the row with the opted-in browser note and returns to Settings with a toast", async ({ context, page }) => {
  const { cookies, userId } = await signedInCookies(TEST_EMAIL);
  await context.addCookies(cookies);
  const message = `e2e feedback ${Date.now()}`;

  await page.goto("/app/settings");
  await page.getByRole("link", { name: "Feedback" }).click();
  await page.getByRole("radio", { name: "Idea" }).click();
  await page.getByRole("textbox", { name: "Message" }).fill(message);
  await page.getByRole("checkbox", { name: "Attach browser and app version" }).click();
  await page.getByRole("button", { name: "Send feedback" }).click();

  await expect(page.getByText("Feedback sent. Thank you!")).toBeVisible();
  await expect(page).toHaveURL("/app/settings");

  const rows = await admin.from("feedback").select("kind,platform,app_version,device_note").eq("user_id", userId).eq("message", message);
  expect(rows.error).toBeNull();
  expect(rows.data).toEqual([{ kind: "idea", platform: "web", app_version: expect.any(String), device_note: expect.stringContaining("Chrome") }]);
  await admin.from("feedback").delete().eq("user_id", userId).eq("message", message);
});
