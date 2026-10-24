# 11: Landing scroll stage and particle face

**What to build:** a visitor scrolling the landing sees the real Hôm nay UI in a phone with floating data cards that count up and drift across three scrubbed scenes, and in "Cách hoạt động" the points form a face and split into five zones, without costing the page its Lighthouse score. Spec: Motion; stories 5, 6, 57, 58.

**Blocked by:** 04, 10.

**Status:** done

- [x] 400svh track with a CSS-sticky 100svh stage and three scenes scrubbed by GSAP + ScrollTrigger + Lenis, no pin, following the DESIGN.md storyboard and the motion sheet on canvas page "Hoàn thiện"
- [x] The phone shows the real Hôm nay component from 04 on sample data; data cards count up and drift
- [x] Motion layout applies from first paint through a scripting + reduced-motion media query, never a post-hydration class flip
- [x] Motion code is a separate client chunk loaded after hydration
- [x] The particle face (three.js) loads only when its section nears the viewport, forms a face and splits into five zones
- [x] Reduced motion: static scenes, fades only
- [x] Local Lighthouse mobile run on `/` recorded in this ticket; any effect that keeps the page under 90 is cut
- [x] Existing hero-scenes tests updated or replaced to cover scene progress
- [x] Screenshots of scene 2 match the WebLanding / PhoneLanding stage; a short screen recording of all three scenes is attached

## Lighthouse (local, mobile, production build `next start`, Lighthouse CLI latest, Chrome headless)

The machine was shared with other agents (jest workers, load average up to 14.8), so Lighthouse's own `benchmarkIndex` swung from 27 to 3168 between runs and TBT tracked it. Runs are compared at the baseline's conditions (benchmarkIndex ≈ 3100); contended runs are listed, not hidden.

| Run | benchmarkIndex | Perf | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- |
| Baseline (ticket-10 landing, no stage) 1/2/3 | 3133 / 3143 / 3121 | 93 / 92 / 92 | 3.2 / 3.3 / 3.4 s | 0 | 30 / 50 / 70 ms |
| **Baseline median** | | **92** | **3.3 s** | **0** | 50 ms |
| Stage v1 (phone iframe `loading="lazy"`, loads with the page) 1/2/3 | 1726 / 1080 / 2629 | 68 / 69 / 93 | 2.6 / 2.6 / 2.3 s | 0 | 2650 / 1740 / 270 ms |
| Stage final (iframe deferred), matched runs | 3168 / 3133 / 3070 | 94 / 92 / 91 | 3.0 / 3.3 / 3.4 s | 0 | 50 / 50 / 90 ms |
| **Stage final median (matched)** | | **92** | **3.3 s** | **0** | 50 ms |
| Stage final, contended runs (discarded) | 626–2253 | 44–89 | 2.7–5.6 s | 0 | 170–11970 ms |

- Stage v1 cause: react-dom scripting 951–2925 ms against 188 ms in the baseline, with the `/stage` document requested at 140–270 ms. With the GSAP/Lenis chunk blocked the runs still scored 85 / 88 / 92, so the cost was the second React app in the phone iframe. Fixed by deferring the iframe (Decisions); no `/stage` request in any final run.
- CLS is 0 in every run, stage included: the first-paint motion layout holds.
- Nothing was cut: the matched median equals the baseline (92). Next lever if the release-gates audit on an idle machine lands under 90: the GSAP/Lenis chunk (`bootup-time` 460 ms total, 171 ms scripting at benchmarkIndex 3070) could load on the first scroll instead of right after hydration.

## Decisions
- The phone screen is the real `Today` in a same-origin iframe of `/stage` (a public, noindex route rendering `DemoToday`), because `Today` switches layout on viewport `md:` breakpoints and would show its desktop layout inside the phone at 1440. `/stage` is a production route the landing needs, not a dev aid, so it stays.
- The iframe mounts only when the phone nears the viewport (IntersectionObserver; the stage's overflow clip counts): in the motion layout the phone starts clipped below the stage, so the second React app never loads before the first scroll. A `<noscript>` copy keeps it for visitors without scripts. The same `useNear` hook gates the particle face (400px margin).
- Scene 2 on the canvas shows the sparkline drawn; DESIGN.md draws it in scene 3, and DESIGN.md wins (spec), so scene-2 screenshots show the dot and baseline only.
- `components/hero/*` became `components/face/*` (`ParticleFace`, `face-scenes`): the three.js face no longer lives in the hero but in "Cách hoạt động".

## Evidence
- Screenshots and video: `~/docs/case-study/skinsense/build/11-landing-scroll-stage/` (`stage-scene2-{1440,390}-{light,dark}.png`, `stage-reduced-motion-1440.png`, `face-reduced-motion-1440.png`, `landing-three-scenes.webm`, 41 s at 1440).
- Scene 2 capture state: step 02 active, counters 3.1 / 8 / 3, track 3600px at 900px viewport (400svh), no horizontal scroll at 390, iframe h1 "Hôm nay". Reduced motion: track 961px (static), face canvas mounted near #how.
- Tests: `face-scenes.test.ts` (scatter → face → five zones, progress mapping), `stage-scenes.test.ts` (scene progress), `landing.test.tsx` (static scenes and final counter values before motion, iframe only when near, face placeholder until near). Root `bun run typecheck` and `bun run test` pass (domain 72, web 40, mobile 34); `bun run build` passes.

- Review 15/09: the particle colour re-reads `--foreground` when the theme flips; the face keeps its fade-in under reduced motion (DESIGN.md "fades only"). Zone captions on the split face are an addition beyond story 58, kept because they name the five zones.

## Now
- Done; committed on the worktree branch.

## Next
- Release-gates spec: re-run Lighthouse mobile on `/` on an idle machine (`bunx lighthouse http://localhost:3011/ --only-categories=performance --form-factor=mobile --output=json`, 3 runs, production build).

## Audit 2026-10-17

- Status: done
- Evidence: Commit 12bbe58 plus fixes 289a59f and c49989c; stage/stage-scenes.test.ts and face/face-scenes.test.ts.
