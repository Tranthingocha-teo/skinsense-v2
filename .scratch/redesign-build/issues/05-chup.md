# 05: Chụp

**What to build:** capturing a photo follows canvas 2 end to end on both apps: the viewfinder with guide and light badge, the quality review, save errors that keep the still, the saved result, camera-denied recovery, and a phone-browser screen that points to the APK. Spec: Features (web at phone width); stories 18–27.

**Blocked by:** 02.

**Status:** done

- [x] Android: 3:4 viewfinder with guide ellipse, light badge and hints under it; web: 4:3 webcam viewfinder beside the hint and shutter
- [x] Poor light shows "Thiếu sáng" with an icon on the badge
- [x] The shutter has a ring and label and stays disabled until the camera is ready
- [x] Quality issues are listed (Alert) with "Chụp lại" and "Vẫn lưu"
- [x] A failed save shows an inline error and keeps the same still for retry
- [x] Saved: time, per-zone redness and unevenness table, disclaimer, "Chụp ảnh khác", "Đánh dấu nốt mụn", "Xong"
- [x] Android camera denied: card explaining photos stay private and a button to allow the camera; web blocked webcam: camera error and "Thử lại"
- [x] Web at phone width shows the existing APK banner copy instead of the camera
- [x] Screen tests on both apps cover ready, low light, review, save error, saved and denied with the data module mocked
- [ ] Existing capture Playwright spec and Maestro capture flow pass (production writes only after Dinh approves the command)
- [ ] Light and dark screenshots (web 1440, web 390, Android) match AndroidCapture / WebCapture / PhoneCapture and the CaptureIssue, CaptureReview, CaptureSaveError, CaptureSaved, CameraDenied artboards; differences noted here

- Review 15/09: the web camera start checks the phone breakpoint once at mount (resizing a desktop window below 768px keeps the stream running; accepted). `desktopHint` is new copy mirroring PhoneCapture. Android review/save error/saved are unverified visually (shutter never pressed on the emulator).

## Now

- 2026-09-15: code, screen tests and screenshots done. Web `capture.tsx` (8 RTL tests) + dev-only `/dev/capture`; Android `capture.tsx` (7 RNTL tests); web + mobile typecheck green; `cd apps/web && bun run build` green. Screenshots in `~/docs/case-study/skinsense/build/05-chup/`: web 1440 light/dark × live, dark, review, saveError, saved, denied; web 390 light/dark; Android light/dark live + denied (denied via `pm revoke` + `set-permission-flags user-fixed`, restored afterwards). Android review/saveError/saved not screenshotted: they need the shutter (never pressed on the emulator). Root `bun run typecheck` and `bun run test` green (domain 72, web 42, mobile 39; the first run had only `landing.test.tsx` time out under dev-server + emulator load). Dev server and Metro stopped.

## Next

- Dinh: run the production capture flows (they write to production Supabase): `cd apps/web && bunx playwright test e2e/capture.spec.ts` and `maestro test apps/mobile/flows/capture.yaml` (emulator with `-camera-front webcam0`, signed in, device locale en). Then tick the Playwright/Maestro box.
- Screenshot box left unticked until the Android review/saveError/saved states are captured (needs a shutter press on a test account).

## Decisions

- Web capture states render through an injected `api` prop (engine + photos modules; precedent TodayApi/RoutineApi) so a dev-only `/dev/capture?state=…` page (404 in production via `dev/layout.tsx`) can screenshot every state with Playwright's fake camera and stubbed Supabase. No signed-in `/app/capture` screenshot needs production credentials.
- Phone width decided by `matchMedia("(max-width: 767px)")` after mount: the camera never starts below md; both layouts stay in one component (brief: responsive, not separate pages).
- `e2e/capture.spec.ts` pinned to a 1440×900 viewport: the config default (390×844) now shows the APK card by design. Not run here: it writes to production Supabase. Command for Dinh: `cd apps/web && bunx playwright test e2e/capture.spec.ts`.
- Fixed a dev-only race: StrictMode's cancelled first camera start rejected (`play()` aborted by the second start) and showed the camera error; the catch now ignores cancelled starts.
- Android denied: "Cho phép truy cập camera" asks again, then opens system Settings when Android no longer shows the prompt (permanent denial).
- Differences from the artboards: saved time follows next-intl's vi format ("13:42 15 thg 9") rather than the canvas "14 thg 9, 22:14"; the Android badge has no backdrop blur (no blur view; GPU cost); web screenshots show Next's dev indicator badge (dev server only).

## Audit 2026-10-17

- Status: done
- Evidence: Commit 646ccff; capture.test.tsx on web and mobile; apps/web/e2e/capture.spec.ts; apps/mobile/flows/capture.yaml.
