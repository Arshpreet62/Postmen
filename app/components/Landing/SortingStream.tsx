"use client";

import React, { useEffect, useRef, useState } from "react";

// The night sorting office: airmail envelopes stream out of the dark like
// requests in flight. Halfway along, each one is postmarked: blue rings for
// delivered, red boxes for returned. Canvas 2D, pre-rendered sprites, paused
// off screen and in hidden tabs, one still frame under reduced motion.

const PAPER = "#eef2f7";
const RED = "#c7352c";
const BLUE = "#2d50a8";
const INK_LINE = "rgba(26, 34, 51, 0.16)";

type Variant = "plain" | "delivered" | "returned";

type Envelope = {
  ang: number;
  rad: number;
  z: number;
  speed: number;
  spin: number;
  phase: number;
  stampZ: number;
  outcome: Exclude<Variant, "plain">;
  stamped: boolean;
};

type Flash = { x: number; y: number; r: number; life: number; color: string };

// Envelopes live in a tunnel around the vanishing point and fly toward the
// viewer (z shrinks), spiralling a little as they come. Screen position is
// the usual perspective divide.
const FAR = 7;
const NEAR = 0.3;

function makeSprite(variant: Variant): HTMLCanvasElement {
  const w = 300, h = 200, band = 16;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = PAPER;
  g.fillRect(0, 0, w, h);

  // Airmail chevrons, clipped to the border band.
  g.save();
  g.beginPath();
  g.rect(0, 0, w, h);
  g.rect(band, band, w - band * 2, h - band * 2);
  g.clip("evenodd");
  for (let x = -h; x < w + h; x += 40) {
    g.fillStyle = RED;
    g.beginPath();
    g.moveTo(x, h);
    g.lineTo(x + 14, h);
    g.lineTo(x + 14 + h, 0);
    g.lineTo(x + h, 0);
    g.fill();
    g.fillStyle = BLUE;
    g.beginPath();
    g.moveTo(x + 20, h);
    g.lineTo(x + 34, h);
    g.lineTo(x + 34 + h, 0);
    g.lineTo(x + 20 + h, 0);
    g.fill();
  }
  g.restore();

  // Flap fold and a few address lines with no legible text.
  g.strokeStyle = INK_LINE;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(band, band);
  g.lineTo(w / 2, h * 0.52);
  g.lineTo(w - band, band);
  g.stroke();
  g.fillStyle = "rgba(26, 34, 51, 0.22)";
  [0, 1, 2].forEach((i) => g.fillRect(w * 0.36, h * 0.62 + i * 14, w * (0.42 - i * 0.08), 5));

  if (variant !== "plain") {
    const color = variant === "delivered" ? BLUE : RED;
    const cx = w * 0.72, cy = h * 0.34, r = h * 0.2;
    g.strokeStyle = color;
    g.lineWidth = 5;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    g.stroke();
    if (variant === "delivered") {
      g.lineWidth = 3.5;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        const y = cy + i * 9;
        g.moveTo(cx - r * 2.3, y);
        for (let k = 0; k < 4; k++) {
          g.quadraticCurveTo(cx - r * 2.3 + k * 16 + 8, y - 6, cx - r * 2.3 + k * 16 + 16, y);
        }
        g.stroke();
      }
    } else {
      g.lineWidth = 4;
      g.strokeRect(cx - r * 2.7, cy - 14, r * 1.5, 28);
    }
  }
  return c;
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function spawn(z = FAR): Envelope {
  // Keep traffic off the left, where the headline sits: fan out up, right
  // and down, with a few dropping away under the fold.
  const ang = Math.random() < 0.88 ? rand(-1.75, 0.9) : rand(0.9, 2.0);
  return {
    ang,
    rad: rand(0.35, 1.5),
    z,
    speed: rand(0.8, 1.25),
    spin: rand(-0.9, 0.9),
    phase: rand(0, Math.PI * 2),
    stampZ: rand(1.6, 2.6),
    outcome: Math.random() < 0.18 ? "returned" : "delivered",
    stamped: false,
  };
}

export default function SortingStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const sprites: Record<Variant, HTMLCanvasElement> = {
      plain: makeSprite("plain"),
      delivered: makeSprite("delivered"),
      returned: makeSprite("returned"),
    };

    let w = 0, h = 0, dpr = 1;
    const COUNT = 64;
    // Pre-warm so the very first frame is already full.
    const envelopes: Envelope[] = Array.from({ length: COUNT }, () => {
      const e = spawn(rand(NEAR + 0.2, FAR));
      e.stamped = e.z < e.stampZ;
      return e;
    });
    const flashes: Flash[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Vanishing point: right of the headline on wide screens, low on phones.
    const vp = () => (w >= 900 ? { x: w * 0.8, y: h * 0.42 } : { x: w * 0.7, y: h * 0.8 });

    const place = (e: Envelope, z = e.z) => {
      const f = Math.min(w, h) * 0.42;
      const a = e.ang + 0.3 / z;
      const { x: cx, y: cy } = vp();
      return {
        x: cx + (Math.cos(a) * e.rad * f) / z,
        y: cy + (Math.sin(a) * e.rad * 0.78 * f) / z,
        size: (Math.min(w, h) * 0.13) / z,
      };
    };

    const draw = (time: number) => {
      // Night sky of the sorting hall, lit from the vanishing point.
      const { x: cx, y: cy } = vp();
      ctx.fillStyle = "#121927";
      ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
      glow.addColorStop(0, "rgba(130, 160, 230, 0.34)");
      glow.addColorStop(0.3, "rgba(70, 95, 160, 0.12)");
      glow.addColorStop(1, "rgba(18, 25, 39, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      envelopes.sort((a, b) => b.z - a.z);
      for (const e of envelopes) {
        const { x, y, size } = place(e);
        if (size < 2) continue;
        const sprite = sprites[e.stamped ? e.outcome : "plain"];
        const ew = size, eh = size * (2 / 3);
        const angle = e.spin * 0.5 + Math.sin(time / 1300 + e.phase) * 0.25 * e.spin;
        // Fade in from the far end, and dim with distance.
        const fog = Math.min(1, (FAR - e.z) / 1.5) * Math.min(1, 0.35 + 1.3 / e.z);
        // Motion streak behind the nearest envelopes.
        if (e.z < 2.2) {
          const back = place(e, e.z + 0.18);
          ctx.save();
          ctx.globalAlpha = 0.16 * fog;
          ctx.translate(back.x, back.y);
          ctx.rotate(angle);
          ctx.drawImage(sprite, -ew / 2, -eh / 2, ew, eh);
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha = fog;
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = Math.min(28, size * 0.1);
        ctx.shadowOffsetY = size * 0.04;
        ctx.drawImage(sprite, -ew / 2, -eh / 2, ew, eh);
        ctx.restore();
      }

      for (const f of flashes) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    const step = (dt: number) => {
      for (let i = 0; i < envelopes.length; i++) {
        const e = envelopes[i];
        e.z -= 0.62 * e.speed * dt;
        if (!e.stamped && e.z <= e.stampZ) {
          e.stamped = true;
          const { x, y, size } = place(e);
          flashes.push({ x, y, r: size * 0.35, life: 0.9, color: e.outcome === "delivered" ? "#8fb0ff" : "#ff8a7f" });
        }
        const { x, y, size } = place(e);
        const gone = x < -size || x > w + size || y < -size || y > h + size;
        if (e.z <= NEAR || gone) envelopes[i] = spawn();
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        flashes[i].r += 110 * dt;
        flashes[i].life -= 1.5 * dt;
        if (flashes[i].life <= 0) flashes.splice(i, 1);
      }
    };

    resize();
    draw(0);

    let raf = 0;
    let last = 0;
    let visible = true;
    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || pausedRef.current || document.hidden) {
        last = time;
        return;
      }
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      step(dt);
      draw(time);
    };
    if (!mq.matches) raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="stream-canvas" aria-hidden="true" />
      {!reduced && (
        <button
          type="button"
          className="stream-toggle"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "Play animation" : "Pause animation"}
        </button>
      )}
    </>
  );
}
