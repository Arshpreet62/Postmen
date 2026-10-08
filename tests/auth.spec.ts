import { test, expect } from "@playwright/test";

test("login page renders form", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: /sign in to your outbox/i }),
  ).toBeVisible();

  await expect(page.getByLabel(/email address/i)).toBeVisible();
  await expect(page.getByLabel(/^password$/i)).toBeVisible();
});

test("signup page renders form", async ({ page }) => {
  await page.goto("/signup");

  await expect(
    page.getByRole("heading", { name: /keep an outbox/i }),
  ).toBeVisible();

  await expect(page.getByLabel(/email address/i)).toBeVisible();
  await expect(page.getByLabel(/^password$/i)).toBeVisible();
  await expect(page.getByLabel(/confirm password/i)).toBeVisible();
});
