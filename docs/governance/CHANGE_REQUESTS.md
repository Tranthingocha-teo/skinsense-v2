# Change Request Log (`CR-01` – `CR-05`)

In Sprint 1 (`v1.0.0`), SkinSense explicitly constrained scope in [`docs/KNOWN_LIMITATIONS.md`](../KNOWN_LIMITATIONS.md) (single-user skin diary, FOSS with no monetization/e-commerce, Google-OAuth-only authentication). During Sprint 2 (Weeks 7–11), course expansion and stakeholder product requirements introduced major multi-role capabilities tracked formally below.

---

## Summary Table

| CR ID | Title | Requested By | Date Raised | Decision | Linked Issues | Linked Risk(s) |
|---|---|---|---|---|---|---|
| **`CR-01`** | 4-Role Multi-Tenant Architecture, Super Admin & Google OAuth Profile Separation | Course / Product Lead (`@Tranthingocha-teo`) | 2026-10-25 | **Approved & Shipped** | `#75, #76, #77, #31, #60` | `R03, R05` |
| **`CR-02`** | Shopee Mall Multi-Vendor Storefront, Admin Shop Approval & MoMo QR Checkout | Product Lead & Team (`@Tranthingocha-teo`, `@thuyydung`, `@dinhthianhsang`) | 2026-10-25 | **Approved & Shipped** | `#75, #35, #47, #80, #83` | `R05, R06` |
| **`CR-03`** | Dermatology Specialist Clinical Portal, AM/PM Prescription Sync & Multi-Tenant Isolation | Product Lead (`@Tranthingocha-teo`, `@thuyydung`) | 2026-11-03 | **Approved & Shipped** | `#33, #78, #79, #82` | `R05` |
| **`CR-04`** | Server-Signed Cloudinary Media Upload from Local Device & Camera Capture | Product Owner (`@Tranthingocha-teo`) | 2026-11-15 | **Approved & Shipped** | `#81` | `R05` |
| **`CR-05`** | DevOps Quality Gate (`lint` + `build` + Mobile Preview), 5-Column Kanban & Governance Remediation | Lecturer Rubric & QA (`@Tranthingocha-teo`) | 2026-11-15 | **Approved (In Final Delivery)** | `#84, #85, #29` | `R01, R02, R03, R04, R06` |

---

## Detailed Change Requests

### `CR-01`: 4-Role Multi-Tenant Architecture & Supabase Cloud Persistence
- **Baseline Impact**: Supersedes `KNOWN_LIMITATIONS.md` Section 1 Item 4 (single-role auth model) for web portal testing and clinical workflows while keeping passwordless Google OAuth intact.
- **Technical Scope**: `profiles` role model (`customer`, `shop`, `specialist`, `admin`), Supabase PostgreSQL seed architecture, Super Admin guard (`hattn.23itb@vku.udn.vn`), role-specific profile views, and quick demo role switcher.
- **Verification**: `#75, #76, #77, #31, #60` closed (`PR #37–#43`, `PR #48`).

### `CR-02`: Multi-Vendor Shopee Mall Marketplace, Shop Moderation & Checkout
- **Baseline Impact**: Supersedes `KNOWN_LIMITATIONS.md` Section 1 Item 3 (zero e-commerce in v1.0.0) by adding an integrated skincare marketplace tailored to medical prescriptions.
- **Technical Scope**: Seller storefront, shop registration workflow analogous to specialist verification, mandatory admin approval prior to storefront publishing, strict product scoping by verified `shopName`, Shopee Mall checkout & MoMo QR flow, and seller payment dashboard.
- **Verification**: `#35, #47, #80, #83` closed (`PR #36, #48, #61, #64–#66`). Note: earlier `PR #49` superseded and flagged under `R06`.

### `CR-03`: Specialist Clinical Cases, Real-Time Routine Sync & Multi-Tenant Testing
- **Baseline Impact**: Connects customer routine streaks (Sprint 1 `#5`) with live doctor clinical cases and prescriptions stored in Supabase.
- **Technical Scope**: Morning/evening routine split (`morning` vs `evening`), doctor clinical record prescribing, visual allergy conflict alerts, blank initial routines for non-patient roles (`specialist` / `admin`), and automated Vitest suites verifying zero cross-tenant data leakage.
- **Verification**: `#33, #78, #79, #82` closed (`PR #44–#46, #50–#59, #62–#63`).

### `CR-04`: Server-Signed Media Pipeline (Device Picker + Camera Capture)
- **Baseline Impact**: Replaces brittle external product image URLs with real image uploads captured directly from device files or camera.
- **Technical Scope**: Server-side upload signature generation (`apps/web/src/app/api/upload/cloudinary/route.ts`), browser device/camera upload UI (`apps/web/src/components/product-image-uploader.tsx`), image gallery array support in `/api/admin/products`, hiding third-party upload provider branding from UI, and keeping `CLOUDINARY_API_SECRET` strictly outside git (`PR #67–#74`).
- **Verification**: Split cleanly across 5 verified PRs (`PR #70–#74`), all passing CI.

### `CR-05`: Quality Gate Hardening, Mobile Preview Automation & Governance Remediation
- **Trigger**: Pre-grading Quality Audit (`04_Risk_Register_Evolution_SkinSense_v2.xlsx`) identified 69 hidden Web ESLint errors (`R01`), un-enforced `lint`/`build` checks in CI, missing Issue `#29` mobile workflow (`R02`), untracked Sprint 2 PRs (`R03`), 0 peer review approvals (`R04`), and failing `PR #49` (`R06`).
- **Technical Scope**: Resolve all 69 ESLint errors, add `lint` & `build` to `.github/workflows/ci.yml`, ship `.github/workflows/mobile-preview.yml`, standardize PR/Issue templates, align GitHub Project #2 to 5 Status columns (`Backlog`, `Ready`, `In Progress`, `In Review`, `Done`) + `Story Points`, author full Scrum & Risk docs (`PR #86`, `PR #87`).
- **Status**: `PR #86` merged (`#84` closed; CI Run `43703807949` green); `#85` closing via `PR #87`; `#29` in `In Review` awaiting `EXPO_TOKEN`.
