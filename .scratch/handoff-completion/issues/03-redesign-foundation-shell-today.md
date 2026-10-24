# 03: Redesign foundation, app shell, Hôm nay and Routine on web and Android

Parent: [spec](../spec.md)

**What to build:** Finish and confirm redesign tickets 01 to 04 as a whole: both apps take their colours, radii and fonts from the token package, the shared components are restyled once, the app shell and tabs match the design, and Hôm nay and Routine show every drawn state (empty, loading, error, done). Detail lives in the redesign-build tickets 01, 02, 03 and 04.

**Blocked by:** 02 (audit-ticket-truth)

**Status:** ready-for-agent

- [ ] Web and Android read the same tokens; no leftover old palette or 12px radius
- [ ] App shell, Hôm nay and Routine match the canvas on web and Android in light and dark
- [ ] Empty, loading and error states exist and are tested
- [ ] Tests follow the existing kind per layer (Vitest web and domain, jest-expo mobile, Maestro flow for the Android path)
- [ ] Redesign tickets 01 to 04 are marked done with evidence

## Audit 2026-10-17

- Scope narrowed by audit: redesign-build 01, 02, 03 and 04 are already done on main with tests (see .scratch/INDEX.md). What is left here is the whole-product confirmation: screenshots against the canvas, every drawn empty/loading/error state, light and dark.
