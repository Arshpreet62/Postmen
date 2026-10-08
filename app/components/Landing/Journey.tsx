"use client";

import React, { useEffect, useRef, useState } from "react";

// What actually happens when you press Send, told as a letter's round trip.
// On wide screens with motion allowed, the section pins and scrolling moves
// the envelope along each leg. Otherwise it is a still diagram and a list.

const STEPS = [
  {
    title: "You press Send",
    body: "Your browser posts the method, address, headers and body to Postmen's own server. Nothing goes from your browser straight to the host.",
  },
  {
    title: "Postmen sends it on",
    body: "The server makes the request itself, so the host's CORS rules don't get in the way. The clock starts here. Addresses on private networks are refused, and it gives up after 20 seconds.",
  },
  {
    title: "The host answers",
    body: "Status, headers and body come back. The clock stops when the last byte of the body arrives, and the body is weighed.",
  },
  {
    title: "Stamped and filed",
    body: "The response comes back to your browser with its postmark. If you're signed in, a copy goes into your outbox.",
  },
];

// Stations and the four legs between them, in SVG units: side by side on
// wide screens, stacked on phones so the labels stay readable.
type Geo = {
  viewBox: string;
  at: Record<"browser" | "server" | "host" | "clock", [number, number]>;
  legs: [number, number, number, number][];
  num: [number, number][];
};
const WIDE: Geo = {
  viewBox: "30 64 840 256",
  at: { browser: [120, 206], server: [450, 206], host: [780, 206], clock: [450, 104] },
  legs: [
    [190, 150, 380, 150],
    [520, 150, 710, 150],
    [710, 262, 520, 262],
    [380, 262, 190, 262],
  ],
  num: [[0, -26], [0, -26], [0, 30], [0, 30]],
};
const TALL: Geo = {
  viewBox: "20 20 360 590",
  at: { browser: [200, 80], server: [200, 300], host: [200, 510], clock: [300, 290] },
  legs: [
    [165, 172, 165, 245],
    [165, 390, 165, 452],
    [235, 452, 235, 390],
    [235, 245, 235, 172],
  ],
  num: [[-26, 0], [-26, 0], [28, 0], [28, 0]],
};
const LEGS = WIDE.legs;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export default function Journey() {
  const rootRef = useRef<HTMLElement>(null);
  const legRefs = useRef<(SVGPathElement | null)[]>([]);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const envRef = useRef<SVGGElement>(null);
  const handRef = useRef<SVGLineElement>(null);
  const markRef = useRef<SVGGElement>(null);
  const [tall, setTall] = useState(false);
  const geo = tall ? TALL : WIDE;

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 599px)");
    const sync = () => setTall(narrow.matches);
    sync();
    narrow.addEventListener("change", sync);
    return () => narrow.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 900px) and (min-height: 680px)");
    let raf = 0;

    const paint = (p: number | null) => {
      const scroll = p !== null;
      root.dataset.mode = scroll ? "scroll" : "still";
      const at = scroll ? p * LEGS.length : LEGS.length;
      const step = Math.min(LEGS.length - 1, Math.floor(at));
      LEGS.forEach((_, i) => {
        // Each leg travels for the first 70% of its share, then dwells.
        const lp = clamp((at - i) / 0.7);
        const leg = legRefs.current[i];
        if (leg) leg.style.strokeDashoffset = String(1 - lp);
        const li = stepRefs.current[i];
        if (!li) return;
        if (scroll && i === step) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
        li.dataset.done = String(scroll && i < step);
      });
      const env = envRef.current;
      if (env && scroll) {
        const [x1, y, x2] = LEGS[step];
        const lp = clamp((at - step) / 0.7);
        const x = x1 + (x2 - x1) * lp;
        const hop = Math.sin(lp * Math.PI) * -18;
        env.setAttribute("transform", `translate(${x} ${y + hop}) rotate(${(x2 > x1 ? 1 : -1) * Math.sin(lp * Math.PI) * 6})`);
        env.dataset.stamped = String(step >= 2);
      }
      // The clock runs from the moment the server sends until the body is in.
      const clock = clamp((at - 1) / 1.7);
      handRef.current?.setAttribute("transform", `rotate(${clock * 360 * 2})`);
      root.dataset.clock = clock > 0 && clock < 1 ? "running" : clock >= 1 ? "stopped" : "idle";
      markRef.current?.setAttribute("data-shown", String(!scroll || at >= LEGS.length - 0.3));
    };

    const update = () => {
      raf = 0;
      if (still.matches || !wide.matches) return paint(null);
      const r = root.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      paint(total > 0 ? clamp(-r.top / total) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    still.addEventListener("change", onScroll);
    wide.addEventListener("change", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      still.removeEventListener("change", onScroll);
      wide.removeEventListener("change", onScroll);
    };
  }, []);

  return (
    <section ref={rootRef} className="journey" data-mode="still" aria-labelledby="journey-title">
      <div className="journey-pin">
        <div className="journey-inner">
          <div className="journey-copy">
            <h2 id="journey-title" className="section-title">
              What happens when you press Send
            </h2>
            <ol className="journey-steps">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                >
                  <span className="journey-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <svg className="journey-scene" data-shape={tall ? "tall" : "wide"} viewBox={geo.viewBox} role="img" aria-labelledby="journey-svg-title">
            <title id="journey-svg-title">
              A request travels from your browser to the Postmen server, on to the host, and back the same way.
            </title>
            <defs>
              <pattern id="jr-chev" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="4" height="12" fill="var(--red)" />
                <rect x="6" width="4" height="12" fill="var(--blue)" />
              </pattern>
              <marker id="jr-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" className="jr-arrow" />
              </marker>
            </defs>

            {/* Legs: a faint guide under a solid line that draws in as you scroll. */}
            {geo.legs.map(([x1, y1, x2, y2], i) => (
              <g key={i}>
                <path d={`M ${x1} ${y1} L ${x2} ${y2}`} className="jr-guide" markerEnd="url(#jr-head)" />
                <path
                  ref={(el) => {
                    legRefs.current[i] = el;
                  }}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  pathLength={1}
                  className="jr-leg"
                />
                <g transform={`translate(${(x1 + x2) / 2 + geo.num[i][0]} ${(y1 + y2) / 2 + geo.num[i][1]})`} className="jr-num">
                  <circle r="13" />
                  <text dy="0.35em">{i + 1}</text>
                </g>
              </g>
            ))}

            {/* Your browser */}
            <g transform={`translate(${geo.at.browser.join(" ")})`} className="jr-station">
              <rect x="-62" y="-50" width="124" height="96" rx="6" />
              <line x1="-62" y1="-30" x2="62" y2="-30" />
              <circle cx="-48" cy="-40" r="3.5" />
              <circle cx="-36" cy="-40" r="3.5" />
              <rect x="-44" y="-16" width="88" height="14" rx="2" className="jr-fill" />
              <rect x="-44" y="6" width="56" height="6" rx="1" className="jr-fill" />
              <rect x="-44" y="18" width="70" height="6" rx="1" className="jr-fill" />
              <g ref={markRef} className="jr-inbox-mark" data-shown="true" transform="translate(40 8) rotate(-12)">
                <circle r="17" />
                <circle r="11" />
              </g>
              <text y="78" className="jr-label">Your browser</text>
            </g>

            {/* Postmen's server: a pillar box */}
            <g transform={`translate(${geo.at.server.join(" ")})`} className="jr-station jr-postbox">
              <path d="M -46 46 L -46 -22 A 46 40 0 0 1 46 -22 L 46 46 Z" />
              <rect x="-26" y="-18" width="52" height="7" rx="3" className="jr-slot" />
              <line x1="-46" y1="4" x2="46" y2="4" />
              <text y="30" className="jr-mark">POSTMEN</text>
              <text y="78" className="jr-label">Postmen server</text>
            </g>

            {/* The clock that times the round trip */}
            <g transform={`translate(${geo.at.clock.join(" ")})`} className="jr-clock">
              <rect x="-4" y="-27" width="8" height="6" rx="1" />
              <circle r="19" />
              <line ref={handRef} x1="0" y1="0" x2="0" y2="-13" className="jr-hand" />
              <circle r="2.5" className="jr-pin" />
            </g>

            {/* The host */}
            <g transform={`translate(${geo.at.host.join(" ")})`} className="jr-station">
              <rect x="-52" y="-50" width="104" height="28" rx="4" />
              <rect x="-52" y="-16" width="104" height="28" rx="4" />
              <rect x="-52" y="18" width="104" height="28" rx="4" />
              <circle cx="34" cy="-36" r="4" className="jr-led" />
              <circle cx="34" cy="-2" r="4" className="jr-led" />
              <circle cx="34" cy="32" r="4" className="jr-led" />
              <text y="78" className="jr-label">The host</text>
            </g>

            {/* The envelope, only in scroll mode */}
            <g ref={envRef} className="jr-envelope" data-stamped="false" transform={`translate(${LEGS[0][0]} ${LEGS[0][1]})`}>
              <g transform="scale(1.5) translate(-26 -18)">
                <rect width="52" height="36" rx="2" fill="url(#jr-chev)" />
                <rect x="4" y="4" width="44" height="28" fill="#eef2f7" />
                <path d="M 4 4 L 26 20 L 48 4" fill="none" stroke="rgba(26,34,51,.3)" strokeWidth="1.5" />
                <g className="jr-ring">
                  <circle cx="38" cy="13" r="8" fill="none" stroke="#2d50a8" strokeWidth="2" />
                  <path d="M 10 11 q 3 -3 6 0 t 6 0 M 10 16 q 3 -3 6 0 t 6 0" fill="none" stroke="#2d50a8" strokeWidth="1.6" />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
