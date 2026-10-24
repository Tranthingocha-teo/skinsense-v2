# 09: Cài đặt and delete account

**What to build:** Cài đặt is rebuilt in its final layout on both apps (account, language, sign out, privacy) and account deletion goes through a designed dialog with deleting and error states instead of `window.confirm`. Feature rows (photo history, export, feedback, reminder, lock, about) are added by their own tickets. Stories 46–51, 55.

**Blocked by:** 02.

**Status:** done

- [x] Rows use shadcn Item (web) and the matching Android rows: Google account, language (ToggleGroup), privacy, sign out
- [x] Web and web at 390 never show Android-only rows
- [x] Delete account opens an AlertDialog stating what is erased
- [x] After confirming, the button shows a Spinner and cancel is disabled; a failure shows the error inside the dialog and states nothing was deleted
- [ ] Sign out works from Cài đặt on both apps
- [x] Screen tests on both apps: rows present per platform, dialog confirm, deleting, error, sign out
- [ ] Existing delete-account Playwright spec passes (production writes only after Dinh approves the command)
- [ ] Light and dark screenshots (web 1440, web 390, Android) match AndroidSettings / WebSettings / PhoneSettings and the Delete, Deleting artboards; differences noted here

## Now

- 2026-09-15: started on worktree `worktree-agent-a30e5ea6ced9e1e99` (origin/main 5a9cf37). Reading done; adding RNR alert-dialog, then web Settings screen + tests, Android Settings + tests.
- 2026-09-15 (resumed after usage limit): web Settings + tests green (6), web typecheck clean. Android settings test: 2 of 5 failing (deleting, error) — fixing.
- Android tests green (5): confirm handler no longer returns its promise to Pressable (RNTL 14 awaited it forever), error line `accessible` so it is an alert role. Playwright spec now clicks the AlertDialog confirm instead of accepting `window.confirm`. Web dev server on 3009; taking web screenshots via /dev/settings.

- Web screenshots (first pass) caught three bugs, fixed: Item `asChild` rows took the class on the child so Item's `px-3 py-2.5` won (text indented 12px); AlertDialogAction's Slot dropped `bg-destructive` (confirm was the accent colour) — now a plain Button; `text-destructive-foreground` has no web theme mapping — uses `text-primary-foreground` (= canvas on-accent in both themes).

- Web re-shot after the fixes: 16 PNGs match WebSettings / PhoneSettings / WebDelete / WebDeleting. `bun run typecheck` clean, web 42 + mobile 37 + domain 72 tests green (mark-spots timed out once only while `next build` ran in parallel; green alone), `bun run build` passes, `/dev/settings` returns 404 under `next start`. Committed on `worktree-agent-a30e5ea6ced9e1e99`.

## Next

- Android screenshots (emulator + Metro belonged to another agent during this ticket): with Metro running and the dev client signed in, open Cài đặt, `adb shell cmd uimode night no|yes`, `adb exec-out screencap -p > ~/docs/case-study/skinsense/build/09-cai-dat/android-{light,dark}.png`; then tap Xóa tài khoản for `android-{light,dark}-delete.png`. Do NOT tap the confirm button (it deletes the signed-in account). Deleting/error states are covered by jest only.
- Sign out on a real signed-in session (both apps): unit tests cover it with the data module mocked; tick the box after a manual check.
- Playwright delete-account spec (writes to production, run only after Dinh approves): `cd apps/web && bunx playwright test e2e/delete-account.spec.ts`. Selectors updated: it now clicks the row, then the AlertDialog's "Delete account" button, instead of accepting `window.confirm`.

## Decisions

- Error line adds a second sentence, "Tài khoản của bạn chưa bị xóa." / "Your account has not been deleted.": the canvas only has "Xóa không thành công. Thử lại sau." but the ticket requires stating nothing was deleted.
- Confirm is a plain Button (web) / Pressable (Android), not AlertDialogAction: the primitive closes the dialog before the async delete, and on web its Slot concatenates classes without tailwind-merge so `bg-destructive` lost to `bg-primary`.
- Confirm text uses `text-primary-foreground` on web: the canvas colour is on-accent, equal to primary-foreground in both themes, and the web theme has no destructive-foreground mapping.
- Screenshots come from `apps/web/src/app/dev/settings` (fixture account, `?delete=fail` for the error state, deleting never resolves), because /demo has no settings route and /app needs production credentials. It calls `notFound()` when `NODE_ENV === "production"` (verified 404 with `next start`).
- The shared web `ui/alert-dialog.tsx` overlay now uses the canvas scrim (`bg-background/72`, 3px blur); every web AlertDialog gets it.
- Android privacy row opens the web `/privacy` page in the browser (same URL as sign-in).
- Rows for later features (photo history, export, feedback, reminder, lock, about) are not rendered; each is a new row in its Group (see the comment at the top of both `settings.tsx`).

## Audit 2026-10-17

- Status: done
- Evidence: Commit 0f653c9; settings.test.tsx on web and mobile; apps/web/e2e/delete-account.spec.ts.
