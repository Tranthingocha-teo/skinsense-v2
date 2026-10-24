# Routine checklist contents: decision

Type: grilling
Status: done

## Question

`CONTEXT.md`'s `RoutineEntry` entry, added while resolving [ticket 04](./04-domain-schema-ownership.md), flagged: "Does not define what the checklist itself contains; that's still open." `docs/research/2026-09-11-landscape-and-decisions.md` already commits the trend view to a "routine completion %" figure, so the checklist's shape needs pinning down before `/to-tickets` schedules the routine-tracking screens.

Sub-questions grilled: fixed-for-everyone vs. user-customizable checklist; single daily boolean vs. itemized per-night completion; whether `RoutineEntry` should reference `RoutineItem` ids or snapshot their labels; whether ticking requires a same-day `Photo`; new-user default state; whether items need manual reordering.

## Answer

User-customizable, itemized. New entity `RoutineItem`: user-owned, ordered (user-reorderable) list of named steps; new users get a small seeded default set they can edit or delete. `RoutineEntry` stores which items were completed each night as a **snapshot of item labels at tick time**, not `RoutineItem` id references — protects past nights' records and the completion-% trend from later renames/deletes. Ticking is independent of `Photo` — no same-day capture required.

Recorded as [ADR 0004](../../../docs/adr/0004-routine-checklist-user-customizable.md). `CONTEXT.md` updated: `RoutineEntry` entry resolved, new `RoutineItem` entry added.

## Audit 2026-10-17

- Status: done
- Evidence: ADR 0004 (docs/adr/0004-routine-checklist-user-customizable.md); packages/domain/src/routine.ts with routine.test.ts.
