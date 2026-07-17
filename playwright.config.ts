import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Where is test folder file located
  testDir: "./tests-e2e",

  // Browser Default configuration
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure", // Automatically take a screenshot if the test fails.
  },

  // Which browser will be test
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Playwright command for  automatically enable Next.js if still not running
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true, // Just use the one that already active if previously ran a local server
  },
});
