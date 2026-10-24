import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Component tests are slow on a cold cache while turbo runs the mobile suite in parallel; 5s flaked on fresh clones.
    testTimeout: 30_000,
  },
  resolve: {
    alias: { "@": new URL("./src/", import.meta.url).pathname },
  },
});
