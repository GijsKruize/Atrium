import { test, expect } from "@playwright/test";

const API = "http://localhost:3001/api";

test.describe("Invoices", () => {
  test.describe("Dashboard", () => {
    test("invoices page loads with heading and new button", async ({ page }) => {
      await page.goto("/dashboard/invoices");
      await expect(page.getByRole("heading", { name: /invoices/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /new invoice/i })).toBeVisible();
    });

    test("invoices page has status filter", async ({ page }) => {
      await page.goto("/dashboard/invoices");
      await expect(page.getByText(/all statuses/i)).toBeVisible();
    });

    test("invoices page shows outstanding stats card", async ({ page }) => {
      await page.goto("/dashboard/invoices");
      await expect(page.getByText(/outstanding/i)).toBeVisible({ timeout: 5000 });
    });

    test("new invoice page loads with form", async ({ page }) => {
      await page.goto("/dashboard/invoices/new");
      await expect(page.getByRole("heading", { name: /new invoice/i })).toBeVisible();
      await expect(page.getByText(/line items/i)).toBeVisible();
      await expect(page.getByText(/due date/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /create invoice/i })).toBeVisible();
    });

    test("new invoice form has add line item button", async ({ page }) => {
      await page.goto("/dashboard/invoices/new");
      await expect(page.getByText(/add line item/i)).toBeVisible();
    });

    test("create and view invoice end-to-end", async ({ page }) => {
      await page.goto("/dashboard/invoices/new");

      // Fill in a line item
      await page.getByPlaceholder("Description").fill("E2E Test Service");
      const qtyInput = page.locator('input[type="number"]').first();
      await qtyInput.fill("2");
      const priceInput = page.locator('input[type="number"]').nth(1);
      await priceInput.fill("100");

      // Submit
      await page.getByRole("button", { name: /create invoice/i }).click();

      // Should redirect to invoices list
      await expect(page).toHaveURL(/\/dashboard\/invoices$/, { timeout: 10000 });

      // The new invoice should appear in the list
      await expect(page.getByText("INV-001")).toBeVisible({ timeout: 5000 });
    });

    test("invoice detail page loads with line items table", async ({ page }) => {
      // Navigate to list first, then click the first invoice
      await page.goto("/dashboard/invoices");
      const invoiceLink = page.locator("a[href*='/dashboard/invoices/']").first();
      if (await invoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await invoiceLink.click();
        await expect(page.getByText(/line items/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/description/i)).toBeVisible();
        await expect(page.getByText(/total/i)).toBeVisible();
      }
    });

    test("invoice detail shows status transition buttons", async ({ page }) => {
      await page.goto("/dashboard/invoices");
      const invoiceLink = page.locator("a[href*='/dashboard/invoices/']").first();
      if (await invoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await invoiceLink.click();
        await expect(page.getByText(/line items/i)).toBeVisible({ timeout: 5000 });
        // Draft invoices should show "Mark as Sent"
        const markSent = page.getByRole("button", { name: /mark as sent/i });
        const markPaid = page.getByRole("button", { name: /mark as paid/i });
        const hasTransition = await markSent.isVisible().catch(() => false)
          || await markPaid.isVisible().catch(() => false);
        expect(hasTransition).toBeTruthy();
      }
    });
  });

  test.describe("Sidebar", () => {
    test("dashboard sidebar shows invoices link", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.getByRole("link", { name: /invoices/i })).toBeVisible();
    });
  });

  test.describe("Dashboard overview", () => {
    test("dashboard home shows invoice stats", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.getByText(/outstanding/i)).toBeVisible({ timeout: 5000 });
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
