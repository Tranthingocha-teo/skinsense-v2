# 16: Android manual-QA checklist from spec.md

**What to build:** the printed checklist Dinh works through on a real Android phone during the pre-submission QA pass — one concrete, tappable step per Android-side user story in `.scratch/skin-diary-v1/spec.md`, so the 2026-09-20 gate is a checklist run, not a from-memory sweep.

**Owner:** Claude. Reassigned from agy on 2026-09-12 (`/grill-me` pass): the `claude-busy` hook denies agy writes while Claude works this repo, and Claude is in it daily until 2026-09-20, so there was no window left. agy is dropped from this build's plan entirely, not deferred.

**Blocked by:** None (`spec.md` already carries all 26 user stories)

**Status:** done

- [x] Every Android-native user story in `spec.md` appears as at least one checklist line (camera, ML Kit landmarks, AWB lock, spot-marking, trends, sign-in, account deletion)
- [x] Each line is a single physical action plus the observable result — "tap X, expect Y" — not a restatement of the story
- [x] Web-only stories are excluded: Claude runs those itself per the QA-gate split in `production-readiness/map.md`
- [x] Lines are ordered so one pass through the app covers them, not grouped by story number
- [x] Written in Vietnamese (Dinh runs it), file at `.scratch/skin-diary-v1/qa-android-checklist.md`
- [x] Each line leaves room to record pass/fail plus a note

## Now

Written 2026-09-14 (Claude, `/implement`): `.scratch/skin-diary-v1/qa-android-checklist.md` — 6 sections (A cài đặt/đăng nhập, B chụp, C nốt mụn, D routine, E xu hướng, F cách ly + xóa tài khoản), 52 lines, each "thao tác → mong đợi" with ✅/❌ + ghi chú columns, ordered as one pass through the shell; story numbers in parentheses; 23/25/26 excluded (web-only). Strings taken from `apps/mobile/src/locales/vi.json`, so the lines match what the phone shows. B8 records the phone analysis time ticket 08 still needs.

Scheduled 2026-09-13, alongside the native capture spike and ticket 17 — moved off the evening of 2026-09-12, which already carries 01a, the ticket 15 photo session and ticket 03.

First pass translates the 26 user stories into checklist lines. Reviewed again on 2026-09-18 against the real screens, as a revision rather than a rewrite; the early version also doubles as acceptance criteria while the mobile tickets (08/10/13) are built.

## Next

- Dinh: run the checklist on the real phone during the pre-submission pass (before 2026-09-20); each ❌ becomes a `## Comments` line on the owning ticket.
- Revise against the real screens on 2026-09-18 if any mobile screen changed after 2026-09-14.

## Comments

- 2026-09-14 04:10 (Claude): web-side QA against production done — `E2E_BASE_URL=https://skinsense-v2.vercel.app bunx playwright test` in `apps/web` (commit `fef298b`): delete-account pass; capture → save → mark spots → trends → slider pass on re-run (first run's photo-count baseline was wrong once, cause not found). Google sign-in on production verified earlier (ticket 06). Web routine checklist has no E2E, not checked on production. Preview APK `08da3262` is live at `releases/latest/download/skinsense.apk`.
- Next, 15/09 in order: Maestro `flows/capture.yaml` + `flows/mark-spots.yaml` with Dinh at the webcam (tickets 08/10) → Dinh installs the preview APK, signs in with Google (checks EAS SHA-1 client 2) → runs this checklist, B8 timing recorded → ❌ triaged per `map.md` third pass → Claude pulls one QA photo from Storage for ticket 08's `mpbench` comparison.

## Audit 2026-10-17

- Status: done
- Evidence: .scratch/skin-diary-v1/qa-android-checklist.md written (commit e28da31). Refresh for the redesign is tracked in portfolio-release-gates 04.
