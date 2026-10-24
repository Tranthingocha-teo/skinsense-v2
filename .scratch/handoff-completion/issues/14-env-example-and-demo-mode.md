# 14: Environment example and backend-free demo mode

Parent: [spec](../spec.md)

**What to build:** A new developer with no `.env` can clone, install, run typecheck and tests, and see the web demo with no network and no secrets. Each app has a committed example env file listing every variable, what it is, where to get it and whether it is public or secret. Missing variables are caught in one place with a message that names the variable.

**Blocked by:** 02 (audit-ticket-truth)

**Status:** partial (2026-10-17): code and proof done; the two `.env.example` files are written but not yet committed (see Unproven)

- [x] Fresh clone with no env files: install, typecheck, tests and the demo pages all work. Evidence: clean clone of the branch, no env files and none of the variables in the shell: `bun install --frozen-lockfile` (1536 packages), `bun run typecheck` 5/5 tasks, `bun run test` domain 112, web 88, mobile 82 passed; `next build` succeeds; `next start` returned 200 for `/`, `/demo`, `/demo/history`, `/demo/routine`, `/demo/trends`, `/privacy`, `/case-study`.
- [ ] Example env files exist for web and mobile and list every variable the code reads. Drafted at `apps/web/.env.example` and `apps/mobile/.env.example` content (variables below) but the write tool refused `.env*` paths for the agent; `apps/web/.gitignore` now allows `!.env.example`. Needs `cp` by a human or the main session.
- [x] Starting the real (non-demo) app without a variable fails with a clear message naming it. `/app` returned 500 with `Missing environment variable NEXT_PUBLIC_SUPABASE_URL. Copy apps/web/.env.example to apps/web/.env.local ...`. Same helper guards the Supabase client (browser and server), the cron ping, Google sign-in (web) and Supabase plus Google sign-in (mobile). Tests: `apps/web/src/lib/env.test.ts`, `apps/mobile/src/lib/env.test.ts`.
- [x] CI runs with no secrets. `.github/workflows/ci.yml` is unchanged and runs only install, typecheck and test; the proof above ran exactly those steps with no secrets.

## Variables the code reads

- Web (public): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- Web e2e only: `SUPABASE_SERVICE_ROLE_KEY` (secret), `E2E_BASE_URL` (optional)
- Mobile (public): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- Supabase edge function `delete-account`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, both injected by Supabase itself (nothing to set)

## Changes

- `apps/web/src/lib/env.ts` and `apps/mobile/src/lib/env.ts`: `requireEnv(name, value)`, `supabaseEnv()`, `googleWebClientId()`. Callers keep literal `process.env.X` so Next and Expo still inline them.
- `apps/web/src/proxy.ts`: only `/` and `/app*` touch Supabase; everything else (including `/demo`) passes through. `/` without `NEXT_PUBLIC_SUPABASE_URL` is served as a plain landing page; `/app` fails loudly. Before this, every request including `/demo` threw without Supabase variables.
- `apps/web/src/components/landing.test.tsx` stubs the Google client ID (it was previously `undefined!`, silently accepted).

## Unproven

- Mobile app start-up error was proven by jest only, not on a device or emulator (none run, by instruction).
- Mobile has no backend-free demo mode here; only web demo was in scope.
- Committing the two `.env.example` files.

## Update 2026-10-17 (main session)

Merged to main (2c3f2f2). The two committed `.env.example` files are still missing: the write was blocked by a permission rule on `.env*` paths and the owner chose to copy the drafted files by hand. Until that happens the full variable list with where-to-get-it lives in `docs/HANDOFF.md` step 5, so the handoff does not depend on the files. Left: owner copies the drafts to `apps/web/.env.example` and `apps/mobile/.env.example`, then commit.
