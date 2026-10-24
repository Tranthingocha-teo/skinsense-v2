# skinsense-v2: skin diary v2 polish

Status: ready-for-agent
Design: https://claude.ai/code/artifact/61324f8d-2e99-4e2a-8fbb-30165617ea0b — 5 static screens (web Landing, web Hôm nay demo, Android Đăng nhập / Hôm nay / Cài đặt), "Clinical calm" direction. Working source: `.scratch/skin-diary-v2-polish/design/`.
Decisions: [grill-2026-09-14.md](./grill-2026-09-14.md) (fourth grill, deadline 23:59 2026-09-14). Builds on [skin-diary-v1/spec.md](../skin-diary-v1/spec.md), which stays untouched.

## Problem Statement

skinsense-v2's v1 build works end to end (sign-in, guided capture, spot marking, routine checklist, per-zone trends, account deletion), but it does not yet read as a finished product. The signed-in home on both platforms is a stack of plain link buttons; sign-out and account deletion sit on that home screen. The landing page has three short sections and a hero that looks like scattered dots until someone scrolls over the canvas. A grader or a curious visitor cannot see anything without a Google sign-in, so the app's core value — trends that build up over weeks — is invisible on a first visit. There is no dark mode, no language switch, no app icon of its own, no reminders, no way to see streaks, and the copy still says "Độ đỏ" in places where the product has settled on "Chỉ số mẩn đỏ". The project is due at 23:59 2026-09-14 as a Vercel link, an Android APK and a public GitHub repo.

## Solution

A polish and expansion pass over both apps, built in rank order (grader visibility ÷ hours, table below) and deployed item by item, so whatever is finished at 23:59 ships:

- Both apps get the same four-destination navigation — **Hôm nay / Chụp / Xu hướng / Cài đặt** — as bottom tabs on Android and as a sidebar (bottom tabs at narrow widths) on web. Hôm nay is a real dashboard: tonight's photo state, per-zone Chỉ số mẩn đỏ with 7-day direction, capture and routine streaks, tonight's routine. Cài đặt holds language, theme, reminders, data export, feedback, the project page, privacy, sign-out and account deletion.
- A visitor can try the whole app without signing in: a demo with 90 days of sample data, on web and inside the APK ("Xem thử"), with changes kept only on that device and a reset.
- The landing page tells the full story (how it works, on-device AI, web vs Android, FAQ, APK QR) under a hero that loops its three scenes on its own. A project page (vi + en) explains the architecture, the AI pipeline and the a* formula.
- Nightly reminders at a user-chosen time, delivered as web push and Android notifications.
- A long tail of smaller features (timeline, exports, knowledge library, Android extras) in rank order, then testing, then the fixed submission steps.

## User Stories

**Navigation and home**
1. As a signed-in user on Android, I want bottom tabs for Hôm nay, Chụp, Xu hướng and Cài đặt, so that every main screen is one tap away.
2. As a signed-in user on web, I want the same four destinations in a sidebar, so that moving between the web app and the phone app feels the same.
3. As a web user on a narrow window, I want the sidebar to become bottom tabs, so that the layout still works.
4. As a user, I want Hôm nay to show whether I have taken tonight's photo, and when my last photo was and how many spots it has, so that I know what is left to do tonight.
5. As a user, I want Hôm nay to show each zone's Chỉ số mẩn đỏ with its 7-day direction (đang giảm / ổn định / đang tăng), so that I get the trend at a glance without opening Xu hướng.
6. As a user, I want a capture streak and a routine streak on Hôm nay, so that I stay motivated to keep the diary consistent.
7. As a user, I want to tick tonight's routine straight from Hôm nay, so that the nightly check-in is a single screen.
8. As a user, I want a "Chụp ảnh tối nay" call to action on Hôm nay when tonight has no photo, so that capturing is the obvious next step.
9. As a user, I want sign-out and account deletion in Cài đặt rather than on the home screen, so that I don't hit them by accident.

**Copy and brand**
10. As a Vietnamese reader, I want the metric called "Chỉ số mẩn đỏ" everywhere (never "Độ đỏ" or "Chỉ số đỏ"), so that one concept has one name.
11. As a visitor, I want the sign-in button to read "Đăng nhập bằng Google" (the nav keeps the short "Đăng nhập"), so that I know which account I am signing in with.
12. As an Android user, I want SkinSense to have its own app icon and splash screen, so that it looks like a finished app on my home screen.
13. As a user, I want Newsreader headings and Public Sans body text on Android too, so that both platforms share one visual identity.

**Landing and project page**
14. As a visitor, I want the hero to play its three scenes (face → spots → chart) on a loop without scrolling, so that I see what the product does immediately.
15. As a visitor with reduced motion enabled, I want the hero to stay still, so that the page doesn't cause discomfort.
16. As a visitor, I want a "Cách hoạt động" section with the four nightly steps, so that I understand the routine before signing up.
17. As a visitor, I want an "AI trên thiết bị" section explaining that landmarks, the skin mask and the index are computed on my device and not stored, so that I trust the privacy claim.
18. As a visitor, I want a web vs Android comparison table, so that I can pick the platform that fits me.
19. As a visitor on a desktop, I want a QR code to the APK, so that I can install the Android app from my phone in one scan.
20. As a visitor, I want an FAQ with complete answers (diagnosis, how the index works, where photos are stored, cost, supported devices), so that my questions are answered without contacting anyone.
21. As a visitor, I want to switch the landing page between Vietnamese and English from the header, so that I can read it in my language.
22. As a grader or developer, I want a project page in Vietnamese and English covering architecture, the on-device AI pipeline and the a* formula, so that I can evaluate the engineering.
23. As an Android user, I want the same project information inside the app (Về dự án SkinSense), so that I don't need a browser.
24. As someone sharing the link, I want proper page titles, descriptions and an Open Graph image, so that the link previews well in chat apps and search.
25. As a phone-browser visitor opening capture, I want a banner telling me to use the Android APK, so that I am not stuck on an unsupported camera flow.

**Demo without sign-in**
26. As a visitor, I want to open a demo with no sign-in, so that I can see a filled-in diary before trusting the app with my face.
27. As a demo visitor, I want 90 days of sample data behind Hôm nay, Xu hướng and the before/after slider, so that trends look like they would after real use.
28. As a demo visitor, I want to tick the routine and see it persist, with a clear note that changes stay only in this browser (or this phone), so that the demo feels live without writing to anyone's account.
29. As a demo visitor, I want a reset button, so that I can return the demo to its original state.
30. As a demo visitor, I want a persistent banner with "Đăng nhập bằng Google", so that I can switch to a real account at any point.
31. As an Android user on the sign-in screen, I want "Xem thử với dữ liệu mẫu", so that I can explore the app before signing in.
32. As a demo visitor, I want to mark spots on a sample photo (not saved), so that I can try the core interaction.
33. As a demo visitor on a desktop, I want to run a real webcam capture analysed on-device (not saved), so that I can see the AI pipeline work on my own face.
34. As a grader, I want a technical metrics table in the demo (model, timings, landmark count, mask resolution), so that I can see the on-device AI is real.
35. As a grader, I want a step-by-step replay of the pipeline (landmarks → mask → zones → a*), so that I can follow how a reading is produced.
36. As a visitor, I want several demo personas with shareable links and a side-by-side view, so that I can see how different skin histories look.
37. As a presenter, I want a presentation mode, so that I can walk through the demo on a projector.
38. As a visitor, I want a changelog built from the git history and ADRs, so that I can see how the project evolved.
39. As a grader, I want the demo embedded in the project page and a QR code to it, so that I can open it from any context.
40. As a grader, I want a 60–90 s screen recording of the product, so that I can see the Android flow without installing the APK.

**Everyday features (web + Android)**
41. As a new user, I want a short onboarding tour, so that I know where capture, spots, routine and trends are.
42. As a user, I want a photo timeline with a per-zone detail view per photo, so that I can revisit any night.
43. As a user, I want to switch between Vietnamese and English in Cài đặt, and have the choice remembered, so that the app stays in my language.
44. As a user, I want dark mode that follows the system by default with a Hệ thống / Sáng / Tối choice, so that the app is comfortable at night.
45. As a user, I want considered empty, loading and error states and a 404 page, so that the app never shows a blank or broken screen.
46. As a user, I want subtle motion on state changes and haptic feedback on Android taps, so that interactions feel responsive.
47. As a user relying on assistive technology, I want labelled controls, sufficient contrast and ≥44 px targets, so that I can use the app.
48. As a user, I want the remaining v1 screens (Chụp, spot marking, routine, Xu hướng) brought to the Clinical calm look, so that the whole app feels like one product.
49. As a user, I want to export a progress report as PNG and PDF, so that I can keep or share a snapshot.
50. As a user, I want a knowledge library of about five short articles (vi + en), each citing AAD or DermNet with a disclaimer and no treatment advice, so that I understand redness and blemishes without being told what to do.
51. As a signed-in user, I want to send feedback from Cài đặt, so that I can report a problem without leaving the app.
52. As a user, I want small illustrations on empty states and onboarding, so that the app feels warm rather than clinical-cold.
53. As a web user, I want to install the web app as a PWA, so that it opens like an app from my desktop.

**Reminders**
54. As a user, I want to turn on a nightly capture reminder and pick its time in 5-minute steps, so that I remember tonight's photo.
55. As a web user, I want the reminder as a browser push notification, so that I get it even when the tab is closed.
56. As an Android user, I want the reminder as a system notification, so that I get it without opening the app.
57. As a user who travels, I want reminders to fire at my chosen local time, so that a timezone change doesn't shift them.
58. As a user, I want at most one reminder per night, so that I am not spammed.

**Android extras**
59. As an Android user, I want a hint about good lighting before I capture, so that my photos are usable for trends.
60. As an Android user, I want to import a photo from my gallery, marked "imported" and allowed to carry spots, so that I can add nights I captured with another app.
61. As a user, I want imported photos kept out of the redness chart, so that uncontrolled lighting doesn't distort the trend.
62. As an Android user, I want an optional fingerprint lock (off by default) in Cài đặt, so that others holding my phone can't see my photos.
63. As an Android user, I want app shortcuts (long-press icon → Chụp, Routine), so that I can jump straight in.
64. As an Android user, I want a notice when a newer APK is released, so that I don't stay on an old build.
65. As an Android user, I want to export all my photos and data, so that I own a full copy.
66. As an Android user, I want a one-hand mode that moves primary actions within thumb reach, so that I can capture while holding the phone in one hand.
67. As an Android user, I want a share card image of my progress, so that I can share it socially without exposing my face.
68. As an Android user, I want a Quick Settings tile for capture, so that I can start from the notification shade.
69. As an Android user, I want a home-screen widget with tonight's status and streaks, so that I see them without opening the app.

## Rank order

The fourth grill's 27-row table was not persisted; this table re-derives the list from the grill's Product decisions plus the canvas and replaces it. Score = visibility (C = cao 3, T = trung bình 2, Th = thấp 1) ÷ hours. Rows pulled above their score are marked ↑ with the reason. Hours are Claude's estimates, not measured. Dinh reviews this table; `/to-tickets` groups adjacent rows into ~8 tickets without reordering them.

| # | Item | Platform | Vis | Hours | Score | Cum. h | Stories |
|---|------|----------|-----|-------|-------|--------|---------|
| 1 | Copy rules: "Chỉ số mẩn đỏ", "Đăng nhập bằng Google" | both | C | 0.25 | 12 | 0.25 | 10, 11 |
| 2 | Phone-browser "dùng APK" banner on capture | web | T | 0.25 | 8 | 0.5 | 25 |
| 3 | Hero auto-loop, ScrollControls removed | web | C | 0.75 | 4 | 1.25 | 14, 15 |
| 4 | App icon + splash | Android, web favicon | C | 0.75 | 4 | 2 | 12 |
| 5 | SEO + Open Graph | web | T | 0.5 | 4 | 2.5 | 24 |
| 6 | Landing sections, header VI/EN, FAQ answers, APK QR | web | C | 1.5 | 2 | 4 | 16–21 |
| 7 | ↑ Web app shell + Hôm nay + Cài đặt (language, theme toggle slot, sign-out, delete), streaks | web + domain | C | 2.5 | 1.2 | 6.5 | 2–9, 43 |
| 8 | ↑ Web demo core (1 persona, 90 days, localStorage, banner, reset) | web + domain | C | 2.5 | 1.2 | 9 | 26–30 |
| 9 | ↑ Android tabs + Hôm nay + Cài đặt + fonts | Android | C | 2.5 | 1.2 | 11.5 | 1, 4–9, 13, 43 |
| — | **Expected 23:59 cut ≈ here** (≈11 h of build time after the fixed submission hour) | | | | | | |
| 10 | Empty / loading / error / 404 states | both | T | 1 | 2 | 12.5 | 45 |
| 11 | Micro-animation + haptics | both | T | 1 | 2 | 13.5 | 46 |
| 12 | Accessibility pass | both | T | 1 | 2 | 14.5 | 47 |
| 13 | Good-light capture hint | Android | Th | 0.5 | 2 | 15 | 59 |
| 14 | Demo: mark spots on sample photo | web | T | 1 | 2 | 16 | 32 |
| 15 | Demo: technical metrics table | web | T | 1 | 2 | 17 | 34 |
| 16 | App shortcuts | Android | Th | 0.5 | 2 | 17.5 | 63 |
| 17 | Dark mode (tokens + Hệ thống/Sáng/Tối) | both | T | 1.5 | 1.33 | 19 | 44 |
| 18 | Android "Xem thử" demo | Android | T | 1.5 | 1.33 | 20.5 | 31 |
| 19 | Project page vi+en + in-app Về dự án, demo embed + QR | both | T | 1.5 | 1.33 | 22 | 22, 23, 39 |
| 20 | Onboarding tour | both | T | 1.5 | 1.33 | 23.5 | 41 |
| 21 | Demo: webcam capture (desktop, not saved) | web | T | 1.5 | 1.33 | 25 | 33 |
| 22 | Clinical calm pass on remaining v1 screens | both | T | 2 | 1 | 27 | 48 |
| 23 | Photo timeline + per-zone detail | both | T | 2 | 1 | 29 | 42 |
| 24 | Feedback form | both + domain | Th | 1 | 1 | 30 | 51 |
| 25 | Gallery import (`source` column) | Android + domain | T | 2 | 1 | 32 | 60, 61 |
| 26 | PWA | web | Th | 1 | 1 | 33 | 53 |
| 27 | Demo: presentation mode | web | Th | 1 | 1 | 34 | 37 |
| 28 | Demo: pipeline replay | web | T | 2 | 1 | 36 | 35 |
| 29 | Changelog from git log + ADRs | web | Th | 1 | 1 | 37 | 38 |
| 30 | New-APK notice | Android | Th | 1 | 1 | 38 | 64 |
| 31 | One-hand mode | Android | Th | 1 | 1 | 39 | 66 |
| 32 | Demo: personas + links + side-by-side | web | Th | 1.5 | 0.67 | 40.5 | 36 |
| 33 | Knowledge library (~5 articles vi+en) | both | T | 3 | 0.67 | 43.5 | 50 |
| 34 | Biometric lock | Android | Th | 1.5 | 0.67 | 45 | 62 |
| 35 | Social share card | Android | Th | 1.5 | 0.67 | 46.5 | 67 |
| 36 | Illustrations | both | Th | 1.5 | 0.67 | 48 | 52 |
| 37 | Export PNG + PDF | both | Th | 2 | 0.5 | 50 | 49 |
| 38 | Full photo/data export | Android | Th | 2 | 0.5 | 52 | 65 |
| 39 | Reminders: settings, cron, web push, Android push (web part builds on row 26's service worker) | both + backend | T | 5 | 0.4 | 57 | 54–58 |
| 40 | Quick Settings tile | Android | Th | 3 | 0.33 | 60 | 68 |
| 41 | Home-screen widget | Android | Th | 4 | 0.25 | 64 | 69 |
| 42 | Screen recording 60–90 s (Playwright + emulator) | — | T | 1.5 | — | 65.5 | 40 |
| 43 | Testing: `qa-android-checklist.md`, Maestro flows, `mpbench` phone comparison, web routine check | — | — | 3 | — | 68.5 | — |

**Fixed final step, not ranked, starts by 22:30 whatever row is in progress (~1 h):** privacy page contact `hi@gmail.com` → a GitHub Issues link; release APK `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` (no `gradle.properties` edit); replace the EAS-signed GitHub release with it (different signer: uninstall the preview on Dinh's phone first); flip the source repo public; confirm the Vercel production deploy. `/to-tickets` makes this the last ticket.

## Implementation Decisions

**Order and delivery**
- Rows are worked strictly in the table's order; each row is deployed to Vercel (web) when done. The APK is built once, in the fixed final step, from whatever is merged.
- Rows 7 and 9 carry the navigation every later row mounts into; later rows assume them.

**Copy rules (UI rules, both platforms)**
- The metric is "Chỉ số mẩn đỏ" in every Vietnamese string; "Độ đỏ" and "Chỉ số đỏ" are removed from both the web messages and the mobile locale files, disclaimers included.
- The Google button reads "Đăng nhập bằng Google"; header/nav links keep the short "Đăng nhập".

**Navigation**
- Web: the signed-in area keeps its existing path prefix and gate; a shared layout renders a sidebar with the four destinations on desktop widths and bottom tabs at narrow widths. Hôm nay replaces the current link-button home. Routine stays reachable but is no longer a top-level destination; its checklist renders inside Hôm nay, and a "Sửa routine" link on that card opens the existing add/rename/delete/reorder screen (same on Android).
- Cài đặt renders a row only once its feature has shipped (reminders, fingerprint lock, data export, feedback, project page land in later rows); the canvas's full list is the end state, not row 9's. No dead rows.
- Android: the signed-in route group becomes a tab navigator with the four tabs; spot marking and other detail screens stay stacked above the tabs. Sign-out and delete-account move from the home screen to Cài đặt with their current behaviour unchanged (Edge Function `delete-account`).
- Newsreader + Public Sans are loaded on Android through the already-installed font module.

**Streaks (new domain logic, `packages/domain`)**
- A streak is the count of consecutive local days ending today — or ending yesterday when today has no record yet, so the streak doesn't read 0 before tonight's capture — on which the record exists.
- Capture streak counts days with at least one camera-sourced Photo; routine streak counts nights with a RoutineEntry that has at least one completed label.
- One pure function takes the set of local days and today's local day and returns the count; both apps derive the day sets from data they already load. It reuses the existing local-day helper in the trend module.
- New glossary terms (Streak, Demo persona, Reminder, imported Photo) are added to `CONTEXT.md` when their row is implemented.

**Demo without sign-in**
- The demo lives on a public route outside the signed-in gate and renders the same screen components as the signed-in app.
- Seam: each screen receives its data functions from its route. The signed-in route passes the existing Supabase-backed lib functions; the demo route passes demo functions with the same signatures. No provider/context layer or repository abstraction is added.
- Demo data comes from a deterministic, seeded generator in `packages/domain` (persona + day count + today → Photos, ZoneReadings, Spots, RoutineItems, RoutineEntries in the same shapes the apps already load). Both apps use it; the web build may freeze its output to static JSON. 90 days per persona.
- Demo writes (routine ticks, spot marks) go to local storage only (web: browser storage; Android: AsyncStorage) and never to Supabase. Reset clears them. The banner shows the "chỉ lưu trên trình duyệt này" note, the persona, Đặt lại and "Đăng nhập bằng Google".
- Demo photos are a small set of sample face images with a clear license (generated or openly licensed), never Dinh's own photos, because the repo goes public.
- Demo webcam capture runs the real web capture pipeline and shows readings, but has no save path. It is desktop-only; phone browsers get the same "dùng APK" banner as the real app.

**Hero**
- The scroll-driven controls are removed; a clock drives the existing three-scene timeline on a loop. Reduced motion keeps the current static face. Still a single instanced draw call, lazy-loaded, not server-rendered.

**Landing and project page**
- New landing sections follow the canvas: Cách hoạt động (4 steps), AI trên thiết bị (4-step pipeline + link to project page), Web hay Android? table, APK QR, FAQ. FAQ answers 2–5 are written during the row (canvas left them blank). The QR encodes the stable `releases/latest/download/skinsense.apk` URL, rendered at build time — no runtime QR dependency.
- Header language switch writes the existing `locale` cookie that the web i18n request config already reads.
- The project page is a public route, vi + en, static content.

**Dark mode**
- Canvas has light tokens only; dark tokens are derived from them (same hues, inverted lightness) during row 17. Web: class-based theme on the root element, default follows the system, choice remembered. Android: NativeWind's colour-scheme support with the same three-way choice, stored locally.

**Schema changes (ADR 0002: defined in `packages/domain`'s schema, migrations generated with drizzle-kit, never hand-written)**
- `photos.source`: text enum `camera` | `import`, not null, default `camera`. Imported photos store no ZoneReadings (lighting and white balance unknown), so every redness chart skips them without a filter; they still carry Spots, appear on the timeline, and do not count toward the capture streak.
- `feedback`: owner columns + message (non-empty, ≤ 2000 chars) + platform + app version + created_at. RLS allows the owner to insert and read their own rows only.
- `reminders`: one row per user (unique user_id): enabled, local time as minutes after midnight (multiple of 5), IANA timezone, last sent local date.
- `push_subscriptions`: owner columns + kind (`web` | `expo`) + endpoint/token payload, unique per (user, token). Owner RLS.
- Applying each migration to production goes through Dinh's per-command approval (auto mode blocks production DB writes); tickets budget that stop.

**Reminders**
- A `pg_cron` job every 5 minutes calls a new Edge Function through `pg_net`. Checked 2026-09-14 (partly verified): Supabase's scheduling docs show this pattern and no plan-level restriction on either extension was found on Free, but no documented cron-job or `pg_net` cap was found either; ~8,640 invocations/month is far inside Free's 500,000. A `pg_net` call from cron has a reported 5 s timeout, so the function answers fast and does its sending without holding the call (no per-user sequential waits).
- Due check is a pure `packages/domain` function: given the reminder's minutes, timezone, last sent date and `now`, return whether it is due in the current 5-minute slot and the local date to mark as sent. The function marks `last sent` before sending, so a slow or repeated run never sends twice in one night.
- Web push: VAPID keys as Supabase secrets; the service worker from row 26 receives the push. `npm:web-push` is likely broken on the Deno runtime (reported `crypto.createECDH is not a function`), so the row starts with a ≤ 30 min spike of a Deno-native Web Push library (candidates `jsr:@negrel/webpush`, PushForge — unverified); if none works in the spike, web push is dropped and only Android reminders ship.
- Android push: `expo-notifications` + Expo Push Service. Verified requirements: a Firebase project, `google-services.json` in the app, an FCM V1 service-account key uploaded to EAS credentials, and the EAS `projectId` (already present in the app config) for `getExpoPushTokenAsync`. Locally built APKs need the same. **Dinh does the Firebase project + key upload (~15 min) before this row starts.**
- Web push depends on the browser allowing notifications; the settings row shows the permission state.

**Android extras**
- Biometric lock: an optional toggle in Cài đặt, off by default; when on, the app asks on open.
- New-APK notice compares the app version against the latest GitHub Release of `dinh144/skinsense-releases` on launch.
- Gallery import runs the same landmark detection spot marking already runs on stored photos, and saves with `source = import`.

**Feedback**
- Signed-in users only. The web and Android forms insert directly via supabase-js under RLS; no Edge Function.

**Knowledge library**
- ~5 static articles per language, each with at least one AAD or DermNet citation and the "not a medical diagnosis" disclaimer; no treatment or product advice.

## Testing Decisions

A good test asserts on what a user or caller can observe — rendered text and state, persisted rows, returned values — never on implementation details (which hook fired, which MediaPipe method ran). Tests are written last in the build order except for new `packages/domain` logic, which stays test-first (AGENTS.md, ADR 0003's Stop-hook gate).

- **`packages/domain` (Vitest, test-first):** the streak function (today vs yesterday end, gaps, empty set, timezone-local days), the demo generator (deterministic for a seed, 90 days, shapes match the loaded row types, readings within realistic ranges, imported photos without readings if the persona has any), the reminder due check (slot boundaries, timezone offset, already sent tonight, disabled). Prior art: `trend.test.ts`, `routine.test.ts`, `capture-quality.test.ts`.
- **`apps/web` E2E (Playwright, run against a deployment via `E2E_BASE_URL`):** the demo route is the main new flow — no sign-in, no Supabase: open demo → Hôm nay shows streaks and zone directions → tick routine → reload keeps it → reset clears it → Xu hướng renders. Landing: sections present, language switch flips copy, hero canvas mounts. The demo's generated data is the test data. Existing specs (`capture.spec.ts`, `delete-account.spec.ts`, with the fake-camera `.y4m` fixture and the test account) keep covering the signed-in path.
- **`apps/web` components (Vitest + Testing Library):** Hôm nay and Cài đặt render from the demo data functions; copy-rule regressions are caught by asserting "Chỉ số mẩn đỏ" appears. Prior art: `trends.test.tsx`, `routine-checklist.test.tsx`.
- **`apps/mobile` (jest-expo + RNTL + `expo-router/testing-library`):** tab layout renders four tabs; Hôm nay and Cài đặt render from demo data; Xem thử enters the demo from the sign-in screen. Prior art: `trends.test.tsx`, `capture.test.tsx`, `routine-checklist.test.tsx`.
- **Maestro (emulator):** extend `apps/mobile/flows/` with a tab-navigation flow and a Xem thử flow; existing `capture`, `mark-spots`, `routine-checklist`, `trends` flows update to start from the tabs.
- **Backend:** real Supabase with the dedicated test account, as in v1. RLS for `feedback`, `reminders`, `push_subscriptions` is checked by an insert/read as a second account. The reminder Edge Function is checked once by hand against a test subscription (no automated push test).
- **Manual:** `qa-android-checklist.md` on the real phone and the `mpbench` phone comparison are row 43 — last, and likely after 23:59.

## Out of Scope

- iPhone and Safari support (dropped 2026-09-14).
- Ticket 19 (uptime-check workflow), dropped in the fourth grill.
- Clinical validation of the redness index; any diagnosis, severity score or treatment advice (knowledge library included).
- Automated spot detection.
- Offline mode.
- CI/CD.
- Cross-account features beyond demo personas (no sharing of real accounts' data).
- Changing the redness index, zone map or capture pipeline.

## Further Notes

- Realistic state at 23:59 (grill estimate, accepted): about rows 1–9 plus the fixed final step ship; the rest stays in this spec and in tickets. Total estimate ≈ 68 h against ≈ 12 h of build time.
- Real-device coverage of the submitted APK may be only the 15-minute smoke test of the EAS preview APK from the grill (camera and tflite on hardware; does not cover the final build's Google sign-in).
- Defaults applied from the grill: biometric lock optional and off; demo webcam capture desktop-only. Defaults added here, open to Dinh's objection in review: demo photos are licensed sample images, not Dinh's; imported photos store no ZoneReadings; streak ends yesterday when today has no record; routine is folded into Hôm nay rather than a fifth destination.
- Icon + splash (row 4): Claude builds the SVG monogram; Dinh runs the brandkit prompt in Gemini; the better one ships.
- Canvas placeholders to fill during their rows: hero frame (row 3), APK QR (row 6), Google name/email in Cài đặt (row 9), FAQ answers 2–5 (row 6).
- ADRs 0001–0004 still hold; nothing here changes the domain input boundary, schema ownership, redness acceptance bar or routine snapshot rule.

## Backlog

Further "các lựa chọn khác" ideas land here without another grill round (grill rule).

- (empty)
