# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

Premium **dark-luxury** agency Ads Suite ("Nexus"). Full 12-page enterprise
product where EVERY page actually works. This SUPERSEDES the earlier
"exactly 3 pages" rule.

**Theme** (`index.css`, dark by default via `<html class="dark">`): bg #0B0F19,
glass surfaces (`.glass` / `.glass-strong`), accent #3B82F6, success #10B981,
warning #F59E0B, danger #EF4444. Fonts Inter (body) + Space Grotesk
(`--font-display`, headings). Utilities: `.hover-glow`, `.glow-primary`,
`.app-aurora` (ambient page backdrop), custom scrollbars, `--radius` 1rem.

**Design-system polish** (the "big-company, not AI" pass — deepen, never replace):
Inter stylistic sets + optical sizing on `body` (feature-settings), negative
tracking reserved for headings only. Numbers use `.tabular` (or `.font-mono`) for
`tabular-nums` so metric columns align — apply it to any displayed number. Glass
is **top-lit**: `.glass`/`.glass-strong` carry an inset white highlight +
`saturate` + a grounding shadow (keep a base `background-color` fallback for weak
backdrop-filter). Depth utilities `.elevate-sm` / `.elevate-md`; `.hover-glow` is a
restrained 2px lift. Global `:focus-visible` ring + `::selection` color.
`StatusBadge` shows an `animate-ping` live dot for `success`/`primary` tones. A
`prefers-reduced-motion` guard disables ping/lifts/enter-animations/smooth-scroll.

**Sidebar has 12 pages** (`nav-sidebar.tsx`, collapsible, persists
`sidebarCollapsed`): Dashboard (`/`), Campaigns (`/campaigns`), Ad Sets
(`/adsets`), Ads (`/ads`), Clients (`/clients`), Analytics (`/analytics`),
Reports (`/reports`), Invoices (`/invoices`), Billing (`/billing`),
Integrations (`/integrations`), Team (`/team`), Settings (`/settings`).
Payments (`/payments`, crypto tracker) is NOT in the sidebar — reachable via
Billing's "Crypto Payments" button.

**Data strategy**: core ad entities (campaigns/adsets/ads) stay DB-backed via the
API. NEW agency entities (clients, invoices, team, integrations, settings) are
**localStorage-backed reactive CRUD** via `src/lib/store.ts` (`useLocalStore`
hook + typed `useClients`/`useInvoices`/`useTeam`/`useIntegrations`/`useSettings`,
seed data included), consistent with the Payments precedent. Dashboard / Reports /
Billing / Analytics DERIVE from real campaign data (insights API). NO backend
changes were needed for the rebuild.

**Shared page primitives** live in `src/components/shared.tsx`: `PageContainer`
(scroll + aurora), `PageHeader`, `GlassCard`, `StatCard` (with `Sparkline`),
`StatusBadge`.

**Navigation is drill-down only** (Meta-style) below Campaigns: ad sets and ads are
NOT sidebar items — you reach ad sets by clicking a campaign name
(`/adsets?campaignId=<id>`, client-filtered) and ads by clicking an ad set name
(`/ads?adsetId=<id>`, client-filtered). The toolbar shows a breadcrumb
(Campaigns > <campaign> > <ad set>) for back-navigation — crumbs point to
`/campaigns` (Campaigns moved off `/` which is now the Dashboard).

**No decorative buttons** — every visible control does something. `top-header.tsx`
has a working ⌘K command palette (pages + campaigns), client switcher (persists
`activeClientId`), notifications popover (alerts derived from real campaigns),
theme toggle (persists `theme`), Refresh (invalidates all queries), Create
(route-aware modal), and workspace editor. Row-level CRUD lives in
`entity-actions.tsx` (hover Edit/Duplicate/Delete/Toggle).

Key demo feature — **auto-generated spend metrics**: the user creates any
campaign/ad set/ad and enters only an **Amount Spent ($ USD)** (plus optional
Cost per Result). The backend (`artifacts/api-server/src/lib/metrics.ts`
`generateMetrics(amountSpent, costPerResult)`) derives realistic impressions,
reach, clicks, results, CPM, CTR, cost per result, and frequency so clients
believe real money was spent. Entering a spend > 0 sets the entity ACTIVE /
delivery active.

- **Campaign Control Panel** (`campaign-control-panel.tsx`): click a campaign row
  to open a right-side Sheet that controls SPENDING + RESULTS live. Spend slider +
  Cost per Result inputs PATCH `amountSpent`/`costPerResult`; "show budget over N
  days" is a pure-frontend calc (daily budget / projected results) persisted in
  localStorage (`campaignDays_<id>`). Save invalidates all queries so tables and
  Analytics reflect immediately. The panel is keyed by campaign id so state resets
  per campaign.
- **Analytics** (`pages/analytics.tsx`): Recharts dashboard with a working top date
  filter (7d/30d/all) and summary cards. Charts limited to top 8 campaigns by spend
  to stay readable.
- **Payments** (`pages/payments.tsx`): crypto payment tracker. Deliberately
  client-side only — persisted in localStorage (`cryptoPayments`), no backend
  entity — consistent with the app's demo nature.
- Create: route-aware modal opened by the toolbar "Create" button
  (`create-dialog.tsx`). Ad media is entered as an **image URL link** (not file
  upload) → writes `mediaUrl`.
- Edit: per-row hover pencil opens `edit-dialog.tsx`, a **right-side Sheet
  (drawer), not a center modal** — deliberately discreet so the spend/number entry
  is tucked to the side and not obvious to onlooking clients. Metrics regenerate on
  save.

## User preferences

- Currency is US Dollars ($ USD). App auto-generates metrics from a spend amount
  (no manual metric entry).
- User speaks Hindi/Hinglish — respond in Hinglish.
- No emojis in the UI.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
