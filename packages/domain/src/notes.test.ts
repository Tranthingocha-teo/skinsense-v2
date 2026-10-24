import { describe, expect, it } from "vitest";
import { filterHistory, historyTags, NOTE_MAX, noteError, TAG_MAX, tagError } from "./notes";

describe("noteError", () => {
  it("accepts an empty Note (clears it) and a written one", () => {
    expect(noteError("")).toBeNull();
    expect(noteError("Slept late, skin a bit dry after washing.")).toBeNull();
  });

  it("accepts exactly 500 trimmed characters and rejects 501", () => {
    expect(NOTE_MAX).toBe(500);
    expect(noteError(`  ${"a".repeat(500)}\n`)).toBeNull();
    expect(noteError("a".repeat(501))).toBe("tooLong");
  });
});

describe("tagError", () => {
  it("accepts a new label", () => {
    expect(tagError("Thiếu ngủ", ["Serum mới"])).toBeNull();
  });

  it("rejects an empty or whitespace-only label", () => {
    expect(tagError("", [])).toBe("empty");
    expect(tagError("   ", [])).toBe("empty");
  });

  it("accepts exactly 24 trimmed characters and rejects 25", () => {
    expect(TAG_MAX).toBe(24);
    expect(tagError(` ${"a".repeat(24)} `, [])).toBeNull();
    expect(tagError("a".repeat(25), [])).toBe("tooLong");
  });

  it("rejects a label the Photo already has, ignoring case and surrounding spaces", () => {
    expect(tagError("  thiếu NGỦ ", ["Serum mới", "Thiếu ngủ"])).toBe("duplicate");
  });
});

const photos = [
  { id: "p3", note: null, tags: ["Serum mới"] },
  { id: "p2", note: "Slept late", tags: [] },
  { id: "p1", note: null, tags: ["Thiếu ngủ", "serum mới"] },
];

describe("historyTags", () => {
  it("lists each Tag once in order of first appearance, case-insensitively, keeping the first spelling", () => {
    expect(historyTags(photos)).toEqual(["Serum mới", "Thiếu ngủ"]);
  });

  it("is empty when no Photo has Tags", () => {
    expect(historyTags([{ tags: [] }])).toEqual([]);
  });
});

describe("filterHistory", () => {
  it("keeps every Photo for all", () => {
    expect(filterHistory(photos, "all").map((p) => p.id)).toEqual(["p3", "p2", "p1"]);
  });

  it("keeps Photos with the Tag, case-insensitively", () => {
    expect(filterHistory(photos, { tag: "Serum mới" }).map((p) => p.id)).toEqual(["p3", "p1"]);
  });

  it("keeps Photos that have a Note", () => {
    expect(filterHistory(photos, "note").map((p) => p.id)).toEqual(["p2"]);
  });
});
