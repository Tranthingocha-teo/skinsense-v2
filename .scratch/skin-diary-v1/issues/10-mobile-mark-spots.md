# 10: Mobile — mark spots on photo

**What to build:** the same spot-marking behaviour as ticket 09, native.

**Blocked by:** 08

**Status:** superseded (by redesign-build 06)

- [x] Same functional criteria as ticket 09: tap-to-mark, normalized face-relative coordinates, per-zone count visible
- [x] Native touch handling matching the canvas's `MarkSpots` artboard
- [ ] Component test via `jest-expo` + Testing Library; one Maestro flow covers tap → save → count updates *(jest done; Maestro ran the tap → save → count half on the emulator against the stored photo, the capture half of `flows/mark-spots.yaml` still needs a face at the webcam — see Now)*
- [x] All UI strings shipped in Vietnamese + English

## Now

Built 2026-09-13 (Claude, `/implement`). Mirrors ticket 09 file for file. `src/lib/photos.ts`: `loadPhoto` (signed URL → `expo-file-system` `File.downloadFileAsync` into `Paths.cache/<id>.jpg`, returns the `file://` URI — nitro-image loads from a path and RN's Blob has no `arrayBuffer`), `loadSpots` / `saveSpots` (web's insert-then-delete order, same `ponytail:` note), `latestPhotoId` (shares one `latestPhoto()` query with `latestPhotoUrl`). `src/lib/capture-engine.ts`: `detectImage(engine, uri)` = `Images.loadFromFileAsync` → the same `detectLandmarks` crop → mesh → full-image-normalised path capture uses (landmarks aren't retained, ADR 0001). `src/components/mark-spots.tsx`: mirrored `expo-image` cover + an absolute `Pressable` canvas (`testID photo-canvas`); taps go through the same cover maths as web (`locationX/Y` → un-mirror → `assignSpotToZone`); markers are 44dp `Pressable`s (halo/dot/ring at the artboard's 13/5.5/1.5 of 300) that remove themselves on tap; counter line, per-zone chips, Save → Saved/Done. Route `(app)/spots/[photoId].tsx`; capture's Saved screen now links "Mark spots" next to "Take another" with "Done" below (web's layout, `savedId` from `savePhoto`); the shell links the latest photo. `markSpots` i18n vi/en (`count_one`/`count_other`, `none` for 0), `capture.markSpots`, `shell.markSpots`. `expo-file-system` added to `package.json` (it was already linked as `expo`'s dependency, so no native rebuild). `capture-engine.test.ts` now mocks `react-native-nitro-image` — the new value import (`Images`) pulled NitroModules in at import time.

Tests: 3 jest cases (web's synthetic 468-landmark face: tap → nose spot + chip, out-of-zone tap ignored, save payload face-relative; stored spot rendered + removed; no-face photo can't be marked). `flows/mark-spots.yaml`: capture → Save → Mark spots → tap the canvas centre (walks 40 %/60 % up the centre line if the centre misses a zone) → "1 spot marked" → Save → Saved. Green: `bun run typecheck` 4/4, `bun run test` 9 domain / 7 web / 6 mobile suites; eslint clean on the changed files (2 pre-existing `require()` warnings; the 2 `set-state-in-effect` errors are in untouched files). 
**Verified on the emulator (2026-09-13 22:25, signed-in session, Metro, no native rebuild):** shell → "Mark spots on tonight's photo" → the stored 720×1280 still downloads, `detectImage` finds the face, canvas appears. Centre-line taps at 40/50/60 % all answered "Tap on skin inside the face zones" — on that photo they sit on the eyes, nostrils and philtrum (excluded/uncovered), not a mapping bug: 32%,28% → "Forehead 1", 12%,58% → "Right cheek 1" (viewer's left in the mirrored view = the subject's right cheek, correct as a mirror), markers drawn at the tap points, Save → Saved, and SQL shows the two `spots` rows face-relative (forehead x 0.613 y 0.019, rightCheek x 0.904 y 0.604). `flows/mark-spots.yaml` now walks forehead → centre → cheek; its capture half needs a face at the webcam, not run tonight.

`/code-review` (Standards + Spec, Sonnet sub-agents): no standard violation, no scope creep. Fixed: marker radii now scale with the displayed image width (`face.width * scale`) like web's viewBox, not the view width — identical for a width-constrained portrait, different for a wide photo. Left as is: taps after "Saved" still edit the local set (web has the same gap); the Maestro checkbox stays open until the flow's capture half runs with a face.

## Next

- Commit proposed — Dinh types `/commit`.
- Run `maestro test apps/mobile/flows/mark-spots.yaml` on the emulator with a face at the webcam; the tap points walk forehead → centre → cheek.
- Ticket 13 (mobile trends) counts the same `spots` rows per zone per photo.

## Comments

- 2026-09-14 (`/grill-me`, third pass): the Maestro capture half runs on 15/09 together with ticket 08's flow, Dinh at the webcam.

## Audit 2026-10-17

- Status: superseded (by redesign-build 06)
- Evidence: Shipped in 351a5c2, rebuilt in 5631735; mobile mark-spots.test.tsx; flows/mark-spots.yaml.
