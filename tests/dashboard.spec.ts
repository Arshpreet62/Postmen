import { test, expect } from "@playwright/test";

test("workbench shows the address bar and both panes", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByLabel(/request url/i)).toBeVisible();
  await expect(page.getByLabel(/^method$/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /^request$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^response$/i })).toBeVisible();
});

test("an invalid address is caught before sending", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByLabel(/request url/i).fill("not a url");
  await page.getByRole("button", { name: /^send/i }).click();
  await expect(page.getByText(/enter a full address/i)).toBeVisible();
});

test("query params and address stay in step", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByLabel(/request url/i).fill("https://example.com/search?q=mail");
  await expect(page.getByLabel("Query parameter 1 value")).toHaveValue("mail");
});

test("views switch between workbench and statistics", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByRole("button", { name: /statistics/i }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: /statistics/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /workbench/i }).click();
  await expect(page.getByLabel(/request url/i)).toBeVisible();
});

test("a value typed before its name isn't lost", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByLabel(/request url/i).fill("https://example.com/search");
  await page.getByLabel("Query parameter 1 value").fill("mail");
  await page.getByLabel("Query parameter 1 name").fill("q");
  await expect(page.getByLabel(/request url/i)).toHaveValue("https://example.com/search?q=mail");
});

test("switching to statistics and back keeps unsent edits", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByLabel(/request url/i).fill("https://example.com/kept");
  await page.getByRole("button", { name: /statistics/i }).click();
  await page.getByRole("button", { name: /workbench/i }).click();
  await expect(page.getByLabel(/request url/i)).toHaveValue("https://example.com/kept");
});

test("pasting a cURL command fills the request", async ({ page }) => {
  await page.goto("/dashboard");

  const url = page.getByLabel(/request url/i);
  await url.focus();
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData(
      "text",
      `curl -X POST 'https://api.example.com/items' -H 'Content-Type: application/json' --data-raw '{"a":1}'`,
    );
    document.activeElement!.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
    );
  });
  await expect(url).toHaveValue("https://api.example.com/items");
  await expect(page.getByLabel(/^method$/i)).toHaveValue("POST");
  await expect(page.getByLabel(/body, sent exactly as typed/i)).toHaveValue('{"a":1}');
});

test("request tabs follow the arrow keys", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByRole("tab", { name: /params/i }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /headers/i })).toBeFocused();
  await expect(page.getByRole("tab", { name: /headers/i })).toHaveAttribute("aria-selected", "true");
});
