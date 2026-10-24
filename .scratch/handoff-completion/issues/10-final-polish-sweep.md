# 10: Final polish sweep: responsive, reduced motion and strings

Parent: [spec](../spec.md)

**What to build:** With every screen built, sweep the whole product: the web app works down to 390px, motion is off under reduced motion on both apps, and Vietnamese and English strings are complete with no missing or untranslated key on either app.

**Blocked by:** 04 (redesign-account-surfaces), 05 (redesign-core-capture-spots-trends), 06 (redesign-public-web), 07 (android-lock-about-reminder), 08 (share-export-feedback), 09 (brand-assets)

**Status:** ready-for-agent

- [ ] Every web page is usable at 390px wide with no horizontal scroll
- [ ] Reduced motion disables all motion on both apps
- [ ] A check fails the test run when a locale key is missing in either language
- [ ] Root typecheck and tests pass
