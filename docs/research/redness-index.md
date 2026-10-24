# Per-zone redness and unevenness index (research 2026-09-11)

Goal: a lighting-robust number per face zone (forehead, left cheek, right cheek, nose, chin) that a user can track day to day. Not a clinical measure; presented with a "not a diagnosis" disclaimer.

## Inputs

- Face landmarks (478 web / 468 tflite) → zone polygons, plus exclusion polygons for eyes, eyebrows, lips, nostrils. **Superseded 2026-09-11**: standardized on 468 points on both platforms (web drops its 10 iris points too) — see ADR [0001](../adr/0001-domain-package-receives-landmarks-and-mask.md) and wayfinder ticket [Landmark + mask wire format](../../.scratch/production-readiness/issues/05-landmark-mask-wire-format.md).
- Skin mask from the selfie segmenter, intersected with the zone polygon. **Platform-divergent** (ticket [05](../../.scratch/production-readiness/issues/05-landmark-mask-wire-format.md)'s Amendment, 2026-09-11): web's mask (`CATEGORY_MASK` class 3) is specifically face-skin; native's (`selfie_segmentation` threshold) is general foreground/person, including hair, neck, clothes. The divergence concentrates at the forehead/hairline — worth a code comment where `apps/mobile`'s adapter is implemented.

## Formula (self-referenced CIELAB a*)

1. For every pixel in the skin mask: sRGB → linear → XYZ (D65) → CIELAB; keep `a*` (red–green axis, correlates with erythema/hemoglobin).
2. `a_ref` = median `a*` over **all** skin pixels of the same photo (alternative: median of the zone that is usually clear).
3. `redness(zone)` = `median(a*_zone) − a_ref`.
4. `unevenness(zone)` = MAD (median absolute deviation) of `a*_zone`; captures spotty redness rather than average tone.
5. Optional cross-check: hemoglobin-like index from optical densities `−log R`, `−log G` (Tsumura decomposition) or `log(G)/log(R)`.
6. No global gray-world / white-patch step: step 2 already cancels white-balance and exposure drift within a photo. A global step is only needed to compare absolute values across days when the reference skin itself changes (e.g. sunburn over the whole face).

Store per `Photo`: per-`Zone` `ZoneReading` (`{ redness, unevenness, pixelCount }`) plus the `Photo`'s own capture-condition metadata (brightness estimate, AWB lock state).

## Capture requirements

- Fixed distance and framing (landmark-based guide), no flash, diffuse stable light.
- Lock auto white balance at capture: Android Camera2 `CONTROL_AWB_LOCK = true` (or `CONTROL_AWB_MODE_OFF`); iOS `AVCaptureDevice.whiteBalanceMode = .locked` after locking exposure/focus — iOS part unverified, check Apple docs. In vision-camera check what the current version exposes (verify in docs).
- On the web, `getUserMedia` constraints for white balance (`whiteBalanceMode: 'manual'`) are only supported on some Android Chrome builds; treat as best-effort.

## Failure modes (say so in the UI copy)

- Whole face inflamed → `a_ref` shifts up and redness reads low.
- Mixed lighting (window + lamp) → `a*` varies with direction; the index drifts per zone.
- Darker skin (high Fitzpatrick) compresses the `a*` range → lower sensitivity.
- Shadows under nose/chin read as darker, not redder, but can bias the median.
- AWB lock behaviour differs across Android OEMs.

## Spot count and trend presentation

- `Spot`s are user-tapped points stored with normalised face coordinates (landmark-relative, so they survive re-framing). Count per `Zone` = `Spot`s inside the zone polygon.
- Consumer apps (SelfieLog, Trace, Acnify) show a plain trend line / 0–100 score with a "not diagnostic" note; none exposes clinical grading. Follow that: show counts and the relative index, no severity grades, no absolute thresholds.

## Sources

- https://pmc.ncbi.nlm.nih.gov/articles/PMC7754330/ (rosacea imaging with a*)
- https://onlinelibrary.wiley.com/doi/full/10.1111/exd.14224 (Erythema Q-score)
- https://arxiv.org/pdf/2404.00552 (melanin/hemoglobin decomposition)
- https://www.sciencedirect.com/science/article/pii/S0022202X26010146 (melanin-dependent erythema detection limits)
- https://apps.apple.com/us/app/selfielog-acne-tracker-diary/id6757474395
- https://apps.apple.com/us/app/trace-acne-skin-tracker/id6759658033
