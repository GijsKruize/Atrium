import { test, expect } from "@playwright/test";

const API = "http://localhost:3001/api";

test.describe("Invoices", () => {
  test.describe("Dashboard - Invoices within project", () => {
    test("project detail page shows invoices tab", async ({ page }) => {
      await page.goto("/dashboard/projects");
      const projectLink = page.locator("a[href*='/dashboard/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await expect(page.getByRole("button", { name: /^invoices$/i })).toBeVisible({ timeout: 5000 });
      }
    });

    test("invoices tab has new invoice button", async ({ page }) => {
      await page.goto("/dashboard/projects");
      const projectLink = page.locator("a[href*='/dashboard/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.getByRole("button", { name: /^invoices$/i }).click();
        await expect(page.getByRole("button", { name: /new invoice/i })).toBeVisible({ timeout: 5000 });
      }
    });

    test("invoices tab has status filter", async ({ page }) => {
      await page.goto("/dashboard/projects");
      const projectLink = page.locator("a[href*='/dashboard/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.getByRole("button", { name: /^invoices$/i }).click();
        await expect(page.getByText(/all statuses/i)).toBeVisible({ timeout: 5000 });
      }
    });

    test("new invoice modal opens and has form fields", async ({ page }) => {
      await page.goto("/dashboard/projects");
      const projectLink = page.locator("a[href*='/dashboard/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.getByRole("button", { name: /^invoices$/i }).click();
        await page.getByRole("button", { name: /new invoice/i }).click({ timeout: 5000 });
        await expect(page.getByText(/line items/i)).toBeVisible();
        await expect(page.getByText(/due date/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /create invoice/i })).toBeVisible();
        await expect(page.getByText(/add line item/i)).toBeVisible();
      }
    });

    test("create invoice within project and verify it appears", async ({ page }) => {
      await page.goto("/dashboard/projects");
      const projectLink = page.locator("a[href*='/dashboard/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.getByRole("button", { name: /^invoices$/i }).click();
        await page.getByRole("button", { name: /new invoice/i }).click({ timeout: 5000 });

        // Fill in a line item
        await page.getByPlaceholder("Description").fill("E2E Test Service");
        const qtyInput = page.locator('input[type="number"]').first();
        await qtyInput.fill("2");
        const priceInput = page.locator('input[type="number"]').nth(1);
        await priceInput.fill("100");

        // Submit
        await page.getByRole("button", { name: /create invoice/i }).click();

        // The new invoice should appear in the project's invoice section
        await expect(page.getByText("INV-")).toBeVisible({ timeout: 10000 });
      }
    });

    test("invoice row expands to show line items", async ({ page }) => {
      await page.goto("/dashboard/projects");
      const projectLink = page.locator("a[href*='/dashboard/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.getByRole("button", { name: /^invoices$/i }).click();
        const invoiceRow = page.getByText("INV-").first();
        if (await invoiceRow.isVisible({ timeout: 5000 }).catch(() => false)) {
          await invoiceRow.click();
          await expect(page.getByText(/description/i)).toBeVisible({ timeout: 3000 });
          await expect(page.getByText(/total/i)).toBeVisible();
        }
      }
    });

    test("invoice shows status transition buttons", async ({ page }) => {
      await page.goto("/dashboard/projects");
      const projectLink = page.locator("a[href*='/dashboard/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await page.getByRole("button", { name: /^invoices$/i }).click();
        const invoiceRow = page.getByText("INV-").first();
        if (await invoiceRow.isVisible({ timeout: 5000 }).catch(() => false)) {
          await invoiceRow.click();
          // Draft invoices should show "Mark as Sent"
          const markSent = page.getByRole("button", { name: /mark as sent/i });
          const markPaid = page.getByRole("button", { name: /mark as paid/i });
          const hasTransition = await markSent.isVisible().catch(() => false)
            || await markPaid.isVisible().catch(() => false);
          expect(hasTransition).toBeTruthy();
        }
      }
    });
  });

  test.describe("Dashboard overview", () => {
    test("dashboard home shows invoice stats", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.getByText(/outstanding/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Old routes removed", () => {
    test("dashboard sidebar does NOT show invoices link", async ({ page }) => {
      await page.goto("/dashboard");
      // The sidebar should NOT have an "Invoices" nav item anymore
      const sidebarInvoicesLink = page.locator("nav").getByRole("link", { name: /^invoices$/i });
      await expect(sidebarInvoicesLink).not.toBeVisible();
    });
  });

  test.describe("API", () => {
    test("create invoice via API", async ({ request }) => {
      const res = await request.post(`${API}/invoices`, {
        data: {
          lineItems: [
            { description: "API Test Item", quantity: 1, unitPrice: 5000 },
          ],
        },
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.invoiceNumber).toBeTruthy();
      expect(body.status).toBe("draft");
    });

    test("list invoices via API", async ({ request }) => {
      const res = await request.get(`${API}/invoices`);
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(body.meta).toBeTruthy();
    });

    test("list invoices filtered by project via API", async ({ request }) => {
      // First get a project
      const projectsRes = await request.get(`${API}/projects?limit=1`);
      const projects = await projectsRes.json();
      if (projects.data?.length > 0) {
        const projectId = projects.data[0].id;
        const res = await request.get(`${API}/invoices?projectId=${projectId}`);
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.data).toBeInstanceOf(Array);
      }
    });

    test("get invoice stats via API", async ({ request }) => {
      const res = await request.get(`${API}/invoices/stats`);
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body).toHaveProperty("outstandingAmount");
      expect(body).toHaveProperty("totalInvoices");
      expect(body).toHaveProperty("paidAmount");
    });
  });
});
