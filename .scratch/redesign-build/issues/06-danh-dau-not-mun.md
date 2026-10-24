# 06: Đánh dấu nốt mụn

**What to build:** marking spots on a Photo follows canvas 2 on both apps: 44px markers with a halo, a count line and zone chips, and clear messages for taps outside the zones, a failed save and a photo with no detectable face. Stories 28–32.

**Blocked by:** 02.

**Status:** done

- [x] A tap inside a zone places a 44px marker with a halo
- [x] A count line and per-zone chips reflect the marked spots
- [x] A tap outside the face zones adds nothing and the status line says where to tap
- [x] A failed save shows an error above the save button
- [x] A photo with no detectable face shows a message over the photo instead of a dead canvas
- [x] Screen tests on both apps cover marking, outside zone, save error and no face with the data module mocked
- [ ] Existing mark-spots tests and the Maestro mark-spots flow pass (unit tests pass on both apps; Maestro not run — it writes data and the emulator belongs to another agent)
- [ ] Light and dark screenshots (web 1440, web 390, Android) match AndroidSpots / WebSpots / PhoneSpots and the SpotsNoFace, SpotsError artboards; differences noted here (web done; Android pending)

## Decisions (2026-09-15)

- Pipeline untouched on both apps: image load, `detectImage`, `boundingBox`, `assignSpotToZone`, face-relative save, cover/un-mirror tap maths and phases are as before; only rendering changed.
- Web markers moved out of the SVG into 44px HTML `<button>`s over the photo (the old SVG markers scaled with the image, so neither 44px nor the canvas dot/halo sizes held). They are placed in CSS with container query units on the photo box (`container-type: size`): one image pixel under `object-cover` is `max(100cqw / w, 100cqh / h)`, so a marker stays on its spot at any box size without measuring. The tap surface is a `div role="img"` with the same label as the old SVG, so tests and the cover maths are unchanged.
- Web two-column layout (photo 480×640 + 340px column) starts at `lg` (1024), not `md`: at `md` the sidebar leaves less than the 1004px the canvas row needs. Below `lg` the phone layout is used, capped at 480px wide and centred.
- Android markers are fixed 30dp halo / 13dp dot with a 1.5dp `background` ring (canvas AndroidSpots); previously they scaled with the displayed image width.
- Chips: canvas border is `fg` at 14% — web uses `border-foreground/14`, Android `border-border` (NativeWind opacity modifiers do not work on the hsl variables, ticket 03).
- Android no-face / load-error scrim is `bg` at 55% as a hex alpha from `tokens.json` (`8C`), keyed by `useColorScheme()` (ticket 07 precedent).
- Outside-zone status line swaps the accent dot for the canvas alert icon in `destructive`, text stays `muted` (canvas SpotsError). Save error puts the same icon before the message (`role="alert"`), above the button.
- Load error reuses the no-face overlay (no artboard); saved state keeps "Đã lưu" in `success` above an accent "Xong" link (no artboard).
- No new strings: all canvas copy already exists in `MarkSpots` (web) / `markSpots` (Android).

## Differences from canvas

- Web/Android: no "Ảnh · placeholder" badge — the real photo renders in the box (ticket 07 precedent); before it loads the box shows the `photo` gradient.
- Web 1440 and 390 screenshots use the demo portrait with three seeded stored spots; marker positions differ from the artboard's placeholder coordinates.
- Web 390: the phone tab bar (ticket 02 shell) is present below the screen, the canvas PhoneSpots artboard has none; the `/demo` banner (ticket 08) and the demo metrics card sit above/below the screen. Full-page 390 captures put the fixed tab bar mid-page (Playwright artefact).
- No-face screenshots route a plain gradient SVG over the demo portrait (MediaPipe finds a face in the illustrated `before.svg`); the demo metrics card then shows its own model error, which is outside this screen.
- Save error screenshots force `localStorage.setItem` to throw in the demo; the signed-in Supabase save error is covered by the screen tests.
- The dev-only Next "1 Issue" badge is visible in the screenshots (MediaPipe logs its TFLite INFO line on stderr); not in production builds.

## Now

- Done 2026-09-15 on worktree branch `worktree-agent-a45a1b84b67194bd9`. Screen tests pass on both apps (web 4, Android 4, save-error retry test added on both). Root `bun run typecheck` passes; root `bun run test`: domain 72 and web 47 pass, Android settings/today/trends/routine-checklist timed out under machine load in the root run and pass when run alone (5/5/4/10), mark-spots passes. Web screenshots: `~/docs/case-study/skinsense/build/06-danh-dau-not-mun/web-spots-{1440,390}-{light,dark}-{spots,outside,saveError,noFace}.png`.

## Next

- Android screenshots (light/dark: marked spots, outside zone, save error, no face) against AndroidSpots / AndroidSpotsError / AndroidSpotsNoFace — pending, the emulator belongs to another agent.
- Maestro flow writes data, not run: `cd apps/mobile && bunx expo start --dev-client`, then `maestro test apps/mobile/flows/mark-spots.yaml`.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 5631735; mark-spots.test.tsx on web and mobile; flows/mark-spots.yaml; spots step in e2e/capture.spec.ts.
