# 13: Onboarding

**What to build:** after the first sign-in on a device, a new user sees onboarding once: three steps on Android (what the diary is, how to shoot consistently, privacy and permissions) that ask for the camera and optionally notifications, and one screen with the three points on the web. Spec: Features (onboarding); stories 64–67.

**Blocked by:** 02.

**Status:** done

- [x] Shown once per device after the first sign-in, tracked by a local flag (no table)
- [ ] Android: three steps; the last asks for the camera and optionally notifications with context
- [x] Web: one screen with the three points
- [x] Skip ends onboarding and it never shows again on this device
- [ ] If asking for the notification permission needs a native module that is not installed, this ticket installs it and rebuilds the dev build
- [x] Screen tests on both apps: steps advance, skip sets the flag, flag set means no onboarding
- [ ] Playwright: onboarding appears once; Maestro: onboarding flow on the emulator
- [ ] Light and dark screenshots match AndroidOnboarding1–3, WebOnboarding and PhoneOnboarding; differences noted here

- Review 15/09: the web flag read/write is wrapped in try/catch; storage that throws counts as onboarded, like the Android gate.

- Review 15/09: the photo column is `md:relative` so the "placeholder" label stays inset at 1440 (it was clipped off the left edge); the existing web screenshots predate this fix.

## Now

Built and green in worktree branch `worktree-agent-ae103a8ff230d6495`: web `OnboardingGate` in app/app/layout.tsx (localStorage `skinsense-onboarded`), Android gate in (app)/_layout.tsx (AsyncStorage `onboarded`), screen tests on both apps, /dev/onboarding fixture, web screenshots. Notification row deferred to ticket 18. Root typecheck passes; root test hit 5 s first-test timeouts under load in web routine-checklist and mobile settings/routine-checklist/trends (files this ticket does not touch), all green when rerun alone; web build passes. Playwright, Maestro and Android screenshots not run.

## Next

1. Android screenshots (Metro/emulator were owned by another agent): with a signed-in dev build that has not onboarded, `adb shell cmd uimode night no`, capture steps 1–3 with `adb exec-out screencap -p > ~/docs/case-study/skinsense/build/13-onboarding/android-<step>-light.png`, then `night yes` for dark.
2. Playwright (signs the e2e account in against production, reads only; needs Dinh's OK): `cd apps/web && bunx playwright test e2e/onboarding.spec.ts`.
3. Maestro (device must be signed in and not yet onboarded; needs Dinh's OK): `maestro test apps/mobile/flows/onboarding.yaml`.
4. Done in ticket 18 (15/09): the notification row (canvas AndroidOnboarding3 row 2, `Thông báo` / `Nhắc routine buổi tối · không bắt buộc` / `Cho phép`) to `CameraRow` in apps/mobile/src/components/onboarding.tsx once expo-notifications and POST_NOTIFICATIONS are in the build.

## Decisions

- Notifications on Android step 3 are hidden, not faked: app.json declares only CAMERA, so asking for POST_NOTIFICATIONS needs a manifest change and rebuild, and no reminder exists yet to use it. Ticket 18 adds expo-notifications, the rebuild and the row (orchestrator's call, overriding the fourth checkbox).
- The flag belongs to the device, not the account (spec: no table): signing out and in again, or with another account, does not show onboarding again.
- Web: the gate shows onboarding in place of the /app shell (no overlay), so there is no focus trap and no hidden nav behind it. The server can't read localStorage, so it renders the app and a first visit swaps in onboarding on hydration (one flash, once per device). Bắt đầu and Bỏ qua both set the flag and open the page the user asked for.
- Web at 390 (PhoneOnboarding) keeps the ticket's "one screen": the full-bleed photo, scrim, placeholder label and top-right Bỏ qua come from PhoneOnboarding, but the body shows the three points and Bắt đầu instead of step 1 of a pager with Tiếp tục. This is the only intended difference from the artboards.
- Android: onboarding stands in for the (app) Stack until done (the layout returns it), instead of an `onboarding` route behind Stack.Protected, so no route list in the shared layout needs to know about screens other tickets add. Camera is asked from the row's Cho phép button (vision-camera `useCameraPermission`, as Capture does); Bắt đầu does not require it.
- No step transition motion: the canvas specifies none and DESIGN.md motion is for the capture → mark → trend loop.
- Xem thử: /demo has its own layout, so the gate never runs there (checked on the dev server: no onboarding heading on /demo).

## Screenshots

~/docs/case-study/skinsense/build/13-onboarding/: web-light.png, web-dark.png (1440×900, WebOnboarding), phone-light.png, phone-dark.png (390×844, PhoneOnboarding with the difference above). Android pending (Next 1).

## Audit 2026-10-17

- Status: done
- Evidence: Commit 5c01f7c (+ fixes 90cc1f0, 52866e3); onboarding.test.tsx on web and mobile; e2e/onboarding.spec.ts; flows/onboarding.yaml.
