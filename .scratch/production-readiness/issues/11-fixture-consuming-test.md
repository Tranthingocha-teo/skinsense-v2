# ADR 0003 acceptance-bar test: consume mpbench's fixtures

Type: task
Status: done

## Question

[Ticket 08](./08-mpbench-fixture-harness.md) built `mpbench` to generate fixture JSON (`packages/domain/src/__fixtures__/redness/<photo-name>.json`) but named the test that consumes those fixtures as a separate, explicitly out-of-scope follow-up — and that follow-up was never itself ticketed until now. ADR 0003 / [ticket 02](../../skin-diary-v1/issues/02-domain-redness-zone-computation.md) already specify the test's design (monotonicity across Dinh's own photos with increasing visible redness, plus small-N rank agreement against Dinh's own human ranking — solo rater, per the 2026-09-11 follow-up grilling pass).

Write the Vitest test in `packages/domain` that loads the fixture JSON and asserts monotonicity + rank agreement per that design. Blocked in practice (not formally `Blocked by`) on real fixtures existing: `mpbench` has generated none yet (`bun run --cwd mpbench generate <photo>` not run as of ticket 08's close). Until fixtures land, this ticket has nothing to consume.

Not blocking now: no fixtures exist, so the Stop-hook's `packages/domain` Vitest gate (ADR 0003) passes vacuously either way. Becomes load-bearing the day fixtures land — that's when a missing or wrong test here would silently under-validate the acceptance bar.

Spun out 2026-09-12 during a `/grill-me` pass on overall production-readiness (not a domain-seam ticket itself, but sits on ADR 0003's critical path and was found dangling).

## Answer

Folded into `skin-diary-v1` [ticket 15](../../skin-diary-v1/issues/15-fixture-acceptance-test.md). The test was written 2026-09-14 (`redness.fixture.test.ts`, ADR 0003 Addendum 4's three clauses) and dropped the same day with the photo session, at Dinh's decision — ADR 0003 Addendum 5. Restorable from commit `e28da31`.

## Audit 2026-10-17

- Status: done
- Evidence: Test written in e28da31; the real-skin fixture test was dropped by decision (ADR 0003 Addendum 5, commit 0d21829), so the ticket is closed by decision, not by a running test.
