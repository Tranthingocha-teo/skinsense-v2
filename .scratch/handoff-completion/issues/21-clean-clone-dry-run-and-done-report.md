# 21: Clean-clone dry run and the done report

Parent: [spec](../spec.md)

**What to build:** In a new empty directory with no env files, follow only the README: install, typecheck, tests and the demo must pass, and the doctor command must report exactly what is missing for the real backend. Then write the done report: for each gate, the evidence or the statement that it is handed over unrun, with a link.

**Blocked by:** 11 (lighthouse-audit-script), 12 (signed-release-pipeline), 13 (qa-checklist-refresh), 17 (secrets-scan), 18 (decouple-claude-workflow), 19 (setup-guides-and-readme), 20 (known-limits-and-dependencies)

**Status:** done for the reduced scope below (2026-10-17)

- [ ] Dry run from a clean clone succeeds using only the README; deviations are fixed in the docs
- [ ] CI is green on main
- [ ] Done report lists every gate with evidence or an explicit "handed over, not run"
- [ ] Nothing in the tracker is open except ticket 22 and the written deferred list

## Scope change

The owner asked only for a zip a recipient can run from zero, not for finishing the remaining redesign tickets. Tickets 03 to 13 and 15 to 16 and 19 to 20 were not executed; the five redesign tickets still open are listed in `docs/HANDOFF.md`. Their absence is stated there, not hidden.

## Done report

| Gate | Result |
|---|---|
| Clean unzip, no env: `bun install --frozen-lockfile` | passed |
| `bun run typecheck` | passed 5 of 5 (after fixing `expo-env.d.ts` generation) |
| `bun run test` | passed: domain 16 files, web 18 files, mobile 86 tests (after raising the web test timeout to 30 s) |
| `next build` and `next start`, no env | built; `/`, `/demo`, `/demo/history`, `/demo/routine`, `/demo/trends`, `/privacy`, `/case-study` returned 200; `/app` returned 500 naming the missing variable |
| Secrets scan | no secret in tree or history; zip made with `git archive`, contains no env, keystore or `.git` (`secrets-report.md`) |
| README and HANDOFF read by a stranger | HANDOFF written with from-zero backend steps and the variable table; not tested by anyone but its author |
| Committed `.env.example` files | pending, owner copy (see ticket 14) |
| Database schema from zero | migrations 0000 to 0004 applied in order to an empty Postgres (PGlite, Supabase stand-ins) and a two-user row-level-security test passes (`packages/domain/src/migrations.test.ts`, in `bun run test`) |
| Real Supabase project, Google OAuth, Edge Function deploy, Vercel, EAS | steps written, **not executed**: they need the recipient's own accounts |
| Android on emulator or phone, signed release, QA checklist, Lighthouse | **not run** |
| Owner-specific values (`com.dinh144.skinsense`, Expo owner and project id, Supabase URL in docs) | listed in HANDOFF and the secrets report, not yet moved to configuration (ticket 16) |
