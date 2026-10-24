# skinsense-v2

Skin diary app: capture a face photo with a guide, tap-mark spots, tick tonight's routine, and watch per-zone trends. Web (Next.js) and Android (Expo). Backend is Supabase.

You need only git, [bun](https://bun.sh), and for the Android app Android Studio. No AI tooling, shell aliases or editor plugins are required.

- **Team Roadmap & GitHub Projects**: [ROADMAP.md](ROADMAP.md) | [Interactive GitHub Board](https://github.com/users/Tranthingocha-teo/projects/2)
- Start here if you are taking this project over: [docs/HANDOFF.md](docs/HANDOFF.md)
- Day-to-day commands, repository layout, emulator, Maestro and backend facts: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- Architecture decisions: `docs/adr/`. Research and rationale: `docs/research/` (start with `2026-09-11-landscape-and-decisions.md`).
- Work history and tickets: `.scratch/` (plain markdown, see `docs/agents/issue-tracker.md` for the conventions).

## Quick start

```
bun install
bun run typecheck   # all workspaces
bun run test        # vitest (domain, web) and jest-expo (mobile)
bun run doctor      # verify environment & backend configuration
cd apps/web && bun dev   # http://localhost:3000
```

### Setup Guides from Zero
Running the apps against a live backend needs your own Supabase project and credentials:
- **Supabase Backend & Migrations**: [docs/setup-guides/supabase.md](docs/setup-guides/supabase.md)
- **Google OAuth Setup**: [docs/setup-guides/google-oauth.md](docs/setup-guides/google-oauth.md)
- **Deployment & Production Runbook**: [docs/setup-guides/deployment.md](docs/setup-guides/deployment.md)

CI (`.github/workflows/ci.yml`) runs `bun install --frozen-lockfile`, `bun run typecheck` and `bun run test` with no secrets.

## AI agents (optional)

`AGENTS.md` and `CLAUDE.md` are workflow notes for AI coding agents. Nothing in them is needed to build, test or run the project.
