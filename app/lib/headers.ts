// Headers arrive as [{ key, value }] from the form and were stored that way
// by older versions; newer records keep a plain object. Accept both.
export function toHeaderObject(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};
  if (Array.isArray(input)) {
    return Object.fromEntries(
      input
        .filter((h) => h && typeof h.key === "string" && h.key.trim())
        .map((h) => [h.key.trim(), String(h.value ?? "")]),
    );
  }
  return Object.fromEntries(Object.entries(input as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]));
}
