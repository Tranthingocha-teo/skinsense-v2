import { expect, test } from "@playwright/test";
import { admin, signedInCookies } from "./auth";

// Writes to the project the env points at (production): seeds one Photo row for its own account,
// writes a Note and Tags through the UI, then deletes the Photo (tags cascade). Run only after Dinh approves.
const TEST_EMAIL = "e2e-notes@skinsense.test";

test("Photo detail Note and Tags persist, and history filters by Tag and by Note", async ({ context, page }) => {
  const { cookies, userId } = await signedInCookies(TEST_EMAIL);
  await context.addCookies(cookies);
  const id = crypto.randomUUID();
  const storagePath = `${userId}/${id}.jpg`;
  const upload = await admin.storage.from("photos").upload(storagePath, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), { contentType: "image/jpeg", upsert: true });
  expect(upload.error).toBeNull();
  expect((await admin.from("photos").insert({ id, user_id: userId, storage_path: storagePath, awb_locked: false })).error).toBeNull();

  try {
    await page.goto(`/app/photos/${id}`);
    const note = page.getByRole("textbox", { name: "Note" });
    await note.fill("  Slept late, skin a bit dry  ");
    await note.blur();
    await expect(page.getByRole("status")).toHaveText("Saved");

    const tags = page.getByRole("group", { name: "Tags" });
    for (const label of ["Short sleep", "New serum"]) {
      await tags.getByRole("button", { name: "Add tag" }).click();
      await tags.getByRole("textbox", { name: "New tag" }).fill(label);
      await tags.getByRole("textbox", { name: "New tag" }).press("Enter");
      await expect(tags.getByRole("button", { name: `Remove tag ${label}` })).toBeVisible();
    }
    await tags.getByRole("button", { name: "Add tag" }).click();
    await tags.getByRole("textbox", { name: "New tag" }).fill("short SLEEP");
    await tags.getByRole("textbox", { name: "New tag" }).press("Enter");
    await expect(tags.getByRole("alert")).toHaveText("This photo already has that tag.");
    await tags.getByRole("textbox", { name: "New tag" }).press("Escape");
    await tags.getByRole("button", { name: "Remove tag New serum" }).click();
    await expect(tags.getByRole("button", { name: "Remove tag New serum" })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("textbox", { name: "Note" })).toHaveValue("Slept late, skin a bit dry");
    await expect(tags.getByRole("button", { name: "Remove tag Short sleep" })).toBeVisible();
    expect((await admin.from("photos").select("note").eq("id", id).single()).data).toEqual({ note: "Slept late, skin a bit dry" });
    expect((await admin.from("photo_tags").select("label").eq("photo_id", id)).data).toEqual([{ label: "Short sleep" }]);

    await page.goto("/app/history");
    const tile = page.locator(`a[href="/app/photos/${id}"]`);
    const filters = page.getByRole("group", { name: "Filter photos" });
    await filters.getByRole("button", { name: "Short sleep" }).click();
    await expect(tile).toBeVisible();
    await filters.getByRole("button", { name: "Has a note" }).click();
    await expect(tile).toBeVisible();
  } finally {
    await admin.storage.from("photos").remove([storagePath]);
    await admin.from("photos").delete().eq("id", id);
  }
  expect((await admin.from("photo_tags").select("id").eq("photo_id", id)).data).toHaveLength(0);
});
