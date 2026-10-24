# 06: Android tabs + Hôm nay + Cài đặt + fonts

**What to build:** a signed-in Android user gets bottom tabs Hôm nay / Chụp / Xu hướng / Cài đặt. Hôm nay mirrors the web dashboard (tonight's photo state + CTA, last photo and spots, per-zone Chỉ số mẩn đỏ with 7-day direction, both streaks, tonight's routine with "Sửa routine"). Cài đặt holds language, Google name/email, sign-out and account deletion. Headings use Newsreader and body text Public Sans. Spec row 9, stories 1, 4–9, 13, 43. Follows the canvas's MobileToday / MobileSettings artboards. Estimate 2.5 h.

**Blocked by:** 04

**Status:** done

- [x] The signed-in route group is a tab navigator with the four tabs; spot marking and other detail screens stack above the tabs
- [x] Hôm nay uses the domain streak function from ticket 04 with day sets from data the app already loads
- [x] Routine checklist renders inside Hôm nay; the existing routine edit screen stays reachable via "Sửa routine"
- [x] Cài đặt: language switch (remembered), sign-out, delete-account (Edge Function `delete-account`, behaviour unchanged); no dead rows; both removed from the home screen
- [x] Newsreader + Public Sans loaded through the already-installed font module
- [x] ≥44 px hit areas as on the canvas
- [x] Verified on the emulator (`expo run:android`) with a screenshot per tab
- [x] `bun run typecheck` and existing mobile tests green

## Now

- Fonts: 6 static OFL TTFs in `apps/mobile/assets/fonts/` (README = source + license), `expo-font` plugin in `app.json` registers weighted families "Newsreader" (500/600) and "Public Sans" (400–700); Tailwind `font-display` / `font-body`; `ui/text.tsx` base = `font-body`, h3/h4 = `font-display`. Prebuild done (android/ regenerated, `res/font/xml_*.xml` present).
- Build: always `JAVA_HOME=/usr/lib/jvm/java-17-openjdk bunx expo run:android` (machine default JDK 26 fails in jlink `JdkImageTransform`).
- Committed `4fc332c` (all checklist items done, review fix included).
- Routes: `(app)/(tabs)/{_layout,index,capture,trends,settings}.tsx` (expo-router `Tabs`, lucide icons, tints from `components/trends.tsx` exports); `(app)/routine` and `spots/[photoId]` stay in the `(app)` Stack above the tabs. Old `(app)/index.tsx` removed.
- `components/today.tsx` (tonight state + CTA, last photo time + spot count, Mark spots link, two streak cards, embedded routine, 5-zone redness + 7-day direction, "Xu hướng →"); canvas sparklines skipped (web skipped them too). `components/settings.tsx` (Google name/email, VI/EN segmented switch → `i18n.changeLanguage` + AsyncStorage `language`, read back in `i18n.ts`; sign-out; delete-account moved verbatim). `RoutineChecklist embedded` (tick only + "Sửa routine" link). Tab screens render their component only while `useIsFocused()` (see Next). Locales: `nav/today/settings/routine.edit` added, orphaned `shell.*` keys removed. jest.setup mocks AsyncStorage globally.
- Tests written first: `today.test.tsx` (2), `settings.test.tsx` (2), `routine-checklist.test.tsx` +1 embedded; first run pending (jest slow while Gradle compiles).

## Next

- Verified 2026-09-14 10:50: `bun run typecheck` green, mobile jest 9 suites / 21 tests green; dev build installed (JDK 17), after a fresh Google sign-in all four tabs render with Newsreader headings + Public Sans body; VI chosen in Cài đặt survives force-stop. Emulator needed `adb reverse tcp:8081 tcp:8081` + dev-client URL `localhost:8081`. The session did not survive the reinstall (sign-in again).
- `/code-review` (medium): tabs keep screens mounted, so Hôm nay / Xu hướng never reloaded and the embedded checklist could overwrite ticks made on `/routine`. Fixed once in the tab screens: each renders its component only while `useIsFocused()`, so it remounts (and reloads) on every visit, including return from `/routine` and spot marking; this also stops Chụp's camera + brightness timer on blur, so `capture.tsx`'s `isActive={useIsFocused()}` was reverted. Verified on the emulator: tick on `/routine` → back → Hôm nay shows 1/4. Deferred: blank Hôm nay on a failed load → ticket 07 row 10 (error states).
- Left: set **Status** to done and commit this ticket file (docs(tracker) close ticket 06, like 73e51d3), then `/implement` ticket 07 (or 10 from 22:30).
- Maestro flows `capture.yaml` / `mark-spots.yaml` / `trends.yaml` tap the removed home buttons ("Tonight's photo", "Trends"): fix in ticket 09.
- Capture and Trends keep their "<" back link to `/` (= Hôm nay tab); redundant under tabs, harmless.

## Audit 2026-10-17

- Status: done
- Evidence: Was done: commit 4fc332c; mobile tabs.test.tsx, today.test.tsx, settings.test.tsx. Redesigned in redesign-build 02, 04, 09.
