# skinsense-v2: redesign build (C3 · Night photo, web + Android)

Status: ready-for-agent
Decisions: [grill-2026-09-14-design.md](../skinsense-redesign/grill-2026-09-14-design.md) (every section from "Grill after the ~21:00 plan" down, including the canvas 2 notes of 15/09), [DESIGN.md](../../DESIGN.md), ADR 0002 and ADR 0004.
Design source: canvas 2 "SkinSense App Core" https://claude.ai/code/artifact/804de5e7-f8a3-4a3a-97fa-5bf91de0821b (5 pages, 196 artboards, light + dark). Landing hero direction: canvas 1 rows C3.
Sequencing: blocked by [portfolio-release-gates ticket 01 (CI)](../portfolio-release-gates/issues/01-ci-github-actions.md). The release gates 03–08 of that spec run after this spec ships.

## Problem Statement

Dinh picked the C3 · Night photo direction, wrote DESIGN.md and the token file, and drew every screen of the product on canvas 2. None of it exists in the apps yet. Today the web app and the Android app still show the pre-redesign look (clinical-calm polish, Cormorant-era prototypes only on a throwaway branch), so:

- The portfolio cannot be called done: "redesign shipped on web and Android" is the first of the three done criteria, and the other efforts (AIF, SAA, NeetCode, Blender) stay paused until it is met.
- Ten features Dinh added to done (photo history, onboarding, choosing two dates to compare, photo notes and tags, an evening routine reminder, data export, a before/after share image, about and licenses, a feedback form, a biometric lock) have no implementation at all.
- The states a real user runs into (no photo yet, loading, network errors, camera denied, low light, no face found, not enough photos, deleting an account) are mostly bare text or `window.confirm`.
- The web app is designed for desktop only, while the Lighthouse done-audit runs on the mobile profile for every page, signed-in pages included.
- There is no custom icon set, splash, favicon set or OG image drawn from the logo mark.
- 61 shadcn components are installed but the app uses one, and the web theme still carries the old oklch palette and a 12px radius instead of the token file.

## Solution

Rebuild every screen on both apps from canvas 2, one screen at a time, web and Android together, on the shared token file, so the app a visitor opens looks and moves like the canvas:

- A token foundation first: the web theme and the NativeWind theme both come from the token package (colour roles, radius control/card/pill, Noto Serif Display 300/400 + Manrope 300–600), and the shadcn / React Native Reusables components are restyled once through those tokens and then reused everywhere.
- The app core (Hôm nay, Chụp, Đánh dấu nốt mụn, Xu hướng, Routine) rebuilt with every state drawn on canvas pages "App core", "Tài khoản & trạng thái" and "Hoàn thiện".
- Account and trust surfaces rebuilt: Android sign-in with "Xem thử", Cài đặt in its final layout, a custom delete-account dialog with deleting and error states, the "Xem thử" banner on the demo.
- The public web pages rebuilt: the full landing with its scroll stage and particle-face section, an English `/case-study` page, `/privacy` and the 404 page.
- The ten new features built end to end, including the schema they need.
- The web app made responsive down to 390px, with the phone-browser capture screen pointing to the Android app.
- Motion added exactly as DESIGN.md specifies, off under reduced motion.
- Brand assets exported from the logo mark and wired into both apps.

## User Stories

**Foundation and look**
1. As a user, I want both apps to use the same colours, type and corner shapes, so that the product feels like one thing on my phone and on my laptop.
2. As a user who prefers dark mode, I want the night look by default in dark and a designed light theme in light, so that neither theme feels like an inverted afterthought.
3. As a Vietnamese reader, I want the display face to place diacritics correctly (ô, ồ, ổ), so that headings read naturally.
4. As a user with low vision, I want every text pair to meet WCAG AA in both themes, so that I can read every screen.
5. As a user on a slow phone, I want the page readable before any motion code loads, so that animation never delays content.
6. As a user who turned on reduced motion, I want large motion off and only fades kept, so that the app does not make me uncomfortable.
7. As a user, I want one filled action per screen and quiet secondary actions, so that I always know the main thing to do next.
8. As a touch user, I want every tap target at least 44px, so that I do not mis-tap small icons.
9. As a colour-blind user, I want trends to pair colour with an arrow and a word, so that "improving" never depends on seeing green.

**Hôm nay**
10. As a user opening the app at night, I want Hôm nay to show a night photo band with the date and a large title, so that the app feels like my diary, not a dashboard.
11. As a user without tonight's photo, I want a card that says so, shows my last capture and spot count, and offers "Chụp ảnh tối nay", so that I can start in one tap.
12. As a user, I want my capture streak and routine streak side by side, so that I see both habits at a glance.
13. As a user, I want tonight's routine checklist on Hôm nay with a hairline progress line, so that I can tick RoutineItems without leaving the screen.
14. As a user, I want the last 7 days of redness per zone with a direction and a word, so that I notice change without opening Xu hướng.
15. As a brand-new user, I want Hôm nay to say I have no photos yet with streaks at 0 and an unticked routine, so that the empty screen tells me what to do.
16. As a user on a slow connection, I want skeleton blocks the size of the real cards while data loads, so that nothing jumps when it arrives.
17. As a user opening the Android app, I want the cards to enter with a short staggered fade and the logo mark to draw itself once per session, so that opening the diary feels calm and deliberate.

**Chụp**
18. As a user capturing on Android, I want a 3:4 viewfinder with the guide ellipse, a light badge and hints under it, so that my photo matches last night's framing.
19. As a user in poor light, I want the badge to say "Thiếu sáng" with an icon, so that I fix the light before I shoot.
20. As a user, I want a shutter with a ring and label, disabled until the camera is ready, so that I never shoot a black frame.
21. As a user whose still has quality issues, I want the issues listed with "Chụp lại" and "Vẫn lưu", so that I choose knowingly.
22. As a user whose save failed, I want an inline error and the same still kept, so that I can retry without reshooting.
23. As a user who just saved, I want the time, a per-zone table of redness and unevenness, the disclaimer, "Chụp ảnh khác", "Đánh dấu nốt mụn" and "Xong", so that I see the result and choose the next step.
24. As a user who denied the camera on Android, I want a clear card explaining photos stay private and a button to allow the camera, so that I can recover.
25. As a desktop web user, I want a 4:3 webcam viewfinder beside the hint and shutter, so that the layout fits a laptop screen.
26. As a web user whose browser blocked the webcam, I want the camera error and "Thử lại", so that I know how to recover.
27. As a user on a phone browser, I want Chụp to explain phone browsers cannot capture and offer the APK, so that I am not stuck on a broken camera.

**Đánh dấu nốt mụn**
28. As a user, I want to tap spots on my photo and see a 44px marker with a halo, so that marking is precise and easy.
29. As a user, I want a count line and per-zone chips, so that I can check what I marked before saving.
30. As a user who tapped outside the face zones, I want the status line to tell me where to tap, so that I understand why nothing was added.
31. As a user whose save failed, I want an error above the save button, so that I can retry.
32. As a user whose photo has no detectable face, I want a message over the photo instead of a dead canvas, so that I know marking cannot work on it.

**Xu hướng**
33. As a user, I want a 7/30-day toggle and zone chips, so that I choose what to inspect.
34. As a user, I want the redness chart for the chosen zone with the latest value and direction, so that I see the trend precisely.
35. As a user, I want spot count and routine completion cards, so that I relate outcomes to habits.
36. As a user, I want a before/after slider for the range, so that I can see visual change.
37. As a user with fewer than two photos in the range, I want the chart and comparison to say what is missing, so that empty space is explained.
38. As a user whose data failed to load, I want an error with "Thử lại", so that I can recover without restarting.

**Routine**
39. As a user, I want to rename, move and delete RoutineItems from a menu on each row, so that my checklist matches my real routine.
40. As a user renaming a RoutineItem, I want the row to become an inline field, so that editing happens in place.
41. As a user adding a RoutineItem, I want a field at the end of the list, so that I type the new item where it will appear.
42. As a user who types a duplicate label, I want an inline error, so that past nights keep their meaning (labels are the snapshot key).
43. As a user ticking a RoutineItem on Android, I want the circle to press in, spring back, vibrate and move the progress line, so that ticking feels physical.

**Account, sign-in and settings**
44. As a new Android visitor, I want a sign-in screen over a night photo with Google sign-in, "Xem thử" and the privacy link, so that I can try the app before signing in.
45. As a visitor whose Google sign-in failed, I want the error message on the sign-in screen, so that I know to retry.
46. As a user, I want Cài đặt to show my Google account, language, reminder, biometric lock, photo history, export, feedback, about and privacy, so that everything I can control lives in one place.
47. As a web user, I want Cài đặt without Android-only rows, so that I never see settings that do nothing on the web.
48. As a user deleting my account, I want a designed confirmation dialog that states what is erased, so that I do not delete by accident.
49. As a user who confirmed deletion, I want the button to show progress and cancel disabled, so that I do not double-submit.
50. As a user whose deletion failed, I want the error in the dialog, so that I know nothing was deleted.
51. As a user, I want to sign out from Cài đặt, so that I can leave a shared device.

**Xem thử**
52. As a visitor in Xem thử, I want a "Dữ liệu mẫu" banner with the persona, a reset and Google sign-in on every demo screen, so that I never mistake sample data for mine.
53. As a visitor, I want changes in Xem thử to stay in this browser or phone, so that trying things is safe.

**Web at phone width**
54. As a user opening the web app on a phone, I want every signed-in page laid out for 390px with the bottom tab bar, so that the web app is usable on a phone.
55. As a user on a phone browser, I want Cài đặt to hide Android-only rows, so that the web settings stay honest.

**Landing, case study and public pages**
56. As a first-time visitor, I want the landing hero to state the product in one line over a night photo with Google sign-in and "Xem thử", so that I understand and can act immediately.
57. As a visitor scrolling, I want the real Today UI in a phone with floating data cards that count up and drift across three scenes, so that I see what the diary shows.
58. As a visitor, I want a "Cách hoạt động" section where points form a face and split into five zones beside the four steps, so that the method is visible.
59. As a visitor, I want the on-device AI section, the web vs Android table with a QR code for the APK, the FAQ and the trust section, so that my doubts are answered.
60. As a visitor on a phone, I want the landing laid out for 390px, so that it reads well where most visitors arrive.
61. As a recruiter, I want an English `/case-study` page telling the problem, product, measurement, design, engineering decisions, results and next steps, so that I can judge the work.
62. As a Vietnamese-locale visitor, I want `/case-study` to show the same English page, so that there is one source of truth.
63. As a visitor, I want `/privacy` and the 404 page in the same look, so that the site feels finished at its edges.

**Onboarding**
64. As a new Android user, I want three onboarding steps after my first sign-in (what the diary is, how to shoot consistently, privacy and permissions), so that my first capture is a good one.
65. As a new Android user, I want to grant the camera and optionally notifications from onboarding, so that permissions are asked with context.
66. As a new web user, I want one onboarding screen with the three points, so that the web start is short.
67. As a user, I want to skip onboarding and never see it again on this device, so that it does not nag.

**Photo history and photo detail**
68. As a user, I want all my Photos in a month-grouped grid with date and spot count on each tile, so that I can browse my diary.
69. As a user, I want to filter the grid by Tag or by having a Note, so that I find related nights.
70. As a user, I want a Photo detail screen with the photo, spot count, a zone reading, the Note and Tags, so that I see one night in full.
71. As a user, I want to write a Note on a Photo, so that I remember what was different that night.
72. As a user, I want to add and remove Tags on a Photo, so that I can group nights by cause.
73. As a user, I want to open spot marking and sharing from Photo detail, so that I act on the photo I am looking at.
74. As a user, I want to delete a Photo after a confirmation that lists what goes with it, so that I can remove a bad capture safely.

**Choosing two dates to compare**
75. As a user, I want to pick the "before" and "after" dates on a month calendar that marks the days with photos, so that I compare the nights I care about.
76. As a user, I want the comparison to default to the first and last photo of the range, so that it still works without picking.
77. As a phone user, I want the date picker as a bottom sheet, and as a desktop user as a dialog, so that it fits each screen.

**Share before/after**
78. As a user, I want a generated before/after image with dates and the SkinSense wordmark, so that I can share progress.
79. As a user, I want the eyes blurred by default and toggles for dates and the redness value, so that I control what I reveal.
80. As an Android user, I want to share through the system share sheet, so that I use my usual apps.
81. As a web user, I want to download the image or copy it, so that I can post it anywhere.

**Evening reminder (Android)**
82. As an Android user, I want a nightly reminder at a time and on days I choose, so that I do not forget my routine.
83. As a user, I want a preview of the notification, so that I know what will appear.
84. As a user who turned notifications off for the app, I want the reminder screen to say so and open the system settings, so that I can fix it.
85. As a privacy-minded user, I want the reminder scheduled on the phone without a server, so that no schedule leaves my device.

**Export**
86. As a user, I want to export my photos, zone readings, spots, routine history, Notes and Tags into one .zip, so that my data is mine.
87. As a user, I want to see the photo count and an estimated size before exporting, so that I know what I am starting.
88. As a user, I want progress while the file is built and a way to cancel, so that a long export is not a black box.
89. As a user whose export failed, I want a clear error and a retry, so that I can try again after freeing space.

**Feedback**
90. As a signed-in user, I want to send a bug report, an idea or other feedback with an optional app and device note, so that I can help improve the app.
91. As a user, I want to be told my photos and skin data are never attached, so that I trust the form.
92. As a user, I want a confirmation after sending and an inline error when sending fails, so that I know whether it arrived.
93. As Dinh, I want feedback stored where only its author can read it back and I can read it in the dashboard, so that it is private and reachable.

**About and licenses (Android)**
94. As a user, I want an about screen with the version, privacy link and source link, so that I know what I am running.
95. As a user, I want the open-source licenses listed, so that the app credits what it is built on.

**Biometric lock (Android)**
96. As a user sharing a phone, I want to lock SkinSense with my fingerprint, so that nobody opens my photos.
97. As a locked user, I want a lock screen with the photo blurred and a fallback to the screen lock, so that I can always get in.
98. As a user whose phone has no fingerprint enrolled, I want a dialog that sends me to the security settings, so that the toggle does not silently fail.

**Brand**
99. As an Android user, I want an adaptive icon and a themed monochrome icon from the logo mark that read at 48dp, so that the app is recognisable on my home screen.
100. As a user launching the app, I want a static splash with the mark in light and dark, so that launch matches the look.
101. As a web user, I want a favicon readable at 16px, so that the tab is recognisable.
102. As someone sharing a link, I want an OG image with the headline over the night photo, so that previews look intentional.

## Implementation Decisions

**Source of truth and order**
- Canvas 2 is the visual source; DESIGN.md holds the rules and motion values; the token package holds every value. Where a canvas artboard and DESIGN.md disagree, DESIGN.md wins and the ticket notes the difference.
- One ticket = one screen on both apps (grill decision), each rebuilt from scratch; nothing from the `proto/redesign` branch is merged.
- Order: token and component foundation → app shell (web sidebar + phone tab bar, Android tab bar) → app core screens and their states → account and Xem thử → web public pages → new features → brand assets.
- The redesign lands on `main` screen by screen (Dinh's box, 15/09): each ticket commits to `main` when its screen passes its tests on both apps, so production shows old and new screens side by side while the build runs. Accepted because production has no real users (Play shelved, grill 14/09 ~19:30); DESIGN.md's "never mixes two looks" is read as the finished state, each screen switching over when it is rebuilt.

**Tokens, type, components**
- The web theme is replaced by the token package's generated web CSS (shadcn variable names, hex, `:root` light and `.dark`), which removes the oklch palette and the 12px radius. Radius tokens map to control 4, card 18, pill 999.
- Android imports the generated NativeWind CSS (NativeWind 4 + Tailwind 3 stay, per grill).
- Fonts: Noto Serif Display 300/400 and Manrope 300–600 on both apps (Vietnamese subset on web; the Expo Google Fonts package on Android). The web preloads only the display weights used above the fold.
- shadcn components are the web building blocks, restyled once through tokens: AlertDialog (delete account, delete photo), Dialog + Calendar (choose dates, desktop), Drawer + Calendar (choose dates, phone width), Chart (Xu hướng), Sonner (feedback sent), Skeleton (loading), Empty (not enough photos, no photos), Spinner (deleting, exporting), Switch (reminder, share options), ToggleGroup (7/30 days, language, feedback kind), Accordion (FAQ), Badge (tags), Checkbox (export contents), Field + Textarea (note, feedback), Progress (export), Alert (capture quality), DropdownMenu (routine row menu), Sidebar (web nav), Item (settings rows).
- The single Base UI component (combobox) is removed so the web uses one primitive library (Radix); components the canvas never uses may stay installed but must not be imported.
- React Native Reusables provides the Android equivalents; the missing ones (Switch, Dialog/AlertDialog, ToggleGroup, Textarea, Skeleton, Badge, Tabs) are added through its CLI.

**Motion**
- Values come only from DESIGN.md: Android cards FadeInDown 460ms stagger 80ms, zone bars 700ms ease-out cubic with 420ms + 80ms per row delay, routine tick scale 0.78 in 90ms then spring (damping 11, stiffness 320) with medium/light haptics and the progress line in 360ms, the mark drawn on first open per session; web landing 400svh track with a CSS-sticky 100svh stage and three scrubbed scenes (GSAP + ScrollTrigger + Lenis, no pin), the mark drawn once per load.
- Motion layout applies from first paint through a scripting + reduced-motion media query, never a post-hydration class flip; motion code is a separate client chunk loaded after hydration; the particle face (three.js) loads only when its section nears the viewport. Any effect that keeps a page under Lighthouse 90 is cut (grill: Lighthouse wins).
- The FadeInDown offset distance is not in DESIGN.md; the ticket that builds it records the value in DESIGN.md.

**Schema (ADR 0002: domain package owns the schema, drizzle-kit generates migrations, owner-only RLS)**
- `photos` gains a nullable Note column (plain text, trimmed, at most 500 characters).
- New `photo_tags` table: owner columns, Photo reference with cascade delete, label; unique per Photo and label; owner-only policy. Tag labels are trimmed, 1–24 characters, case-insensitively unique per Photo.
- New `feedback` table (supersedes polish row 24 with a kind column): owner columns, kind (bug | idea | other), message non-empty and at most 2000 characters, platform (web | android), app version and device/browser note both nullable (filled only when the user opts in), created_at; owner insert and read only; written directly through supabase-js, no Edge Function.
- Photo deletion removes the storage object and the Photo row; Spots, ZoneReadings and Tags go with it through cascades.
- No reminder, onboarding or lock table: those settings stay on the device.
- Every production migration and every production test-account write stops for Dinh's per-command approval (memory rule).
- CONTEXT.md gains **Note**, **Tag**, **Reminder** and **Export** entries when the first ticket that introduces each term lands.

**Domain package additions (pure, test-first)**
- Tag and Note validation (trim, length, per-Photo uniqueness).
- Comparison pair selection: the days in a range that have Photos, the latest Photo of a chosen day, and the default pair (first and last Photo in the range) when nothing is chosen.
- Export shaping: rows for zone readings, spots, routine entries (label snapshots, ADR 0004) and Notes/Tags, with a stable column order, ISO local dates and CSV escaping; file naming inside the zip.
- Reminder schedule: from a time and a set of weekdays, the next trigger instants in the device timezone.
- Feedback message validation.

**Features**
- Photo history reads Photos with spot counts and Tags for the signed-in user, grouped by local month; filters by one Tag or by "has a Note".
- Choosing two dates replaces the automatic first/last pick only when the user picks; the picker only enables days that have Photos and marks today.
- Share image: generated on the device (canvas on web, a Skia snapshot on Android) from the two chosen Photos. Landmarks are not stored (CONTEXT.md, ZoneReading), so eye blur re-runs face landmark detection on both photos at share time, the same way spot marking does. Defaults: dates on, eyes blurred on, redness value off. This supersedes polish row 35 ("share card without the face").
- Reminder (Android only): local notifications through expo-notifications with the POST_NOTIFICATIONS permission, rescheduled when the time or days change and cancelled when turned off; requires a dev-build rebuild. This supersedes polish row 39 (server-side push and web push).
- Export: built on the device into one zip holding original JPEGs and the CSV files; Android saves through the system file picker/Downloads, web triggers a browser download; progress counts photos and export can be cancelled. The zip library is chosen at implementation time and must add photos one at a time rather than holding every photo in memory.
- Onboarding: shown once per device after the first sign-in (a local flag), three steps on Android with camera and optional notification permission, one screen on web.
- About (Android): version from the app config (1.0.0 for the first release after the redesign), privacy and source links, and a license list of the app's direct runtime dependencies and bundled fonts, kept as a checked-in list that is updated when those dependencies change.
- Biometric lock (Android): expo-local-authentication with device-credential fallback, off by default, asked on cold start and when returning from background; the app content behind the lock stays blurred; "not enrolled" shows a dialog linking to security settings.
- Xem thử keeps reusing the real app screens with the banner (persona, reset, Google sign-in); on the web its route and data stay as today. Android gets Xem thử for the first time (decided in `/to-tickets` 15/09): the same screens fed by the domain demo generator, kept on the phone.
- Web at phone width: every `/app` page follows the 390 artboards; capture on a phone browser shows the existing APK banner copy instead of the camera.
- `/case-study`: English only, content as approved on the canvas (15/09); Role and Timeline brackets are filled by Dinh; the two unmeasured results stay bracketed until the release-gates Lighthouse audit and real-phone QA produce numbers.

**Brand assets**
- From the logo mark with the app-icon stroke at 2.6 (thinner strokes vanished at 48px when rendered): Android adaptive foreground (432, mark inside the 264 safe zone) with a surface-colour background, monochrome themed icon, 1024 store/manifest icon, static splash in light and dark, web SVG favicon plus 48/32/16 PNG (the 16px variant is a single thick ring), manifest icons 512/192, OG image 1200×630.

**Copy**
- Existing strings keep their `vi.json`/`en.json` wording. New strings (onboarding, permissions, lock, export, feedback, reminder, share, empty and error states) use the canvas wording Dinh approved on 15/09 and get English translations for the en locale.

## Testing Decisions

- A good test drives the public surface the user or caller touches (rendered text, roles, taps, the values a domain function returns, the rows a query writes) and never asserts internal state, CSS classes, component structure or call order.
- **Seam 1: domain package (Vitest).** Test-first for every new domain function: Tag/Note validation, comparison pair selection (photo days, latest photo of a day, default pair, empty range), export shaping (column order, escaping, label snapshots, local dates), reminder schedule (weekday sets, DST-free timezone offsets, times already past today), feedback validation. Prior art: the existing domain tests for streaks, trends, routine and schema.
- **Seam 2: each screen, with its data module mocked.** Web: Vitest + React Testing Library inside the next-intl provider, mocking the screen's data module (prior art: the trends, capture, mark-spots and routine-checklist tests). Android: jest-expo + RNTL (+ Expo Router testing library for navigation), mocking the same way (prior art: the today, trends, capture, mark-spots, routine-checklist and settings tests). Every state on the canvas gets a test: loading, error with retry, empty, success, and each feature's specific states (low light, save error, no face, outside zone, not enough photos, rename/add RoutineItem, deleting and delete error, export progress and error, feedback sent and error, notifications denied, fingerprint not enrolled).
- **Seam 3: new end-to-end flows.** Web Playwright with the existing test-account cookie helper (prior art: the capture and delete-account specs): onboarding once, photo history filter and Photo detail note/tag/delete, choosing two dates, export download contains the expected files, feedback submit, share image download, Xem thử banner reset, `/case-study` and every `/app` page at a 390px viewport. Android Maestro on the `pixel_api36` emulator (prior art: the capture, mark-spots, routine-checklist and trends flows): onboarding, history and detail, choosing dates, share sheet opens, export saves a file, feedback submit, reminder toggle with permission, biometric lock with the emulator's fingerprint. Flows that write to production Supabase run only after Dinh approves the command.
- **Schema checks.** Each migration is checked against RLS from a second account (owner can read and write, the other account gets nothing), as polish row 24 required.
- Visual fidelity to the canvas and the performance/contrast gates are not test seams here: each screen ticket ends with light and dark screenshots on both apps compared against its artboards, and the release-gates spec owns Lighthouse and real-phone QA.

## Out of Scope

- The backlog kept outside canvas 2: Android gallery import, web PWA, new-APK notice, shareable demo personas, knowledge library, structured routine products (AM/PM, ingredients), terms-of-service page, web account-deletion request page, a real contact email.
- Polish long-tail rows not carried into canvas 2: demo presentation mode, pipeline replay, changelog page, one-hand mode, illustrations, progress report PNG/PDF, Quick Settings tile, home-screen widget, server-side and web push reminders.
- Google Play, iPhone and Safari.
- Shooting the real night photography (Dinh's task; the labelled gradient placeholder from DESIGN.md stays until photos exist).
- CI, the release keystore, the Lighthouse audit and real-phone QA (portfolio-release-gates spec).
- Colouring the particle face by real a* values from the demo photo: suggested in the 15/09 scoring, not decided.

## Further Notes

- Seams were confirmed by Dinh on 15/09 in the `/to-spec` box: "Domain + từng màn + e2e mới" (the heaviest option, with new Playwright and Maestro flows per feature).
- Real photos are the one input no ticket can produce. Each photo-backed screen keeps the labelled placeholder until Dinh supplies photos, then swaps in a downsampled image without layout changes.
- The scroll-stage canvas artboard shows scene 2 only; scenes 1 and 3 follow the DESIGN.md storyboard and the motion sheet on canvas page "Hoàn thiện".
- The canvas sources (`design-2/src`, `derive.py`, `build.mjs`) and the rendered brand PNGs live in the redesign scratch folder; a ticket that changes a screen's design updates the canvas through them rather than drifting from it.
- Estimated scale from the grill: ~70–80 designed artboards became 196 with states, brand and motion; expect well over the ~5 sessions first estimated.
