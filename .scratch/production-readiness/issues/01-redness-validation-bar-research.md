# Redness-index validation bar: research

Type: research
Status: done

## Question

What validation/acceptance bar do comparable self-referenced, non-clinical redness/skin-tracking indices use before shipping? skinsense-v2's redness index (CIELAB `a*`, self-referenced against the same photo's median — see `docs/research/redness-index.md`) has no clinical ground truth to validate against, so "how accurate is it" isn't answerable directly.

Surface what "good enough to ship" looks like in comparable products and the cited literature:

- Consumer apps already referenced in `redness-index.md` (SelfieLog, Trace, Acnify): do any state or imply a validation method, or do they ship a relative/trend-only index with no stated accuracy bar (the doc already notes none exposes clinical grading)?
- The cited papers (Erythema Q-score, melanin/hemoglobin decomposition, PMC rosacea imaging article): do any describe a practical "is this good enough" check short of full clinical validation, usable by a solo dev in a few hours?

Write findings so ticket 02 (blocked by this one) can decide skinsense-v2's own acceptance bar.

## Answer

**App landscape:** Trace explicitly disclaims clinical grading — "Trace measures, it does not diagnose... not a medical assessment" — while shipping four 0–100 trend scores. SelfieLog frames around progress tracking with no clinical-grading language found. Consistent with `redness-index.md`'s existing "trend-only, no clinical grading" note. (Acnify not checked — Trace + SelfieLog already confirm the pattern.) No consumer app publishes its internal validation methodology; that is absence of a public claim, not evidence of no internal validation.

**Candidates checked against literature** (comparable self-referenced/non-clinical erythema imaging, not full clinical trials):

| Candidate | Found? | Evidence |
|---|---|---|
| (a) No check at all | Undeterminable | No source states or rules this out — it's a shipping decision nobody publishes either way. |
| (b) Monotonicity | Yes, as an analog | Frew et al. 2021 ([PMC8049083](https://pmc.ncbi.nlm.nih.gov/articles/PMC8049083/), "Erythema Q-score" — likely the same paper as the paywalled Wiley `exd.14224` citation, reached via its open-access PMC mirror): EQscore rises linearly with controlled UV dose. Graded known stimulus, not manually-varied photos, but the same monotonicity logic. |
| (c) Test–retest repeatability | Not found directly | [PMC7754330](https://pmc.ncbi.nlm.nih.gov/articles/PMC7754330/) (Logger et al.) reports *interobserver* concordance (2 raters, R²=0.82) — a different claim from repeated-capture repeatability. General colorimeter literature (Baquié et al. 2014, snippet-only, unverified against primary text) suggests repeated pre/post measurements and a CV<15% reproducibility bar as standard practice. |
| (d) Known-reference-patch | Mostly absent | Frew et al. explicitly used no calibration card. Logger et al.'s in-frame green sticker serves a different (R/G-ratio) metric, not a* verification. Baquié et al. (unverified snippet) reportedly validated against color charts first — a genuine precedent, unconfirmed. |
| (e) Small-N rank agreement | Yes, but clinician-graded, not lay rank-order | Frew et al.: algorithm vs. dermatologist score, r=0.91, ICC 0.88 (algorithm) vs. 0.68 (human raters) — the algorithm was *more* self-consistent than the human graders. Logger et al.: clinical score vs. lesional a*, Rs=0.37 (weak). |

**Beyond the candidate list:** arXiv 2404.00552 validates only by informal visual plausibility ("can freckles/pimples be visually separated") — no statistics, a lighter cousin of (e). Logger et al.'s core metric — Δa* = lesional minus non-lesional site, same photo — is a direct precedent for skinsense-v2's own self-referencing design (median-of-photo baseline), though it validates the *approach*, not a shipping sanity-check.

**Sources not fully accessible:** Wiley `exd.14224` (403; substituted the PMC8049083 mirror). ScienceDirect `S0022202X26010146` (403; bioRxiv mirror rate-limited). arXiv 2404.00552's full PDF body — local `pdftoppm`/poppler-utils missing, so only the abstract/HTML page was read; cached PDF available if deeper sections matter later.

One-time override: resolved by Claude directly (not agy) per Dinh's choice in the 2026-09-11 grilling session — see `map.md` Notes.

## Audit 2026-10-17

- Status: done
- Evidence: Research resolved; bar recorded in ADR 0003 (docs/adr/0003-redness-index-acceptance-bar.md, commit 60eba7d).
