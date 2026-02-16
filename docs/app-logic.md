# Postmen — Application Logic & Architecture

> Comprehensive documentation covering every part of the Postmen codebase:
> how it works, how the pieces connect, and the reasoning behind each decision.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Design System](#4-design-system)
5. [Authentication](#5-authentication)
6. [State Management (Context)](#6-state-management-context)
7. [API Routes](#7-api-routes)
8. [Database Layer](#8-database-layer)
9. [Pages & Layouts](#9-pages--layouts)
10. [UI Components](#10-ui-components)
11. [Dark Mode](#11-dark-mode)
12. [SEO & Metadata](#12-seo--metadata)
13. [Environment Variables](#13-environment-variables)
14. [Testing](#14-testing)
15. [Deployment Notes](#15-deployment-notes)

---

## 1. Project Overview

Postmen is a **full-stack API testing tool** (like Postman) built as a Next.js web application. It lets users:

- Send HTTP requests (GET, POST, PUT, DELETE, PATCH) to any URL
- View formatted responses with status, headers, and body
- Automatically save every request/response to a persistent history
- View statistics and analytics (success rates, method breakdowns, status code distributions)
- Authenticate via email/password or Google OAuth
- Switch between light and dark themes

---

## 2. Tech Stack

| Layer             | Technology                         | Version |
| ----------------- | ---------------------------------- | ------- |
| Framework         | Next.js (App Router)               | 15      |
| UI Library        | React                              | 19      |
| Language          | TypeScript                         | —       |
| Styling           | Tailwind CSS                       | v4      |
| Component Library | shadcn/ui                          | —       |
| Database          | MongoDB                            | —       |
| ODM               | Mongoose                           | 8.x     |
| Auth              | JWT (jsonwebtoken) + bcryptjs      | —       |
| OAuth             | Google OAuth (@react-oauth/google) | —       |
| Icons             | react-icons (Fa, Rx, Si sets)      | —       |
| Testing           | Playwright                         | —       |

---

## 3. Folder Structure

```
app/
├── globals.css              # Global styles, CSS design tokens, dark mode
├── layout.tsx               # Root layout (providers, metadata, theme script)
├── page.tsx                 # Landing page (renders Landing component)
├── opengraph-image.tsx      # Dynamic OG image generation
├── robots.ts                # robots.txt generation
├── sitemap.ts               # sitemap.xml generation
│
├── about/page.tsx           # About page (static, server component)
├── dashboard/page.tsx       # Dashboard page (client, auth-gated)
├── login/page.tsx           # Login page
├── signup/page.tsx          # Signup page
│
├── api/                     # API Route Handlers (server-side)
│   ├── auth/
│   │   ├── login/route.ts   # POST: email/password login
│   │   ├── signup/route.ts  # POST: create account
│   │   ├── google/route.ts  # POST: Google OAuth login
│   │   ├── profile/route.ts # GET: fetch current user
│   │   ├── refresh/route.ts # POST: refresh JWT
│   │   └── logout/route.ts  # POST: logout (clears cookie)
│   ├── request/route.ts     # POST: proxy an API request
│   ├── history/
│   │   ├── route.ts         # GET: paginated history, DELETE: clear all
│   │   └── [id]/route.ts    # DELETE: single history entry
│   └── stats/route.ts       # GET: aggregated statistics
│
├── components/
│   ├── Layout/              # Full-page layout components
│   │   ├── Landing.tsx      # Marketing homepage
│   │   ├── Dashboard.tsx    # Authenticated dashboard shell (tabs)
│   │   ├── Login.tsx        # Login form
│   │   ├── Signup.tsx       # Signup form with password strength
│   │   └── context/         # Global state management
│   │       ├── Context.ts       # Type definitions + useGlobal hook
│   │       ├── ContextProvider.tsx  # State + API calls
│   │       └── Providers.tsx    # GoogleOAuth + Context wrapper
│   └── UI/                  # Reusable UI components
│       ├── Form.tsx         # API request form builder
│       ├── ResponseDisplay.tsx  # Response viewer + code generator
│       ├── RequestHistory.tsx   # Paginated history grid + detail modal
│       └── Statics.tsx      # Statistics dashboard with animated counters
│
├── config/api.ts            # API URL helper
└── lib/                     # Server utilities
    ├── auth.ts              # JWT sign/verify/extract helpers
    ├── db.ts                # MongoDB connection (cached singleton)
    └── models.ts            # Mongoose schemas (User, RequestHistory)

components/ui/               # shadcn/ui primitives
├── button.tsx
├── card.tsx
├── input.tsx
├── separator.tsx
└── theme-toggle.tsx         # Dark/light mode toggle

lib/utils.ts                 # cn() utility for class merging
docs/app-logic.md            # This file
```

---

## 4. Design System

### 4.1 Color Palette

All colors are driven by **CSS custom properties** defined in `app/globals.css` inside `@layer base`, following the shadcn/ui convention of HSL values without the `hsl()` wrapper:

| Token                | Light                 | Dark           | Usage                                    |
| -------------------- | --------------------- | -------------- | ---------------------------------------- |
| `--primary`          | `158 100% 45%` (teal) | same           | Buttons, links, active states            |
| `--accent`           | `190 100% 50%` (cyan) | same           | Secondary highlights, gradient endpoints |
| `--background`       | `0 0% 98%`            | `0 0% 5%`      | Page background                          |
| `--foreground`       | `0 0% 8%`             | `0 0% 96%`     | Body text                                |
| `--card`             | `0 0% 100%`           | `0 0% 8%`      | Card surfaces                            |
| `--muted`            | `0 0% 92%`            | `0 0% 14%`     | Subtle backgrounds (inputs, badges)      |
| `--muted-foreground` | `0 0% 45%`            | `0 0% 60%`     | Secondary text, labels                   |
| `--border`           | `0 0% 86%`            | `0 0% 18%`     | All borders                              |
| `--destructive`      | `0 72% 52%`           | `0 62% 45%`    | Error states, delete buttons             |
| `--ring`             | `158 100% 45%`        | `190 100% 50%` | Focus rings                              |

Usage pattern in Tailwind classes:

```tsx
// Instead of hardcoded: "text-slate-900 dark:text-white"
// Use tokens:          "text-foreground"

// Instead of: "bg-indigo-600 hover:bg-indigo-700"
// Use:        "bg-primary hover:bg-primary/90"

// Gradient text (brand):
"bg-linear-to-r from-primary to-accent bg-clip-text text-transparent";
```

### 4.2 Typography

- **Primary font**: Space Grotesk (loaded via Google Fonts in globals.css)
- **Mono font**: IBM Plex Mono (for code blocks, API URLs, JSON)
- Both fonts are declared in the `body` and `code/pre` rules respectively.

### 4.3 Glass Effect

The `.glass` utility class creates a frosted-glass card effect:

```css
.glass {
  background: linear-gradient(
    160deg,
    hsl(var(--card) / 0.97),
    hsl(var(--muted) / 0.6)
  );
  border: 1px solid hsl(var(--border));
  box-shadow: 0 20px 45px rgba(2, 6, 23, 0.08);
}
```

Dark mode adjusts opacity and shadow intensity. Used on stat cards, history cards, and chart containers.

### 4.4 Component Library

Uses **shadcn/ui** for consistent primitives:

- `Button` — with variants: default, outline, ghost, destructive
- `Card` (+ CardHeader, CardTitle, CardDescription, CardContent) — for form containers
- `Input` — styled form inputs
- `Separator` — divider lines (used in login/signup "or" sections)

All shadcn components live in `components/ui/` and use the `cn()` utility from `lib/utils.ts` for conditional class merging.

---

## 5. Authentication

### 5.1 Flow Overview

```
┌─────────┐     POST /api/auth/login      ┌──────────┐
│  Client  │ ──────────────────────────── │  Server  │
│ (React)  │ ◄──── { token, user } ────── │ (Next.js)│
└─────────┘                                └──────────┘
     │                                          │
     │  localStorage.setItem("token", jwt)      │  bcrypt.compare(password, hash)
     │  localStorage.setItem("user", json)      │  signToken({ id, email }, "24h")
     │                                          │
     │  Every API call:                         │
     │  Authorization: Bearer <jwt>             │  getAuthFromRequest(req) → payload
```

### 5.2 Registration (`POST /api/auth/signup`)

1. Validate email format and password length (≥ 6 chars)
2. Check if email already exists
3. Hash password with `bcryptjs` (salt rounds = 10)
4. Create `User` document with `authProvider: "local"`
5. Sign JWT with user ID and email, return token + user object

### 5.3 Login (`POST /api/auth/login`)

1. Find user by email (case-insensitive, lowercase-normalized)
2. If user has no password (Google-only account) → error message
3. `bcrypt.compare()` the provided password against stored hash
4. Sign JWT; if `remember: true`, expires in 30 days instead of 24 hours
5. Return token + user object

### 5.4 Google OAuth (`POST /api/auth/google`)

1. Receive Google `credential` (ID token) from client-side `@react-oauth/google`
2. Decode the JWT to extract email, name, picture, Google sub ID
3. Find or create user:
   - If user with that email exists → update `googleId`, `authProvider`, `name`, `avatar`
   - If new → create user with `authProvider: "google"`, no password
4. Sign JWT and return token + user object

### 5.5 Profile (`GET /api/auth/profile`)

- Extract JWT from `Authorization: Bearer` header
- Verify token, look up user by ID
- Return user object (email, name, avatar)
- Used by `ContextProvider` on page load to validate stored token

### 5.6 Token Utilities (`app/lib/auth.ts`)

| Function                        | Purpose                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `signToken(payload, expiresIn)` | Creates JWT with `id` and `email`                                     |
| `verifyToken(token)`            | Verifies and decodes JWT, returns payload or null                     |
| `getAuthFromRequest(req)`       | Extracts Bearer token from request headers, verifies, returns payload |

JWT secret is from `process.env.JWT_SECRET`.

---

## 6. State Management (Context)

### 6.1 Architecture

```
Providers.tsx
  └── GoogleOAuthProvider (optional, if GOOGLE_CLIENT_ID is set)
      └── ContextProvider
          └── GlobalContext.Provider
              └── { children }  (entire app)
```

### 6.2 Context Shape (`ContextType`)

```typescript
interface ContextType {
  user: User | null; // Current authenticated user
  token: string | null; // JWT access token
  loading: boolean; // Initial auth check in progress
  isAuthenticated: boolean; // !!user && !!token
  login(email, password, remember?): Promise<void>;
  loginWithGoogle(credential): Promise<void>;
  signup(email, password): Promise<void>;
  logout(): void;
  responseData: ResponseData | null; // Last API response (for Form → ResponseDisplay)
  setResponseData(data): void;
  setUser(user): void;
}
```

### 6.3 Initialization Flow

1. On mount, `ContextProvider` reads `localStorage` for `token` and `user`
2. If found, sets local state and calls `fetchUser(token)` to validate
3. `fetchUser` calls `GET /api/auth/profile` — if 200, updates user; if error, clears localStorage
4. Sets `loading = false` when done

### 6.4 Response Data Flow

```
Form.tsx                    ContextProvider                ResponseDisplay.tsx
  │                              │                              │
  │  handleSubmit()              │                              │
  │  await fetch("/api/request") │                              │
  │  setResponseData(result) ──► │ responseData state updated   │
  │                              │ ──────────────────────────► re-render with data
```

The `responseData` state in context acts as a bridge: `Form` writes to it, `ResponseDisplay` reads from it. Both are rendered on the Dashboard "request" tab.

---

## 7. API Routes

### 7.1 Request Proxy (`POST /api/request`)

This is the core feature — it **proxies** API requests server-side:

1. Receive `{ url, method, headers, body }` from the client
2. Execute `fetch(url, { method, headers, body })` server-side
3. Read the response (JSON or text based on `Content-Type`)
4. If user is authenticated → save to `RequestHistory` collection
5. Return `{ request, response, savedToHistory }` to client

**Why proxy?** CORS. Browsers block cross-origin requests, but server-side fetch has no such restriction. The Next.js API route acts as a proxy to bypass CORS.

### 7.2 History (`/api/history`)

| Method | Endpoint                      | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/api/history?page=1&limit=6` | Paginated history for authenticated user |
| DELETE | `/api/history`                | Clear all history for authenticated user |
| DELETE | `/api/history/[id]`           | Delete single history entry              |

The GET endpoint returns:

```json
{
  "history": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRequests": 28,
    "limit": 6
  }
}
```

### 7.3 Statistics (`GET /api/stats`)

Aggregates the authenticated user's request history:

- `totalRequests` — count of all history entries
- `successfulRequests` — count where `response.status` is 2xx
- `failedRequests` — total minus successful
- `successRate` — percentage
- `methodBreakdown` — `{ GET: 15, POST: 8, ... }`
- `statusBreakdown` — `{ "200": 12, "404": 3, ... }`

---

## 8. Database Layer

### 8.1 Connection (`app/lib/db.ts`)

Uses a **cached singleton** pattern for MongoDB connections:

```typescript
let cached = global as any;
if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}
```

This prevents creating multiple connections during development (Next.js hot reloads). The connection is created once and reused across all API route invocations.

### 8.2 Models (`app/lib/models.ts`)

#### User Schema

| Field          | Type   | Notes                                    |
| -------------- | ------ | ---------------------------------------- |
| `email`        | String | Required, unique, lowercase              |
| `password`     | String | Optional (null for Google-only accounts) |
| `authProvider` | Enum   | `"local"` or `"google"`                  |
| `googleId`     | String | Google sub ID                            |
| `name`         | String | Display name (from Google)               |
| `avatar`       | String | Profile picture URL (from Google)        |
| `createdAt`    | Date   | Auto-set to `Date.now`                   |

#### RequestHistory Schema

| Field       | Type            | Notes                                   |
| ----------- | --------------- | --------------------------------------- |
| `user`      | ObjectId → User | Required, references User               |
| `endpoint`  | String          | The target URL                          |
| `method`    | Enum            | GET/POST/PUT/DELETE/PATCH               |
| `timestamp` | Date            | Auto-set to `Date.now`                  |
| `request`   | Mixed           | `{ headers, body }`                     |
| `response`  | Mixed           | `{ status, statusText, headers, body }` |

Both models use the `mongoose.models.X || mongoose.model()` pattern to prevent model recompilation errors during hot reload.

---

## 9. Pages & Layouts

### 9.1 Root Layout (`app/layout.tsx`)

- Sets `<html lang="en" suppressHydrationWarning>` — needed for class-based dark mode
- Inline `<script>` to read `localStorage("postmen-theme")` before paint (prevents flash of wrong theme)
- Wraps everything in `<Providers>` (Google OAuth + Context)
- Defines global metadata (title template, description, OpenGraph)

### 9.2 Landing Page (`app/page.tsx` → `Landing.tsx`)

Marketing homepage with:

- Sticky navbar with logo, nav links (Features, About), ThemeToggle, Login button
- Hero section with gradient text headline and CTA buttons
- Features grid (3 cards with shadcn Card component)
- Final CTA section
- Footer

### 9.3 Dashboard (`app/dashboard/page.tsx` → `Dashboard.tsx`)

Authenticated view with:

- Sticky header: logo, user email, ThemeToggle, logout button (shadcn Button)
- Tab navigation: **Make Request** | **History** | **Statistics**
- Each tab renders its respective component inside a card container

Auth guard: `ContextProvider` redirects to `/` if not authenticated.

### 9.4 Login / Signup Pages

Both follow the same pattern:

- Full-page layout with radial gradient background
- Centered shadcn Card with form
- ThemeToggle in card header (next to page label)
- Form with icon-adorned inputs (shadcn Input)
- "Remember me" / ToS checkbox
- Google OAuth button (conditionally rendered based on env var)
- Navigation link to the other form (sign up ↔ sign in)

**Signup extras**: Password strength meter (5 bars), confirm password with match indicator.

---

## 10. UI Components

### 10.1 Form (`app/components/UI/Form.tsx`)

The API request builder. Features:

- **URL input** with validation (checks with `new URL()`)
- **Method selector** — button grid with color-coded selection states
- **Quick templates** — pre-fill URLs (JSONPlaceholder, GitHub API)
- **Headers section** — key/value input pairs with add/remove (only shown for non-GET methods)
- **Body textarea** — JSON input with mono font (only for non-GET)
- **Submit button** — triggers the proxy request via `POST /api/request`

On submit:

1. Validates URL
2. Auto-adds `Content-Type: application/json` if not present
3. Calls the proxy API
4. Sets `responseData` in context (which triggers `ResponseDisplay` to render)

### 10.2 ResponseDisplay (`app/components/UI/ResponseDisplay.tsx`)

Renders the API response. Sections:

- **Status card** — colored by status code (green=2xx, yellow=4xx, red=5xx)
- **Request URL info** — method + full URL
- **Response headers** — expandable/collapsible accordion
- **Response body** — formatted JSON in dark code block
- **Fetch code generator** — generates `fetch()` JavaScript code with copy button

### 10.3 RequestHistory (`app/components/UI/RequestHistory.tsx`)

Paginated grid of saved requests:

- 3-column grid (responsive: 1→2→3 columns)
- Each card shows: method badge, status badge, URL, timestamp
- Hover reveals View/Delete action buttons
- Click opens a **modal** with full `ResponseDisplay` for that request
- Pagination controls at bottom (numbered pages)
- "Clear All" button to delete entire history

### 10.4 Statistics (`app/components/UI/Statics.tsx`)

Analytics dashboard:

- **4 stat cards** — Total Requests, Successful, Failed, Success Rate
  - Each has animated counter (counts up from 0 using `requestAnimationFrame`)
- **Method breakdown** — horizontal bar chart showing request distribution by HTTP method
- **Status breakdown** — horizontal bar chart showing distribution by status code
- **Success rate overview** — large progress bar with animated fill, status indicator

### 10.5 ThemeToggle (`components/ui/theme-toggle.tsx`)

Dark/light mode switch:

- Uses shadcn Button (variant "ghost", size "icon")
- Toggles `.dark` class on `<html>` element
- Persists to `localStorage` with key `postmen-theme`
- Sun/Moon icons from react-icons

---

## 11. Dark Mode

### 11.1 How It Works

Tailwind CSS v4 requires explicit configuration for class-based dark mode. Instead of the legacy `darkMode: "class"` in config (which v4 ignores), the project uses:

```css
/* app/globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

This tells Tailwind v4 that `dark:` variants should apply when the element or any ancestor has the `.dark` class.

### 11.2 FOUC Prevention

An inline `<script>` in `layout.tsx` runs before React hydration:

```javascript
(function () {
  try {
    var theme = localStorage.getItem("postmen-theme");
    if (
      theme === "dark" ||
      (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
```

This reads the stored theme preference (or falls back to system preference) and applies the `.dark` class immediately, preventing a "flash of unstyled content" where the page briefly shows the wrong theme.

### 11.3 Toggle Mechanism

The `ThemeToggle` component:

1. Reads initial state from `document.documentElement.classList.contains('dark')`
2. On click: toggles `.dark` class on `<html>`, saves to localStorage
3. Renders sun icon (light mode) or moon icon (dark mode)

---

## 12. SEO & Metadata

### 12.1 Root Metadata (`layout.tsx`)

```typescript
metadata = {
  title: { default: "Postmen", template: "%s | Postmen" },
  description: "A modern, blazing-fast API testing tool...",
  metadataBase: new URL("https://postmen.vercel.app"),
  openGraph: { title, description, url, siteName, type: "website" },
  twitter: { card: "summary_large_image", title, description },
  icons: { icon: "/favicon.ico" },
};
```

### 12.2 Dynamic OG Image (`opengraph-image.tsx`)

Generates a branded OpenGraph image at build time using Next.js `ImageResponse`.

### 12.3 Robots & Sitemap

- `robots.ts` — allows all crawlers, points to sitemap
- `sitemap.ts` — returns URLs for `/`, `/about`, `/login`, `/signup`

---

## 13. Environment Variables

| Variable                       | Required | Description                 |
| ------------------------------ | -------- | --------------------------- |
| `MONGO_URI`                    | Yes      | MongoDB connection string   |
| `JWT_SECRET`                   | Yes      | Secret for signing JWTs     |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No       | Enables Google OAuth if set |

The Google OAuth components conditionally render based on whether the client ID is available:

```typescript
const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
```

---

## 14. Testing

Uses **Playwright** for end-to-end tests:

- `tests/auth.spec.ts` — authentication flows
- `tests/dashboard.spec.ts` — dashboard interactions
- `tests/landing.spec.ts` — landing page rendering

Configuration is in `playwright.config.ts`.

---

## 15. Deployment Notes

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Set environment variables (MONGO_URI, JWT_SECRET, optionally GOOGLE_CLIENT_ID)
3. Framework auto-detected as Next.js
4. Deploy

### API URL Resolution

`app/config/api.ts` exports `apiUrl(path)` which ensures paths start with `/`. In production, API routes are same-origin (relative paths work). No absolute URL needed.

### MongoDB

- Use MongoDB Atlas for managed hosting
- Connection caching in `db.ts` handles serverless function reuse
- Indexes on `User.email` (unique) are auto-created by Mongoose

---

_Generated for the Postmen project. Last updated during the design system unification._
