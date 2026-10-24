# 05: Real-phone QA run on the release-signed APK

**What to build:** the refreshed checklist is run in full on a real Android phone set to Vietnamese, against the release-signed v1.0.0 APK, ending in a clear go or no-go. Spec gate 4, stories 28–32, and story 11 (sign-in on the release build).

**Blocked by:** 03, 04

**Status:** ready-for-human

- [ ] Claude installs the APK over adb and drives logcat and screenshots; Dinh only holds the phone for capture and picks the Google account
- [ ] The four Maestro flows (capture, mark spots, routine checklist, trends) run on the phone
- [ ] Every checklist line is recorded ✅/❌ with a note in place
- [ ] Crash, data-loss, sign-in and save failures each become a fix ticket and are re-tested on a rebuilt APK before go
- [ ] Every other ❌ gets one line in a known-limitations list in this feature folder
- [ ] Go/no-go written at the bottom of this ticket

## Audit 2026-10-17

- Status: ready-for-human
- Evidence: No recorded run; needs a real phone and the signed APK.
- Left: Real-phone QA run. Handed over via handoff-completion 13 (checklist) and 22 (launch checklist).
