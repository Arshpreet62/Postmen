"use client";

import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const storageKey = "postmen-theme";

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

const getPreferredTheme = (): Theme => {
  const stored = localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preferred = getPreferredTheme();
    setTheme(preferred);
    applyTheme(preferred);
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(storageKey, next);
    applyTheme(next);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="border-border/60 bg-background/70"
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {theme === "dark" ? <FaSun size={16} /> : <FaMoon size={16} />}
    </Button>
  );
};
