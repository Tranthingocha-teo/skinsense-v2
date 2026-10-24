import { describe, expect, it } from "vitest";
import {
  captureIssues,
  faceFraming,
  sharpness,
  meanLuma,
  QUALITY,
  type Framing,
} from "./capture-quality";
import type { Landmark } from "./zones";

// A face is a box of landmarks; the three framing indices (nose tip, cheek
// edges) are placed explicitly so yaw is controllable.
function boxFace(cx: number, cy: number, halfWidth: number, noseShift = 0): Landmark[] {
  const landmarks: Landmark[] = Array.from({ length: 468 }, (_, i) => ({
    x: cx + (i % 2 ? halfWidth : -halfWidth),
    y: cy + (i % 4 < 2 ? halfWidth * 1.3 : -halfWidth * 1.3),
    z: 0,
  }));
  landmarks[234] = { x: cx - halfWidth, y: cy, z: 0 };
  landmarks[454] = { x: cx + halfWidth, y: cy, z: 0 };
  landmarks[1] = { x: cx + noseShift, y: cy, z: 0 };
  return landmarks;
}

const goodFraming: Framing = { faceWidth: 0.5, centerOffset: 0, yaw: 0 };

describe("meanLuma", () => {
  it("averages Rec.601 luma over masked pixels only", () => {
    const rgba = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    expect(meanLuma(rgba, new Uint8Array([1, 0]))).toBeCloseTo(255, 0);
    expect(meanLuma(rgba)).toBeCloseTo(127.5, 0);
  });
});

describe("faceFraming", () => {
  it("measures width fraction, centre offset and yaw from landmarks", () => {
    expect(faceFraming(boxFace(0.5, 0.5, 0.25))).toEqual({ faceWidth: 0.5, centerOffset: 0, yaw: 0 });
    expect(faceFraming(boxFace(0.7, 0.5, 0.25)).centerOffset).toBeCloseTo(0.2);
    expect(faceFraming(boxFace(0.5, 0.5, 0.25, 0.1)).yaw).toBeCloseTo(0.4); // (0.35 − 0.15) / 0.5
    expect(faceFraming(boxFace(0.5, 0.5, 0.25, -0.1)).yaw).toBeCloseTo(0.4); // symmetric
  });
});

describe("sharpness", () => {
  function checker(high: number) {
    const rgba = new Uint8ClampedArray(16 * 4);
    for (let i = 0; i < 16; i++) rgba.fill(((i + Math.floor(i / 4)) % 2) * high, i * 4, i * 4 + 3);
    return rgba;
  }
  it("is zero on a flat image and positive on a checkerboard", () => {
    expect(sharpness(new Uint8ClampedArray(16 * 4).fill(120), 4, 4)).toBe(0);
    expect(sharpness(checker(255), 4, 4)).toBeGreaterThan(QUALITY.minSharpness);
  });
  it("does not change when the same scene is exposed darker", () => {
    expect(sharpness(checker(60), 4, 4)).toBeCloseTo(sharpness(checker(240), 4, 4), 5);
  });
  it("scores a small face like a large one", () => {
    // Same checker pattern at two scales (both ≥ the 96px sample width, so both
    // are resampled to it): the score must not depend on the face's pixel size.
    const checker = (size: number, block: number) => {
      const rgba = new Uint8ClampedArray(size * size * 4);
      for (let i = 0; i < size * size; i++) {
        const on = (Math.floor((i % size) / block) + Math.floor(i / size / block)) % 2;
        rgba.fill(on * 200, i * 4, i * 4 + 3);
      }
      return rgba;
    };
    expect(sharpness(checker(192, 24), 192, 192)).toBeCloseTo(sharpness(checker(96, 12), 96, 96), 5);
  });
  it("stays finite when the box spills outside the frame", () => {
    const rgba = new Uint8ClampedArray(8 * 8 * 4).fill(120);
    expect(Number.isFinite(sharpness(rgba, 8, 8, { minX: -0.3, maxX: 0.6, minY: -0.2, maxY: 1.2 }))).toBe(true);
  });
  it("measures only inside the box", () => {
    const rgba = new Uint8ClampedArray(8 * 8 * 4).fill(120);
    for (let i = 0; i < 8 * 8; i++) if (i % 8 >= 4) rgba.fill((i % 2) * 255, i * 4, i * 4 + 3); // right half textured
    expect(sharpness(rgba, 8, 8, { minX: 0, maxX: 0.45, minY: 0, maxY: 1 })).toBe(0);
    expect(sharpness(rgba, 8, 8, { minX: 0.5, maxX: 1, minY: 0, maxY: 1 })).toBeGreaterThan(0);
  });
});

describe("captureIssues", () => {
  it("is empty for a well-lit, centred, frontal, sharp capture", () => {
    expect(captureIssues({ brightness: 130, framing: goodFraming, sharpness: 500 })).toEqual([]);
  });

  it("names each signal that is out of range", () => {
    expect(captureIssues({ brightness: QUALITY.minBrightness - 1, framing: goodFraming })).toEqual(["dark"]);
    expect(captureIssues({ brightness: QUALITY.maxBrightness + 1, framing: goodFraming })).toEqual(["bright"]);
    expect(captureIssues({ brightness: 130, framing: { ...goodFraming, faceWidth: 0.2 } })).toEqual(["far"]);
    expect(captureIssues({ brightness: 130, framing: { ...goodFraming, faceWidth: 0.9 } })).toEqual(["close"]);
    expect(captureIssues({ brightness: 130, framing: { ...goodFraming, centerOffset: 0.3 } })).toEqual(["offCenter"]);
    expect(captureIssues({ brightness: 130, framing: { ...goodFraming, yaw: 0.6 } })).toEqual(["turned"]);
    expect(captureIssues({ brightness: 130, framing: goodFraming, sharpness: 1 })).toEqual(["blurry"]);
  });

  it("reports no face as its own issue", () => {
    expect(captureIssues({ brightness: 130, framing: null })).toEqual(["noFace"]);
  });
});
