# 18: Make the repo usable without Claude

Parent: [spec](../spec.md)

**What to build:** The agent-specific workflow (the `ss` alias, slash-command routine, model choices, local-only project skills, agent hand-off rules) is no longer required reading. Everything a newcomer needs is in plain-tool instructions. The agent guide stays but is marked optional, and local-only skills have either committed provenance or an install note.

**Blocked by:** 02 (audit-ticket-truth)

**Status:** done

- [x] Setup and daily commands work without Claude, aliases or `.claude`
- [x] Agent guide marked optional and no longer contains information needed to run the project
- [x] Local-only skills are either committed with provenance or documented as optional installs

## Evidence

- Human-facing content moved out of `AGENTS.md` into `README.md` and `docs/DEVELOPMENT.md` (layout, commands, Android `ANDROID_HOME` note, emulator, Maestro, build notify, backend/auth facts). No `ss` alias, slash commands or model names there.
- `AGENTS.md` now opens with "Optional: only for AI coding agents. Humans: read README.md"; agent workflow rules and history kept below.
- `CLAUDE.md` is `@AGENTS.md` only; `graphify-out/` added to `.gitignore`; no `.gitattributes` in the repo.
- Skills provenance: `skills-lock.json` (21 skills, 6 sources) tabulated in `docs/DEVELOPMENT.md` with an optional install note; unlocked local skills listed. `package.json`, `turbo.json`, `bunfig.toml`, `ci.yml` have no reference to `.claude`, `.agents`, hooks or MCP (grep).
- Leftovers for ticket 16: "Dinh" in code comments (`apps/web/e2e/*.spec.ts`, `apps/mobile/flows/feedback.yaml`, `case-study/page.tsx`, `packages/domain/src/{capture-quality,schema}.ts`, `mpbench/`), ADRs and `docs/research/`; `agy`/`ss`/`/home/dinh` only remain in the optional `AGENTS.md`.
