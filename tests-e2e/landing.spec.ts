import { test, expect } from "@playwright/test";

test.describe("Landing Page E2E Test", () => {
  test("should load the landing page and display main headers", async ({
    page,
  }) => {
    await page.goto("/");

    const mainHeading = page.locator("h1");

    await expect(mainHeading).toContainText("All your team communication");

    const description = page.locator(
      "text=CollabSpace brings your team together",
    );
    await expect(description).toBeVisible();
  });

  test("should navigate to sign-up page when clicking Get Started button", async ({
    page,
  }) => {
    await page.goto("/");

    const getStartedButton = page
      .locator("main")
      .getByRole("link", { name: "Get Started" })
      .first();

    await getStartedButton.click();

    await expect(page).toHaveURL(/.*sign-up.*/, { timeout: 15000 });
  });
});
