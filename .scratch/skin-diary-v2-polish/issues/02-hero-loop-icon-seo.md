# 02: Hero auto-loop, app icon + splash, SEO + Open Graph

**What to build:** a first visit shows the product immediately — the landing hero plays face → spots → chart on a loop without scrolling; SkinSense has its own icon on the Android home screen, its own splash, and a matching web favicon; a shared link previews with a proper title, description and image. Spec rows 3–5, stories 12, 14, 15, 24. Estimate 2 h.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Scroll-driven controls are removed; a clock drives the existing three-scene timeline on a loop
- [x] With reduced motion on, the hero shows the current static face and does not animate
- [x] Hero stays a single instanced draw call, lazy-loaded, not server-rendered
- [ ] Icon: Claude builds the SVG monogram (Clinical calm, brandkit direction) and writes a brandkit prompt; **stop: Dinh runs the prompt in Gemini and picks the better one** (don't block the hero/SEO work on the answer)
- [x] The chosen icon is the Android adaptive icon + splash (app config) and the web favicon
- [ ] Every public web page has a title and description (vi + en); an Open Graph image renders in a link-preview checker
- [ ] Deployed to Vercel production (Android icon/splash ships with ticket 10's APK)

## Now

- Hero: drei `ScrollControls` removed (dependency dropped); `loopOffset(clock)` plays 0 → 1, holds, plays back, holds; `range()` replaces `scroll.range/curve`; both unit-tested in `hero-scenes.test.ts`. Reduced motion keeps t = 1/3 with `frameloop="demand"`.
- Icon: serif "S" monogram from Newsreader outlines (wght 600, opsz 24) + one spot dot, clay `#A7694C` / cream `#F9F7F2`. Source + generator: `design/icon/build.py` (writes the SVGs, `apps/mobile/assets/images/{icon,android-icon-foreground,android-icon-monochrome,splash-icon}.png`, `apps/web/src/app/icon.svg`, `opengraph-image.png`). Default `favicon.ico` and `android-icon-background.png` removed; `app.json` adaptive background + splash colours updated.
- SEO: layout metadata has `metadataBase` + Open Graph; privacy page has its own title/description; both follow the `locale` cookie (vi/en).
- Brandkit prompt for Gemini (Dinh's stop, does not block): "App icon for SkinSense, a private nightly skin-diary app. Clinical calm direction: warm clay #A7694C and cream #F9F7F2, one accent of sage #3E623F at most. A single bold serif monogram 'S' (Newsreader-like, high contrast) with one small round dot suggesting a tap-marked skin spot. Flat, no gradients, no faces, no medical crosses, no sparkles. Must read at 48 px. Deliver a 1024×1024 square with the mark centred inside the inner 66% circle (Android adaptive icon safe zone), plus a transparent-background version of the mark alone."

## Next

- Code review, commit; production deploy waits for Dinh's approval (as ticket 01). If Dinh prefers the Gemini icon: drop its PNGs over the four mobile files + replace `icon.svg`/OG, no code change.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 7e4fd54 (hero loop, monogram icon, splash, SEO, Open Graph: apps/web/src/app/opengraph-image.png, icon.svg). Replaced by the redesign brand set in redesign-build 23.
