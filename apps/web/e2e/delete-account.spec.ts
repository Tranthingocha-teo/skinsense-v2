import { expect, test } from "@playwright/test";
import { admin, signedInCookies } from "./auth";

// Its own account: deletion would otherwise wipe the capture flow's photo history.
const TEST_EMAIL = "e2e-delete@skinsense.test";

test("delete account removes the storage objects, every row and the auth user", async ({ context, page }) => {
  const { cookies, userId } = await signedInCookies(TEST_EMAIL);
  await context.addCookies(cookies);
  // A user who owns a photo object: exercises the storage-first ordering, not just an empty account.
  const photo = await admin.from("photos").insert({ user_id: userId, storage_path: `${userId}/seed.jpg`, awb_locked: false }).select("id").single();
  expect(photo.error).toBeNull();
  const upload = await admin.storage.from("photos").upload(`${userId}/seed.jpg`, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), { contentType: "image/jpeg", upsert: true });
  expect(upload.error).toBeNull();

  await page.goto("/app/settings");
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete account" }).click();
  await expect(page).toHaveURL("/", { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Delete account" })).toHaveCount(0);

  expect((await admin.auth.admin.getUserById(userId)).data.user).toBeNull();
  expect((await admin.from("photos").select("id").eq("user_id", userId)).data).toHaveLength(0);
  expect((await admin.storage.from("photos").list(userId)).data).toHaveLength(0);
  // The deleted session is gone: /app redirects to the landing page.
  await page.goto("/app");
  await expect(page).toHaveURL("/");
});
