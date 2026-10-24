# 02: Audit every ticket against the code and rewrite the tracker's truth

Parent: [spec](../spec.md)

**What to build:** Every ticket in every `.scratch` feature folder is checked against the code and the test suite. Each gets a truthful `Status:` with evidence (test name, screen, commit) and a one-line "what is left" when open. Superseded, abandoned or duplicate tickets are closed with a reason. A single index lists every feature, its tickets and status, so a newcomer can navigate the history from one page.

**Blocked by:** 01 (land-in-flight-work)

**Status:** done (2026-10-17)

- [x] Every ticket file has a status that matches the code, with evidence or a what-is-left line
- [x] Closed-as-superseded tickets state what replaced them
- [x] An index file lists all features and tickets with status and links
- [x] Remaining open work maps to tickets 3 to 10 of this effort or to the release-gates folder, with nothing orphaned

## Audit 2026-10-17 (summary)

Done by: reading every ticket in the six feature folders (94 files with this one) and checking each against `apps/*/src`, `packages/domain`, test files beside the code, `apps/mobile/flows`, `apps/web/e2e`, `.github/workflows` and `git log`. Every ticket has a corrected `Status:` line and an `## Audit 2026-10-17` section with evidence and, when open, a `Left:` line. The index is [`.scratch/INDEX.md`](../../INDEX.md) with a "Remaining open work" table.

Result: 50 done, 9 superseded, 3 wontfix, 27 ready-for-agent (17 of them are handoff-completion tickets), 5 ready-for-human. Redesign-build is 18 of 23 done; open are 08 (Android Xem thử), 17 (share before/after), 19 (export), 22 (biometric lock), 23 (brand assets), all covered by handoff-completion 04, 08, 07 and 09. Nothing is orphaned; the v1 03 RLS smoke test was in no handoff ticket and was added to ticket 15.

Surprises: ticket 01 says no stale branch remains, but `proto/redesign` and `worktree-agent-a971e624eacbca471` still exist (ticket 01 carries a note). Handoff tickets 03 to 08 were scoped as if most redesign work was open; most is done, so their audit notes narrow them to confirmation or the few open tickets.

### The unmerged branch `proto/redesign`

It holds one commit (8867238, "pick C3, prototype it on web and Android, add DESIGN.md and tokens") off 6a2d4ca. Main already took the decisions it carried (7b7136e: DESIGN.md and packages/tokens) and rebuilt every prototyped screen properly as redesign-build 01 to 07 with tests. Recommendation: do not merge. Keep a pointer, then delete: `git tag archive/proto-redesign proto/redesign && git branch -D proto/redesign`; delete the agent worktree branch too (`git worktree list`, then `git worktree remove` and `git branch -D worktree-agent-a971e624eacbca471` if it holds nothing unique). Then ticket 01's "no stale branch" box is true. The owner or the next agent runs this; the audit did not touch git.
