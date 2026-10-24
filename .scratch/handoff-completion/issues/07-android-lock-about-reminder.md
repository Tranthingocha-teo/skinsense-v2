# 07: Android biometric lock, about and licenses, and the evening reminder

Parent: [spec](../spec.md)

**What to build:** Finish redesign tickets 18, 21 and 22: the evening reminder (scheduling, permission denied and disabled states), the about and licenses screen listing the real dependency licenses, and the biometric lock with its fallback when no biometrics are enrolled.

**Blocked by:** 04 (redesign-account-surfaces)

**Status:** ready-for-agent

- [ ] Reminder can be turned on and off, survives restart, and shows the denied-permission state
- [ ] About and licenses list the app's real dependencies and versions
- [ ] Biometric lock locks on resume, unlocks, and handles unavailable biometrics
- [ ] Jest tests and Maestro flows exist for each; redesign tickets 18, 21, 22 marked done

## Audit 2026-10-17

- Scope narrowed by audit: redesign-build 18 (reminder) and 21 (about and licenses) are done (commits c8f5775, 3e95231). Only redesign-build 22, the biometric lock, is open.
