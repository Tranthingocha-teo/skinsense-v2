# 14: Supabase keep-alive cron

**What to build:** a scheduled Vercel Cron job that hits a trivial Supabase query on `apps/web`, so the project never crosses the 7-day inactivity pause. Needed because the deployment now has a committed lifetime well past the original "$0 through 2026-11 at ≤50 users" cost-validity window — Dinh wants the live URL usable from his CV through roughly 2027-09, reviewed then.

**Blocked by:** 03

**Status:** ready-for-human

- [x] `apps/web` route (e.g. `/api/cron/ping`) runs one trivial Supabase query (a cheap `select`, no side effects)
- [x] `vercel.json` schedules it well inside the 7-day window (daily or every few days, not weekly, to tolerate a missed run)
- [ ] Verified against the deployed prod project, not just local/preview (Vercel Cron only fires on the production deployment)
- [x] No auth/user-facing surface — this is an internal keep-alive endpoint, not a feature

## Now

Deployed 2026-09-14 (Claude, after the submission-plan grill): Vercel project `skinsense-v2` (team `chanem794s-projects`, Root Directory `apps/web`, 3 `NEXT_PUBLIC_*` env vars, `vercel.json` `installCommand` installs bun 1.4.0 at the monorepo root because Vercel ships bun 1.3.14 and ignores `packageManager`; `.vercelignore` keeps every workspace manifest but drops `android/`, photos, `.scratch`, `docs`). Production `https://skinsense-v2.vercel.app`: `/`, `/privacy`, `/api/cron/ping` all 200. Deploys go through the CLI from a git-free copy of the working tree: Vercel blocks CLI deploys whose git author (`dinh144`, GitHub noreply email) is not a member of the Vercel account — connect GitHub in Vercel → Settings → Authentication to lift that and deploy from the repo directly.


Built 2026-09-13 (Claude, `/implement`). `apps/web/src/app/api/cron/ping/route.ts`: `GET` runs `photos.select("id", { head: true, count: "exact" })` with the anon key (a real query through PostgREST, RLS returns nothing, no side effects) and answers `{ ok }` 200/500. `apps/web/vercel.json` schedules it daily at 03:00 UTC (Hobby runs crons once a day at an approximate hour; daily gives six retries inside the 7-day window). No `CRON_SECRET` check: the route reveals nothing and does nothing, so an unauthenticated hit costs one cheap query. Verified locally: `curl localhost:3000/api/cron/ping` → `{"ok":true}` 200.

Not verified on production: `apps/web` is not on Vercel yet (no `.vercel/` link, no `vercel` CLI on this machine), and Vercel Cron only fires on the production deployment.

## Next

- Dinh: deploy `apps/web` to Vercel (root directory `apps/web`, env vars from `apps/web/.env.local` minus the service-role key), then check Vercel → Project → Settings → Cron Jobs lists `/api/cron/ping`, and after the first run the Supabase dashboard's API logs show the request. Tick the third box then.

## Comments

- 2026-09-14 (Claude): deployment done (see Now), so the Next above is stale except its last step — after the first 03:00 UTC run (10:00 +07, 14/09), check Vercel → Settings → Cron Jobs lists `/api/cron/ping` and it ran, then tick the third box.

## Audit 2026-10-17

- Status: ready-for-human
- Evidence: Code exists: apps/web/vercel.json cron and apps/web/src/app/api/cron/ping/route.ts (commit 84c19e8).
- Left: Check on the deployed project that the cron ran. That is the recipient's Vercel project; covered by the keep-alive step in handoff-completion 19 and the launch checklist 22.
