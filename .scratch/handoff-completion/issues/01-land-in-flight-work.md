# 01: Land the in-flight work and clean the repo

Parent: [spec](../spec.md)

**What to build:** The uncommitted onboarding, evening-reminder, settings, locale and config changes are finished against their redesign tickets (13 and 18) or deliberately reverted, then committed in bounded steps. Main is merged with `origin/main`, and the stale local branch and the leftover agent worktree are removed. The root typecheck and test commands run on the clean tree and their result is recorded as the baseline.

**Blocked by:** None (can start immediately).

**Status:** done (2026-10-17)

- [x] Working tree has no uncommitted changes; anything abandoned is recorded in the ticket it belonged to
- [x] Main contains everything on `origin/main`; no stale branch or worktree remains
- [x] `bun run typecheck` and `bun run test` pass on the clean tree, with the output summary saved in this ticket
- [x] Any failing test is fixed or listed with its cause

## Evidence

- In-flight reminder work committed as c8f5775; spec and tickets as 5d47ab9; `origin/main` merged (5 commits, redesign tickets 06 and 15).
- Fixed a failing mobile test on the way: `licenses.json` lacked `expo-notifications` (one entry added).
- Stale agent branch deleted; worktree pruned. `proto/redesign` (throwaway prototype branch, unmerged) is kept on purpose; decide in ticket 02.
- Left uncommitted on purpose, owned by ticket 18: graphify's `.gitattributes`, `graphify-out/`, and its section appended to `CLAUDE.md`.
- Baseline after merge: root `bun run typecheck` 5/5 green; `bun run test` 4/4 green (mobile 17 suites/72 tests, web 17 files/83 tests).
- Flaky: on one root run `web#test` reported 2 failed tests under turbo parallel load; web alone and a second root run were green. Cause unknown, log was not kept. Watch in CI; investigate if it recurs.

## Audit 2026-10-17

- Check: the working tree was clean at audit time, but two local branches remain: `proto/redesign` (1 commit ahead of its merge-base, not merged) and `worktree-agent-a971e624eacbca471` (an agent worktree branch). The box "no stale branch or worktree remains" is therefore not fully true; see the branch note in ticket 02.
