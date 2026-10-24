# 07: Post-cut polish, demo extras, dark mode, Xem thử, project page, onboarding

**What to build:** spec rows 10–21 in table order — the app never shows a blank or broken screen, interactions feel responsive and are accessible, the demo gains spot marking, a metrics table and a real webcam capture, both apps get dark mode, the APK gets "Xem thử với dữ liệu mẫu", a project page (vi + en) explains the engineering, and new users get a short tour. Stories 22, 23, 31–34, 39, 41, 44–47, 59, 63. Estimate ~14 h.

**Coarse ticket:** larger than one context window; likely after 23:59. `/implement` works it row by row in table order and records the finished rows in `## Now`; split into files only if Dinh asks.

**Blocked by:** 04, 05, 06

**Status:** superseded (by redesign-build 08, 13, 12, 01)

- [x] Row 10: empty / loading / error states on every screen (both apps) and a web 404 page
- [x] Row 11: subtle motion on state changes (web + Android) and haptics on Android taps; respects reduced motion
- [x] Row 12: accessibility pass — labelled controls, sufficient contrast, ≥44 px targets (both)
- [x] Row 13: good-lighting hint before Android capture
- [x] Row 14: demo lets the visitor mark spots on a sample photo, not saved to Supabase
- [x] Row 15: demo technical metrics table (model, timings, landmark count, mask resolution)
- [x] Row 16: Android app shortcuts (long-press icon → Chụp, Routine)
- [ ] Row 17: dark mode — dark tokens derived from the canvas light tokens (same hues, inverted lightness); web class-based theme following the system by default, choice remembered; Android NativeWind colour scheme with the same Hệ thống / Sáng / Tối choice stored locally; theme row appears in Cài đặt on both
- [ ] Row 18: "Xem thử với dữ liệu mẫu" on the Android sign-in screen enters the demo using ticket 05's generator; writes to AsyncStorage only; banner + Đặt lại as on web
- [ ] Row 19: public project page vi + en (architecture, on-device AI pipeline, a* formula), demo embedded + QR to it; in-app "Về dự án SkinSense" on Android; Cài đặt row + landing "AI trên thiết bị" link appear now
- [ ] Row 20: onboarding tour (both) pointing at capture, spots, routine, trends
- [ ] Row 21: demo webcam capture on desktop runs the real web capture pipeline and shows readings with no save path; phone browsers get ticket 01's APK banner
- [ ] Web rows deployed to Vercel as each finishes

## Now

- Row 10 done (uncommitted, `/code-review` next): `LoadState` (loading / error + "Thử lại") in `apps/web/src/components/load-state.tsx` and `apps/mobile/src/components/load-state.tsx`, used by Today, Trends and RoutineChecklist on both apps (these returned null and swallowed load errors). Trends keeps shown data when signed URLs or a window switch fail; web Today tolerates a failed `latestPhotoUrl`. Web `app/not-found.tsx` (vi/en `NotFound`), `Common` / `common` keys in all four locale files. Capture, mark spots, sign-in, settings already had states; empty states (`noPhoto`, `noData`) already existed.
- Verified 11:17: typecheck green, web vitest 7 files / 20 tests, mobile jest 9 suites / 22 tests (new retry test in each app); `curl localhost:3000/khong-ton-tai` → 404 page; emulator in airplane mode → Xu hướng shows the error, airplane off → Thử lại loads the chart.
- Skipped: web `error.tsx` and mobile `+not-found` / `ErrorBoundary` (render throws, not in the row text). Pre-existing lint error `react-hooks/set-state-in-effect` at web `routine-checklist.tsx` `setNight(n)` (on HEAD too).

- 12:11 `/code-review` finding applied: both `routine-checklist.tsx` `persist` fallbacks now `reload().catch(() => setStatus("failed"))`; typecheck + component tests green. Finding 2 (no `cancelled` guard in mobile Today / checklists) skipped as low value.

- Row 10 committed `58ae194`, pushed. Vercel does not auto-deploy on push: latest production is still `5290135` (ticket 05), so tickets 06 + row 10 are not live.
- Row 11 done: web `motion-safe:animate-in fade-in` (tw-animate-css, 150 ms) on Today / Trends / RoutineChecklist content after load, `transition-colors` on the tick box. Mobile `Animated.View entering={FadeIn.duration(200)}` on the same three (Reanimated skips it under system reduce motion); `expo-haptics` ~57.0.3 installed: `selectionAsync` on routine tick + Trends days/zone chips, Light impact on shutter + spot placed, Success/Error notification on photo save + spots save. Gate (animate-expo skill): tab/chip switches not animated, nav taps no haptics. Dev build with the new native module started in the background (JDK 17).

- Row 11 verified 12:20: typecheck green, web vitest 20 tests, mobile jest 9 suites / 22 tests; dev build reinstalled, routine tick logged in `dumpsys vibrator_manager` as `usage: TOUCH | com.dinh144.skinsense`. Web fade not checked in a browser. `/code-review` finding applied: every `Haptics.*Async()` call now `.catch(() => {})` (device without a vibrator). Committed with this ticket update.

- Row 12 done: Sonnet audits of both apps applied. Contrast: `--primary` darkened web `oklch(58%→55% 0.09 45)`, mobile `19 39.6% 44.1%` (also destructive/ring) — white on primary 4.4→5.0:1, primary text on background 4.2→4.7:1; ticked routine labels `opacity-55` → `text-muted-foreground` (both). Targets ≥44 px: web Button `lg` h-11, locale switch, sign-out, delete-account `min-h-11`, spot markers get a transparent 22/300 hit circle; mobile Button `default`/`icon` h-11, sign-in button minHeight 44. Labels: mobile capture back button, rename / new-step inputs, sign-in `role="button"`, spot canvas `role="button"`, decorative photos `accessible={false}`. Skipped: web spot canvas keeps `role="img"` (placing a spot is pointer-only).
- Verified 12:35: typecheck green, web vitest 20, mobile jest 9 suites / 22; emulator Today renders with the darker primary. Web not checked in a browser (dev server not running). `/code-review` (medium): one finding skipped — web hit circles of two close spots overlap, so a tap can remove the later spot; mobile's HIT boxes already behave the same, and removal is local until Lưu.

- Row 13 done: static `capture.lightHint` line ("Ngồi đối diện cửa sổ hoặc đèn trắng, đừng để nguồn sáng sau lưng") under the viewfinder's `keepDistance` line, shown before the shutter; the live "Thiếu sáng / Đủ sáng" badge already covered the in-frame check. Typecheck + capture jest green; seen on the emulator Chụp tab 12:38; `/code-review` no findings.

- Row 14 in progress (uncommitted, blocked on the sample photo): `MarkSpots` takes `api: MarkSpotsApi` (`loadPhoto`, `loadSpots`, optional `saveSpots`); signed-in route binds `@/lib/photos` via `SignedInMarkSpots` in `signed-in.tsx`; demo route `app/demo/spots/[photoId]/page.tsx` binds `demoApi` (sample photo, no spots, no `saveSpots` → no Lưu button); `useAppHref` keeps `/spots/*` inside `/demo`. New vitest case "in the demo, marks spots without a save path"; typecheck 4/4, mark-spots tests 4/4. Browser 12:43: demo Today link → `/demo/spots/demo-photo-2026-09-13`, face detected, no Lưu.
- Blocker: the demo SVGs have no detectable face, and `public/demo-photos/portrait.jpg` (a frame of `e2e/fixtures/face.y4m` = MediaPipe's `portrait.jpg`) is Barack Obama's official portrait — a real, identifiable person; do not ship it. Owner chose (12:45) an AI-generated synthetic face; the Obama JPEG was deleted, so `/demo/spots/*` shows the load error until the new file lands.
- 12:50 unblocked (owner chose Claude fetches from thispersondoesnotexist.com): StyleGAN face center-cropped to 480×640 at `public/demo-photos/portrait.jpg`, `PORTRAIT` comment updated. Browser: face detected, cheek tap → "Má trái 1", no Lưu. Typecheck + mark-spots tests 4/4.
- 12:58 `/code-review`: Standards clean (indent nit, gone with the fix); Spec found spec line 31 unmet — demo spot marks must go to local storage and Đặt lại clears them. Owner chose "localStorage, start empty": `demoApi` gets `saveSpots` / `loadSpots` over `skinsense-demo.spots[photoId]`, `loadTrends` replaces a photo's generated spots with its saved marks (generated spots sit at random points, so the photo opens empty); `MarkSpotsApi.saveSpots` required again. New `lib/demo.test.ts` (in-memory `localStorage` stub: Node 26's global shadows jsdom's). Browser: mark cheek → Lưu → reload keeps "Má trái 1" → Today badge "1 nốt" → Đặt lại clears storage.
- Row 15 decided (owner, 12:57): table under the demo mark-spots page, timings measured live in the visitor's browser on the sample photo.

- Row 14 committed `82ba200`.
- Row 15 done (uncommitted, `/code-review` running): `measurePipeline` in `capture-engine.web.ts` times engine load, landmarks, segmentation and zone readings on the ≤640 copy of the sample photo; `components/demo-metrics.tsx` renders it under `/demo/spots/*` (`DemoMetrics` vi/en strings, `PORTRAIT` exported from `lib/demo.ts`). Typecheck green. Browser 13:05 (dev server, cold): 0.10.21, face_landmarker.task, selfie_multiclass_256x256.tflite, GPU, load 10320 ms, landmarks 43 ms, segmentation 149 ms, zones 4427 ms, 468, mask 480 × 640.
- 13:12 `/code-review`: applied — dropped the "GPU" row (only the requested delegate; MediaPipe may fall back to CPU and does not report it). Skipped — no component test (pipeline needs the real models; browser-verified), "timing polluted by MarkSpots' concurrent detect" (`detectForVideo` is synchronous, timed spans cannot interleave), missing `cancelled` guard (nothing to release), library row kept.
- Observation, not fixed: zone readings take ~4.4 s in dev (per-pixel zone assignment over 480×640); check the production build before calling it slow.
- Row 15 committed `eec2825` (web vitest 8 files / 21 tests).
- Row 16 done: `expo-quick-actions` 6.0.2 via `expo install` (config plugin added to `app.json`, no icons); `(app)/_layout.tsx` calls `useQuickActionRouting()` and `setItems` Chụp → `/capture`, Routine → `/routine` (new `nav.routine` key, vi + en) — the signed-in sub-layout, so shortcuts appear after sign-in and the library's "not in the root layout" rule holds. Mobile tsc green, jest 9 suites / 22. Dev build reinstalled (JDK 17); `dumpsys shortcut` lists `capture` "Chụp" and `routine` "Routine"; long-press icon in the drawer → Routine opens "Routine tối nay". `/code-review` applied: `setItems(...).catch(() => {})` like the Haptics calls; `app.json` restored to HEAD formatting plus the plugin line (`expo install` had reflowed `fontDefinitions`). Skipped: shortcuts appear only after the first signed-in launch (the library has no static Android shortcuts), nothing clears them on sign-out (a signed-out tap lands on sign-in), vi label stays "Routine" as the spec writes it. Committed with this update.
- 13:40 context red (≥140k): session stopped here. Metro left running on :8081, emulator on the Routine screen.

- Stopped after row 14 by owner; spec to be closed (grill in session dinh-39, 13:10: project already submitted, a DESIGN.md-led redesign spec replaces rows 15–43). The message reached this session after rows 15 (`eec2825`) and 16 (`af94ab7`) were already committed, not pushed.

## Next

- Rows 15 (`eec2825`) and 16 (`af94ab7`) kept (owner, 13:45); no further rows from this spec. `main` is 6 commits ahead of `origin/main` (rows 11–16), unpushed.
- Owner deploys web rows 10–15 once: `! ~/.bun/bin/vercel deploy --prod` from the repo root; then note the deploy ID here.

## Audit 2026-10-17

- Status: superseded (by redesign-build 08, 13, 12, 01)
- Evidence: Rows 10-16 shipped (commits 58ae194, eacc168, ec5ea50, b6352ff, 82ba200, eec2825, af94ab7). Rows 17-21 live on in redesign-build: dark mode in 01, Android Xem thử in 08 (still open), project page in 12, onboarding in 13; row 21 (demo webcam) was not built and is dropped.
