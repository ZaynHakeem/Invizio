# Invizio — Inventory, in order

A React + TypeScript + Vite inventory tracker with an Express/Mongoose API. Accounts use **Supabase Auth**; product data lives in **MongoDB**, scoped per user.

## Live demo

**https://invizio.vercel.app/**

## Two URLs (local)

| URL | What it is |
| --- | --- |
| **http://localhost:5173/demo** | Interactive demo — in-memory sample inventory, Preview states, no account or database |
| **http://localhost:5173/** | Real app — sign in / sign up, empty personal inventory saved to MongoDB |

## Demo only

Use Node.js 22.12 or newer.

```bash
npm ci
npm run dev:client
```

Open **http://localhost:5173/demo**. No Supabase or MongoDB needed. The demo never calls the inventory API and resets when you leave, reload, or change Preview state.

Appearance (Light / Dark / System) works on both URLs. System is the initial preference.

## Real app (Supabase + MongoDB)

1. Copy `.env.example` to `.env`.
   - PowerShell: `Copy-Item .env.example .env`
   - Unix: `cp .env.example .env`
2. Set `MONGODB_URI` and `VITE_API_URL` (normally `http://localhost:3000`).
3. Create a Supabase project and fill `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET`.
   - Step-by-step: **[docs/SUPABASE.md](docs/SUPABASE.md)**
4. Run both services:

```bash
npm run dev
```

5. Open **http://localhost:5173/**, create an account, and start from an empty inventory.

New accounts see no sample items. Factory reset clears **only your** items (empty again). The demo at `/demo` still uses the four sample items in memory.

Authentication is required for all `/api/items` routes. A Bearer token from Supabase is verified on the server; inventories are filtered by user id.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev:client` | Frontend (demo at `/demo`; real app needs env + API for accounts) |
| `npm run dev:server` | Express/MongoDB API |
| `npm run dev` | Both services |
| `npm run typecheck` | Strict frontend and server TypeScript checks |
| `npm test` | Request, store, rendered-state, DOM, and auth middleware tests |
| `npm run build` | Typecheck and production frontend build |
| `npm run preview` | Serve the production build at http://localhost:4173 |
| `npm run format` | Format frontend source and tests |

If testing the API through `npm run preview`, add `http://localhost:4173` to `CORS_ORIGIN`. In production, set `CORS_ORIGIN` to your frontend origin and set `VITE_API_URL` / Supabase vars before building.

## Source map

| Location | Responsibility |
| --- | --- |
| `index.css` | Shared design system, semantic color tokens, and responsive layouts |
| `index.html` | Theme initialization before the first paint |
| `src/App.tsx` | `/` vs `/demo` routes, workspace shell, session restore |
| `src/components/` | Auth, views, item drawer, confirmation dialogs, charts, shared UI |
| `src/hooks/useTheme.tsx` | Light/Dark/System preference |
| `src/auth/` | Supabase client and provider-neutral account adapter |
| `src/data/http.ts` | REST adapter with Bearer token support |
| `src/data/store.ts` | Inventory snapshots and mutation/reload state |
| `src/data/demo.ts` | Isolated demo repository and Preview scenarios |
| `src/domain/inventory.ts` | Model decoding, validation, stock rules, searching |
| `server/` | Express routes, JWT auth, Mongoose model, seed helpers |
| `tests/` | Frontend and server auth tests (Node test runner + Happy DOM) |
| `docs/SUPABASE.md` | First-time Supabase setup for this login page |
| `docs/IMPLEMENTATION.md` | State contracts, theme mapping, and QA handoff |

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build` after changes. Frontend tests use mocked requests and the isolated demo; they do not mutate a live MongoDB. See [docs/SUPABASE.md](docs/SUPABASE.md) for an end-to-end account smoke checklist.

Never put secrets in `VITE_*` variables. Keep `SUPABASE_JWT_SECRET` server-only.
