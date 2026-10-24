# .scratch index

Audited 2026-10-17 against the code, tests (next to the code, `apps/mobile/flows`, `apps/web/e2e`) and `git log`. Statuses: done, ready-for-agent, ready-for-human, wontfix, superseded. A ticket is done only with evidence; open tickets carry a `Left:` line. Each ticket file ends with an `## Audit 2026-10-17` section.

## Skin diary v1 (the 2026-09 build)

Folder: `skin-diary-v1/`. Also in the folder: spec.md, known-limitations.md, qa-android-checklist.md, design/, issues/01-wizard.sh (setup helper, not a ticket).

| Ticket | Title | Status | Evidence / left |
|---|---|---|---|
| [01a](skin-diary-v1/issues/01a-oauth-supabase-provisioning.md) | 01a: Provision Supabase + Google OAuth (web side) | done | Was resolved: Supabase project, private photos bucket and Google web client exist (supabase/functions/delete-account, drizzle/0000_init.sql, production deploy). Owner-specific, rebuilt by the recipient via handoff-completion 15. |
| [01b](skin-diary-v1/issues/01b-android-oauth-client.md) | 01b: Android OAuth client | done | Was resolved: Google sign-in on Android (commit fd33615, eccfe6e); apps/mobile/src/app/sign-in.tsx. |
| [02](skin-diary-v1/issues/02-domain-redness-zone-computation.md) | 02: Domain — redness/zone computation + synthetic-pipeline test | done | packages/domain redness.ts, zones.ts, geometry.ts with redness.test.ts, zones.test.ts, geometry.test.ts (commit 1d5d42c). The one open box is out of scope by the ticket's own words. |
| [03](skin-diary-v1/issues/03-auth-session-schema.md) | 03: Auth wiring + session + schema/migration tooling (web + mobile) | ready-for-agent | Auth and schema shipped: google-sign-in.test.tsx, apps/mobile/src/lib/auth.ts, schema.test.ts, drizzle migrations 0000-0004 (commit 2413e0c). Left: Two-account RLS smoke test: no spec for it in apps/web/e2e. Covered by handoff-completion 15 (backend from zero, seed user); add the spec there. |
| [04](skin-diary-v1/issues/04-web-routine-checklist.md) | 04: Web — routine checklist | done | Commit c6f1858; routine-checklist.test.tsx (rename, tick snapshots labels) and domain routine.test.ts. Canvas-match box is superseded by redesign-build 03 (commit 09c8a4b). |
| [05](skin-diary-v1/issues/05-mobile-routine-checklist.md) | 05: Mobile — routine checklist | done | Commit 7e5447f, then redesigned by redesign-build 03 (09c8a4b); mobile routine-checklist.test.tsx; apps/mobile/flows/routine-checklist.yaml. |
| [06](skin-diary-v1/issues/06-web-landing-hero.md) | 06: Web — landing page + 3D hero | done | Commit 99e5f15; apps/web landing.test.tsx; visuals superseded by redesign-build 10 and 11. |
| [07](skin-diary-v1/issues/07-web-capture.md) | 07: Web — guided capture → Photo/ZoneReading | done | Commit 8863443; apps/web/e2e/capture.spec.ts; web capture.test.tsx; domain capture-quality.test.ts (c0cc7d5). |
| [08](skin-diary-v1/issues/08-mobile-capture.md) | 08: Mobile — guided capture → Photo/ZoneReading | superseded (by redesign-build 05) | Shipped in commit 8c02250 and rebuilt in redesign-build 05 (646ccff); mobile capture.test.tsx and capture-engine.test.ts; flows/capture.yaml. Remaining boxes (Maestro sign-in to save, adapter diff) are covered by flows/capture.yaml and production-readiness 09. |
| [09](skin-diary-v1/issues/09-web-mark-spots.md) | 09: Web — mark spots on photo | done | Commit 16e711b; web mark-spots.test.tsx; spots step in e2e/capture.spec.ts; redesigned in redesign-build 06. |
| [10](skin-diary-v1/issues/10-mobile-mark-spots.md) | 10: Mobile — mark spots on photo | superseded (by redesign-build 06) | Shipped in 351a5c2, rebuilt in 5631735; mobile mark-spots.test.tsx; flows/mark-spots.yaml. |
| [11](skin-diary-v1/issues/11-account-deletion-privacy.md) | 11: Account deletion + privacy page (web + mobile) | done | Commit 84c19e8; supabase/functions/delete-account; apps/web/e2e/delete-account.spec.ts; /privacy page; refined by redesign-build 09 and 12. |
| [12](skin-diary-v1/issues/12-web-trends.md) | 12: Web — trends | superseded (by redesign-build 07) | Shipped in ca91028, rebuilt in 51f192b; web trends.test.tsx; trends step in e2e/capture.spec.ts. |
| [13](skin-diary-v1/issues/13-mobile-trends.md) | 13: Mobile — trends | superseded (by redesign-build 07) | Shipped in 4344751, rebuilt in 51f192b; mobile trends.test.tsx; flows/trends.yaml. |
| [14](skin-diary-v1/issues/14-supabase-keepalive-cron.md) | 14: Supabase keep-alive cron | ready-for-human | Code exists: apps/web/vercel.json cron and apps/web/src/app/api/cron/ping/route.ts (commit 84c19e8). Left: Check on the deployed project that the cron ran. That is the recipient's Vercel project; covered by the keep-alive step in handoff-completion 19 and the launch checklist 22. |
| [15](skin-diary-v1/issues/15-fixture-acceptance-test.md) | 15: Domain — fixture-based acceptance-bar test (ADR 0003) | wontfix | Closed by decision: the real-skin fixture test was dropped (ADR 0003 Addendum 5, commit 0d21829). |
| [16](skin-diary-v1/issues/16-agy-android-qa-checklist.md) | 16: Android manual-QA checklist from spec.md | done | .scratch/skin-diary-v1/qa-android-checklist.md written (commit e28da31). Refresh for the redesign is tracked in portfolio-release-gates 04. |
| [17](skin-diary-v1/issues/17-live-redness-mode.md) | 17: mpbench — live redness mode (spike) | superseded (by production-readiness 08) | `bun run live` exists in mpbench/package.json (commit 548de49); it is dev tooling for the dropped fixture series (ADR 0003 Addendum 5). Nothing further needed. |
| [18](skin-diary-v1/issues/18-native-capture-spike.md) | 18: Native capture spike (ML Kit landmarks + first EAS build) | done | Commits 548de49 and 8c02250; EAS builds recorded in the ticket; apps/mobile/src/lib/capture-engine.test.ts. Spike is complete; production capture is redesign-build 05. |
| [19](skin-diary-v1/issues/19-uptime-check-workflow.md) | 19: Daily uptime check workflow | wontfix | No .github/workflows/uptime.yml exists; the workflow would curl the owner's production URL and releases repo, which handoff-completion 16 removes from the code. Not worth adding for a recipient. |

## Skin diary v2 polish

Folder: `skin-diary-v2-polish/`. Also: spec.md, grill-2026-09-14.md, design/.

| Ticket | Title | Status | Evidence / left |
|---|---|---|---|
| [01](skin-diary-v2-polish/issues/01-copy-rules-apk-banner.md) | 01: Copy rules + phone-browser "dùng APK" banner | done | Commit 2cc6c96; "Chỉ số mẩn đỏ" copy rule and phone-browser APK banner (capture.test.tsx). The Vercel-deploy box was an owner step, now moot. |
| [02](skin-diary-v2-polish/issues/02-hero-loop-icon-seo.md) | 02: Hero auto-loop, app icon + splash, SEO + Open Graph | done | Commit 7e4fd54 (hero loop, monogram icon, splash, SEO, Open Graph: apps/web/src/app/opengraph-image.png, icon.svg). Replaced by the redesign brand set in redesign-build 23. |
| [03](skin-diary-v2-polish/issues/03-landing-sections.md) | 03: Landing sections, VI/EN switch, FAQ, APK QR | superseded (by redesign-build 10) | Commit 071ca84 shipped it; the landing was rebuilt in redesign-build 10 (672d8b0), landing.test.tsx. |
| [04](skin-diary-v2-polish/issues/04-web-shell-today-settings.md) | 04: Web app shell + Hôm nay + Cài đặt, streaks | done | Commit ee9e039; web app shell, Hôm nay with streaks, Cài đặt; today.test.tsx, settings.test.tsx, domain streak.test.ts. Redesigned in redesign-build 02, 04, 09. |
| [05](skin-diary-v2-polish/issues/05-web-demo-core.md) | 05: Web demo without sign-in | done | Commit 5290135; apps/web/src/app/demo; domain demo.ts with demo.test.ts; web lib/demo.test.ts. |
| [06](skin-diary-v2-polish/issues/06-android-tabs-today-settings.md) | 06: Android tabs + Hôm nay + Cài đặt + fonts | done | Was done: commit 4fc332c; mobile tabs.test.tsx, today.test.tsx, settings.test.tsx. Redesigned in redesign-build 02, 04, 09. |
| [07](skin-diary-v2-polish/issues/07-post-cut-polish-demo-extras.md) | 07: Post-cut polish, demo extras, dark mode, Xem thử, project page, onboarding | superseded (by redesign-build 08, 13, 12, 01) | Rows 10-16 shipped (commits 58ae194, eacc168, ec5ea50, b6352ff, 82ba200, eec2825, af94ab7). Rows 17-21 live on in redesign-build: dark mode in 01, Android Xem thử in 08 (still open), project page in 12, onboarding in 13; row 21 (demo webcam) was not built and is dropped. |
| [08](skin-diary-v2-polish/issues/08-long-tail.md) | 08: Long tail — timeline, feedback, import, PWA, demo extras, library, exports, reminders, Android extras | superseded (by redesign-build 14-23) | Rows with a redesign ticket: timeline 14, feedback 20, biometric lock 22, share card 17, export 19, reminders 18, Android extras 21. The other rows (PWA, presentation mode, pipeline replay, changelog, one-hand mode, personas, library, quick tile, widget, gallery import, new-APK notice) have no ticket and are dropped. |
| [09](skin-diary-v2-polish/issues/09-recording-testing.md) | 09: Screen recording + testing | wontfix | The 15-20 Sep submission window is over. Test intent now lives in per-screen tests, apps/web/e2e specs and apps/mobile/flows; the screen recording was never made and is not required by the handoff spec. |
| [10](skin-diary-v2-polish/issues/10-submission.md) | 10: Fixed submission step | superseded (by portfolio-release-gates 03, 06) | Submitted 2026-09-20 (AGENTS.md). The owner-specific steps (release APK, owner's releases repo, public flip) are replaced by the signed release pipeline in portfolio-release-gates 03 and 06; the privacy-contact change (src still contains no hi@gmail.com, grep found none) is handled by handoff-completion 16. |

## Production readiness (domain decisions and research)

Folder: `production-readiness/`. Also: map.md.

| Ticket | Title | Status | Evidence / left |
|---|---|---|---|
| [01](production-readiness/issues/01-redness-validation-bar-research.md) | Redness-index validation bar: research | done | Research resolved; bar recorded in ADR 0003 (docs/adr/0003-redness-index-acceptance-bar.md, commit 60eba7d). |
| [02](production-readiness/issues/02-redness-acceptance-bar-decision.md) | Redness-index acceptance bar: decision | done | Decision recorded in ADR 0003 and its addenda (docs/adr/0003-redness-index-acceptance-bar.md). |
| [03](production-readiness/issues/03-domain-input-boundary.md) | Domain package input boundary: landmarks+mask vs pre-built polygons | done | Decision recorded in ADR 0001 (docs/adr/0001-domain-package-receives-landmarks-and-mask.md); packages/domain/src/capture.ts and zones.ts take landmarks+mask. |
| [04](production-readiness/issues/04-domain-schema-ownership.md) | Domain package schema ownership: logic schema vs Supabase DB schema | done | Decision recorded in ADR 0002 (docs/adr/0002-domain-owns-db-schema.md); packages/domain/src/schema.ts, schema.test.ts, drizzle/0000_init.sql. |
| [05](production-readiness/issues/05-landmark-mask-wire-format.md) | Landmark + mask wire format: what crosses the platform boundary into domain | done | Wire format implemented in packages/domain/src/capture.ts (capture.test.ts) and used by both capture-engine files. |
| [06](production-readiness/issues/06-zone-landmark-index-map-research.md) | Zone-to-landmark index map: research | done | Index map implemented in packages/domain/src/zones.ts with zones.test.ts (commit 1d5d42c). |
| [07](production-readiness/issues/07-mask-resolution-alignment-spike.md) | Mask resolution and landmark alignment: verification spike | done | Spike resolved; mask and landmark alignment covered by capture-engine.test.ts (mobile) and capture.test.ts (domain). |
| [08](production-readiness/issues/08-mpbench-fixture-harness.md) | mpbench fixture-generation harness: build | done | mpbench harness exists (mpbench/run.ts, commit d0b2b88; `bun run live` added in 548de49). |
| [09](production-readiness/issues/09-native-adapter-verification.md) | Native capture adapter: verify against web's known-good output | done | apps/mobile/src/lib/capture-engine.test.ts; native capture in commit 8c02250; Maestro flows/capture.yaml. |
| [10](production-readiness/issues/10-routine-checklist-decision.md) | Routine checklist contents: decision | done | ADR 0004 (docs/adr/0004-routine-checklist-user-customizable.md); packages/domain/src/routine.ts with routine.test.ts. |
| [11](production-readiness/issues/11-fixture-consuming-test.md) | ADR 0003 acceptance-bar test: consume mpbench's fixtures | done | Test written in e28da31; the real-skin fixture test was dropped by decision (ADR 0003 Addendum 5, commit 0d21829), so the ticket is closed by decision, not by a running test. |

## Redesign build (canvas C3)

Folder: `redesign-build/`. Also: spec.md. Design sources live in .scratch/skinsense-redesign/ (canvases, grill notes, brand folder); it has no tickets.

| Ticket | Title | Status | Evidence / left |
|---|---|---|---|
| [01](redesign-build/issues/01-token-theme-and-fonts.md) | 01: Token theme and fonts on both apps | done | Commit fcb93ea (tokens wired into web and Android); packages/tokens; apps/mobile themed-text.test.tsx. |
| [02](redesign-build/issues/02-app-shell.md) | 02: App shell (web sidebar, phone tab bar, Android tab bar) | done | Commit 29b3314; apps/web app-nav.test.tsx; apps/mobile tabs.test.tsx. |
| [03](redesign-build/issues/03-routine.md) | 03: Routine | done | Commit 09c8a4b; routine-checklist.test.tsx on web and mobile; apps/mobile/flows/routine-checklist.yaml. |
| [04](redesign-build/issues/04-hom-nay.md) | 04: Hôm nay | done | Commit 5d2e892; today.test.tsx on web and mobile. |
| [05](redesign-build/issues/05-chup.md) | 05: Chụp | done | Commit 646ccff; capture.test.tsx on web and mobile; apps/web/e2e/capture.spec.ts; apps/mobile/flows/capture.yaml. |
| [06](redesign-build/issues/06-danh-dau-not-mun.md) | 06: Đánh dấu nốt mụn | done | Commit 5631735; mark-spots.test.tsx on web and mobile; flows/mark-spots.yaml; spots step in e2e/capture.spec.ts. |
| [07](redesign-build/issues/07-xu-huong.md) | 07: Xu hướng | done | Commit 51f192b; trends.test.tsx on web and mobile; apps/mobile/flows/trends.yaml; trends step in e2e/capture.spec.ts. |
| [08](redesign-build/issues/08-sign-in-and-xem-thu.md) | 08: Android sign-in and Xem thử on both apps | ready-for-agent | Web half exists: demo routes under apps/web/src/app/demo, demo-banner.tsx, google-sign-in.test.tsx. Left: Android Xem thử (no demo mode anywhere under apps/mobile/src), its entry on the sign-in screen, the Android banner, the sign-in and banner screen tests, the Playwright banner-reset spec. Covered by handoff-completion 04. |
| [09](redesign-build/issues/09-cai-dat-and-delete-account.md) | 09: Cài đặt and delete account | done | Commit 0f653c9; settings.test.tsx on web and mobile; apps/web/e2e/delete-account.spec.ts. |
| [10](redesign-build/issues/10-landing-sections.md) | 10: Landing sections | done | Commits 672d8b0 and a053f2b; apps/web/src/components/landing.test.tsx. |
| [11](redesign-build/issues/11-landing-scroll-stage.md) | 11: Landing scroll stage and particle face | done | Commit 12bbe58 plus fixes 289a59f and c49989c; stage/stage-scenes.test.ts and face/face-scenes.test.ts. |
| [12](redesign-build/issues/12-case-study-privacy-404.md) | 12: /case-study, /privacy and 404 | done | Commits 155baa1 and 9b16554; apps/web/e2e/case-study.spec.ts; /privacy and not-found.tsx exist. |
| [13](redesign-build/issues/13-onboarding.md) | 13: Onboarding | done | Commit 5c01f7c (+ fixes 90cc1f0, 52866e3); onboarding.test.tsx on web and mobile; e2e/onboarding.spec.ts; flows/onboarding.yaml. |
| [14](redesign-build/issues/14-photo-history-and-detail.md) | 14: Photo history, Photo detail and delete Photo | done | Commits 439e692 and 1d99516; photo-history.test.tsx and photo-detail.test.tsx on both apps; e2e/photo-history.spec.ts; flows/history.yaml. |
| [15](redesign-build/issues/15-notes-and-tags.md) | 15: Notes and Tags | done | Commits cd24fa1 and 7342914; packages/domain notes.test.ts; e2e/photo-notes.spec.ts; flows/history-filter.yaml; drizzle/0004_notes_and_tags.sql. |
| [16](redesign-build/issues/16-choose-two-dates.md) | 16: Choose two dates to compare | done | Commit 97a3378; packages/domain compare.test.ts; apps/web/e2e/compare-dates.spec.ts. |
| [17](redesign-build/issues/17-share-before-after.md) | 17: Share before/after image | ready-for-agent | No share-image code in either app (no expo-sharing, no canvas export, no share entry points). Left: Whole ticket: before/after image, eye blur, switches, share sheet and web download. Covered by handoff-completion 08. |
| [18](redesign-build/issues/18-evening-reminder-android.md) | 18: Evening reminder (Android) | done | Commit c8f5775; mobile reminder.test.tsx; packages/domain reminder.test.ts; apps/mobile/flows/reminder.yaml. |
| [19](redesign-build/issues/19-export.md) | 19: Export | ready-for-agent | No export code on either app; the export row in settings.tsx is only a comment. Left: Whole ticket: data export on web and Android. Covered by handoff-completion 08. |
| [20](redesign-build/issues/20-feedback.md) | 20: Feedback | done | Commits 4f6a92e and 7428147; feedback.test.tsx on both apps; domain feedback.test.ts; e2e/feedback.spec.ts; flows/feedback.yaml; drizzle/0003_feedback.sql. |
| [21](redesign-build/issues/21-about-and-licenses-android.md) | 21: About and licenses (Android) | done | Commit 3e95231; mobile about.test.tsx and licenses.test.ts (apps/mobile/src/lib/licenses.json). |
| [22](redesign-build/issues/22-biometric-lock-android.md) | 22: Biometric lock (Android) | ready-for-agent | No biometric dependency in apps/mobile/package.json and no lock toggle in settings.tsx. Left: Whole ticket: lock toggle, prompt on open, no-biometrics fallback. Covered by handoff-completion 07. |
| [23](redesign-build/issues/23-brand-assets.md) | 23: Brand assets | ready-for-agent | Only the v2 monogram assets exist (apps/mobile/assets/images/icon.png etc., apps/web/src/app/icon.svg, opengraph-image.png from commit 7e4fd54); no web manifest in apps/web/public. Left: Icon, adaptive and themed icons, light/dark splash, favicon set, manifest, OG image from the redesign logo mark. Covered by handoff-completion 09. |

## Portfolio release gates

Folder: `portfolio-release-gates/`. Also: spec.md.

| Ticket | Title | Status | Evidence / left |
|---|---|---|---|
| [01](portfolio-release-gates/issues/01-ci-github-actions.md) | 01: CI on GitHub Actions | done | .github/workflows/ci.yml runs on push and pull_request to main: bun 1.4.0 frozen install, Node 26.x, expo-env line, then `bun run typecheck` and `bun run test` (commit bfed721; green run 34882674199 per the ticket). The optional failing-probe branch check was never run and is accepted as unrun. |
| [02](portfolio-release-gates/issues/02-release-keystore-sha1.md) | 02: Release keystore in EAS + SHA-1 registered for Google sign-in | ready-for-human | Not started: eas.json has a production profile (buildType apk) but no release keystore or registered SHA-1 exists in the repo. Left: Release keystore and its SHA-1 in Google Cloud need the owner's (later the recipient's) own accounts. Covered by handoff-completion 12 (runbook) and 22 (launch checklist). |
| [03](portfolio-release-gates/issues/03-release-signed-apk-build.md) | 03: Release-signed v1.0.0 APK build | ready-for-agent | eas.json production profile builds an APK, but no signed v1.0.0 release has been built or documented. Left: Signed release build and runbook. Covered by handoff-completion 12. |
| [04](portfolio-release-gates/issues/04-qa-checklist-refresh.md) | 04: Refresh the Android QA checklist for the redesigned screens | ready-for-agent | .scratch/skin-diary-v1/qa-android-checklist.md exists but predates the redesign. Left: Rewrite the checklist for the redesigned screens. Covered by handoff-completion 13. |
| [05](portfolio-release-gates/issues/05-real-phone-qa-run.md) | 05: Real-phone QA run on the release-signed APK | ready-for-human | No recorded run; needs a real phone and the signed APK. Left: Real-phone QA run. Handed over via handoff-completion 13 (checklist) and 22 (launch checklist). |
| [06](portfolio-release-gates/issues/06-publish-v1-release.md) | 06: Publish v1.0.0 to skinsense-releases | ready-for-agent | No v1.0.0 release recorded; the landing page still points at the owner's skinsense-releases repo. Left: Publish the signed APK. Covered by handoff-completion 12 and 16 (owner identities) and 22. |
| [07](portfolio-release-gates/issues/07-lighthouse-audit-script.md) | 07: Lighthouse audit script + seeded audit account | ready-for-agent | No Lighthouse script or package.json task exists in the repo. Left: Audit script and seeded account. Covered by handoff-completion 11. |
| [08](portfolio-release-gates/issues/08-lighthouse-full-audit.md) | 08: Full Lighthouse done-audit on production | ready-for-human | No full audit recorded. Left: Run on production needs live credentials. Script and runbook come from handoff-completion 11; the run itself is in 22. |

## Handoff completion (the current effort)

Folder: `handoff-completion/`. Also: spec.md, secrets-report.md if present.

| Ticket | Title | Status | Evidence / left |
|---|---|---|---|
| [01](handoff-completion/issues/01-land-in-flight-work.md) | 01: Land the in-flight work and clean the repo | done (2026-10-17) | Done; see the ticket. |
| [02](handoff-completion/issues/02-audit-ticket-truth.md) | 02: Audit every ticket against the code and rewrite the tracker's truth | done (2026-10-17) | This audit. |
| [03](handoff-completion/issues/03-redesign-foundation-shell-today.md) | 03: Redesign foundation, app shell, Hôm nay and Routine on web and Android | ready-for-agent | Open; this ticket is itself the work. |
| [04](handoff-completion/issues/04-redesign-account-surfaces.md) | 04: Sign-in with Xem thử, Cài đặt and delete-account on web and Android | ready-for-agent | Open; this ticket is itself the work. |
| [05](handoff-completion/issues/05-redesign-core-capture-spots-trends.md) | 05: Capture, spot marking and trends: every state on both platforms | ready-for-agent | Open; this ticket is itself the work. |
| [06](handoff-completion/issues/06-redesign-public-web.md) | 06: Public web: landing scroll stage, case study, privacy and 404 | ready-for-agent | Open; this ticket is itself the work. |
| [07](handoff-completion/issues/07-android-lock-about-reminder.md) | 07: Android biometric lock, about and licenses, and the evening reminder | ready-for-agent | Open; this ticket is itself the work. |
| [08](handoff-completion/issues/08-share-export-feedback.md) | 08: Share before/after, data export and feedback | ready-for-agent | Open; this ticket is itself the work. |
| [09](handoff-completion/issues/09-brand-assets.md) | 09: Brand assets on both apps | ready-for-agent | Open; this ticket is itself the work. |
| [10](handoff-completion/issues/10-final-polish-sweep.md) | 10: Final polish sweep: responsive, reduced motion and strings | ready-for-agent | Open; this ticket is itself the work. |
| [11](handoff-completion/issues/11-lighthouse-audit-script.md) | 11: Lighthouse audit script and runbook | ready-for-agent | Open; this ticket is itself the work. |
| [12](handoff-completion/issues/12-signed-release-pipeline.md) | 12: Signed release pipeline and runbook | ready-for-agent | Open; this ticket is itself the work. |
| [13](handoff-completion/issues/13-qa-checklist-refresh.md) | 13: Android QA checklist refreshed for the redesign | ready-for-agent | Open; this ticket is itself the work. |
| [14](handoff-completion/issues/14-env-example-and-demo-mode.md) | 14: Environment example and backend-free demo mode | ready-for-agent | Open; this ticket is itself the work. |
| [15](handoff-completion/issues/15-backend-from-zero.md) | 15: Backend from zero: migrations, seed data and doctor command | ready-for-agent | Open; this ticket is itself the work. |
| [16](handoff-completion/issues/16-remove-owner-identities.md) | 16: Remove the owner's identities from the code | ready-for-agent | Open; this ticket is itself the work. |
| [17](handoff-completion/issues/17-secrets-scan.md) | 17: Scan the tree and history for secrets | done (scan and report: secrets-report.md). Rotation list handed to owner: ready-for-human. | Scan and report done; rotation list is the owner's. |
| [18](handoff-completion/issues/18-decouple-claude-workflow.md) | 18: Make the repo usable without Claude | done | Done; see the ticket. |
| [19](handoff-completion/issues/19-setup-guides-and-readme.md) | 19: README and from-zero setup guides | ready-for-agent | Open; this ticket is itself the work. |
| [20](handoff-completion/issues/20-known-limits-and-dependencies.md) | 20: Known limitations and dependency notes | ready-for-agent | Open; this ticket is itself the work. |
| [21](handoff-completion/issues/21-clean-clone-dry-run-and-done-report.md) | 21: Clean-clone dry run and the done report | ready-for-agent | Open; this ticket is itself the work. |
| [22](handoff-completion/issues/22-recipient-launch-checklist.md) | 22: Recipient launch checklist | ready-for-human | Open; needs the owner or recipient. |

## Totals

| Status | Tickets |
|---|---|
| done | 50 |
| ready-for-agent | 27 |
| ready-for-human | 5 |
| superseded | 9 |
| wontfix | 3 |
| total | 94 |

## Remaining open work

Every open ticket outside handoff-completion maps to a handoff-completion ticket (03 to 22). Nothing is orphaned, with one gap closed by the audit: the v1 03 RLS smoke test was in no handoff ticket and is now written into handoff-completion 15. Handoff 03, 05, 06 and 10 cover only whole-product confirmation (all redesign tickets they name are already done); handoff 10 (polish sweep) and 14 to 21 have no older ticket behind them.

| Open ticket | Title | Status | Covered by handoff-completion |
|---|---|---|---|
| [skin-diary-v1/03](skin-diary-v1/issues/03-auth-session-schema.md) | 03: Auth wiring + session + schema/migration tooling (web + mobile) | ready-for-agent | 15 (RLS spec added by this audit) |
| [skin-diary-v1/14](skin-diary-v1/issues/14-supabase-keepalive-cron.md) | 14: Supabase keep-alive cron | ready-for-human | 19, 22 |
| [redesign-build/08](redesign-build/issues/08-sign-in-and-xem-thu.md) | 08: Android sign-in and Xem thử on both apps | ready-for-agent | 04 |
| [redesign-build/17](redesign-build/issues/17-share-before-after.md) | 17: Share before/after image | ready-for-agent | 08 |
| [redesign-build/19](redesign-build/issues/19-export.md) | 19: Export | ready-for-agent | 08 |
| [redesign-build/22](redesign-build/issues/22-biometric-lock-android.md) | 22: Biometric lock (Android) | ready-for-agent | 07 |
| [redesign-build/23](redesign-build/issues/23-brand-assets.md) | 23: Brand assets | ready-for-agent | 09 |
| [portfolio-release-gates/02](portfolio-release-gates/issues/02-release-keystore-sha1.md) | 02: Release keystore in EAS + SHA-1 registered for Google sign-in | ready-for-human | 12, 22 |
| [portfolio-release-gates/03](portfolio-release-gates/issues/03-release-signed-apk-build.md) | 03: Release-signed v1.0.0 APK build | ready-for-agent | 12 |
| [portfolio-release-gates/04](portfolio-release-gates/issues/04-qa-checklist-refresh.md) | 04: Refresh the Android QA checklist for the redesigned screens | ready-for-agent | 13 |
| [portfolio-release-gates/05](portfolio-release-gates/issues/05-real-phone-qa-run.md) | 05: Real-phone QA run on the release-signed APK | ready-for-human | 13, 22 |
| [portfolio-release-gates/06](portfolio-release-gates/issues/06-publish-v1-release.md) | 06: Publish v1.0.0 to skinsense-releases | ready-for-agent | 12, 16, 22 |
| [portfolio-release-gates/07](portfolio-release-gates/issues/07-lighthouse-audit-script.md) | 07: Lighthouse audit script + seeded audit account | ready-for-agent | 11 |
| [portfolio-release-gates/08](portfolio-release-gates/issues/08-lighthouse-full-audit.md) | 08: Full Lighthouse done-audit on production | ready-for-human | 11, 22 |

Redesign-build tickets still open: 08, 17, 19, 22, 23. Redesign-build tickets 01 to 07, 09 to 16, 18, 20, 21 are done.
