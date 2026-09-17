# Invizio — Inventory, in order

A complete front-end redesign of the existing inventory tracker. React + TypeScript + Vite, Tailwind CSS, Lucide, and Recharts remain in place. The existing Express/Mongoose inventory API and MongoDB item model are preserved.

## Start with the interactive demo

Use Node.js 22.12 or newer. This project was verified with Node 24.19.0.

```bash
npm ci
npm run dev:client
```

Open **http://localhost:5173** and select **Try the demo**. No database or account is needed. The demo uses an isolated in-memory repository: it never calls the inventory API and it resets when you leave, reload, or choose another Preview state.

Use the **Appearance** control to compare Light, Dark, and System. System is the initial preference; a shipping theme default has deliberately not been chosen. In demo mode, the **Preview state** selector exercises loaded, empty, healthy, loading, malformed-response, initial-error, refresh-error, save-timeout, and saved-with-refresh-error scenarios. Save scenarios take effect when you submit an actual change.

## Connect the existing inventory backend

1. Copy `.env.example` to `.env` and set `MONGODB_URI`. In PowerShell, use `Copy-Item .env.example .env`; in a Unix shell, use `cp .env.example .env`.
2. Set `VITE_API_URL` to the API origin, normally `http://localhost:3000`.
3. For local development, set `VITE_ENABLE_API_WORKSPACE=true`.
4. Run `npm run dev`. Vite uses port **5173** and Express uses **3000**. The conflicting Vite port from the uploaded configuration has been corrected.
5. On the sign-in screen, select **Open connected inventory** and confirm the shared-workspace explanation.

The connected entry uses your existing API and saves changes to MongoDB. No data is seeded automatically. An empty database returns a genuine empty-inventory state; use **Add item** to begin. Settings → **Factory reset** deliberately replaces the entire inventory with the four original demo items and requires typing `RESET`.

**Authentication is still a front-end preview.** Email/password forms, validation, recovery, and provider-neutral integration points are included, but no accounts are created and no passwords are stored or sent by the supplied adapter. The existing API is still unauthenticated and has no per-user inventory scope. Keep the connected-workspace entry disabled for a public demo. Hiding that entry does not protect the API; real authentication and server-side authorization must be connected before offering private accounts.

## What changed

- A true porcelain light theme and matching ink dark theme, using semantic CSS variables. Both retain the same `#0F766E` teal. Dark primary buttons have a contrasting 2px boundary.
- Overview, Inventory, and Alerts with a desktop navigation rail and mobile bottom navigation. Low-stock and out-of-stock items both contribute to the navigation badge.
- Dashboard totals, needs-attention list, category value chart, and highest-value items. Values use current quantities and prices; no historical trends are invented.
- Search by name, SKU, or category, keyboard suggestions, category/stock filters, sorting, pagination, and mobile inventory cards.
- An add/edit drawer with every model field, including description. SKU stays visible and server-assigned. New categories, validation, stock-status preview, dirty-draft protection, and a sticky action footer are included.
- Named delete confirmation and a separate typed factory-reset confirmation.
- Mobile-only branded startup splash, with no forced delay. Data loading and errors happen in the application shell; slow requests cannot trap the splash.
- Explicit unavailable, loading, fresh, stale, rejected-write, and uncertain-write states. Failed requests never become empty arrays.
- The original write/reload bug is fixed: a confirmed mutation updates local data; an unsuccessful follow-up read shows a stale-data warning without reporting that the save failed or resending it.

## Commands

| Command              | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `npm run dev:client` | Frontend and isolated demo                                |
| `npm run dev:server` | Existing Express/MongoDB API                              |
| `npm run dev`        | Both services                                             |
| `npm run typecheck`  | Strict frontend and existing server TypeScript checks     |
| `npm test`           | Request, store, rendered-state, and DOM interaction tests |
| `npm run build`      | Typecheck and production frontend build                   |
| `npm run preview`    | Serve the production build at http://localhost:4173       |
| `npm run format`     | Format frontend source and tests                          |

If testing the connected API through `npm run preview`, add `http://localhost:4173` to the server's `CORS_ORIGIN`. In production, set that variable to your frontend origin and set `VITE_API_URL` before building.

## Source map

| Location                  | Responsibility                                                             |
| ------------------------- | -------------------------------------------------------------------------- |
| `index.css`               | Shared design system, semantic color tokens, and responsive layouts        |
| `index.html`              | Theme initialization before the first paint                                |
| `src/App.tsx`             | Workspace navigation, dialogs, feedback, and preview controls              |
| `src/components/`         | Auth, views, item drawer, confirmation/recovery dialogs, charts, shared UI |
| `src/hooks/useTheme.tsx`  | Light/Dark/System preference and device-theme changes                      |
| `src/auth/adapter.ts`     | Provider-neutral account integration contract; currently unavailable       |
| `src/data/http.ts`        | Existing REST adapter, response validation, timeouts, read retry policy    |
| `src/data/store.ts`       | Explicit inventory snapshots and independent mutation/reload state         |
| `src/data/demo.ts`        | Isolated demo repository and reproducible failure scenarios                |
| `src/domain/inventory.ts` | Model decoding, validation, stock rules, searching, and calculations       |
| `server/`                 | Preserved Express routes, Mongoose model, and seed data                    |
| `tests/`                  | Frontend behavioral tests using Node's test runner and Happy DOM           |
| `docs/IMPLEMENTATION.md`  | State contracts, theme mapping, integration details, and QA handoff        |

## Verification and remaining work

The redesign passes **31 frontend tests**, strict frontend/server TypeScript checks, and a production build. Tests use mocked requests, an isolated demo, and a simulated DOM; no live MongoDB data was modified. The backend does not gain an automated integration suite in this change.

Browser visual QA remains deferred as agreed. Responsive rendering, real-browser focus behavior, device splash timing, and assistive-technology behavior still need that pass. The contrast tokens have been checked numerically; this is not a claim of a completed WCAG audit. See the handoff document for the focused review steps.

The package intentionally excludes `.env`, Git history, installed dependencies, and generated builds. Supply your existing connection string locally; never put secrets in `VITE_*` variables.
