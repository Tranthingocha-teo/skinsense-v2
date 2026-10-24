# 08: Mobile — guided capture → Photo/ZoneReading

**What to build:** the same user-facing capture behaviour as ticket 07, native — vision-camera + ML Kit + fast-tflite, on a dev build.

**Blocked by:** 03, 02, 07

**Status:** superseded (by redesign-build 05)

- [x] Same functional criteria as ticket 07: guide overlay, AWB lock, poor-capture flag, persisted Photo+ZoneReading, disclaimer — poor-capture threshold decision is shared with ticket 07, see that ticket's note *(save path verified end to end on the emulator 2026-09-13 22:08, see Now)*
- [x] `vision-camera` + ML Kit + `fast-tflite` (`*.native.tsx`), plain `face_landmark.tflite` (not the attention variant), produces the same `{ landmarks[468], skinMask }` shape *(no `.native` suffix: `apps/mobile` is Android-only, the file lives only there)*
- [x] Raw landmark output transformed from the model crop's pixel space back to full-image normalized `[0,1]` coordinates via the face-detector's crop region (per ticket 05's Amendment in production-readiness)
- [x] `skinMask` built via `selfie_segmentation` + the threshold/resize step the `mediapipe-tflite` skill specifies *(with `selfie_multiclass_256x256` class 3 = face-skin, per ticket 18: `selfie_segmentation.tflite` cannot load in plain TFLite)*
- [ ] Maestro E2E on the emulator's virtual-scene camera covers sign-in → capture → save
- [x] Runs on a dev build (`expo run:android`), not Expo Go
- [x] All UI strings shipped in Vietnamese + English
- [ ] Native adapter output verified against web's known-good output (ticket 07 must ship first, now a blocker): run both against the same or a comparable test photo, compare landmark positions and mask coverage; confirms the crop-space transform and the mask threshold/resize step produce output equivalent in meaning to web's, per `.scratch/production-readiness/issues/09-native-adapter-verification.md` — folded in here per the 2026-09-12 `/grill-me` pass, no longer a separate external ticket

## Now

Built 2026-09-13 evening (Claude, `/implement`). Stack switched from the spike's expo-camera + `@react-native-ml-kit/face-detection` + expo-image-manipulator + jpeg-js (+ expo-asset) to **`react-native-vision-camera` 5.2.3 + `react-native-nitro-image` 0.15.2 + `react-native-vision-camera-face-detector` 2.1.0** — all Nitro, on the `react-native-nitro-modules` fast-tflite already needs; APIs read from the installed `.d.ts`/Kotlin, not memory. Why: the face-detector's `<Camera>` gives ML Kit contours per frame with no worklet code; `CameraController.lockCurrentWhiteBalance()` exposes the Camera2 AWB lock (method verified, runtime effect on a phone not — recorded as `awb_locked` either way, best effort like web); nitro-image gives raw pixels (`toRawPixelDataAsync`), crop/resize and JPEG encode, so ticket 18's three JPEG decodes are gone. Spike screen + `assets/spike/` deleted, expo-camera plugin dropped from `app.json`; `expo run:android` rebuilt in 16 min (JDK 17).

- `src/lib/capture-engine.ts`: `captureStill(engine, controller, takePhoto)` → AWB lock → `Photo.toImageAsync()` (un-mirrored when `isMirrored`, web's mirror rule) → temp JPEG for ML Kit's image detector → 1.5× crop → `face_landmark` → ≤640 analysed copy → multiclass mask → `readZones` + `captureIssues` + JPEG ≤2MB `ArrayBuffer`. `toRgba` handles every nitro-image pixel layout. `liveIssues` (ML Kit box + `yawAngle` against the rated QUALITY cut-offs) and `sampleBrightness` (64×48 preview snapshot, ~1.4 Hz) feed the live badge.
- `src/lib/photos.ts` = web's data layer (`getSession` instead of `getClaims`, `expo-crypto` UUID, `ArrayBuffer` upload, same rollback).
- `src/components/capture.tsx` (same phases/copy as web; overlay = SVG ellipse + contour dots; `LiveCamera` is a `memo` child with stable props — see the bug below) + `(app)/capture.tsx` + `capture` i18n namespace vi/en + shell link.
- Tests: `capture-engine.test.ts` (`toRgba` layouts, `liveIssues`), `capture.test.tsx` (web's two scenarios), `flows/capture.yaml`. `bun run typecheck` 4/4, `bun run test` 9 domain / 7 web / 5 mobile suites green, `expo lint` clean on the new files (2 pre-existing `require()` warnings for the tflite assets).

**Verified on the emulator (laptop webcam, Maestro, behind a temporary `Stack.Protected` bypass that was reverted):** preview + ML Kit contour dots align on the mirrored preview, badge switches (`Too dark` in the evening room), shutter → `capturePhoto` returns a **real** frame (expo-camera's was black in ticket 18) upright and mirrored only by style → review with the quality warning → Retake → live. 0 failed steps, twice. Not verified: a still with a face in frame (nobody was at the webcam during the 150 s wait, so readings/Save on a live photo ran only in jest), the Save path (no mobile session until 01b), AWB lock effect, phone timings and `android-gpu`.

**Bug found and fixed on the emulator:** the face-detector wrapper rebuilds its output object on every render and vision-camera reconfigures the whole session for it (logcat: 2–4 `Reconfiguring CameraSession` per second while the overlay updated at 10 fps), so the shutter hit an `ImageCapture … Not bound to a valid Camera`. Fix: the camera lives in a `memo`'d `LiveCamera` with only stable props (refs + `useCallback`); rebinds dropped to the initial 2.

**Signed-in run on the emulator (2026-09-13 22:08, after 01b):** Dinh in front of the webcam → badge `Move back`, shutter → ML Kit image detector found the face on the 720×1280 still (`bounds 644×713 @ 137,280`) → 468 landmarks + mask → review with `Save` → **Saved** screen with all five zones (forehead −0.8 ±1.7, left cheek 2.1 ±0.6, right cheek 3.0 ±1.0, nose 3.1 ±1.2, chin 4.5 ±2.4) and the disclaimer; `photos` row (`brightness 125.4`, `awb_locked false` — the emulator camera rejects the AWB lock, recorded honestly) + 5 `zone_readings` rows confirmed by SQL. Save path, storage owner policy and RLS from a mobile session all work. Not comparable to web from this run: the emulator's `capturePhoto` JPEG is a 6.9 KB posterized, near-grayscale frame; web's ImageSegmenter finds no face-skin on it (`bun run --cwd mpbench generate` → brightness 0.0, redness 0.000 on every zone) while native's squashed-256² pass does. Landmark-driven zone pixel counts still agree to ~5–10 % (forehead 7268 vs 7899, left cheek 3738 vs 4100, right cheek 1627 vs 2106, nose 362 vs 396) except the chin, cut off at the frame edge (784 vs 1741). The phone-photo comparison below stays the real check.

**Detector swap caveat (Spec review):** ticket 18's 1.8 px / 0.2 % agreement with web was measured with `@react-native-ml-kit/face-detection` + jpeg-js pixels; the maths is unchanged but the box now comes from the face-detector package's image detector and pixels from nitro-image. Cheapest re-check, no code: after the first phone capture, download its `photos/<uid>/<id>.jpg` from Storage (it is the raw frame) and run `bun run --cwd mpbench generate <that.jpg>`; compare with the `zone_readings` rows of that photo. Same for the 8th checkbox — left unticked until that comparison is done.

`/code-review` (Standards + Spec, Sonnet sub-agents): no hard violation, no scope creep. Standards flagged `MAX_UPLOAD_BYTES`/`jpegUnder`/`sameIssues` mirrored from web as duplicated shape — left as is, it is the split-by-suffix convention. Spec: Maestro flow strings are en (device locale must be en; the routine flow has the same convention), "real AWB lock" wording softened above, detector-swap caveat added.

## Next

- Commit proposed — Dinh types `/commit`.
- Dinh, on the phone: sign in (01b done) → `/capture` → take a lit photo → Save → run the mpbench comparison above on the stored JPEG; note the analysis time by hand.
- Ticket 10 (mark spots) reads `photos.storage_path` via a signed URL and shows it mirrored, like web.
- Ticket 16's checklist: the 8th checkbox comparison is its job on the real phone.

## Comments

- 2026-09-14 (Claude): first standalone APK (EAS `preview`, ticket 18) shows "Could not open the camera" on Dinh's phone and on the emulator, right after the camera permission is granted. Cause, from logcat: fast-tflite logs `Resolved Model path: assets_models_face_landmark` and nothing after — in a release build `Image.resolveAssetSource` returns the bare `res/raw` resource name, and fast-tflite 3's Android `HybridAssetLoader.loadAsset` is `URL(path).readBytes()`, which throws on a scheme-less string; `loadEngine()` rejects and the screen maps that to `cameraError`. Dev builds never hit it because Metro serves the model over `http://`. Fix: `loadModel()` in `capture-engine.ts` runs the `require()` through `expo-asset`'s `Asset.fromModule(..).downloadAsync()` (copies the embedded raw resource to the cache, returns a `file://` URI both in dev and release) and passes `{ url }` to `loadTensorflowModel`. `expo-asset ~57.0.17` added.
- 2026-09-14 (`/grill-me`, third pass): both open boxes are Claude's before 20/09. Maestro `flows/capture.yaml` runs on 15/09 with Dinh at the webcam (~5 min, before his Android QA pass). Adapter check: Claude downloads a photo Dinh shot during QA from Storage, runs `mpbench generate`, compares with its `zone_readings`. Checklist B8 (phone analysis time) blocks only above 10 s or on an ANR → try `android-gpu`, ≤1 h.

## Audit 2026-10-17

- Status: superseded (by redesign-build 05)
- Evidence: Shipped in commit 8c02250 and rebuilt in redesign-build 05 (646ccff); mobile capture.test.tsx and capture-engine.test.ts; flows/capture.yaml. Remaining boxes (Maestro sign-in to save, adapter diff) are covered by flows/capture.yaml and production-readiness 09.
