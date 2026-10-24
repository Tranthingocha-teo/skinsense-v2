# Native capture adapter: verify against web's known-good output

Type: task
Status: done

## Question

[ADR 0003](../../../docs/adr/0003-redness-index-acceptance-bar.md)'s acceptance-bar test validates `packages/domain`'s redness-index math — the same test regardless of which platform produced its input, since `packages/domain` only ever sees `{ landmarks, skinMask }` (per [ADR 0001](../../../docs/adr/0001-domain-package-receives-landmarks-and-mask.md)) and never knows which platform it came from. That math validation is real and unaffected by this ticket.

What it does **not** cover: whether `apps/mobile`'s adapter actually produces a `{ landmarks, skinMask }` that means the same thing as web's. Two specific gaps, both already named but never formally tracked:

- [Ticket 05](./05-landmark-mask-wire-format.md)'s Amendment: native's raw `face_landmark.tflite` output is in the model input crop's pixel space and needs an affine transform back to full-image normalized `[0,1]` coordinates via the face-detector's crop region — confirmed against reference code, but never verified against real native output, since no capture code exists yet.
- [Ticket 07](./07-mask-resolution-alignment-spike.md): mask resolution and landmark/mask coordinate alignment were verified empirically on web only. Native runs a different model (`selfie_segmentation`, not `selfie_multiclass_256x256`) requiring its own threshold + resize step per the `mediapipe-tflite` skill — explicitly left unverified ("no capture code exists yet to test against").

Once `apps/mobile` has real capture code: run the native adapter and the web pipeline against the same test photo (or as close as achievable — a face photographed once and fed to both, or two separate photos of the same face), compare landmark positions and mask coverage. Confirms the crop-space transform and the mask threshold/resize step produce output equivalent in meaning to web's, or surfaces where they diverge.

Not blocking now — `apps/mobile` has no capture code to test against yet (bootstrap stub only). Blocks: treating native's redness numbers as trustworthy before this verification runs at least once.

## Answer

Run 2026-09-13 in skin-diary-v1 [ticket 18](../../skin-diary-v1/issues/18-native-capture-spike.md) (its "## Now" holds the full table). Same JPEG (mpbench's `portrait.jpg`, 820×1024) through both adapters at the shared ≤640 analysis size:

- Crop-space transform (ticket 05's amendment): native landmarks sit a mean 1.80 px / max 6.87 px from web's on the 513×640 frame — confirmed.
- Mask (ticket 07's open native step): `selfie_segmentation.tflite` cannot run in plain TFLite (custom op), so native uses web's `selfie_multiclass_256x256.tflite` with the same class-3 rule; face-skin pixel counts agree to 0.2 % (18 914 vs 18 870). The "two masks mean different things" caveat in spec.md is void.
- Zone redness: rank preserved, absolute values differ by 0.2–0.9 a* (zone polygons ~10 % larger on native + JPEG re-encodes in the pixel path). Treated as comparable per platform, not calibrated across platforms.

## Audit 2026-10-17

- Status: done
- Evidence: apps/mobile/src/lib/capture-engine.test.ts; native capture in commit 8c02250; Maestro flows/capture.yaml.
