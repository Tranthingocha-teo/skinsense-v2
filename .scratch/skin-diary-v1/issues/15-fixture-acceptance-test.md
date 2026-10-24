# 15: Domain — fixture-based acceptance-bar test (ADR 0003)

**What to build:** the real acceptance-bar test ADR 0003 requires — monotonic response of one cheek to a graded local stimulus, with the other cheek as control — so the Stop-hook's `packages/domain` Vitest gate stops passing vacuously.

**Blocked by:** None (`mpbench` is built and now prints each zone's reading)

**Status:** wontfix

- [ ] Dinh shoots the series per the protocol below and runs `bun run --cwd mpbench generate <photo>` on each, producing fixture JSON under `packages/domain/src/__fixtures__/redness/`
- [x] Vitest test in `packages/domain` asserts the **left cheek's** `redness` increases monotonically across the five doses
- [x] Same test asserts the **right cheek's** `redness` across the same five photos stays within the measured noise floor
- [x] Noise floor = the largest spread in `redness` across the three dose-0 photos, computed from the fixtures themselves, not a hardcoded constant chosen after seeing results
- [x] Same test asserts the left cheek's total swing (`dose8 − dose0`) **exceeds** the noise floor — without this, five readings all sitting inside the noise pass "monotonic" by chance and the test is vacuous
- [ ] `bun run test` green in `packages/domain` with this test included and load-bearing (not vacuous)
- [x] Folds `.scratch/production-readiness/issues/11-fixture-consuming-test.md` — mark that ticket resolved, pointing here

## Photo protocol (ADR 0003 Addendum 4)

7 photos, one session, nothing changed between them but the dose:

1. Three consecutive photos with nothing applied. The first is the series' dose-0 point; all three together give the noise floor.
2. A comfortably warm (~40 °C) compress on the **left cheek only**, cumulative doses of 2/4/6/8 minutes. After each dose: remove the compress, dry the cheek, wait ~30 s for the sheen to go, shoot.

Camera: phone in manual mode — white balance locked, ISO and shutter locked, flash off, phone on a fixed rest, room lighting unchanged for the whole session. Right cheek, forehead, nose and chin are never touched; they are the reference the index measures against.

Filenames carry the dose, because the fixture JSON is named after the photo and the test has no other way to order them. Name the phone files `dose0-a`, `dose0-b`, `dose0-c`, `dose2`, `dose4`, `dose6`, `dose8` (`dose0-a` is the series' dose-0 point). Copy them into `mpbench/photos/`, then:

```
bun run --cwd mpbench generate photos/dose0-a.jpg
```

Measure as you go: that command prints `redness` and `unevenness` per zone, so a series that fails to separate is caught during the session rather than after it.

## Now

**Dropped 2026-09-14 (Dinh: "bỏ hẳn").** No photo session; `redness.fixture.test.ts` deleted (last in commit `e28da31`, restorable from there); ADR 0003 Addendum 5 records it. Ticket kept for the protocol and test design only.

Test written 2026-09-14 (Claude, `/implement`): `packages/domain/src/redness.fixture.test.ts`. Loads `__fixtures__/redness/{dose0-a,dose0-b,dose0-c,dose2,dose4,dose6,dose8}.json` (mpbench's `{ allSkinPixels, zonePixels }` shape) and asserts the three Addendum 4 clauses: left cheek strictly increasing across dose0-a→dose8; right-cheek spread over the same five photos ≤ noise floor; left swing dose8−dose0-a > noise floor. Noise floor = the right cheek's own spread across the three dose-0 photos (ADR 0003 Addendum 4's wording, confirmed by `/code-review`), computed from the fixtures. While any of the 7 files is missing the suite is `describe.skipIf`-skipped with the missing names in its title, so the Stop hook stays green until the photo session; the moment all 7 land it is load-bearing. Proven on 7 synthetic fixtures (pass), then dose6/dose8 swapped (fails on "dose8 vs dose6") — synthetic files deleted, not committed. One thing the synthetic run showed that the session must clear: because the left cheek is ~1/5 of the skin pixels, reddening it moves the all-skin median, so the control cheek drifts a little in the opposite direction (≈0.4 a* on synthetic data) — the measured right-cheek noise floor has to exceed that drift or clause 2 fails for a reason that is the index's design, not the camera.

Remaining box = Dinh's photo session (protocol above), then `bun run --cwd mpbench generate photos/<name>.jpg` × 7 and `bun run test` in `packages/domain`.

Earlier attempt, since reverted: 3 internet photos of different people (open-access PMC case series) were substituted for Dinh's own, at Dinh's direction. `mpbench generate` ran on all 3; cheek redness came out mild -0.82/-2.61, moderate **6.94/4.88**, severe 2.18/3.14 — not monotonic. Root cause is the index itself, not photo quality: `redness(zone) = median(a*_zone) − median(a*_allSkin)` is self-referenced within one photo, so it carries no meaning across different faces, lighting or skin tones. The 3 fixture JSONs and the source photos were deleted.

The same self-referencing also rules out the whole-face-flush idea (hot shower, exercise) considered on 2026-09-12: the zone and the reference rise together and the index does not move. Hence the local-stimulus protocol above.

Session scheduled for the evening of 2026-09-12. If the series fails to separate from the noise floor, reshoot 2026-09-13 using ticket 17's live mode to dial the dose in real time.

## Audit 2026-10-17

- Status: wontfix
- Evidence: Closed by decision: the real-skin fixture test was dropped (ADR 0003 Addendum 5, commit 0d21829).
