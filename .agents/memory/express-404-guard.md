---
name: Express 404 guard braces
description: Why unbraced 404 guards in Express route handlers hang the happy path
---

In Express route handlers, a not-found guard written on one line without braces is a silent trap:

```ts
if (!row) res.status(404).json({ error: "Not found" }); return;  // BUG
```

The `return;` is a separate statement, so it runs **unconditionally** — even when `row` exists. The success response below it (`res.json(...)`) is never reached, and since no response is sent the request hangs until the client times out. The 404 path looks fine, which makes it easy to miss.

Always brace the guard:

```ts
if (!row) { res.status(404).json({ error: "Not found" }); return; }
res.json(toApi(row));
```

**Why:** This pattern was introduced by a bulk `sed` edit that converted `return res.status(404)...` into two statements to satisfy TS7030 (not all code paths return). The transform dropped the braces, so PATCH/GET-by-id/toggle/duplicate handlers across every route file hung on the happy path.

**How to apply:** When mechanically rewriting `return res.status(...)...` into a statement-plus-return form, wrap in braces. Grep for `res.status(404).json({ error: "Not found" }); return;` after such edits to confirm every occurrence is braced.
