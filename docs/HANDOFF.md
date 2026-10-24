# Handoff: read this first

This repository is handed over as-is by its original author, who will not be available. It contains no accounts, keys or environment files. Everything below assumes you start from nothing.

## What you can do without any account

```
bun install
bun run typecheck
bun run test
cd apps/web && bun dev      # http://localhost:3000, public pages and the /demo routes
```

CI (`.github/workflows/ci.yml`) does the same with no secrets. Android needs Android Studio and a development build (see [DEVELOPMENT.md](DEVELOPMENT.md)).

## Verified before handoff (2026-10-17)

The zip was unpacked into an empty directory with no environment variables, then: `bun install --frozen-lockfile`, `bun run typecheck` (5 of 5 tasks), `bun run test` (domain 16 files, web 18 files, mobile 86 tests) and `next build` all passed, and `next start` served `/`, `/demo`, `/demo/history`, `/demo/routine`, `/demo/trends`, `/privacy` and `/case-study` with HTTP 200. `/app` answers 500 with a message naming the missing Supabase variable until you configure your own backend. The five SQL migrations in `packages/domain/drizzle` were also applied in order to an empty Postgres (PGlite, with stand-ins for `auth.users`, `auth.uid()`, `storage.objects` and the `authenticated` role), and a test (`packages/domain/src/migrations.test.ts`, part of `bun run test`) checks that one user cannot read or write another user's photos or storage objects. Not verified: anything on a phone or emulator, a real Supabase project, Google OAuth, the `delete-account` function deployed, Vercel, EAS, the release build.

## State of the project

Built and tested (web + Android): token foundation and app shell, Hôm nay, Routine, Chụp, Đánh dấu nốt mụn, Xu hướng, photo history and detail, notes and tags, choosing two dates, evening reminder (Android), feedback, about and licenses, account deletion, landing page, case study, privacy and 404. Tests: Vitest (domain, web), jest-expo (mobile), Maestro flows (`apps/mobile/flows`) and Playwright specs (`apps/web/e2e`).

Not built (redesign tickets still open, see [.scratch/INDEX.md](../.scratch/INDEX.md)):

| Ticket | What is missing |
|---|---|
| redesign-build 08 | Android "Xem thử" (demo mode), its entry on the sign-in screen and banner. The web demo exists. |
| redesign-build 17 | Share a before/after image. |
| redesign-build 19 | Export of the user's data. |
| redesign-build 22 | Biometric lock (Android). |
| redesign-build 23 | Final brand assets (only the old monogram icons exist). |

Not run (need real accounts or a phone): the release-signed APK, the Android QA checklist on a real phone (`.scratch/skin-diary-v1/qa-android-checklist.md`), and the Lighthouse audit of every page. Nothing in the repo claims these were done. The on-device screenshots for the finished redesign tickets were also not all captured; each ticket under `.scratch/redesign-build/issues/` lists what is left.

One web test (`web#test`) failed once under parallel load and passed on rerun; if CI shows it red, rerun first.

## Set up your own backend (from zero)

You need free accounts at Supabase, Google Cloud, and (to deploy) Vercel and Expo.

1. **Supabase project.** Create one. In the SQL editor (or with the Supabase CLI) run the files in `packages/domain/drizzle/` in numeric order (`0000` to `0004`). `0002` creates the access policy on the private `photos` storage bucket, so first create a **private** bucket named `photos` in Storage.
2. **Auth.** Enable the Google provider in Supabase Auth. Sign-in is Google only (`signInWithIdToken`). Details: `docs/research/auth-google-idtoken.md` and `docs/research/supabase-expo-nextjs.md`.
3. **Google Cloud OAuth clients.** Create a Web client and an Android client. The Android client needs the package name from `apps/mobile/app.json` and the SHA-1 of the keystore that signs your build (the debug keystore for development builds, your release keystore for release APKs). Put the web client in Supabase Auth and the client ids in the env files.
4. **Edge Function.** Deploy `supabase/functions/delete-account` to your project (Supabase CLI: `supabase functions deploy delete-account`). It needs the project's service-role key as a function secret.
5. **Environment variables.** Create `apps/web/.env.local` and `apps/mobile/.env` with the variables below (if `apps/web/.env.example` and `apps/mobile/.env.example` exist in your copy, they hold the same list with comments). Demo pages, typecheck and tests need none of them; the signed-in app and Google sign-in fail with an error that names the first missing variable.

   | Variable | App | Kind | Where to get it |
   |---|---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | web | public | Supabase dashboard, Project Settings, API, Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | public | same page, anon / publishable key (row-level security guards the data) |
   | `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | web | public | Google Cloud Console, Credentials, the Web application client; use the same ID in Supabase Auth, Google provider |
   | `SUPABASE_SERVICE_ROLE_KEY` | web, Playwright e2e only | **secret** | same API page, service_role; bypasses row-level security, never put it in a `NEXT_PUBLIC_` variable |
   | `E2E_BASE_URL` | web, optional | public | URL of a deployment to run Playwright against instead of `bun dev` |
   | `EXPO_PUBLIC_SUPABASE_URL` | mobile | public | same as the web URL |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile | public | same as the web anon key |
   | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | mobile | public | the same Web application client ID (Android sign-in uses it to request the ID token) |

   `NEXT_PUBLIC_` and `EXPO_PUBLIC_` values are inlined into the shipped bundle on purpose. The `delete-account` Edge Function reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which Supabase injects into deployed functions itself.
6. **Web deploy (optional).** Create a Vercel project from `apps/web`. `apps/web/vercel.json` schedules a daily ping to `/api/cron/ping` so the free Supabase project does not pause (it needs only the two public Supabase variables; no extra secret).
7. **Android release (optional).** `cd apps/mobile`, create a keystore with EAS (`eas credentials`), add its SHA-1 to the Android OAuth client, build with `eas build -p android --profile production` (profiles `development`, `preview`, `production` are in `apps/mobile/eas.json`), and install the APK on a phone. `apps/mobile/app.json` still carries the author's Expo `owner`, EAS `projectId` and Android `package` (`com.dinh144.skinsense`): change all three and run `eas init` for your own project.

The values that identify the original author's projects (Supabase project URL, Google client ids, package id, release repository and download link) appear in a few places. Search for them and replace with yours; the list is in [secrets and identities](../.scratch/handoff-completion/secrets-report.md) (names and locations only, no secret values).

## Where things are

- Architecture decisions: `docs/adr/`. Research: `docs/research/`.
- Domain vocabulary: `CONTEXT.md`. Design rules and tokens: `DESIGN.md`.
- Work history, tickets and specs: `.scratch/` (start at `.scratch/INDEX.md`).
- `AGENTS.md` and `CLAUDE.md` are optional notes for AI coding agents.
