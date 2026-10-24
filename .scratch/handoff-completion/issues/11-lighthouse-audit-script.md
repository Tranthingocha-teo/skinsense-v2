# 11: Lighthouse audit script and runbook

Parent: [spec](../spec.md)

**What to build:** An audit command measures every web page, public and signed-in, on the Lighthouse mobile profile (three runs, median kept) and prints one table of page by Performance, Accessibility, Best Practices and SEO. It works against a local or demo build without credentials, and a runbook explains how the recipient runs it against their own production with their own test account. Pages under 90 in any category become fix tickets. Detail in release-gates tickets 07 and 08.

**Blocked by:** 10 (final-polish-sweep)

**Status:** ready-for-agent

- [ ] Command runs against a local build and writes the summary table
- [ ] Signed-in pages are reached through a test-account helper that needs no Google login
- [ ] Every page's local result is recorded; any page under 90 has a fix ticket or is fixed
- [ ] Runbook for production runs is written; release-gates 07 done, 08 handed to ticket 22
