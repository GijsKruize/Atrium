import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.e2e.ts",
  globalSetup: "./global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    storageState: "e2e/.auth/user.json",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "bun run --filter @atrium/api dev",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: !process.env.CI,
      cwd: "../",
    },
    {
      command: "bun run --filter @atrium/web dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      cwd: "../",
    },
  ],
});
