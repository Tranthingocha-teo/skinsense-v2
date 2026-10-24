# 22: Biometric lock (Android)

**What to build:** an Android user turns on the fingerprint lock; the app then asks on cold start and when returning from the background, keeps content blurred behind the lock, falls back to the screen lock, and shows a dialog to the security settings when no fingerprint is enrolled. Spec: Features (biometric lock); stories 96–98.

**Blocked by:** 09.

**Status:** ready-for-agent

- [ ] expo-local-authentication with device-credential fallback; the dev build is rebuilt if the module is new
- [ ] Off by default; toggle in Cài đặt on Android only
- [ ] Asked on cold start and when returning from background; content behind the lock stays blurred
- [ ] No fingerprint enrolled: a dialog linking to the security settings, toggle stays off
- [ ] jest-expo screen tests: lock shown when on, unlock success and failure, not-enrolled dialog
- [ ] Maestro: biometric lock with the emulator's fingerprint
- [ ] Light and dark screenshots match AndroidLock and LockNotEnrolled; differences noted here

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: No biometric dependency in apps/mobile/package.json and no lock toggle in settings.tsx.
- Left: Whole ticket: lock toggle, prompt on open, no-biometrics fallback. Covered by handoff-completion 07.
