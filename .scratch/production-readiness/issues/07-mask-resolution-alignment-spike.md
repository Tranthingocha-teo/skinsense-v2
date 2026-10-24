# Mask resolution and landmark alignment: verification spike

Type: task
Status: done

## Question

Ticket [Landmark + mask wire format](./05-landmark-mask-wire-format.md) left two facts unverifiable from documentation:

- Does the `selfie_multiclass_256x256` `CATEGORY_MASK` come back at a fixed 256×256, or resampled to the input image's resolution?
- Does the mask share the same coordinate space/alignment as the `FaceLandmarker`'s `[0,1]`-normalized landmarks when both run on the same source image, or does one need transforming into the other's frame before `redness-index.md`'s "intersect mask with zone polygon" step works?

AFK task: run both the web `@mediapipe/tasks-vision` `FaceLandmarker` and `ImageSegmenter` (`selfie_multiclass_256x256`, `CATEGORY_MASK` mode) on one real test photo (the existing web benchmark setup from `docs/research/on-device-face-ai.md` already has a working harness). Read `categoryMask.width`/`.height` directly; overlay a known landmark point (e.g. tip of nose) against the mask to check alignment empirically.

Answer records: mask resolution, and whether/what transform is needed to align it with landmark space. This blocks implementing the redness-index intersection step correctly, so resolve before `/to-tickets` reaches that work.

## Answer

Ran the actual web pipeline (extended the existing `mpbench` Playwright harness from `on-device-face-ai.md`'s benchmark, same `portrait.jpg` test image, GPU delegate) rather than reasoning from docs alone — empirical, not asserted:

- `FaceLandmarker` returned 478 landmarks at runtime (confirms the research from ticket 05; only the first 468 are used per that decision).
- `ImageSegmenter` (`selfie_multiclass_256x256`, `CATEGORY_MASK`) returned a mask at **640×480 — exactly matching the 640×480 canvas/input image**, not a fixed 256×256. The high-level web API resamples the mask to the input resolution for you.
- Alignment check: took the centroid of all 478 landmarks (`x≈0.495, y≈0.215` normalized), scaled by the mask's own reported width/height, and read the class at that pixel → **class 3 (face-skin)**, as expected for a point inside the face. Two corner points (0.02,0.02 and 0.98,0.98), same scaling → **class 0 (background)** at both, as expected. Landmark-normalized `[0,1]` coordinates and the mask's pixel grid share the same coordinate space on web — confirmed, not assumed.

**Scope of what this verifies:** web only (`@mediapipe/tasks-vision`, high-level API doing the resampling/alignment for you). It does **not** verify native — `react-native-fast-tflite` running the raw `.tflite` models does no such resampling for you; per `.claude/skills/mediapipe-tflite/SKILL.md`, native's `selfie_segmentation` model outputs a raw 256×256 float mask requiring an explicit threshold + resize step the adapter must implement itself. That native-side resize/alignment is unverifiable until `apps/mobile`'s capture code exists to run it against — left as normal implementation risk for `/to-tickets`, not re-ticketed here (verifying code that doesn't exist yet isn't a spike, it's premature).

## Audit 2026-10-17

- Status: done
- Evidence: Spike resolved; mask and landmark alignment covered by capture-engine.test.ts (mobile) and capture.test.ts (domain).
