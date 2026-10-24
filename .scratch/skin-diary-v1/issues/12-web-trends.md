# 12: Web — trends

**What to build:** the Trends screen for real — per-zone redness over 7/30 days, spot count, routine %, before/after slider.

**Blocked by:** 09, 04

**Status:** superseded (by redesign-build 07)

- [x] Matches the canvas's `Trends` artboard: 7/30-day toggle, 5 zone chips, redness line chart, spot-count + routine-% stat cards, before/after slider
- [x] Redness-index line chart follows the `dataviz` skill: single-hue line, zero baseline, no dual-axis
- [x] All three trend series (redness, spot count, routine %) read from real persisted `ZoneReading`/`Spot`/`RoutineEntry` data, not mock data
- [x] Before/after slider compares two of the user's own real photos
- [x] "Not a medical diagnosis" disclaimer visible on this screen
- [x] All interactive elements (toggle, chips, slider handle) ≥44×44px tap targets, matching the fixes already applied to the design canvas
- [x] All UI strings shipped in Vietnamese + English

## Now

Built 2026-09-13 (Claude, `/implement`). `packages/domain/src/trend.ts` (pure, test-first: `localDay`, `windowDays`, `dailySeries` = mean per local day / null when none, `trendDirection` = first-vs-last present value within a tolerance; 8 Vitest tests). `apps/web/src/lib/trends.ts` (`loadTrends(since, sinceNight)`: photos in the window → their zone_readings + spots, plus routine_entries; `signedPhotoUrls` for the two slider photos). `src/components/trends.tsx` (client; 7/30 toggle + 5 zone chips as `aria-pressed` buttons ≥44px; inline SVG line chart on the artboard's 328×160 geometry — single hue `--primary`, dashed zero baseline, gaps where a day has no photo, native `<title>` hover per point, `sr-only` table; spot card = the day's **latest** photo's count for the selected zone (a mean over retakes rounded to 0 in the E2E — fixed), sparkline; routine card = mean completion % over the window's entries; before/after = oldest vs newest photo in the window, native `<input type="range">` over the image with a 44px thumb and `clip-path` on the "after" image; disclaimer line). `/app/trends` page + link from `/app`; `Trends` i18n namespace vi + en. `routine-checklist.tsx` now uses domain's `localDay` (its own copy deleted).

Verified: `bun run typecheck` 4/4, `bun run test` 55 domain / 17 web / 6 mobile green, `bun run lint` clean for the new files (2 pre-existing errors in `hero.tsx` / `routine-checklist.tsx` untouched). Playwright E2E (`apps/web/e2e/capture.spec.ts`) now continues capture → spots → trends and passes against the real project: the just-saved photo is a point on the redness line, the spot card shows ≥1 for the tapped zone, the slider renders when ≥2 photos exist. Screenshots at 390px checked by eye (fixed: missing "Mon" label, crowded 30-day labels, screen blanking while the window reloads).

`/code-review` (Standards + Spec, Sonnet sub-agents): no hard standards violation. Folded in: the "unwrap present values" idiom ×3 → one `present()` helper, `c` → `line`, `loadTrends(firstDay)` derives its own ISO instant (was two window-start params), the spot sparkline now has the same `sr-only` series table as the redness chart (story 16 "over time" was sighted-only), and routine % now averages every night from the first ticked night in the window to today — an unticked night is 0%, not skipped (it was a mean over existing entries, which flattered a user who ticks once a week). Kept on purpose: the before/after pair is oldest vs newest **inside the selected window** (artboard has no picker; switching 7↔30 changes the pair, the date pills show it), and the trends assertions live in the existing capture E2E (same seeded photo, one flow — ticket 09's convention). Day bucketing is browser-local on both write paths (`night` and `taken_at` → `localDay`), so a photo and its routine tick land in the same night.

## Next

- Dinh: sign in at `localhost:3000`, open `/app/trends`, switch 7/30 and zones, drag the slider. Then `/commit`.
- Next tickets in the web chain: 14 (keep-alive cron, small), 11 (privacy page + delete-account Edge Function).

## Audit 2026-10-17

- Status: superseded (by redesign-build 07)
- Evidence: Shipped in ca91028, rebuilt in 51f192b; web trends.test.tsx; trends step in e2e/capture.spec.ts.
