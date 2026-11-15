import { describe, it, expect } from "vitest";
import {
  canShopSignIn,
  canShopPostProduct,
  isProductVisibleToBuyer,
  getProductApprovalBadge,
} from "./shop-product-approval";

describe("Shop Approval Enforcement (canShopSignIn & canShopPostProduct)", () => {
  it("blocks unauthenticated users from signing into shop portal", () => {
    const res = canShopSignIn(null);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Vui lòng đăng nhập");
  });

  it("blocks non-shop customer roles from accessing shop functions", () => {
    const res = canShopSignIn({ role: "customer", status: "active" });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("không phải là tài khoản Gian hàng");
  });

  it("blocks pending shops with explicit waiting message", () => {
    const res = canShopSignIn({
      role: "shop",
      status: "pending",
      email: "shop.test@skinsense.vn",
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("đang chờ Super Admin (Trần Thị Ngọc Hà) xét duyệt");
    expect(canShopPostProduct({ role: "shop", status: "pending" })).toBe(false);
  });

  it("blocks rejected or suspended shops with contact info", () => {
    const rejectedRes = canShopSignIn({ role: "shop", status: "rejected" });
    expect(rejectedRes.allowed).toBe(false);
    expect(rejectedRes.reason).toContain("đã bị từ chối phê duyệt");

    const suspendedRes = canShopSignIn({ role: "shop", status: "suspended" });
    expect(suspendedRes.allowed).toBe(false);
    expect(suspendedRes.reason).toContain("tạm khóa");
  });

  it("allows active / approved shops to sign in and post products", () => {
    const activeRes = canShopSignIn({ role: "shop", status: "active" });
    expect(activeRes.allowed).toBe(true);
    expect(canShopPostProduct({ role: "shop", status: "active" })).toBe(true);

    const approvedRes = canShopSignIn({ role: "shop", status: "approved" });
    expect(approvedRes.allowed).toBe(true);
  });

  it("always allows Super Admin to access and manage shop features", () => {
    const adminRes = canShopSignIn({
      role: "admin",
      status: "active",
      email: "hattn.23itb@vku.udn.vn",
    });
    expect(adminRes.allowed).toBe(true);
    expect(canShopPostProduct({ role: "admin", status: "active" })).toBe(true);
  });
});

describe("Product Approval Visibility Enforcement (isProductVisibleToBuyer)", () => {
  it("only allows approved or active products to be visible on buyer storefront", () => {
    expect(isProductVisibleToBuyer("approved")).toBe(true);
    expect(isProductVisibleToBuyer("active")).toBe(true);
  });

  it("strictly hides pending products from buyers until approved by admin", () => {
    expect(isProductVisibleToBuyer("pending")).toBe(false);
  });

  it("strictly hides rejected and hidden products from buyers", () => {
    expect(isProductVisibleToBuyer("rejected")).toBe(false);
    expect(isProductVisibleToBuyer("hidden")).toBe(false);
  });
});

describe("Product Approval Badge Helper (getProductApprovalBadge)", () => {
  it("provides correct badge for pending products", () => {
    const badge = getProductApprovalBadge("pending");
    expect(badge.label).toBe("Chờ Admin duyệt");
    expect(badge.variant).toBe("pending");
  });

  it("provides correct badge for approved/active products", () => {
    const badge = getProductApprovalBadge("approved");
    expect(badge.label).toBe("Đang bán trên sàn");
    expect(badge.variant).toBe("approved");

    const badgeActive = getProductApprovalBadge("active");
    expect(badgeActive.label).toBe("Đang bán trên sàn");
    expect(badgeActive.variant).toBe("approved");
  });

  it("provides correct badge for rejected products", () => {
    const badge = getProductApprovalBadge("rejected");
    expect(badge.label).toBe("Bị từ chối");
    expect(badge.variant).toBe("rejected");
  });
});
