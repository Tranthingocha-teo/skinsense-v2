# 02: Release keystore in EAS + SHA-1 registered for Google sign-in

**What to build:** EAS holds an Android release keystore for the `production` build profile, and its SHA-1 is registered on the Android OAuth client for `com.dinh144.skinsense`, so a release-signed build can sign in with Google. No APK changes yet. Spec gate 2, stories 11–13.

**Blocked by:** None (can start immediately). Decided in `/to-tickets` 2026-09-14: do it early so ticket 03 can build as soon as the redesign ships.

**Status:** ready-for-human

- [ ] Dinh generates the release keystore through the interactive EAS prompt in a visible terminal (`!`)
- [ ] Claude reads the keystore's SHA-1 back from EAS and hands it over
- [ ] Dinh (or Claude in Chrome with Dinh watching) adds that SHA-1 to the Android OAuth client in Google Cloud Console; the existing debug fingerprint stays
- [ ] Development and preview profiles still use the debug keystore (emulator loop unchanged)

## Audit 2026-10-17

- Status: ready-for-human
- Evidence: Not started: eas.json has a production profile (buildType apk) but no release keystore or registered SHA-1 exists in the repo.
- Left: Release keystore and its SHA-1 in Google Cloud need the owner's (later the recipient's) own accounts. Covered by handoff-completion 12 (runbook) and 22 (launch checklist).
