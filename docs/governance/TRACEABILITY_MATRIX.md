# Requirements & Engineering Traceability Matrix

Complete mapping from **WBS / Change Request** → **Sprint & Milestone** → **GitHub Issue** → **Primary & Co-Assignees** → **Story Points** → **Pull Request(s) / Commit SHA** → **Verification / CI Evidence**.

> **Authorship Integrity**:
> `@Tranthingocha-teo` authored **100% of Sprint 1 (`#1–#23`, `102 SP`, first repo commit `29b6de5` → `v1.0.0` `d332492`)** AND built the **FIRST Sprint 2 baseline (`#75`, `2026-10-25..11-03`)** plus **`#76–#82`, `#84–#85`** (`63 SP` sole + `19 SP` co-owned across `35` PRs). Team UI shells by `@thuyydung` (`#31–#36, #47–#48, #60`) and Seller payment UI by `@dinhthianhsang` (`#83`, `PR #61`, `PR #49`) integrated atop Hà's backend & multi-tenant foundation.

---

## 1. Sprint 1 Traceability (`Milestones 1–4`, `2026-09-14 → 2026-10-26`, `102 SP`)

| Issue | Milestone | WBS Feature | Owner | SP | Commit / Release Evidence | CI / QA Verification | Status |
|---|---|---|---|---|---|---|---|
| `#1` | M1 | Monorepo Foundation & Build Tooling | `@Tranthingocha-teo` | 3 | `29b6de5` (`2026-10-24` batch) | Turborepo workspace typecheck/build | `Done` |
| `#2` | M1 | Shared Design Tokens (`@skinsense/tokens`) | `@Tranthingocha-teo` | 3 | `f97d710` | Token build (`web.css` + `nativewind.css`) | `Done` |
| `#3` | M1 | Core Domain Engine (`@skinsense/domain`) | `@Tranthingocha-teo` | 8 | `59586f2` | Unit tests passing | `Done` |
| `#4` | M1 | Postgres Schema, Drizzle & Edge Functions | `@Tranthingocha-teo` | 5 | `8c8769a` | Drizzle schema & ADR-0002 verified | `Done` |
| `#5` | M2 | Daily Routine Checklist & Streaks | `@Tranthingocha-teo` | 5 | `ca4161c` | Web + Mobile tests passing | `Done` |
| `#6` | M2 | Guided Camera Capture & Quality Checks | `@Tranthingocha-teo` | 8 | `f5d33ab` | Mobile camera & quality unit tests | `Done` |
| `#7` | M2 | Interactive Acne & Spot Marking Module | `@Tranthingocha-teo` | 8 | `a262802` | Web & Mobile tests passing | `Done` |
| `#8` | M2 | Skin Trends & Multi-Date Comparison | `@Tranthingocha-teo` | 5 | `d511bc1` | Domain + UI unit tests | `Done` |
| `#9` | M2 | Google OAuth & Backend-Free Demo Mode | `@Tranthingocha-teo` | 5 | `b8a4576` | Demo & OAuth tests passing | `Done` |
| `#10` | M2 | Application Shell & "Hôm Nay" Dashboard | `@Tranthingocha-teo` | 3 | `e75ecfb` | Responsive UI verified | `Done` |
| `#11` | M2 | Photo Detail Notes, Tags & Reminders | `@Tranthingocha-teo` | 3 | `4bfbc56` | Unit tests passing | `Done` |
| `#12` | M2 | Public Landing, 3D Particle Stage & UI Kit | `@Tranthingocha-teo` | 8 | `f4eb8b0` | Next.js build verified | `Done` |
| `#13` | M2 | Mobile Architecture, Fonts & Native Kit | `@Tranthingocha-teo` | 8 | `9f860e5` | 149 Mobile Jest suites pass | `Done` |
| `#14` | M3 | GitHub Actions CI & Test Suites | `@Tranthingocha-teo` | 5 | `e7c70ad` | Secretless CI passing | `Done` |
| `#15` | M3 | Audit Records, Tech Specs & Handoff | `@Tranthingocha-teo` | 2 | `d255bb4` | `docs/DONE_REPORT.md` & `HANDOFF.md` | `Done` |
| `#16` | M4 | Provision Supabase & Drizzle Migrations | `@Tranthingocha-teo` | 3 | M4 Cloud Provision | Live Supabase DB verified | `Done` |
| `#17` | M4 | Google Cloud OAuth 2.0 (Web & Android) | `@Tranthingocha-teo` | 3 | M4 OAuth Setup | Web/Android OAuth active | `Done` |
| `#18` | M4 | Deploy Web App to Vercel | `@Tranthingocha-teo` | 3 | M4 Vercel Deploy | Production Vercel deployment live | `Done` |
| `#19` | M4 | Supabase Keep-Alive Cron | `@Tranthingocha-teo` | 2 | M4 Keep-Alive | Prevent free-tier pause | `Done` |
| `#20` | M4 | EAS Keystore & Signed Android APK v1.0.0 | `@Tranthingocha-teo` | 5 | `d332492` | `docs/release-runbook.md` | `Done` |
| `#21` | M4 | Physical Android Device Manual QA | `@Tranthingocha-teo` | 3 | `docs/qa-android-checklist.md` | Physical phone checks recorded | `Done` |
| `#22` | M4 | Production Lighthouse Audit (Web) | `@Tranthingocha-teo` | 2 | `docs/lighthouse-audit.md` | Lighthouse report archived | `Done` |
| `#23` | M4 | Publish Release `v1.0.0` on GitHub | `@Tranthingocha-teo` | 2 | Tag `v1.0.0` | GitHub Release `v1.0.0` live | `Done` |

---

## 2. Sprint 2 Traceability (`Milestone 6`, `2026-10-27 → 2026-11-15`, `97 SP`)

| Issue | CR Ref | Feature / Work Package | Owner(s) | SP | PR(s) | Merge / Head SHA | CI / Verification Evidence | Board Status |
|---|---|---|---|---|---|---|---|---|
| **`#75`** | `CR-01, CR-02` | **First Sprint 2 Baseline**: 4-Role Auth, 3-Tier Marketplace & Editorial Routine (`2026-10-25..11-03`) | **`@Tranthingocha-teo`** *(First author)* | 8 | Early Sprint 2 direct commits on `main` | `ae10973`..`ac70fab` (`2026-10-25..11-03`) | Multi-role & marketplace tests pass | `Done` |
| `#30` | — | Team Onboarding (`@thuyydung`, `@dinhthianhsang`) | `@Tranthingocha-teo`, `@thuyydung`, `@dinhthianhsang` | 1 | Collaborator setup & `ROADMAP.md` | `0e7ea5f` (`CODEOWNERS`, `2026-11-03`) | Team commit & PR access verified | `Done` |
| `#31` | `CR-01` | Admin 4-Role & Shop Moderation UI | `@Tranthingocha-teo`, `@thuyydung` | 5 | `PR #32` (`@thuyydung`), `PR #43` (`@Tranthingocha-teo`) | `fd118cd`, `190e320` | Connected to live `/api/admin/*` | `Done` |
| `#33` | `CR-03` | Dermatologist Specialist Portal UI | `@Tranthingocha-teo`, `@thuyydung` | 5 | `PR #34` (`@thuyydung`), `PR #44` (`@Tranthingocha-teo`) | `fd118cd`, `6b63960` | Clinical cases & photo routine UI | `Done` |
| `#35` | `CR-02` | Shopee Mall Product Selling & Storefront UI | `@Tranthingocha-teo`, `@thuyydung` | 5 | `PR #36` (`@thuyydung`), `PR #64–#66` (`@Tranthingocha-teo`) | `c473864`, `f08cd9a`..`df1f82f` | Shop moderation + storefront live | `Done` |
| `#76` | `CR-01` | Supabase PostgreSQL Seed, Passwordless Google OAuth & Super Admin Guard | **`@Tranthingocha-teo`** | 8 | `PR #37, #38, #39` | `b934353`, `d77dcc1`, `6bf2177` | Super Admin `hattn.23itb@vku.udn.vn` verified | `Done` |
| `#77` | `CR-01, CR-02` | Admin Backend APIs (4-Role Users, Specialists, Products & Orders) | **`@Tranthingocha-teo`** | 8 | `PR #40, #41, #42, #43` | `5b101ca`, `3674e54`, `94b5e1a`, `190e320` | Supabase API persistence verified | `Done` |
| `#78` | `CR-03` | Specialist Clinical Cases API, Prescription Sync Helper & Doctor Validation | **`@Tranthingocha-teo`** | 5 | `PR #44, #54, #56, #58` | `6b63960`, `5460e89`, `9be82cf`, `54a8698` | Allergy warnings & validation tested | `Done` |
| `#79` | `CR-03` | AM/PM Split Routine Sync & Strict Per-User Multi-Tenant Isolation | **`@Tranthingocha-teo`** | 5 | `PR #45, #46, #62, #63` | `5ef302b`, `6b7ff21`, `8b05fb2`, `56bd5d4` | Zero leak across patient/doctor/admin | `Done` |
| `#80` | `CR-02` | Admin Shop Approval Gate, Product Moderation & Shop Name Isolation | **`@Tranthingocha-teo`** | 8 | `PR #64, #65, #66` | `f08cd9a`, `32c82b1`, `df1f82f` | Exact `shopName` ownership enforced | `Done` |
| `#81` | `CR-04` | Signed Server Image Upload, Device/Camera Uploader & Checkout Gallery Flow | **`@Tranthingocha-teo`** | 8 | `PR #67, #68, #69, #70, #71, #72, #73, #74` | `50f8942`..`f101261` | Split cleanly into 5 final PRs (`#70–#74`), CI `43701797464` GREEN | `Done` |
| `#82` | `CR-03` | Multi-Tenant API Test Suites, `SafeProductImage` & Navigation Accessibility | **`@Tranthingocha-teo`** | 5 | `PR #50, #51, #52, #53, #55, #57, #59` | `c82dea8`..`336b4bd` | 159 Web Vitest specs green | `Done` |
| `#47` | `CR-02` | Shopee Mall Order Checkout & MoMo QR UI | `@thuyydung` | 5 | `PR #48` | `710d946` | Integrated with checkout gallery (`#74`) | `Done` |
| `#60` | `CR-01` | Role-Specific Profile Views & User Orders | `@thuyydung` | 5 | `PR #48` | `710d946` | 4-role profiles live | `Done` |
| `#83` | `CR-02` | Shopee Seller Payment UI & Seller Revision Review | `@dinhthianhsang` | 5 | `PR #61` (merged), `PR #49` (open) | `3f524a6` (`#61`), `2d5f10c` (`#49`) | `#61` merged; `PR #49` failed Run `43632413725`, `CHANGES_REQUESTED` | `Done` (`PR #49` `In Progress`) |
| **`#84`** | `CR-05` | Fix All 69 Web ESLint Errors, Enforce `lint` & `build` in CI, Add PR/Issue Templates & Mobile Workflow | **`@Tranthingocha-teo`** | 5 | **`PR #86`** | `aa5b039` (`2026-11-15`) | CI Run [`43703807949`](https://github.com/Tranthingocha-teo/skinsense-v2/actions/runs/43703807949) & Run [`43703807921`](https://github.com/Tranthingocha-teo/skinsense-v2/actions/runs/43703807921) GREEN | `Done` |
| **`#85`** | `CR-05` | Sprint 1 & 2 Plans, Burndowns, Reviews, Retrospectives, Dynamic Risk Register & Traceability | **`@Tranthingocha-teo`** | 3 | **`PR #87`** | Pending `#87` merge | Gated on full CI (`lint`, `typecheck`, `test`, `build`) | `Done` *(upon #87 merge)* |
| `#29` | `CR-05` | Automated EAS Preview Build Pipeline on GitHub Actions | `@Tranthingocha-teo`, `@dinhthianhsang` | 3 | `PR #86` (`mobile-preview.yml`) | `aa5b039` | Preflight Run [`43703807921`](https://github.com/Tranthingocha-teo/skinsense-v2/actions/runs/43703807921) green; live EAS build awaits `EXPO_TOKEN` secret | **`In Review`** *(Open)* |

---

## 3. Future Backlog Traceability (`Milestone 5 — v1.1.0`, `due: 2026-11-30`, `31 SP`)

| Issue | Track | Planned Feature | Owner | SP | Project #2 Column |
|---|---|---|---|---|---|
| `#24` | Mobile (Expo) | iOS Camera & MediaPipe Face Landmarker Support | `@dinhthianhsang` | 8 | `Backlog` |
| `#25` | Backend & Cloud | Offline-First Photo & Routine Sync Queue with Local SQLite | `@Tranthingocha-teo` | 8 | `Backlog` |
| `#26` | Web (Next.js) | Dermatologist Consultation PDF Report Generator | `@Tranthingocha-teo` | 5 | `Backlog` |
| `#27` | Mobile (Expo) | Android & iOS Home Screen Widget for Routine Streak | `@dinhthianhsang` | 5 | `Backlog` |
| `#28` | Core Domain / Vision | Auto Skin Tone Adaptive Calibration for Multi-Ethnic Redness Index | `@Tranthingocha-teo` | 5 | `Backlog` |
