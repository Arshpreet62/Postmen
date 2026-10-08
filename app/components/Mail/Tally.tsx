"use client";

import React, { useEffect, useState } from "react";
import { apiUrl } from "@/app/config/api";
import { formatDuration, outcomeOf } from "@/app/lib/mail";

type Stats = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  methodBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  medianDurationMs: number | null;
  timedRequests: number;
};

// The sorting-office tally: counts by postage class (method) and by postmark (status).
export default function Tally({
  token,
  refreshKey,
  onUnauthorized,
}: {
  token: string | null;
  refreshKey: number;
  onUnauthorized?: () => void;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();
    fetch(apiUrl("/api/stats"), { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
      .then((r) => {
        if (r.status === 401) {
          onUnauthorized?.();
          return null;
        }
        return r.ok ? r.json() : Promise.reject(r.status);
      })
      .then((d) => {
        if (!d) return;
        setStats(d);
        setError("");
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setError("The tally didn't load. Refresh the page to try again.");
      });
    return () => ctrl.abort();
  }, [token, refreshKey, onUnauthorized]);

  if (error) return <p className="notice">{error}</p>;
  if (!stats) return <p className="hint">Counting…</p>;
  if (stats.totalRequests === 0) {
    return (
      <p className="hint" style={{ maxWidth: "36rem" }}>
        Nothing to count yet. Send a request from the workbench while signed in and it shows up here, sorted by method
        and by status code.
      </p>
    );
  }

  const methods = Object.entries(stats.methodBreakdown).sort((a, b) => b[1] - a[1]);
  const maxMethod = Math.max(...methods.map(([, n]) => n));
  const codes = Object.entries(stats.statusBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: "grid", gap: "2.5rem" }}>
      <div style={{ display: "grid", gap: "0.5rem", maxWidth: "46rem" }}>
        <p style={{ fontSize: "clamp(1.6rem, 1.1rem + 2vw, 2.6rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.015em", fontVariantNumeric: "tabular-nums" }}>
          {stats.totalRequests} sent. {stats.successfulRequests} delivered,{" "}
          <span style={{ color: stats.failedRequests ? "var(--red)" : "inherit" }}>{stats.failedRequests} not</span>.
        </p>
        <p className="hint" style={{ fontSize: "1rem" }}>
          {stats.successRate}% came back with a 2xx or 3xx status.
          {stats.medianDurationMs !== null &&
            ` Median round trip ${formatDuration(stats.medianDurationMs)} across the ${stats.timedRequests} requests timed since timing was added.`}
        </p>
      </div>

      <div className="tally-grid">
        <section aria-labelledby="by-method">
          <h3 id="by-method" style={{ fontWeight: 800, marginBottom: "0.75rem" }}>
            By method
          </h3>
          <table className="kv" style={{ fontVariantNumeric: "tabular-nums" }}>
            <tbody>
              {methods.map(([m, n]) => (
                <tr key={m}>
                  <th scope="row" style={{ textAlign: "left", padding: "0.45rem 0.8rem 0.45rem 0", width: "5.5rem", fontWeight: 400 }}>
                    <span className={`method method-${m}`}>{m}</span>
                  </th>
                  <td style={{ width: "auto", textAlign: "left" }}>
                    <span
                      aria-hidden="true"
                      style={{
                        display: "block",
                        height: "0.7rem",
                        width: `${Math.max(2, (n / maxMethod) * 100)}%`,
                        background: m === "POST" || m === "DELETE" ? "var(--red)" : m === "GET" ? "var(--blue)" : "var(--ink)",
                        borderRadius: "1px",
                      }}
                    />
                  </td>
                  <td style={{ width: "3.5rem", textAlign: "right", fontWeight: 700 }}>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="by-status">
          <h3 id="by-status" style={{ fontWeight: 800, marginBottom: "0.75rem" }}>
            By status code
          </h3>
          <ul className="postmark-tally">
            {codes.map(([code, n]) => {
              const c = Number(code);
              const outcome = outcomeOf(c);
              return (
                <li key={code} data-outcome={outcome}>
                  <span className="pt-code">{c === 0 ? "ERR" : code}</span>
                  <span className="pt-n">
                    {n} <span className="sr-only">requests</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="hint" style={{ marginTop: "0.75rem" }}>
            Blue rings were delivered, dashed red ones returned. ERR means the address couldn&apos;t be reached at all.
          </p>
        </section>
      </div>
    </div>
  );
}
