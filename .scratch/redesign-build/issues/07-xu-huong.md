# 07: Xu hướng

**What to build:** the trends screen follows canvas 2 on both apps: 7/30-day toggle, zone chips, the redness chart with latest value and direction, spot and routine cards, the before/after slider, and designed "not enough photos" and error states. Stories 9, 33–38.

**Blocked by:** 02.

**Status:** done

- [x] ToggleGroup for 7/30 days and zone chips, each target at least 44px (web shadcn ToggleGroup, Android React Native Reusables ToggleGroup; items `h-11`)
- [x] shadcn Chart (web) / the Android chart shows the chosen zone with the latest value, an arrow and a word
- [x] Spot count and routine completion cards
- [x] Before/after slider over the range's automatic first/last pair
- [x] Fewer than two photos in the range: chart and comparison say what is missing (Empty)
- [x] Load error shows "Thử lại" (existing `LoadState`; screen tests cover retry on both apps)
- [x] Screen tests on both apps cover both ranges, zone switch, not enough photos and error with the data module mocked
- [ ] Existing trends tests and the Maestro trends flow pass (unit tests pass: web 29, mobile 32, domain 69; Maestro not run — emulator in use by another agent)
- [ ] Light and dark screenshots (web 1440, web 390, Android) match AndroidTrends / WebTrends / PhoneTrends and TrendsEmpty; differences noted here (web done; Android pending; Empty unreachable on /demo, see Differences)

## Decisions (2026-09-15)

- Web chart is shadcn `ChartContainer` + recharts `LineChart` (`accessibilityLayer={false}` inside a `role="img"` wrapper with the existing label; the sr-only series table stays). `isAnimationActive={false}`: chart draw motion is not in DESIGN.md. Null days render no dot and break the line (custom `dot` render function), the latest point is the filled one. Day labels are the recharts `XAxis` (`ticks` = every day at 7, weekly anchored on today at 30), so the empty state has no label row, as on the canvas.
- `ResizeObserver` no-op polyfill added to `apps/web/vitest.setup.ts`: recharts' `ResponsiveContainer` needs it in jsdom.
- "Gần nhất" pill: the value is display 17px inside the pill, so the `latest` message gained a `<v>` tag on both apps (`t.rich` on web, `Trans` on Android); wording unchanged. On web the pill is rendered twice (chart header from md up, under the chart at phone width), one copy `display:none`; the test asserts both.
- 7/30 and zone chips are `type="single"` toggle groups, so items are `role="radio"` + `aria-checked` on both apps (web tests switched from `button`/`aria-pressed`). A re-click on the active item yields an empty value and is ignored. Android: `bunx --bun @react-native-reusables/cli@latest add toggle-group` added `toggle.tsx`, `toggle-group.tsx` and the `@rn-primitives/toggle{,-group}` deps; the CLI also overwrote `ui/text.tsx` (dropped ticket 01's `font-body`/`font-display`) and that file was restored. Maestro's `days-30` / `compare-slider` testIDs survive (the primitive forwards props).
- Android chart colours come from `@skinsense/tokens/tokens.json` keyed by `useColorScheme()` (SVG takes no className); the old hard-coded hex constants (`PRIMARY`, `MUTED`, …) are gone, `FLAT_TOLERANCE` stays exported for `today.tsx`.
- Android night tint is a local `NightTint` in `app/(app)/(tabs)/trends.tsx` (260px, glow 0.35), the same SVG recipe as `routine.tsx`; not extracted into a shared file because ticket 04 is editing that area concurrently.
- Android chart card is solid `bg-card`, not the canvas glass (ticket 02: no blur on Android). The date pills and the slider handle use hex alpha from the palette (`bg` 60%, `fg` 30%) instead of NativeWind opacity modifiers (ticket 03).
- Android compare box shows the photo placeholder gradient (`photo-b` → `photo-a`) until the signed URLs arrive; web uses the `bg-photo` utility.
- Android cards keep the screen `FadeIn(200)` (ticket 03 precedent); the DESIGN.md card `FadeInDown` waits for ticket 04 to record its offset (spec: "the ticket that builds it records the value").

## Differences from canvas

- Web/Android: no "Ảnh · placeholder" badge in the compare box — real photos render there.
- Web: recharts centres each day label under its tick, the canvas spreads them edge to edge; chart margins are 16px so the first and last labels are not clipped.
- Android: chart card solid instead of glass (see Decisions).
- The `/demo` header (Xem thử banner) is still the old layout (ticket 08).
- TrendsEmpty and the error state could not be screenshotted on the web: `/demo` generates photos for every night of the last week, and no Playwright-mounted component page exists (brief: note the gap). Both states are covered by the screen tests.
- Web 390 screenshots are full-page captures, so the fixed tab bar appears mid-page (Playwright artefact, not a layout bug).

## Now

- Done 2026-09-15 on worktree branch `worktree-agent-a12ee33c46c824356`, committed. `bun run typecheck` (5/5), `bun run test` (domain 69, web 29, mobile 32) and `cd apps/web && bun run build` pass. Screenshots: `~/docs/case-study/skinsense/build/07-xu-huong/web-trends-{1440,390}-{light,dark}[-30d-nose].png`.

## Next

- Android emulator screenshots (light/dark, tab Xu hướng, `adb shell cmd uimode night yes|no`) — pending, the orchestrator schedules the emulator pass.
- Maestro flow (needs the signed-in English emulator, ≥ 2 photos in 30 days, no writes): `cd apps/mobile && bunx expo start --dev-client`, then `maestro test apps/mobile/flows/trends.yaml`.
- Card `FadeInDown` (460ms, stagger 80ms) once ticket 04 records the offset in DESIGN.md.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 51f192b; trends.test.tsx on web and mobile; apps/mobile/flows/trends.yaml; trends step in e2e/capture.spec.ts.
