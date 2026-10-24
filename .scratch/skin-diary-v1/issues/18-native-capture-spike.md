# 18: Native capture spike (ML Kit landmarks + first EAS build)

**What to build:** proof that `apps/mobile` can produce ADR 0001's `{ width, height, landmarks[468], skinMask }` at all, and a keystore to unblock [01b](./01b-android-oauth-client.md) — the two riskiest unknowns in the build, surfaced early instead of on 2026-09-18.

**Blocked by:** None

**Status:** done

- [x] ML Kit / `face_landmark.tflite` decodes 468 landmarks from a camera frame on the Android emulator, dumped to the console — no UI, no Supabase, no persistence *(done on a JPEG file on the emulator; the emulator's own camera still is a black frame, see Now — the camera→file→engine path is the same code)*
- [x] `selfie_segmentation` mask produced and thresholded to a binary `Uint8Array` at the frame's own resolution *(with `selfie_multiclass_256x256` instead — `selfie_segmentation.tflite` cannot load in plain TFLite, see Now)*
- [x] The same face shot through both pipelines (emulator's virtual scene and `mpbench`'s web path on the equivalent still) with per-zone `redness` printed side by side — the divergence measurement production-readiness ticket 09 asked for
- [x] One EAS build run to completion, its keystore SHA-1 read from `eas credentials` and handed to 01b

Scheduled 2026-09-13, in parallel with [ticket 17](./17-live-redness-mode.md).

**No pass/fail rule is pre-committed.** `spec.md` already records that the two masks mean different things — web's is face skin (segmenter class 3), native's is person-vs-background including hair and neck — and that the divergence concentrates at the forehead and hairline. What to do about `ZoneReading` comparability is decided on the numbers this spike produces, per the 2026-09-12 `/grill-me` pass. Folds `.scratch/production-readiness/issues/09-native-adapter-verification.md`.

## Now

Built 2026-09-13 (Claude, `/implement`). First `expo run:android` of this repo: prebuild + Gradle 9.3.1 under JDK 17 (`/usr/lib/jvm/java-17-openjdk`; the system default is JDK 26), 14 min cold, APK on `pixel_api36`. `apps/mobile/android/` is generated (CNG) and now gitignored with `ios/`.

Stack chosen for the spike (least native surface that proves the contract): `expo-camera` (still), `@react-native-ml-kit/face-detection` 2.0.1 (ML Kit face box on a file URI, legacy NativeModule — works under the New Architecture interop), `react-native-fast-tflite` 3.0.1 (Nitro, needs `react-native-nitro-modules`), `expo-image-manipulator` + `jpeg-js` for pixels (no canvas on native). vision-camera 5 + its face-detector plugin were not tried: two more native modules with unverified RN 0.86 support, and the spike needs stills only. Ticket 08 decides whether the live guide needs a frame processor.

- `apps/mobile/src/lib/capture-engine.ts`: ML Kit box → 1.5× square crop (clamped) → `face_landmark.tflite` (input `[1,192,192,3]`, outputs `[1,1,1,1404]` mesh in crop px + `[1,1,1,1]` face logit) → `x = (originX + mx/192·side)/srcWidth` back to full-image normalised coords; segmenter → argmax over 6 classes → face-skin (3) → nearest-neighbour resize to the ≤640 analysed frame → `Uint8Array`. Returns domain's `FaceCapture` + the analysed RGBA. CPU delegate (`ponytail:` comment).
- **`selfie_segmentation.tflite` rejected** on the emulator: `TFLite: Failed to allocate memory for input/output tensors! Status: unresolved-ops` — it needs MediaPipe's custom `Convolution2DTransposeBias` op, which plain TFLite lacks. Replaced with **`selfie_multiclass_256x256.tflite`, the same model web uses** (input `[1,256,256,3]`, output `[1,256,256,6]` logits, 16 MB bundled). Consequence: both platforms' masks now mean face-skin (class 3) — spec.md's "native's mask is person-vs-background, divergence at the forehead/hairline" paragraph is superseded; `ZoneReading` comparability is no longer a mask question.
- `apps/mobile/src/app/spike.tsx`: dev-only screen outside the protected group (`adb shell am start -a android.intent.action.VIEW -d skinsense:///spike com.dinh144.skinsense`), two buttons, everything to the console (`adb logcat | grep ReactNativeJS` — Metro's stdout did not show these lines). `assets/spike/portrait.jpg` = mpbench's `portrait.jpg`; `assets/spike/portrait.web.json` = web's landmarks + readings for it (dumped via bench.html + domain, script not kept). `assets/models/README.md` records sources + licence.

**Divergence measurement (production-readiness 09), same JPEG through both pipelines, 820×1024 → analysed 513×640, emulator x86 CPU 2.2–2.6 s:**

| | native (ML Kit crop + face_landmark + multiclass) | web (FaceLandmarker + ImageSegmenter) |
|---|---|---|
| landmarks | 468, face logit 31.6, crop 399px @ (202,10) | 468 |
| landmark distance to web | mean **1.80 px**, max 6.87 px | — |
| allSkin (face-skin px) | 18 914 | 18 870 |
| forehead redness ±unevenness (px) | 0.030 ±1.368 (1918) | −0.194 ±1.314 (1729) |
| leftCheek | 1.018 ±2.177 (980) | 1.893 ±2.238 (877) |
| rightCheek | 1.727 ±2.233 (758) | 2.242 ±2.043 (689) |
| nose | 1.776 ±1.747 (111) | 1.631 ±1.279 (87) |
| chin | 0.332 ±2.094 (463) | 0.688 ±1.906 (462) |

Both segmenter inputs are the frame squashed to 256×256 without keeping the aspect ratio (`ponytail:` comment in `capture-engine.ts`); the 0.2 % mask agreement says web's ImageSegmenter does the same, so it stays.

Reading: the crop-space transform is right (1.8 px mean on a 513-px-wide frame) and the masks agree to 0.2 %. Zone redness differs by 0.2–0.9 a* with the ranking preserved (cheeks > nose > chin > forehead on both); the residual comes from ~10 % larger zone polygons (landmark shift at the zone edges) and a lossy JPEG re-encode per resize/crop step on native. Decision left to the numbers, as the ticket said: **native readings are comparable in rank, not in absolute value** — trends are per-account and per-platform in practice (a user has one phone), so no cross-platform calibration is added; revisit only if a fixture from ticket 15 shows the 0.9 gap exceeds the mild/moderate separation.

**Camera path on the emulator is a dead end, not a pipeline bug:** the preview shows the laptop webcam (AVD config now `hw.camera.front=webcam0`, `orientation=0` — the default 90° gave sideways frames), but `takePictureAsync` (with or without `skipProcessing`) returns the emulated HAL's black frame with a timestamp watermark (pulled via `run-as`, mean luma 0.003), so ML Kit correctly finds no face. The file path from `takePictureAsync` → `analyseImage` is the same code the portrait button exercises; a real phone is the test (ticket 08 / 16).

`/code-review` (Standards + Spec, Sonnet sub-agents). Fixed: `expo-asset` was imported but only resolved through hoisting (now an explicit dependency); prebuild's untraceable edits to `package.json` (`"version"`, `android`/`ios` scripts) reverted; checkboxes 1–2 reworded to what was actually run (JPEG on the emulator, multiclass model); the 256×256 squash got its `ponytail:` note; spec.md's "two masks mean different things" paragraph marked superseded. Flagged, not changed: landmark `z` is scaled by `side/srcWidth` (MediaPipe's "z ≈ x scale" convention, not verified against docs — domain ignores z today); `pixels()` decodes the JPEG three times (crop, analysed copy, mask input) — ticket 08 derives all three from one decode when it moves preprocessing off the JS thread.

**EAS build (4th box), 2026-09-13 evening after Dinh's `eas login`:** `eas init --account dinh135s-team` created `@dinh135s-team/skinsense` (id `998d1b2e-…`, in `app.json`), `eas build:configure` wrote `eas.json`. First cloud build (`4bcc5068`) errored in 13 s: the EAS image runs bun 1.3.14, which cannot parse this repo's `lockfileVersion: 2` `bun.lock` (bun 1.4.0) → `"bun": "1.4.0"` pinned in an `eas.json` `base` profile the three profiles extend. `expo-dev-client` had to be added (the `development` profile requires it; the local `expo run:android` did not). Second build (`aa1477de`, profile `development`) finished: 1 h 45 min queued, 23 min building, APK `https://expo.dev/artifacts/eas/Q04zls_EjaIv19m-v0Tnv-guz8PuiM4pNoEkw4wb7BM.apk` (versionCode 1, commit 548de49). Keystore created server-side by that first build; both SHA-1s (EAS + local debug) are in [01b](./01b-android-oauth-client.md), which is now unblocked. `RECORD_AUDIO` that the expo-camera plugin adds by default is off (`recordAudioAndroid: false`).

Verified: `bun run typecheck` 4/4, `bun run test` green (domain 9 files / web 7 / mobile 6).

## Next

- Commit proposed for the EAS setup (`eas.json`, `app.json`, `expo-dev-client`, 01b) — Dinh types `/commit`. Ticket done.
- 01b is Dinh's console work (both SHA-1s are in it).
- Ticket 08 builds on `capture-engine.ts`: replace the spike screen with the guided capture, measure phone timings (2.4 s on the x86 emulator CPU is not a phone number), and try `android-gpu` there.


## Comments

- 2026-09-14 (Claude): first standalone APK for demo/submission — `eas build -p android --profile preview`, build `4cf8d359-c6ba-4e67-9ea7-c9656728c629` (https://expo.dev/accounts/dinh135s-team/projects/skinsense/builds/4cf8d359-c6ba-4e67-9ea7-c9656728c629). The `preview` EAS environment had no variables, so the three `EXPO_PUBLIC_*` values from `apps/mobile/.env` were pushed with `eas env:create` first (anon key as `sensitive`); a `production` build needs the same three in the `production` environment. Finished 2026-09-14: APK https://expo.dev/artifacts/eas/oI3qM3orfyDx8xw1vYUopTUhtoPX8zHnUqrIHAZBObA.apk — standalone, no Metro; this is the demo/submission artifact until a newer build replaces it.
- 2026-09-14 (Claude): fix for the release-build model loading verified on the emulator with a local `expo run:android --variant release` (camera live, landmarks tracking). Rebuilt EAS `preview` from commit `c2e7b23`: build `08da3262-864a-42ae-9be1-8b57806ff672` — this is the APK for Dinh's QA pass (ticket 16). Finished: https://expo.dev/artifacts/eas/KJsFHqIjhHw0j-xT58DMS7f63JBqxK8zU-lIPrvCHJI.apk The 2026-09-14 APK `oI3qM3or…` is superseded.

## Audit 2026-10-17

- Status: done
- Evidence: Commits 548de49 and 8c02250; EAS builds recorded in the ticket; apps/mobile/src/lib/capture-engine.test.ts. Spike is complete; production capture is redesign-build 05.
