import { expect, test, type Locator } from "@playwright/test";

// Public /demo route: sample data generated in the browser, no test account, no writes.
// The demo has a photo every night of the last week, none tonight.
const dayAgo = (ago: number) => {
  const d = new Date();
  d.setDate(d.getDate() - ago);
  return d;
};
const long = (ago: number) => dayAgo(ago).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
const short = (ago: number) => dayAgo(ago).toLocaleDateString("en", { day: "numeric", month: "short" });

// The calendar opens on the after-day's month; step back or forward when a pick sits across a month edge.
async function pick(dialog: Locator, ago: number) {
  const day = dialog.getByRole("button", { name: long(ago), exact: true });
  for (const step of ["Previous month", "Next month", "Next month"]) {
    if (await day.isVisible()) break;
    await dialog.getByRole("button", { name: step }).click();
  }
  await day.click();
}

for (const viewport of [
  { width: 1440, height: 900 }, // Dialog
  { width: 390, height: 844 }, // Drawer
]) {
  test(`choosing two dates on /demo/trends updates the comparison at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/demo/trends");
    const compare = page.locator("section").filter({ hasText: "Before / after" });
    await expect(compare.getByText(short(6), { exact: true })).toBeVisible(); // first photo of the 7 days
    await expect(compare.getByText(short(1), { exact: true })).toBeVisible(); // last photo

    await compare.getByRole("button", { name: "Choose 2 dates" }).click();
    const dialog = page.getByRole("dialog", { name: "Choose 2 dates" });
    await expect(dialog.getByRole("button", { name: `${long(0)}, today`, exact: true })).toBeDisabled(); // no photo tonight
    await pick(dialog, 4);
    await pick(dialog, 2);
    await dialog.getByRole("button", { name: "Compare" }).click();

    await expect(dialog).toBeHidden();
    await expect(compare.getByText(short(4), { exact: true })).toBeVisible();
    await expect(compare.getByText(short(2), { exact: true })).toBeVisible();
    await expect(compare.getByText(short(6), { exact: true })).toBeHidden();
  });
}
