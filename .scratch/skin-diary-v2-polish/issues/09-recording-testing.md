# 09: Screen recording + testing

**What to build:** spec rows 42–43 — a 60–90 s product recording a grader can watch without installing the APK, and the tests the spec defers to last for whatever tickets have shipped. Story 40. Estimate 4.5 h.

**Blocked by:** whichever of 01–08 are done when this starts (tests cover shipped work only)

**Status:** wontfix

- [ ] Row 42: 60–90 s screen recording (Playwright on web + emulator on Android) of the shipped flows
- [ ] Web E2E (Playwright via `E2E_BASE_URL`) against the deployment: open demo → Hôm nay shows streaks and zone directions → tick routine → reload keeps it → Đặt lại clears it → Xu hướng renders; landing sections present, language switch flips copy, hero canvas mounts
- [ ] Web component tests (Vitest + Testing Library): Hôm nay and Cài đặt render from the demo data functions and show "Chỉ số mẩn đỏ"
- [ ] Mobile (jest-expo + RNTL + `expo-router/testing-library`): tab layout renders four tabs; Hôm nay and Cài đặt render from demo data; Xem thử enters the demo (if ticket 07 row 18 shipped)
- [ ] Maestro: tab-navigation flow (+ Xem thử flow if shipped); existing `capture`, `mark-spots`, `routine-checklist`, `trends` flows start from the tabs
- [ ] Backend RLS for any shipped table (`feedback`, `reminders`, `push_subscriptions`) checked as a second account
- [ ] Manual: `qa-android-checklist.md` on Dinh's phone and the `mpbench` phone comparison (likely after 23:59)

## Now

## Next

## Audit 2026-10-17

- Status: wontfix
- Evidence: The 15-20 Sep submission window is over. Test intent now lives in per-screen tests, apps/web/e2e specs and apps/mobile/flows; the screen recording was never made and is not required by the handoff spec.
