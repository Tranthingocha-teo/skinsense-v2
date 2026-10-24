# skinsense-v2: finish to 100% and hand off

Status: ready-for-agent
Decisions: owner call 2026-10-17 (this spec's `/to-spec` run): finish the redesign, pass every release gate that can be passed without the owner's accounts, and leave a repo another developer can take over without the owner, without any Claude session, without the owner's laptop, and without the owner's environment. Follow-up call the same day: the recipient will not receive the owner's `.env` files, accounts, keys or keystore, and the owner will not work with them; the recipient builds their own environment from zero, so the repo must guide them through it. Builds on [redesign-build](../redesign-build/spec.md) and [portfolio-release-gates](../portfolio-release-gates/spec.md); it does not replace them, it closes them and fixes the bookkeeping around them.

## Problem Statement

The owner is stopping work on skinsense-v2 and wants it finished, not parked. Today nobody can say what "finished" means or whether it is true:

- The ticket files lie. Most of the redesign tickets still say `ready-for-agent` although much of their code is on main or in the working tree (onboarding, notes and tags, compare dates, reminder, about, feedback, history, share and others exist in the mobile app). Older features (skin-diary-v1, skin-diary-v2-polish) still carry `claimed`, `in-review` and `ready-for-agent` states for work that shipped on 2026-09-20. A newcomer cannot tell what is done from the tracker.
- The recipient starts with nothing: no `.env`, no Supabase project, no Google OAuth client, no Vercel or EAS account, no keystore, no Android SDK. Today the app cannot run for anyone but the owner, and the owner will not be there to explain.
- There is unfinished and uncommitted work: about two dozen modified files across the mobile app and the domain package (onboarding, the evening reminder, settings, locale strings, app config), and a local branch that trails `origin/main`.
- The redesign is only partly confirmed on both platforms. Unlanded or unconfirmed: the token foundation and app shell as a verified whole, Hôm nay, the sign-in and "Xem thử" flow, Cài đặt and delete-account, the landing scroll stage, the live/phone-browser details, the biometric lock, the brand assets, the share and export features.
- The release gates are open: CI exists but the signed release APK, the refreshed QA checklist, the real-phone QA run, the published release and the Lighthouse audit (script and full run) are not done.
- Knowledge lives in the owner's head and in a Claude-specific workflow: slash commands, a model alias, agent hand-offs, local-only `.claude/skills`, a local `.env.local`, Supabase, Vercel, EAS and Google OAuth accounts owned by one person, and an Android SDK path set in a shell profile. A new developer would be stuck on day one.

## Solution

One finishing effort in three parts, ending with an explicit definition of done that a stranger can verify:

1. **Truth and cleanup.** Reconcile every ticket against the code and the test suite, set each status to what is true, commit or finish the in-flight work, and retire dead and duplicate tickets so the tracker lists only real remaining work.
2. **Finish the product.** Complete every remaining redesign ticket on web and Android, then the release gates: signed v1.0.0 APK, refreshed real-phone QA, Lighthouse at least 90 in all four categories on every page, CI green on main.
3. **Handoff.** A repo that stands alone and bootstraps from zero: a README and step-by-step guides that take a new developer with no credentials from clone to a running web app and Android app on their own free-tier accounts, then to their own signed release; a register of every external service the app needs and what to create in each; scripted or committed setup (database schema and policies, storage bucket, auth config, seed or test data) so nothing has to be copied from the owner's projects; the architecture and decisions in plain files; known limitations and what is deliberately out; and a final "done" report.

"100%" means: nothing in the tracker is open except items deferred in a written list or labelled `ready-for-human` for the recipient (steps that need their own accounts, hardware or production credentials, each with a runbook); the root typecheck and test commands and CI pass from a fresh clone with no secrets; every gate that does not need credentials has recorded evidence, and every gate that does (signed release, production Lighthouse, real-phone QA) ships as a tested script or runbook the recipient can run; and a new developer following only the handoff documents, with no help from the owner, can create the backend, run, test, build and release the app.

## User Stories

**Truth and cleanup**
1. As the owner, I want every ticket's status to match the code, so that I can see in one place what is truly left.
2. As a new developer, I want the tracker to contain only live work, so that I am not misled by stale `claimed` or `in-review` tickets.
3. As the owner, I want the uncommitted onboarding, reminder, settings and locale work finished or reverted deliberately, so that no half-done change is lost or shipped by accident.
4. As the owner, I want main up to date with `origin/main` and the stale branch and worktree removed, so that the repo has one obvious line of history.
5. As a new developer, I want tickets that were abandoned or superseded closed with a one-line reason, so that I do not redo rejected ideas.
6. As the owner, I want each reconciled ticket to cite the evidence (test, screen, commit) for its status, so that the audit can be trusted and re-checked.
7. As a new developer, I want a single index of all features with their status, so that I can navigate the `.scratch` history.

**Product completion**
8. As a web visitor, I want every redesigned page (landing with scroll stage, privacy, case study, 404, demo, signed-in app) to match the design and work down to 390px, so that the site looks finished on any screen.
9. As an Android user, I want every redesigned screen (sign-in with "Xem thử", Hôm nay, Chụp, Đánh dấu nốt mụn, Xu hướng, Routine, Cài đặt) to match the design with all drawn states, so that the app feels complete.
10. As a user, I want onboarding, photo history and detail, notes and tags, choosing two dates, and sharing a before/after image to work end to end, so that the promised features exist.
11. As an Android user, I want the evening reminder, export, feedback, about and licenses, and the biometric lock to work, so that the settings list contains no dead entries.
12. As a user, I want deleting my account to be a custom dialog with deleting and error states and to remove my data completely, so that privacy claims are true.
13. As a user, I want camera-denied, low-light, no-face, network-error, empty and loading states everywhere, so that I am never left on a blank screen.
14. As a user with reduced-motion on, I want motion switched off as the design says, so that the app is comfortable.
15. As a visitor, I want the brand icon, splash, favicon set and share image to come from the logo mark on both apps, so that the product looks branded.
16. As a bilingual user, I want Vietnamese and English strings complete on both apps, so that no key is missing or untranslated.

**Release gates**
17. As an Android visitor, I want the APK linked from the landing page to be signed with a release key and published as v1.0.0, so that it is a real release.
18. As the owner, I want Google sign-in to work in the release APK, so that the downloaded app is usable.
19. As a new developer, I want CI to run typecheck and tests on every push and pull request from a fresh clone with no secrets, so that regressions show on GitHub.
20. As a visitor, I want every web page, public and signed-in, to score at least 90 on all four Lighthouse mobile categories, so that the quality claim has numbers behind it.
21. As the owner, I want the full Android QA checklist run on a real phone against the release APK, so that the first release has been exercised.
22. As the owner, I want QA failures that are not crashes, data loss, sign-in or save failures recorded as known limitations, so that the release is not blocked by cosmetic issues.

**Handoff**
23. As a new developer, I want a README that takes me from `git clone` to running the web app and the Android app, so that I am productive on day one.
24. As a new developer with no `.env`, I want a committed `.env.example` listing every variable with what it is, where to get it and whether it is public or secret, so that I can create my own without asking anyone.
25. As a new developer, I want a register of every external service the app needs (Supabase, Google Cloud OAuth, Vercel, EAS and a release keystore, a GitHub releases repo, optional domain), with what to create in each and the free-tier limits, so that I can stand up my own copy.
26. As a new developer, I want a step-by-step guide to create my own Supabase project and apply the schema, row-level security policies, storage bucket and auth settings from the repo, so that the backend matches what the app expects.
27. As a new developer, I want a guide to create the Google OAuth clients for web and Android (including the SHA-1 of my own keystore) and wire them into Supabase and the app, so that Google sign-in works for me.
28. As a new developer, I want a command that seeds a test user, a sample photo with spots and some routine entries, so that I can see every screen with data without using real photos.
29. As a new developer, I want a guide to deploy the web app to my own Vercel project, set its environment variables and run the keep-alive job, so that I have a live site.
30. As a new developer, I want a guide to create my own release keystore under EAS, build a signed APK, and update the download link and release repo references, so that I can ship under my own identity.
31. As a new developer, I want every place that hard-codes the owner's identities (project URLs, bundle id, repo names, download links, emails) to be configurable or listed, so that I can rebrand to my accounts without hunting.
32. As a new developer, I want a doctor command that checks my machine and environment (tools, versions, env variables present, Supabase reachable, schema applied), so that setup mistakes are reported clearly.
33. As a new developer, I want to run the tests, typecheck and the web app in a demo mode that needs no backend and no secrets, so that I can evaluate the code before creating any accounts.
34. As a new developer, I want the release procedure written step by step (version, build, sign, upload, tag, verify), so that I can ship an update.
35. As a new developer, I want the architecture and every decision (ADRs, research notes) discoverable from the README, so that I understand why things are the way they are.
36. As a new developer, I want the Claude-specific workflow either removed from the required path or clearly marked optional, so that I can work with plain tools.
37. As a new developer, I want local-only files (project skills, `.env.local`, shell aliases, SDK paths) replaced by committed instructions or example files, so that nothing needed is missing from the clone.
38. As the new owner, I want secrets absent from the repository and its history, so that handing it over leaks nothing.
39. As a new developer, I want a list of known limitations and deliberately out-of-scope items, so that I know what is not a bug.
40. As a new developer, I want a final done report with the evidence for each gate (CI run, Lighthouse table, QA record, release link), so that I can verify the handoff claim.
41. As the owner, I want the keep-alive and uptime jobs documented with how to restart them, so that the free-tier backend does not silently pause.
42. As a new developer, I want the dependency and patch situation (the patched camera library, version pins) explained, so that upgrades do not surprise me.

## Implementation Decisions

- **Tracker.** Work stays in the repo's local-markdown tracker. This spec lives in its own feature folder; its tickets are the new top-level plan and point at the older feature folders instead of copying them. Older folders keep their history but get an index and truthful statuses.
- **Status audit rule.** A ticket is `done` only with evidence: its tests exist and pass under the root test command, and the behaviour is visible in the app or recorded in a QA note. Otherwise it keeps an open status and a short "what is left" line.
- **Retirements.** `wontfix` and superseded tickets (including the old fixture acceptance test and polish tickets overtaken by the redesign) are closed with a reason, not deleted.
- **In-flight work.** The modified onboarding, reminder, settings, strings and config changes are completed against their redesign tickets and committed in bounded steps; anything that cannot be completed is reverted and recorded.
- **Definition of done** is the gate list in the Solution section; the done report links the evidence for each item.
- **Release gates** follow the existing release-gates spec decisions (EAS-managed keystore, v1.0.0 tag, asset name the landing page already uses, Lighthouse mobile profile with median of three runs, test-account cookie helper for signed-in pages, QA before publish). The owner will not run them: steps that need accounts, hardware or production credentials become scripts and runbooks written and tested as far as possible without credentials (dry runs, mocked or local backend, the demo mode) and are handed over as `ready-for-human` tickets for the recipient, with exact steps and the expected evidence. The done report states plainly which gates were verified and which are handed over unrun.
- **Bootstrap from zero.** The recipient gets no secrets or accounts. Setup is documented and scripted end to end: `.env.example` files for web and mobile, database schema and policies and storage bucket applied from committed files (domain package owns the schema per ADR 0002), a seed command for test data, and a doctor command that verifies the environment. Provider consoles (Supabase, Google Cloud, Vercel, EAS) are described by what to create and which values to copy where, with the free-tier limits that matter.
- **Demo mode without backend.** The existing demo pages and the unit and component tests must run with no network and no secrets, so a new developer can see and test the app before creating any account; CI relies on this too.
- **Owner identities.** Everything tied to the owner (Supabase project URL, OAuth client ids, Android package id and signature, releases repo, download link, emails, domain) is moved into configuration or listed in one table with where to change it. Nothing needed is left only in the owner's accounts.
- **Handoff documents** are plain markdown at the repo root and under docs: a README (setup, commands, structure, troubleshooting), a from-zero setup guide per service, a register of services and variables, a release runbook, an operations note (keep-alive, uptime, cron), a known-limitations file, and the done report. No secret values anywhere; names and locations only.
- **Claude workflow.** The agent-specific guide stays for those who want it but is no longer required: every command a newcomer needs is in the README using plain tools. Project skills that are only local copies are either committed with provenance, or replaced by a documented install step.
- **Secrets hygiene.** Scan the working tree and history for secrets before handoff; rotate anything found; keep `.env.local` out of the repo with a committed `.env.example`.
- **Ordering.** Truth and cleanup first, then product completion in dependency order, then release gates, then handoff documents last so they describe the final state. The Lighthouse and QA runs come after the product is complete.

## Testing Decisions

- A good test checks external behaviour only: what a user sees or what a command returns, not internals or call order.
- Single acceptance seam: the repo root commands `bun run typecheck` and `bun run test`, run by CI on GitHub from a fresh clone. No new test seam is introduced.
- Each product ticket adds tests of the same kind the layer already uses: Vitest for the domain package and the web app, jest-expo for the mobile app, and Maestro flows for end-to-end Android behaviour, following the existing component-beside-test and per-feature flow files.
- The Lighthouse gate is checked by the audit script and recorded as a summary table; the real-phone QA is a recorded run of the refreshed checklist; neither is replaced by unit tests.
- The handoff is verified by a dry run: a fresh clone in a clean directory with no `.env`, following only the README, reaches a green typecheck and test run and a running web app in demo mode, and the doctor command reports exactly what is still missing for the real backend. A second check applies the committed schema to a throwaway local or free-tier Supabase project and runs the seed command against it, if one can be created without the owner's accounts; otherwise that gap is stated in the done report.
- Prior art: component tests next to components in the mobile app, domain tests in the domain package, existing Maestro flows, the CI workflow, and the fixture-based benchmark package.

## Out of Scope

- New features beyond the redesign spec and the release-gates spec.
- A Google Play listing, iPhone or iOS support, offline mode, and any native rewrite.
- Acquiring real users or marketing.
- Creating the recipient's accounts, projects, OAuth clients or keystore for them, and migrating the owner's production data; the recipient starts a new backend (the owner's production project may be shut down or left to lapse).
- Changing the product's domain model or database design except where a redesign ticket already requires it.
- Resuming or continuing Claude or agy sessions after the handoff.
- Other repositories of the owner (the old skinsense repo is read-only history).

## Further Notes

- Items that need credentials or hardware (release keystore, real-phone QA, production Lighthouse audit, creating cloud accounts) are for the recipient, not the owner. They are `ready-for-human` with runbooks. Consequence: the v1.0.0 signed release by the owner and the owner's production audit no longer happen in this effort; the done report says so. The owner should still rotate any secret that the secrets scan finds, since that cannot be delegated.
- The handoff is only believable if the dry run passes on a clean machine; this is the last ticket before the done report.
- The tracker statuses are currently unreliable; the first ticket's output replaces them as the source of truth for everything else in this effort.
