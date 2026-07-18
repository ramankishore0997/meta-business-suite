---
name: Deploying off-Replit (Railway/external hosts)
description: What breaks when this Replit-tuned monorepo is deployed to an external host like Railway, and the single-service pattern that fixes it.
---

# Deploying off-Replit (Railway/external)

This monorepo is tuned for Replit's artifact + reverse-proxy model. On external
hosts (Railway, etc.) three things break, in order of severity:

1. **Build-time PORT/BASE_PATH** — `artifacts/ads-manager/vite.config.ts` used to
   `throw` if `PORT`/`BASE_PATH` were absent. External build steps don't set these.
   Fix applied: PORT defaults to 5173, BASE_PATH defaults to `/`; they're only used
   for the dev/preview server, never required for `vite build`.

2. **No reverse proxy** — On Replit a shared proxy routes `/` → frontend artifact
   and `/api` → api-server. External hosts have no such proxy, so frontend (calls
   `/api/...` same-origin) and backend must be ONE service. Fix applied: build
   frontend to `dist/public`, copy into `artifacts/api-server/dist/public`, and
   api-server serves it via `express.static` + SPA fallback (guarded by
   `fs.existsSync(staticDir)` so it never activates in Replit dev, where the proxy
   handles `/`). See `pnpm run build:deploy` and `pnpm run start` at repo root, and
   `railway.json`.

3. **Image upload uses Replit App Storage sidecar** — `objectStorage.ts` auths to
   GCS via a Replit-only sidecar at `http://127.0.0.1:1106`. This does NOT exist off
   Replit, so the ad image/poster upload feature will fail on Railway until swapped
   for a real provider (S3/Cloudinary/Railway volume). Everything else works.

**Why:** the whole architecture assumes the Replit proxy + sidecar. A future
"deploy elsewhere" request must consolidate to one service and replace object
storage, not just fix the build error.

**How to apply:** Railway needs ONE service (delete the auto-created per-package
services — libs like `db`, `api-spec`, `api-zod`, `object-storage`, `mockup-sandbox`
are internal, not deployable), a Postgres plugin, and `DATABASE_URL` set on the
service referencing it (`${{Postgres.DATABASE_URL}}`). Build command
`pnpm run build:deploy`, start command `pnpm run start:deploy`. Nixpacks runs
`pnpm install` automatically; `packageManager`/`engines` pin pnpm 10 / Node 24.

4. **Empty schema on first boot** — a fresh Railway Postgres has no tables, so after
   fixing `DATABASE_URL` the app would next crash with "relation does not exist".
   Fix applied: `start:deploy` runs `drizzle-kit push` before starting the server, so
   tables auto-create at runtime (build-time push is NOT viable — Railway private
   networking to the DB only exists at runtime, not during build). `drizzle-kit` was
   moved from `@workspace/db` devDependencies to dependencies so it survives a
   `NODE_ENV=production` prod-prune of devDeps and is available for the runtime push.
   **Why:** boot-time `DATABASE_URL` throw and empty-schema crash are two separate
   failures; a "site crashing on Railway" report is almost always one of these, not a
   code bug — the repo build/start config is already correct.
