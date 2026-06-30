# La Scaloneta — Argentina WC 2026

A full-screen fan site tracking Argentina's FIFA World Cup 2026 campaign. Live scores, fixtures, squad, and Golden Boot stats — all from a single-page scroll-snap experience.

**Live sections:** Landing · Fixtures · Players · Stats · Scores

---

## What it does

Five full-viewport sections, each snapping into place as you scroll:

| Section | Data source | Cache TTL |
|---------|-------------|-----------|
| **Landing** | Static hero image | — |
| **Fixtures** | football-data.org — all Argentina WC matches | 5 min |
| **Players** | Static 26-player squad | — |
| **Stats** | football-data.org — WC top scorers (top 8) | 1 hour |
| **Scores** | football-data.org — live + last 4 finished results | 30 s (live) / 5 min (results) |

Live polling on the Scores section only activates on Argentina match days — saving ~2,880 API calls/day on non-match days.

---

## Quick start

### Prerequisites

- Node.js 18+
- A free API token from [football-data.org](https://www.football-data.org/client/register)

### 1. Install dependencies

```bash
npm install
```

### 2. Set your API key

Create `.env.local` in the project root:

```
FOOTBALL_DATA_KEY=your_token_here
```

### 3. Start the dev proxy

The proxy handles `/api/*` requests and forwards them to football-data.org:

```bash
node dev-proxy.js
# Proxy running on http://localhost:3000
# FOOTBALL_DATA_KEY: abc123...
```

### 4. Start the dev server (separate terminal)

```bash
npm run dev
# → http://localhost:5173
```

Vite proxies `/api/*` to `localhost:3000` automatically (configured in `vite.config.js`).

### Alternatively: use Vercel CLI

If you have the Vercel CLI installed, a single `vercel dev` replaces steps 3 and 4. The proxy (`dev-proxy.js`) exists for teams that prefer not to install the Vercel CLI.

---

## Project structure

```
wc26-messi/
├── api/
│   └── football.js          # Vercel serverless proxy (path allowlist, SSRF guard)
├── dev-proxy.js             # Local dev proxy (replaces vercel dev)
├── public/
│   ├── assets/              # Background images (wc22.jpg, messi_with_worldcup.jpg, …)
│   └── favicon.svg
├── scripts/
│   ├── find-league.js       # One-off: discover football-data.org competition IDs
│   ├── validate-api.js      # One-off: smoke-test API responses
│   └── validate-football-data.js
├── src/
│   ├── App.jsx              # Scroll-snap shell + IntersectionObserver active tracking
│   ├── App.css
│   ├── index.css            # Design tokens + global reset
│   ├── main.jsx             # React 19 entry point
│   ├── components/
│   │   ├── NavDots.jsx      # Right-rail dot navigation (keyboard accessible)
│   │   ├── NavDots.css
│   │   ├── PlayerCard.jsx   # Card UI for individual players
│   │   ├── PlayerCard.css
│   │   └── PlayerCard.test.jsx
│   ├── hooks/
│   │   └── useFootballApi.js  # Data fetching: cache, polling, rate-limit backoff
│   └── sections/
│       ├── Landing.jsx / .css
│       ├── Fixtures.jsx / .css
│       ├── Players.jsx / .css
│       ├── Stats.jsx / .css
│       ├── Scores.jsx / .css
│       └── NotFound.jsx / .css
├── index.html               # Meta/OG tags, Google Fonts preconnect
├── vercel.json              # Security headers + SPA rewrite rule
└── vite.config.js           # Vite + Vitest config
```

---

## Architecture

### Scroll-snap layout

`App.jsx` renders a `div.snap-container` with `scroll-snap-type: y mandatory`. Each section is a full-viewport `div.snap-section` with `scroll-snap-align: start`. An `IntersectionObserver` (threshold 0.5) tracks which section is in view and updates `activeIndex`, which `NavDots` uses to highlight the current dot.

```
App
 ├── .snap-container (height: 100dvh, overflow-y: scroll)
 │    ├── #landing   (.snap-section)
 │    ├── #fixtures  (.snap-section)
 │    ├── #players   (.snap-section)
 │    ├── #stats     (.snap-section)
 │    └── #scores    (.snap-section)
 └── NavDots (position: fixed, right rail)
```

### Data fetching — `useFootballApi`

`src/hooks/useFootballApi.js` is the single hook for all API calls. It handles:

- **localStorage cache** — keys prefixed `wc26_api_`. Fresh cache skips the network entirely.
- **Stale fallback** — on network error or rate-limit, serves the last cached value.
- **Rate-limit backoff** — HTTP 429 triggers exponential backoff starting at 60 s, capped at 3600 s.
- **Polling** — optional `pollInterval` (seconds). Set to 0 (default) to disable.
- **Enabled gate** — pass `enabled: false` to skip fetching entirely (used by Scores to suppress live polling on non-match days).

```js
const { data, loading, error } = useFootballApi(path, {
  ttl:          60,   // cache lifetime in seconds
  pollInterval:  0,   // refetch interval in seconds (0 = off)
  enabled:    true,   // set false to skip fetch
})
```

`data` is the raw JSON from football-data.org. `loading` is true until the first response (or cache hit). `error` is `{ status?, message }` or null.

### API proxy — `api/football.js`

A Vercel serverless function that proxies requests to `https://api.football-data.org/v4/`. It:

- Requires `FOOTBALL_DATA_KEY` in the environment — returns 500 if missing.
- Validates the `path` query parameter against an allowlist of 4 regexes:
  - `competitions/WC/matches`
  - `competitions/WC/scorers`
  - `competitions/WC/standings`
  - `competitions/WC/teams`
- Returns 403 for any path not on the allowlist (prevents path traversal and SSRF).
- Forwards the upstream `Cache-Control` header to the client.
- Returns 502 on upstream failure with no internal detail exposed.

All client requests go to `/api/football?path=<encoded-path>`.

### Match-day detection (Scores section)

The Scores section makes three API calls:

1. **`scheduleData`** — `competitions/WC/matches?team=762`, TTL 1 hour, no polling. Used only to check whether Argentina has a match today (`isTodayUTC` helper compares UTC date fields).
2. **`liveData`** — `competitions/WC/matches?team=762&status=IN_PLAY,PAUSED`, TTL 30 s, poll every 30 s. `enabled: matchDayToday` — disabled on non-match days.
3. **`resultsData`** — `competitions/WC/matches?team=762&status=FINISHED`, TTL 5 min, no polling.

The section always shows up to 4 cards: live matches first, then the most recent finished results to fill the remaining slots.

### Score display — penalty shootout handling

`ScoreCard` in `Scores.jsx` correctly handles penalty shootouts:

- Detects `match.score.duration === 'PENALTY_SHOOTOUT'`.
- Shows the pre-shootout score (from `regularTime` or `extraTime`) as the main scoreline.
- Shows the final penalty tally (from `fullTime`) as `(4–5 pens)` beneath.
- The `score.penalties` field is not used for display — it holds the tied intermediate count before the decisive kick, not the final penalty result.

---

## Design system

All tokens are CSS custom properties in `src/index.css`.

### Colors

| Token | Value | Use |
|-------|-------|-----|
| `--afa-blue` | `#003F87` | AFA deep blue, gradient overlays |
| `--afa-celeste` | `#74ACDF` | AFA sky blue, borders, glows |
| `--afa-gold` | `#C9A84C` | Gold accents, Messi highlights |
| `--afa-white` | `#F5F7FA` | Body text |
| `--afa-dark` | `#0D1117` | Page background |
| `--afa-surface` | `#111827` | Card backgrounds |
| `--afa-border` | `rgba(116,172,223,0.2)` | Subtle dividers |
| `--afa-overlay` | `linear-gradient(…)` | Hero image overlay |

### Typography

| Token | Value |
|-------|-------|
| `--font-display` | `'Bebas Neue', sans-serif` |
| `--font-body` | `'Inter', system-ui, sans-serif` |

Bebas Neue is used for all section headings and large display text. Inter handles body copy, labels, and UI text.

### Spacing

Spacing tokens follow a `--space-{n}` pattern where n maps to `0.25rem × n`:
`--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-6` (24px), `--space-8` (32px), `--space-12` (48px), `--space-16` (64px), `--space-20` (80px).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FOOTBALL_DATA_KEY` | Yes | API token from football-data.org. Set in `.env.local` for dev, Vercel project settings for production. |

`.env.local` is gitignored. Never commit this file.

---

## Scripts

```bash
npm run dev        # Start Vite dev server (localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # Run Oxlint
npm run test       # Run Vitest (single pass)
npm run test:watch # Run Vitest in watch mode

node dev-proxy.js  # Start local API proxy (localhost:3000)
```

Build output is ~246 KB JS, gzips to ~78 KB.

---

## Testing

Tests live next to components in `*.test.jsx` files and run with Vitest + Testing Library.

```bash
npm test
```

`src/components/PlayerCard.test.jsx` covers 11 cases:
- Last name extracted and uppercased from full name
- Jersey number rendered, falls back to `—` when null/undefined
- Club name rendered
- Photo rendered; falls back to `/assets/messi.jpg` on null/undefined/error
- Position abbreviations: `Goalkeeper → GK`, `Defender → DEF`, `Midfielder → MID`, `Forward → FWD`
- Unknown positions truncated to 3 chars; missing position shows `—`

---

## Deployment

The site deploys to Vercel. The `api/` directory is automatically picked up as serverless functions.

### Steps

1. Push to your GitHub repository (or run `vercel deploy`).
2. In the Vercel project settings, add the environment variable:
   - `FOOTBALL_DATA_KEY` = your football-data.org token
3. Deploy.

`vercel.json` configures:
- **SPA rewrite** — all non-API routes serve `index.html`.
- **Security headers** — applied to every response (see Security section).

---

## Security

### API proxy hardening

`api/football.js` restricts what can be proxied:

- Only 4 URL patterns are allowed (regex allowlist). Any other path returns 403.
- The `path` parameter is validated before it reaches the upstream fetch — no path traversal or SSRF is possible.
- 502 errors return `{ error: 'Upstream fetch failed' }` with no internal detail (no stack trace or network error message).

### HTTP security headers (`vercel.json`)

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'`; fonts from googleapis/gstatic; no inline scripts |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, microphone, geolocation all off |

---

## football-data.org API reference

Argentina's team ID in football-data.org is **762**.

| Endpoint | Used by | Notes |
|----------|---------|-------|
| `competitions/WC/matches?team=762` | Fixtures, Scores | All Argentina matches |
| `competitions/WC/matches?team=762&status=IN_PLAY,PAUSED` | Scores | Live matches only |
| `competitions/WC/matches?team=762&status=FINISHED` | Scores | Finished results |
| `competitions/WC/scorers` | Stats | Top scorers for WC 2026 |

Free tier limit: 10 requests/minute. The `useFootballApi` hook's TTL caching and match-day gating keep actual request counts well within this limit during normal browsing.

---

## Known limitations / remaining work

- Background images (`wc22.jpg`, `messi_with_worldcup.jpg`, `mobile_stats.jpg`, `404_page.jpg`) are low-resolution. Replace with 1920px+ / 80–85% JPEG versions compressed via [Squoosh](https://squoosh.app).
- No git history yet — run `git init` and make an initial commit before deploying.
- The `standings` and `teams` endpoints are allowlisted in the proxy but not yet consumed by any section. Future sections (group table, team info) can use them without proxy changes.
