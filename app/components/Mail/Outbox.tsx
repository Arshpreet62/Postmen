"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "@/app/config/api";
import { toHeaderObject } from "@/app/lib/headers";
import {
  type Delivery,
  formatDuration,
  hostOf,
  outcomeOf,
  pathOf,
  prettyBody,
  timeAgo,
} from "@/app/lib/mail";

type Item = {
  _id: string;
  endpoint: string;
  method: string;
  timestamp: string;
  request: { headers?: Record<string, string>; body?: unknown };
  response: {
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    body?: unknown;
    durationMs?: number;
    sizeBytes?: number;
    truncated?: boolean;
  };
};

type Filter = "all" | "delivered" | "returned";

const PAGE = 20;

export function toDelivery(item: Item): Delivery {
  // Older entries stored headers as [{ key, value }].
  const headers = toHeaderObject(item.request.headers);
  return {
    request: {
      url: item.endpoint,
      method: item.method,
      headers,
      body: prettyBody(item.request.body),
    },
    response: {
      status: item.response.status,
      statusText: item.response.statusText,
      headers: item.response.headers || {},
      body: item.response.body,
      durationMs: item.response.durationMs,
      sizeBytes: item.response.sizeBytes,
      truncated: item.response.truncated,
    },
    sentAt: item.timestamp,
    savedToHistory: true,
  };
}

export default function Outbox({
  token,
  refreshKey,
  selectedId,
  onSelect,
  onUnauthorized,
}: {
  token: string | null;
  refreshKey: number;
  selectedId: string | null;
  onSelect: (id: string, delivery: Delivery) => void;
  onUnauthorized?: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Only the newest load may update the list, so a slow older answer
  // can't overwrite a newer one.
  const seq = useRef(0);
  const [opening, setOpening] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const mine = ++seq.current;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/history?page=1&limit=${limit}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (mine !== seq.current) return;
      if (res.status === 401) return onUnauthorized?.();
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (mine !== seq.current) return;
      setItems(data.history || []);
      setTotal(data.pagination?.totalRequests ?? 0);
      setError("");
    } catch {
      if (mine === seq.current) setError("The outbox didn't load. Refresh the page to try again.");
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [token, limit, onUnauthorized]);

  // The list comes without bodies; fetch the full record when one is opened.
  const open = async (item: Item) => {
    if (!token) return;
    setOpening(item._id);
    try {
      const res = await fetch(apiUrl(`/api/history/${item._id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return onUnauthorized?.();
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      onSelect(item._id, toDelivery(data.request));
      setError("");
    } catch {
      setError("That request didn't open. Try again.");
    } finally {
      setOpening(null);
    }
  };

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const remove = async (id: string) => {
    if (!token) return;
    const res = await fetch(apiUrl(`/api/history/${id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setConfirmDelete(null);
    if (res.ok) load();
    else setError("That request couldn't be deleted. Try again.");
  };

  const clearAll = async () => {
    if (!token) return;
    const res = await fetch(apiUrl("/api/history"), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setConfirmClear(false);
    if (res.ok) load();
    else setError("The outbox couldn't be cleared. Try again.");
  };

  const shown = items.filter((i) => {
    // Delivered means a 2xx or 3xx answer, as in the statistics.
    const o = outcomeOf(i.response.status);
    if (filter === "delivered") return o !== "returned";
    if (filter === "returned") return o === "returned";
    return true;
  });

  return (
    <div style={{ display: "grid", gap: "0.75rem", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
        <h2 id="outbox-title" style={{ fontWeight: 800, fontSize: "1.1rem" }}>
          Outbox
        </h2>
        <span className="hint" style={{ fontVariantNumeric: "tabular-nums" }}>
          {total} {total === 1 ? "request" : "requests"}
        </span>
      </div>
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }} role="group" aria-label="Filter the outbox">
        {(["all", "delivered", "returned"] as Filter[]).map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "delivered" ? "Delivered" : "Returned"}
          </button>
        ))}
      </div>

      {error && <p className="notice">{error}</p>}

      <div aria-labelledby="outbox-title" style={{ borderTop: "1px solid var(--rule)" }}>
        {loading && items.length === 0 ? (
          <p className="hint" style={{ padding: "0.75rem 0" }}>
            Opening the outbox…
          </p>
        ) : shown.length === 0 ? (
          <p className="hint" style={{ padding: "0.75rem 0" }}>
            {items.length === 0
              ? "Nothing sent yet. Every request you send while signed in lands here with its postmark."
              : `No ${filter} requests in the latest ${items.length}.`}
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {shown.map((item) => {
              const outcome = outcomeOf(item.response.status);
              return (
                <li key={item._id} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="outbox-item"
                    aria-current={selectedId === item._id}
                    aria-busy={opening === item._id}
                    onClick={() => open(item)}
                  >
                    <span className="ring" data-outcome={outcome} aria-hidden="true" />
                    <span className="outbox-path" title={item.endpoint}>
                      <span className="sr-only">{item.method} </span>
                      {pathOf(item.endpoint)}
                    </span>
                    <span className="outbox-meta" style={{ flexWrap: "nowrap" }}>
                      <span className={`method method-${item.method}`} style={{ minWidth: 0, fontSize: "0.68rem", padding: "0 0.3rem" }} aria-hidden="true">
                        {item.method}
                      </span>
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hostOf(item.endpoint)}</span>
                    </span>
                    <span className="outbox-meta">
                      <span style={{ color: outcome === "returned" ? "var(--red)" : "var(--ink)", fontWeight: 700 }}>
                        {item.response.status === 0 ? "Not delivered" : item.response.status}
                      </span>
                      {item.response.durationMs !== undefined && <span>{formatDuration(item.response.durationMs)}</span>}
                      <span>{timeAgo(item.timestamp)}</span>
                    </span>
                  </button>
                  {confirmDelete === item._id ? (
                    <div style={{ display: "flex", gap: "0.4rem", padding: "0.4rem 0.75rem 0.7rem 2.6rem", background: "var(--sunk)" }}>
                      <button type="button" className="btn btn-danger" style={{ minHeight: "2rem", padding: "0.2rem 0.6rem" }} onClick={() => remove(item._id)}>
                        Delete
                      </button>
                      <button type="button" className="btn btn-quiet" style={{ minHeight: "2rem", padding: "0.2rem 0.6rem" }} onClick={() => setConfirmDelete(null)}>
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="rm-item"
                      aria-label={`Delete ${item.method} ${pathOf(item.endpoint)} from the outbox`}
                      onClick={() => setConfirmDelete(item._id)}
                    >
                      ×
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length < total && (
        <button type="button" className="btn btn-quiet" onClick={() => setLimit((l) => l + PAGE)}>
          Show {Math.min(PAGE, total - items.length)} older
        </button>
      )}

      {total > 0 &&
        (confirmClear ? (
          <div className="notice" style={{ display: "grid", gap: "0.5rem" }}>
            <p>Delete all {total} requests and their responses? This can&apos;t be undone.</p>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button type="button" className="btn btn-danger" onClick={clearAll}>
                Delete all {total}
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => setConfirmClear(false)}>
                Keep them
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-quiet" style={{ justifySelf: "start" }} onClick={() => setConfirmClear(true)}>
            Clear outbox
          </button>
        ))}
    </div>
  );
}
