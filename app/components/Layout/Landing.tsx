"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGlobal } from "./context/Context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Workbench, { type Preset } from "../Mail/Workbench";
import Postmark from "../Mail/Postmark";
import Wordmark from "../Mail/Wordmark";
import SortingStream from "../Landing/SortingStream";
import Journey from "../Landing/Journey";
import InView from "../Landing/InView";

const PRESETS: Preset[] = [
  { label: "A post from JSONPlaceholder", method: "GET", url: "https://jsonplaceholder.typicode.com/posts/1" },
  { label: "A GitHub profile", method: "GET", url: "https://api.github.com/users/Arshpreet62" },
  {
    label: "Create a post",
    method: "POST",
    url: "https://jsonplaceholder.typicode.com/posts",
    body: '{\n  "title": "Hello from Postmen",\n  "userId": 1\n}',
  },
  { label: "A 404", method: "GET", url: "https://httpbin.org/status/404" },
];

// A sample postmark for the explainer. Clearly an example: fixed values.
const SAMPLE = {
  status: 200,
  statusText: "OK",
  url: "https://jsonplaceholder.typicode.com/posts/1",
  sentAt: "2026-09-29T08:41:00",
  durationMs: 143,
  sizeBytes: 292,
};

// Decorative rail for the closing band: real status codes, nothing more.
const CODES: [number, string][] = [
  [200, "OK"],
  [201, "Created"],
  [204, "No Content"],
  [301, "Moved"],
  [304, "Not Modified"],
  [400, "Bad Request"],
  [401, "Unauthorized"],
  [404, "Not Found"],
  [418, "I'm a teapot"],
  [429, "Too Many"],
  [500, "Server Error"],
  [503, "Unavailable"],
];

const Landing: React.FC = () => {
  const { isAuthenticated, user, loading } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) router.replace("/dashboard");
  }, [loading, isAuthenticated, user, router]);

  return (
    <div className="landing">
      <a href="#try" className="skip-link">
        Skip to the request
      </a>
      <header className="topbar topbar-over night">
        <div className="topbar-inner">
          <Wordmark />
          <nav className="topbar-nav" aria-label="Main">
            <Link href="/about" className="btn btn-quiet hidden sm:inline-flex">
              About
            </Link>
            <Link href="/login" className="btn btn-quiet hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/signup" className="btn">
              Keep an outbox
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-night night" aria-labelledby="hero-title">
          <SortingStream />
          <div className="hero-scrim" aria-hidden="true" />
          <div className="hero-copy">
            <h1 id="hero-title" className="hero-title">
              <span>Send a request.</span>
              <span>Get a postmark.</span>
            </h1>
            <p className="hero-offer">
              Postmen is an API client that runs in your browser. Paste an address, press Send, and read the
              response, its headers and how long the round trip took. Sign in and every request is kept in your
              outbox.
            </p>
            <div className="hero-cta">
              <a href="#try" className="btn btn-lit">
                Send one now
              </a>
              <Link href="/signup" className="btn btn-quiet">
                Keep an outbox
              </Link>
            </div>
          </div>
        </section>

        <section id="try" className="try" tabIndex={-1} aria-label="Try a request">
          <div className="try-card">
            <Workbench variant="landing" initialUrl={PRESETS[0].url} presets={PRESETS} />
          </div>
        </section>

        <Journey />

        <section className="band" aria-labelledby="read-title">
          <div className="band-inner read-grid">
            <div>
              <h2 id="read-title" className="section-title">
                Reading a postmark
              </h2>
              <p className="section-lede">
                Every response is stamped with what you need to judge it at a glance. This one is an example.
              </p>
            </div>
            <InView as="figure" className="read-figure">
              <Postmark {...SAMPLE} tilt={-6} className="postmark-large" />
              <figcaption className="sr-only">Example postmark for a 200 response</figcaption>
            </InView>
            <dl className="read-list">
              <div>
                <dt>Top arc</dt>
                <dd>The host the request went to.</dd>
              </div>
              <div>
                <dt>Centre</dt>
                <dd>The status code and when it was sent, in your time zone.</dd>
              </div>
              <div>
                <dt>Bottom arc</dt>
                <dd>
                  Round-trip time and body size, both measured on the Postmen server from the moment it sends your
                  request until the whole body has arrived.
                </dd>
              </div>
              <div>
                <dt>Wavy lines or a box</dt>
                <dd>
                  Lines mean delivered (2xx) or redirected (3xx). A red &ldquo;Return to sender&rdquo; box means a
                  4xx or 5xx, and &ldquo;Not delivered&rdquo; means the address couldn&apos;t be reached.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="band band-plain" aria-labelledby="keep-title">
          <div className="band-inner keep-grid">
            <h2 id="keep-title" className="section-title">
              Signed in, you also get
            </h2>
            <ul className="keep-list">
              <li>
                <b>An outbox.</b> Every request with its response and postmark. Open one to resend or edit it, filter
                by delivered or returned, delete one or all.
              </li>
              <li>
                <b>Statistics.</b> Counts by method and by status code, your success rate, and the median round trip.
              </li>
              <li>
                <b>Email or Google sign-in.</b> Passwords are hashed with bcrypt; sessions use JSON Web Tokens.
              </li>
            </ul>
            <p className="hint keep-note">
              Your outbox stores responses, bodies included, in MongoDB until you delete them. Requests sent while
              signed out are not stored.
            </p>
          </div>
        </section>

        <section className="finale night" aria-labelledby="finale-title">
          <div className="code-rail" aria-hidden="true">
            <ul className="code-rail-track">
              {[...CODES, ...CODES].map(([code, text], i) => (
                <li key={i} data-outcome={code >= 400 ? "returned" : "delivered"}>
                  <b>{code}</b>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="band-inner finale-inner">
            <h2 id="finale-title" className="finale-title">
              Go on, send one.
            </h2>
            <div className="hero-cta">
              <a href="#try" className="btn btn-lit">
                Back to the address bar
              </a>
              <Link href="/signup" className="btn btn-quiet">
                Keep an outbox
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <div className="band-inner foot-grid">
          <p>
            Postmen is built by Arshpreet Singh with Next.js route handlers, MongoDB and Playwright. Requests are sent
            from the server, so browser CORS rules don&apos;t block them.
          </p>
          <nav aria-label="Footer" style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            <a href="https://github.com/Arshpreet62/Postmen">Read the code on GitHub</a>
            <Link href="/about">About</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
