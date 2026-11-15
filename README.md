# skinsense-v2

Skin diary app: capture a face photo with a guide, tap-mark spots, tick tonight's routine, and watch per-zone trends. Web (Next.js) and Android (Expo). Backend is Supabase.

You need only git, [bun](https://bun.sh), and for the Android app Android Studio. No AI tooling, shell aliases or editor plugins are required.

- **Team Roadmap & GitHub Projects**: [ROADMAP.md](ROADMAP.md) | [Interactive GitHub Board](https://github.com/users/Tranthingocha-teo/projects/2)
- **Scrum Sprints & Risk Governance**: [Sprint 1 Plan & Retro](docs/sprints/SPRINT_1.md) | [Sprint 2 Plan & Retro](docs/sprints/SPRINT_2.md) | [Dynamic Risk Register](docs/governance/RISK_REGISTER.md) | [Change Requests](docs/governance/CHANGE_REQUESTS.md) | [Traceability Matrix](docs/governance/TRACEABILITY_MATRIX.md)

## Timeline & Authorship Summary (Git & PR History)

> Why Pull Requests start at `#32`: GitHub shares one numbering sequence across Issues and Pull Requests (`#1–#31` are Issues), and the **first 49 commits on `main`** (`2026-10-24` to `2026-11-03`) were committed directly to `main` by `@Tranthingocha-teo` before the team adopted the Pull Request workflow at `PR #32` (`2026-11-09`).

| Phase | Dates | Scope & Key Links | Primary Contributors |
| :--- | :--- | :--- | :--- |
| **1. Sprint 1 Foundation & `v1.0.0`** | `2026-10-24` | First **37 direct commits** ([`29b6de5`](https://github.com/Tranthingocha-teo/skinsense-v2/commit/29b6de5)..[`465f753`](https://github.com/Tranthingocha-teo/skinsense-v2/commit/465f753)), Issues [#1](https://github.com/Tranthingocha-teo/skinsense-v2/issues/1)–[#23](https://github.com/Tranthingocha-teo/skinsense-v2/issues/23) (`102 SP`), [`v1.0.0` Release](https://github.com/Tranthingocha-teo/skinsense-v2/releases/tag/v1.0.0) | `@Tranthingocha-teo` (100%) |
| **2. Early Sprint 2 Baseline (Pre-PR)** | `2026-10-25` – `2026-11-03` | Next **12 direct commits** ([`ae10973`](https://github.com/Tranthingocha-teo/skinsense-v2/commit/ae10973)..[`ac70fab`](https://github.com/Tranthingocha-teo/skinsense-v2/commit/ac70fab)) tracked in Issue [#75](https://github.com/Tranthingocha-teo/skinsense-v2/issues/75) (`8 SP`: real auth, 4-role workstations, 3-tier marketplace, routine UX) | `@Tranthingocha-teo` (100%) |
| **3. Sprint 2 Collaborative PR Phase** | `2026-11-09` – `2026-11-15` | [Pull Requests `#32+`](https://github.com/Tranthingocha-teo/skinsense-v2/pulls?q=is%3Apr) (Admin, Specialist, Shopee Mall, Media, Privacy, CI/CD & Risk Governance; Milestones `5`–`6`) | `@Tranthingocha-teo` (`36+` merged PRs from `#37+`), `@thuyydung` (`4` merged PRs: `#32, #34, #36, #48`), `@dinhthianhsang` (`1` merged `#61`, `1` open `#49`) |
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

CI (`.github/workflows/ci.yml`) runs `bun install --frozen-lockfile`, `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` on every push and PR to `main` with no secrets. Mobile preflight and optional EAS preview builds run via `.github/workflows/mobile-preview.yml`.

## AI agents (optional)

`AGENTS.md` and `CLAUDE.md` are workflow notes for AI coding agents. Nothing in them is needed to build, test or run the project.
