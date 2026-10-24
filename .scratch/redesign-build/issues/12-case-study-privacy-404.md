# 12: /case-study, /privacy and 404

**What to build:** a recruiter can read the English `/case-study`, and `/privacy` and the 404 page share the redesigned look. Stories 61–63.

**Blocked by:** 01.

**Status:** done

- [x] `/case-study` in English with the problem, product, measurement, design, engineering decisions, results and next steps as approved on the canvas (15/09)
- [x] The vi locale shows the same English page
- [x] Role and Timeline stay bracketed for Dinh; the two unmeasured results stay bracketed until the release-gates audit and QA produce numbers
- [x] `/privacy` and the 404 page match their artboards; the contact email stays bracketed
- [x] Playwright: `/case-study` renders at a 390px viewport
- [x] Light and dark screenshots match WebCaseStudy / PhoneCaseStudy, WebPrivacy and WebNotFound; differences noted here

## Decisions (2026-09-15)

- `/case-study` is a plain server component with hardcoded English copy and static metadata, no next-intl: that is what makes the vi locale show the same page. The page root carries `lang="en"` because the root layout stamps `<html lang="vi">` for vi visitors.
- Links the canvas leaves as `#`: Live site → `https://skinsense-v2.vercel.app` (the layout's `metadataBase`), GitHub → `https://github.com/dinh144/skinsense-v2` (the repo remote), Android APK → `APK_URL`.
- The 04 Design swatches keep literal `#1D1711` / `#EEF2F5` (and their label colours): they depict the rejected C1/C2 palettes, so they are content, not theme colours.
- Privacy contact line changed from `hi@gmail.com` to `[email liên hệ]` / `[contact email]` in both locales: the ticket asks for the bracket and the spec lists a real email as out of scope.
- The canvas `.photo` and `.night` gradients are two Tailwind `@utility` classes (`bg-photo`, `bg-night`) at the end of `globals.css`, tokens only; ticket 10's hero can reuse them.
- Header (mark + wordmark) and the four canvas icons live in `src/components/site-header.tsx`, a new file, so ticket 10's animated mark does not conflict; the orchestrator can dedupe later.
- Where the 390 artboard shortens copy (02 captions, 05 bodies, 06 captions), the page keeps the 1440 wording at every width; the 390 layout (2-column grids, stacked pipeline cards, no "Live site" in the header, no "Still open." h2, column footer) follows the PhoneCaseStudy artboard.
- No Vitest/RTL test: the page has no data module or state; Seam 3 is the Playwright spec (`e2e/case-study.spec.ts`: h1 visible, `scrollWidth <= 390`, English under `locale=vi`). It imports nothing from `e2e/auth.ts`, so it needs no Supabase credentials.

## Differences from canvas

- Sections are sized by their content with a 96px (390: 64px) rhythm instead of the artboards' fixed heights, so the bottom gaps are smaller than drawn.
- The hero scrim uses the 1440 gradient stops at every width (the 390 artboard ends the fade at 80%).
- The 390 footer keeps the Android APK link (the artboard lists only Live site and GitHub).
- The "N" badge bottom-left in the screenshots is the Next dev-tools indicator, absent in production.
- At 390 the page keeps the 1440 wording where PhoneCaseStudy shortens it (02 captions, 05 bodies, 06 captions); "Still open." stays as a screen-reader-only heading instead of being removed (review 15/09).

## Now

- Done 2026-09-15, committed on worktree branch `worktree-agent-ae36e950708086029`. Screenshots: `~/docs/case-study/skinsense/build/12-case-study-privacy-404/` (web-case-study/privacy/404 × 1440/390 × light/dark). Verified: `E2E_BASE_URL=http://localhost:3012 bunx playwright test e2e/case-study.spec.ts` 2 passed; web Vitest 24 passed; domain 66 passed; `cd apps/web && bun run build` ok.
- `bun run typecheck` and `bun run test` pass from the worktree root (web 24, mobile 26, domain 66) once the gitignored, expo-generated `apps/mobile/expo-env.d.ts` is copied in from the main checkout; without it mobile typecheck fails on CSS-module types (`animated-icon.module.css`, `@/global.css`), unrelated to this ticket. `capture.test.tsx` timed out once under the parallel turbo run (2.2s) and passed alone and in the full web run: a pre-existing flake.

## Next

- Dinh: merge the worktree branch into main, run `bun run typecheck` there, fill `[Your role]` and `[Start – end]` in `apps/web/src/app/case-study/page.tsx`, and replace the two `[—]` results once the release-gates audit and real-phone QA produce numbers.

## Audit 2026-10-17

- Status: done
- Evidence: Commits 155baa1 and 9b16554; apps/web/e2e/case-study.spec.ts; /privacy and not-found.tsx exist.
