# 19: Daily uptime check workflow

**What to build:** a GitHub Actions workflow on a daily `schedule` in this (private) repo that curls `https://skinsense-v2.vercel.app` and `https://github.com/dinh144/skinsense-releases/releases/latest/download/skinsense.apk` and fails when either is not 200 after redirects. GitHub mails the owner on a failed run. Needed because the deployment must stay usable from Dinh's CV through ~2027-09 and nothing reports if it dies (the Vercel cron in ticket 14 dies with Vercel). Decided in the 2026-09-14 setup grill.

**Blocked by:** production APK release (17–18/09)

**Status:** wontfix

- [ ] `.github/workflows/uptime.yml`: `schedule` daily + `workflow_dispatch`, one job, `curl -fsSL -o /dev/null` per URL
- [ ] One manual `workflow_dispatch` run passes against production
- [ ] Read-only: no secrets, no writes, no deploys

## Now

## Next

## Audit 2026-10-17

- Status: wontfix
- Evidence: No .github/workflows/uptime.yml exists; the workflow would curl the owner's production URL and releases repo, which handoff-completion 16 removes from the code. Not worth adding for a recipient.
