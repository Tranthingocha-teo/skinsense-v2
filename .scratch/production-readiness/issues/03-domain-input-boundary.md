# Domain package input boundary: landmarks+mask vs pre-built polygons

Type: grilling
Status: done

## Question

**Correction (2026-09-11, before this ticket was worked):** the question below originally said native uses a 468-point mesh vs. web's 478-point mesh. That's wrong — `docs/research/on-device-face-ai.md` (line 36) said native also runs MediaPipe's 478-point `face_landmark.tflite`, the same topology as web (`AGENTS.md` never made this claim — miscited here originally; that source itself was later found wrong too, see ticket 05: native is actually 468-point). Point count is not the divergence. The real divergence: web gets landmarks through the high-level `@mediapipe/tasks-vision` `FaceLandmarker` API (decodes and normalizes for you); native runs the raw `.tflite` model via `react-native-fast-tflite` and must decode the output tensor manually — `on-device-face-ai.md` flags this explicitly ("you decode tensors yourself; no face-mesh example shipped"). So the open question is whether the two platforms' landmark *output format* (coordinate space, normalization, anchor, ordering) can be made to match, not whether their *topology* can.

Should `packages/domain` accept raw landmarks (each platform normalizes/decodes internally before calling in) or normalized zone polygons (each platform's adapter produces a common shape, domain only computes on that)?

If polygons: what exactly does "normalized" mean as a contract — coordinate space, units, which of the 478 indices map to each zone — such that the web API's decoded output and the native manual tensor-decode can both produce it identically? This is this ticket's real substance, including who writes and verifies the native tensor-decode against the web API's known-good output.

Dinh's initial lean (2026-09-11, single-click confirmation during destination-scoping, not a worked-through decision): normalized polygons, keeping `packages/domain` pure/no-I/O per AGENTS.md's stated boundary ("pure TypeScript: zones, redness index, trend math, schemas. No React, no I/O"). Treat as a starting point for this ticket's session, not a settled answer — the adapter contract still needs to be designed, and it was scoped against the wrong premise (468 vs 478) when Dinh gave that lean.

Call both the `grilling` and `domain-modeling` skills (`/grill-with-docs`) when working this ticket. If a decision crystallizes, capture it in `CONTEXT.md` (glossary only, no implementation detail) and offer an ADR if it's hard to reverse, surprising, and a real trade-off.

## Answer

**A second framing error surfaced while working this ticket, corrected before deciding:** the question above (and the "normalized polygons" option Dinh picked during destination-scoping) assumed each platform builds its own zone polygon and hands that to `packages/domain`. That was never actually open — `docs/research/on-device-face-ai.md:40` already states "Both return the same domain shape (landmarks + mask) so `packages/domain` computes zones and indices once," and `AGENTS.md` lists "zones" as something the domain package computes, not merely consumes. Presented the correction to Dinh directly (not re-opened as a fresh design question, since three existing docs already agreed); he confirmed.

**Decision:** `packages/domain` accepts `{ landmarks, mask }` from each platform's capture engine and computes zone polygons (plus exclusion polygons for eyes/brows/lips/nostrils, per `redness-index.md`) and the redness/unevenness indices itself, once, shared by both apps. Each platform's job is only to produce `landmarks` + `mask` in a shared format — not to know anything about zones.

Recorded as ADR [0001-domain-package-receives-landmarks-and-mask](../../../docs/adr/0001-domain-package-receives-landmarks-and-mask.md).

**Left open, spun out as a new ticket:** the exact `landmarks` and `mask` wire format (coordinate space, normalization, resolution, class encoding) isn't specified anywhere and wasn't asserted here from memory — see the mask-contract ticket.

## Audit 2026-10-17

- Status: done
- Evidence: Decision recorded in ADR 0001 (docs/adr/0001-domain-package-receives-landmarks-and-mask.md); packages/domain/src/capture.ts and zones.ts take landmarks+mask.
