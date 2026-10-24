# 03: Release-signed v1.0.0 APK build

**What to build:** the first APK after the redesign is built on the EAS `production` profile and signed with the release keystore, ready for real-phone QA. Spec gate 2, stories 9, 12, 13.

**Blocked by:** 02; external: redesign shipped on web and Android (redesign spec, not yet written).

**Status:** ready-for-agent

- [ ] APK built on the `production` profile: arm64-v8a, remote auto-incremented versionCode, version 1.0.0
- [ ] The APK's signer certificate matches the EAS release keystore, not the debug keystore
- [ ] A development build still installs and runs with the debug keystore
- [ ] The APK is kept locally for ticket 05; nothing is published yet

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: eas.json production profile builds an APK, but no signed v1.0.0 release has been built or documented.
- Left: Signed release build and runbook. Covered by handoff-completion 12.
