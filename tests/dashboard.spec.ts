import { test, expect } from "@playwright/test";

test("dashboard shows request form", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: /create api request/i }),
  ).toBeVisible();

  await expect(page.getByLabel(/request url/i)).toBeVisible();
});

test("dashboard tabs switch", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByRole("button", { name: /history/i }).click();
  await expect(
    page.getByRole("heading", { name: /request history/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /statistics/i }).click();
  await expect(
    page.getByRole("heading", { name: /statistics/i }),
  ).toBeVisible();
});
