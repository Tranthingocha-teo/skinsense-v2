## 1. Linked Issue & Sprint Metadata
- **Linked Issue**: `Closes #<issue-number>` (or `Refs #<issue-number>`)
- **Sprint / Milestone**: Sprint 2 (`Milestone 6`) / Backlog
- **Primary Owner & Co-contributors**: `@<github-handle>`
- **Scope / Track**: `Web` / `Mobile` / `Backend & Supabase` / `DevOps & CI` / `Docs`

## 2. Summary of Changes
- Describe the problem solved, user/engineering value, and key files touched.
- If this PR expands scope beyond Sprint 1 baseline, reference the approved Change Request (`CR-XX` in `docs/governance/CHANGE_REQUESTS.md`).

## 3. Acceptance Criteria Verification
- [ ] All Acceptance Criteria listed in the linked Issue are met and verified.
- [ ] Changes respect multi-tenant role boundaries (`customer`, `shop`, `specialist`, `admin`).
- [ ] No secrets, `.env*` files, or API keys are included in this diff.

## 4. Self-Test Evidence (Mandatory Before Requesting Review)
- [ ] `bun run lint` passes with `0` errors
- [ ] `bun run typecheck` passes across all 5 Turborepo workspaces
- [ ] `bun run test` passes (`@skinsense/domain`, `apps/web`, `apps/mobile`)
- [ ] `bun run build` completes cleanly
- [ ] Manual / UI / API verification notes:
  - Test scenario & observed result: `<paste command output or verification notes>`

## 5. Peer Review Checklist (Minimum 1 Reviewer Approval Required)
- [ ] Code reviewed by at least **1 team member other than the PR author** (`@Tranthingocha-teo`, `@dinhthianhsang`, or `@thuyydung`).
- [ ] Linked Issue moved from `In Progress` -> `In Review` -> `Done` on [GitHub Project #2](https://github.com/users/Tranthingocha-teo/projects/2).
