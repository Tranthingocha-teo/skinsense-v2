# 01: Token theme and fonts on both apps

**What to build:** both apps take every colour role, radius and font from the token package, so the existing screens already show the C3 palette, Noto Serif Display and Manrope before any screen is rebuilt. Spec: Tokens, type, components; stories 1–4.

**Blocked by:** [portfolio-release-gates 01 (CI)](../../portfolio-release-gates/issues/01-ci-github-actions.md).

**Status:** done

- [x] The web theme is the token package's generated web CSS (shadcn variable names, hex, `:root` light and `.dark`); the oklch palette and the 12px radius are gone
- [x] Radius roles map to control 4, card 18, pill 999 on both apps
- [x] Android imports the generated NativeWind CSS (NativeWind 4 + Tailwind 3 unchanged)
- [x] Noto Serif Display 300/400 and Manrope 300–600 load on both apps (Vietnamese subset on web, Expo Google Fonts on Android); the web preloads only the display weights used above the fold
- [x] "ô, ồ, ổ" in a display heading render with correctly placed diacritics on both apps
- [x] The Base UI combobox is removed; no web code imports `@base-ui/react`
- [x] Every text/background pair used by the tokens meets WCAG AA in light and dark (measured, numbers noted in this ticket)
- [x] Existing typecheck, Vitest and jest-expo suites pass unchanged
- [x] Light and dark screenshots of the current Today screen on both apps are attached to this ticket as the "tokens only" state

## Contrast (measured 2026-09-15, `packages/tokens/build.mjs` pairs, WCAG ratio; AA needs 4.5)

| theme | pair | ratio |
|---|---|---|
| light | fg on bg | 13.77 |
| light | fg on surface | 15.76 |
| light | fg on surface-2 | 12.42 |
| light | muted on bg | 5.96 |
| light | muted on surface | 6.82 |
| light | muted on surface-2 | 5.38 |
| light | on-accent on accent | 14.49 |
| light | good on surface | 6.17 |
| light | good on bg | 5.39 |
| light | danger on surface | 5.93 |
| light | danger on bg | 5.18 |
| light | on-accent on danger | 5.68 |
| dark | fg on bg | 17.09 |
| dark | fg on surface | 14.55 |
| dark | fg on surface-2 | 12.75 |
| dark | muted on bg | 9.93 |
| dark | muted on surface | 8.45 |
| dark | muted on surface-2 | 7.41 |
| dark | on-accent on accent | 15.00 |
| dark | good on surface | 9.80 |
| dark | good on bg | 11.51 |
| dark | danger on surface | 7.46 |
| dark | danger on bg | 8.76 |
| dark | on-accent on danger | 8.26 |

## Decisions (2026-09-15)

- Aliases added in `build.mjs` for utilities the apps already use: `primary-soft` → `surface-2` (no brand hue); `chart-1..5` → `fg`, `good`, `muted`, `line`, `danger`; `sidebar` → `bg`, `sidebar-foreground` → `fg`, `sidebar-primary` → `accent`, `sidebar-primary-foreground` → `on-accent`, `sidebar-accent` → `surface-2`, `sidebar-accent-foreground` → `fg`, `sidebar-border` → `line`, `sidebar-ring` → `fg`. `success-soft` dropped (no utility consumer in either app).
- Web radius map in `@theme inline`: `sm/md/lg` → control 4 (Button, Input use `rounded-lg`), `xl/2xl/3xl` → card 18 (Card uses `rounded-xl`), `4xl` → pill 999 (Badge uses `rounded-4xl`).
- `dist/` stays gitignored. Web and mobile depend on `@skinsense/tokens` (turbo `^build` builds it before typecheck/test/build); the web `build` script runs `node ../../packages/tokens/build.mjs` first because Vercel (root `apps/web`, no buildCommand) runs the package script, not turbo. Caveat: `cd apps/web && bun dev` / `expo start` on a fresh clone need `node packages/tokens/build.mjs` once.
- Android fonts: static TTFs from the Expo Google Fonts packages, embedded by the expo-font plugin (weighted XML families, so `font-display font-semibold` picks the nearest weight instead of faking bold). Plugin change needed `expo prebuild --platform android` (regenerated `android/`) and a dev-client rebuild.
- Web fonts: display preloads 300+400 (latin + vietnamese); Manrope `preload: false` because the landing LCP text (h1) is display.
- Web dark follows the system via next-themes (`attribute="class"`, `defaultTheme="system"`, `enableSystem`); no toggle.

## Now

- Done 2026-09-15 (uncommitted, awaiting orchestrator review). Screenshots: `~/docs/case-study/skinsense/build/01-tokens/` (web-landing/today/diacritics × light/dark, android-light/dark, android-diacritics-light).

- Review 15/09: `text-white` on `bg-primary` swept to `text-primary-foreground` on both apps (white on cream in dark). The dark screenshots in the folder predate this sweep; ticket 02's screenshots show the fixed state. `on-accent on good` (checked routine box) added to the build's contrast pairs. App `dev`/`start`/`android` scripts run the token build first so a fresh clone works; DESIGN.md Tokens paragraph updated.

## Next

- Done. Android tab bar active tint is still the old orange (`(tabs)/_layout.tsx` hard-codes it): ticket 02.

## Audit 2026-10-17

- Status: done
- Evidence: Commit fcb93ea (tokens wired into web and Android); packages/tokens; apps/mobile themed-text.test.tsx.
