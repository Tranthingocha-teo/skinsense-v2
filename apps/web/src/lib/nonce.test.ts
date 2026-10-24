import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { generateNonce } from "./nonce";

describe("generateNonce", () => {
  it("returns a fresh raw nonce and its SHA-256 hex digest", async () => {
    const a = await generateNonce();
    const b = await generateNonce();
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.hashedNonce).toBe(createHash("sha256").update(a.nonce).digest("hex"));
  });
});
