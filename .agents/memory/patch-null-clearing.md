---
name: PATCH null-clearing convention
description: How Express PATCH handlers must distinguish "clear this field" from "leave it unchanged".
---

In PATCH/partial-update handlers, build the `updates` object with two different guards
depending on the column:

- **Nullable columns**: guard with `if ("field" in body)`, then assign
  `body.field` (or `body.field != null ? body.field.toString() : null` for numeric/
  decimal columns). This lets a client send explicit `null` to CLEAR the value while
  omitting the key leaves it unchanged.
- **NotNull columns** (name, status, enums with defaults, startDate, etc.): keep
  `if (body.field != null)`. Never allow these to be set to null.

**Why:** With `if (body.field != null)` on a nullable column, sending `null` is silently
ignored, so users can never clear an optional field once set — a real edit-parity bug
that failed code review.

**How to apply:** Any new nullable field added to a table must be threaded through the
response mapper, POST insert, PATCH (using `"field" in body`), and the duplicate handler
in lockstep, or it silently won't round-trip.
