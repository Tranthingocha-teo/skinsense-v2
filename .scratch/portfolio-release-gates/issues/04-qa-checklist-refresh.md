# 04: Refresh the Android QA checklist for the redesigned screens

**What to build:** the existing Android QA checklist describes the app as it is after the redesign, so the real-phone run tests screens that exist. Spec gate 4, story 27.

**Blocked by:** external: redesign shipped on web and Android (redesign spec, not yet written).

**Status:** ready-for-agent

- [ ] Lines for screens or flows the redesign removed are deleted
- [ ] Every new or changed screen and navigation path has lines
- [ ] Format unchanged: Vietnamese, per-section tables with ✅/❌ and a notes column, all results blank
- [ ] Sign-in lines cover the release-signed APK (Google account picker → signed in)

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: .scratch/skin-diary-v1/qa-android-checklist.md exists but predates the redesign.
- Left: Rewrite the checklist for the redesigned screens. Covered by handoff-completion 13.
