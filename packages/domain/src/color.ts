// sRGB -> linear -> XYZ (D65) -> CIELAB, per docs/research/redness-index.md.

const D65 = { x: 0.95047, y: 1, z: 1.08883 };

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function labF(t: number): number {
  const delta = 6 / 29;
  return t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29;
}

export function srgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl;
  const z = 0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl;

  const fx = labF(x / D65.x);
  const fy = labF(y / D65.y);
  const fz = labF(z / D65.z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}
