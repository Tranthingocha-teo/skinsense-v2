# 08: Share before/after, data export and feedback

Parent: [spec](../spec.md)

**What to build:** Finish redesign tickets 17, 19 and 20: a before/after image the user can share, an export of the user's data, and an in-app feedback form that stores the message. Each handles its error and empty states.

**Blocked by:** 05 (redesign-core-capture-spots-trends)

**Status:** ready-for-agent

- [ ] Share produces the before/after image from two chosen photos
- [ ] Export contains the user's own data only and fails clearly on error
- [ ] Feedback stores a message and confirms; its table and policy come from the committed migrations
- [ ] Tests follow existing kinds; redesign tickets 17, 19, 20 marked done

## Audit 2026-10-17

- Scope narrowed by audit: redesign-build 20 (feedback) is done (commit 4f6a92e, e2e/feedback.spec.ts). Only 17 (share before/after) and 19 (export) are open; neither has any code yet.
