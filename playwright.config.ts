import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
});
