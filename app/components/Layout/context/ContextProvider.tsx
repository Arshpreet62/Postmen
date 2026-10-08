"use client";

import { useCallback, useEffect, useState } from "react";
import { GlobalContext, type ContextType, type User } from "./Context";
import { apiUrl } from "../../../config/api";

interface Props {
  children: React.ReactNode;
}

// Storage can be blocked (private windows, strict settings); never let that
// crash the app.
const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

function parseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    return u && typeof u.email === "string" ? u : null;
  } catch {
    return null;
  }
}

// Seconds until the token expires, read from its payload (not verified
// here; the server does that).
function secondsLeft(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp - Date.now() / 1000 : Infinity;
  } catch {
    return 0;
  }
}

const toUser = (u: { _id?: string; id?: string; email: string; name?: string; avatar?: string }): User => ({
  id: String(u.id ?? u._id ?? ""),
  email: u.email,
  name: u.name || undefined,
  avatar: u.avatar || undefined,
});

export const ContextProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = useCallback((t: string, u: User) => {
    store.set("token", t);
    store.set("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    store.remove("token");
    store.remove("user");
  }, []);

  useEffect(() => {
    const stored = store.get("token");
    const storedUser = parseUser(store.get("user"));
    if (!stored || !storedUser || secondsLeft(stored) <= 0) {
      logout();
      setLoading(false);
      return;
    }
    setToken(stored);
    setUser(storedUser);

    (async () => {
      try {
        const res = await fetch(apiUrl("/api/auth/profile"), {
          headers: { Authorization: `Bearer ${stored}` },
        });
        // Only a definite "no" signs you out. A network error or a server
        // hiccup keeps the session for next time.
        if (res.status === 401 || res.status === 404) return logout();
        if (!res.ok) return;
        const data = await res.json();
        const u = toUser(data.user);
        setUser(u);
        store.set("user", JSON.stringify(u));

        // Swap a token that's about to run out for a fresh one.
        if (secondsLeft(stored) < 6 * 60 * 60) {
          const r = await fetch(apiUrl("/api/auth/refresh"), {
            method: "POST",
            headers: { Authorization: `Bearer ${stored}` },
          });
          if (r.ok) {
            const { token: fresh } = await r.json();
            if (fresh) signIn(fresh, u);
          }
        }
      } catch {
        // Offline: keep what we have.
      } finally {
        setLoading(false);
      }
    })();
  }, [logout, signIn]);

  const authRequest = async (path: string, body: unknown, fallback: string) => {
    const res = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || fallback);
    signIn(data.token, toUser(data.user));
  };

  const value: ContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login: (email, password, remember = false) =>
      authRequest("/api/auth/login", { email, password, remember }, "Sign-in failed."),
    loginWithGoogle: (credential) => authRequest("/api/auth/google", { credential }, "Google sign-in failed."),
    signup: (email, password) => authRequest("/api/auth/signup", { email, password }, "Sign-up failed."),
    logout,
    setUser,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};
