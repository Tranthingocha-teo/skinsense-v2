# 02: App shell (web sidebar, phone tab bar, Android tab bar)

**What to build:** signed-in users move between Hôm nay, Chụp, Xu hướng and Cài đặt through the canvas navigation: a sidebar on desktop web, a bottom tab bar on the web at phone width, and the redesigned tab bar on Android. `/app` and Xem thử share the same shell. Spec: Source of truth and order, Web at phone width; stories 7, 8, 54.

**Blocked by:** 01.

**Status:** done

- [x] Desktop web uses the shadcn Sidebar with the canvas icons, labels and active state
- [x] Below the desktop breakpoint the web shows the bottom tab bar from the 390 artboards; page content is never hidden behind it
- [x] Android tab bar matches the Android artboards (icons, labels, active state) in light and dark
- [x] Every nav target is at least 44px (measured: web sidebar items 44×207, phone tabs 66×97.5; Android bar 72 + inset)
- [x] Xem thử pages use the same shell as `/app` (both layouts render `AppShell`)
- [x] Web (Vitest + RTL) and Android (jest-expo + Expo Router testing library) tests: each tab navigates to its screen and marks itself active
- [x] Light and dark screenshots (web 1440, web 390, Android) match the nav on canvas page "App core"; differences noted here

## Decisions (2026-09-15)

- Android tab bar is solid `bg` with a `line` hairline instead of the canvas 82% + 18px blur: `expo-blur` is not installed (native rebuild) and DESIGN.md limits glass to cards over the photo and names blur a GPU cost on Android. Web keeps the blur (`bg-background/82 backdrop-blur-[18px]`).
- Android tab icons are the canvas SVG paths drawn with `react-native-svg` (already a dependency), not lucide: House/Camera/TrendingUp/SlidersHorizontal differ visibly from the artboards.
- Android tab colours come from `@skinsense/tokens/tokens.json` (`color.dark|light`) keyed by `useColorScheme()`, because `tabBarActiveTintColor` needs a JS colour, not a NativeWind class. `trends.tsx` still exports its old hex constants for its own SVG; no external consumer is left (pre-existing, untouched).
- Web: both bars are in the DOM (shadcn `Sidebar collapsible="none"` hidden below md, the tab bar `md:hidden`); the RTL test asserts each link's href and `aria-current` in both. `SidebarInset` is not used because every page already renders its own `<main>`.
- The Android tabs test lives in `src/components/tabs.test.tsx`, not next to `_layout.tsx`: expo-router's `require.context` bundles any file under `src/app` as a route and the Metro bundle failed on `expo-router/testing-library`'s Node `path` import.
- Screenshots use `locale: "vi-VN"` so labels match the canvas wording.
- Known: shadcn `SidebarProvider` installs a global keydown listener that swallows Ctrl/Cmd+B (and writes a `sidebar_state` cookie). Harmless with `collapsible="none"`; the ticket that adds Textarea screens (`15-notes-and-tags.md`, `20-feedback.md`) should strip it if Ctrl+B matters there.

## Differences from canvas

- Android: no blur on the bar (see Decisions).
- Web sidebar icons are 23px, not the canvas NAV's 20px: DESIGN.md "Icons: stroke 1.5, 23–24px" wins (review 15/09). The web phone tab bar keeps the canvas glass because the canvas draws it that way; DESIGN.md's glass rule is about cards.
- The `/demo` header (Xem thử banner) is still the old layout; `08-sign-in-and-xem-thu.md` restyles it.

## Now

- Done 2026-09-15 (uncommitted). Screenshots: `~/docs/case-study/skinsense/build/02-app-shell/` (web-today-1440/390 × light/dark, web-today-1440-dark-before = ticket 01 sweep check, android-light/dark). `bun run typecheck` and `bun run test` pass (web 24, mobile 26, domain 66).

## Next

- Dinh: review the diff, then `/commit`. `03-routine.md` and `04-hom-nay.md` rebuild their screens inside this shell.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 29b3314; apps/web app-nav.test.tsx; apps/mobile tabs.test.tsx.
