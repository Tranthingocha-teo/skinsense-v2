# 05: Capture, spot marking and trends: every state on both platforms

Parent: [spec](../spec.md)

**What to build:** Finish redesign tickets 05, 06 and 07 and close the older v1 tickets they replace (mobile capture, mobile spots, mobile trends, web trends, live redness mode, native capture spike). Each screen shows every state drawn on the canvas: camera denied, low light, no face found, saving, save error, saved, not enough photos, and network error.

**Blocked by:** 03 (redesign-foundation-shell-today)

**Status:** ready-for-agent

- [ ] Chụp, Đánh dấu nốt mụn and Xu hướng match the design on web and Android with all drawn states
- [ ] Camera-denied, low-light, no-face and save-error paths are tested
- [ ] The older v1 capture, spots, trends and live-mode tickets are closed as done or superseded with evidence
- [ ] Redesign tickets 05 to 07 are marked done with evidence

## Audit 2026-10-17

- Scope narrowed by audit: redesign-build 05, 06 and 07 are done on main with tests; the v1 tickets they replace are now closed in ticket 02 (v1 08, 10, 12, 13 superseded; 17 superseded by production-readiness 08; 18 done). What is left is the all-states confirmation against the canvas (camera denied, low light, no face, save error) on both platforms.
