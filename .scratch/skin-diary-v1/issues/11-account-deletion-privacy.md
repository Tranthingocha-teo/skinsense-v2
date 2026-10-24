# 11: Account deletion + privacy page (web + mobile)

**What to build:** a user can permanently delete their account and every photo, on both platforms, and can read what's collected before ever signing up.

**Blocked by:** 03, 07

**Status:** done

- [x] Privacy page (copy accepted by Dinh 2026-09-14; contact changed to `hi@gmail.com`, a placeholder by Dinh's choice) (web, linked from mobile) describing what's collected and how, reachable before sign-in — copy not yet written (2026-09-12 grill: Claude drafts from what's actually collected — photos, spot marks, zone readings, routine entries, Google email — Dinh reviews/edits before publish; do not ship a generic template unreviewed)
- [x] Delete-account flow: an Edge Function using the service-role key removes the user's storage objects **first**, then calls `auth.admin.deleteUser` — never done client-side, per spec.md's Implementation Decisions
- [x] After deletion: the user's row is gone from every domain table, their storage folder is empty, and their session is invalidated on both platforms
- [x] Deleting a user who owns photo objects succeeds (exercises the storage-objects-first ordering, not just an empty-account case)
- [x] All UI strings shipped in Vietnamese + English

## Now

Built 2026-09-13 (Claude, `/implement`).

- **Edge Function** `supabase/functions/delete-account/index.ts`, deployed to project `wzpubinyfoyufytorbmg` (v2, via the Supabase MCP): reads the caller's JWT, `admin.auth.getUser(token)` → 401 if invalid, lists + removes every object under `photos/<uid>/` (loop until empty), then `auth.admin.deleteUser`; domain rows cascade from `auth.users` (migration 0000). Deployed with **`verify_jwt: false`**: the gateway check answered the browser's CORS preflight (OPTIONS, no Authorization header) with 401, so the function verifies the user itself and answers OPTIONS with CORS headers. Source lives in the repo; there is no Supabase CLI on this machine, so redeploys go through the MCP `deploy_edge_function` (or `supabase functions deploy` once the CLI is installed).
- **Web**: `src/components/delete-account-button.tsx` (client; native `window.confirm`, `functions.invoke("delete-account")`, then `signOut({ scope: "local" })` — the server session is already gone — and `router.push("/")`), mounted under Sign out on `/app`. `src/app/privacy/page.tsx` (public, server component, `Privacy` namespace, `t.raw("sections")` like the landing features); the landing footer's `/privacy` link now resolves. `Account` + `Privacy` namespaces in `messages/{vi,en}.json`.
- **Mobile**: `(app)/index.tsx` gets a Delete-account `Pressable` → `Alert.alert` confirm → same `functions.invoke` + local `signOut` (the root `Stack.Protected` guard then shows sign-in); `sign-in.tsx` links to the privacy page through `ExternalLink` (in-app browser). `shell.*` + `signIn.privacy` strings in `locales/{vi,en}.json`. Typechecks and jest-expo green; **not run on a device** (sign-in on Android still waits on 01b, so the button cannot be reached there yet).
- **E2E** `apps/web/e2e/delete-account.spec.ts` (own account `e2e-delete@skinsense.test`, so the capture flow's photo history survives): seeds a `photos` row plus a real storage object, clicks Delete account, accepts the dialog, asserts redirect to `/`, `getUserById` → null, zero `photos` rows, empty storage folder, and `/app` redirects afterwards. Green in 8s. `signedInCookies` moved to `e2e/auth.ts` (takes the email) and `capture.spec.ts` imports it — that flow re-run, green in 33s.

Verified: `bun run typecheck` 4/4, `bun run test` 55 domain / 17 web / 6 mobile, both Playwright specs green, `/privacy` renders the five Vietnamese sections with `locale=vi`.

**Needs Dinh before publish** (first checkbox stays open on purpose):
1. Privacy copy review — `apps/web/messages/vi.json` → `Privacy` (and the `en` mirror). Drafted from what the schema and auth actually store; it names Supabase's region (Sydney, `ap-southeast-2`) and Vercel, and puts `dinhknd3@gmail.com` as the contact — swap for another address if you don't want that one public.
2. `apps/mobile/src/app/sign-in.tsx` → `PRIVACY_URL` is a placeholder `https://skinsense.vercel.app/privacy`; set it to the real domain once `apps/web` is deployed (ticket 14's Next).

## Next

- Dinh: read the privacy copy, then on `localhost:3000` sign in with a throwaway Google account, take one photo, press "Xóa tài khoản" → confirm → back on the landing page; the Supabase dashboard shows the user, its rows and its storage folder gone.
- Then `/commit`. Remaining web-chain tickets: 15 (fixture acceptance test), 17 (live redness mode), then the mobile chain 18 → 01b → 08 → 10 → 13.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 84c19e8; supabase/functions/delete-account; apps/web/e2e/delete-account.spec.ts; /privacy page; refined by redesign-build 09 and 12.
