# Domain package schema ownership: logic schema vs Supabase DB schema

Type: grilling
Status: done

## Question

AGENTS.md says `packages/domain` holds "schemas" (alongside zones, redness index, trend math) but doesn't say whether that means app-level validation/type schemas or the source of truth for Supabase table columns.

Does `packages/domain` own the DB schema (Supabase migrations generated from it), or does it own only logic-level schemas (Photo/Spot/RoutineEntry/ZoneTrend or whatever the actual entities turn out to be named) that Supabase migrations reference but aren't required to match 1:1?

Dinh's initial lean (2026-09-11, single-click confirmation during destination-scoping, not a worked-through decision): domain owns logic-level schemas only; DB schema/migration is a separate infra detail. Treat as a starting point for this ticket's session, not a settled answer.

Call both the `grilling` and `domain-modeling` skills (`/grill-with-docs`) when working this ticket. If a decision crystallizes, capture it in `CONTEXT.md` (glossary only, no implementation detail) and offer an ADR if it's hard to reverse, surprising, and a real trade-off.

## Answer

Checked `docs/research/supabase-expo-nextjs.md` first: it specifies RLS policy shape (`user_id = auth.uid()`) but says nothing about schema-authoring workflow, and no `supabase/` or migration directory exists in the repo yet — this was a genuinely open decision, not another mis-framed one.

**Decision:** `packages/domain` owns the DB schema (against the initial lean recorded in the Question). Supabase migrations are generated from the domain package's TypeScript table definitions, not hand-written separately. Entities: `Photo`, `Spot`, `ZoneReading`, `RoutineEntry` — added to `CONTEXT.md` as part of resolving this ticket, since the ticket needed to name them to state the decision.

Recorded as ADR [0002-domain-owns-db-schema](../../../docs/adr/0002-domain-owns-db-schema.md), including the flagged risk: RLS-policy support in whatever tool implements this (e.g. Drizzle) was not verified against Supabase's specific patterns — check at implementation time, not asserted here from memory.

## Audit 2026-10-17

- Status: done
- Evidence: Decision recorded in ADR 0002 (docs/adr/0002-domain-owns-db-schema.md); packages/domain/src/schema.ts, schema.test.ts, drizzle/0000_init.sql.
