import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "../components/Mail/Wordmark";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Postmen is, how it sends your requests, and what it stores.",
  alternates: { canonical: "/about" },
};

const FACTS = [
  {
    term: "How a request travels",
    text: "Your browser posts the method, address, headers and body to a Next.js route handler. The server sends the real request, reads the whole response, times it, and returns it to you. Because the server sends it, browser CORS rules don't apply.",
  },
  {
    term: "What gets stored",
    text: "When you're signed in, each request and its full response, body included, is saved to your outbox in MongoDB. Delete one or all of them from the outbox at any time. Requests sent while signed out are not stored.",
  },
  {
    term: "Accounts",
    text: "Sign up with email and a password (hashed with bcrypt) or with Google. Sessions use JSON Web Tokens.",
  },
  {
    term: "Tested",
    text: "Playwright covers the landing page, sign-in and the workbench.",
  },
];

export default function About() {
  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <Wordmark />
          <nav className="topbar-nav" aria-label="Main">
            <Link href="/" className="btn btn-quiet">
              Send a request
            </Link>
          </nav>
        </div>
      </header>
      <main className="band-inner" style={{ maxWidth: "52rem", display: "grid", gap: "3rem" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <h1 className="section-title">About Postmen</h1>
          <p style={{ fontSize: "1.15rem", maxWidth: "40rem" }}>
            Postmen is a browser-based API client built by Arshpreet Singh, a full-stack developer in Mohali, Punjab.
            It started as a MERN clone of Postman and was rebuilt on Next.js.
          </p>
        </div>
        <section aria-labelledby="mission" style={{ display: "grid", gap: "0.75rem" }}>
          <h2 id="mission" style={{ fontWeight: 800, fontSize: "1.4rem" }}>
            Our mission
          </h2>
          <p style={{ maxWidth: "40rem" }}>
            Make the everyday job of poking an API quick and legible: one line for the address, the response beside
            the request, and a postmark that tells you in one glance whether it arrived and how long it took.
          </p>
        </section>
        <dl className="read-list" style={{ gap: "1.5rem" }}>
          {FACTS.map((f) => (
            <div key={f.term} style={{ borderTop: "1px solid var(--rule)", paddingTop: "1rem" }}>
              <dt>{f.term}</dt>
              <dd style={{ maxWidth: "40rem" }}>{f.text}</dd>
            </div>
          ))}
        </dl>
        <p>
          <a href="https://github.com/Arshpreet62/Postmen" style={{ fontWeight: 700, textUnderlineOffset: "3px" }}>
            Read the code on GitHub
          </a>
        </p>
      </main>
    </div>
  );
}
