import { boundingBox, type BoundingBox } from "./geometry";
import type { Landmark } from "./zones";

export type CaptureIssue = "noFace" | "dark" | "bright" | "far" | "close" | "offCenter" | "turned" | "blurry";
export type Framing = { faceWidth: number; centerOffset: number; yaw: number };

// Cut-offs rated by Dinh on 2026-09-13 (ticket 07's rating pass: two base photos
// × 18 graded ffmpeg degradations + 13 Pexels portraits; table in the ticket).
// Re-rate with `bun run --cwd mpbench rate <photos...>` before moving any of them.
export const QUALITY = {
  minBrightness: 50, // mean Rec.601 luma of skin pixels, 0..255; well-lit dark skin measured 77–78
  maxBrightness: 200,
  minFaceWidth: 0.35, // landmark bounding-box width / frame width
  maxFaceWidth: 0.8,
  maxCenterOffset: 0.12, // bounding-box centre to frame centre, frame-normalised
  maxYaw: 0.35, // |L − R| / (L + R) of nose-tip→cheek-edge distances ≈ sin(turn), 0.35 ≈ 20°
  minSharpness: 100, // sharpness(): Laplacian variance / mean luma² x1e4 over the face box resampled to 96px wide; σ3 blur ≈ 72, sharp ≥ 330
};

const NOSE_TIP = 1;
const LEFT_FACE_EDGE = 234;
const RIGHT_FACE_EDGE = 454;

function luma(rgba: ArrayLike<number>, i: number) {
  return 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
}

export function meanLuma(rgba: ArrayLike<number>, mask?: Uint8Array): number {
  let sum = 0;
  let count = 0;
  for (let idx = 0; idx * 4 < rgba.length; idx++) {
    if (mask && mask[idx] !== 1) continue;
    sum += luma(rgba, idx * 4);
    count++;
  }
  return count === 0 ? 0 : sum / count;
}

export function faceFraming(landmarks: Landmark[]): Framing {
  const { minX, maxX, minY, maxY } = boundingBox(landmarks);
  const nose = landmarks[NOSE_TIP];
  const left = nose.x - landmarks[LEFT_FACE_EDGE].x;
  const right = landmarks[RIGHT_FACE_EDGE].x - nose.x;
  return {
    faceWidth: maxX - minX,
    centerOffset: Math.hypot((minX + maxX) / 2 - 0.5, (minY + maxY) / 2 - 0.5),
    yaw: left + right === 0 ? 1 : Math.abs(left - right) / (left + right),
  };
}

const SHARPNESS_SAMPLE_WIDTH = 96;

// Focus measure: variance of a 3x3 Laplacian over gray pixels of the face box,
// resampled to a fixed width so a small face and a large one score alike, and
// divided by the squared mean luma so a darker exposure of the same scene scores
// the same (the raw variance falls with contrast²); scaled x1e4.
// ponytail: nearest-neighbour resampling, never upsampling; box-average it if
// the rated set shows aliasing noise.
export function sharpness(rgba: ArrayLike<number>, width: number, height: number, box?: BoundingBox): number {
  const b = box ?? { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  const boxW = (b.maxX - b.minX) * width;
  const boxH = (b.maxY - b.minY) * height;
  if (boxW < 3 || boxH < 3) return 0;
  const w = Math.min(SHARPNESS_SAMPLE_WIDTH, Math.round(boxW));
  const h = Math.max(3, Math.round((w * boxH) / boxW));
  const gray = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    // Landmarks can sit outside the frame when the face is cut off: clamp both ends.
    const sy = Math.min(height - 1, Math.max(0, Math.floor(b.minY * height + ((y + 0.5) * boxH) / h)));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(width - 1, Math.max(0, Math.floor(b.minX * width + ((x + 0.5) * boxW) / w)));
      gray[y * w + x] = luma(rgba, (sy * width + sx) * 4);
    }
  }
  let sum = 0;
  let sumSq = 0;
  let lumaSum = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      sum += v;
      sumSq += v * v;
      lumaSum += gray[i];
      n++;
    }
  }
  if (n === 0 || lumaSum === 0) return 0;
  const mean = sum / n;
  const meanLuma = lumaSum / n;
  return ((sumSq / n - mean * mean) / (meanLuma * meanLuma)) * 1e4;
}

export function captureIssues(input: {
  brightness: number;
  framing: Framing | null;
  sharpness?: number;
}): CaptureIssue[] {
  const issues: CaptureIssue[] = [];
  if (input.brightness < QUALITY.minBrightness) issues.push("dark");
  if (input.brightness > QUALITY.maxBrightness) issues.push("bright");
  if (!input.framing) return ["noFace", ...issues];
  if (input.framing.faceWidth < QUALITY.minFaceWidth) issues.push("far");
  if (input.framing.faceWidth > QUALITY.maxFaceWidth) issues.push("close");
  if (input.framing.centerOffset > QUALITY.maxCenterOffset) issues.push("offCenter");
  if (input.framing.yaw > QUALITY.maxYaw) issues.push("turned");
  if (input.sharpness !== undefined && input.sharpness < QUALITY.minSharpness) issues.push("blurry");
  return issues;
}
