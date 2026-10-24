# skinsense-v2: portfolio release gates

Status: ready-for-agent
Decisions: [grill-2026-09-14-design.md](../skinsense-redesign/grill-2026-09-14-design.md), section "Grill ~19:30 — Google Play scope and done criteria", plus the `/to-spec` seam box of the same evening (recorded under Further Notes).
Sequencing: the CI work runs after the redesign prototypes (step 4 of that file) and before any redesign implementation. Everything else runs after the redesign has shipped on web and Android.

## Problem Statement

Dinh has decided that skinsense-v2 only has to be excellent: it needs no real users and no Google Play listing. Every other effort (certifications, NeetCode, Blender) stays paused until the portfolio is "good enough", but until this evening "good enough" had no definition, so the pause had no exit. Three gates now define it: the redesign ships on web and Android, an English case study goes up with the repo public, and quality is proven with numbers.

The numbers side is not in place today:
- There is no CI. The suite is guarded only by a local Stop hook, so a green state cannot be shown to anyone else and a broken push goes unnoticed.
- The Android APK that visitors download from the landing page is signed with the debug keystore. Anyone could sign a look-alike "update", and it does not read as a finished app.
- Nobody has measured web quality on a phone profile. That includes the signed-in app pages, which a Lighthouse run cannot reach through Google-only sign-in.
- The Android QA checklist has never been run in full on a real phone.

## Solution

Four gates, each producing evidence a visitor or Dinh can check:

1. **CI**: every push and pull request to `main` runs the monorepo's existing typecheck and test entry points on GitHub Actions from a fresh clone. Green or red is visible on GitHub.
2. **Signed release**: the first APK release after the redesign (v1.0.0) is signed with an EAS-managed release keystore and published to the existing public releases repo under the asset name the landing page already links to. Google sign-in keeps working in that build.
3. **Lighthouse done-audit**: once, when the redesign has shipped, every web page, public and signed-in, is audited on the Lighthouse mobile profile against production. Every page must score at least 90 in all four categories. Signed-in pages are reached through the existing E2E test-account cookie helper.
4. **Real-phone QA**: the Android QA checklist, refreshed for the redesigned screens, is run in full on a real Android phone against the release-signed APK before that APK is published.

## User Stories

**CI**
1. As Dinh, I want every push to `main` to run typecheck and tests on GitHub, so that a broken commit is caught even when the local Stop hook did not run (agy edits, a skipped hook, a different machine).
2. As Dinh, I want pull requests to `main` checked the same way, so that a branch shows red before it merges.
3. As a portfolio visitor, I want to see a passing check on the latest commit, so that I can trust the repo is maintained to a standard.
4. As Dinh, I want CI to run from a fresh clone, so that it proves the repo builds without files that only exist on my laptop.
5. As Dinh, I want CI to need no secrets and never touch production Supabase, so that a public repo cannot leak keys through workflow logs and a push cannot write production data.
6. As Dinh, I want CI to use the same bun version the repo pins, so that a CI failure means a real problem, not version drift.
7. As a coding agent, I want a red CI run to name the failing workspace and task, so that I can fix it without reproducing the whole pipeline.
8. As Dinh, I want CI in place before the redesign implementation starts, so that the redesign's many screen changes land on a safety net.

**Signed release**
9. As an Android visitor, I want the APK linked from the landing page to be signed with the app's own release key, so that it is a real release, not a debug build.
10. As an Android visitor who installed the September preview, I want the release notes to tell me to uninstall the preview first, so that the signature change does not leave me stuck on an install error.
11. As an Android visitor, I want Google sign-in to work in the release APK, so that the downloaded app is usable, not just the demo.
12. As Dinh, I want the release keystore held by EAS, so that losing my laptop does not end my ability to ship updates under the same signature.
13. As Dinh, I want development builds to keep working with the debug keystore, so that the emulator loop is unchanged.
14. As Dinh, I want the landing page download link to keep working with no code change, so that the release swap is invisible to the web app.
15. As Dinh, I want the release tagged v1.0.0 and marked Latest, so that the redesign reads as the first real version.
16. As a portfolio visitor, I want release notes that say what the app does and which Android versions and architecture it supports, so that I know whether it will install on my phone.

**Lighthouse done-audit**
17. As Dinh, I want every public page (landing, privacy, and each demo page) audited on the Lighthouse mobile profile, so that the quality claim covers what a visitor sees first.
18. As Dinh, I want every signed-in page (capture, routine, spots, trends, settings) audited too, so that the claim covers the product, not just the marketing page.
19. As Dinh, I want signed-in pages audited through the existing test-account cookie helper, so that no Google login has to be automated and no new auth path is added to the app.
20. As Dinh, I want the audit's test account to own a real Photo with Spots and ZoneReadings and some RoutineEntries, so that the spots and trends pages render real content instead of an empty state that flatters the score.
21. As Dinh, I want the audit account to be separate from the E2E capture and delete-account accounts, so that the audit and the E2E specs never destroy each other's data.
22. As Dinh, I want each page measured three times and the median kept, so that mobile-profile noise does not decide pass or fail.
23. As Dinh, I want one summary table (page × Performance, Accessibility, Best Practices, SEO), so that the result is readable at a glance and can go straight into the case study.
24. As Dinh, I want the audit to run against production, so that the score reflects what visitors actually get.
25. As Dinh, I want to run the audit command myself, since it writes to production Supabase with the service role, so that no standing permission for production writes is ever added.
26. As Dinh, I want a page under 90 in any category to become a fix ticket, applying the grill rule (motion loads after LCP, any effect still pulling the score under 90 is cut), so that the gate is enforced rather than just reported.

**Real-phone QA**
27. As Dinh, I want the QA checklist updated to the redesigned screens and navigation before the run, so that it does not test screens that no longer exist.
28. As Dinh, I want QA run against the release-signed APK on a real Android phone, so that signing, sign-in and camera are all proven on the build visitors will download.
29. As Dinh, I want Claude to drive everything it can over adb (installs, logcat, Maestro flows, screenshots), so that I only handle what needs a person: holding the phone for capture and picking a Google account.
30. As Dinh, I want the existing Maestro flows (capture, mark spots, routine checklist, trends) run on the phone as part of QA, so that the automated coverage we already have is exercised on real hardware.
31. As Dinh, I want each checklist line recorded ✅/❌ with a note in place, so that the run is auditable later.
32. As Dinh, I want crash, data-loss, sign-in and save failures fixed before the release is published, and every other ❌ logged as a known limitation, so that QA ends in a clear go or no-go.

## Implementation Decisions

**CI**
- One GitHub Actions workflow on the skinsense-v2 repo, triggered by pushes and pull requests to `main`.
- It runs exactly the root `typecheck` and `test` scripts (Turborepo across web, mobile, domain and mpbench). No lint, no Playwright E2E, no Maestro, no Lighthouse in CI. The seam is the existing root scripts; no new test entry point is added.
- bun is pinned to the version in the root `packageManager` field (1.4.0), with a frozen-lockfile install. Node is pinned to 26.x, the version the fresh-clone run below used. Vercel builds on 24.x but never runs the tests.
- A fresh clone lacks one gitignored generated file that typecheck needs. Verified 2026-09-14 on a fresh clone with bun 1.4.0 and Node 26.8.2: install and `test` pass uncached (domain 66, web 21, mobile 22 tests), but mobile `typecheck` fails with TS2307 (CSS module) and TS2882 (`global.css`) because the Expo type-reference file (a single `/// <reference types="expo/types" />` line, normally written by `expo start`) is missing. Writing that one line before typecheck makes all four workspaces pass. The web route types and `next-env.d.ts` are generated by the web typecheck script itself.
- No repository secrets. `typecheck` and `test` need no env vars and make no network or Supabase calls.
- The local Stop hook stays as it is; CI adds to it rather than replacing it.

**Signed release**
- Keystore: EAS-managed Android release keystore for the `production` build profile, which already exists: APK, arm64-v8a only, auto-incremented versionCode with the remote version source. Development and preview builds keep the debug keystore.
- Google sign-in: the release keystore's SHA-1 is registered for package `com.dinh144.skinsense` in Google Cloud next to the existing debug fingerprint, which stays for dev builds. This step is Dinh's hands in Google Cloud Console, or Claude in Chrome with Dinh watching; it is not an agent step. The mobile app keeps passing the web client ID to Google Sign-In unchanged.
- Release home: the existing public `dinh144/skinsense-releases` repo stays the only place APKs are published. The landing page links to the latest release asset by a fixed name, so the v1.0.0 asset keeps that name and nothing in the web app changes.
- Release v1.0.0 is the first release-signed APK and the first release after the redesign. The "Preview (2026-09-14)" release stays up unchanged. The v1.0.0 notes say to uninstall the preview first, because a different signature cannot update in place.
- Publish order: build the release-signed APK → real-phone QA passes → publish v1.0.0 as Latest.
- EAS CLI is authenticated on this machine (verified 2026-09-14), so an agent can run the builds. Generating the release keystore the first time is an interactive EAS prompt, so that one step runs in Dinh's visible terminal (with `!`), like the SHA-1 registration.

**Lighthouse done-audit**
- Runs once, when the redesign has shipped on web and Android. It is not a CI gate.
- Target: the production deployment. Lighthouse default mobile profile, all four categories, three runs per page, median score kept. Pass means every page is at least 90 in every category.
- Pages: public `/`, `/privacy`, `/demo/routine`, `/demo/spots/<photo>`, `/demo/trends`; signed-in `/app/capture`, `/app/routine`, `/app/spots/<photo>`, `/app/trends`, `/app/settings`, plus any page the redesign adds. The API cron route is excluded.
- Sign-in reuses the existing E2E helper that creates a confirmed test user through the service-role admin client, redeems a magic-link token through the same SSR cookie writer the app uses, and returns session cookies. Those cookies are passed to Lighthouse as request headers for the signed-in pages only. Public pages are audited with no cookie, because a signed-in session is redirected from `/` to `/app` and the landing audit would measure a redirect. The app gets no new auth path, and Google-only sign-in stays true for real users.
- A dedicated audit account, separate from the capture and delete-account E2E accounts, is seeded before the run with at least one Photo (with a real image object in storage), its five ZoneReadings, some Spots and a few RoutineEntries, so that the signed-in pages render populated states.
- The audit command needs the service-role key locally and writes to production. Dinh runs it with `!`, and no permission rule is added.
- Output: one summary table in this feature folder. Raw Lighthouse reports are not committed. Any page below 90 becomes a fix ticket under the grill rule: motion libraries (R3F, GSAP, Lenis) load after LCP, and an effect that still keeps a page under 90 is cut.

**Real-phone QA**
- The existing Android QA checklist (written for v1, 93 lines, Vietnamese, per-section tables with ✅/❌ and notes) is updated to the redesigned screens before the run. Lines for removed screens are deleted, new screens get lines, and the format stays the same.
- The run uses the release-signed v1.0.0 APK on a real Android phone set to Vietnamese. Claude drives adb (install, logcat, screenshots) and runs the four Maestro flows on the device. Dinh handles face capture and Google account selection.
- Go/no-go: crashes, data loss, sign-in failures and save failures block the release and get fixed first. Every other ❌ gets one line in a known-limitations list in this feature folder and ships.

## Testing Decisions

- A good test here checks an observable outcome: a CI run's pass or fail on GitHub, the release APK's signing certificate, a successful Google sign-in on the installed release build, and Lighthouse scores on production pages. It never inspects how the workflow or scripts are written.
- CI is verified twice: `main` shows a passing run, and a throwaway branch with a deliberate type error and, separately, a failing assertion shows a failing run naming the right workspace. The branch is then deleted.
- Signing is verified by reading the APK's signer certificate. It must match the EAS release keystore, not the debug one. After that, Google sign-in must succeed on that exact APK on a real phone; it is the QA checklist's sign-in lines.
- The Lighthouse audit script is a measurement tool with no unit tests of its own. It is verified by one signed-in page reporting an authenticated render (not a redirect to `/`) before the full run counts.
- No new unit or E2E tests are added by this spec. The gates exercise the existing suites.
- Prior art: the web E2E specs that run against a deployment via a base-URL env var and sign in with the test-account cookie helper; the delete-account spec's pattern of giving each spec its own account and seeding a Photo with a storage object; the four Maestro flows; the v1 Android QA checklist and its known-limitations rule.

## Out of Scope

- Google Play in any form: developer account, closed testing, store listing, Data safety, the Health apps declaration, target-API work for Play.
- The redesign itself: variant choice, DESIGN.md, shared tokens, screen implementation. That gets its own spec.
- The English case study, the English README and making skinsense-v2 public (done-criterion 2).
- Lint, Playwright E2E, Maestro and Lighthouse inside CI.
- Crash reporting, analytics, a terms-of-service page, a web-only account-deletion request page, a real contact email.
- Registering for Android developer verification. It is not enforced in Vietnam (first wave 2026-09-30: Brazil, Indonesia, Singapore, Thailand); it is revisited when Google sets a global date.
- A desktop Lighthouse profile, iPhone and Safari.
- Moving or archiving `dinh144/skinsense-releases`.

## Further Notes

- **Amends the 19:30 grill.** That grill said the APK ships "via GitHub Releases once the repo is public". `/to-spec` found that the landing page already links to the public `dinh144/skinsense-releases` repo (created 2026-09-13, one "Preview (2026-09-14)" release, debug-signed). Dinh chose to keep that repo, and the keystore switch happens at the first release after the redesign, not at the moment skinsense-v2 goes public.
- **Human steps**, so `/to-tickets` should label those tickets `ready-for-human` or split them: generating the release keystore (interactive EAS prompt); registering the release SHA-1 in Google Cloud Console; running the Lighthouse audit command (production writes with the service role); the phone-in-hand part of QA.
- **Suggested ticket dependencies:** CI has none (sequenced after the prototypes). The release-signed APK build is blocked by the redesign shipping. The QA checklist refresh is blocked by the redesign shipping. The QA run is blocked by the release-signed APK and the checklist refresh. Publishing v1.0.0 is blocked by the QA run. The Lighthouse audit is blocked by the redesign shipping on production.
- The gates close done-criterion 3 only. The pause on other efforts ends when criteria 1, 2 and 3 are all met.
