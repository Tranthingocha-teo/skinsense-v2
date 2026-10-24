import { describe, expect, it } from "vitest";
import { isDuplicateRoutineLabel, routineCompletionPercent } from "./routine";

describe("isDuplicateRoutineLabel", () => {
  const items = [
    { id: "a", label: "Cleanser" },
    { id: "b", label: "Moisturizer" },
  ];

  it("is true when another RoutineItem already has the label", () => {
    expect(isDuplicateRoutineLabel(items, "Moisturizer")).toBe(true);
  });

  it("is false for a new label", () => {
    expect(isDuplicateRoutineLabel(items, "Sunscreen")).toBe(false);
  });

  it("ignores the RoutineItem being renamed", () => {
    expect(isDuplicateRoutineLabel(items, "Cleanser", "a")).toBe(false);
    expect(isDuplicateRoutineLabel(items, "Cleanser", "b")).toBe(true);
  });
});

describe("routineCompletionPercent", () => {
  it("is 100 when every item was completed", () => {
    expect(routineCompletionPercent(3, 3)).toBe(100);
  });

  it("is 0 when nothing was completed", () => {
    expect(routineCompletionPercent(0, 4)).toBe(0);
  });

  it("rounds to the nearest whole percent", () => {
    expect(routineCompletionPercent(1, 3)).toBe(33);
  });

  it("is 0 when there are no items to complete", () => {
    expect(routineCompletionPercent(0, 0)).toBe(0);
  });

  it("clamps to 100 when completedCount exceeds totalCount", () => {
    expect(routineCompletionPercent(5, 3)).toBe(100);
  });

  it("clamps to 0 for a negative completedCount", () => {
    expect(routineCompletionPercent(-1, 3)).toBe(0);
  });
});
