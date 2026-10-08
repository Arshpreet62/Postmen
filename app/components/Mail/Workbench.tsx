"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Postmark from "./Postmark";
import { apiUrl } from "@/app/config/api";
import {
  METHODS,
  type Delivery,
  type HeaderRow,
  curlSnippet,
  fetchSnippet,
  formatBytes,
  formatDuration,
  hostOf,
  outcomeOf,
  jsonTokens,
  paramsFromUrl,
  parseCurl,
  prettyBody,
  urlWithParams,
} from "@/app/lib/mail";

export type Preset = { label: string; method: string; url: string; body?: string };

type Props = {
  token?: string | null;
  variant?: "full" | "landing";
  initialUrl?: string;
  initialMethod?: string;
  presets?: Preset[];
  // Load a past request (from the outbox) into the bench.
  loaded?: Delivery | null;
  onDelivered?: (delivery: Delivery) => void;
  // Called when the server says the saved sign-in is no longer valid.
  onSessionExpired?: () => void;
  // Keep the unsent request in this browser between visits.
  persistDraft?: boolean;
};

type ReqTab = "params" | "headers" | "body";
type ResTab = "body" | "headers" | "code";

const emptyRow = (): HeaderRow => ({ key: "", value: "" });
const DRAFT_KEY = "postmen-draft";

// Highlighting a huge body would freeze the page; past this, show plain text.
const HIGHLIGHT_LIMIT = 200_000;

// Arrow keys, Home and End move between tabs, as screen reader users expect.
function tabKeys<T extends string>(e: React.KeyboardEvent, tabs: T[], current: T, select: (t: T) => void, idOf: (t: T) => string) {
  const i = tabs.indexOf(current);
  const next =
    e.key === "ArrowRight" ? tabs[(i + 1) % tabs.length]
    : e.key === "ArrowLeft" ? tabs[(i - 1 + tabs.length) % tabs.length]
    : e.key === "Home" ? tabs[0]
    : e.key === "End" ? tabs[tabs.length - 1]
    : null;
  if (!next) return;
  e.preventDefault();
  select(next);
  document.getElementById(idOf(next))?.focus();
}

function rowsFrom(headers?: Record<string, string>): HeaderRow[] {
  const rows = Object.entries(headers || {}).map(([key, value]) => ({ key, value }));
  return [...rows, emptyRow()];
}

export default function Workbench({
  token,
  variant = "full",
  initialUrl = "",
  initialMethod = "GET",
  presets = [],
  loaded = null,
  onDelivered,
  onSessionExpired,
  persistDraft = false,
}: Props) {
  const uid = useId();
  const [method, setMethod] = useState(initialMethod);
  const [url, setUrl] = useState(initialUrl);
  // The params table keeps its own rows so a half-typed row (a value before
  // its name, or a name being retyped) isn't dropped mid-edit.
  const [paramRows, setParamRows] = useState<HeaderRow[]>(() => [...paramsFromUrl(initialUrl), emptyRow()]);
  const [codeLang, setCodeLang] = useState<"fetch" | "curl">("fetch");
  const [imported, setImported] = useState(false);
  const [headers, setHeaders] = useState<HeaderRow[]>([emptyRow()]);
  const [body, setBody] = useState("");
  const [reqTab, setReqTab] = useState<ReqTab>("params");
  const [resTab, setResTab] = useState<ResTab>("body");
  const [sending, setSending] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [bodyError, setBodyError] = useState("");
  const [failure, setFailure] = useState("");
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [fresh, setFresh] = useState(false);
  const [copied, setCopied] = useState("");
  const [announce, setAnnounce] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);

  const changeUrl = useCallback((next: string) => {
    setUrl(next);
    setParamRows([...paramsFromUrl(next), emptyRow()]);
  }, []);

  // Pasting a cURL command anywhere in the address bar imports it.
  const importCurl = useCallback(
    (text: string) => {
      const r = parseCurl(text);
      if (!r) return false;
      setMethod(METHODS.includes(r.method as (typeof METHODS)[number]) ? r.method : "GET");
      changeUrl(r.url);
      setHeaders([...r.headers, emptyRow()]);
      setBody(r.body);
      setUrlError("");
      setBodyError("");
      if (r.body) setReqTab("body");
      else if (r.headers.length) setReqTab("headers");
      setAnnounce(`Imported the cURL command: ${r.method}, ${r.headers.length} headers${r.body ? ", with a body" : ""}.`);
      setImported(true);
      return true;
    },
    [changeUrl],
  );

  // Bring back the last unsent request from this browser.
  const restored = useRef(false);
  useEffect(() => {
    if (!persistDraft || restored.current) return;
    restored.current = true;
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (!d || typeof d.url !== "string") return;
      setMethod(typeof d.method === "string" ? d.method : "GET");
      changeUrl(d.url);
      if (Array.isArray(d.headers)) setHeaders([...d.headers.filter((h: HeaderRow) => h && h.key), emptyRow()]);
      if (typeof d.body === "string") setBody(d.body);
    } catch {}
  }, [persistDraft, changeUrl]);
  useEffect(() => {
    if (!persistDraft || !restored.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ method, url, headers: headers.filter((h) => h.key.trim()), body }),
        );
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [persistDraft, method, url, headers, body]);

  // Loading a past request fills the bench with what was sent and received.
  useEffect(() => {
    if (!loaded) return;
    setMethod(loaded.request.method);
    changeUrl(loaded.request.url);
    setHeaders(rowsFrom(loaded.request.headers));
    setBody(loaded.request.body || "");
    setDelivery(loaded);
    setFresh(false);
    setFailure("");
  }, [loaded, changeUrl]);

  const headerCount = headers.filter((h) => h.key.trim()).length;
  const canHaveBody = method !== "GET" && method !== "HEAD";

  const send = useCallback(async () => {
    if (sending) return;
    if (/^\s*curl\s/.test(url) && importCurl(url)) return;
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) throw new Error("protocol");
      setUrlError("");
    } catch {
      setUrlError("Enter a full address starting with https:// or http://");
      urlRef.current?.focus();
      return;
    }
    if (canHaveBody && body.trim()) {
      const looksJson = /^[\[{]/.test(body.trim());
      const typeSet = headers.find((h) => h.key.trim().toLowerCase() === "content-type");
      if (looksJson && (!typeSet || typeSet.value.includes("json"))) {
        try {
          JSON.parse(body);
          setBodyError("");
        } catch (e) {
          setBodyError(`The body isn't valid JSON: ${(e as Error).message}`);
          setReqTab("body");
          return;
        }
      }
    }

    setSending(true);
    setFailure("");
    setAnnounce(`Sending ${method} to ${hostOf(url)}`);
    try {
      const res = await fetch(apiUrl("/api/request"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          url,
          method,
          headers: headers.filter((h) => h.key.trim()),
          body: canHaveBody ? body : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.response) throw new Error(data?.error || `Postmen answered ${res.status}`);
      if (data.sessionExpired) onSessionExpired?.();
      const d: Delivery = {
        request: data.request,
        response: data.response,
        sentAt: data.sentAt || new Date().toISOString(),
        savedToHistory: data.savedToHistory,
      };
      setDelivery(d);
      setFresh(true);
      setResTab("body");
      const r = d.response;
      setAnnounce(
        r.status === 0
          ? `Not delivered after ${formatDuration(r.durationMs)}`
          : `${r.status} ${r.statusText}, ${formatDuration(r.durationMs)}, ${formatBytes(r.sizeBytes)}`,
      );
      onDelivered?.(d);
    } catch (e) {
      const msg = (e as Error).message;
      setFailure(
        msg.startsWith("Postmen answered") || msg === "Failed to fetch"
          ? "Postmen couldn't send this request. Check your connection and try again."
          : msg,
      );
      setAnnounce("Request failed");
    } finally {
      setSending(false);
    }
  }, [sending, url, method, headers, body, canHaveBody, token, onDelivered, onSessionExpired, importCurl]);

  // Ctrl or Cmd + Enter sends from anywhere inside the bench.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  const updateRow = (
    rows: HeaderRow[],
    i: number,
    field: keyof HeaderRow,
    value: string,
  ) => {
    const next = rows.map((r, j) => (j === i ? { ...r, [field]: value } : r));
    if (i === next.length - 1 && (next[i].key || next[i].value)) next.push(emptyRow());
    return next;
  };

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("");
    }
  };

  const res = delivery?.response;
  const bodyText = res ? prettyBody(res.body) : "";
  const bodyIsJson = !!res && typeof res.body === "object" && res.body !== null;
  const bodyTokens = useMemo(
    () => (bodyIsJson && bodyText.length <= HIGHLIGHT_LIMIT ? jsonTokens(bodyText) : null),
    [bodyIsJson, bodyText],
  );
  const snippet = delivery ? (codeLang === "curl" ? curlSnippet(delivery.request) : fetchSnippet(delivery.request)) : "";
  const resHeaders = Object.entries(res?.headers || {});

  const responsePane = (
    <section className="pane" aria-labelledby={`${uid}-res`} data-testid="response">
      <div className="pane-head">
        <h2 id={`${uid}-res`} className="pane-title">
          Response
        </h2>
        {res && (
          <div className="tabs" role="tablist" aria-label="Response views">
            {(["body", "headers", "code"] as ResTab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                id={`${uid}-rt-${t}`}
                aria-selected={resTab === t}
                aria-controls={`${uid}-rp`}
                tabIndex={resTab === t ? 0 : -1}
                className="tab"
                onClick={() => setResTab(t)}
                onKeyDown={(e) => tabKeys(e, ["body", "headers", "code"], resTab, setResTab, (x) => `${uid}-rt-${x}`)}
              >
                {t === "body" ? "Body" : t === "headers" ? "Headers" : "Code"}
                {t === "headers" && <span className="count">{resHeaders.length}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="pane-body" style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <Postmark
            key={fresh && delivery ? delivery.sentAt : "still"}
            status={res?.status}
            statusText={res?.statusText}
            url={delivery?.request.url || url}
            sentAt={delivery?.sentAt}
            durationMs={res?.durationMs}
            sizeBytes={res?.sizeBytes}
            stamp={fresh ? "new" : "still"}
            tilt={delivery ? -4 - (new Date(delivery.sentAt).getSeconds() % 9) : -6}
          />
          <div style={{ display: "grid", gap: "0.35rem", minWidth: 0, flex: "1 1 14rem" }}>
            {res ? (
              <>
                <p style={{ fontWeight: 800, fontSize: "1.15rem", color: outcomeOf(res.status) === "returned" ? "var(--red)" : "var(--ink)" }}>
                  {res.status === 0 ? "Not delivered" : `${res.status} ${res.statusText}`}
                </p>
                <p className="receipt-line">
                  <span>Round trip <b>{formatDuration(res.durationMs)}</b></span>
                  <span>Body <b>{formatBytes(res.sizeBytes)}</b></span>
                </p>
                {res.truncated && (
                  <p className="hint">The body passed 5 MB, so Postmen stopped reading it there.</p>
                )}
                <p className="hint">
                  {delivery?.savedToHistory
                    ? "Saved to your outbox, response body included. Delete it from the outbox at any time."
                    : token
                      ? "Not saved."
                      : "Not saved. Sign in to keep an outbox of every request."}
                </p>
              </>
            ) : (
              <p className="hint" style={{ maxWidth: "28rem" }}>
                Press Send or <kbd className="key">Ctrl</kbd> + <kbd className="key">Enter</kbd>. The response lands
                here with its postmark: status, round-trip time measured on the server, and body size.
              </p>
            )}
          </div>
        </div>

        {res && (
          <div id={`${uid}-rp`} role="tabpanel" aria-labelledby={`${uid}-rt-${resTab}`} style={{ display: "grid", gap: "0.5rem", minWidth: 0 }}>
            {resTab === "body" && (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-quiet" onClick={() => copy("body", bodyText)}>
                    {copied === "body" ? "Copied" : "Copy body"}
                  </button>
                </div>
                <pre className="code-block mono" tabIndex={0} aria-label="Response body">
                  {bodyTokens
                    ? bodyTokens.map((t, i) => (t.kind ? <span key={i} className={t.kind}>{t.text}</span> : t.text))
                    : bodyText || "(empty body)"}
                </pre>
              </>
            )}
            {resTab === "headers" && (
              <div style={{ overflowX: "auto" }} tabIndex={0} aria-label="Response headers">
                <table className="kv mono">
                  <tbody>
                    {resHeaders.map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ padding: "0.45rem 1rem 0.45rem 0", color: "var(--ink-2)", whiteSpace: "nowrap" }}>{k}</td>
                        <td style={{ padding: "0.45rem 0", width: "auto", textAlign: "left", overflowWrap: "anywhere" }}>{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {resTab === "code" && delivery && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                  <div role="group" aria-label="Code language" style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    {(["fetch", "curl"] as const).map((l) => (
                      <button key={l} type="button" className="chip" aria-pressed={codeLang === l} onClick={() => setCodeLang(l)}>
                        {l === "fetch" ? "JavaScript fetch" : "cURL"}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="btn btn-quiet" onClick={() => copy("code", snippet)}>
                    {copied === "code" ? "Copied" : codeLang === "curl" ? "Copy cURL" : "Copy code"}
                  </button>
                </div>
                <pre className="code-block mono" tabIndex={0} aria-label={codeLang === "curl" ? "cURL command for this request" : "Fetch code for this request"}>
                  {snippet}
                </pre>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div onKeyDown={onKeyDown} style={{ display: "grid", gap: "1rem", minWidth: 0 }}>
      <form
        className="envelope"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        aria-label="Request address"
      >
        <div className="address">
          <label htmlFor={`${uid}-method`} className="sr-only">
            Method
          </label>
          <select
            id={`${uid}-method`}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{ color: method === "POST" || method === "DELETE" ? "var(--red)" : method === "GET" ? "var(--blue)" : "var(--ink)" }}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <label htmlFor={`${uid}-url`} className="sr-only">
            Request URL
          </label>
          <input
            ref={urlRef}
            id={`${uid}-url`}
            type="url"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            placeholder="https://api.example.com/users, or paste a cURL command"
            value={url}
            onChange={(e) => {
              changeUrl(e.target.value);
              setUrlError("");
              setImported(false);
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (/^\s*curl\s/.test(text) && importCurl(text)) e.preventDefault();
            }}
            aria-invalid={!!urlError}
            aria-describedby={urlError ? `${uid}-url-err` : undefined}
          />
          <button type="submit" className="btn" disabled={sending}>
            {sending ? "Sending…" : "Send"}
            {!sending && <kbd className="key hidden sm:inline">Ctrl ↵</kbd>}
          </button>
        </div>
        <div className="stripe" data-state={sending ? "sending" : "idle"} aria-hidden="true" />
      </form>
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
      {imported && variant === "full" && (
        <p className="hint">Imported from cURL. Check the headers and body before sending.</p>
      )}
      {urlError && (
        <p id={`${uid}-url-err`} className="field-error">
          {urlError}
        </p>
      )}
      {failure && <p className="notice">{failure}</p>}

      {presets.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <span className="hint">Try:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              className="chip"
              aria-pressed={url === p.url && method === p.method}
              onClick={() => {
                setMethod(p.method);
                changeUrl(p.url);
                setBody(p.body || "");
                setUrlError("");
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {variant === "landing" ? (
        responsePane
      ) : (
        <div className="bench-grid">
          <section className="pane" aria-labelledby={`${uid}-req`}>
            <div className="pane-head">
              <h2 id={`${uid}-req`} className="pane-title">
                Request
              </h2>
              <div className="tabs" role="tablist" aria-label="Request parts">
                {(["params", "headers", "body"] as ReqTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    id={`${uid}-qt-${t}`}
                    aria-selected={reqTab === t}
                    aria-controls={`${uid}-qp`}
                    tabIndex={reqTab === t ? 0 : -1}
                    className="tab"
                    onClick={() => setReqTab(t)}
                    onKeyDown={(e) => tabKeys(e, ["params", "headers", "body"], reqTab, setReqTab, (x) => `${uid}-qt-${x}`)}
                  >
                    {t === "params" ? "Params" : t === "headers" ? "Headers" : "Body"}
                    {t === "headers" && headerCount > 0 && <span className="count">{headerCount}</span>}
                    {t === "params" && paramRows.some((r) => r.key.trim()) && (
                      <span className="count">{paramRows.filter((r) => r.key.trim()).length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="pane-body" id={`${uid}-qp`} role="tabpanel" aria-labelledby={`${uid}-qt-${reqTab}`}>
              {reqTab === "params" && (
                <RowsTable
                  label="Query parameter"
                  rows={paramRows}
                  onChange={(i, f, v) => {
                    const rows = updateRow(paramRows, i, f, v);
                    setParamRows(rows);
                    setUrl(urlWithParams(url, rows));
                  }}
                  onRemove={(i) => {
                    const rows = paramRows.filter((_, j) => j !== i);
                    setParamRows(rows.length ? rows : [emptyRow()]);
                    setUrl(urlWithParams(url, rows));
                  }}
                  hint="Edits here rewrite the address, and the other way round."
                />
              )}
              {reqTab === "headers" && (
                <RowsTable
                  label="Header"
                  rows={headers}
                  onChange={(i, f, v) => setHeaders(updateRow(headers, i, f, v))}
                  onRemove={(i) => setHeaders(headers.length > 1 ? headers.filter((_, j) => j !== i) : [emptyRow()])}
                  hint="Your Content-Type wins. Without one, a body is sent as application/json."
                />
              )}
              {reqTab === "body" &&
                (canHaveBody ? (
                  <div style={{ display: "grid", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <label htmlFor={`${uid}-body`} className="hint">
                        Body, sent exactly as typed
                      </label>
                      {/^\s*[[{]/.test(body) && (
                        <button
                          type="button"
                          className="btn btn-quiet"
                          style={{ minHeight: "2rem", padding: "0.2rem 0.6rem" }}
                          onClick={() => {
                            try {
                              setBody(JSON.stringify(JSON.parse(body), null, 2));
                              setBodyError("");
                            } catch (e) {
                              setBodyError(`The body isn't valid JSON: ${(e as Error).message}`);
                            }
                          }}
                        >
                          Format JSON
                        </button>
                      )}
                    </div>
                    <textarea
                      id={`${uid}-body`}
                      className="code-area"
                      spellCheck={false}
                      value={body}
                      placeholder={'{\n  "title": "Hello",\n  "userId": 1\n}'}
                      onChange={(e) => {
                        setBody(e.target.value);
                        setBodyError("");
                      }}
                      aria-invalid={!!bodyError}
                      aria-describedby={bodyError ? `${uid}-body-err` : undefined}
                    />
                    {bodyError && (
                      <p id={`${uid}-body-err`} className="field-error">
                        {bodyError}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="hint">{method} requests don&apos;t carry a body. Switch to POST, PUT or PATCH to add one.</p>
                ))}
            </div>
          </section>
          {responsePane}
        </div>
      )}
    </div>
  );
}

function RowsTable({
  label,
  rows,
  onChange,
  onRemove,
  hint,
}: {
  label: string;
  rows: HeaderRow[];
  onChange: (i: number, field: keyof HeaderRow, value: string) => void;
  onRemove: (i: number) => void;
  hint: string;
}) {
  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      <table className="kv">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ width: "40%" }}>
                <input
                  aria-label={`${label} ${i + 1} name`}
                  placeholder="name"
                  value={r.key}
                  spellCheck={false}
                  onChange={(e) => onChange(i, "key", e.target.value)}
                />
              </td>
              <td>
                <input
                  aria-label={`${label} ${i + 1} value`}
                  placeholder="value"
                  value={r.value}
                  spellCheck={false}
                  onChange={(e) => onChange(i, "value", e.target.value)}
                />
              </td>
              <td>
                {i < rows.length - 1 && (
                  <button type="button" className="rm" aria-label={`Remove ${label.toLowerCase()} ${r.key || i + 1}`} onClick={() => onRemove(i)}>
                    ×
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">{hint}</p>
    </div>
  );
}
