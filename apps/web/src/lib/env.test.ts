import { afterEach, describe, expect, it, vi } from "vitest";
import { googleWebClientId, requireEnv, supabaseEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("requireEnv", () => {
  it("returns a set value", () => {
    expect(requireEnv("X", "abc")).toBe("abc");
  });

  it("names the variable when it is missing or empty", () => {
    expect(() => requireEnv("NEXT_PUBLIC_SUPABASE_URL", undefined)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => requireEnv("NEXT_PUBLIC_SUPABASE_URL", "")).toThrow(/\.env\.example/);
  });
});

describe("supabaseEnv", () => {
  it("throws naming the first missing variable", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "k");
    expect(() => supabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => supabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("returns both values when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "k");
    expect(supabaseEnv()).toEqual({ url: "https://x.supabase.co", anonKey: "k" });
  });
});

describe("googleWebClientId", () => {
  it("names the variable when missing", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID", "");
    expect(() => googleWebClientId()).toThrow(/NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID/);
  });
});
