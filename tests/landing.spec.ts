import { test, expect } from "@playwright/test";

test("landing page renders core sections", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /api testing/i }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();

  await expect(page.getByRole("link", { name: /learn more/i })).toBeVisible();
});

test("about page renders mission section", async ({ page }) => {
  await page.goto("/about");

  await expect(
    page.getByRole("heading", { name: /about postmen/i }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /our mission/i }),
  ).toBeVisible();
});
