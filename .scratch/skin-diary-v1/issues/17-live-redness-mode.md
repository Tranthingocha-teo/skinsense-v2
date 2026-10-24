# 17: mpbench — live redness mode (spike)

**What to build:** a live webcam mode in `mpbench/bench.html` that runs the real web pipeline per frame and shows each zone's `redness`/`unevenness` on screen, so a stimulus can be dialled in while it is being applied rather than measured afterwards.

**Blocked by:** None

**Status:** superseded (by production-readiness 08)

- [x] `getUserMedia` feed in `bench.html` behind a live/still switch, reusing the existing `FaceLandmarker` + `ImageSegmenter` setup
- [x] Per frame: classify skin pixels into zones with `@skinsense/domain`'s `assignSpotToZone`, call `computeZoneReading`, draw the five numbers over the video
- [x] The still-image path (`bun run --cwd mpbench generate <photo>`) keeps working unchanged — fixtures still come from phone photos, not the webcam
- [x] No Supabase, no auth, no persistence; this is a bench tool

Two reasons this is not throwaway: it is the dose-dialling instrument for ticket [15](./15-fixture-acceptance-test.md)'s reshoot if the 2026-09-12 session fails to separate, and it is the working prototype of ticket [07](./07-web-capture.md)'s live capture overlay.

Scheduled 2026-09-13, in parallel with the native capture spike. Webcam numbers will not match phone numbers — different sensor, different optics — so this mode calibrates the stimulus, never the fixtures.

## Now

Built 2026-09-13 (Claude, `/implement`). `bun run --cwd mpbench live` → `run.ts --live`: bundles `@skinsense/domain` to `mpbench/dist/domain.js` (`bun build`, 11 KB, gitignored via the root `dist` rule; live only — `bench.html` imports it dynamically inside `runLive`, so `generate`/`--rate` never need it), serves it with a JS MIME type (server also strips the query string now — `bench.html?live` was a 404 before), launches the same headed Chrome with `camera` granted, opens `bench.html?live`, and returns when the window is closed.

`bench.html`: `runBench` split into `analyse(source, w, h, maxSide)` (draw → ≤`ANALYSIS_MAX_SIDE` canvas → landmarks + face-skin mask, returns typed arrays) + the Playwright wrapper (converts to plain arrays; the still path is byte-for-byte the same pipeline, `--rate photos/portrait.jpg` reproduces ticket 07's row). Live loop: `getUserMedia` with the app's constraints → each rAF frame through `analyse` → domain's real `partitionSkinPixels` + `readZones` → `zone redness ±unevenness (Npx)` drawn at each `zonePolygon` centroid, frame time + analysed size top-centre, "no face" when the detector misses. `?side=<px>` overrides the analysis size if frame rate matters more than matching the app. Not mirrored (the reading sits on the zone it was measured from).

Verified: fake-camera Chrome on `apps/web/e2e/fixtures/face.y4m` → 480×640 at ~144 ms/frame (~7 fps), five labels at the right zones; the real laptop webcam through Playwright's Chrome → 640×360 frames analysed; a 20 s `bun run live` stays up and leaves no Chrome behind. `bun run typecheck` 4/4, `bun run test` green (domain 9 files / web 7 / mobile 6).

`/code-review` (Standards + Spec, Sonnet sub-agents). Fixed: the `/` → `bench.html` route was dropped by the query-string fix (restored); `bun build` ran for the still path too (now `--live` only, dynamic import in the page); an `analyse` throw (mask-size mismatch) ended the rAF loop silently (now caught and drawn as the status line, loop continues); the server's MIME map was merged into the photo-extension map (split again). Spec: nothing missing; `pixelCount` in the label and `?side=` are the two small extras, kept.

Ceilings, on purpose: labels overlap on a small (far) face — the app's `far` cut-off covers that framing anyway; the 5-line label overlay is the prototype of ticket 07's live overlay only in the data path, not in visuals.

## Next

- Dinh: `bun run --cwd mpbench live`, sit at selfie distance, apply the ticket 15 stimulus and watch the target cheek's `redness` separate from the other zones before reshooting.
- `/code-review` ran; commit proposed — Dinh types `/commit`.
- Next in the chain: 18 (native capture spike), then 01b → 08 → 10 → 13.

## Audit 2026-10-17

- Status: superseded (by production-readiness 08)
- Evidence: `bun run live` exists in mpbench/package.json (commit 548de49); it is dev tooling for the dropped fixture series (ADR 0003 Addendum 5). Nothing further needed.
