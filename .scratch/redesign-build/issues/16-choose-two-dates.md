# 16: Choose two dates to compare

**What to build:** on Xu hướng a user picks the "before" and "after" dates on a month calendar that only enables days with Photos, and the comparison uses those Photos; without picking it still uses the first and last Photo of the range. Spec: Domain package additions, Features; stories 75–77.

**Blocked by:** 07.

**Status:** done

- [x] Domain (test-first, Vitest): the days in a range that have Photos, the latest Photo of a chosen day, the default pair (first and last Photo), an empty range (`packages/domain/src/compare.ts`, 8 tests)
- [x] The calendar enables only days with Photos and marks today (screen tests on both apps + Playwright assert disabled days and the "…, today" label)
- [x] Desktop web: Dialog + Calendar; web at phone width: Drawer + Calendar; Android: bottom sheet calendar (web verified by Playwright at 1440 and 390; Android by jest-expo only, not yet on the emulator)
- [x] Picking replaces the automatic pair; not picking keeps it
- [x] Screen tests on both apps: default pair, picking both dates, disabled days (web also: cancel keeps the pair)
- [ ] Playwright and Maestro: choosing two dates updates the comparison (Playwright `e2e/compare-dates.spec.ts` passes on /demo/trends at 1440 and 390; Maestro step written, not run — emulator in use by another agent)
- [ ] Light and dark screenshots match AndroidCompare / WebCompare / PhoneCompare; differences noted here (web done; Android pending)

## Decisions (2026-09-15)

- Domain `compare.ts` is generic over `{ taken_at }`: `photoDays(range, photos)`, `latestPhotoOfDay(photos, day)`, `comparisonPair(photos, chosen?)`. The chosen days are put in date order; when a chosen day has no Photo in the range (e.g. picked in 30 days, then switched to 7) or both days are the same, it falls back to the first/last pair; fewer than two Photos gives null.
- Entry point: the canvas draws the open picker but no trigger. A "Chọn 2 ngày" text button (calendar icon, 44px target) sits in the compare card header, only when a pair exists.
- Picker behaviour: opens on the pair on screen with Trước active and the after-day's month shown; a tap fills the active slot and moves to Sau; the two days stay in date order; So sánh is disabled while both slots hold the same day; Hủy, the scrim, Escape or back discard the draft.
- Signed URLs moved into their own effect keyed on the pair's storage paths (both apps), so old photos never show under new date pills; a failed signing leaves the placeholder gradient.
- Web: phone width is the existing shadcn `useIsMobile` (< 768px): Drawer below, Dialog from md. Day labels are formatted in UTC from the day string so the runtime zone cannot shift them. Past days without a photo are disabled but keep the foreground colour (canvas day 6); future days are muted.
- Android: RN `Modal` (transparent, `slide`, `fade` under reduced motion) with a NativeWind month grid, not a bottom-sheet library: none is installed and adding one needs a native rebuild. No drag-to-dismiss; scrim tap and back close it. DESIGN.md has no sheet motion value, so the system slide is used. Enabled day cells carry `testID="photo-day"` for Maestro.
- Tests pin the clock mid-month (web: fake `Date` only; Android: `useFakeTimers({ advanceTimers: true })`) so every photo day sits in the calendar's opening month; the web test stubs `matchMedia` for `useIsMobile` (app-nav test precedent).

## Differences from canvas

- Month caption reads "Tháng 9 năm 2026" (Intl month + year, first letter capitalised), canvas "Tháng 9, 2026".
- Web Dialog is vertically centred (shadcn), canvas places it 96px from the top.
- The trigger button is not on the canvas (see Decisions).
- Web 390: the round "N" at bottom left is the Next.js dev indicator, not app UI.
- Android screenshots not taken yet (emulator busy).

- Review 15/09: DESIGN.md icon rule clarified (23–24px for navigation and standalone icons, 14–20px inside text buttons/chips as the canvas draws them), so the 16/20px trigger and chevrons stay.

## Now

- 2026-09-15: done on worktree branch `worktree-agent-aeb2d0fc7b4bb7925`. `bun run typecheck` 5/5; tests domain 80, web 44 (`today.test.tsx` timed out under load in the full run and passes alone), mobile 38; `cd apps/web && bun run build` passes; Playwright `compare-dates.spec.ts` 2/2 against `E2E_BASE_URL=http://localhost:3016`. Screenshots: `~/docs/case-study/skinsense/build/16-choose-two-dates/web-compare-{1440,390}-{light,dark}.png`.

## Next

- Android emulator screenshots (light/dark, Xu hướng → "Chọn 2 ngày" sheet open, `adb shell cmd uimode night yes|no`) — pending, the orchestrator schedules the emulator pass.
- Maestro (signed-in English emulator, ≥ 2 photo days in the current month, no writes): `cd apps/mobile && bunx expo start --dev-client`, then `maestro test apps/mobile/flows/trends.yaml`.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 97a3378; packages/domain compare.test.ts; apps/web/e2e/compare-dates.spec.ts.
