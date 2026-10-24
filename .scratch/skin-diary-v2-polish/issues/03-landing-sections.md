# 03: Landing sections, VI/EN switch, FAQ, APK QR

**What to build:** the landing page tells the full story under the hero, following the canvas's Landing artboard — how the nightly routine works, what the on-device AI does, which platform to pick, a QR to install the APK, and an FAQ with complete answers — and a visitor can flip the page between Vietnamese and English from the header. Spec row 6, stories 16–21. Estimate 1.5 h.

**Blocked by:** 02

**Status:** superseded (by redesign-build 10)

- [x] "Cách hoạt động" section with the four nightly steps
- [x] "AI trên thiết bị" section: 4-step pipeline (landmarks, skin mask, zones, index computed on device, not stored) + link to the project page (link hidden until ticket 07's project page exists — no dead link)
- [x] "Web hay Android?" comparison table
- [x] APK QR encoding the stable `releases/latest/download/skinsense.apk` URL, rendered at build time (no runtime QR dependency)
- [x] FAQ answers all filled (diagnosis, how the index works, where photos are stored, cost, supported devices); answers 2–5 written in this ticket; no treatment advice
- [x] Header language switch writes the existing `locale` cookie; every new section has vi + en copy
- [x] Copy rules from ticket 01 hold in the new text
- [ ] Deployed to Vercel production

## Now

- Landing rebuilt on the canvas order: hero → Cách hoạt động (4 steps, replaces the 3 features) → AI trên thiết bị (4-step pipeline, project-page link omitted until ticket 07) → Web hay Android? table (reminders row left out until row 39 ships) + APK QR card → FAQ (native `<details>`, 5 answers: diagnosis, a* formula checked against `packages/domain/src/redness.ts`, storage per the privacy page, cost, devices with minSdk 24 = Android 7.0) → trust → footer.
- QR: static `apps/web/public/apk-qr.svg` from `qrencode -t SVG -l M -m 0 "<APK_URL>"`, no QR code in the bundle.
- `LocaleSwitch` (`components/locale-switch.tsx`) writes the `locale` cookie + `router.refresh()`; reusable for Cài đặt in ticket 04. vi/en key parity checked; typecheck + web Vitest (19) green.

## Next

- VI/EN switch checked on localhost:3000 (cookie set, lang + headings flip). Code review, commit; production deploy waits for Dinh's approval (tickets 01–03 in one deploy).

## Audit 2026-10-17

- Status: superseded (by redesign-build 10)
- Evidence: Commit 071ca84 shipped it; the landing was rebuilt in redesign-build 10 (672d8b0), landing.test.tsx.
