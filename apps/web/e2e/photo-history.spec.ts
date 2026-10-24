import { expect, test } from "@playwright/test";
import { admin, signedInCookies } from "./auth";

// Its own account: deleting would otherwise remove the capture flow's photos.
const TEST_EMAIL = "e2e-history@skinsense.test";
const ZONES = ["forehead", "leftCheek", "rightCheek", "nose", "chin"];

test("photo history → detail → delete removes the storage object, the Photo row, its spots and zone readings", async ({ context, page }) => {
  const { cookies, userId } = await signedInCookies(TEST_EMAIL);
  await context.addCookies(cookies);
  const id = crypto.randomUUID();
  const storagePath = `${userId}/${id}.jpg`;
  const upload = await admin.storage.from("photos").upload(storagePath, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), { contentType: "image/jpeg", upsert: true });
  expect(upload.error).toBeNull();
  expect((await admin.from("photos").insert({ id, user_id: userId, storage_path: storagePath, awb_locked: false })).error).toBeNull();
  // Chin is the reddest zone, so it is the reading Photo detail shows.
  const readings = ZONES.map((zone, i) => ({ user_id: userId, photo_id: id, zone, redness: 1 + i / 10, unevenness: 1, pixel_count: 100 }));
  expect((await admin.from("zone_readings").insert(readings)).error).toBeNull();
  const spots = [
    { user_id: userId, photo_id: id, x: 0.5, y: 0.2, zone: "forehead" },
    { user_id: userId, photo_id: id, x: 0.5, y: 0.5, zone: "nose" },
  ];
  expect((await admin.from("spots").insert(spots)).error).toBeNull();

  await page.goto("/app/settings");
  await page.getByRole("link", { name: "Photo history" }).click();
  await expect(page).toHaveURL("/app/history");
  const tile = page.locator(`a[href="/app/photos/${id}"]`);
  await expect(tile).toHaveAccessibleName(/, 2 spots$/);
  await tile.click();

  await expect(page).toHaveURL(`/app/photos/${id}`);
  await expect(page.getByText("Chin · redness")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mark spots" })).toHaveAttribute("href", `/app/spots/${id}`);

  await page.getByRole("button", { name: "Delete photo" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Delete this photo?" });
  await expect(dialog).toContainText("Deletes the photo, spots and readings");
  await dialog.getByRole("button", { name: "Delete photo" }).click();
  await expect(page).toHaveURL("/app/history", { timeout: 30_000 });
  await expect(tile).toHaveCount(0);

  expect((await admin.from("photos").select("id").eq("id", id)).data).toHaveLength(0);
  expect((await admin.from("spots").select("id").eq("photo_id", id)).data).toHaveLength(0);
  expect((await admin.from("zone_readings").select("id").eq("photo_id", id)).data).toHaveLength(0);
  expect((await admin.storage.from("photos").list(userId, { search: `${id}.jpg` })).data).toHaveLength(0);
});
