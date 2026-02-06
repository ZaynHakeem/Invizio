# Invizio: Inventory Tracking App

A streamlined inventory management system built for small businesses and individual entrepreneurs to monitor stock levels, track item details, and get low-stock alerts in real-time.

---

## Features

- Dashboard with analytics (category breakdown, inventory value, low-stock/out-of-stock counts)
- Inventory list with searching, sorting and CRUD (create, edit, delete)
- Real-time low-stock and out-of-stock alerts
- Responsive layout (mobile-friendly)
- Local persistence using localStorage (no backend required)
- Modern stack: React + TypeScript + Vite, charts via Recharts, icons via lucide-react

---

## Tech stack

- React 19
- TypeScript
- Vite (dev server + build)
- Recharts (charts)
- lucide-react (icons)
- Tailwind (via CDN in index.html)
- Local persistence: localStorage

---

## Quick start (local development)

Prerequisites:
- Node.js (recommended >= 18)

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Create a `.env.local` file at the project root if you need to provide a GEMINI_API_KEY or other env values used in vite.config.ts:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   Note: The project will run without this env var; vite.config.ts only injects it into process.env if present.

3. Start dev server:
   ```bash
   npm run dev
   ```
   The Vite dev server is configured to run on port 3000 by default. Open http://localhost:3000

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the production build locally:
   ```bash
   npm run preview
   ```

---

## Environment variables

vite.config.ts loads environment variables using Vite's loadEnv. The repo wires GEMINI_API_KEY into the client bundle as:
- process.env.API_KEY
- process.env.GEMINI_API_KEY

To set it locally, create `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

Be careful: adding sensitive keys into the client bundle exposes them to browsers. Only use public-safe values here. For private API keys, route requests through a server.

---

## Data model

The app stores inventory items in localStorage under the key `stockmaster_items`. Each item conforms to the following shape:

Example InventoryItem JSON:
```json
{
  "id": "1",
  "name": "Premium Coffee Beans",
  "category": "Groceries",
  "quantity": 45,
  "price": 18.5,
  "description": "Dark roast arabica beans",
  "minStockLevel": 10,
  "updatedAt": "2026-02-06T12:00:00.000Z"
}
```

Fields:
- id (string): unique identifier
- name (string): product name
- category (string): category grouping
- quantity (number): current stock quantity
- price (number): unit price (used for inventory value calculation)
- description (string): optional details
- minStockLevel (number): threshold for low-stock alert
- updatedAt (string, ISO): last update timestamp

Default/initial mock data lives in App.tsx and will be used only on first run (when `stockmaster_items` is not found in localStorage).

---

## Development notes & where to look

- Entry point: `index.tsx` mounts the React app to `<div id="root">` in `index.html`.
- App implementation and UI lives in `App.tsx`. This file contains:
  - Dashboard calculations and charts (using Recharts)
  - UI for inventory listing, search, and CRUD
  - localStorage read/write for persistence
- Types: `types.ts` contains the InventoryItem shape and view types.
- Vite config: `vite.config.ts` sets server options (default port 3000) and environment defines.

To change the dev server port or host, edit `server` in `vite.config.ts`:
```ts
server: {
  port: 3000,
  host: '0.0.0.0',
},
```

To reset the app data (clear all inventory items):
- In the browser console:
  ```js
  localStorage.removeItem('stockmaster_items')
  location.reload()
  ```

---

## Build & deployment

This is a static SPA and can be deployed to any static hosting provider.

1. Build:
   ```bash
   npm run build
   ```
   The build output will be in the `dist` directory (Vite default).

2. Deploy options:
- Vercel: Connect your repo, set build command `npm run build` and publish directory `dist`.
- Netlify: Same—set build command and publish directory.
- Static servers: Upload `dist/` contents to any static host (S3 + CloudFront, Surge, GitHub Pages with an adapter).

Note: If your host requires a different base path or router support, adjust Vite `base` setting or configure redirects to serve `index.html` for SPA routes.

---

## Troubleshooting

- "Could not find root element to mount to" — Ensure `index.html` contains `<div id="root"></div>`. This is present by default in the repo.
- Port in use — Change `port` in `vite.config.ts` or stop the conflicting service.
- Environment variables not loaded — Vite reads env files by mode. Use `.env`, `.env.local`, or pass variables when running `vite`.
- Changes not persisting — Inventory is stored in localStorage (`stockmaster_items`). Clearing cache or using `removeItem` (see Development notes) resets it.

---

## Contributing

Contributions are welcome. Suggested workflow:
- Fork the repo
- Create a feature branch: `git checkout -b feat/your-feature`
- Install dependencies and run locally
- Open a PR with a clear description of changes

If you'd like help implementing backend sync, authentication, or export/import CSV features, open an issue and we can discuss.

---

## Acknowledgements

- Recharts (charts)
- lucide-react (icons)
- Vite + React + TypeScript

---

## License

This repository does not include a license file. If you plan to reuse or publish this project, consider adding an appropriate license (MIT, Apache-2.0, etc.).

---