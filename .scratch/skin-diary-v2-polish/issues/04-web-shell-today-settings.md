# 04: Web app shell + Hôm nay + Cài đặt, streaks

**What to build:** a signed-in web user moves between Hôm nay / Chụp / Xu hướng / Cài đặt from a sidebar (bottom tabs at narrow widths). Hôm nay is a real dashboard: tonight's photo state with a "Chụp ảnh tối nay" call to action, last photo and its spot count, per-zone Chỉ số mẩn đỏ with its 7-day direction, capture and routine streaks, and tonight's routine checklist. Cài đặt holds language, sign-out and account deletion. Spec row 7, stories 2–9, 43. Follows the canvas's WebToday artboard. Estimate 2.5 h.

**Blocked by:** 01

**Status:** done

- [x] **Domain, test-first (Vitest):** one pure streak function takes a set of local days + today's local day and returns the count of consecutive days ending today, or ending yesterday when today is absent; reuses the trend module's local-day helper. Tests cover today-end, yesterday-end, gaps, empty set, timezone-local days
- [x] Capture streak = days with ≥1 camera-sourced Photo; routine streak = nights with a RoutineEntry that has ≥1 completed label; both derived from data the web app already loads
- [x] "Streak" added to `CONTEXT.md`
- [x] Signed-in area keeps its path prefix and gate; a shared layout renders the four destinations as a sidebar on desktop widths and bottom tabs at narrow widths
- [x] Hôm nay replaces the link-button home; routine checklist renders inside it with a "Sửa routine" link to the existing edit screen (routine is not a top-level destination)
- [x] Zone directions read đang giảm / ổn định / đang tăng
- [x] Each Hôm nay screen receives its data functions from its route (seam ticket 05's demo route plugs into); no provider/context or repository layer
- [x] Cài đặt: language switch (remembered), Google name/email, sign-out and delete-account with their current behaviour; **no dead rows** — theme, reminders, export, feedback, project page rows appear only in the tickets that ship them
- [x] Sign-out and delete-account are gone from the home screen
- [x] Existing `delete-account.spec.ts` / `capture.spec.ts` E2E still pass against the deployment (update navigation steps only)
- [x] Deployed to Vercel production

## Now

- Domain done, test-first: `packages/domain/src/streak.ts` (`streak(days, today)`, reuses `windowDays`), 6 Vitest cases green, exported from the package. "Streak" added to `CONTEXT.md`.

- Web shell: `app/app/layout.tsx` + `components/app-nav.tsx` (sidebar ≥ md, fixed bottom tabs below, `aria-current`).
- Seam: `components/today.tsx` and `RoutineChecklist` take an `api` prop (`TodayApi`, `RoutineApi` = typeof the lib functions); `app/app/signed-in.tsx` ("use client") binds the Supabase lib functions, because a server page cannot pass functions to a client component. Ticket 05's demo route adds its own binding file.
- Hôm nay: one `loadTrends(90 days)` + `latestPhotoUrl`; tonight state + CTA, last photo + spot count, per-zone Chỉ số mẩn đỏ with 7-day direction (`FLAT_TOLERANCE` now exported from `lib/trends`), capture/routine streak cards with a 14-day strip, embedded routine checklist (tick only) with "Sửa routine". The canvas's 7-day mini chart is skipped (not in acceptance).
- `/app/settings`: LocaleSwitch, Google name (`user_metadata.full_name ?? name`) + email, sign-out, delete. Old home buttons and orphaned `Shell.*` keys removed. `delete-account.spec.ts` now opens `/app/settings`.
- Typecheck + web Vitest (19) green.

- Checked on localhost:3000 as `e2e@skinsense.test`: desktop sidebar, phone bottom tabs, Settings (screenshots in `.playwright-mcp/`, gitignored); photo capped at 220 px below `sm`. `delete-account.spec.ts` passed locally (12.4 s) through `/app/settings`; `capture.spec.ts` needed no change (goes straight to `/app/capture` and `/app/trends`). Code review: no findings.

## Next

- Done 2026-09-14: deployed with ticket 05 (`9eig3abvz`, see ticket 05 for the Vercel block); both E2E specs passed against https://skinsense-v2.vercel.app (1.1 m).

## Audit 2026-10-17

- Status: done
- Evidence: Commit ee9e039; web app shell, Hôm nay with streaks, Cài đặt; today.test.tsx, settings.test.tsx, domain streak.test.ts. Redesigned in redesign-build 02, 04, 09.
