# 08: Long tail — timeline, feedback, import, PWA, demo extras, library, exports, reminders, Android extras

**What to build:** spec rows 22–41 in table order. Stories 35–38, 42, 48–58, 60–62, 64–69. Estimate ~36 h.

**Coarse ticket:** far larger than one context window and not expected before the deadline; kept so nothing in the spec is lost. `/implement` works it row by row in table order and records finished rows in `## Now`.

**Blocked by:** 07

**Status:** superseded (by redesign-build 14-23)

**Human stops budgeted in this ticket:**
- Every production migration (rows 24, 25, 39) goes through Dinh's per-command approval.
- Row 39 needs Dinh's Firebase project + FCM V1 key uploaded to EAS (~15 min) before it starts.

- [ ] Row 22: Clinical calm pass on the remaining v1 screens (Chụp, spot marking, routine edit, Xu hướng), both apps
- [ ] Row 23: photo timeline with per-zone detail per photo, both apps
- [ ] Row 24: feedback form in Cài đặt (signed-in only), both apps; `feedback` table defined in the domain schema, drizzle-kit migration (owner columns, message non-empty ≤2000 chars, platform, app version, created_at); owner insert/read RLS checked from a second account; direct supabase-js insert, no Edge Function
- [ ] Row 25: Android gallery import — `photos.source` enum `camera` | `import` (not null, default `camera`) via domain schema + drizzle-kit; runs landmark detection as spot marking does; stores no ZoneReadings; carries spots, shows on the timeline, excluded from the capture streak; demo generator tests updated; "imported Photo" in `CONTEXT.md`
- [ ] Row 26: web PWA (manifest + service worker; installable)
- [ ] Row 27: demo presentation mode
- [ ] Row 28: demo step-by-step pipeline replay (landmarks → mask → zones → a*)
- [ ] Row 29: changelog page built from git log + ADRs
- [ ] Row 30: Android new-APK notice comparing the app version with the latest GitHub Release of `dinh144/skinsense-releases`
- [ ] Row 31: Android one-hand mode
- [ ] Row 32: demo personas with shareable links + side-by-side view
- [ ] Row 33: knowledge library, ~5 articles vi + en, each citing AAD or DermNet, with the disclaimer, no treatment or product advice
- [ ] Row 34: Android biometric lock toggle in Cài đặt, off by default, asks on open when on
- [ ] Row 35: Android social share card image without the face
- [ ] Row 36: illustrations on empty states and onboarding
- [ ] Row 37: progress report export PNG + PDF, both apps
- [ ] Row 38: Android full photo/data export
- [ ] Row 39: reminders — **domain test-first** due check (minutes, timezone, last sent date, now → due in this 5-min slot + local date to mark; tests: slot boundaries, timezone offset, already sent, disabled); `reminders` + `push_subscriptions` tables with owner RLS; `pg_cron` every 5 min → Edge Function via `pg_net`, answers fast, marks last sent before sending; Cài đặt time picker in 5-min steps + permission state; web push after a ≤30 min Deno-native Web Push spike (drop web push if the spike fails); Android via `expo-notifications` + Expo Push Service; checked once by hand against a test subscription; "Reminder" in `CONTEXT.md`
- [ ] Row 40: Android Quick Settings tile for capture
- [ ] Row 41: Android home-screen widget with tonight's status and streaks

## Now

## Next

## Audit 2026-10-17

- Status: superseded (by redesign-build 14-23)
- Evidence: Rows with a redesign ticket: timeline 14, feedback 20, biometric lock 22, share card 17, export 19, reminders 18, Android extras 21. The other rows (PWA, presentation mode, pipeline replay, changelog, one-hand mode, personas, library, quick tile, widget, gallery import, new-APK notice) have no ticket and are dropped.
