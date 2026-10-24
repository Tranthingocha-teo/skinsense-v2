# Lighthouse Audit Runbook

This runbook documents the performance, accessibility, best practices, and SEO benchmarks for SkinSense Web.

---

## 1. Acceptance Bar
To pass the portfolio release gate, every audited web page must score **≥ 90** across all four Lighthouse mobile categories:
- **Performance**: ≥ 90
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90

---

## 2. Core Audited Routes

| Route | Name | Purpose |
| :--- | :--- | :--- |
| `/` | Landing Page | Hero 3D Particle Face stage, feature bento, and FAQ |
| `/case-study` | Case Study | Technical write-up, architecture, and design rationale |
| `/privacy` | Privacy Policy | Offline-first, on-device biometric processing notice |
| `/demo` | Hôm Nay | Main daily tracking dashboard (demo mode) |
| `/demo/routine` | Routine Checklist | Interactive routine steps with completion percentage |
| `/demo/trends` | Trends & Comparison | Redness index chart, spot counter, and before/after slider |
| `/demo/history` | Photo Diary History | Calendar photo timeline, notes, and tags |

---

## 3. Running Audits Locally

1. Build and start the production web server:
   ```bash
   cd apps/web
   bun run build
   bun run start # runs on http://localhost:3000
   ```
2. In a separate terminal, run the audit runner:
   ```bash
   bun run audit:lighthouse
   ```

---

## 4. Running Audits on Production (Vercel)

1. Run Lighthouse CLI with mobile emulation against your live deployment:
   ```bash
   bunx lighthouse https://<your-deployment>.vercel.app --preset=mobile --output=html --output-path=./lighthouse-report.html --view
   ```
2. Repeat for each key route (`/case-study`, `/demo`, `/demo/trends`).
3. Take the median of 3 runs for consistent metric reporting.
