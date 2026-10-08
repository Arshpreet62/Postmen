# Postmen: code review fixes, new landing, redesign

A drop-in replacement for the `Postmen` repository (github.com/Arshpreet62/Postmen). Copy these files over a checkout, or diff them against `main`. No new packages: `package.json` and `package-lock.json` are unchanged.

**Before you deploy:** `JWT_SECRET` is now required. The old code fell back to a public default (`"your-default-secret"`), so anyone could sign their own tokens. If your deployment ever ran without the variable, set a new long random value and every existing session will be signed out.

---

## Round 2: code review and fixes

A full review found 2 critical, 3 high, 8 medium and 13 low-severity problems. All the critical and high ones are fixed, and most of the rest; the few left alone are listed at the end with the reason.

### Critical

| Problem | Fix |
|---|---|
| **The request proxy could read internal services.** `/api/request` fetched any URL for anyone, followed redirects blindly, and returned the full body. On a cloud host that exposes cloud metadata credentials (`169.254.169.254`, `metadata.google.internal`), the app's own API, and anything on the private network. Decimal IPs (`http://2130706433/`), `data:` URLs and redirect chains all got through. | New `app/lib/deliver.ts` sends with Node's `http`/`https` instead of `fetch`. Only `http:` and `https:`. Host names are resolved at connect time and refused if any address is private, loopback, link-local, CGNAT, multicast or reserved (IPv4 and IPv6, including IPv4-mapped, NAT64 and 6to4 forms), so DNS rebinding can't slip past. IP literals are checked directly. Redirects are followed by hand (5 at most), each hop checked again, and Authorization and Cookie headers are dropped when a redirect leaves the site. `ALLOW_PRIVATE_ADDRESSES=true` turns this off for local development. |
| **Forgeable sessions.** `app/lib/auth.ts` used `"your-default-secret"` when `JWT_SECRET` was missing. | The secret is read at call time and the server refuses to sign or verify without it (warns if it's under 32 characters). Tokens are pinned to HS256. |

### High

| Problem | Fix |
|---|---|
| No timeout and no size limit: one request for a huge or never-ending response could hold the server or run it out of memory. | 20-second limit for the whole round trip, bodies cut off at 5 MB (the UI says so). |
| A failed outbox save turned a delivered request into "Not delivered", then crashed with an empty 500. Invalid JSON, a missing URL or a lowercase method also gave 500s. | The request is validated first (400 with a readable message). Delivery and saving are separate: a storage failure only means "not saved". Bodies over 1 MB aren't stored, so no record hits MongoDB's 16 MB limit. |
| Expired sessions looked signed in: the dashboard showed your email while nothing loaded or saved, and `/login` bounced back to it. Any network hiccup also signed you out. | Only a 401/404 from the server signs you out. Tokens near expiry are refreshed. Outbox, statistics and sending all notice an expired token and send you to sign in with a note. Storage access can't crash the app. |

### Medium and low

- **Google sign-in** checks `email_verified` and no longer joins a Google login to an existing password account by email alone (that allowed pre-account takeover). The server falls back to `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- **Sign-in** gives one message for every failure and always runs bcrypt, so it doesn't reveal which emails have accounts. Rate limits on sign-in (per IP and per email), sign-up and sending (60 a minute per IP). The limiter is in memory, so on serverless it slows abuse rather than stopping it; `app/lib/rate-limit.ts` says where to plug in Redis.
- **Passwords:** 8 to 72 characters (bcrypt ignores anything past 72 bytes). Duplicate sign-ups return 409, not 500.
- **Refresh** can't extend a session past 30 days from the original sign-in.
- **Outbox:** index on `{ user, timestamp }`. The list no longer ships response bodies; opening an item fetches its full record. Paging values are clamped (`limit=0` used to return everything). Old entries with headers stored as `[{key, value}]` reopen correctly. A slow older load can't overwrite a newer one.
- **Statistics** are counted in MongoDB with one aggregation instead of loading every document with its body. Median fixed for even counts. "Delivered" now means 2xx or 3xx everywhere.
- **Responses:** size is the bytes that arrived (was wrong for binary bodies), binary bodies are described instead of garbled, gzip/deflate/brotli are decoded, several `Set-Cookie` headers are all kept, and a `User-Agent` is sent by default (GitHub's API refuses requests without one).
- **Dashboard:** switching to Statistics and back no longer loses unsent edits or restores an old request. Redirects use `replace`, so Back works.
- **Params table:** typing a value before its name, or retyping a name, no longer deletes the row.
- **Postmark** says "time not measured" for old entries instead of "not yet sent".
- Invalid ids return 404, not 500. MongoDB connection fails fast (8 s) with a smaller pool.
- **Config:** `.env.local.example` lists every variable, `.gitignore` ignores `.env`, Playwright starts the app itself and retries on CI, and `tsconfig` now type-checks `components/`, `lib/` and `tests/`.

### Not changed, on purpose

- Saved requests keep their headers, including `Authorization`, so they can be resent. Redacting them would break resending; encrypting them needs a key you manage.
- Sign-up still says when an email already has an account (it's rate-limited now). Hiding it properly needs email verification.
- There's no server-side session revocation (it would need a token version on each user). Sessions end at expiry, and refresh stops at 30 days.
- Unused packages (`dotenv`, `@radix-ui/react-select`, `lucide-react`) and the missing ESLint config were left alone so the lockfile stays as it is.

---

## Round 2: new landing page

- **Hero, "the sorting office at night":** airmail envelopes fly out of the dark toward you in a slow spiral, and each is postmarked on the way (a blue ring when delivered, a red box when returned). Drawn on a canvas in code, no video. It pauses when off screen or in a background tab, has a Pause button, and shows a single still frame under reduced motion. Always dark, in both themes.
- **The workbench overlaps the hero** inside an airmail-bordered card, so the first screen still sends a real request.
- **"What happens when you press Send":** pins while you scroll and moves an envelope through the four real legs (browser, Postmen server, host, back), with a stopwatch that runs only while the server is timing. On phones and with reduced motion it's a still diagram, stacked vertically on narrow screens.
- **Closing band:** a rail of status-code stamps that moves only as you scroll past it, and a last call to send one.
- Higgsfield stills were generated for the hero, but this sandbox can't download files from Higgsfield's storage host, so the hero is built in code instead.

## Round 2: workbench

- **Paste a cURL command** into the address bar (from API docs or a browser's "Copy as cURL") and it fills the method, address, headers and body. Handles `-X`, `-H`, `-d`/`--data-raw`/`--json`, `-u`, `-G`, `$'…'` quoting and line continuations.
- **Copy as cURL** next to the fetch snippet.
- **Coloured JSON** responses (keys, strings, numbers, true/false/null), plain text past 200 KB.
- **Format JSON** button for the request body.
- **Drafts:** the unsent request is kept in this browser between visits.
- Tabs move with the arrow keys, Home and End.

---

## Round 1: the redesign

Every request is a piece of mail. The URL is the address and the headers are the envelope. The response comes back with a round postmark: host on the top arc, status code and send time in the centre, round-trip time and size on the bottom arc. Wavy lines mean delivered; a red "Return to sender" box means a 4xx or 5xx; "Not delivered" means the address couldn't be reached. A red and blue airmail stripe runs under the address bar while a request is in flight.

- Light theme: airmail paper, ink and airmail red/blue (OKLCH tokens in `app/globals.css`). Dark theme: the sorting office at night, a blue-grey rather than black.
- Type: Recursive for the UI (its MONO axis for code), Big Shoulders Stencil for postmarks and headlines.
- `app/components/Mail/`: `Workbench`, `Postmark`, `Outbox`, `Tally`, `Wordmark`. `app/lib/mail.ts`: shared helpers.
- Round 1 also fixed: headers from the form never reached the target, your `Content-Type` was overwritten, string bodies were JSON-encoded twice.
- Removed claims that weren't true ("100+ operators, 10k runs a month, 99.9% uptime", "sub-100ms analysis", "zero response persistence").

## Checked

- `tsc --noEmit` and `next build` pass.
- Playwright: 27 of 27 pass. 18 are new, including private-address blocking (loopback, decimal IP, cloud metadata, IPv6, IPv4-mapped), non-web schemes, bad input returning 400, forged tokens, cURL import, the params fix and view switching.
- The delivery code was run against a local test server: headers and body forwarded, redirects (POST becomes GET on 302), the 5 MB cut-off, the 20-second timeout, binary and gzip bodies, two `Set-Cookie` headers, refused connections, unknown hosts and invalid header names.
- Project design QA harness at 320 to 1440 px, light and dark: 0 errors, 0 warnings on `/`, `/about`, `/login`, `/signup`, `/dashboard`.

## Not checked here

- A real MongoDB and Google sign-in (no database or credentials in the sandbox). The aggregation in `app/api/stats/route.ts` and the index are untested against a live database. Outbox and statistics screenshots use stubbed API routes.
- Requests to outside APIs are blocked in the sandbox, so screenshots of external responses replay recorded ones.

## Deploy

Set `MONGO_URI` and a new `JWT_SECRET` (and the Google client IDs if used) on Vercel. Don't set `ALLOW_PRIVATE_ADDRESSES` there. The index on the outbox is created by Mongoose on first connect.
