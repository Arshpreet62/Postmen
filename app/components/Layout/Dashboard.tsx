"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGlobal } from "./context/Context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Workbench from "../Mail/Workbench";
import Outbox from "../Mail/Outbox";
import Tally from "../Mail/Tally";
import Wordmark from "../Mail/Wordmark";
import type { Delivery } from "@/app/lib/mail";

type View = "bench" | "tally";

const Dashboard: React.FC = () => {
  const { user, token, logout } = useGlobal();
  const router = useRouter();
  const [view, setView] = useState<View>("bench");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Delivery | null>(null);

  const signOut = () => {
    logout();
    router.push("/");
  };

  // The saved sign-in ran out: drop it and ask for a fresh one.
  const expired = useCallback(() => {
    logout();
    router.replace("/login?expired=1");
  }, [logout, router]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <a href="#bench" className="skip-link">
        Skip to the workbench
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <Wordmark />
            <nav aria-label="Views" className="tabs">
              <button type="button" className="tab" aria-current={view === "bench" ? "page" : undefined} onClick={() => setView("bench")}>
                Workbench
              </button>
              <button type="button" className="tab" aria-current={view === "tally" ? "page" : undefined} onClick={() => setView("tally")}>
                Statistics
              </button>
            </nav>
          </div>
          <div className="topbar-nav">
            {user ? (
              <span className="hint hidden md:inline" title="Signed in">
                {user.email}
              </span>
            ) : (
              <Link href="/login" className="btn btn-quiet">
                Sign in
              </Link>
            )}
            <ThemeToggle />
            {user && (
              <button type="button" className="btn btn-quiet" onClick={signOut}>
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="bench" className="desk" tabIndex={-1}>
        {/* The workbench stays mounted while Statistics is open, so switching
            views never loses an unsent edit or the last response. */}
        <div className="desk-main" hidden={view !== "bench"}>
          <h1 className="sr-only">Workbench</h1>
          <Workbench
            token={token}
            initialUrl="https://jsonplaceholder.typicode.com/posts/1"
            loaded={loaded}
            persistDraft
            onSessionExpired={expired}
            onDelivered={() => {
              setSelectedId(null);
              setRefreshKey((k) => k + 1);
            }}
          />
        </div>
        <aside className="desk-rail" aria-label="Outbox" hidden={view !== "bench"}>
          {token ? (
            <Outbox
              token={token}
              refreshKey={refreshKey}
              selectedId={selectedId}
              onUnauthorized={expired}
              onSelect={(id, d) => {
                setSelectedId(id);
                setLoaded(d);
              }}
            />
          ) : (
            <div style={{ display: "grid", gap: "0.6rem" }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Outbox</h2>
              <p className="hint">
                Requests you send while signed in are kept here with their postmarks, so you can reopen and resend
                them.
              </p>
              <Link href="/signup" className="btn" style={{ justifySelf: "start" }}>
                Keep an outbox
              </Link>
            </div>
          )}
        </aside>
        {view === "tally" && (
          <div className="desk-wide">
            <h1 style={{ fontWeight: 850, fontSize: "1.1rem", marginBottom: "1.5rem" }}>Statistics</h1>
            {token ? (
              <Tally token={token} refreshKey={refreshKey} onUnauthorized={expired} />
            ) : (
              <p className="hint">
                <Link href="/login">Sign in</Link> to see counts by method and status code for everything you&apos;ve sent.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
