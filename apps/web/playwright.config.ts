import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@playwright/test";
import path from "node:path";

loadEnvConfig(__dirname);

// E2E_BASE_URL=https://skinsense-v2-topaz.vercel.app runs the same specs against a deployment, no dev server.
const deployed = process.env.E2E_BASE_URL;
const appURL = new URL(deployed ?? "http://localhost:3000");

// Seam (spec.md "Testing Decisions"): a fake camera at the browser level;
// everything above it — MediaPipe, domain, Supabase with real RLS — runs unmocked.
// System Chrome, like mpbench (verified GPU delegate); the fixture is a one-frame
// y4m — Chrome rendered an .mjpeg as a flat green frame.
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  use: {
    baseURL: deployed ?? "http://localhost:3000",
    viewport: { width: 390, height: 844 }, // the phone-first layout the artboards were drawn for
    // PW_CHROME_PATH=/usr/bin/chromium for machines without Google Chrome at the default path.
    channel: process.env.PW_CHROME_PATH ? undefined : "chrome",
    permissions: ["camera"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    // The app defaults to Vietnamese and shows onboarding once per device; the specs read the
    // English copy and start past onboarding. onboarding.spec.ts and the vi case-study test override this.
    storageState: {
      cookies: [{ name: "locale", value: "en", domain: appURL.hostname, path: "/", expires: -1, httpOnly: false, secure: appURL.protocol === "https:", sameSite: "Lax" }],
      origins: [{ origin: appURL.origin, localStorage: [{ name: "skinsense-onboarded", value: "1" }] }],
    },
    launchOptions: {
      executablePath: process.env.PW_CHROME_PATH || undefined,
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        `--use-file-for-fake-video-capture=${path.join(__dirname, "e2e/fixtures/face.y4m")}`,
      ],
    },
  },
  webServer: deployed
    ? undefined
    : {
        command: "bun dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
      },
});
