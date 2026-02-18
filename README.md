# Invizio — Premium Inventory Vault

Invizio is a premium-styled inventory ledger that lets you register items, track stock levels, and monitor low-stock / out-of-stock alerts with a dashboard of charts and KPIs.

---

## Tech stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Node.js, Express (TypeScript)
- **Database**: MongoDB (local or Atlas), Mongoose
- **Charts**: Recharts
- **Icons**: Lucide React

---

## Project structure

```text
.
├── index.html
├── index.tsx                 # React entry (mounts App)
├── index.css                 # Tailwind directives
├── src/
│   ├── App.tsx               # UI orchestrator (layout + views)
│   ├── components/           # UI components (Sidebar, Header, views, modal, charts)
│   ├── hooks/                # Frontend hooks (useInventory, useClickOutside)
│   ├── utils/                # Client utilities (stats, filtering)
│   ├── constants/            # UI constants + initial seed data
│   └── types/                # Shared TS types (InventoryItem, ViewType)
└── server/
    ├── index.ts              # Express app + MongoDB connection
    ├── routes/items.ts       # REST routes under /api/items
    ├── models/InventoryItem.ts
    ├── seedData.ts           # Seed data + id/sku generation helpers
    └── tsconfig.json         # Server TS config
```

---

## Local setup & running

### Prerequisites

- **Node.js** (LTS recommended)
- **npm**
- **MongoDB**:
  - Either a local MongoDB instance, or
  - A MongoDB Atlas cluster connection string

### Install

```bash
npm install
```

### Environment variables

This project requires a root **`.env`** file (it is **not committed** to git). Start from the example:

```bash
cp .env.example .env
```

Set the following variables in **`.env`**:

- **`MONGODB_URI`**: MongoDB connection string (local or Atlas)
- **`VITE_API_URL`**: Base URL for the API (default: `http://localhost:3000`)

Example:

```bash
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"
VITE_API_URL="http://localhost:3000"
```

### Run (frontend + backend together)

```bash
npm run dev
```

- **Vite** runs on `http://localhost:5173`
- **Express API** runs on `http://localhost:3000`

If your database starts empty, you can seed the initial items using the app’s **Factory Reset** button (it calls `POST /api/items/seed`).

---

## Available scripts

- **`npm run dev`**: Runs **Express (3000)** + **Vite (5173)** together via `concurrently`
- **`npm run dev:server`**: Runs the Express API only (`tsx server/index.ts`)
- **`npm run dev:client`**: Runs the Vite dev server only
- **`npm run build`**: Builds the frontend for production
- **`npm run preview`**: Previews the production frontend build

---

## Notes on `.env`

- **`.env` is required** to run the server (needs `MONGODB_URI`).
- **`.env` is ignored by git** (see `.gitignore`). Use `.env.example` to document required variables without committing secrets.
