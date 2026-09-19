# Weekly Planner

A multi-user weekly planner. Each user defines a recurring **weekly template** of
tasks (day, time block, label, category) and checks them off each week. Because
completions are keyed by the week's Monday date, every new week automatically
starts fresh while past weeks' history is preserved.

Built as a portfolio project with:

- **Next.js 14** (App Router, TypeScript) — UI + edge API route handlers
- **Cloudflare Pages** — hosting, via [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages)
- **Cloudflare D1** (SQLite) — database, bound as `DB`
- **Auth** — email + password (PBKDF2 hashing via Web Crypto) with JWT session
  cookies signed by [`jose`](https://github.com/panva/jose). No third-party auth service.

## Features

- Signup / login / logout with hashed passwords and HTTP-only JWT session cookies
- Protected `/dashboard`, `/calendar`, and `/settings` routes
- **Monthly plan (4 weeks):** tasks belong to a plan week (1–4). The dashboard
  auto-shows whichever week matches today's date, so the plan advances Week 1 → 4
  through the month with no manual switching (anchored to `PLAN_ANCHOR_MONDAY`).
- **Calendar view** (`/calendar`): the whole 4-week month on a Mon–Sun grid with
  real dates, per-week themes, and interactive check-offs.
- Dashboard showing the current week (Mon–Sun), grouped by day, with a checkbox per task
- Checking a task upserts a row in `completions` keyed by `week_start_date`, so
  history persists per week
- Weekly progress bar (X / Y done) + an overall month total on the calendar
- Settings page to add, edit, delete, and reorder tasks, with a Week 1–4 selector
- Category color coding — work (blue), fyp (orange), learn (purple), job (green), rest (gray)
- Automatic week reset (the current week is the most recent Monday, computed in UTC)
- Mobile-responsive, minimal UI with dark-mode support

> A ready-made 1-month DevOps → Platform Engineering learning plan ships as the
> default seed for new accounts. See [`LEARNING-PLAN.md`](./LEARNING-PLAN.md).

## Data model

| Table              | Columns |
| ------------------ | ------- |
| `users`            | id, email, password_hash, created_at |
| `weekly_templates` | id, user_id, day_of_week, time_block, label, category, sort_order, plan_week |
| `completions`      | id, template_id, week_start_date, done, updated_at |

`completions` has a unique constraint on `(template_id, week_start_date)` so each
task has at most one completion row per week. Foreign keys cascade on delete.

---

## Prerequisites

- **Node.js 18.17+** (or 20+)
- **npm**
- A Cloudflare account (only needed for deployment / remote D1 — local dev works offline)

## 1. Install

```bash
npm install
```

## 2. Set the local secret

Copy the example env file and set a strong `JWT_SECRET`:

```bash
cp .dev.vars.example .dev.vars
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Paste it into `.dev.vars` as `JWT_SECRET="..."`. This file is git-ignored and is
read by Miniflare during local development.

## 3. Create the local database & run migrations

Local D1 runs through Miniflare — **no Cloudflare account required**. Apply all
migrations to the local database:

```bash
npm run db:migrate:local
```

This runs `wrangler d1 migrations apply weekly_planner_db --local`, which applies
every file in `./migrations` in order and stores the local database under
`.wrangler/`. (To wipe local data and start fresh, delete `.wrangler/state` and
re-run this command.)

> The `database_id` placeholder in `wrangler.toml` is fine for local dev — Miniflare
> keys off the binding name and `database_name` only.

## 4. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. `next dev` is wired to the Cloudflare dev platform
(`setupDevPlatform()` in `next.config.mjs`), so the `DB` binding and `JWT_SECRET`
are available exactly as they will be in production.

**Try it end to end:** sign up → you'll land on a pre-seeded sample week → check
off tasks and watch the progress bar → edit tasks in Settings → log out and back in.

---

## Deploying to Cloudflare Pages

> Do this once you're happy with local behavior.

### a. Create the remote D1 database

```bash
npx wrangler d1 create weekly_planner_db
```

Copy the returned `database_id` into `wrangler.toml` (replacing the placeholder).

### b. Apply migrations to the remote database

```bash
npm run db:migrate:remote
```

### c. Set the production secret

```bash
npx wrangler pages secret put JWT_SECRET
```

Paste a strong secret when prompted.

### d. Build & deploy

```bash
npm run deploy
```

This runs `@cloudflare/next-on-pages` to build the app, then
`wrangler pages deploy .vercel/output/static`.

> First-time setup: in the Cloudflare dashboard, make sure the Pages project has
> the D1 binding named **`DB`** attached and the **`JWT_SECRET`** secret set for
> the production environment. The `nodejs_compat` flag (already in `wrangler.toml`)
> must be enabled for the deployment.

You can also preview the production build locally:

```bash
npm run preview
```

---

## npm scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Next.js dev server with local D1 binding |
| `npm run build` | Next.js build (framework build only) |
| `npm run pages:build` | Build for Cloudflare Pages via next-on-pages |
| `npm run preview` | Build + serve the Pages output locally with wrangler |
| `npm run deploy` | Build + deploy to Cloudflare Pages |
| `npm run db:migrate:local` | Apply migrations to the local D1 database |
| `npm run db:migrate:remote` | Apply migrations to the remote D1 database |

## Project structure

```
migrations/                    D1 schema (0001 init, 0002 plan_week)
src/lib/                       db, auth, week math, plan (4-week logic), categories, seed
src/middleware.ts             route-protection redirects
src/app/api/                  edge API routes (auth, templates, completions, month)
src/app/                      login, signup, dashboard, calendar, settings pages
src/components/               TopBar, ThemeToggle
```

## Notes on auth

- Passwords are hashed with PBKDF2-SHA256 (100k iterations) using the Web Crypto
  API, which is available in the Cloudflare Workers/edge runtime (bcrypt is not).
- Session tokens are HS256 JWTs stored in an `httpOnly`, `secure`, `sameSite=lax`
  cookie with a 7-day expiry.
- `middleware.ts` does a lightweight cookie-presence check for redirects; every
  API route independently verifies the JWT and scopes all queries by `user_id`,
  so data access is always enforced server-side.
