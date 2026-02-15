# Invizio — Premium Inventory Vault

A streamlined, local-first inventory management system built for small businesses and individual entrepreneurs to monitor stock levels, track item details, and get low-stock alerts — with polished analytics and a premium UI.

Quick links
- Live dev: run locally with Vite (instructions below)
- Project: ZaynHakeem/Invizio

---

## Features

- Dashboard with charts and KPIs
- Inventory list with add/edit/delete
- Low-stock and out-of-stock alerts
- Local-first persistence (localStorage)
- Simulated backend layer for easy testing (can be replaced with real API)
- Built with React, TypeScript, Vite, Tailwind, lucide-react and recharts

---

## Quick Start

Prerequisites:
- Node.js (LTS recommended)
- npm (bundled with Node.js)

Clone and run:

```bash
git clone https://github.com/ZaynHakeem/Invizio.git
cd Invizio
npm install
```

Run development server:

```bash
npm run dev
# open http://localhost:3000 (vite is configured to port 3000)
```

Build for production:

```bash
npm run build
npm run preview
```

---

## Project Overview & Architecture

This repo is a local-first fullstack mock app:

- Frontend (React + TypeScript)
  - index.tsx — client bootstrap
  - App.tsx — primary root React component (this is the one mounted by index.tsx)
  - frontend/* — additional frontend sources and a secondary App implementation (useful as reference)
  - frontend/api-client.ts — client API wrapper that calls the simulated backend handlers
  - frontend/types.ts — TypeScript data models (InventoryItem, DashboardStats, ApiResponse)

- Simulated Backend (server-side logic running in the browser)
  - backend/api-handlers.ts — simulated API handlers (fetchAllItems, saveItem, deleteItem, getDashboardStats)
  - backend/store.ts — simple localStorage-backed data store & seed data

Build/Dev:
- vite.config.ts — Vite configuration (port 3000, environment variable injection, alias).

Note: There are two App.tsx files:
- ./App.tsx — the app used at runtime because index.tsx imports './App'.
- ./frontend/App.tsx — an alternative/frontend-scoped implementation (left in repo for reference). Use the root App.tsx for local dev unless intentionally switching imports.

---

## Storage & Persistence

This project stores data in localStorage. There are a few storage keys you may encounter:

- Client (root App.tsx): STORAGE_KEY = "invizio_vault_data_v2" (used by the root UI)
- frontend implementation: STORAGE_KEY = "invizio_vault_data" (alternative frontend build)
- backend store: STORAGE_KEY = "stockmaster_v2_db" (backend/store.ts seed + persistence)

If you see different seed data between the UI and backend, check which storage key is active and clear the related key via the browser devtools Application > Local Storage if you want a fresh start.

To reset all data during development, run in browser console:

```js
localStorage.removeItem('invizio_vault_data_v2');
localStorage.removeItem('invizio_vault_data');
localStorage.removeItem('stockmaster_v2_db');
```

---

## API (Simulated)

The frontend interacts with a simulated backend via frontend/api-client.ts which proxies to backend/api-handlers.ts. The public API surface is:

- api.getInventory(): Promise<ApiResponse<InventoryItem[]>>
- api.getStats(): Promise<ApiResponse<DashboardStats>>
- api.upsertItem(item: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>>
  - Creates or updates an item. Server-side validation requires name and non-negative price/quantity.
- api.deleteItem(id: string): Promise<ApiResponse<void>>

ApiResponse<T> shape:

```ts
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}
```

Example usage (in frontend code):

```ts
import { api } from './frontend/api-client';

async function addExample() {
  const response = await api.upsertItem({
    name: 'New Widget',
    category: 'Widgets',
    quantity: 10,
    price: 12.5,
    description: 'A test widget',
    minStockLevel: 5
  });

  if (response.status === 'success') {
    console.log('Saved item', response.data);
  } else {
    console.error('Save failed', response.error);
  }
}
```

---

## Data Model

Primary type: InventoryItem (from frontend/types.ts)

Example TypeScript interface:

```ts
interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  description: string;
  minStockLevel: number;
  updatedAt: string;
  supplier?: string;
}
```

Example JSON payload:

```json
{
  "sku": "IV-123",
  "name": "Titanium Widget",
  "category": "Hardware",
  "quantity": 20,
  "price": 99.99,
  "description": "High quality titanium widget",
  "minStockLevel": 5
}
```

When creating an item through the simulated backend, id and sku will be generated if omitted.

---

```
GEMINI_API_KEY=your_key_here
```

Vite will pick this up when running using npm run dev or during build.

---

## Theming & Styling

- TailwindCSS is used for styling (tailwind.config.js & postcss.config.js in repo).
- Color constants (e.g., GOLD = #D4AF37) are defined in the app code for consistent branding and chart palette use.

---

## Extending to a Real Backend

To replace the simulated backend with a real REST/GraphQL server:

1. Implement an HTTP server (Express, Fastify, etc.) exposing endpoints:
   - GET /api/items
   - POST /api/items (create)
   - PUT /api/items/:id (update)
   - DELETE /api/items/:id
   - GET /api/stats

2. Update frontend/api-client.ts to call fetch()/axios to your server endpoints instead of importing backendHandlers.

3. Remove or adapt backend/ files if you no longer need the in-browser simulation.

4. Securely manage API keys/server secrets (don’t embed server secrets in the client bundle).

Example fetch-based replacement (pseudo):

```ts
export const api = {
  getInventory: async () => {
    const r = await fetch('/api/items');
    return r.json();
  },
  upsertItem: async (item) => {
    const method = item.id ? 'PUT' : 'POST';
    const url = item.id ? `/api/items/${item.id}` : '/api/items';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return r.json();
  }
};
```

---

## Troubleshooting

- "Could not find root element to mount to" — Ensure index.html contains `<div id="root"></div>` (it does in this repo). If you edited the template, restore the root div.
- Data appears inconsistent — multiple storage keys (see "Storage & Persistence"). Clear the appropriate localStorage keys.
- Port conflicts — Vite is configured to run on port 3000. If occupied, set PORT or edit vite.config.ts.
- Type errors in editors — ensure TypeScript version is compatible (see devDependencies). Run `npm install` and restart your editor.

---

## Contributing

Contributions welcome! Suggested workflow:

1. Fork the repo
2. Create a feature branch: git checkout -b feat/my-feature
3. Implement changes & add tests (if applicable)
4. Open a pull request with a clear description

Notes for contributors:
- Keep UI theme and color constants centralized (see App.tsx).
- If adding endpoints, update frontend/api-client.ts and backend/api-handlers.ts accordingly.

---

## License

This repository does not include a LICENSE file. If you want to add one, consider adding an explicit license (MIT, Apache-2.0, etc.) at the project root.

---

If you want, I can:
- Provide a ready-to-use .env.example
- Add a CONTRIBUTING.md or sample API docs in OpenAPI format
- Replace the simulated backend with a simple Express example and Dockerfile

Happy hacking — build something great with Invizio!
