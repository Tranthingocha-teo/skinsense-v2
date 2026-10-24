# mpbench fixture-generation harness: build

Type: task
Status: done

## Question

[ADR 0003](../../../docs/adr/0003-redness-index-acceptance-bar.md)'s acceptance-bar test needs fixtures — pre-extracted `{ landmarks, skinMask }` plus per-pixel `a*` data, derived once from real photos of Dinh's own face via the web capture pipeline (per [ticket 07](./07-mask-resolution-alignment-spike.md), the only verified path). That pipeline doesn't exist in this repo yet: `apps/web/src/app/page.tsx` is still the unmodified create-next-app stub, and the `mpbench` Playwright harness ticket 07 ran against lives only in an uncommitted scratchpad outside the repo (per `docs/research/on-device-face-ai.md`), not committed here.

Build and commit an `mpbench`-equivalent harness capable of: running the web capture pipeline (`FaceLandmarker` + `ImageSegmenter`) against a real face photo, extracting `{ landmarks, skinMask }`, and computing the resulting per-pixel `a*` data — so ADR 0003's fixtures can actually be generated, and regenerated later when a redness-formula change intentionally shifts them (ADR 0003's addendum requires a same-PR fixture update in that case).

Blocks: capturing the first real fixture set for ADR 0003's acceptance-bar test. Opened 2026-09-11 during a follow-up grilling pass on ADR 0003, at Dinh's choice, rather than leaving the gap unticketed.

## Answer

Grilled 2026-09-12 (`/grill-me`, functioning as this ticket's `/wayfinder` pass). See ADR 0003's Addendum 3 for the fixture-shape correction this surfaced: fixtures are raw RGB pixel arrays per zone (matching `computeZoneReading`'s actual signature), not precomputed `a*` — this ticket's original framing above is superseded by the addendum.

Built as a new workspace, `mpbench/` (added to root `package.json`'s `workspaces`, alongside `apps/*`/`packages/*`, so it can depend on `@skinsense/domain` directly):

- `mpbench/bench.html` — runs the real web pipeline in an actual browser (`@mediapipe/tasks-vision@0.10.21`, same model URLs and GPU delegate as ticket 07's benchmark): `FaceLandmarker.detect()` for the first 468 landmarks, `ImageSegmenter.segment()` for the `selfie_multiclass_256x256` category mask (class 3 = face-skin, per ticket 05's amendment). Returns only raw data (landmarks, a binary skin mask, the full RGBA pixel buffer) — no zone logic here, so there is no second copy of it to drift from `packages/domain`'s.
- `mpbench/run.ts` — the Node/bun driver: serves `bench.html` over a local HTTP server, launches headed Chrome via Playwright (`channel: "chrome"`, matching ticket 07's verified GPU-delegate setup), feeds it one photo as a data URL, then does the pixel→zone classification itself by calling `@skinsense/domain`'s real `assignSpotToZone` per skin pixel — so fixture generation exercises the app's actual zone-polygon logic, not a reimplementation. Writes `{ allSkinPixels, zonePixels }` as JSON.
- Fixture output: `packages/domain/src/__fixtures__/redness/<photo-name>.json` — colocated with the future fixture-consuming test (separate ticket; out of scope here), so a regeneration under ADR 0003's same-PR rule never needs a manual copy step.
- Source photos: gitignored (`mpbench/photos/`), never committed — only the derived fixture JSON is. Real face photos are more sensitive than derived pixel arrays even in a private repo.
- `packages/domain/src/index.ts` gained one export, `ZONE_INDICES` (was already public in `zones.ts`, just not re-exported) — `run.ts` uses it to get the canonical 5-zone name list instead of hardcoding a second one.
- `.claude/hooks/typecheck-on-stop.sh`'s Stop-hook regex now also covers `mpbench/*.ts` for `tsc` (not `bun run test` — running Playwright against a real browser isn't something that should fire on every session stop).

Usage: `bun run --cwd mpbench generate <path-to-photo.jpg>` (needs a real face photo — not run yet; no fixtures exist in the repo as of this ticket closing). Not this ticket's scope: writing the fixture-based acceptance test that will consume the output (ADR 0003 / ticket 02 already specify its design — monotonicity + Dinh-only rank agreement).

## Audit 2026-10-17

- Status: done
- Evidence: mpbench harness exists (mpbench/run.ts, commit d0b2b88; `bun run live` added in 548de49).
