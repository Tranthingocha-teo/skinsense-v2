# 21: About and licenses (Android)

**What to build:** an Android user opens "Giới thiệu" from Cài đặt and sees the app version, privacy and source links, and the open-source licenses the app is built on. Spec: Features (about); stories 94, 95.

**Blocked by:** 09.

**Status:** done

- [x] Version comes from the app config (1.0.0 for the first release after the redesign)
- [x] Privacy and source links open externally
- [x] License list covers the app's direct runtime dependencies and bundled fonts, including "MediaPipe (mô hình .tflite)", kept as a checked-in list
- [x] A test fails when a direct runtime dependency is missing from the checked-in list
- [x] Cài đặt gains the about row on Android only
- [x] jest-expo screen test: version, links and licenses render
- [ ] Light and dark screenshots match AndroidAbout; differences noted here

## Now

- 2026-09-15: started on worktree branch `worktree-agent-acd07cd7c2356b6d7` (origin/main 1658932). Reading done; building the checked-in license list, the About component + route, the Cài đặt row, and jest tests.
- Built: `src/lib/licenses.json` (+ `licenses.test.ts`), `src/components/about.tsx` (+ test), route `src/app/(app)/about.tsx`, "Giới thiệu & giấy phép" row in Cài đặt → Hỗ trợ, vi/en strings. Mobile tsc clean; about, licenses, settings tests green (10). Running root typecheck + test next.
- Guard verified red: removing `clsx` from `licenses.json` makes `licenses.test.ts` fail listing it. Root `bun run typecheck` clean; `bun run test`: domain 12 files, mobile 43 tests / 12 suites green; web 12/13 files green in the parallel run, `trends.test.tsx` timed out at 5 s under load and passes 6/6 alone (no web code changed). Committed on `worktree-agent-acd07cd7c2356b6d7`; only the Android screenshots remain (see Next).

## Next

- Android light/dark screenshots (emulator + Metro belonged to another agent during this ticket): with Metro running and the dev client signed in, Cài đặt → "Giới thiệu & giấy phép", `adb shell cmd uimode night no|yes`, `adb exec-out screencap -p > ~/docs/case-study/skinsense/build/21-about/android-{light,dark}.png`; tap "Xem tất cả" for `android-{light,dark}-all.png`. Compare with AndroidAbout and note differences here.
- When `apps/mobile/package.json` dependencies change, add the entry to `src/lib/licenses.json` (license from `node_modules/<pkg>/package.json`); `licenses.test.ts` fails until you do.

## Decisions

- Cài đặt row uses the AndroidSettings wording "Giới thiệu & giấy phép" / "About & licenses" and sits above Chính sách riêng tư in Hỗ trợ (canvas order; the Góp ý row from its own ticket goes above it). The web settings test already asserts no /about/ row on web.
- "Xem tất cả" expands the list in place: no artboard exists for a separate full-list screen. The first five entries of `licenses.json` are the canvas preview (Expo, React Native, MediaPipe, TensorFlow Lite, fonts); the rest follow alphabetically by package name.
- Extra non-npm entries: "MediaPipe (mô hình .tflite)" Apache-2.0, "TensorFlow Lite" Apache-2.0 (native runtime bundled by react-native-fast-tflite, shown on the canvas), and one "Noto Serif Display, Manrope" OFL-1.1 row as on the canvas.
- License identifiers were read once from each package's `package.json` in node_modules on 2026-09-15 (all MIT except class-variance-authority Apache-2.0 and lucide-react-native ISC). The guard test checks presence only; `workspace:*` packages are excluded.
- The privacy URL is duplicated in `about.tsx` (as `sign-in.tsx` already does) rather than imported from `settings.tsx`, so the About test does not pull in the Supabase client.
- The screen test mocks `expo-constants` with version 1.0.0; the screen reads `Constants.expoConfig.version`, which comes from `app.json` `expo.version` (1.0.0).

## Audit 2026-10-17

- Status: done
- Evidence: Commit 3e95231; mobile about.test.tsx and licenses.test.ts (apps/mobile/src/lib/licenses.json).
