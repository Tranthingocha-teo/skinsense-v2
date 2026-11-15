import { expect, test, type Page } from "@playwright/test";
import { cleanupUsers, signIn, userPool, type TestRole, type TestUser } from "./roles";

// Every page, as every role: no server error, no uncaught page error, no console error,
// no 5xx from our own APIs, no broken same-site image. Pages a role may not open must
// redirect, not crash. Run it after any deploy: it is the cheap net under the flow specs.

const PAGES = [
  "/", "/case-study", "/privacy", "/stage", "/demo", "/demo/history", "/demo/routine", "/demo/trends",
  "/demo/photos/demo-photo-2026-11-15", "/demo/spots/demo-photo-2026-11-15",
  "/app", "/app/capture", "/app/history", "/app/routine", "/app/settings", "/app/settings/feedback", "/app/trends",
  "/shop", "/shop/checkout", "/shop/profile", "/checkout", "/pay-demo", "/profile", "/user/profile", "/user/routine",
  "/specialist", "/specialist/profile", "/admin", "/admin/profile",
  "/seller", "/seller/dashboard", "/seller/analytics", "/seller/orders", "/seller/products", "/seller/register",
  "/seller/shop", "/seller/wallet",
];

// Chrome extensions and the browser itself can log errors that are not the app's.
const NOISE = /Created TensorFlow Lite XNNPACK delegate|chrome-extension:|Download the React DevTools|favicon|Failed to load resource: the server responded with a status of 40[134]/;

const users: TestUser[] = [];
const pool = userPool(users);
test.afterAll(async () => cleanupUsers(users));

async function visit(page: Page, path: string): Promise<string[]> {
  const problems: string[] = [];
  const origin = new URL(page.url() === "about:blank" ? "http://x" : page.url()).origin;
  page.removeAllListeners("pageerror");
  page.removeAllListeners("console");
  page.removeAllListeners("response");
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message.slice(0, 160)}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !NOISE.test(m.text())) problems.push(`console: ${m.text().slice(0, 160)}`);
  });
  page.on("response", (r) => {
    const sameSite = r.url().startsWith(origin) || r.url().includes(".vercel.app") || r.url().includes("localhost");
    if (sameSite && r.status() >= 500) problems.push(`${r.status()} ${new URL(r.url()).pathname}`);
  });
  const res = await page.goto(path, { waitUntil: "domcontentloaded" });
  if (!res || res.status() >= 500) problems.push(`document ${res?.status()}`);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  const brokenImages = await page.evaluate(() =>
    [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0 && img.src.startsWith(location.origin))
      .map((img) => img.src.replace(location.origin, "")),
  );
  for (const src of brokenImages) problems.push(`broken image ${src}`);
  return problems;
}

for (const role of ["anon", "customer", "shop", "specialist"] as const) {
  test(`every page renders cleanly for ${role}`, async ({ context, page }) => {
    test.setTimeout(PAGES.length * 30_000);
    if (role !== "anon") await signIn(context, await pool(role as TestRole));
    const report: string[] = [];
    for (const path of PAGES) {
      const problems = await visit(page, path);
      for (const p of problems) report.push(`${path} → ${p}`);
    }
    expect(report, report.join("\n")).toEqual([]);
  });
}
