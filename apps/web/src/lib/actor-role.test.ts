import { describe, expect, it } from "vitest";
import { authzClaims, resolveActorRole, SUPER_ADMIN_EMAIL } from "./actor-role";

describe("resolveActorRole", () => {
  it("makes the super admin email an admin", () => {
    expect(resolveActorRole(SUPER_ADMIN_EMAIL, {})).toBe("admin");
  });

  it("trusts only app_metadata, which users cannot write", () => {
    expect(resolveActorRole("a@x.vn", { role: "admin" })).toBe("admin");
    expect(resolveActorRole("a@x.vn", { role: "specialist", status: "active" })).toBe("specialist");
    expect(resolveActorRole("a@x.vn", { role: "shop", status: "active" })).toBe("shop");
  });

  it("treats a missing app_metadata role as customer, whatever user_metadata says", () => {
    expect(resolveActorRole("a@x.vn", undefined)).toBe("customer");
    expect(resolveActorRole("a@x.vn", {})).toBe("customer");
  });

  it("does not grant shop or specialist rights before approval", () => {
    for (const status of ["pending", "rejected", "locked", undefined]) {
      expect(resolveActorRole("a@x.vn", { role: "specialist", status })).toBe("customer");
      expect(resolveActorRole("a@x.vn", { role: "shop", status })).toBe("customer");
    }
  });

  it("ignores unknown roles", () => {
    expect(resolveActorRole("a@x.vn", { role: "root", status: "active" })).toBe("customer");
  });
});

describe("authzClaims", () => {
  it("builds the app_metadata patch for a role and status", () => {
    expect(authzClaims("specialist", "pending")).toEqual({ role: "specialist", status: "pending" });
    expect(authzClaims("customer")).toEqual({ role: "customer", status: "active" });
  });

  it("never lets a non-admin path mint an admin", () => {
    expect(() => authzClaims("admin" as never, "active")).toThrow();
  });
});
