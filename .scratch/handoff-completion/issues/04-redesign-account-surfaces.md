# 04: Sign-in with Xem thử, Cài đặt and delete-account on web and Android

Parent: [spec](../spec.md)

**What to build:** Finish redesign tickets 08 and 09: Android sign-in with the "Xem thử" demo entry and its banner, Cài đặt in its final layout, and a custom delete-account dialog with deleting and error states that removes the user's data completely on both platforms.

**Blocked by:** 03 (redesign-foundation-shell-today)

**Status:** ready-for-agent

- [ ] Sign-in, Xem thử and its banner work on web and Android
- [ ] Cài đặt matches the design and has no dead entries
- [ ] Delete account shows idle, deleting and error states and leaves no data behind (covered by the existing delete-account test)
- [ ] Redesign tickets 08 and 09 are marked done with evidence

## Audit 2026-10-17

- Scope narrowed by audit: redesign-build 09 (Cài đặt, delete account) is done (commit 0f653c9, e2e/delete-account.spec.ts). Only redesign-build 08 is open: Android Xem thử, its sign-in entry and privacy link, the Android banner, and their tests.
