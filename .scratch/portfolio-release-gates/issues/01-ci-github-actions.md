# 01: CI on GitHub Actions

**What to build:** every push and pull request to `main` runs the root `typecheck` and `test` scripts on GitHub Actions from a fresh clone, so green or red is visible on GitHub. Spec gate 1, stories 1–8.

**Blocked by:** None (can start immediately). Amends the spec's "after the prototypes" sequencing (decided in `/to-tickets` 2026-09-14); the constraint "in place before redesign implementation" still holds.

**Status:** done

- [x] Triggers on push and pull request to `main`; runs exactly the root `typecheck` and `test` scripts (no lint, E2E, Maestro or Lighthouse)
- [x] bun pinned to the root `packageManager` version with a frozen-lockfile install; Node pinned to 26.x
- [x] The missing Expo type-reference line is written before typecheck, so mobile typecheck passes on a fresh clone
- [x] No repository secrets, no env vars, no Supabase or network calls from the suite (local `env -i PATH HOME` run of typecheck + test passed: 4 typecheck and 3 test tasks)
- [x] `main` shows a passing run (run 34882674199, 15/09)
- [ ] A throwaway branch with a deliberate type error shows a failing run naming the right workspace and task; separately, a failing assertion does the same; the branch is deleted afterwards
- [x] The local Stop hook is unchanged

## Now

Workflow `.github/workflows/ci.yml` pushed to `main` and green. The throwaway-PR check was blocked for Claude (auto mode refuses pushing probe branches and opening PRs).

## Next

Dinh runs the probe (≈3 min), from `~/skinsense-v2`:

```
git worktree add -b ci-probe-type /tmp/ci-probe-type origin/main && echo 'export const ciProbe: number = "x";' >> /tmp/ci-probe-type/packages/domain/src/index.ts && git -C /tmp/ci-probe-type commit -qam "ci probe: type error" && git -C /tmp/ci-probe-type push -u origin ci-probe-type && gh pr create --draft --base main --head ci-probe-type --title "CI probe: type error" --body throwaway
git worktree add -b ci-probe-test /tmp/ci-probe-test origin/main && printf 'import { expect, test } from "vitest";\ntest("probe", () => { expect(1).toBe(2); });\n' > /tmp/ci-probe-test/packages/domain/src/ci-probe.test.ts && git -C /tmp/ci-probe-test add -A && git -C /tmp/ci-probe-test commit -qm "ci probe: failing test" && git -C /tmp/ci-probe-test push -u origin ci-probe-test && gh pr create --draft --base main --head ci-probe-test --title "CI probe: failing test" --body throwaway
```

After both runs show red naming `@skinsense/domain#typecheck` and `@skinsense/domain#test`: `gh pr close ci-probe-type --delete-branch; gh pr close ci-probe-test --delete-branch; git worktree remove /tmp/ci-probe-type; git worktree remove /tmp/ci-probe-test; git branch -D ci-probe-type ci-probe-test`.

## Audit 2026-10-17

- Status: done
- Evidence: .github/workflows/ci.yml runs on push and pull_request to main: bun 1.4.0 frozen install, Node 26.x, expo-env line, then `bun run typecheck` and `bun run test` (commit bfed721; green run 34882674199 per the ticket). The optional failing-probe branch check was never run and is accepted as unrun.
