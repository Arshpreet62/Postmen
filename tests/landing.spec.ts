import { test, expect } from "@playwright/test";

test("landing page leads with a working request", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /send a request/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/request url/i)).toHaveValue(/^https:\/\//);
  await expect(page.getByRole("button", { name: /^send/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /keep an outbox/i }).first()).toBeVisible();
});

test("landing presets fill the address", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /a 404/i }).click();
  await expect(page.getByLabel(/request url/i)).toHaveValue(
    "https://httpbin.org/status/404",
  );
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

test("the hero animation can be paused", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(page.getByRole("button", { name: "Play animation" })).toHaveAttribute("aria-pressed", "true");
});

test("the journey section walks through the four legs", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /what happens when you press send/i })).toBeAttached();
  await expect(page.locator(".journey-steps > li")).toHaveCount(4);
});
