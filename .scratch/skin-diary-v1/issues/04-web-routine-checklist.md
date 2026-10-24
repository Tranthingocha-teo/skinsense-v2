# 04: Web — routine checklist

**What to build:** the Routine Checklist screen for real — add, rename, delete, and reorder personal routine steps, and tick which ones were done tonight, independent of taking a photo.

**Blocked by:** 03

**Status:** done

- [x] New user sees a small seeded default `RoutineItem` set (per ADR 0004), not a blank screen
- [x] Add / rename / delete / reorder `RoutineItem`s, persisted
- [x] Ticking tonight's completion creates a `RoutineEntry` that snapshots each ticked item's **label at tick time** (not an id reference), per ADR 0004
- [x] Ticking routine works on a night with no `Photo` taken
- [ ] Editing or deleting a `RoutineItem` later does not change the label text already stored in past `RoutineEntry` snapshots
- [ ] Screen matches the published canvas's `RoutineChecklist` artboard: progress bar, checkbox/kebab/add-step affordances, all interactive elements ≥44×44px tap targets
- [x] All UI strings shipped in Vietnamese + English

## Now

Built 2026-09-13 (Claude, `/implement`): `apps/web/src/lib/routine.ts` (all Supabase access: load + client-side seed, add/rename/delete/swap, `routine_entries` upsert on `user_id,night`), `src/components/routine-checklist.tsx` (client; local-date `night` set after mount, optimistic writes, reload on a failed write, native `popover` kebab with Rename / Move up / Move down / Delete, inline rename + add, 44px targets), `/app/routine` page + link from `/app`, `Routine` i18n namespace (defaults: Tẩy trang / Rửa mặt / Serum trị mụn / Kem dưỡng ẩm), canvas tokens in `globals.css` under shadcn names (`--card/--border/--muted-foreground/--primary/--success/--radius`; the create-next-app dark block dropped — the canvas is single-look light). No `shadcn init`, no font swap: ticket 06. `@skinsense/domain` added as a web dependency for `routineCompletionPercent`; Next resolves the workspace `.ts` entry without `transpilePackages`. Testing Library `cleanup` added to `vitest.setup.ts` (first multi-test file). 4 component tests (render, tick → snapshot payload, rename never calls `saveEntry`, move down reorders); `bun run test` 6 green, `bun run typecheck` clean.

Verified against the real project: the `on_conflict=user_id,night` upsert (service-role script, explicit `user_id`, two upserts → one row, cleaned up). Not verified: the signed-in UI flow — the Chrome MCP tab had no `localhost:3000` session, and sign-in is Dinh's action.

`/code-review` found the seed was a check-then-act race (Strict Mode's double effect alone would insert 8 items). Fixed at the root: `unique (user_id, label)` on `routine_items` in `schema.ts` (labels are the snapshot key, so they must be unique anyway) → `drizzle/0001_routine_items_unique_label.sql`, applied to the project via the Supabase MCP as `routine_items_unique_label`; the seed is now an `upsert … ignoreDuplicates` followed by a re-read. Verified: two concurrent seeds against the real project → 2 rows, not 4.

Seeding corner (`ponytail:` comment in `routine.ts`): a user who deletes every item before their first tick gets the defaults back on reload. Mobile (ticket 05) seeds the same way: `upsert … ignoreDuplicates` on `(user_id, label)` + re-read; the DB carries the invariant.

## Next

- Dinh: sign in at `localhost:3000`, open `/app/routine`, tick two steps, reload → still ticked; rename one → past tick unaffected. Then tick the remaining boxes above.
- Commit proposed; Dinh types `/commit`.

## Comments

- 2026-09-14 (`/grill-me`, third pass): both open boxes are Claude's before 20/09. Retroactive edit: a test that renames and deletes a `RoutineItem` and asserts past `RoutineEntry` labels are unchanged. Canvas match: Claude compares a production screenshot with the `RoutineChecklist` artboard; only tap targets <44 px get fixed, other drift goes to `../known-limitations.md`.

## Audit 2026-10-17

- Status: done
- Evidence: Commit c6f1858; routine-checklist.test.tsx (rename, tick snapshots labels) and domain routine.test.ts. Canvas-match box is superseded by redesign-build 03 (commit 09c8a4b).
