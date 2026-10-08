"use client";

import React, { useEffect, useRef } from "react";

// Marks its box data-inview="true" the first time it scrolls into view, so
// CSS can play a one-off entrance (a postmark stamping down, say).
export default function InView({
  as: Tag = "div",
  className,
  children,
}: {
  as?: "div" | "figure";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.inview = "true";
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return React.createElement(Tag, { ref, className, "data-inview": "false" }, children);
}
