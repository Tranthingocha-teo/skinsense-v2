import { describe, expect, it } from "vitest";
import { sceneAt } from "./stage-scenes";

describe("stage scenes", () => {
  it("splits the track progress into three scenes, the last one holding to the end", () => {
    expect(sceneAt(0)).toBe(0);
    expect(sceneAt(0.33)).toBe(0);
    expect(sceneAt(1 / 3)).toBe(1);
    expect(sceneAt(0.66)).toBe(1);
    expect(sceneAt(2 / 3)).toBe(2);
    expect(sceneAt(1)).toBe(2);
  });
});
