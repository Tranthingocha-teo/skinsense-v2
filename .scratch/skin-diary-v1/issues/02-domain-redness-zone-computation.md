# 02: Domain — redness/zone computation + synthetic-pipeline test

**What to build:** `packages/domain`'s pure computation core — turning `{ landmarks, skinMask }` into zone-level redness/unevenness numbers and spot-zone assignment. Fully verifiable today with synthetic input; needs no capture UI, no real photos, no other ticket.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Zone polygon computation (5 fixed zones: forehead, left cheek, right cheek, nose, chin) from 468 landmarks, with eye/brow/lip/nostril exclusions, per ADR 0001
- [x] sRGB → linear → XYZ (D65) → CIELAB conversion + self-referenced redness formula per ADR 0003: `redness(zone) = median(a*_zone) − a_ref` (a_ref = median a* over all skin pixels), `unevenness(zone) = MAD(a*_zone)`
- [x] Spot-to-zone assignment from normalized face-relative coordinates
- [x] Routine completion % arithmetic (pure, no I/O)
- [x] Synthetic-image test (flat colour + a red patch, not real photos) exercises the full pixel→CIELAB→index pipeline including the color-conversion code, per spec.md Testing Decisions
- [x] Ordinary synthetic/property-style unit tests for zone-polygon computation and spot-to-zone assignment
- [x] `bun run test` green in `packages/domain`
- [ ] Out of scope here, by spec.md's own Out of Scope section: the fixture-based acceptance-bar test (monotonicity + rank agreement against Dinh's real photos, ADR 0003). It needs the `mpbench` fixture harness — `.scratch/production-readiness/issues/08-mpbench-fixture-harness.md` (external, open, not blocking). Add that test in a follow-up once fixtures exist; don't build the harness inside this ticket.

## Now

**Ticket complete** (bar the explicitly out-of-scope fixture test above). `packages/domain/src`: `color.ts` (sRGB→Lab), `redness.ts` (`computeZoneReading`: median/MAD aggregation over pre-partitioned pixel lists), `routine.ts` (`routineCompletionPercent`), `geometry.ts` (generic `pointInPolygon` + `sortPointsByAngleAroundCentroid`), `zones.ts` (`zonePolygon` + `assignSpotToZone`, 5 skin zones + eye/brow/lip/nostril exclusions). All test-first; `bun run test` (22 tests) and `bun run typecheck` green in `packages/domain`.

Zone/exclusion landmark indices came from production-readiness ticket 06 (research, normally agy's — Dinh explicitly authorized a one-time Claude override, same precedent as ticket 01). Two deliberate simplifications flagged with `ponytail:` comments in `zones.ts`, not re-litigated here: eyebrow exclusion is a padded bounding box (no official brow-outline polygon exists), and chin's polygon is an angle-sorted hull of an anatomical seed-point set (no pre-ordered boundary loop exists either) — both are the thinnest-evidenced parts of the index map per ticket 06's Answer.

Not done, correctly out of scope: real-photo fixture data / pixel-buffer partitioning into per-zone pixel lists from an actual mask+image — that glue belongs to the web/mobile capture tickets (07/08), which are the first to actually have a pixel buffer to partition.

`/code-review` ran, found 3 issues, all fixed: `computeZoneReading` returned NaN for a zone with zero pixels (now returns `{redness:0, unevenness:0, pixelCount:0}`), `routineCompletionPercent` didn't clamp to 0–100, and `zones.test.ts` hardcoded its own copies of the index arrays instead of importing them from `zones.ts` (now exports `ZONE_INDICES`/`LEFT_EYE`/`LEFT_EYEBROW`/`LEFT_NOSTRIL` for the test to import). 25 tests green, typecheck clean.

## Next

- Ready for `/to-tickets`' dependency order to move to ticket 03 (blocked by ticket 01, still `ready-for-human`/unprovisioned) or another unblocked ticket.

## Audit 2026-10-17

- Status: done
- Evidence: packages/domain redness.ts, zones.ts, geometry.ts with redness.test.ts, zones.test.ts, geometry.test.ts (commit 1d5d42c). The one open box is out of scope by the ticket's own words.
