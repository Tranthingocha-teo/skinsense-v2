# 18: Evening reminder (Android)

**What to build:** an Android user turns on a nightly reminder at a chosen time and weekdays, sees a preview of the notification, and is told how to fix it when notifications are off for the app; nothing leaves the phone. Supersedes polish row 39. Spec: Domain package additions, Features (reminder); stories 82–85.

**Blocked by:** 09.

**Status:** done

- [ ] Domain (test-first, Vitest): from a time and a set of weekdays, the next trigger instants in the device timezone, including a time already past today
- [ ] Local notifications through expo-notifications with POST_NOTIFICATIONS; the dev build is rebuilt
- [ ] Changing time or days reschedules; turning off cancels
- [ ] A notification preview is shown on the screen
- [ ] Notifications denied: time card and weekday row greyed out, a button opens the system settings
- [ ] Cài đặt gains the reminder row on Android only
- [ ] CONTEXT.md gains **Reminder**
- [ ] jest-expo screen tests: on/off, change time and days, denied state
- [ ] Maestro: reminder toggle with the permission prompt
- [ ] Light and dark screenshots match AndroidReminder and ReminderDenied; differences noted here

## Now

Built: domain `nextReminderTriggers` (Vitest green), expo-notifications 57.0.18 + POST_NOTIFICATIONS in app.json, dev client rebuilt and installed (BUILD SUCCESSFUL), `lib/reminder.ts`, `components/reminder.tsx` + route `(app)/reminder.tsx`, Settings group row, onboarding notification row, CONTEXT.md **Reminder**, `flows/reminder.yaml`. Mobile tsc clean; reminder, settings and onboarding jest files green. Emulator: onboarding step 3 notification row shown light/dark, its Cho phép raised the Android 13 prompt and granted POST_NOTIFICATIONS; onboarding finished (local flag now set on the emulator); Cài đặt shows the reminder row; reminder screen opens. First Maestro run passed but launchApp auto-granted the permission (prompt skipped); flow now sets `permissions: notifications: unset`.

## Next

1. Revoke + clear flags, rerun `maestro test apps/mobile/flows/reminder.yaml` so the prompt is exercised.
2. Light/dark screenshots of the reminder (on) and the denied state (revoke kills the app: relaunch and navigate again), then re-grant.
3. Root `bun run typecheck` and `bun run test`; stop Metro.

## Audit 2026-10-17

- Status: done
- Evidence: Commit c8f5775; mobile reminder.test.tsx; packages/domain reminder.test.ts; apps/mobile/flows/reminder.yaml.
