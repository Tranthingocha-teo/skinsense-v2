# 03: Auth wiring + session + schema/migration tooling (web + mobile)

**What to build:** sign in with Google on both platforms, land on an authenticated (empty) app shell, session survives a restart, and the domain-owned schema is live as real Supabase tables under RLS.

**Blocked by:** 01a

**Status:** ready-for-agent

- [x] `packages/domain`'s TypeScript entity definitions (Photo, Spot, ZoneReading, RoutineItem, RoutineEntry, per ADR 0002/0004) generate the Supabase migration — not hand-written SQL
- [x] Every table carries `user_id uuid default auth.uid()` with matching RLS scoped to `auth.uid()`
- [x] Web: client-side Google ID token → `supabase.auth.signInWithIdToken`; `@supabase/ssr` with cookie sessions + a refresh middleware (Server Components can't write cookies themselves); no CDN ever caches a `Set-Cookie` response
- [x] Mobile — **the Google sign-in half waited on [01b](./01b-android-oauth-client.md), wired 2026-09-13 night** (no Android OAuth client ID exists until the first EAS build yields a keystore SHA-1); build the session layer now, leave the sign-in call un-wired and this box un-ticked. Client-side Google ID token → `supabase.auth.signInWithIdToken`; session persisted via the `LargeSecureStore` pattern (AES key in SecureStore, ciphertext in AsyncStorage — plain SecureStore truncates past 2048 bytes); auto-refresh tied to `AppState`
- [x] Signed-in user sees an authenticated empty shell; closing and reopening the app (mobile) / revisiting (web) keeps the session without re-prompting sign-in
- [ ] Two separate Google accounts each see zero rows belonging to the other (RLS smoke test)
- [x] i18n scaffolding in place (`next-intl` on web, `i18next` + `expo-localization` on mobile) with Vietnamese + English for every string this ticket introduces — not retrofitted later

## Now

Step 1/3 done (2026-09-13): `packages/domain/src/schema.ts` (Drizzle, 5 tables, `user_id uuid default auth.uid()` → `auth.users` cascade, RLS + one `owner only` policy per table); `src/schema.test.ts` asserts that structurally; `bun run db:generate` → `packages/domain/drizzle/0000_init.sql`. Applied 2026-09-13 via the Supabase MCP (Dinh authorized it) as migration `init`; verified in `pg_class`/`pg_policies`: 5 tables, RLS on, 1 policy each, `user_id` default `auth.uid()`; security advisors clean. Drizzle's `authUid` is a subquery and Postgres rejects it in DEFAULT, so the column default is `sql\`auth.uid()\``. Step 2/3 done: `apps/web` — `src/lib/supabase/{client,server}.ts`, `src/proxy.ts` (refresh + `/app` gate + `Cache-Control: private, no-store` when cookies are set), `next-intl` (`src/i18n/request.ts`, `messages/{vi,en}.json`, locale = cookie `locale` else Accept-Language), `/` = GIS button → `signInWithIdToken` with hashed nonce, `/app` = empty shell + sign-out. Verified unauthenticated on `bun dev`: `/app` → 307 `/`, `/` renders vi/en by Accept-Language. Sign-in verified 2026-09-13 with Dinh's account on `localhost:3000` (the only origin the Google Web client allows): `/app` shows the email, revisiting `/` stays signed in, sign-out returns to `/`. Web React pinned to 19.2.3 (same as mobile) so bun hoists one copy — Testing Library was loading mobile's React. Step 3/3 done: `apps/mobile` — `src/lib/large-secure-store.ts` (+ jest round-trip test past 2048 bytes), `src/lib/supabase.ts` (client + AppState auto-refresh + url polyfill), `src/lib/auth.ts` (`useSession`, `signInWithGoogleIdToken(idToken)` for 01b to call), `src/i18n.ts` + `src/locales/{vi,en}.json`, `_layout.tsx` = `Stack.Protected` on session (`sign-in` vs `(app)/index` shell with sign-out). `@react-native-google-signin` deliberately not installed (needs 01b's Android client + a Gradle rebuild nobody can verify yet); the sign-in button explains that. Template `index.tsx`/`explore.tsx`/`app-tabs*` removed (orphaned by the Stack); other template components untouched. Not booted on a device: no `android/` exists yet, first `expo run:android` belongs to ticket 18. `bun run typecheck` 4/4, `bun run test` 36 green.

## Next

- Web (mobile untested on device): only the 2-account RLS smoke test is left, Dinh's second Google account.
- Mobile: sign-in verified on the emulator 2026-09-13 22:02 (01b); the two-account RLS smoke test can run on mobile as well.
- Two-account RLS smoke test needs a second Google account: Dinh.

## Comments

- 2026-09-14 (`/grill-me`, third pass): the RLS smoke box is Claude's before 20/09 — a Playwright spec with two admin-created `@skinsense.test` accounts (like `delete-account.spec.ts`), no second Google account needed. Test accounts are deleted through `delete-account` on 19/09 after the last E2E run.

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: Auth and schema shipped: google-sign-in.test.tsx, apps/mobile/src/lib/auth.ts, schema.test.ts, drizzle migrations 0000-0004 (commit 2413e0c).
- Left: Two-account RLS smoke test: no spec for it in apps/web/e2e. Covered by handoff-completion 15 (backend from zero, seed user); add the spec there.
