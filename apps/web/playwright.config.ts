import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@playwright/test";
import path from "node:path";

loadEnvConfig(__dirname);

// E2E_BASE_URL=https://skinsense-v2.vercel.app runs the same specs against a deployment, no dev server.
const deployed = process.env.E2E_BASE_URL;

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
    channel: "chrome",
    permissions: ["camera"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
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
