import { describe, expect, it } from "vitest";
import { srgbToLab } from "./color";

describe("srgbToLab", () => {
  it("maps white to L*=100, a*=b*=0", () => {
    const { L, a, b } = srgbToLab(255, 255, 255);
    expect(L).toBeCloseTo(100, 1);
    expect(a).toBeCloseTo(0, 1);
    expect(b).toBeCloseTo(0, 1);
  });

  it("maps black to L*=a*=b*=0", () => {
    const { L, a, b } = srgbToLab(0, 0, 0);
    expect(L).toBeCloseTo(0, 1);
    expect(a).toBeCloseTo(0, 1);
    expect(b).toBeCloseTo(0, 1);
  });

  it("maps pure red to the standard sRGB red Lab reference (~53.24, 80.09, 67.20)", () => {
    const { L, a, b } = srgbToLab(255, 0, 0);
    expect(L).toBeCloseTo(53.24, 1);
    expect(a).toBeCloseTo(80.09, 1);
    expect(b).toBeCloseTo(67.2, 1);
  });

  it("maps neutral gray to a* near zero", () => {
    const { a } = srgbToLab(128, 128, 128);
    expect(a).toBeCloseTo(0, 1);
  });
});
