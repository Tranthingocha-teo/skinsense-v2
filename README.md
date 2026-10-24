# skinsense-v2

Skin diary app: capture a face photo with a guide, tap-mark spots, tick tonight's routine, and watch per-zone trends. Web (Next.js) and Android (Expo). Backend is Supabase.

You need only git, [bun](https://bun.sh), and for the Android app Android Studio. No AI tooling, shell aliases or editor plugins are required.

- Start here if you are taking this project over: [docs/HANDOFF.md](docs/HANDOFF.md)
- Day-to-day commands, repository layout, emulator, Maestro and backend facts: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- Architecture decisions: `docs/adr/`. Research and rationale: `docs/research/` (start with `2026-09-11-landscape-and-decisions.md`).
- Work history and tickets: `.scratch/` (plain markdown, see `docs/agents/issue-tracker.md` for the conventions).

## Quick start

```
bun install
bun run typecheck   # all workspaces
bun run test        # vitest (domain, web) and jest-expo (mobile)
cd apps/web && bun dev   # http://localhost:3000
```

Running the apps against a backend needs your own Supabase project and environment variables; step-by-step setup from zero is documented separately in the setup guides.

CI (`.github/workflows/ci.yml`) runs `bun install --frozen-lockfile`, `bun run typecheck` and `bun run test` with no secrets.

## AI agents (optional)

`AGENTS.md` and `CLAUDE.md` are workflow notes for AI coding agents. Nothing in them is needed to build, test or run the project.
