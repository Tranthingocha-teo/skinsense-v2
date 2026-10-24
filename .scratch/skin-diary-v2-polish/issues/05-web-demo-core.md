# 05: Web demo without sign-in

**What to build:** a visitor opens the demo with no sign-in and sees a filled-in diary — Hôm nay, Xu hướng and the before/after slider backed by 90 days of sample data. Ticking the routine persists across reloads in this browser only; a persistent banner shows the "chỉ lưu trên trình duyệt này" note, the persona, Đặt lại, and "Đăng nhập bằng Google". Spec row 8, stories 26–30. Estimate 2.5 h.

**Blocked by:** 04

**Status:** done

- [x] **Domain, test-first (Vitest):** a deterministic seeded generator (persona + day count + today → Photos, ZoneReadings, Spots, RoutineItems, RoutineEntries in the shapes the apps already load). Tests: same seed → same output, 90 days, shapes match the row types, readings within realistic ranges
- [x] Generated data makes the dashboard non-trivial: non-zero capture and routine streaks, ≥1 missed day, at least one zone per direction if feasible
- [x] Demo route is public (outside the signed-in gate) and renders the same screen components as the signed-in app, receiving demo data functions with the same signatures as the Supabase-backed ones (web may freeze generator output to static JSON)
- [x] Demo writes go to browser storage only, never to Supabase; Đặt lại clears them
- [x] Sample face images for the before/after slider are generated or openly licensed, source + license recorded in the repo; never Dinh's photos
- [x] Landing links to the demo
- [x] "Demo persona" added to `CONTEXT.md`
- [x] Deployed to Vercel production; open demo → tick → reload keeps it → Đặt lại clears it, checked by hand on the deployment

## Now

- Domain done, test-first: `packages/domain/src/demo.ts` (`generateDemo(persona, days, today, routineLabels)`, `DEMO_PERSONA`, mulberry32 seed), 5 Vitest cases green. 90 nights end yesterday (tonight stays open); per-zone `lastWeek` drift gives forehead/right cheek ↓, cheeks/chin →, nose ↑; missed nights only before the last week. "Demo persona" added to `CONTEXT.md`.
- Web: `lib/demo.ts` (`demoApi(labels)`: generated at runtime in the browser — not frozen JSON, so days are the visitor's local days — plus localStorage overrides for routine items/entries, merged into `loadTrends` too; `resetDemo`). Routes `app/demo/{layout,page,trends/page,routine/page}.tsx` + `demo-bindings.tsx`; `components/demo-banner.tsx`. `Trends` now takes an `api` prop (`SignedInTrends` binding). `useAppHref()` in `app-nav.tsx` maps links to `/app` or `/demo`; demo screens that need an account (Chụp, Cài đặt, Đánh dấu nốt mụn) link to `/#cta` sign-in. Persona is static text (dropdown is row 32). Landing: "Xem thử" buttons in hero + trust section. Sample images: hand-drawn SVGs `public/demo-photos/{before,after}.svg`, license note inside each file.

- Typecheck (web, domain) green; web Vitest 19, domain Vitest 66 green. Generator tweak: the last photo always carries 3 spots.
- Checked on localhost:3000 (screenshots in `.playwright-mcp/`, gitignored): /demo shows streaks 8 / 15, one zone per direction, CTA and account-only links → `/#cta`; tick "Tẩy trang" → reload keeps 1/4 (localStorage entry) → Đặt lại → 0/4, storage null; /demo/trends chart + before/after slider render; landing has both `/demo` links; no console errors.

## Next

- Committed `5290135` (full test + typecheck green, `/code-review` clean). Claude's `vercel deploy --prod` was blocked by the auto-mode classifier (production deploy): Dinh ran it: `bgfn92w6g` also sat at UNKNOWN with no build log (Vercel status all operational; cause unproven), like `dtjbi5wjn`. Dinh chose a local build: `vercel pull` + `vercel build --prod` done at the repo root (`.vercel/output` has the `/demo` routes). Prebuilt `aq1uzymaf` stuck too. Root cause proven via the Vercel API: `readyState BLOCKED`, `seatBlock.blockCode TEAM_ACCESS_REQUIRED`, "commit author doesn't have permission" — commit author GitHub `dinh144` (unverified) vs Hobby account `chanem794`. Fix: Dinh connected GitHub `dinh144` in Vercel Account Settings → Authentication, then `vercel deploy --prebuilt --prod` → `9eig3abvz` READY, aliased to https://skinsense-v2.vercel.app. Future deploys: plain `vercel deploy --prod` should now pass the author check (not yet re-verified).
- Done 2026-09-14, checked on production: /demo tick → reload keeps 1/4 (`skinsense-demo` in localStorage) → Reset → 0/4, storage null, no console errors; /demo/trends, /demo/routine, /demo-photos 200; landing has 2 `/demo` links. Ticket 04's E2E specs passed there too. Next ticket in order: 06.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 5290135; apps/web/src/app/demo; domain demo.ts with demo.test.ts; web lib/demo.test.ts.
