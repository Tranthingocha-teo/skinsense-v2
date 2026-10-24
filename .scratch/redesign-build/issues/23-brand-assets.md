# 23: Brand assets

**What to build:** the Android home screen, launch splash, browser tab and link previews all show the logo mark: adaptive and themed icons readable at 48dp, a static splash in light and dark, a favicon set readable at 16px, manifest icons and an OG image. Spec: Brand assets; stories 99–102.

**Blocked by:** None within this spec (Dinh chose to build it last on 15/09).

**Status:** ready-for-agent

- [ ] Source: the rendered PNGs and SVGs in the redesign scratch brand folder, app-icon stroke 2.6
- [ ] Android adaptive icon: foreground 432 with the mark inside the 264 safe zone, surface-colour background; monochrome themed icon; 1024 icon
- [ ] Static splash in light and dark; the dev build is rebuilt
- [ ] Web: SVG favicon plus 48/32/16 PNG (16px is a single thick ring), a web manifest with 512/192 icons, OG image 1200×630 with the headline over the night photo placeholder
- [ ] The icon is checked at 48dp on the emulator home screen (screenshot attached) and the favicon in a browser tab
- [ ] Light and dark screenshots match BrandIcon, BrandSplash and BrandOG; differences noted here

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: Only the v2 monogram assets exist (apps/mobile/assets/images/icon.png etc., apps/web/src/app/icon.svg, opengraph-image.png from commit 7e4fd54); no web manifest in apps/web/public.
- Left: Icon, adaptive and themed icons, light/dark splash, favicon set, manifest, OG image from the redesign logo mark. Covered by handoff-completion 09.
