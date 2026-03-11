import { test, expect } from "@playwright/test";

test.describe("Portal", () => {
  test("portal home redirects to projects", async ({ page }) => {
    await page.goto("/portal");
    await expect(page).toHaveURL(/\/portal\/projects/, { timeout: 10000 });
  });

  test("portal projects page has header with branding slot", async ({ page }) => {
    await page.goto("/portal");
    await expect(page).toHaveURL(/\/portal\/projects/, { timeout: 10000 });
    await expect(page.getByText(/client portal/i)).toBeVisible();
  });
});
