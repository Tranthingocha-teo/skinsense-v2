# 06: Web — landing page + 3D hero

**What to build:** the public landing page a visitor sees before signing in, including the React Three Fiber particle-face hero, handing off into real Google sign-in. Also the first `apps/web` UI ticket, so it brings the design system into the codebase.

**Blocked by:** 03

**Status:** done

- [x] Matches the canvas's `Main` artboard: nav, hero, 3 feature blocks, trust/disclaimer section, footer
- [x] R3F + drei `ScrollControls` particle cloud built from the 468-point canonical face mesh, single instanced draw call, refs mutated per-frame not React state
- [x] 3-scene scroll story (capture → mark → trend), lazy-loaded, not server-rendered
- [x] Respects `prefers-reduced-motion`: static face, no scroll animation
- [x] CTA leads into the real Google sign-in from ticket 03 — verified 2026-09-14 on production `https://skinsense-v2.vercel.app` in Dinh's Chrome: the hero button lands on `/app` signed in
- [x] shadcn initialized in `apps/web` (`components.json` + base components) with the Clinical calm token mapping from spec.md's "Design tokens → shadcn": `--background/--foreground/--primary/--success(custom)/--border/--input/--muted/--radius`; Newsreader + Public Sans loaded via `next/font/google`
- [x] All UI strings shipped in Vietnamese + English

## Now

Built 2026-09-13 (Claude, `/implement`). `bunx --bun shadcn@latest init -p nova -b radix` → `components.json` (radix-nova), `src/lib/utils.ts`, `ui/button.tsx`; `globals.css` `:root` rewritten to the canvas's Clinical calm oklch values under shadcn's names (`--background/--foreground/--card/--primary/--primary-soft/--secondary/--success/--success-soft/--muted/--muted-foreground/--border/--input/--ring/--radius: 12px`, charts mapped to clay/sage/neutrals), `.dark` block dropped (single-look light). Fonts: `Newsreader` (`weight: "variable"` — `next/font` only allows `axes: ["opsz"]` with variable weight; the fixed 400/500/600 list fails at build) + `Public_Sans` 400–700, both with the `vietnamese` subset, as `--font-display` / `--font-body` → `font-display` / `font-sans` utilities. `/` is now the landing (`src/app/page.tsx`, server component: nav, hero copy + `GoogleSignIn` CTA + fine print, 3 features, trust, footer with `/privacy` link); `Landing` namespace in `messages/{vi,en}.json` (artboard text verbatim in vi); `SignIn` keeps only `error`.

Hero: `src/components/hero/face-mesh.ts` (the 468 OBJ vertices of MediaPipe's canonical face model, centered, unit-scaled, Apache-2.0 header), `hero-scenes.ts` (pure: seeded scatter, chart-line targets, `positionAt(i, t)` across the three scenes with per-particle stagger, `spotGlow(t)`; 3 Vitest tests), `hero.tsx` (`Canvas` → `ScrollControls pages={3}` → one `instancedMesh` of 468 spheres, matrices + `instanceColor` mutated in `useFrame`, guide `ringGeometry` fading with scroll, pointer parallax on the group; scene captions are DOM `<p>`s outside the canvas whose opacity `useFrame` writes via refs — drei's `<Scroll html>` double-`createRoot`s under React 19 Strict Mode), `hero-loader.tsx` (`next/dynamic`, `ssr: false`). Reduced motion: no `ScrollControls` mounted at all (its container still swallows a page of wheel even with `enabled={false}`), `frameloop="demand"`, static face + guide oval, no captions, no parallax.

Layout decision (recorded on purpose): the artboard is followed literally — copy column is server-rendered DOM, the canvas column owns the scroll story. Wheel/touch over the canvas drives the three scenes and then chains to the page; over the text it scrolls the page. Verified with Playwright against `bun dev` at 1440×900: 468 dots, scatter → face with the oval → 10 cheek/forehead spots glow → chart line; page chaining after the story; parallax moves on pointer; reduced motion = 0 inner scrollers, page scrolls normally; 400px wide stacks, no horizontal overflow. `bun run typecheck` 4/4, `bun run test` 32 domain / 9 web / 6 mobile green.

Not verified: real sign-in from the new CTA (Dinh's action on `localhost:3000`). Under Playwright's Chromium GIS logs "origin not allowed" and the button falls back to a plain render — same Web client ID as ticket 03, where Dinh's own Chrome signed in fine; likely a headless-origin quirk, worth one look when Dinh signs in. `bun run lint` fails on a pre-existing `react-hooks/set-state-in-effect` in `routine-checklist.tsx` (ticket 04), untouched here.

`/code-review` (Standards + Spec, Sonnet sub-agents) found: frame-loop scratch objects held in `useState` and a per-frame `forEach` closure (both fixed: module constants + a `for` loop); the CTA box was ticked without a real sign-in (unticked). Kept on purpose: the guide oval (decided in `docs/research/3d-hero.md`: "capture (particles form the face + guide ring)", so the hero is 2 draw calls — 1 instanced cloud + 1 ring), `lucide-react` + the extra shadcn tokens (`shadcn init` output the `radix-nova` preset's components reference; `shadcn` must stay a runtime dependency because `globals.css` imports `shadcn/tailwind.css`), inline feature SVGs copied from the artboard rather than lucide.

`bun run build` (Next 16, Turbopack) passes; `next start` serves `/` without referencing the 900K three/drei chunk in the initial HTML — the `next/dynamic` boundary really splits it (Next 16 prints no per-route sizes, so this was checked by grepping the served HTML).

## Next

- Dinh: open `localhost:3000`, scroll over the face, click the Google button → `/app`. Then commit (`/commit`).
- Ticket 11 must create `/privacy` — the footer already links to it.
- Nav "Đăng nhập" is an anchor to the hero CTA (one GIS `initialize` per page), not a second button.

## Audit 2026-10-17

- Status: done
- Evidence: Commit 99e5f15; apps/web landing.test.tsx; visuals superseded by redesign-build 10 and 11.
