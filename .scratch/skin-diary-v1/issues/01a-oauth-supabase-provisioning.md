# 01a: Provision Supabase + Google OAuth (web side)

**What to build:** the external accounts and credentials every later ticket wires against. Console/dashboard work, not code — no agent can click through Google Cloud Console or Supabase's dashboard, so this ticket is for Dinh, not `/implement`.

**Blocked by:** None (can start immediately)

**Status:** done

Run `bash .scratch/skin-diary-v1/issues/01-wizard.sh`; it walks these steps. Stage 5 (Android OAuth client) now asks before running — answer **n**, it belongs to [01b](./01b-android-oauth-client.md). Stage 6's "Authorized Client IDs" field then has nothing to add yet; leave it and come back with 01b.

- [x] Supabase project created, project URL + anon key + service-role key recorded somewhere Dinh controls (never committed to git)
- [x] Supabase Storage: private `photos` bucket created
- [x] Google Cloud OAuth consent screen published to Production, scopes limited to `email`+`profile` (avoids verification, user caps, grant expiry)
- [x] Web OAuth client ID created, authorized JS origins set for local dev + the eventual Vercel domain
- [x] Supabase Auth's Google provider configured with the Web client ID as `webClientId`
- [x] All client IDs / keys handed off as env vars to whoever picks up ticket 03 — never committed to git

Split out of the original ticket 01 on 2026-09-12: the Android OAuth client needs a SHA-1 from the EAS build keystore, which does not exist until the first EAS build runs, so it could never have been ticked in the same sitting. It is [01b](./01b-android-oauth-client.md).

## Answer

Done 2026-09-12 evening, wizard run from a real terminal (the first two attempts went through Claude Code's `!` prompt, which has no TTY, so every `read` hit EOF and the env files came out empty — the wizard now refuses to start without a TTY).

Verified, not taken on trust:

- `GET /storage/v1/bucket` → `photos`, `public: false`
- `GET /auth/v1/settings` → `external.google: true`
- Both calls authenticated with the keys the wizard wrote, so the keys themselves are good.

Consent screen published to Production: confirmed by Dinh, not machine-checkable from here.

Env written and gitignored: `apps/web/.env.local` (Supabase URL/anon/service_role, Google web client ID + secret), `apps/mobile/.env` (Supabase URL/anon, Google web client ID).

`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is present but empty — the Android client was not created. A debug keystore was generated at `~/.android/debug.keystore` with SHA-1 `A8:A1:32:46:3B:50:22:BD:FA:C2:88:39:3B:13:C8:6F:61:AA:BD:AC`; registering it, and the EAS one, is [01b](./01b-android-oauth-client.md).

Also found while doing this: `eas` is installed at `~/.bun/bin/eas` (24.2.x, an upgrade is available) but **not logged in**, and `apps/mobile` has no `eas.json` — so ticket [18](./18-native-capture-spike.md) starts with an Expo account, `eas login` and `eas init`, not with a build.

## Audit 2026-10-17

- Status: done
- Evidence: Was resolved: Supabase project, private photos bucket and Google web client exist (supabase/functions/delete-account, drizzle/0000_init.sql, production deploy). Owner-specific, rebuilt by the recipient via handoff-completion 15.
