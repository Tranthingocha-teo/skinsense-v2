# 20: Feedback

**What to build:** a signed-in user sends a bug report, an idea or other feedback with an optional app and device note, is told no photos or skin data are attached, and gets a confirmation or an inline error; Dinh reads it in the dashboard. Supersedes polish row 24 (adds kind). Spec: Schema, Domain package additions; stories 90–93.

**Blocked by:** 09.

**Status:** done

- [x] Domain (test-first, Vitest): feedback message validation (non-empty, at most 2000 characters)
- [ ] Schema in the domain package: `feedback` table with owner columns, kind (bug | idea | other), message, platform (web | android), nullable app version and device/browser note, created_at; owner insert and read only; migration applied to production only after Dinh approves
- [ ] RLS checked from a second account
- [x] Form: kind ToggleGroup, Textarea, opt-in app and device note (filled only when opted in), the "no photos or skin data attached" statement; written through supabase-js, no Edge Function
- [x] Sent: confirmation screen on Android, Sonner toast on the web; failure shows an inline error
- [x] Web at phone width uses the browser wording
- [x] Cài đặt gains the feedback row on both apps
- [x] Screen tests on both apps: validation, sent, error
- [ ] Playwright and Maestro: feedback submit (production writes only after Dinh approves the command)
- [ ] Light and dark screenshots match the Feedback, FeedbackSent, WebFeedbackSent and FeedbackError artboards; differences noted here

## Now

- 2026-09-15: started on worktree `worktree-agent-aba97b61a2275dbf3` (origin/main 0f653c9).
- Domain: `packages/domain/src/feedback.ts` (+ 4 tests) and the `feedback` table in `schema.ts` (insert + select policies, message length check); `schema.test.ts` updated for the sixth table; `drizzle/0003_feedback.sql` generated locally, NOT applied. The schema box stays open until the migration is applied.
- Web: `components/feedback.tsx` (+ 5 tests), `lib/feedback.ts`, route `/app/settings/feedback`, dev fixture `/dev/settings/feedback` (`?send=fail`), Feedback row in Cài đặt, `<Toaster />` in the root layout, `ui/sonner.tsx` restyled to the canvas toast, `e2e/feedback.spec.ts` written (not run).
- Android: `components/feedback.tsx` (+ 5 jest tests), `lib/feedback.ts`, route `(app)/feedback.tsx`, RNR `ui/textarea.tsx` added via CLI (nothing overwritten), Feedback row in Cài đặt, `flows/feedback.yaml` written (not run).
- Verified: root `bun run typecheck` 5/5 clean; root `bun run test` green (domain 83, web 47, mobile 42); `cd apps/web && bun run build` passes; under `next start` `/dev/settings/feedback` and `/dev/settings` return 404 and a signed-out `/app/settings/feedback` redirects to `/`.
- Web screenshots (12 PNGs: 1440 and 390 × light and dark × form, error, sent) in `~/docs/case-study/skinsense/build/20-feedback/` match WebFeedback, WebFeedbackError, WebFeedbackSent and PhoneFeedback. Committed on `worktree-agent-aba97b61a2275dbf3`.

Differences from the canvas (web):
- The form shot shows the send button disabled (50% opacity): the message is empty and send waits for one. The canvas draws it enabled.
- The form shot has the opt-in unticked, because it is opt-in. The canvas draws the ticked state; the error shot shows it ticked.
- The dev screenshots show Next's dev indicator ("N", bottom left); production has none.

## Next

1. Apply the migration (production, Dinh approves first). Use the same route as `init`, `routine_items_unique_label` and `photos_storage_owner_policy`: the Supabase MCP `apply_migration` with name `feedback` and the exact body of `packages/domain/drizzle/0003_feedback.sql`. Verify with `select policyname, cmd from pg_policies where tablename = 'feedback';` (expect `feedback: owner insert` INSERT and `feedback: owner read` SELECT). Then tick the schema box.
2. RLS second-account check (production read plus a rolled-back write, Dinh approves). Take two existing user ids A and B from `auth.users` and run through the Supabase MCP `execute_sql`:
   ```sql
   begin;
   set local role authenticated;
   set local request.jwt.claims = '{"sub":"<B>","role":"authenticated"}';
   select count(*) from feedback where user_id = '<A>';            -- expect 0
   update feedback set message = 'x' where user_id = '<B>';        -- expect UPDATE 0 (no update policy)
   insert into feedback (user_id, kind, message, platform)
     values ('<A>', 'bug', 'rls check', 'web');                    -- expect: violates row-level security policy
   insert into feedback (kind, message, platform)
     values ('bug', 'rls check', 'web');                           -- expect: INSERT 0 1 (user_id defaults to B)
   rollback;
   ```
   Then tick the RLS box.
3. Playwright (after step 1; writes one row for `e2e@skinsense.test` and deletes it again): `cd apps/web && bunx playwright test e2e/feedback.spec.ts`.
4. Maestro (after step 1; writes one row, signed-in dev client, device locale en): `maestro test apps/mobile/flows/feedback.yaml`. Then tick the Playwright and Maestro box.
5. Android screenshots (the emulator and Metro belonged to another agent during this ticket). With Metro running and the dev client signed in: Cài đặt → Góp ý, then `adb shell cmd uimode night no|yes` and `adb exec-out screencap -p > ~/docs/case-study/skinsense/build/20-feedback/android-{light,dark}-feedback.png`. For the error state without writing: type a message, run `adb shell cmd connectivity airplane-mode enable`, tap Gửi góp ý, capture `android-{light,dark}-error.png`, then `airplane-mode disable`. The sent state only exists after a real write, so capture it during step 4. Check the three colours noted under Decisions on the device.
6. Reading feedback: Supabase dashboard → Table editor → `feedback` (the service role bypasses RLS).

## Decisions

- The message is validated and stored trimmed: 1–2000 characters, UTF-16 length. The DB adds `check (char_length(message) between 1 and 2000)`. UTF-16 length is never below `char_length`, so the check cannot reject what the app accepts.
- `kind` and `platform` are drizzle text enums (TypeScript only, no DB CHECK), the same as the existing `zone` columns.
- Two policies, owner insert and owner read. There is no update or delete policy: sent feedback is final. Dinh reads it with the service role in the dashboard.
- The migration was generated with `--name feedback` (`0003_feedback.sql`), matching the descriptive names of 0001 and 0002.
- The device note defaults to off (opt-in); the canvas draws the ticked state. Web attaches `apps/web/package.json` version + `navigator.userAgent`. Android attaches the expo config version + `manufacturer modelName, Android osVersion` (expo-constants and expo-device, both already installed).
- Send stays disabled while the message is empty or too long. Over 2000 characters, a line reads "Nội dung tối đa 2000 ký tự." / "Keep it to 2000 characters." (new string; the canvas has no validation state). While sending, the button is disabled with no spinner (the canvas has no sending state).
- Web sent: `router.push` back to Cài đặt plus `toast.success`. The `<Toaster />` sits in the root layout so the toast survives the navigation (offset 32; at phone width `mobileOffset` bottom 88 clears the 72px tab bar). `ui/sonner.tsx` is restyled globally: surface-2, 1px fg at 14%, control radius, a check icon in success.
- The Settings row and the back link derive their paths from the current pathname (`/app/settings` ↔ `/app/settings/feedback`), so the dev fixture at `/dev/settings/feedback` links within `/dev`.
- The shadcn `SidebarProvider` Ctrl/Cmd+B listener (ticket 02 caveat) is left in place: a plain textarea has no Ctrl+B action, so swallowing it costs nothing while typing.
- The Android opt-in row is one `Pressable role="checkbox"` drawing the canvas TICK (22px circle on a 48px row), not the RNR Checkbox (a 16px square with a separate label target).
- Android colours avoid opacity modifiers: the NativeWind colours are `hsl(var(--x))` without `<alpha-value>`. Three canvas colours are approximated with tokens: the textarea border is muted-foreground (canvas fg 30%), the sent circle border is success (canvas good 60%), the Xong border is muted-foreground (canvas fg 55%). Unverified on device.
- The web form test renders `<Toaster theme="light" />`: Sonner's "system" theme calls `matchMedia`, which jsdom lacks.

## Audit 2026-10-17

- Status: done
- Evidence: Commits 4f6a92e and 7428147; feedback.test.tsx on both apps; domain feedback.test.ts; e2e/feedback.spec.ts; flows/feedback.yaml; drizzle/0003_feedback.sql.
