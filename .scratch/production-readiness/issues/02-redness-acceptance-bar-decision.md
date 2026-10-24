# Redness-index acceptance bar: decision

Type: grilling
Status: done
Blocked by: 01

## Question

Given ticket 01's research, what sanity-check or acceptance criterion is enough before shipping the redness index?

Dinh's initial lean (2026-09-11, stated before seeing ticket 01's research, so a starting point rather than a decision): a monotonicity sanity-check across 2-3 manually varied test photos (index should increase with visibly worse redness), no formal accuracy target. When asked to pick between that, shipping with no check at all, or a stricter quantitative calibration, Dinh said the question needs research first — hence ticket 01 blocks this one.

Call both the `grilling` and `domain-modeling` skills (`/grill-with-docs`) when working this ticket.

## Answer

Automated Vitest fixture test in `packages/domain`: (1) monotonicity — computed redness increases across 2-3 of Dinh's own test photos with deliberately increasing visible redness; (2) small-N rank agreement — the index's ranking of a handful of test photos matches a human (Dinh only, confirmed in a 2026-09-11 follow-up grilling pass — no additional raters) rank-ordering of the same photos by visible redness. Committed as pre-extracted `{ landmarks, mask }` + per-pixel `a*` data (not raw photo files — `packages/domain` stays pure TypeScript, no I/O, per ADR 0001), derived once from real photos of Dinh's own face via the web pipeline (the only verified capture path per ticket 07; native has no capture code yet). Repo confirmed private on GitHub, so committing the derived fixture data is acceptable. Exact assertion strictness (strict order vs. some tolerance) is left to implementation time — low-stakes, trivially adjustable later, not locked here. A failing fixture test blocks merge (hard CI gate, confirmed same pass): an intentional redness-formula change that legitimately shifts monotonicity or rank order must update the fixture data and expected order in the same PR, with an explanation of why the shift is expected — never silently adjusted to make the test pass.

Rejected: no check (no evidence either way, costs little more to automate once fixtures exist anyway); test-retest and reference-patch checks (weakest, unverified literature precedent; reference-patch also misaligned with the index's self-referenced design, which needs no absolute calibration per `redness-index.md`); stricter quantitative calibration (every precedent found needs a dermatologist rater, not a few-hours solo task); manual one-off not committed to the repo (no lasting regression protection).

A synthetic-image (flat colour + red patch, not real photos) Vitest test of `packages/domain`'s full pipeline — including the sRGB→CIELAB conversion, not just the median/MAD aggregation math — is also required, per the `mediapipe-tflite` skill's own test plan and a 2026-09-11 follow-up grilling pass on ADR 0003: pre-computed-`a*` fixtures alone never exercise the conversion code, so a conversion bug (wrong gamma, wrong matrix, swapped channel) would otherwise go uncaught. Still doesn't substitute for the real-photo fixture check above, since synthetic images never exercise whether the index tracks real visible redness on an actual face.

Recorded as [ADR 0003](../../../docs/adr/0003-redness-index-acceptance-bar.md). Full research: ticket [01](01-redness-validation-bar-research.md).

Worked as `/grill-with-docs` per this ticket's own instruction (both `grilling` and `domain-modeling` skills called).

## Audit 2026-10-17

- Status: done
- Evidence: Decision recorded in ADR 0003 and its addenda (docs/adr/0003-redness-index-acceptance-bar.md).
