import { describe, expect, it } from "vitest";
import { FEEDBACK_MESSAGE_MAX, feedbackMessageError } from "./feedback";

describe("feedbackMessageError", () => {
  it("accepts a written message", () => {
    expect(feedbackMessageError("The trends chart is blank on Sunday")).toBeNull();
  });

  it("rejects an empty or whitespace-only message", () => {
    expect(feedbackMessageError("")).toBe("empty");
    expect(feedbackMessageError("  \n\t ")).toBe("empty");
  });

  it("accepts exactly 2000 characters and rejects 2001", () => {
    expect(FEEDBACK_MESSAGE_MAX).toBe(2000);
    expect(feedbackMessageError("a".repeat(2000))).toBeNull();
    expect(feedbackMessageError("a".repeat(2001))).toBe("tooLong");
  });

  it("measures the trimmed message", () => {
    expect(feedbackMessageError(`  ${"a".repeat(2000)}  `)).toBeNull();
  });
});
