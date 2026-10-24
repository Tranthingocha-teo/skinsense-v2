import { describe, expect, it } from "vitest";
import { partitionSkinPixels, readZones, type FaceCapture } from "./capture";
import { ZONE_INDICES, type Landmark } from "./zones";

// 8x8 image; the left-cheek zone is a circle around (0.25, 0.5) and every pixel
// inside it is red, the rest of the skin is flat. Other zones' landmarks sit far
// outside the frame, so they collect nothing.
const width = 8;
const height = 8;
const flat = [200, 150, 130, 255];
const red = [220, 110, 100, 255];

function makeLandmarks(): Landmark[] {
  const far = { x: -100, y: -100, z: 0 };
  const landmarks = Array.from({ length: 468 }, () => far);
  ZONE_INDICES.leftCheek.forEach((index, i, all) => {
    const angle = (2 * Math.PI * i) / all.length;
    landmarks[index] = { x: 0.25 + 0.2 * Math.cos(angle), y: 0.5 + 0.2 * Math.sin(angle), z: 0 };
  });
  return landmarks;
}

function inCheek(x: number, y: number) {
  return Math.hypot((x + 0.5) / width - 0.25, (y + 0.5) / height - 0.5) < 0.25;
}

const rgba = new Uint8ClampedArray(width * height * 4);
const skinMask = new Uint8Array(width * height).fill(1);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    rgba.set(inCheek(x, y) ? red : flat, (y * width + x) * 4);
  }
}
skinMask[0] = 0; // one background pixel, top-left

const capture: FaceCapture = { width, height, landmarks: makeLandmarks(), skinMask };

describe("partitionSkinPixels", () => {
  it("keeps masked-out pixels out of the reference and assigns zone pixels through the domain's own zone logic", () => {
    const { allSkinPixels, zonePixels } = partitionSkinPixels(capture, rgba);

    expect(allSkinPixels).toHaveLength(width * height - 1);
    expect(zonePixels.leftCheek.length).toBeGreaterThan(0);
    expect(zonePixels.leftCheek.every((p) => p.r === 220)).toBe(true);
    expect(zonePixels.forehead).toHaveLength(0);
  });

  it("without a mask, only pixels inside a zone count as skin", () => {
    const { allSkinPixels, zonePixels } = partitionSkinPixels({ ...capture, skinMask: undefined }, rgba);

    expect(allSkinPixels).toHaveLength(zonePixels.leftCheek.length);
  });
});

describe("readZones", () => {
  it("reads the red cheek as redder than the reference and empty zones as pixelCount 0", () => {
    const readings = readZones(partitionSkinPixels(capture, rgba));

    expect(readings.leftCheek.redness).toBeGreaterThan(0);
    expect(readings.leftCheek.pixelCount).toBeGreaterThan(0);
    expect(readings.nose).toEqual({ redness: 0, unevenness: 0, pixelCount: 0 });
  });
});
