# La Scaloneta — Argentina WC 2026

A full-screen fan site tracking Argentina's FIFA World Cup 2026 campaign. Live scores, fixtures, squad, and Golden Boot stats.

**Live sections:** Landing · Fixtures · Players · Stats · Scores
---

## Tech stack

- **React 19** — UI
- **Vite** — dev server & build
- **React Router** — routing
- **Vitest + Testing Library** — tests
- **Oxlint** — linting
- **Vercel** — hosting & serverless API proxy

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

The API key must never be exposed to the browser. In production Vercel handles this via a serverless function (`api/football.js`). Locally you need to run `dev-proxy.js` which does the same thing — it reads your key from `.env.local` and forwards requests to football-data.org server-side:

```bash
node dev-proxy.js
# Proxy running on http://localhost:3000
```

### 4. Start the dev server (separate terminal)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite automatically forwards `/api/*` requests to the proxy on port 3000.

---

## Deployment

Deploys to Vercel. Add `FOOTBALL_DATA_KEY` in your Vercel project environment variables, then push to GitHub — Vercel handles the rest.

---

## Use this for your nation

FIFA World Cup 2026 features **48 nations** — the largest World Cup ever. You can fork this project and adapt it for any participating country in a few steps:

1. **Find your team ID** — run `node scripts/find-league.js` to list all WC 2026 teams and their IDs.
2. **Replace Argentina's team ID** (`762`) with your nation's ID in `src/sections/Fixtures.jsx`, `src/sections/Scores.jsx`, and `src/sections/Players.jsx`.
3. **Swap the squad** — update the player list in `src/sections/Players.jsx` with your nation's squad.
4. **Replace the images** — drop your own background images in `public/assets/`.
5. **Update colors** — edit the CSS tokens in `src/index.css` to match your nation's kit colors.

---

## API endpoints

All requests go through `/api/football?path=<endpoint>`. Argentina's team ID is **762**.

| Endpoint | Description |
|----------|-------------|
| `competitions/WC/matches?team=762` | All Argentina matches |
| `competitions/WC/matches?team=762&status=IN_PLAY,PAUSED` | Live matches |
| `competitions/WC/matches?team=762&status=FINISHED` | Finished results |
| `competitions/WC/scorers` | WC top scorers |
| `competitions/WC/standings` | Group standings |
| `competitions/WC/teams` | All WC teams |

Example:

```
GET /api/football?path=competitions/WC/matches?team=762
```

Free tier limit: 10 requests/minute.

---

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Run Oxlint
npm run test       # Run tests
```
