# Routine checklist is user-customizable, itemized, and history-snapshotted

`packages/domain` gains a new entity, `RoutineItem`: a user-owned, ordered list of named steps (e.g. "Cleanser", "Moisturizer") that together make up that user's nightly routine checklist — not a fixed, same-for-everyone list. Users add, rename, delete, and reorder their own items; new users start with a small seeded default set they can edit or remove.

`RoutineEntry` (already named in [ADR 0002](./0002-domain-owns-db-schema.md)) is itemized: each night's entry stores which items were completed, as a **snapshot of those items' labels at the time of ticking** — not a reference to `RoutineItem` ids. Renaming or deleting a `RoutineItem` later never changes what a past `RoutineEntry` shows, and never retroactively shifts the completion-% trend `docs/research/2026-09-11-landscape-and-decisions.md` already commits to. Ticking a `RoutineEntry` is independent of taking a `Photo` that day — the two aren't coupled.

This resolves the gap `CONTEXT.md`'s `RoutineEntry` entry flagged as still open when it was first added while resolving [ticket 04](../../.scratch/production-readiness/issues/04-domain-schema-ownership.md).

Item label validation (length limits, duplicate names) is left to implementation time — low-stakes, not worth locking here.

## Considered Options

- Fixed, same-for-everyone checklist: rejected — Dinh chose full user customization; costs a small `RoutineItem` CRUD entity and screen, not ruled out for budget reasons.
- Single boolean per day (no itemization): rejected — the trend view already commits to "routine completion %", which reads more naturally as items-completed/items-total per night than a coarser days-completed/days-total rate.
- `RoutineEntry` storing `RoutineItem` id references instead of label snapshots: rejected — a later rename or delete would silently change what a past night's entry displays, and could shift the historical completion-% trend without the user having done anything different on those past nights.
- Routine ticking gated behind taking a `Photo` that day: rejected — skincare adherence and photo-taking are different habits with different cadences; coupling them would suppress routine logging on days the user skips the photo.
