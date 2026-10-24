# skinsense-v2 — decisions settled in the rewrite grill (2026-09-11)

Source of these decisions: grill session 2026-09-11 (night), run from `~`. App landscape research (12 consumer apps, complaints, regulation) is NOT repeated here; read `~/docs/research/Research_Skin_Tracking_Apps_Landscape_2026.md`.

## Product

- Concept: **skin diary**. Capture with a guide (live face landmarks + ghost overlay of the previous photo + brightness check) → tap-mark spots on the photo → tonight's routine checklist → trend view.
- Trend: per zone (forehead, left cheek, right cheek, nose, chin): marked-spot count + redness index (see `redness-index.md`), 7/30-day chart, plus a before/after slider of two same-frame photos and routine completion %.
- Production-ready: public sign-up, per-user data isolation, privacy page, "not a medical diagnosis" disclaimer, delete-account button that also deletes the photos. Frozen after 2026-09-20 unless Dinh decides otherwise.
- Fully online. No offline capture or queue; offline shows nothing.
- UI languages: Vietnamese + English (next-intl on web, i18next + expo-localization on mobile).
- Web hero: 3D particles forming a face from the MediaPipe canonical mesh, scroll-driven through 3 scenes (see `3d-hero.md`). Web only. Priority equal to core.

## Platforms

| Target | How | Notes |
|---|---|---|
| Android | `apps/mobile` Expo (dev build, New Architecture) | React Native Reusables + NativeWind v4 |
| Web (desktop + iPhone Safari) | `apps/web` Next.js App Router + shadcn + R3F, Vercel Hobby | iPhone users open the web app; no native iOS |
| Shared logic | `packages/domain` pure TypeScript | zones, indices, trend, schemas |

- Monorepo: bun workspaces + Turborepo (`apps/*`, `packages/*`).
- iOS native is out: installing a dev build with native modules on a personal iPhone requires the paid Apple Developer Program ($99/yr) even with cloud builds; Dinh will not pay. See `testing-and-distribution.md`.

## AI (on-device)

- Web: `@mediapipe/tasks-vision` Face Landmarker (live, VIDEO mode) + Image Segmenter (stills only).
- Android: `react-native-vision-camera` + `react-native-vision-camera-face-detector` (ML Kit contours) for the live guide; `react-native-fast-tflite` running MediaPipe `.tflite` models on the captured still for 468-point mesh (**superseded 2026-09-11**, was wrongly given as 478 here; see [ADR 0001](../adr/0001-domain-package-receives-landmarks-and-mask.md) / ticket 05 — this is the one correction to this otherwise-closed doc) + selfie segmentation. Details and benchmark: `on-device-face-ai.md`.
- No acne-detection model is adopted (none production-grade + permissively licensed exists); spots are user-marked.

## Backend and auth

- Supabase Free: Postgres + Auth + Storage (private bucket, path prefix = `auth.uid()`). Patterns and limits: `supabase-expo-nextjs.md`.
- Google sign-in only, via `supabase.auth.signInWithIdToken` on both platforms (no redirect flow). See `auth-google-idtoken.md`.
- Hosting: Vercel Hobby for web; EAS Build free for Android APK; Supabase Free. Expected cost $0 through 2026-11 at ≤50 users.

## Tests and dev loop

- Web/domain: Vitest + Playwright. Mobile: jest-expo + @testing-library/react-native + `expo-router/testing-library` + Maestro (Android emulator). See `testing-and-distribution.md`.
- Daily loop: Android emulator (x86_64, KVM) with the laptop webcam as camera, `expo run:android` local builds; physical phone only for a pre-demo check; submission APK from EAS internal distribution.

## Process

- mattpocock flow: domain model → ADR → `/to-spec` → `/to-tickets` → `/implement` (TDD). `/wayfinder` charts the map from the repo.
- `/design` runs once for ~5 screens between the domain model and `/to-spec`; the spec links the canvas URL only (the design skill writes no repo file).
- Claude project setup: bootstrap recipe + plugins `supabase`, `vercel`; v1 project skills; `expo/skills` (expo-router, eas-build, eas-update, expo-dev-client); Callstack `react-native-best-practices`; emalorenzo `r3f-best-practices`, `three-best-practices`; internal skill `.claude/skills/mediapipe-tflite`.
- Old repo `~/skinsense` stays read-only until 2026-09-20, then moves to `~/Projects/archive/`.

## Schedule

- Budget: ~5 h/day 2026-09-12 → 2026-09-20 (~45 h). Claude's estimate for the full scope is ~55 h; Dinh chose no cut list and committed to finishing before 2026-09-21.
