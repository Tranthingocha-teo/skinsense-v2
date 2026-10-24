import { expect, test } from "@playwright/test";
import { admin, signedInCookies } from "./auth";

const TEST_EMAIL = "e2e@skinsense.test";

// Capture needs a desktop width: below md the page points phone browsers to the APK.
test.use({ viewport: { width: 1440, height: 900 } });

test("capture → save persists the photo and five zone readings for the signed-in user", async ({ context, page }) => {
  const { cookies, userId } = await signedInCookies(TEST_EMAIL);
  await context.addCookies(cookies);
  const before = await admin.from("photos").select("id", { count: "exact", head: true }).eq("user_id", userId);

  await page.goto("/app/capture");
  await expect(page.getByRole("status")).toContainText(/./, { timeout: 60_000 });
  const shutter = page.getByRole("button", { name: "Take photo" });
  await expect(shutter).toBeEnabled();
  await shutter.click();

  await page.getByRole("button", { name: /^Save/ }).click();
  await expect(page.getByText("Not a medical diagnosis", { exact: false })).toBeVisible();
  const rows = page.getByRole("row");
  await expect(rows).toHaveCount(6); // header + 5 zones

  const photos = await admin
    .from("photos")
    .select("id,storage_path,awb_locked,brightness")
    .eq("user_id", userId)
    .order("taken_at", { ascending: false });
  expect(photos.data).toHaveLength((before.count ?? 0) + 1);
  const photo = photos.data![0];
  expect(photo.storage_path).toBe(`${userId}/${photo.id}.jpg`);
  expect(photo.brightness).toBeGreaterThan(0);

  const readings = await admin.from("zone_readings").select("zone,pixel_count").eq("photo_id", photo.id);
  expect(readings.data?.map((r) => r.zone).sort()).toEqual(["chin", "forehead", "leftCheek", "nose", "rightCheek"]);
  expect(readings.data!.some((r) => r.pixel_count > 0)).toBe(true);

  const objects = await admin.storage.from("photos").list(userId, { search: `${photo.id}.jpg` });
  expect(objects.data).toHaveLength(1);

  // Mark spots on the photo just saved: the stored JPEG is re-analysed for
  // landmarks, so a tap lands in a real zone. The fixture face sits high in the
  // frame; tap down the vertical centre line (forehead → nose → chin) until one
  // tap is inside a zone.
  await page.getByRole("link", { name: "Mark spots" }).click();
  await expect(page).toHaveURL(`/app/spots/${photo.id}`);
  const canvas = page.getByRole("img", { name: "Tap the photo to mark a spot" });
  await expect(canvas).toBeVisible({ timeout: 60_000 });
  const box = (await canvas.boundingBox())!;
  for (let y = 0.05; y <= 0.6; y += 0.05) {
    await canvas.click({ position: { x: box.width / 2, y: box.height * y } });
    if (await page.getByRole("button", { name: "Remove spot" }).count()) break;
  }
  await expect(page.getByRole("status")).toContainText("1 spot marked");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved")).toBeVisible();

  const spots = await admin.from("spots").select("x,y,zone").eq("photo_id", photo.id);
  expect(spots.data).toHaveLength(1);
  expect(["forehead", "nose", "chin"]).toContain(spots.data![0].zone); // centre line: a mirrored or offset tap would miss
  expect(spots.data![0].x).toBeGreaterThan(0);
  expect(spots.data![0].x).toBeLessThan(1);
  expect(spots.data![0].y).toBeGreaterThan(0);
  expect(spots.data![0].y).toBeLessThan(1);

  // Trends reads the rows just written: today's photo is a point on the
  // redness line, and the spot card counts the spot just saved.
  await page.goto("/app/trends");
  await expect(page.getByRole("img", { name: /^Redness index for Forehead, \d+ days with data$/ })).toBeVisible();
  await expect(page.getByText(/^Latest: -?\d+\.\d$/)).toBeVisible();
  await expect(page.getByText("Not a medical diagnosis")).toBeVisible();
  const zoneName = { forehead: "Forehead", nose: "Nose", chin: "Chin" }[spots.data![0].zone as "forehead" | "nose" | "chin"];
  await page.getByRole("button", { name: zoneName }).click();
  await expect(page.getByText(new RegExp(`^[1-9]\\d* / ${zoneName}$`))).toBeVisible();
  if ((before.count ?? 0) + 1 >= 2) {
    const slider = page.getByRole("slider", { name: "Drag to compare" });
    await expect(slider).toBeVisible();
    await slider.fill("20");
  } else {
    await expect(page.getByText("Needs at least 2 photos in this window")).toBeVisible();
  }
});
