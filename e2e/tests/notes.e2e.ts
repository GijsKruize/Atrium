import { test, expect } from "@playwright/test";

const API = "http://localhost:3001/api";

test.describe("Internal Notes", () => {
  test.describe("Dashboard project detail", () => {
    test("project detail page shows internal notes section", async ({ page }) => {
      await page.goto("/dashboard/projects");
      const projectLink = page.locator("a[href*='/dashboard/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        await expect(page.getByText(/internal notes/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/team only/i)).toBeVisible();
      }
    });

    test("internal notes section has add note button", async ({ page }) => {
      await page.goto("/dashboard/projects");
      const projectLink = page.locator("a[href*='/dashboard/projects/']").first();
      if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectLink.click();
        // Expand the notes section if collapsed
        const notesHeader = page.getByText(/internal notes/i);
        await notesHeader.click();
        await expect(page.getByRole("button", { name: /add note/i })).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe("API", () => {
    let projectId: string;

    test.beforeAll(async ({ request }) => {
      const res = await request.post(`${API}/projects`, {
        data: { name: "Notes Test Project" },
      });
      if (res.ok()) {
        const body = await res.json();
        projectId = body.id;
      }
    });

    test("create note via API", async ({ request }) => {
      test.skip(!projectId, "No project available");
      const res = await request.post(`${API}/notes?projectId=${projectId}`, {
        data: { content: "E2E test internal note" },
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.content).toBe("E2E test internal note");
    });

    test("list notes via API", async ({ request }) => {
      test.skip(!projectId, "No project available");
      const res = await request.get(`${API}/notes/project/${projectId}`);
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.data).toBeInstanceOf(Array);
    });

    test("delete note via API", async ({ request }) => {
      test.skip(!projectId, "No project available");
      const createRes = await request.post(`${API}/notes?projectId=${projectId}`, {
        data: { content: "Note to delete" },
      });
      const note = await createRes.json();

      const res = await request.delete(`${API}/notes/${note.id}`);
      expect(res.ok()).toBeTruthy();
    });

    test("notes API has no client-facing routes", async ({ request }) => {
      // There should be no /notes/mine endpoint
      const res = await request.get(`${API}/notes/mine`);
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });
  });
});
