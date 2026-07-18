---
name: Performance Controls panel open/expand pattern
description: Why openPerf must both close the drawer and force-expand the fixed bottom-right panel
---

The campaigns "Performance Controls" is a single fixed bottom-right panel (`performance-controls.tsx`) keyed to `activeCampaignId`, with its own `collapsed` state that defaults to collapsed.

Rule: any UI action that "opens" it (card Controls button, drawer "Open controls") must go through `openPerf` in the campaigns context, and `openPerf` must (1) set `activeCampaignId`, (2) close any open campaign drawer, and (3) bump a `perfNonce` the panel watches to force-expand.

**Why:** setting only `activeCampaignId` looks like a no-op — the panel stays collapsed (just a small pill) so users think the button is broken. And the campaign drawer is a Radix Sheet at z-50 which covers the panel (z-40), so opening perf from inside the drawer shows nothing until the drawer is closed.

**How to apply:** never expand the panel by reaching into its internal state; drive it via the shared `openPerf`/`perfNonce` signal. If you add another entry point to the panel, route it through `openPerf`.
