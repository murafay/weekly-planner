# Deploy to Cloudflare Pages + install as a desktop app

The app is build-verified for Cloudflare Pages (all edge routes + PWA assets compile).
Follow these steps once. Everything runs from the project folder.

> You run these — they use **your** Cloudflare account (the login step opens a browser).

## 1. Log in to Cloudflare

```bash
npx wrangler login
```

A browser opens — approve access. Confirm with:

```bash
npx wrangler whoami
```

## 2. Create the production D1 database

```bash
npx wrangler d1 create weekly_planner_db
```

Copy the `database_id` it prints and paste it into **`wrangler.toml`**, replacing
`REPLACE_WITH_YOUR_D1_DATABASE_ID`.

## 3. Apply migrations to the remote database

```bash
npm run db:migrate:remote
```

This creates the tables (and the `plan_week` column) in your cloud D1.

## 4. Create the Pages project

```bash
npx wrangler pages project create weekly-planner --production-branch main
```

## 5. Set the session secret (production)

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Then store it (paste the value when prompted):

```bash
npx wrangler pages secret put JWT_SECRET --project-name weekly-planner
```

## 6. Build & deploy

```bash
npm run deploy
```

This builds with `@cloudflare/next-on-pages` and runs
`wrangler pages deploy .vercel/output/static`. When it finishes, it prints your
live URL, e.g. `https://weekly-planner.pages.dev`.

> The `DB` binding and the `nodejs_compat` flag come from `wrangler.toml`
> automatically. If the site errors on first load, open the Cloudflare dashboard →
> Pages → **weekly-planner** → Settings → Functions, and confirm the **D1 binding
> `DB` → weekly_planner_db** and **Compatibility flag `nodejs_compat`** are set for
> Production, then redeploy.

## 7. Create your account on the live site

Open your `*.pages.dev` URL, click **Sign up**, and create your account. It comes
pre-loaded with the 4-week plan. (The local `ui@example.com` account lives only in
your local database — the cloud database starts empty.)

## 8. Install it as a desktop app

**Chrome / Edge (desktop):** open the live URL → click the **install icon** in the
address bar (a monitor/⊕ icon), or menu → *Install Weekly Planner*. It opens in its
own window with a taskbar/dock icon.

**Android (Chrome):** menu → *Add to Home screen* / *Install app*.

**iPhone/iPad (Safari):** Share → *Add to Home Screen*.

Now it launches like a native app — no browser tabs, its own icon, always available.

---

## Updating the app later

After making changes, just redeploy:

```bash
npm run deploy
```

If you add a new migration, run `npm run db:migrate:remote` too.

## Notes

- **`@cloudflare/next-on-pages` is deprecated** (Cloudflare now points to the
  OpenNext adapter). It still builds and deploys today; migrating to
  `@opennextjs/cloudflare` is a future option, not required now.
- The app pins **Next 15.5.24** (a security-patched release). `.npmrc` sets
  `legacy-peer-deps=true` so the install resolves cleanly.
