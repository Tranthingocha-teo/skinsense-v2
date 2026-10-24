# 13: Mobile — trends

**What to build:** the same trends behaviour as ticket 12, native.

**Blocked by:** 10, 05

**Status:** superseded (by redesign-build 07)

- [x] Same functional criteria as ticket 12: 7/30-day toggle, 5 zone chips, redness/spot-count/routine-% series from real data, before/after slider, disclaimer
- [x] Native chart rendering matching the canvas's `Trends` artboard, `dataviz` skill rules (single-hue, zero baseline, no dual-axis)
- [x] One Maestro flow covers switching the 7/30-day toggle and opening the before/after slider
- [x] All UI strings shipped in Vietnamese + English

## Now

Built 2026-09-13 (Claude, `/implement`). Mirrors ticket 12 file for file. `src/lib/trends.ts` (`loadTrends(firstDay)` / `signedPhotoUrls`, same contract as web, mobile supabase client). `src/components/trends.tsx`: same series maths, chart geometry (328×160 artboard) and copy as web; chart via `react-native-svg` (already installed) with hex copies of the global.css tokens since SVG strokes take no className; 7/30 toggle + 5 zone chips as `role="button"` Pressables with `accessibilityState.selected`, h-11 (44dp); spot card = latest photo's count + 80×24 sparkline; routine card reuses `ui/progress`; before/after = `expo-image` ×2 mirrored, the "after" image inside a clipping View from `split%` to the right edge, a transparent full-image overlay is the drag target (RN responder system, `role="slider"`, increment/decrement accessibility actions step by 10); disclaimer line. Route `(app)/trends.tsx`; shell links "Trends"; `trends` i18n namespace vi + en (+ `shell.trends`). `flows/trends.yaml` taps the toggle by `testID days-30` at 20 % because the dev client's floating gear button covers the right half of "30 days".

Tests: 3 jest cases mirroring web's (series + spot count + routine % + slider present; zone/window switch reloads; <2 photos shows the hint, no slider). Green: `bun run typecheck` 4/4, `bun run test` 9 domain / 7 web / 7 mobile suites (16 mobile tests), `expo lint` clean for the new files (2 pre-existing `set-state-in-effect` errors untouched).
**Verified on the emulator (2026-09-13 22:42, signed-in session, Metro):** shell → Trends → 7-day chart with tonight's point (forehead −0.8, nose 3.1), zero baseline dashed, "Latest" pill, Mon–Sun labels; 30 days → weekly labels 8/16…9/13; Nose chip → title + spot card follow; "Needs at least 2 photos" hint since the account has one photo. Fixed on sight: hidden 30-day labels (width 0) wrapped per character and made the card tall → `numberOfLines={1}`. The flow's last step (`compare-slider`) fails until a second photo exists; the slider itself is covered by jest only.

`/code-review` (Standards + Spec, Sonnet sub-agents): no standard violation, no scope creep; the before/after clip maths and responder handling were traced and confirmed. Folded in: web's `sr-only` series tables have no RN equivalent, so the redness chart and the spot sparkline now carry the per-day "day: value" list as `accessibilityHint` (TalkBack reads it after the label), and the sparkline is an accessible `role="img"` instead of `aria-hidden`; the hex copies of the global.css tokens got their `ponytail:` ceiling note. Left as is: `Trends()` mixes series maths, chart geometry and the slider gesture in one function, same shape as web.

**Slider verified on the emulator (2026-09-14 00:00):** after a second photo was saved, `flows/trends.yaml` ran green end to end — toggle, Nose chip, before/after with the two real photos, tap at 75 % moves the split.

Side fix (2026-09-13 23:40 → 23:55): Dinh hit an uncaught `PreviewView.convertCameraPointToViewPoint(...): PreviewView isn't ready yet!` red box on the capture screen — the face-detector plugin's `autoMode` transforms every detection into preview coordinates and throws for the frames that arrive while the camera remounts (Retake). First attempt (turning `autoMode` off and transforming in our callback) was wrong: `autoMode` also drives the native pointTransformer, the contour dots moved. Kept fix: `bun patch react-native-vision-camera-face-detector` wraps that transform in try/catch and drops those frames (`patches/react-native-vision-camera-face-detector@2.1.0.patch`, root `package.json` `patchedDependencies`). Not reproducible on demand; verify on the next Retake.

Emulator capture caveat (not a code bug): the webcam front camera has no 4:3 JPEG size above 640×480, so CameraX takes the still at 1280×720 — the HAL crops the 4:3 webcam frame to 16:9 and upscales, which in portrait cuts the sides and looks zoomed in versus the preview, and the JPEG comes out posterized (~7 KB, ~30 colours in a 100×100 face patch). ML Kit then misses a face that is large or near the edge; sitting further back (face ≈ half the frame) works, as at 22:08. A real phone has FHD 4:3 and matches the preview. Also seen: `cameraserver` on the emulator died twice ("Could not open the camera") — restarting the emulator (`emulator -avd pixel_api36 -camera-front webcam0 -no-boot-anim`) cleared it.

## Next

- Dinh: capture a second photo on the emulator (face at the webcam), then `maestro test apps/mobile/flows/trends.yaml` runs to the end and the before/after drag can be checked by hand.
- Next tickets: 15 (fixture acceptance test), 16 (Android QA checklist), 05/11/14 are ready-for-human.

## Audit 2026-10-17

- Status: superseded (by redesign-build 07)
- Evidence: Shipped in 4344751, rebuilt in 51f192b; mobile trends.test.tsx; flows/trends.yaml.
