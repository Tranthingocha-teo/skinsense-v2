// Pure story math for the "Cách hoạt động" particle face: no three.js, unit-tested.
// Progress p in [0, 1] follows the section through the viewport (progressFor):
// 0–0.5 the scatter assembles into the face, 0.5–1 the five zones split apart.
import { ZONE_INDICES, ZONES } from "@skinsense/domain";
import { FACE_MESH } from "./face-mesh";

export const COUNT = FACE_MESH.length / 3;

// mulberry32: deterministic so server, client and tests agree.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(468);
const STAGGER = Float32Array.from({ length: COUNT }, () => rand());

export const SCATTER = new Float32Array(COUNT * 3);
for (let i = 0; i < COUNT; i++) {
  const r = 1.4 + rand() * 0.6;
  const theta = rand() * Math.PI * 2;
  const phi = Math.acos(2 * rand() - 1);
  SCATTER[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  SCATTER[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  SCATTER[i * 3 + 2] = r * Math.cos(phi);
}

// Zone index (ZONES order) per landmark, -1 outside the five skin zones.
export const ZONE_OF = new Int8Array(COUNT).fill(-1);
ZONES.forEach((zone, k) => {
  for (const i of ZONE_INDICES[zone]) ZONE_OF[i] = k;
});

// Where each zone drifts when the face splits: away from the face centre,
// the nose toward the viewer. Cheek sides come from the mesh, not the zone name.
const SPLIT = 0.3;
const cheekSide = (zone: keyof typeof ZONE_INDICES) => Math.sign(ZONE_INDICES[zone].reduce((sum, i) => sum + FACE_MESH[i * 3], 0));
export const ZONE_OFFSET: [number, number, number][] = ZONES.map((zone) => {
  if (zone === "forehead") return [0, SPLIT, 0];
  if (zone === "chin") return [0, -SPLIT, 0];
  if (zone === "nose") return [0, 0, SPLIT];
  return [cheekSide(zone) * SPLIT, 0, 0];
});

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (v: number) => v * v * (3 - 2 * v);

const assembleAt = (i: number, p: number) => ease(clamp01((p * 2 - STAGGER[i] * 0.3) / 0.7));
const splitAt = (p: number) => ease(clamp01((p - 0.5) * 2));

export function positionAt(i: number, p: number, out: number[]) {
  const assemble = assembleAt(i, p);
  const split = ZONE_OF[i] < 0 ? 0 : splitAt(p);
  for (let k = 0; k < 3; k++) {
    const j = i * 3 + k;
    out[k] = SCATTER[j] + (FACE_MESH[j] - SCATTER[j]) * assemble + (split && ZONE_OFFSET[ZONE_OF[i]][k] * split);
  }
  return out;
}

// Point size factor: points outside the zones dim to 0.3 as the zones split.
export const presenceAt = (i: number, p: number) => (ZONE_OF[i] < 0 ? 1 - 0.7 * splitAt(p) : 1);

// 0 when the box's top enters at the viewport bottom, 1 once the box is centred, clamped.
export const progressFor = (top: number, height: number, viewportHeight: number) =>
  clamp01((viewportHeight - top) / (viewportHeight / 2 + height / 2));
