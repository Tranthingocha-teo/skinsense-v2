# 08: Full Lighthouse done-audit on production

**What to build:** the whole page list is audited once on production, the result is saved as a summary table in this feature folder, and the gate is enforced: every page at least 90 in all four categories. Spec gate 3, stories 23, 25, 26.

**Blocked by:** 07; external: redesign shipped on web production.

**Status:** ready-for-human

- [ ] Dinh runs the full audit command with `!` (production writes with the service role)
- [ ] Claude writes the summary table (page × four categories, medians) into this feature folder, ready to lift into the case study
- [ ] Each page under 90 in any category becomes a fix ticket under the grill rule: R3F/GSAP/Lenis load after LCP, an effect still keeping the page under 90 is cut
- [ ] After fix tickets close, the failing pages are re-audited and the table updated; the gate passes when every cell is ≥ 90

## Audit 2026-10-17

- Status: ready-for-human
- Evidence: No full audit recorded.
- Left: Run on production needs live credentials. Script and runbook come from handoff-completion 11; the run itself is in 22.
