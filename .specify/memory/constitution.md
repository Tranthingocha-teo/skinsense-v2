# skinsense-v2 Constitution

## Core Principles

### I. Domain First, Test First
Logic that decides behaviour lives in `packages/domain` and is written test-first (Vitest). Apps (`apps/web`, `apps/mobile`) only wire it to a client. A change that touches domain logic ships with a failing-then-passing test.

### II. Web and Mobile Keep One Contract
`apps/web` and `apps/mobile` expose the same data contract (same tables, same API routes, same field meanings); only the client differs. A storage or schema change is not done until both apps read and write it, or the gap is written down in the spec as a known limitation.

### III. Real Data, No Fabricated Content
Screens show data from the API or database. No sample orders, balances, ratings or stock images shown as real. Empty or failed states show an honest empty/error state with retry.

### IV. Privacy of Skin Photos
Face photos are sensitive. Any storage that makes them reachable by URL must be called out in the spec, and deleting a Photo must delete the stored image, not only the row. Server routes check that the caller owns the Photo.

### V. Verify Before Done
A step is done only when `tsc --noEmit` is clean and the app's test suite passes (`bun run test` in `apps/mobile`, `bunx vitest run` in `apps/web`). Do not claim an app change works on a device unless it ran on one.

### VI. Spec Before Build (Spec Kit)
Features with more than one file or a design decision start as `specs/NNN-name/spec.md` (what and why, acceptance scenarios, non-goals), then `plan.md`, then `tasks.md`, then code. Small fixes (≤3 files, no design decision) may skip the spec. The existing `.scratch/` tickets and `docs/adr/` remain the handoff record; a spec links to them instead of duplicating them.

### VII. Mobile Specs Name Non-Goals and Old Data
Every mobile spec (`specs/NNN-*/spec.md`) states: user outcome, scope, **non-goals**, rules/defaults including **what happens to data saved by an older app version**, at least one normal and one edge acceptance example, and an accessibility/error-message requirement (from the NashTech SDD guide). AI-generated mobile code is accepted only after it is read, its APIs are checked against the installed Expo/React Native version's docs, it is run, and edge cases (empty, missing data, network failure) are tested.

## Constraints

- Stack: Next.js (web), Expo / React Native (mobile), Supabase (auth + Postgres), Cloudinary (images), Bun workspaces.
- Secrets (`CLOUDINARY_*`, Supabase service key) are server-only; mobile reaches Cloudinary through `/api/upload/cloudinary`.

## Workflow

Constitution → `/speckit-specify` → `/speckit-clarify` (if unclear) → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement` → `/speckit-converge`. Run `/code-review` on the diff before proposing a commit.

**Version**: 1.1.0 | **Ratified**: 2026-11-21 | **Last Amended**: 2026-11-21 (added VII)
