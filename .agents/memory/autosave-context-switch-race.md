---
name: Autosave + context-switch race
description: How a "skip while saving" load effect drops a rehydrate after the active entity changes mid-save, and how to fix it.
---

# Autosave / query-invalidation race with a "saving" guard

When a form panel autosaves to an API, invalidates queries on success, and reloads
its form from the freshest server data inside a `useEffect`, a common guard is:
"if `savingRef.current` is true, skip the reload so our own save echo doesn't stomp
edits in progress."

**The bug:** if the user switches the active entity (e.g. selects a different
campaign) *while a save is in flight*, the load effect fires once, bails on
`savingRef`, and — because its deps (the new entity id/fields) don't change again —
never reruns after `savingRef` flips false. The panel then shows entity B's context
while `form`/`baseline` still hold entity A's values, so the next save can write A's
numbers onto B.

**Fix (two parts):**
1. Track the last-loaded id in a ref. Treat an id change as a *forced rehydrate*:
   `const switched = loadedIdRef.current !== entity.id;` — only skip the reload when
   `!switched && savingRef.current` (a genuine same-entity save echo). On a switch,
   clear `savingRef` and reload fresh.
2. Capture the target id at save-call time and, in the mutation's `onSuccess`/`onError`,
   only touch `baselineRef`/`savingRef` if `loadedIdRef.current === targetId`. A late
   callback for the entity the user already left must not clobber the live panel.

**Why:** effect deps only re-run the effect when *they* change; a ref flipping does
not. Any "skip while busy" branch inside an effect needs a separate trigger (id change)
that guarantees the skipped work eventually runs.

**Related:** local component state tied to a prop (e.g. `<img>` loaded/errored in a
creative preview) must reset on the prop that identifies the source — add
`useEffect(() => { setLoaded(false); setErrored(false); }, [url])` or key the component
by url — or a stale error lingers when the source changes in place.
