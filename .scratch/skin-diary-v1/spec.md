# skinsense-v2: skin diary v1 build

Status: ready-for-agent
Design: https://claude.ai/code/artifact/4ef59ba3-a8ad-4b6d-bf18-593510550ea4 — 5 screens (Landing, Capture, Mark Spots, Routine Checklist, Trends), static mockups, "Clinical calm" direction. Working source: `.scratch/skin-diary-v1/design/`.

## Problem Statement

A person trying to track whether visible facial redness and blemishes are improving in response to their skincare routine has no lightweight, private way to do it. Consumer apps either over-promise clinical-grade diagnosis they can't back up, or under-deliver on tracking rigor — plain trend lines with no consistent capture discipline behind them. Comparing photos from memory, taken under different lighting and framing each time, doesn't produce a trustworthy signal either.

## Solution

A private, self-referenced skin diary. Capture a guided face photo (live landmark overlay, a ghost of the previous photo, a brightness check) for consistent framing and lighting. Tap-mark visible spots directly on the photo. Tick off a personal nightly routine checklist. See per-zone trends — spot count, a lighting-robust redness index, routine adherence — over 7/30-day windows, plus a before/after slider between any two photos. No clinical claims anywhere; full user control over the data, including account deletion.

## User Stories

**Auth**
1. As a new user, I want to sign in with my Google account, so that I don't need a separate password.
2. As a returning user, I want my session to persist across app restarts (mobile) and browser visits (web), so that I don't sign in every time.
3. As a user, I want my data fully isolated from other users, so that my photos and skin data stay private.

**Capture**
4. As a user, I want a live guide overlay (face landmarks, a ghost of my previous photo, a brightness check) when capturing, so that I can frame and light each photo consistently enough for the trend data to mean something.
5. As a user, I want auto white balance locked at capture time, so that the camera's automatic color adjustments don't skew redness readings.
6. As a user, I want to know when a capture is poorly lit or framed, so that I don't end up with a photo that produces misleading trend data.

**Spot-marking**
7. As a user, I want to tap directly on my captured photo to mark visible spots, so that I have a lightweight personal record without depending on an unreliable automated detector.
8. As a user, I want my tapped spots to stay correctly positioned even if a later photo is framed slightly differently, so that the spot record stays meaningful over time.
9. As a user, I want to see how many spots I've marked per face zone, so that I can tell which areas are improving or worsening.

**Routine checklist**
10. As a user, I want to build my own nightly routine checklist — add, rename, delete, reorder steps — so that it matches my actual routine, not a generic one.
11. As a first-time user, I want a small default checklist already there for me to edit, so that I'm not starting from a blank screen.
12. As a user, I want to tick which routine steps I completed each night, so that I can see how consistently I'm actually doing my routine.
13. As a user, I want to tick my routine on a night I didn't take a photo, so that routine tracking isn't blocked by photo-taking.
14. As a user, I want my past nights' routine records to stay accurate even after I edit or remove a routine step later, so that my historical adherence trend doesn't silently change under me.

**Trends**
15. As a user, I want a redness index per face zone over a 7 or 30-day window, so that I can tell whether redness in specific areas is trending up or down.
16. As a user, I want my marked-spot count per zone over time, so that I can track breakout frequency by area.
17. As a user, I want to see my routine completion % over time, so that I can relate adherence to skin trends.
18. As a user, I want a before/after slider between two of my own photos, so that I can compare progress visually instead of relying on memory.
19. As a user, I want clear "not a medical diagnosis" messaging wherever trends or indices are shown, so that I don't mistake the app for clinical advice.

**Account / privacy**
20. As a user, I want to permanently delete my account and all my photos, so that I keep full control over my data.
21. As a user, I want a privacy page describing what's collected and how, so that I can decide whether to use the app with informed consent.

**Platform / presentation**
22. As an Android user, I want a native app installable from a direct link, so that I get the camera/ML features that need native modules.
23. As a desktop user, I want the app to work fully in my browser, so that I don't need to install anything. (iPhone dropped 2026-09-14: untested, not supported.)
24. As a Vietnamese or English speaker, I want the interface in my language.
25. As a visitor to the web app, I want an engaging visual hero (3D particle face) on the landing page, so that the product feels considered before I sign up.
26. As a visitor with motion sensitivity, I want the 3D hero to respect my reduced-motion preference, so that the page doesn't cause discomfort.

## Implementation Decisions

**Layout**: bun workspaces + Turborepo. `apps/web` (Next.js App Router, shadcn, React Three Fiber, Vercel Hobby). `apps/mobile` (Expo Router, New Architecture, Android only — no native iOS; React Native Reusables + NativeWind v4). `packages/domain` (pure TypeScript: zones, redness index, trend math, schemas; no React, no I/O). Capture code splits per platform by file suffix (`*.web.tsx` / `*.native.tsx`); both produce the same shape for `packages/domain` to consume.

**Domain input boundary**: each platform's capture engine produces `{ width, height, landmarks: {x,y,z}[468], skinMask?: Uint8Array }` (468 points on both platforms — web drops its 10 iris points from `FaceLandmarker`'s native 478; native uses the plain `face_landmark.tflite`, not the attention variant). `packages/domain` computes zone polygons (plus eye/brow/lip/nostril exclusions), redness/unevenness indices, and spot-zone assignment itself, once, from this shared input — platforms never compute zones themselves. `skinMask` is a pre-reduced binary mask (1 = skin), built by each platform's own adapter: web's is specifically face-skin (segmenter class 3); native's is general foreground/person (includes hair, neck, clothes, via a threshold on a different model, `selfie_segmentation`) — the two mean different things, divergence concentrates at the forehead/hairline. **Superseded 2026-09-13 by [ticket 18](./issues/18-native-capture-spike.md): `selfie_segmentation.tflite` needs a MediaPipe custom op plain TFLite lacks, so native runs the same `selfie_multiclass_256x256.tflite` as web with the same class-3 rule — both masks mean face-skin (counts agree to 0.2 % on the same photo).**

**Entities** (domain-owned schema — `packages/domain` defines the Postgres tables as TypeScript; Supabase migrations are generated from them, not hand-written):
- `Photo` — one face capture: image + metadata (brightness estimate, AWB lock state).
- `Zone` — one of five fixed regions (forehead, left cheek, right cheek, nose, chin); a computed concept, not its own persisted row.
- `Spot` — a user-tapped point on a `Photo`, normalized face-relative coordinates.
- `ZoneReading` — `{ redness, unevenness, pixelCount }` per `Zone` per `Photo`; computed and persisted at capture time, never recomputed later (source landmarks/mask aren't retained).
- `RoutineItem` — a user-owned, ordered, named routine step (e.g. "Cleanser"); user adds/renames/deletes/reorders; new users get a small seeded default set.
- `RoutineEntry` — one night's completion record: which `RoutineItem`s were completed, stored as a **snapshot of their labels at tick time** (not id references), independent of whether a `Photo` was taken that day.

**Redness index**: self-referenced CIELAB `a*`. Per skin pixel: sRGB → linear → XYZ (D65) → CIELAB, keep `a*`. `a_ref` = median `a*` over all skin pixels of the photo. `redness(zone) = median(a*_zone) − a_ref`. `unevenness(zone) = MAD(a*_zone)`. No clinical validation — matches comparable consumer apps (Trace, SelfieLog), neither of which exposes clinical grading either.

**Auth**: Google sign-in only, both platforms, via client-side ID token → `supabase.auth.signInWithIdToken` (no redirect-OAuth flow anywhere). Web needs a Web OAuth client ID (authorized JS origins); Android needs an Android OAuth client ID (package name + SHA-1, both debug and EAS keystores registered) plus the Web client ID passed as `webClientId`. Consent screen published to Production, `email`+`profile` scopes only (avoids verification, user caps, and grant expiry).

**Backend**: one Supabase project for both platforms. Expo session persistence via the `LargeSecureStore` pattern (AES key in secure storage, ciphertext in AsyncStorage — plain SecureStore truncates sessions silently past 2048 bytes); auto-refresh tied to `AppState`. Photo upload via `arrayBuffer()`, not base64 (base64 has corrupted uploads on Android); compress to ≤2MB on-device before upload, but run zone analysis before compression. Storage: private `photos` bucket, path `${auth.uid()}/${entryId}.jpg`, RLS scoped to the owning user's folder; reads via signed URLs only, never public. Every table carries `user_id uuid default auth.uid()` with matching RLS. Web uses `@supabase/ssr` with cookie sessions and a refresh middleware (Server Components can't write cookies themselves); never let a CDN cache a `Set-Cookie` response. Account deletion: an Edge Function with the service-role key removes the user's storage objects first, then calls `auth.admin.deleteUser` — never done client-side.

**Web hero**: `apps/web` only. React Three Fiber + drei `ScrollControls`, a particle cloud built from the MediaPipe canonical face mesh (468 vertices) assembling into a face, reacting to pointer position; a 3-scene scroll story (capture → mark → trend). Single instanced draw call; refs mutated per-frame, not React state. Respects `prefers-reduced-motion` (static face, no scroll animation). Lazy-loaded, not server-rendered.

**i18n**: Vietnamese + English — `next-intl` (web), `i18next` + `expo-localization` (mobile).

**Hosting / cost**: Vercel Hobby (web), EAS Build free tier with internal distribution (Android APK, installable without an Expo account), Supabase Free. Expected $0 through 2026-11 at ≤50 users; avoid Supabase's 7-day inactivity pause via a scheduled ping or regular use.

## Pre-submission QA gate

Confirmed with Dinh 2026-09-12 (`/grill-me` pass): last step before 2026-09-20, after every ticket above ships. Splits by platform — Claude runs the web-side stories itself (capture/mark-spots/trends flows, browser or Playwright) once tickets 02, 03, 06, 07, 09, 11, 12, 14, 15 are done; Dinh runs the Android-native stories manually on a real device (camera, ML Kit, EAS-built APK) once tickets 03, 02, 08, 10, 13 are done, against a checklist Claude generates from the 26 user stories above. Supplements, doesn't replace, the Stop-hook's `tsc`+Vitest gate. Not a ticket file — this note is its sequencing record.

**Explicitly not building**: offline mode (fully online; offline shows nothing, no queue/sync), automated spot/acne detection (no production-grade, permissively-licensed model exists — stays user-marked).

**Launch bar**: public sign-up, per-user data isolation, a privacy page, a "not a medical diagnosis" disclaimer wherever trends/indices show, and a working delete-account flow that also removes stored photos.

**Design tokens → shadcn** (`apps/web` has no design system yet — no `components.json`, default create-next-app `globals.css`; shadcn itself is already decided tooling, not reopened here). The `/design` canvas's "Clinical calm" tokens, to apply when shadcn is initialized (tracked at `/to-tickets`, not done in this spec):
- `--background` / `--foreground`: the canvas's warm off-white / near-black oklch pair, used as-is — Tailwind v4 / shadcn v4 accept oklch directly, no hex/hsl conversion needed.
- `--primary`: the canvas's clay/terracotta accent (CTAs, links, the redness-index chart line) — the interactive/brand color.
- `--success` (custom addition, not a stock shadcn token): the canvas's sage accent — used only for positive/progress semantics (routine completion %, "trending down" indicators), kept semantically separate from `--secondary` rather than overloaded onto it.
- `--border` / `--input`: the canvas's hairline border oklch value.
- `--muted` / chart gridlines: the canvas's soft neutral (`--grid` in `Trends.dc.html`).
- `--radius`: base ≈ 12px, matching the mockups' card/button roundness; the exact sm/md/lg/xl scale is an implementation-time detail, not locked here.
- Fonts: Newsreader (headlines, weights 400/500/600 + italic) + Public Sans (body/UI, weights 400/500/600/700) via `next/font/google` (self-hosted, optimized) — not the `<link>` tag the design canvas uses, which is a sandboxed-iframe-only workaround.
- Full token values and every screen's exact usage: the canvas's working source, `.scratch/skin-diary-v1/design/*.dc.html`.

## Testing Decisions

A good test here asserts on externally observable behavior — rendered UI state, persisted records, computed index values — never on internal implementation detail (which MediaPipe API method ran, intermediate tensor shapes). `packages/domain`'s tests call its public functions with fixture or synthetic input and assert on the returned values.

- **`packages/domain`** (Vitest, no I/O to fake — it's pure). **Superseded 2026-09-12 by ADR 0003 Addendum 4 and [ticket 15](./issues/15-fixture-acceptance-test.md): rank agreement is dropped as circular, and "increasing visible redness" is wrong — a whole-face flush cannot move a self-referenced index. Build what ticket 15 says, not the paragraph below.** The original wording: the redness-index acceptance-bar test is a committed-fixture check — monotonicity across a few of Dinh's own test photos with deliberately increasing visible redness, plus small-N rank agreement against Dinh's own visual ranking of those same photos (fixtures: pre-extracted landmarks/mask/`a*` data, not raw images). A second, separate synthetic-image test (flat colour + a red patch, not real photos) exercises the full pixel→CIELAB→index pipeline including the color-conversion code the fixture test's pre-computed `a*` never touches. Zone-polygon computation, spot-to-zone assignment, and routine completion % get ordinary synthetic/property-style unit tests — pure geometry and arithmetic, no fixtures needed.
  - **Platform-coverage caveat**: this whole layer only ever validates against web-derived input, since the fixtures can only be produced via the web capture pipeline. That's a legitimate test of the redness math itself (the math is platform-agnostic by design), but it says nothing about whether `apps/mobile`'s own adapter (landmark tensor decode, mask threshold/resize) produces input equivalent to web's. That verification is tracked separately, not blocking this build (see Out of Scope) — a green `packages/domain` suite is not proof native's numbers are trustworthy.
- **`apps/web`**: Vitest + Testing Library for interactive components (the tap-mark canvas, the capture guide overlay). Playwright for E2E, seam = a **fake camera at the browser level** (fake-device + fake-video-capture flags) — everything above that (capture pipeline, MediaPipe processing, domain computation, UI) runs for real, unmocked. Flows: sign-in → capture → mark spots → tick routine → view trends → before/after slider → delete account.
- **`apps/mobile`**: `jest-expo` + `@testing-library/react-native` + `expo-router/testing-library` for component/router tests. Maestro on the Android emulator for E2E, seam = the **emulator's virtual-scene camera** — same principle as web, real app code against a fake camera input, nothing else mocked.
- **Backend seam for E2E** (both platforms): the shared dev Supabase project, not a separate test project — Supabase Free realistically supports one project comfortably and a second adds setup/maintenance cost this timeline doesn't have room for. E2E runs use a dedicated test account so they don't mix with Dinh's own real usage data. Real RLS, real auth, real storage-path isolation get exercised — a mocked backend would make exactly the guarantees this app cares about untestable.
- **No CI exists in this repo.** The only automated gate is a local Stop hook that runs `tsc` on every changed workspace and, for `packages/domain` specifically, also runs its Vitest suite, blocking an agent from ending a session on a red typecheck or a red fixture test. That hook lives under a gitignored directory, so it's local development discipline, not a merge gate — nothing stops a commit or push with failing tests, and the hook doesn't travel to another machine or agent.
- Prior art: none in this repo yet — all three workspaces are still bootstrap stubs with no tests written. This spec establishes the approach fresh.

## Out of Scope

- Native iOS app (Apple Developer Program cost ruled out) — iPhone users get the web app in Safari instead.
- Offline capture, queueing, or background sync.
- Automated acne/blemish detection — spots stay user-marked.
- Clinical-grade validation of the redness index.
- A CI/CD pipeline.
- Multi-user collaboration, sharing, or any cross-user feature beyond strict per-user isolation.
- Building the fixture-generation harness (`mpbench`-equivalent) and capturing the first real redness-index fixture set — infrastructure the acceptance-bar test needs to run for real, tracked separately as a production-readiness ticket, not a product feature of this spec.
- Verifying native's capture adapter against web's known-good output — tracked separately, not blocking since `apps/mobile` has no capture code yet to verify against.

## Further Notes

- `/design` has not yet run for this build's ~5 main screens. This repo's process expects the spec to link the design canvas URL; this spec ships without it — run `/design` and backfill the link before `/to-tickets` decomposes this into tickets.
- Schedule: ~45h budget (2026-09-12 → 2026-09-20, ~5h/day) against an earlier ~55h estimate for this same scope. Dinh chose not to cut scope; sequencing and prioritization within the budget is `/to-tickets`'s job, not this spec's.
- Four ADRs ground the Implementation Decisions above: `docs/adr/0001` (domain input boundary), `0002` (schema ownership), `0003` (redness acceptance bar), `0004` (routine checklist). Full decision trail: `.scratch/production-readiness/map.md`.
- The old `~/skinsense` repo is read-only history and not an input to this build.
