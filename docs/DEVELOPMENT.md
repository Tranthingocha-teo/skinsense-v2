# Development guide

Plain tools only: git, [bun](https://bun.sh), Node-compatible tooling that bun pulls in, and Android Studio for the mobile app. Nothing here needs an AI agent, a shell alias or a custom editor setup.

## Layout

bun workspaces + Turborepo.

- `apps/web`: Next.js (App Router, `src/`), shadcn, React Three Fiber hero. Deployed to Vercel. Targets desktop browsers; iPhone is not supported (dropped 2026-09-14).
- `apps/mobile`: Expo (Expo Router, New Architecture), Android only. React Native Reusables + NativeWind. Camera and ML run in native modules, so it needs a development build (`expo run:android`), never Expo Go.
- `packages/domain`: pure TypeScript: zones, redness index, trend math, schemas. No React, no I/O. Tested with Vitest.
- `supabase/`: Edge Functions (`delete-account`).
- Platform-specific code splits by file suffix: `*.web.tsx` (getUserMedia + `@mediapipe/tasks-vision`) vs `*.native.tsx` (vision-camera + ML Kit + fast-tflite).

## Commands

```
bun install
bun run typecheck        # turbo: web (next typegen + tsc), mobile (tsc), domain (tsc)
bun run test             # vitest (domain, web), jest-expo (mobile)
bun run lint             # manual; not part of CI
bun run dev              # all apps
cd apps/web && bun dev   # http://localhost:3000
cd apps/web && bun run e2e   # Playwright (some specs write to the backend your env points at)
cd apps/mobile && bunx expo run:android   # needs an emulator or a USB phone
```

CI runs install (frozen lockfile), typecheck and test only, without secrets.

## Android

Set `ANDROID_HOME` to your Android SDK (Android Studio installs it; typically `<home>/Android/Sdk` on Linux) and put `$ANDROID_HOME/emulator` and `$ANDROID_HOME/platform-tools` on `PATH`. A system-wide SDK directory owned by root usually cannot be used for the emulator; use a user-owned SDK.

Create an AVD in Android Studio, then to use the laptop webcam as the phone camera:

```
emulator -avd <your_avd_name> -camera-front webcam0 &
```

Long builds (Gradle, `expo run:android`, EAS): if you want a desktop notification when one finishes, append `; notify-send "Build done" "exit $?"` (Linux) to the command.

`eas` (EAS CLI) and Maestro are optional global installs: `bun add -g eas-cli`; Maestro per its own install docs.

## UI flows (Maestro)

```
maestro test apps/mobile/flows/<flow>.yaml
```

Flows live in `apps/mobile/flows/`. Some (for example `feedback.yaml`) write to the backend your build points at: read the header comment first.

## Backend facts

- Supabase: Postgres, Auth, Storage (one private bucket, per-user folders). Fully online; there is no offline mode.
- Auth is Google only, via `signInWithIdToken` (native Google sign-in on Android, Google Identity on web). No email/password.
- The domain package owns the database schema: `packages/domain/src/schema.ts` is the source and the SQL migrations in `packages/domain/drizzle/` are generated from it (`cd packages/domain && bun run db:generate`), except the hand-written storage policy in `0002` (`docs/adr/0002-domain-owns-db-schema.md`).
- Details: `docs/research/supabase-expo-nextjs.md` and `docs/research/auth-google-idtoken.md`.

## Testing approach

- Domain logic lives in `packages/domain` first and is tested with Vitest (`docs/adr/0003-redness-index-acceptance-bar.md`).
- Web: Vitest + Playwright. Mobile: jest-expo, Testing Library, `expo-router/testing-library`, Maestro.

## Navigating the code

For "who calls this", use text search (`grep`/`rg`). The TypeScript language server only knows the tsconfig projects it has opened (there are three, no root project), so find-references can miss callers in other apps. Architecture decisions: `docs/adr/`.

## Optional: reference skills used during development

The original development used AI-agent "skills" (reference documents, not code). They are not part of the build, tests or CI (checked: `package.json`, `turbo.json`, `bunfig.toml` and `.github/workflows/ci.yml` reference no `.claude/`, `.agents/`, hook or MCP file; the root `.mcp.json`, which only configures the shadcn MCP server for agents, is likewise optional), and the repo does not ship them: `.claude/` and `.agents/` are gitignored local folders. If you use an AI coding agent and want the same references, `skills-lock.json` records each skill's source repository and path:

| Source | Skills |
|---|---|
| `addyosmani/web-quality-skills` | accessibility, best-practices, core-web-vitals, performance, seo, web-quality-audit |
| `expo/skills` | eas-update, expo-dev-client, expo-project-structure, expo-router |
| `greensock/gsap-skills` | gsap-core, gsap-performance, gsap-plugins, gsap-react, gsap-scrolltrigger, gsap-timeline, gsap-utils |
| `emalorenzo/three-agent-skills` | r3f-best-practices, three-best-practices |
| `callstackincubator/agent-skills` | react-native-best-practices |
| `callstack/react-native-testing-library` | react-native-testing |

Also used locally and not in the lock file: shadcn, Vercel, Emil Kowalski design skills, two design-taste skills, `swm-react-native-best-practices` (Software Mansion) and an internal `mediapipe-tflite`. Install any of them with your agent's skill installer (for example `npx skills add <owner/repo>`), or ignore them: the docs under `docs/research/` already contain the findings that matter.
