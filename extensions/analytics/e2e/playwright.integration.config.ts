import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end against a running Squilla (BV theme, analytics active, in-page
 * signals on):  BASE_URL=http://127.0.0.1:8499 ADMIN_EMAIL=… ADMIN_PASSWORD=… npx playwright test -c playwright.integration.config.ts
 */
export default defineConfig({
  testDir: ".",
  testMatch: /integration\.spec\.ts/,
  timeout: 120_000,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: process.env.BASE_URL ?? "http://127.0.0.1:8499", headless: true },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});
