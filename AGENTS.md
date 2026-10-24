# skinsense-v2 — agent guide

> **Optional: only for AI coding agents. Humans: read [README.md](README.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).** Nothing here is needed to build, test or run the project; layout, commands, Android setup and backend facts live in those files.

Skin diary app, graduation project, submitted 2026-09-20. Decisions and research: `docs/research/` (start with `2026-09-11-landscape-and-decisions.md`).

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

Handoff between agents (Claude Code and agy share this repo): keep the open
ticket's `## Now` / `## Next` sections current at the end of every bounded step,
not only at session end, so a second agent can resume from the ticket alone
when the first one stops mid-task. While another agent's session is open here,
agy only reads and reviews; it edits files only after that session has stopped.
agy never commits; it marks its work with a `## Now` line starting `agy:`.
When Claude sees that marker it runs `/code-review` on the uncommitted diff first.

### Triage labels

Canonical five-role triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout at the repo root. See `docs/agents/domain.md`.

### Project skills

`.claude/skills/` (gitignored, local copies): shadcn, Vercel ×5, Emil Kowalski ×10, taste ×2 (`design-taste-frontend`, `high-end-visual-design`), plus `expo-router`, `eas-update`, `expo-dev-client`, `expo-project-structure` (expo/skills), `react-native-best-practices` (Callstack, performance), `swm-react-native-best-practices` (Software Mansion, Reanimated/Skia/SVG/gestures; renamed, description rescoped), `gsap-*` ×7 (greensock, no `gsap-frameworks`), web-quality ×6 (addyosmani: `accessibility`, `best-practices`, `core-web-vitals`, `performance`, `seo`, `web-quality-audit`; its Next.js examples are Pages Router), `r3f-best-practices` + `three-best-practices` (emalorenzo), and the internal `mediapipe-tflite`. agy has the Expo/Callstack/R3F set in `.agents/skills/`.

## Workflow

- Open Claude Code from this directory, never from `~`, so this file, `.claude/` hooks, plugins and skills load. Type `ss` (zsh alias, added 2026-09-12): it cds here and starts Claude on `claude-fable-5-1` @200k, the model this repo's `/implement` work runs on. Doc-heavy commands (`/wayfinder`, `/to-spec`, `/to-tickets`, `/design`, `/grill-me`) take Opus 5 `[1m]` instead — type `/model` to switch. `/code-review` stays on whatever model the session already has.
- Claude states the path in the first line of every task: "Đường nhỏ" (≤3 files, no design decision: ponytail directly, `/code-review` before proposing a commit) or "Đường lớn, gõ /wayfinder|/to-spec".
- Big path: the map is `.scratch/<effort>/map.md` from `/wayfinder`; one `/wayfinder` session per decision ticket. A feature whose way is clear on the map: `/to-spec` → `/to-tickets` (use `/grill-with-docs` only for features outside the map), `/clear`, then ONE `/implement <feature dir>` per session: work tickets in dependency order, update Now/Next after each, stop only at statusline red (≥140k tokens — an absolute threshold since 2026-09-12, so it fires at the same place in a 200k and a 1M session) or when tickets run out. Never `/compact`; at red finish the bounded step, write handoff to the ticket, tell the owner to `/clear`.
- `/design` runs once for the ~5 main screens between the domain model and `/to-spec`; the spec links the canvas URL only, never inlines it.
- Claude runs `/code-review` itself before proposing a commit; the owner types `/commit`.
- **agy is backup only (2026-09-13 grill).** Claude owns every ticket, `research` included. agy works here only after Claude's quota runs out: it resumes the open ticket, edits code, never commits, and marks `## Now` with `agy:` (see Handoff above).
- Handoff lives in the repo (`.scratch/` open tickets = pending list, `docs/adr/`, `CONTEXT.md`) and in Claude's auto-memory, not in chat. At session start read only this file and auto-memory; open `CONTEXT.md` or an ADR only when the task touches that domain.
- Background builds (EAS, Gradle, `expo run:android`): append `; notify-send "Build xong" "exit $?"` to the command so the owner is told without asking, and state the ETA in the reply that starts it.

## Engineering discipline

The global `~/.claude/CLAUDE.md` "Working style" block applies. A Stop hook in `.claude/settings.json` runs `tsc` in every workspace that has changed `.ts/.tsx` files and blocks stopping on errors; for `packages/domain` it also runs the Vitest suite (ADR 0003's test gate) and blocks stopping on a failing test. Lint stays manual (`bun run lint`). Tests: Vitest + Playwright (web, domain), jest-expo + Testing Library + `expo-router/testing-library` + Maestro (mobile). Write domain logic in `packages/domain` first, test-first.

## Codebase navigation

"Who calls": grep. The TypeScript LSP only sees tsconfig projects it has already opened (three here, no root project), so `findReferences` misses callers in other apps (verified 2026-09-14); use LSP for definitions and types. Architecture context: `docs/adr/` (written by `/wayfinder` and `/domain-modeling`; four ADRs as of 2026-09-11).
