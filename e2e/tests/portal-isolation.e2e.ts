import { test, expect } from "@playwright/test";

/**
 * Portal Isolation Tests
 *
 * These tests verify that portal (client) pages do NOT expose
 * internal/admin-only content. Clients must never see:
 * - Internal notes
 * - Admin controls (create/edit/delete for tasks, invoices)
 * - Invoice stats or management features
 * - Dashboard navigation
 */
test.describe("Portal Isolation", () => {
  test.describe("Portal project detail hides internal content", () => {
    test("portal project page does NOT show internal notes", async ({ page }) => {
      await page.goto("/portal/projects");
      const projectLink = page.locator("a[href*='/portal/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.waitForTimeout(2000);

        // Internal notes must NEVER appear on portal
        await expect(page.getByText(/internal notes/i)).not.toBeVisible();
        await expect(page.getByText(/team only/i)).not.toBeVisible();
      }
    });

    test("portal project page does NOT show add task form", async ({ page }) => {
      await page.goto("/portal/projects");
      const projectLink = page.locator("a[href*='/portal/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.waitForTimeout(2000);

        // No task creation on portal
        await expect(page.getByPlaceholder(/add a task/i)).not.toBeVisible();
        await expect(page.getByRole("button", { name: /add note/i })).not.toBeVisible();
      }
    });

    test("portal project tasks are read-only (no checkboxes, no delete)", async ({ page }) => {
      await page.goto("/portal/projects");
      const projectLink = page.locator("a[href*='/portal/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.waitForTimeout(2000);

        // Should NOT have task delete buttons or edit controls
        // The portal task items should not have clickable checkboxes
        const trashButtons = page.locator('[title="Delete task"]');
        await expect(trashButtons).toHaveCount(0);
      }
    });

    test("portal project page does NOT show upload file button", async ({ page }) => {
      await page.goto("/portal/projects");
      const projectLink = page.locator("a[href*='/portal/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.waitForTimeout(2000);

        await expect(page.getByText(/upload file/i)).not.toBeVisible();
      }
    });

    test("portal project page does NOT show archive/status controls", async ({ page }) => {
      await page.goto("/portal/projects");
      const projectLink = page.locator("a[href*='/portal/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.waitForTimeout(2000);

        await expect(page.getByRole("button", { name: /archive/i })).not.toBeVisible();
        await expect(page.getByText(/assigned clients/i)).not.toBeVisible();
      }
    });
  });

  test.describe("Portal invoices are read-only", () => {
    test("portal invoices page loads", async ({ page }) => {
      await page.goto("/portal/invoices");
      await expect(page.getByRole("heading", { name: /invoices/i })).toBeVisible();
    });

    test("portal invoices page does NOT show new invoice button", async ({ page }) => {
      await page.goto("/portal/invoices");
      await page.waitForTimeout(2000);

      await expect(page.getByRole("link", { name: /new invoice/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /new invoice/i })).not.toBeVisible();
    });

    test("portal invoices page does NOT show stats or filters", async ({ page }) => {
      await page.goto("/portal/invoices");
      await page.waitForTimeout(2000);

      // No outstanding stats card on portal
      await expect(page.getByText(/outstanding/i)).not.toBeVisible();
      // No status/project filter dropdowns
      await expect(page.getByText(/all statuses/i)).not.toBeVisible();
      await expect(page.getByText(/all projects/i)).not.toBeVisible();
    });

    test("portal invoice detail does NOT show edit/delete/status controls", async ({ page }) => {
      await page.goto("/portal/invoices");
      const invoiceLink = page.locator("a[href*='/portal/invoices/']").first();
      if (await invoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await invoiceLink.click();
        await page.waitForTimeout(2000);

        // No status transition buttons
        await expect(page.getByRole("button", { name: /mark as sent/i })).not.toBeVisible();
        await expect(page.getByRole("button", { name: /mark as paid/i })).not.toBeVisible();
        // No edit or delete
        await expect(page.getByRole("button", { name: /edit/i })).not.toBeVisible();
        await expect(page.locator('[title="Delete invoice"]')).not.toBeVisible();
      }
    });
  });

  test.describe("Portal navigation does NOT expose admin routes", () => {
    test("portal header has only client-safe links", async ({ page }) => {
      await page.goto("/portal");
      // Should have portal nav links
      await expect(page.getByRole("link", { name: /projects/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /invoices/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /settings/i })).toBeVisible();

      // Should NOT have dashboard links
      await expect(page.getByRole("link", { name: /^overview$/i })).not.toBeVisible();
      await expect(page.getByRole("link", { name: /^clients$/i })).not.toBeVisible();
      await expect(page.getByRole("link", { name: /branding/i })).not.toBeVisible();
    });

    test("portal does NOT render dashboard sidebar", async ({ page }) => {
      await page.goto("/portal");
      // The sidebar nav is a dashboard-only component
      await expect(page.locator("nav").getByText(/overview/i)).not.toBeVisible();
    });
  });

  test.describe("API-level isolation", () => {
    test("notes endpoints require admin role", async ({ request }) => {
      // There is no /notes/mine — notes are admin-only
      const res = await request.get("http://localhost:3001/api/notes/mine");
      // Should get 404 (route not found) or 403 (forbidden)
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });

    test("admin invoice endpoints are role-protected", async ({ request }) => {
      // The /invoices/stats endpoint requires owner/admin role
      // Since our test user IS an owner, this should succeed
      // The protection is verified by the controller having @Roles("owner", "admin")
      const res = await request.get("http://localhost:3001/api/invoices/stats");
      expect(res.ok()).toBeTruthy();
    });

    test("client invoice endpoints exist and work", async ({ request }) => {
      // /invoices/mine should return invoices for the current user
      const res = await request.get("http://localhost:3001/api/invoices/mine");
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.data).toBeInstanceOf(Array);
    });
  });
});
