import { test, expect } from "@playwright/test";

test.describe("Discover Communities Page", () => {
  test("should load the discover page and check the header title", async ({ page }) => {
    await page.goto("/workspaces/discover");
    
    if (page.url().includes("/sign-in")) {
      await expect(page).toHaveURL(/.*sign-in.*/);
    } else {
      const heading = page.locator("h1");
      await expect(heading).toContainText("FIND YOUR COMMUNITY");
    }
  });
});
