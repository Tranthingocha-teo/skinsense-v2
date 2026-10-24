# Landmark + mask wire format: what crosses the platform boundary into domain

Type: grilling
Status: done

## Question

Ticket [Domain package input boundary](./03-domain-input-boundary.md) decided `packages/domain` accepts `{ landmarks, mask }` from each platform and computes zones/indices itself. Neither `docs/research/on-device-face-ai.md` nor `redness-index.md` nor `AGENTS.md` specifies the wire format of either part — this ticket exists to pin that down, not to assume it from memory of the MediaPipe APIs (a mistake already made once while charting this map — see ticket 03's Answer).

Open sub-questions:

- **Landmarks**: coordinate space and units (e.g. normalized `[0,1]` relative to image width/height, vs. pixel coordinates in some reference frame), whether `z`/depth is included (the redness formula in `redness-index.md` only needs 2D zone masking over pixels — does anything else in the product need depth?), point ordering/indexing (MediaPipe's canonical 478-point order, assumed but not verified against what `@mediapipe/tasks-vision`'s `FaceLandmarker` actually returns and what `react-native-fast-tflite` running `face_landmark.tflite` actually outputs before any decode).
- **Mask**: resolution (does it need to match the source photo's resolution, or is it in the segmenter model's native output size and needs resampling?), encoding (binary skin/not-skin, or a multi-class map per `selfie_multiclass_256x256`'s classes?), and coordinate alignment with the landmarks (same frame/crop, or does one need transforming into the other's space before `redness-index.md`'s "intersected with the zone polygon" step works?).
- Whether verifying the native (`react-native-fast-tflite`) output actually matches this contract is a `task`-type ticket (a spike: decode the raw tensor for one test photo, compare against the web API's output for the same photo) that should block implementation, or whether it's normal build risk handled during `/to-tickets`.

Call both the `grilling` and `domain-modeling` skills (`/grill-with-docs`) when working this ticket. Facts about the actual API/tensor shapes are for the agent to find (dispatch research), not to ask Dinh or assert from memory; the decisions — which format to standardize on, and whether a verification spike ticket is warranted — are his.

## Answer

Dispatched a research subagent rather than asserting from memory (the mistake made once already on ticket 03). Findings, sourced:

- **Web `@mediapipe/tasks-vision` `FaceLandmarker`**: x/y normalized `[0,1]` by image width/height (verbatim from `landmark.d.ts`); z = relative depth, smaller = closer to camera, same scale as x, exact reference point undocumented. 478 points (468 + iris). No official per-point zone mapping — only region-level named sets (`FACE_LANDMARKS_LIPS`, `_LEFT_EYE`, etc.), not forehead/cheek/nose/chin.
- **Native raw `.tflite`**: the plain `face_landmark.tflite` is **468 points**, tensor `[1,1,1,1404]` — not 478. Reaching 478 needs the separate `face_landmark_with_attention.tflite` file, combining extra tensors for refined lips/eyes/iris (GitHub mediapipe#3253). Raw output coordinates are in the model input crop's pixel space (e.g. 192×192), requiring an affine transform back via the face-detector's crop region — confirmed against real reference code (`patlevin/face-detection-tflite`), not asserted from memory.
- **`selfie_multiclass_256x256` mask**: official classes are 0 background, 1 hair, 2 body-skin, 3 **face-skin**, 4 clothes, 5 other — a distinct face-skin class exists. `CATEGORY_MASK` mode = single uint8 image, argmax already applied; `CONFIDENCE_MASK` = per-class float32, no argmax. Mask resolution (native 256×256 vs resampled to input) and alignment with the landmarker's coordinate space are **not documented anywhere found** — flagged, not guessed.

**Decision** (its `z`-dropped and mask-encoding claims below are superseded by the Amendment right after — kept as-is for the reasoning trail; see the Amendment for the final `z`/`skinMask` shape): standardize on **468 points on both platforms** — web keeps `@mediapipe/tasks-vision` but drops its 10 iris points; native uses the plain `face_landmark.tflite`, not the `_with_attention` variant, avoiding the multi-tensor combine entirely. Iris precision isn't needed for skin zones. Landmark contract: `[0,1]`-normalized x/y (native's adapter must apply the crop-space→normalized-frame transform itself), z dropped (not needed by `redness-index.md`'s 2D pixel-mask formula). Mask contract: `CATEGORY_MASK` mode, treat class 3 (face-skin) as the skin mask — sharper than `redness-index.md`'s original generic "skin mask" wording.

**Amendment (2026-09-11, same session, before this map's other tickets):** found `.claude/skills/mediapipe-tflite/SKILL.md` after writing the decision above — a gitignored but AGENTS.md-listed internal skill ("Project skills" section) with an already-established shared contract that this ticket should have checked before deciding, not after. Two corrections to the decision above:

- **Keep `z`**, don't drop it. Both platforms emit it as part of their native 3-value-per-point output anyway (native's raw tensor is 468×3); dropping it is an extra filtering step for no benefit, and the existing internal skill's `FaceCapture` type already carries it.
- **`skinMask` is a pre-reduced binary `Uint8Array`** (1 = skin), not the raw multi-class `CATEGORY_MASK` passed through. Reason, not just precedent: native runs `selfie_segmentation`, a *different model* from web's `selfie_multiclass_256x256` — it has no multi-class output at all, only a foreground probability (threshold e.g. `> 0.5`, per the internal skill). "Pass the raw category mask, let domain check `=== 3`" is unimplementable on native. A reduced binary mask, built by each platform's adapter, is the only shape both can actually produce.
- **Implementation note, not a new ticket:** the two platforms' binary masks mean different things — web's (class 3) is specifically face-skin; native's (threshold on `selfie_segmentation`) is person/foreground generally (includes hair, neck, clothes). Intersected with zone polygons, the divergence will concentrate at the forehead/hairline. Worth a code comment when `apps/mobile`'s adapter is implemented, not worth its own wayfinder ticket.

The final contract matches `.claude/skills/mediapipe-tflite/SKILL.md`'s `FaceCapture` type exactly: `{ width, height, landmarks: {x,y,z}[468], skinMask?: Uint8Array }`. ADR [0001](../../../docs/adr/0001-domain-package-receives-landmarks-and-mask.md) is unaffected — it decided landmarks+mask cross the boundary and domain computes zones, which this amendment doesn't change, only the exact shape of `z` and `skinMask`.

Recorded as an update to ADR [0001](../../../docs/adr/0001-domain-package-receives-landmarks-and-mask.md) (the point-count claim in that ADR was itself wrong — see its Correction note) rather than a new ADR, since it refines the same boundary decision. `docs/research/redness-index.md`'s "478 web / 468 tflite" line marked superseded.

**Spun out as new tickets, not resolved here** (facts genuinely unverified, not judgment calls):
- Which of the 468 canonical indices belong to each zone (forehead/left cheek/right cheek/nose/chin) — no official MediaPipe mapping exists.
- Mask resolution and whether it shares the landmarker's coordinate space — undocumented, needs an empirical check against a real photo, not more literature search.
- Whether native's raw tensor decode (the crop-space affine transform back to normalized `[0,1]` coordinates) actually matches this contract when run for real, and whether native's mask threshold/resize step aligns with the landmarker's frame — spun out as [ticket 09](./09-native-adapter-verification.md) (2026-09-11, added late — this sub-question from the original Open sub-questions above was never actually ticketed until then). Not blocking; `apps/mobile` has no capture code yet to test against.

## Audit 2026-10-17

- Status: done
- Evidence: Wire format implemented in packages/domain/src/capture.ts (capture.test.ts) and used by both capture-engine files.
