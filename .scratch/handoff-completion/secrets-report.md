# Secrets scan report (ticket 17)

Date: 2026-10-17. Method: custom regex scan (no gitleaks/trufflehog installed) over the working tree (excluding node_modules, .turbo, .next, graphify-out, apps/mobile/android) and over every added line of `git log --all -p` (108 commits). Patterns: JWT (eyJ), sb_secret_, sb_publishable_, AIza, Google client id/secret (GOCSPX), private keys, ghp_/github_pat_, Vercel/EAS/Expo tokens, AWS keys, passwords in URLs, generic key/secret/token assignments. Also `git log --diff-filter=A` for env, keystore (.jks/.keystore/.pem/.p12) and .vercel files. No values are recorded here.

## Findings

| Finding | Kind | Where | Action |
|---|---|---|---|
| Supabase secret key (sb_secret_) | secret | apps/web/.env.local (untracked, ignored); never in history | rotate (it lived on disk; rotate if the folder or zip left this machine) |
| Google OAuth client secret (GOCSPX) | secret | apps/web/.env.local (untracked, ignored); never in history | rotate under same condition |
| JWT-style keys in env assignments | secret/other | .env.local, apps/web/.env.local, .vercel/.env.production.local (all untracked). Decoded claims show Vercel OIDC tokens (issuer oidc.vercel.com), not Supabase service_role | ignore (short-lived); delete files from any shipped zip |
| Supabase publishable key (sb_publishable_) | public | apps/mobile/.env, apps/web/.env.local, .vercel/.env.production.local, built chunks in .vercel/output, apps/mobile/.expo logs (all untracked) | ignore; move to config (.env.example placeholder) |
| Google OAuth client ids (x apps.googleusercontent.com) | identity | apps/mobile/.env, apps/web/.env.local, .vercel/*, .playwright-mcp/console-*.log, apps/mobile/.expo logs (untracked) | ignore; hand to ticket 16 as owner-identity |
| Vercel team slug in OIDC issuer (chanem794s-projects) and Vercel project/owner ids | identity | .env.local, apps/web/.env.local, .vercel/.env.production.local | hand to ticket 16 |
| Supabase project URL/ref | identity | env files above | hand to ticket 16 |
| Tracked file in a gitignored dir | note | .playwright-mcp/page-2026-09-13T20-12-58-448Z.yml is tracked though .playwright-mcp/ is ignored; no secret pattern matched | review manually, consider `git rm --cached` |
| History: any pattern in any commit | none | 0 matches across 108 commits; no env, keystore, .pem, .p12 or .vercel file was ever added (only .env.example-type names: nativewind-env.d.ts, jest.setup-after-env.js, .vercelignore) | none |

Counts: secret 2 (+3 files holding short-lived tokens), public 1 type (publishable key), identity 3 types, history hits 0.

## Ignore rules

- .env.local, apps/web/.env.local, apps/mobile/.env: ignored (.gitignore `.env*`, with `!.env.example` allowed).
- .vercel and apps/web/.vercel: ignored.
- Keystores: only apps/mobile/android is ignored (via `/android` in apps/mobile/.gitignore). The root .gitignore has no `*.jks` / `*.keystore` / `*.p12` / `*.pem` rule, so a keystore placed elsewhere would not be ignored. Recommend adding those patterns (not done, read-only task).
- .expo/ and .playwright-mcp/ are ignored.

## Owner rotation list (cannot be delegated)

1. Supabase secret key (sb_secret_): rotate in the Supabase dashboard, then update Vercel env and local .env.local.
2. Google OAuth client secret: reset in Google Cloud Console (APIs and Services > Credentials), then update Vercel env.
3. Only if the working folder was ever shared, zipped or synced beyond this machine: treat the Vercel OIDC tokens as expired (they are short-lived), no action needed.
Nothing else needs rotating: no secret was ever committed.

## Zip recommendation

History is clean, so shipping WITH .git is safe regarding secrets. Still, build the zip from `git archive` or `git clean`-style export, not a raw folder copy: a raw copy would include .env.local, apps/web/.env.local, apps/mobile/.env, .vercel/ (including .vercel/.env.production.local), .playwright-mcp/ logs and .expo/ logs, which hold the two real secrets plus owner identities. Ship with history only after ticket 16 decides whether the history's author identities are acceptable; otherwise ship without .git.
