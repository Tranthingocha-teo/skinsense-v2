# Zone-to-landmark index map: research

Type: research
Status: done

## Question

Ticket [Landmark + mask wire format](./05-landmark-mask-wire-format.md) standardized on MediaPipe's plain 468-point canonical face mesh, but confirmed no official Google documentation maps which of the 468 indices belong to which skin zone (forehead, left cheek, right cheek, nose, chin) — only broad region sets exist officially (lips, eyes, eyebrows, iris, face oval).

Find a usable index map for the five zones:

- Community-sourced canonical-face-model index maps are common in the MediaPipe ecosystem (the 468-point topology is widely reused outside MediaPipe itself) — locate one or more, cross-check them against each other and against MediaPipe's own official region sets (e.g. `FACE_OVAL`, eyebrow/eye sets already confirmed) as a sanity boundary check.
- `.claude/skills/mediapipe-tflite/SKILL.md` (gitignored, but listed in AGENTS.md's "Project skills") already flags this exact gap: "do not hardcode indices from memory without checking against the mesh image/OBJ." Verify any candidate index list visually against the canonical mesh image or `.obj`, not just against another community list.
- Note confidence level per zone; flag any zone where sources disagree or coverage looks thin.
- This feeds `packages/domain`'s zone-polygon construction directly — precision matters more than speed.

## Answer

All indices below are for the plain 468-point topology (no iris/attention points); the topology is identical between `@mediapipe/tasks-vision` (web) and `face_landmark.tflite` (native), so one map serves both platforms.

**Official exclusion regions, HIGH confidence** — from `mediapipe/python/solutions/face_mesh_connections.py`, the same tables backing `FaceLandmarker.FACE_LANDMARKS_*` in tasks-vision JS; cross-checked against an independent gist, exact match:
- Left eye (closed ring): `[362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]`
- Right eye (closed ring): `[33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]`
- Left eyebrow (open arc, not a ring): `[276, 283, 282, 295, 285, 300, 293, 334, 296, 336]`
- Right eyebrow (open arc, not a ring): `[46, 53, 52, 65, 55, 70, 63, 105, 66, 107]`
- Lips, outer boundary (closed ring): `[61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]`

**Nostrils, MEDIUM confidence, no official set** — from `tannisthamaiti/Pranayam`'s `extract_nostril.py`, cross-checked point-for-point against two more repos: left `[129, 218, 166]`, right `[358, 438, 391]` (small triangles, not a closed contour — thin coverage but anatomically placed correctly on visual check).

**Skin zones, no official set, community-sourced and cross-checked against ≥2 independent repos + py-feat's anatomical muscle-seed maps + the canonical mesh diagram:**
- Forehead, MEDIUM-HIGH: `[10, 338, 297, 332, 298, 293, 334, 296, 336, 9, 107, 66, 105, 63, 68, 103, 67, 109]`
- Left cheek, HIGH: `[116, 117, 118, 119, 120, 121, 128, 126, 142, 36, 205, 206, 207, 213, 192, 147]`
- Right cheek, HIGH: `[345, 346, 347, 348, 349, 350, 451, 452, 453, 464, 435, 410, 454, 323, 366, 376]`
- Nose, MEDIUM: `[1, 2, 5, 4, 6, 19, 20, 94, 125, 141, 235, 236, 237, 238, 239, 240, 241, 242]` (a tighter community skin-patch set, chosen over the official `FACEMESH_NOSE` edge list — that one is an official-but-edge-list-not-vertex-loop connection table of ambiguous fill order, and a looser community variant was found to bleed into cheek territory on cross-check)
- Chin, MEDIUM, thinnest of the five: `[175, 199, 200, 18, 83, 313, 152, 148, 377]` (py-feat's anatomical `mentalis` seed set — most repos found use only the single point `152` for chin; this is a Voronoi seed set, not a pre-ordered boundary loop, so `packages/domain` angle-sorts it around its centroid before filling)

**Known false lead, do not use:** `234`/`454` are called "cheek" by one lineage of repos, but they're single face-oval/jaw-hinge points, not the fleshy mid-cheek surface — one repo even swaps which side is which. The `116–121`/`345–350` clusters above are correct.

**Known ceilings, not re-litigated by `packages/domain`'s implementation, upgrade only if ticket 09's native adapter verification or real fixture testing (ticket 08) surfaces a problem:**
- Eyebrow exclusion implemented as a padded bounding box around the open arc, not a true polygon — no official brow-outline exists to build one from.
- Nose/cheek boundary (`48/64` left, `278/294` right ala) and forehead/eyebrow boundary sit immediately adjacent between zone and exclusion sets — expected (cheek's outer edge is the face silhouette; forehead's lower edge abuts the brow line), not a bug.
- Chin's angle-sorted seed hull is the least-evidenced zone boundary of the five.

Full agent research trace (source repos per index, disagreements found and how each was resolved): this session's transcript, 2026-09-11/12.

One-time override: resolved by Claude directly (not agy) per Dinh's explicit in-session choice, because it blocked `packages/domain`'s zone-polygon work in `skin-diary-v1` ticket 02 and agy hadn't claimed it — see `map.md` Notes' existing ticket-01 precedent, now extended to this ticket too.

## Audit 2026-10-17

- Status: done
- Evidence: Index map implemented in packages/domain/src/zones.ts with zones.test.ts (commit 1d5d42c).
