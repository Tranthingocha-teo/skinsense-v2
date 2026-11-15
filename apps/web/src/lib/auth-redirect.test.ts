import { describe, expect, it } from "vitest";
import { authErrorUrl, safeNextPath, strayOAuthCodeRedirect } from "./auth-redirect";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/app/routine")).toBe("/app/routine");
    expect(safeNextPath("/shop?tab=orders")).toBe("/shop?tab=orders");
  });

  it("refuses anything that could leave the site", () => {
    for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, undefined]) {
      expect(safeNextPath(next)).toBeNull();
    }
  });
});

describe("strayOAuthCodeRedirect", () => {
  it("forwards a code that landed on the home page to /auth/callback, keeping its params", () => {
    const to = strayOAuthCodeRedirect(new URL("https://site.test/?code=abc&next=%2Fapp"));
    expect(to?.toString()).toBe("https://site.test/auth/callback?code=abc&next=%2Fapp");
  });

  it("leaves other URLs alone", () => {
    expect(strayOAuthCodeRedirect(new URL("https://site.test/"))).toBeNull();
    expect(strayOAuthCodeRedirect(new URL("https://site.test/app?code=abc"))).toBeNull();
  });
});

describe("authErrorUrl", () => {
  it("points at the landing with a bounded reason", () => {
    const url = authErrorUrl("https://site.test", "x".repeat(300));
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("auth_error")).toHaveLength(120);
  });
});
