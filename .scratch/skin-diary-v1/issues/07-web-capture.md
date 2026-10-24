# 07: Web — guided capture → Photo/ZoneReading

**What to build:** a signed-in user takes a real guided photo in the browser and gets real per-zone redness numbers back, persisted.

**Blocked by:** 03, 02

**Status:** done

- [x] Live guide overlay: face landmark dots, ghost of the previous photo, brightness badge, face-guide oval — matches the canvas's `Capture` artboard
- [x] `getUserMedia` + `@mediapipe/tasks-vision` (`*.web.tsx`) produces `{ width, height, landmarks[468], skinMask }` per ADR 0001's wire format
- [x] Auto white balance locked at capture time (best effort: `whiteBalanceMode: "manual"` when the track exposes it; the result is recorded as `awb_locked`)
- [x] (rated 2026-09-13, see the rating pass below) A poorly-lit or poorly-framed capture is flagged to the user before saving — signal/threshold not yet spiked (2026-09-12 grill: reuse v1's blur/pose/light signals, Claude proposes concrete thresholds, Dinh validates by rating a test photo set, same pattern as ADR 0003's acceptance bar). Spike this before implementing the check; do not guess numbers.
- [x] Zone analysis (ticket 02's domain functions) runs before on-device compression to ≤2MB; upload via `arrayBuffer()`, not base64
- [x] `Photo` (image + brightness/AWB metadata) and one `ZoneReading` per zone persisted to Supabase; image stored in the private `photos` bucket at `${auth.uid()}/${entryId}.jpg`, RLS-scoped
- [x] "Not a medical diagnosis" disclaimer visible wherever a redness number is shown
- [x] Playwright E2E with a fake camera (fake-device + fake-video-capture flags) covers sign-in → capture → save
- [x] All UI strings shipped in Vietnamese + English

## Now

Built 2026-09-13 (Claude, `/implement`). Domain first: `packages/domain/src/capture.ts` (`FaceCapture` = ADR 0001's wire format, `partitionSkinPixels` — the pixel→zone glue ticket 02 left to this ticket, via the domain's own `assignSpotToZone` with a landmark-bbox pre-check — and `readZones`), `capture-quality.ts` (`meanLuma`, `faceFraming` = bbox width / centre offset / yaw proxy from nose tip vs. face edges 234/454, `laplacianVariance`, `captureIssues` against exported `QUALITY` cut-offs); 9 tests. `mpbench/run.ts` now calls `partitionSkinPixels` instead of its own loop and prints the quality signals per photo.

Web: `apps/web/src/lib/capture-engine.web.ts` (`@mediapipe/tasks-vision@0.10.21` pinned — npm latest is 1.0.1, unverified; same model/wasm URLs and GPU delegate as mpbench; `FaceLandmarker` VIDEO mode singleton for the live loop and the still, `ImageSegmenter` IMAGE mode class 3 = face-skin; `sampleFrame` ≈10 fps → landmarks + badge issues; `captureStill` locks AWB best-effort, analyses an uncompressed ≤640px copy — `ANALYSIS_MAX_SIDE`, ponytail knob — then JPEG-compresses the full frame under 2MB), `src/lib/photos.ts` (`latestPhotoUrl` signed URL for the ghost; `savePhoto`: `arrayBuffer()` upload to `photos/${uid}/${id}.jpg` → `photos` row → 5 `zone_readings`, all five stored, `pixel_count 0` is the "hide me" signal), `src/components/capture.tsx` (mirrored preview + ghost + canvas overlay with guide oval and 468 dots; phases live → review (issues list + Retake / Save / Save anyway; no face = Retake only) → saved (5-zone table + disclaimer + Take another / Done)), `/app/capture` page + link from `/app`, `Capture` i18n namespace vi/en. Storage had no RLS policy at all: `packages/domain/drizzle/0002_photos_storage_owner_policy.sql` (drizzle `generate --custom`, since drizzle can't model `storage.objects`) = owner-folder policy on bucket `photos`, applied to the project via the Supabase MCP as `photos_storage_owner_policy`.

Tests: 2 Vitest component tests (engine + data layer mocked: dark capture → warning + "Save anyway" → `savePhoto` payload + disclaimer + table; no-face → Retake only). Playwright E2E `apps/web/e2e/capture.spec.ts` (`playwright.config.ts`: system Chrome, fake-device flags, `e2e/fixtures/face.y4m` = one 480×640 frame of MediaPipe's public `portrait.jpg` test asset (an `.mjpeg` was tried first and Chrome rendered it as a flat green frame, so y4m); auth = service-role `generateLink(magiclink)` + `verifyOtp` through `@supabase/ssr`'s own cookie writer for `e2e@skinsense.test`, since GIS can't be driven headless) → sign-in → capture → Save → asserts the `photos` row, `storage_path = ${uid}/${id}.jpg`, five `zone_readings`, the storage object. Green (28 s). Real numbers from that run: brightness 159, forehead −0.1 / cheeks 2.2 & 2.7 / nose 1.5 / chin 0.9, nose only 88 px at the fixture's face size. `bun run typecheck` 4/4, `bun run test` 41 domain / 11 web / 6 mobile green, eslint clean on the new files.

**Quality check — not shipped to users yet, per the ticket's own rule.** The signals are real (skin luma, face-box width/centre, a yaw proxy, Laplacian variance) and `captureIssues` + the `QUALITY` cut-offs exist in `capture-quality.ts`, but the cut-offs are Claude's proposals (`ponytail:`), so the UI filters to the one objective signal, `noFace` (`shownIssues` in `capture.tsx`, one filter to delete once validated); the live badge says "Đã thấy mặt" instead of the artboard's "Đủ sáng" until a brightness cut-off is validated. `/code-review`'s Spec agent caught the first draft shipping the guessed thresholds live. The rating instrument: `bun run --cwd mpbench generate <photo>` prints `quality: brightness= faceWidth= centerOffset= yaw= sharpness= issues=[…]`. Sharpness is measured over the whole analysis frame, not a face crop — first thing to revisit if the rating pass disagrees with `blurry`.

Not verified: a real phone (Safari/Android Chrome) — analysis time on a 1280×960 frame, whether any device actually exposes `whiteBalanceMode` (fake device: `awb_locked false`), GPU-delegate fallback. Next dev overlay shows "1 Issue" on this page: MediaPipe prints `INFO: Created TensorFlow Lite XNNPACK delegate for CPU` to stderr → `console.error`; dev-only, harmless. **Mirror rule (decided here, for 09/12):** the stored JPEG is the raw camera frame — readings were computed on it, and any later landmark pass over the stored image agrees with them, which a flipped file would not — and every screen that shows a photo mirrors it in CSS, exactly like the viewfinder and the ghost do now.

**Rating pass — instrument and data (2026-09-13 afternoon).** Dinh's own photos were too few and all good, so the set is: 2 base photos (`dinh-cafe-1`, MediaPipe's `portrait.jpg`) × 18 graded degradations from `mpbench/degrade.sh` (ffmpeg: −1/−1.5/−2/−3 EV, +1/+2/+3 EV, far 70/50/35 %, close 70/55 %, two off-centre crops, blur σ 1.5/3/6/10 — ground truth by construction) + 13 Pexels-licensed portraits picked for real dark / far / close / turned faces (`mpbench/photos/pexels/`, researcher-found, checked by eye). Research datasets were surveyed and dropped: CelebA, SoF, CFP are non-commercial/academic-only; LFW/UCF-Selfie pages unreachable; FFHQ only usable per-image by licence field — not worth it for a threshold check. All photos stay in the gitignored `mpbench/photos/`; labelled contact sheets for rating: `mpbench/photos/contact-dinh.jpg`, `contact-portrait.jpg`, `contact-pexels.jpg`. Batch mode: `bun run --cwd mpbench rate <photos...>` (one browser session, one TSV row per photo, no fixture written).

Three instrument bugs the first pass exposed, all fixed before any rating: (1) mpbench analysed photos at full resolution while the app analyses a ≤640px copy — `ANALYSIS_MAX_SIDE` now lives in domain and `bench.html` scales to it (this also stopped a run of spurious `noFace` results on large images); (2) raw Laplacian variance fell with exposure (−1 EV halved it → "blurry") and with face size (portrait 842 vs Dinh 79) — `sharpness()` now resamples the landmark box to 96px wide and divides by mean luma²; (3) yaw as |1 − L/R| exploded to 18 on a 30° turn and was asymmetric — now |L − R| / (L + R) ≈ sin(turn).

| photo (analysed ≤640px) | brightness | faceWidth | centerOffset | yaw | sharpness | flagged by provisional cut-offs |
|---|---|---|---|---|---|---|
| dinh-cafe-1 | 168 | 0.556 | 0.052 | 0.04 | 334 | – |
| dinh dark1 / dark1.5 / dark2 / dark3 (EV) | 84 / 59 / 42 / 21 | = | = | = | 310–347 | – / dark / dark / dark |
| dinh bright1 / bright2 / bright3 | 246 / – / – | | | | | bright / noFace / noFace |
| dinh far70 / far50 / far35 | | 0.390 / 0.279 / 0.197 | | | 257 / 216 / 157 | – / far / far |
| dinh close70 / close55 | | 0.799 / 1.020 | | | 357 / 404 | – / close |
| dinh offcenter / offcenter2 | | 0.698 / 0.837 | 0.220 / 0.282 | | | offCenter / close+offCenter |
| dinh blur1.5 / blur3 / blur6 / blur10 | | | | | 158 / 72 / 22 / 9 | – / – / blurry / blurry |
| portrait (chest-up, face high) | 155 | 0.236 | 0.281 | 0.04 | 987 | far, offCenter |
| pexels 4570734 (frontal selfie) | 117 | 0.457 | 0.116 | 0.22 | 825 | – |
| pexels 17908111 (studio, ~10° turn) | 175 | 0.537 | 0.089 | 0.27 | 481 | – |
| pexels 39246694 (dark skin, bright even light, hand on cheek) | 78 | 0.400 | 0.031 | 0.88 | 1341 | turned |
| pexels 1437434 (dark skin B&W, ~30° turn, side-lit) | 77 | 0.490 | 0.167 | 0.90 | 1840 | offCenter, turned |
| pexels 15267044 (dim red light) | 25 | 0.438 | 0.224 | 0.48 | 419 | dark, offCenter, turned |
| pexels 18117026 (dark skin, neon side light) | 21 | 0.365 | 0.134 | 0.26 | 5078 | dark, offCenter |
| pexels 2659841 (chiaroscuro, near profile) | 58 | 0.697 | 0.287 | 0.19 | 3115 | dark, offCenter |
| pexels 34217562 (extreme close-up, ~45°) | 130 | 0.836 | 0.078 | 0.64 | | close, turned |
| pexels 31085351 / 19697930 (full body / child, far) | 115 / 108 | 0.178 / 0.141 | 0.248 / 0.006 | | | far(+offCenter) |
| noFace: dinh bright2/3, portrait close55/far35/far50/offcenter2, pexels 11669526 (half face), 9303810 (far profile), 9336376 (very dark) | | | | | | detector itself gates these |

**Dinh's ratings (2026-09-13, from the contact sheets):** `minBrightness` 70 → **50** (dark1.5 still acceptable, dark2 not; well-exposed dark skin measured 77–78 and must not be flagged), `minSharpness` 40 → **100** (blur3 is bad, blur1.5 fine), face width **0.35–0.80** kept (far70 fine, far50 far; close70 fine, close55 close), yaw **0.35** kept (17908111 fine, 15267044 turned). `maxBrightness` 200 and `maxCenterOffset` 0.12 unchallenged. The `shownIssues` filter is gone: every signal now reaches the live badge and the review warning, and the badge's ok text is the artboard's "Đủ sáng" again. Known limits of the set: no graded yaw series of one person; yaw on very dark or occluded faces (2659841 at 0.19, 39246694 at 0.88) tracks landmark failure, not head pose; a mean-luma cut-off still conflates skin tone with exposure — a clipped-pixel fraction is the upgrade if a user reports false "too dark" warnings.

## Next

- Dinh: `localhost:3000` → `/app/capture` on the laptop webcam, then on the phone over the LAN (needs HTTPS or `chrome://flags/#unsafely-treat-insecure-origin-as-secure` for `getUserMedia`); check AWB lock result and analysis time.
- Second commit proposed for the rating instrument + rated cut-offs — Dinh types `/commit`.
- `/code-review` ran (Standards: `savePhoto` now rolls back the row + object if the readings insert fails, one `boundingBox` in `geometry.ts` replaces three copies, ADR 0002 addendum records the `storage.objects` custom migration; Spec: guessed thresholds pulled out of the UI, mirror rule decided). Commit proposed — Dinh types `/commit`.
- Ticket 09 (mark spots) consumes `photos.storage_path` via a signed URL; ticket 12 hides zones with `pixel_count 0` and may want a minimum pixel count.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 8863443; apps/web/e2e/capture.spec.ts; web capture.test.tsx; domain capture-quality.test.ts (c0cc7d5).
