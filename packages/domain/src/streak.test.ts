import { describe, expect, it } from "vitest";
import { streak } from "./streak";
import { localDay } from "./trend";

describe("streak", () => {
  it("counts consecutive days ending today", () => {
    expect(streak(new Set(["2026-09-12", "2026-09-13", "2026-09-14"]), "2026-09-14")).toBe(3);
  });

  it("ends yesterday when today has no record yet", () => {
    expect(streak(new Set(["2026-09-12", "2026-09-13"]), "2026-09-14")).toBe(2);
  });

  it("stops at the first gap", () => {
    expect(streak(new Set(["2026-09-10", "2026-09-12", "2026-09-13", "2026-09-14"]), "2026-09-14")).toBe(3);
  });

  it("is 0 for an empty set or when neither today nor yesterday has a record", () => {
    expect(streak(new Set(), "2026-09-14")).toBe(0);
    expect(streak(new Set(["2026-09-10", "2026-09-11"]), "2026-09-14")).toBe(0);
  });

  it("crosses a month boundary", () => {
    expect(streak(new Set(["2026-08-31", "2026-09-01"]), "2026-09-01")).toBe(2);
  });

  it("counts local days, so a late-night and an after-midnight record are two nights", () => {
    const days = new Set([localDay(new Date(2026, 8, 13, 23, 30)), localDay(new Date(2026, 8, 14, 0, 15))]);
    expect(streak(days, localDay(new Date(2026, 8, 14, 21, 0)))).toBe(2);
  });
});
