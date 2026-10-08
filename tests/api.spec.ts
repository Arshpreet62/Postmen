import { test, expect } from "@playwright/test";

// The request route must never become a way into private networks.
test.describe("POST /api/request", () => {
  const send = (request: import("@playwright/test").APIRequestContext, data: unknown) =>
    request.post("/api/request", { data });

  for (const url of [
    "http://127.0.0.1:3200/",
    "http://localhost:3200/",
    "http://2130706433/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://10.0.0.1/",
    "http://192.168.1.1/",
  ]) {
    test(`refuses private address ${url}`, async ({ request }) => {
      const res = await send(request, { url, method: "GET" });
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data.response.status).toBe(0);
      expect(data.response.body.error).toMatch(/private or internal/);
    });
  }

  test("refuses non-web schemes", async ({ request }) => {
    const data = await (await send(request, { url: "file:///etc/passwd", method: "GET" })).json();
    expect(data.response.status).toBe(0);
    expect(data.response.body.error).toMatch(/Only http/);
  });

  test("rejects bad input with 400, not 500", async ({ request }) => {
    const bad = await request.post("/api/request", { data: "{not json", headers: { "content-type": "application/json" } });
    expect(bad.status()).toBe(400);
    expect((await send(request, { method: "GET" })).status()).toBe(400);
    expect((await send(request, { url: "https://example.com", method: "TRACE" })).status()).toBe(400);
  });

  test("an expired or forged token is flagged, not trusted", async ({ request }) => {
    const res = await request.post("/api/request", {
      data: { url: "http://127.0.0.1/", method: "GET" },
      headers: { Authorization: "Bearer not-a-real-token" },
    });
    const data = await res.json();
    expect(data.savedToHistory).toBe(false);
    expect(data.sessionExpired).toBe(true);
  });
});

test("history and stats need a valid token", async ({ request }) => {
  expect((await request.get("/api/history?limit=0")).status()).toBe(401);
  expect((await request.get("/api/stats")).status()).toBe(401);
  const forged = { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IngifQ.c2lnbmF0dXJl" };
  expect((await request.get("/api/history", { headers: forged })).status()).toBe(401);
});
