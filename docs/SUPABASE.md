# Supabase setup for Invizio

Invizio uses **Supabase Auth** for accounts (sign-in, sign-up, password reset) and **MongoDB** for each user’s inventory items. You do not store products in Supabase.

## What you need

1. A free [Supabase](https://supabase.com) account and project
2. MongoDB running locally or via Atlas (`MONGODB_URI`)
3. This app’s `.env` filled from Supabase **Project Settings → API**

## 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. **New project** → pick an org, name, database password, and region.
3. Wait until the project is ready (green status).

## 2. Enable email/password auth

1. In the left sidebar: **Authentication** → **Providers**.
2. Open **Email** and ensure it is enabled.
3. Decide whether new users must confirm email:
   - **Confirm email ON** (default on many projects): after sign-up, Invizio shows “Check your email…”. Sign-in works only after they click the link.
   - **Confirm email OFF** (handy for local learning): sign-up returns a session immediately and opens the empty workspace.

For local development, turning confirm email **off** is the simplest path. You can turn it back on later.

## 3. Copy API keys into `.env`

1. Copy `.env.example` to `.env` if you have not already.
2. In Supabase: **Project Settings** (gear) → **API**.
3. Copy:

| Supabase field | Invizio env var | Notes |
| --- | --- | --- |
| Project URL | `VITE_SUPABASE_URL` | Looks like `https://xxxx.supabase.co` |
| `anon` `public` key | `VITE_SUPABASE_ANON_KEY` | Safe to expose in the browser |
| JWT Secret | `SUPABASE_JWT_SECRET` | Under **JWT Settings** — **server only**, never prefix with `VITE_` |

Also set:

```env
MONGODB_URI=mongodb://localhost:27017/invizio
VITE_API_URL=http://localhost:3000
```

Restart `npm run dev` after changing `.env` (Vite only reads env at startup).

## 4. Auth URL configuration (password reset)

1. **Authentication** → **URL Configuration**.
2. **Site URL**: `http://localhost:5173`
3. **Redirect URLs**: add `http://localhost:5173/**` (or at least `http://localhost:5173/`)

Invizio requests password-reset emails with `redirectTo` pointing at `/`.

## 5. How the login page is wired

```
AuthScreen form
  → authAdapter.signIn / signUp / requestPasswordReset
    → @supabase/supabase-js
      → on success: AuthSession { email, accessToken }
        → Workspace (mode: api)
          → createHttpRepository sends Authorization: Bearer <accessToken>
            → Express requireAuth verifies JWT with SUPABASE_JWT_SECRET
              → MongoDB queries filtered by userId (JWT `sub`)
```

Files:

- [`src/components/AuthScreen.tsx`](../src/components/AuthScreen.tsx) — UI
- [`src/auth/adapter.ts`](../src/auth/adapter.ts) — provider contract + Supabase implementation
- [`src/auth/supabase.ts`](../src/auth/supabase.ts) — client bootstrap
- [`server/auth.ts`](../server/auth.ts) — JWT middleware
- [`server/routes/items.ts`](../server/routes/items.ts) — per-user CRUD

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing or still placeholders, the adapter stays **unconfigured**: forms show a notice and do not send credentials. Use **`/demo`** until keys are set.

## 6. Smoke-test checklist

With `npm run dev` running and MongoDB up:

1. Open **http://localhost:5173/** — sign-up form (not demo).
2. Create an account → empty inventory (“start at zero”).
3. Add an item → it survives a refresh.
4. Sign out → sign in again → same items.
5. In another browser/profile, create a **second** account → inventory is empty; first user’s items are not visible.
6. Forgot password → email arrives (check Supabase **Authentication → Users** and your inbox / Inbucket if using local email tools).
7. Open **http://localhost:5173/demo** — sample data, no account; leave demo returns to `/`.
8. Call `GET http://localhost:3000/api/items` **without** a Bearer token → `401`.

## Common issues

| Symptom | Likely cause |
| --- | --- |
| “Accounts are not connected yet” | Env vars missing, placeholder URL, or client not restarted |
| Sign-up says check email, but login fails | Email confirm is on; confirm the link first |
| API `503` about `SUPABASE_JWT_SECRET` | Secret not set on the server `.env` |
| API `401` after sign-in | Wrong JWT secret, or token not sent (`VITE_API_URL` / CORS) |
| CORS errors | Add the frontend origin to `CORS_ORIGIN` for non-localhost ports |

## Security notes

- Never put `SUPABASE_JWT_SECRET` or the service-role key in `VITE_*` variables.
- The anon key is public by design; protection comes from Auth + server JWT checks + `userId` scoping.
- Do not re-enable the old unauthenticated “connected workspace” shortcut; private inventories require a real session.
