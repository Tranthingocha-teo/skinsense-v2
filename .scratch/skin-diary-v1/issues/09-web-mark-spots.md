# 09: Web — mark spots on photo

**What to build:** tap directly on a saved photo to mark visible spots, and see the per-zone count.

**Blocked by:** 07

**Status:** done

- [x] Tap-to-mark on the captured photo, matching the canvas's `MarkSpots` artboard (marker style, counter, Save)
- [x] Spot stored with normalized face-relative coordinates (ticket 02's spot-to-zone assignment), not raw pixel coordinates, so it stays meaningful if a later photo is framed slightly differently
- [x] Per-zone spot count visible (feeds ticket 12's trend)
- [x] Vitest + Testing Library test for the tap-mark canvas component
- [x] All UI strings shipped in Vietnamese + English

## Now

Built 2026-09-13 (Claude, `/implement`). Domain: `toFaceRelative` / `fromFaceRelative` in `packages/domain/src/geometry.ts` — a spot is stored as 0..1 inside the photo's landmark bounding box, not the image, so it survives re-framing (story 8); 2 tests. Web: `detectImage` in `capture-engine.web.ts` re-runs the landmarker on the stored JPEG at the same ≤640px analysis size as capture (landmarks aren't retained, ADR 0001), `loadPhoto` (storage `download` → object URL, no CORS), `loadSpots` / `saveSpots` (one Save replaces the photo's whole set) in `photos.ts`, `src/components/mark-spots.tsx` (mirrored `<img>` per ticket 07's mirror rule + an SVG overlay with `xMidYMid slice` ≡ `object-cover`, taps un-mirrored and mapped through the cover maths, `assignSpotToZone` at tap time, tap a marker to remove it, counter line + per-zone chips, Save → Saved/Done), route `/app/spots/[photoId]`, links from the capture Saved screen (replaces "Done") and from `/app` for the latest photo, `MarkSpots` i18n vi/en. A tap outside every zone / inside an exclusion shows "Tap inside a face zone" and is not stored — `spots.zone` is NOT NULL and the five zones don't cover jawline/temples; ponytail: accept until a user asks for spots there.

Tests: 3 Vitest component tests (synthetic 468-landmark face: tap → nose spot + chip, out-of-zone tap ignored, save payload face-relative; stored spot rendered + removed; no-face photo can't be marked). `e2e/capture.spec.ts` now continues past Save: Mark spots → tap down the centre line until a zone hit → Save → asserts one `spots` row whose zone ∈ {forehead, nose, chin} (a mirrored or offset mapping would miss). Playwright viewport set to 390×844 — at 1280 wide the 3:4 box was 1650px tall and the fixture face sat above the fold. Green: 47 domain / 14 web / 6 mobile, E2E 24 s, typecheck 4/4, eslint clean.

`/code-review` ran (Standards + Spec agents). Fixed: `saveSpots` now inserts the new set before deleting the old rows (a failure between the two no longer loses the previous set; a failed delete leaves duplicates the next Save clears — `ponytail:` comment, RPC is the atomic upgrade); object URL revoked if the component unmounts before the download resolves; marker keys by index (two taps on one pixel collided); the capture Saved screen keeps its "Done" link under Take another / Mark spots instead of dropping it; "outside" copy now says *skin* inside the face zones (eyes/lips/brows/nostrils are excluded too). Left as is: the `/app` latest-photo query renders no link on error rather than throwing (`fail`) — a shell page shouldn't crash on it; the `[photoId]` page repeats the two-line claims guard the other `/app` pages already use.

## Next

- Dinh types `/commit`.
- Ticket 12 (trends) counts `spots` per zone per photo; ticket 10 (mobile) reuses `toFaceRelative` + the same `spots` rows.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 16e711b; web mark-spots.test.tsx; spots step in e2e/capture.spec.ts; redesigned in redesign-build 06.
