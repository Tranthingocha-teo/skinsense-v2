# Web hero: particle face + scroll-driven scenes (decided 2026-09-11)

Scope: `apps/web` only (Next.js + React Three Fiber). Mobile has no 3D. Priority equal to core features per Dinh.

## What it is

1. Hero: a cloud of particles that assembles into a human face, using the vertex positions of the **MediaPipe canonical face mesh** (468 vertices, Apache-2.0). Reacts to pointer position (parallax / slight repulsion).
2. Scroll-driven story in three scenes: capture (particles form the face + guide ring), mark (a few particles light up as spots), trend (spots fade along a line/chart). Camera and material transitions are driven by scroll position.

## Implementation notes

- `@react-three/fiber` + `@react-three/drei` `ScrollControls` / `useScroll` for the scroll timeline; one `Canvas` under the landing route, lazy-loaded (`next/dynamic`, `ssr: false`).
- Particles: a single `InstancedMesh` (or `Points` with a custom shader) — 468 (or a subdivided/mirrored set) instances, one draw call. Never allocate inside `useFrame`; mutate refs, do not set React state per frame.
- Asset: `canonical_face_model.obj` from the MediaPipe repo (path `mediapipe/modules/face_geometry/data/canonical_face_model.obj`, verify before relying on it). Convert once to a flat `Float32Array` JSON (~468×3 numbers) checked into `apps/web/public` or `packages/domain`; no glTF loaders needed.
- Respect `prefers-reduced-motion`: static face, no scroll animation.
- Budget: ~10 h total (particle face ~5 h, scroll scenes ~5 h), WebGL2 only (no WebGPU/TSL needed).

## Skills

- `emalorenzo/three-agent-skills`: `r3f-best-practices`, `three-best-practices` (installed by bootstrap). Impertio WebGPU/TSL and error skills deferred; revisit only if debugging VRAM or colour-space issues.
- Full comparison of 3D agent skills: `~/docs/research/Research_Top_3D_Agent_Skills_ThreeJS_R3F_and_WebGPU.md` (section 5.3 curated bundle).

## Alternatives considered and dropped

- Procedural blob/shader hero (cheapest, weakest story), glTF products from Sketchfab/Poly Haven (asset hunting + compression), Blender-made model (blender-lab not started), Spline export (~1 MB runtime, free-tier watermark), text-to-3D (Meshy/Tripo, cleanup needed).

## Sources

- https://github.com/google-ai-edge/mediapipe (canonical face model, verify path)
- https://github.com/emalorenzo/three-agent-skills
- https://github.com/pmndrs/drei (ScrollControls)
