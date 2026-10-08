"use client";

import React, { useId } from "react";
import {
  formatBytes,
  formatDuration,
  hostOf,
  outcomeOf,
  postmarkDate,
} from "@/app/lib/mail";

type Props = {
  status?: number;
  statusText?: string;
  url?: string;
  sentAt?: string;
  durationMs?: number;
  sizeBytes?: number;
  // "new" plays the stamp once; anything else renders still.
  stamp?: "new" | "still";
  tilt?: number;
  className?: string;
};

// Shrink arc text so long host names still fit around the ring.
function arcSize(text: string, max: number, room: number) {
  return Math.max(5.5, Math.min(max, room / (text.length * 0.62)));
}

// A round cancellation mark: host along the top, timing along the bottom,
// status code in the middle, and either wavy cancellation lines (delivered)
// or a boxed "Return to sender" (returned).
export default function Postmark({
  status,
  statusText,
  url = "",
  sentAt,
  durationMs,
  sizeBytes,
  stamp = "still",
  tilt = -8,
  className = "",
}: Props) {
  const id = useId().replace(/:/g, "");
  const outcome = outcomeOf(status);
  const host = hostOf(url).replace(/^www\./i, "").toUpperCase().slice(0, 30) || "POSTMEN";
  const date = sentAt ? postmarkDate(sentAt) : null;
  const code = status === undefined ? "···" : status === 0 ? "ERR" : String(status);
  // Entries saved before timing was added have a status but no duration.
  const timing =
    status === undefined
      ? "NOT YET SENT"
      : durationMs === undefined
        ? "TIME NOT MEASURED"
        : `${formatDuration(durationMs)} · ${formatBytes(sizeBytes)}`.toUpperCase();

  const label =
    status === undefined
      ? "Not sent yet"
      : `Postmark: ${status === 0 ? "not delivered" : `${status} ${statusText ?? ""}`}, ${formatDuration(durationMs)}, ${formatBytes(sizeBytes)}${date ? `, sent ${date.day} at ${date.time}` : ""}`;

  return (
    <svg
      className={`postmark ${className}`}
      data-outcome={outcome}
      data-stamp={stamp}
      style={{ ["--tilt" as string]: `${tilt}deg`, width: "auto", aspectRatio: "200 / 124" }}
      viewBox="-62 -62 200 124"
      role="img"
      aria-label={label}
    >
      <defs>
        <path id={`top-${id}`} d="M -41.35 15.05 A 44 44 0 1 1 41.35 15.05" />
        <path id={`bot-${id}`} d="M -46 0 A 46 46 0 0 0 46 0" />
      </defs>
      <circle r="58" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle r="36" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fontSize={arcSize(host, 9, 150)} fontWeight="800" letterSpacing={host.length > 18 ? 0.4 : 1.2} textAnchor="middle">
        <textPath href={`#top-${id}`} startOffset="50%">
          {host}
        </textPath>
      </text>
      <text fontSize={arcSize(timing, 8.5, 120)} fontWeight="700" letterSpacing="0.8" textAnchor="middle">
        <textPath href={`#bot-${id}`} startOffset="50%" dominantBaseline="hanging">
          {timing}
        </textPath>
      </text>
      <text className="pm-code" y={date ? 4 : 10} fontSize={code.length > 3 ? 22 : 30} textAnchor="middle">
        {code}
      </text>
      {date && (
        <>
          <text y="17" fontSize="7.5" fontWeight="700" textAnchor="middle">
            {date.day}
          </text>
          <text y="27" fontSize="7.5" fontWeight="700" textAnchor="middle">
            {date.time}
          </text>
        </>
      )}
      {outcome === "returned" ? (
        <g transform="translate(66 -14)">
          <rect width="68" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <text x="34" y="12" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.6">
            {status === 0 ? "NOT" : "RETURN TO"}
          </text>
          <text x="34" y="22" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.6">
            {status === 0 ? "DELIVERED" : "SENDER"}
          </text>
        </g>
      ) : outcome !== "pending" ? (
        <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          {[-30, -15, 0, 15, 30].map((y) => (
            <path
              key={y}
              d={`M 66 ${y} q 8 -6 16 0 t 16 0 t 16 0 t 16 0`}
            />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
