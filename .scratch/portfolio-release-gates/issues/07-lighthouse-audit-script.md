# 07: Lighthouse audit script + seeded audit account

**What to build:** one command audits every public and signed-in web page on the Lighthouse mobile profile against production and prints the summary table; signed-in pages render populated states through a dedicated seeded account. Proven on one signed-in page before the full run counts. Spec gate 3, stories 17–22, 24, 25.

**Blocked by:** external: redesign shipped on web production (redesign spec, not yet written).

**Status:** ready-for-agent

- [ ] Page list: `/`, `/privacy`, the three demo pages, `/app/capture`, `/app/routine`, `/app/spots/<photo>`, `/app/trends`, `/app/settings`, plus every page the redesign added; the cron route excluded
- [ ] A dedicated audit account (separate from the capture and delete-account E2E accounts) is seeded with a Photo backed by a real storage object, its five ZoneReadings, some Spots and a few RoutineEntries
- [ ] Sign-in reuses the existing E2E test-account cookie helper; cookies go to signed-in pages only, public pages run without them; the app gets no new auth path
- [ ] Default mobile profile, all four categories, three runs per page, median kept; raw reports not committed
- [ ] Output is one page × Performance / Accessibility / Best Practices / SEO table
- [ ] Verified: Dinh runs the command with `!` for one signed-in page and the report shows an authenticated render, not a redirect to `/`; no permission rule added

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: No Lighthouse script or package.json task exists in the repo.
- Left: Audit script and seeded account. Covered by handoff-completion 11.
