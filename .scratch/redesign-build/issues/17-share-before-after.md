# 17: Share before/after image

**What to build:** from the comparison on Xu hướng or from Photo detail, a user generates a before/after image with dates and the SkinSense wordmark, eyes blurred by default, and shares it through the Android share sheet or downloads/copies it on the web. Supersedes polish row 35. Spec: Features (share image); stories 78–81.

**Blocked by:** 14, 16.

**Status:** ready-for-agent

- [ ] The image is generated on the device (canvas on web, a Skia snapshot on Android) from the two chosen Photos, with dates and the wordmark
- [ ] Eye blur re-runs face landmark detection on both Photos at share time, the same way spot marking does (landmarks are not stored)
- [ ] Switches: dates on, eyes blurred on, redness value off by default
- [ ] Android opens the system share sheet; web offers download and copy
- [ ] Entry points on the Xu hướng comparison and on Photo detail
- [ ] Open before building: the canvas does not draw what happens when no face is found on one of the Photos; ask Dinh in a box
- [ ] Screen tests on both apps: toggles change the preview inputs, share/download actions called
- [ ] Playwright: share image download; Maestro: share sheet opens
- [ ] Light and dark screenshots match AndroidShare / WebShare / PhoneShare; differences noted here

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: No share-image code in either app (no expo-sharing, no canvas export, no share entry points).
- Left: Whole ticket: before/after image, eye blur, switches, share sheet and web download. Covered by handoff-completion 08.
