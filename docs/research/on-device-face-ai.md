# On-device face AI: web benchmark and Android options (2026-09-11)

## Web benchmark — `@mediapipe/tasks-vision` 0.10.21

Machine: i7-1185G7, Iris Xe, Arch Linux, headed Chrome via Playwright (`channel: 'chrome'`, DISPLAY=:1). Static 640x480 portrait (`https://storage.googleapis.com/mediapipe-assets/portrait.jpg`), IMAGE mode, warm-up 3, median of 30 calls.

| Task | Delegate | Median ms | FPS | Result |
|---|---|---|---|---|
| FaceLandmarker (float16, numFaces 1) | GPU | 12.9 | 77.5 | face found |
| FaceLandmarker | CPU | 19.75 | 50.6 | face found |
| ImageSegmenter (selfie_multiclass_256x256) | GPU | 32.25 | 31.0 | mask non-empty |
| ImageSegmenter | CPU | 283.55 | 3.5 | mask non-empty |

- WebGL renderer: `ANGLE (Intel, Mesa Intel(R) Iris(R) Xe Graphics (TGL GT2), OpenGL ES 3.2)` — real GPU, not SwiftShader. `navigator.gpu` present.
- Phones are 2–4× slower: landmarks stay real-time; run the segmenter on captured stills only, never per frame.
- Bench files: scratchpad `mpbench/bench.html`, `run.mjs` (not in repo).

Model URLs used:
- `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`
- `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite`
- WASM: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm`

## Android (Expo dev build, New Architecture)

Expo Go cannot run any of these (frame processors need JSI/Fabric); a development build is mandatory.

| Lib | Tasks | Platforms | Expo plugin | Last release | License | Red flags |
|---|---|---|---|---|---|---|
| react-native-mediapipe (cdiddy77) | face landmark, pose (image segmenter not confirmed) | Android/iOS | none found in README | v0.6.0, 2024-12-12 | MIT | 37 open issues; New Architecture support unverified |
| react-native-vision-camera-face-detector (luicfrr) | ML Kit face detection, 133-point contours | Android/iOS | via vision-camera's plugin | v1.10.1 | MIT | contours only, not a 468/478 mesh |
| react-native-fast-tflite (mrousavy) | any `.tflite` (face_landmark, selfie_segmentation) with GPU delegate (CoreML/NNAPI-GPU) | Android/iOS | yes (`enableCoreMLDelegate`) | active on npm | MIT | you decode tensors yourself; no face-mesh example shipped |
| react-native-executorch (software-mansion) | v0.8.0: DeepLab V3, selfie segmentation, object detection; no face landmarker | Android/iOS | yes, VisionCamera integration | v0.8.0 | MIT | no face mesh |

No credible FPS numbers for mid-range Android were found (unverified) — measure on device.

**Verdict (9-day build):** live guide = vision-camera + face-detector (contours are enough for centring/size/yaw); after capture = fast-tflite running MediaPipe `face_landmark.tflite` (468 points — **superseded 2026-09-11**, was wrongly given as 478 here; see [ADR 0001](../adr/0001-domain-package-receives-landmarks-and-mask.md) / ticket 05) and `selfie_segmentation.tflite` on the still for zone masks and the redness index. Do not bet on react-native-mediapipe.

## Code layout

- Platform split by file extension: `capture-engine.web.tsx` (getUserMedia + `@mediapipe/tasks-vision`) and `capture-engine.native.tsx` (vision-camera + fast-tflite). Both return the same domain shape (landmarks + mask) so `packages/domain` computes zones and indices once.
- Expo Router / react-native-web resolves `.web.tsx` automatically; this split with `@mediapipe/tasks-vision` inside a `.web.tsx` is technically straightforward but no reference repo was found (unverified, low risk).
- Web app in this monorepo is Next.js, so the web engine lives in `apps/web`; the shared contract lives in `packages/domain`.

## Sources

- https://github.com/cdiddy77/react-native-mediapipe (releases page)
- https://github.com/luicfrr/react-native-vision-camera-face-detector
- https://github.com/mrousavy/react-native-fast-tflite
- https://github.com/software-mansion/react-native-executorch/releases/tag/v0.8.0
- https://github.com/mrousavy/react-native-vision-camera/issues/3639 (Expo Go / New Arch)
- https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
