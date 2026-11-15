# Dynamic Risk Register (Week 6 Sprint 1 ➔ Week 11 Sprint 2)

This register operationalizes the dynamic risk workbook `04_Risk_Register_Evolution_SkinSense_v2.xlsx` using the **3-Step Process**, preserving every risk item (`R01–R05` at Week 6; `R01–R06` + remediation `R07–R08` at Week 11), the exact **1–3 Probability/Impact scale (`1–9`)**, and the exact **`EV01–EV10` GitHub Evidence** audit with verified **Before ➔ After Remediation** status.

> **Academic Honesty Note (per `Huong dan & Tong quan` Sheet)**:
> Week 6 (`R01–R05`) and Week 11 (`R01–R06`) entries originated as retroactive reconstructions/proposals audited on **2026-11-15** against live repository history rather than claiming historical weekly sign-off snapshots during Weeks 1–6. Remediations executed after that audit (`PR #86`, `PR #87`, Project #2 reconfiguration, Issue linking, and `PR #49` code review) are backed directly by verifiable GitHub timestamps and CI runs. Residual unverified items (`EV08` physical APK sign-off, `R04` async teammate approval click, `R06` stale `PR #49`, `R02` live `EXPO_TOKEN`) remain explicitly marked open/partial.

---

## 1. 3-Step Matrix & Probability × Impact Scale

### Process Definition

| Step | Content | Application to SkinSense v2 |
|---|---|---|
| **1. Identify** | Identify risks from Sprint history, GitHub Issues, PRs, CI runs, and scope changes. | Week 6 (`R01–R05`) & Week 11 (`R01–R06`) reconstructed from repo observations, expanded with Week 11 technical CI/ESLint (`R07`) and multi-tenant security (`R08`) findings. |
| **2. Analyze** | Score **Probability (`P`: `1–3`) × Impact (`I`: `1–3`) = Risk Score (`1–9`)**:<br>- **`1–2`**: **Thấp (Low)**<br>- **`3–4`**: **Trung bình (Medium)**<br>- **`6–9`**: **Cao (High)** | Risks with Score **`>= 6` (Cao / High)** require active **Mitigation**, named **Owner**, and verifiable **GitHub Evidence**. |
| **3. Respond & Review** | Choose **`Avoid`** / **`Mitigate`** / **`Transfer`** / **`Accept`**, assign Owner, execute fixes, and re-verify Week 6 ➔ Week 11 progression. | Before-vs-after remediation tracked honestly in Section 4 (`EV01–EV10`). |

### 3×3 Risk Matrix (`P × I`)

| `P \ I` | `1 - Low` | `2 - Medium` | `3 - High` |
|---|---|---|---|
| **`1 - Low`** | `1` *(Thấp)* | `2` *(Thấp)* | `3` *(Trung bình)* |
| **`2 - Medium`** | `2` *(Thấp)* | `4` *(Trung bình)* | `6` *(Cao)* |
| **`3 - High`** | `3` *(Trung bình)* | `6` *(Cao)* | `9` *(Cao)* |

| Response Strategy | Meaning |
|---|---|
| **`Avoid`** | Adjust scope/plan to eliminate the risk source (`R03` deferring v1.1.0 items `#24–#28`). |
| **`Mitigate`** | Reduce likelihood or impact via engineering/process controls (CI gates, templates, PR reviews). |
| **`Transfer`** | Shift impact/ownership externally (not used for core delivery risk). |
| **`Accept`** | Acknowledge residual risk cleanly with transparent documentation when external action is pending. |

### Authenticity Audit Checklist (From Workbook `3-Step Matrix` Rows 23–25)

| Verification Question | Week 6 (`Sprint 1`) | Week 11 (`Sprint 2`) | Post-Audit Remediation (`2026-11-15`) |
|---|---|---|---|
| Recorded live at original weekly milestone? | Retroactively reconstructed on `11-15` *(explicitly flagged)* | Initial audit `11-15` before Week 11 closeout | Committed to repo history (`PR #87` / `PR #88`) |
| Evidence of executed mitigations & confirmed Owner? | Retroactive Sprint 1 mapping (`#1–#23` assigned to `@Tranthingocha-teo`) | Partial initially (`PR #49` / `#29` open, `0` approvals) | **`PR #86`** (CI + ESLint + Mobile Workflow + Templates), **Project #2 Sync**, **`PR #49` Review**, **`PR #87`/`#88`** |

---

## 2. Week 6 — Sprint 1 Risk Register (Reconstructed Retrospective Baseline)

| ID | Risk Statement (Workbook `Week 6 - Sprint 1`) | P (1–3) | I (1–3) | Score | Level | Strategy | Mitigation & Follow-Up Applied | Owner | Evidence | Week 6 Note |
|---|---|---|---|---|---|---|---|---|---|---|
| **`R01`** | **Nguy cơ quy trình GitHub Issues/PR không phản ánh Sprint nhiều tuần** (`37` commits batched `2026-10-24`; `#1–#23` created/closed same day). | 3 | 3 | **9** | **Cao** | `Mitigate` | Matched Issues `#1–#23` to real git commits (`29b6de5`..`d332492`), assigned `100%` to `@Tranthingocha-teo`, set Milestones 1–4 `due_on` dates, enforced feature-branch PRs in Sprint 2. | `@Tranthingocha-teo` | `EV01`, `EV10` | Retroactive audit; carried ➔ Week 11 `R01`. |
| **`R02`** | **Nguy cơ tích hợp và build ứng dụng mobile bị gián đoạn** (RN 0.76 Nitro + MediaPipe/TFLite build complexity; manual EAS APK). | 2 | 3 | **6** | **Cao** | `Mitigate` | Applied `patches/react-native-vision-camera-face-detector@2.1.0.patch`, published APK `v1.0.0` (`EV08`), scheduled automated mobile CI under **`Issue #29`**. | `@Tranthingocha-teo` | `EV03`, `EV08` | Carried ➔ Week 11 `R02` (`#29`). |
| **`R03`** | **Nguy cơ mở rộng phạm vi quá mức với các tính năng nâng cao** (`#24–#28` iOS camera, offline SQLite, PDF report, widgets, skin-tone calibration). | 2 | 3 | **6** | **Cao** | `Avoid / Mitigate` | Locked Sprint 1 core scope (`#1–#23`, `102 SP`); isolated advanced enhancements cleanly in **Milestone 5 (`v1.1.0` Backlog)** (`#24–#28`, `31 SP`). | `@Tranthingocha-teo` | Issues `#24–#28` | Advanced items stayed out of Sprint 1 (`v1.0.0`); Sprint 2 expanded via formal `CR-01..CR-04`. |
| **`R04`** | **Nguy cơ thiếu minh chứng kiểm thử và peer review** (`ci.yml` lacked `lint`/`build`; solo repo had `0` peer approvals). | 3 | 3 | **9** | **Cao** | `Mitigate` | Ran 300+ unit tests (`#14`), enabled `CODEOWNERS` (`0e7ea5f`) & branch Ruleset `"Only Owner Merge"` (`2026-11-03`), escalated CI & PR rules to Sprint 2. | `@Tranthingocha-teo` | Repo PRs, `CODEOWNERS` | Carried ➔ Week 11 `R04` & `R07`. |
| **`R05`** | **Nguy cơ thiếu dữ liệu Burndown lịch sử** (Projects Board showed only final `Done` cards without daily/weekly remaining SP curve). | 3 | 2 | **6** | **Cao** | `Mitigate` | Reconstructed weekly Burndown & transition table honestly in [`docs/sprints/SPRINT_1.md`](../sprints/SPRINT_1.md) & [`BURNDOWN_HISTORY.csv`](../sprints/BURNDOWN_HISTORY.csv) with explicit retroactive disclosure. | `@Tranthingocha-teo` | `EV10`, `SPRINT_1.md` | Carried ➔ Week 11 `R05`. |

---

## 3. Week 11 — Sprint 2 Dynamic Risk Register (Evolution + Remediation)

### A. Core Workbook Risks (`R01–R06` from `Week 11 - Sprint 2`)

| ID | Risk Description (`Week 11 - Sprint 2`) | Initial `P×I` | Mitigations & Verifiable Actions Executed (`2026-11-15`) | Residual `P×I` | Owner | Status After Remediation |
|---|---|---|---|---|---|---|
| **`R01`** | **Rủi ro chứng minh lịch sử Sprint từ Issues/PR** (`33` Sprint 2 PRs `#37–#74` initially lacked linked Issues/SP; `v1.0.0` issues lacked Sprint 1 dates/assignees). | `3 × 3 = 9` *(Cao)* | Re-assigned `#1–#23` to `@Tranthingocha-teo`; created 1-to-1 PR-backed Sprint 2 Issues `#75–#85` documenting `@Tranthingocha-teo`'s FIRST Sprint 2 baseline (`#75`, `10-25..11-03`); added [`TRACEABILITY_MATRIX.md`](TRACEABILITY_MATRIX.md), Milestone due dates `1–6`, and Project #2 Status Updates. | `1 × 2 = 2` *(Thấp)* | `@Tranthingocha-teo` | **Mitigated / Resolved** *(Retroactive reconstruction explicitly flagged)* |
| **`R02`** | **Pipeline build preview mobile chưa được đóng Issue** (`Issue #29` open without workflow). | `2 × 3 = 6` *(Cao)* | Added [`.github/workflows/mobile-preview.yml`](../../.github/workflows/mobile-preview.yml) (`PR #86`): verifies `mobile` lint, typecheck, `149` Jest tests, exports `mobile-preflight-config` (`14d`), and invokes `eas build --platform android --profile preview` when `EXPO_TOKEN` exists. | `1 × 3 = 3` *(TB)* | `@Tranthingocha-teo`, `@dinhthianhsang` | **`In Review`** *(Workflow Run [`43703807921`](https://github.com/Tranthingocha-teo/skinsense-v2/actions/runs/43703807921) green; live EAS step awaits `EXPO_TOKEN` secret)* |
| **`R03`** | **Mở rộng phạm vi với các module Role, Doctor, Seller, Checkout (`#31, #33, #35, #47, #60`)** without approved Change Requests. | `3 × 3 = 9` *(Cao)* | Cataloged and formalized all Sprint 2 scope expansions (`CR-01`..`CR-05`) in [`CHANGE_REQUESTS.md`](CHANGE_REQUESTS.md), reconciled against `KNOWN_LIMITATIONS.md`, tracked via Milestone 6 (`97 SP`). | `1 × 2 = 2` *(Thấp)* | `@Tranthingocha-teo` | **Closed / Documented** (`#31, #33, #35, #47, #60, #75–#85` closed) |
| **`R04`** | **Thiếu bằng chứng review/kiểm thử khi merge nhanh** (`PR #32–#74` merged fast with `reviews=0` via Repo Admin bypass). | `3 × 3 = 9` *(Cao)* | Added mandatory Self-Test & Peer Review sections in [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md); submitted formal `REQUEST_CHANGES` review on `PR #49`; requested peer reviews from `@thuyydung` & `@dinhthianhsang` on `PR #86`, `#87`. **Did not spoof self-approvals.** | `2 × 2 = 4` *(TB)* | `@Tranthingocha-teo`, `@thuyydung`, `@dinhthianhsang` | **Open Governance Action** *(Historical PRs lacked approvals; awaiting 1 peer click from teammate on GitHub)* |
| **`R05`** | **Thiếu Burndown có dữ liệu từng ngày cho hai Sprint** (Project #2 lacked `Story Points`, `Sprint`, and 5-column progression). | `3 × 2 = 6` *(Cao)* | Rebuilt Project #2 with `Backlog`, `Ready`, `In Progress`, `In Review`, `Done` + `Story Points` + `Sprint` + 5 Views; exported [`BURNDOWN_HISTORY.csv`](../sprints/BURNDOWN_HISTORY.csv) & Mermaid charts in `SPRINT_1.md` / `SPRINT_2.md`. | `1 × 2 = 2` *(Thấp)* | `@Tranthingocha-teo` | **Mitigated / Resolved** *(Retroactive points flagged honestly)* |
| **`R06`** | **Công việc Profile/Checkout chưa hoàn tất hoặc chưa nghiệm thu** (Initially `#47`, `#60`, `PR #48`, `PR #49` all open). | `2 × 2 = 4` *(TB)* | Integrated and merged `PR #48` (`#47` & `#60` closed `2026-11-15`) and `PR #61` (`#83`); verified checkout/gallery flow in `PR #74`. Reviewed `PR #49` (`origin/anhsang`) which failed CI Run [`43632413725`](https://github.com/Tranthingocha-teo/skinsense-v2/actions/runs/43632413725) (`4` TS errors) and formally submitted **`REQUEST_CHANGES`**; tracked `PR #49` in **`In Progress`** on Project #2. | `2 × 2 = 4` *(TB)* | `@dinhthianhsang` *(Review: `@Tranthingocha-teo`)* | **Partial (`#47, #60` Closed; `PR #49` `In Progress`)** *(Awaiting `@dinhthianhsang` to close/fix `PR #49`)* |

### B. Technical & Security Risks Discovered & Resolved During Remediation (`R07–R08`)

| ID | Risk Discovered During Repo Verification | Initial `P×I` | Mitigations & Verification Executed | Residual `P×I` | Owner | Status |
|---|---|---|---|---|---|---|
| **`R07`** | **69 Hidden `apps/web` ESLint Errors & CI Gate Missing `lint` / `build`**: Run `43694617147` skipped `lint` and `build`, hiding `69` ESLint violations across `19` Web files. | `3 × 3 = 9` *(Cao)* | Fixed all `69` Web ESLint errors (`0` errors across monorepo); enforced `bun run lint` & `bun run build` in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (`PR #86`, `Closes #84`); verified secretless build (`43` Web routes) and uncached `turbo` suite pass. | `1 × 1 = 1` *(Thấp)* | `@Tranthingocha-teo` | **Closed / Resolved** *(CI Run [`43704528813`](https://github.com/Tranthingocha-teo/skinsense-v2/actions/runs/43704528813) GREEN)* |
| **`R08`** | **Media Secret Exposure & Multi-Tenant Cross-Shop/User Data Leaks**: Added Cloudinary uploads & multi-shop storefront could leak `CLOUDINARY_API_SECRET` or mix data across users/shops. | `2 × 3 = 6` *(Cao)* | Implemented server-side signature API `/api/upload/cloudinary` (`PR #70–#74`), removed Cloudinary branding/URL inputs from UI (`PR #68`), enforced strict `userId` & verified `shopName` scoping + admin shop approval (`PR #62–#66`), verified `.env*` gitignore & multi-tenant Vitest tests (`PR #50, #52, #53`). | `1 × 2 = 2` *(Thấp)* | `@Tranthingocha-teo` | **Mitigated / Resolved** *(Verified in CI & Vitest)* |

---

## 4. GitHub Evidence Index (`EV01–EV10` — Before ➔ After Remediation)

| Code | Workbook Baseline Observation (`Bang chung GitHub`, `15/11` AM) | Source Link | Status After Remediation (`15/11` PM) | Honest Residual Limitation |
|---|---|---|---|---|
| **`EV01`** | Issues `#1–#23` mostly created/closed on `24/10/2026`, assignees missing on `#3–#23`. | [GitHub Issues #1–#23](https://github.com/Tranthingocha-teo/skinsense-v2/issues) | All 23 Sprint 1 Issues assigned `100%` to `@Tranthingocha-teo` (`102 SP`), linked to Milestones 1–4 with `due_on` & Acceptance Criteria. | Commit timestamp batching on `2026-10-24` remains disclosed as historical reality. |
| **`EV02`** | Issues `#31, #33, #35` closed `14/11/2026` without formal `CR` record; Sprint 2 PRs untracked. | [Issue #35](https://github.com/Tranthingocha-teo/skinsense-v2/issues/35) | Formal `CR-01`..`CR-05` documented; Issues `#75–#85` created linking every PR cluster (`#75` = Hà's first Sprint 2 commits `10-25..11-03`). | `#75–#82` were created retroactively from real PRs `#37–#74`. |
| **`EV03`** | Issue `#29` (`EAS Preview Build Pipeline`) remained `OPEN` with no workflow file. | [Issue #29](https://github.com/Tranthingocha-teo/skinsense-v2/issues/29) | Shipped [`.github/workflows/mobile-preview.yml`](../../.github/workflows/mobile-preview.yml) (`Run 43703807921` **GREEN**); moved `#29` to **`In Review`**. | Live cloud `eas build` step skips cleanly until team adds `EXPO_TOKEN` secret. |
| **`EV04`** | Issue `#47` (`Checkout`) still `OPEN` at initial check. | [Issue #47](https://github.com/Tranthingocha-teo/skinsense-v2/issues/47) | **Closed** `2026-11-15` after integrating `PR #48` (`710d946`) & `PR #74` (`f101261`); moved to **`Done`**. | Checkout UI manual UX tested by dev team; no browser E2E runner in repo. |
| **`EV05`** | Issue `#60` (`Role-specific Profile`) still `OPEN` at initial check. | [Issue #60](https://github.com/Tranthingocha-teo/skinsense-v2/issues/60) | **Closed** `2026-11-15` via `PR #48` (`710d946`) alongside API isolation (`PR #62–#63`); moved to **`Done`**. | Requires team E2E login walkthrough across all 4 roles for final sign-off. |
| **`EV06`** | `PR #32, #34, #36` merged `14/11/2026` quickly without recorded peer approvals. | [GitHub Pull Requests](https://github.com/Tranthingocha-teo/skinsense-v2/pulls) | Documented honestly under `R04`; enforced `.github/PULL_REQUEST_TEMPLATE.md`; requested peer review on `PR #86, #87, #88`. | Historical merges `#32–#74` keep `reviews=0` rather than fabricating retroactive approvals. |
| **`EV07`** | Both `PR #48` and `PR #49` still `OPEN` at initial check. | [`PR #49`](https://github.com/Tranthingocha-teo/skinsense-v2/pull/49) | `PR #48` **MERGED** (`710d946`). `PR #49` stayed **`OPEN`** after failing CI Run [`43632413725`](https://github.com/Tranthingocha-teo/skinsense-v2/actions/runs/43632413725) (`4` TS errors); `@Tranthingocha-teo` posted **`REQUEST_CHANGES`** & tracked `PR #49` in **`In Progress`**. | Awaits `@dinhthianhsang` to close `PR #49` (superseded by `PR #61`) or push TS fixes. |
| **`EV08`** | Release `v1.0.0` uploaded `skinsense.apk` (`99.3 MB`) on `24/10/2026`, lacking device QA sign-off record. | [Release `v1.0.0`](https://github.com/Tranthingocha-teo/skinsense-v2/releases/tag/v1.0.0) | Verified release asset (`skinsense.apk`, `sha256:b22d76...29a912`, `4` downloads) + [`qa-android-checklist.md`](../qa-android-checklist.md). | Test matrix lines `25–29` of `qa-android-checklist.md` remain unsigned; physical Android log not retroactively forged. |
| **`EV09`** | GitHub Actions Run `43694617147` (`15/11`) passed only `typecheck` & `test` (no `lint` or `build`). | [`Run 43694617147`](https://github.com/Tranthingocha-teo/skinsense-v2/actions/runs/43694617147) ➔ [`Run 43704528813`](https://github.com/Tranthingocha-teo/skinsense-v2/actions/runs/43704528813) | Upgraded `ci.yml` in `PR #86` to enforce `lint`, `typecheck`, `test`, and secretless `build`; `PR #86` (`43703807949`), `PR #87`, and `main` (`43704528813`) all **GREEN**. | Older Sprint 2 PRs (`#32–#74`) predated the `lint` + `build` gate; `69` legacy errors cleared in `#86`. |
| **`EV10`** | Initial Project Board screenshot showed `Done` for `#1–#8` with no 5 columns, Sprint views, or Burndown. | [GitHub Project #2](https://github.com/users/Tranthingocha-teo/projects/2) | Rebuilt Project #2 with 5 columns (`Backlog`, `Ready`, `In Progress`, `In Review`, `Done`), `Story Points`, `Sprint`, 5 Views, Status Updates + `SPRINT_1.md` / `SPRINT_2.md` / `BURNDOWN_HISTORY.csv`. | Sprint 1 transitions remain explicitly marked retroactively reconstructed. |
