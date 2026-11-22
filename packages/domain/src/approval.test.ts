import { describe, expect, it } from "vitest";
import {
  canShopSignIn,
  filterProductsByShop,
  getProductApprovalBadge,
  isProductVisibleToBuyer,
  sanitizeDoctorApprovalInput,
  validateDoctorApprovalInput,
  validateShopApprovalInput,
} from "./approval";

describe("approval domain helpers", () => {
  it("validates doctor CCHN approval fields strictly", () => {
    expect(validateDoctorApprovalInput({ fullName: "A" }).isValid).toBe(false);
    const valid = validateDoctorApprovalInput({
      fullName: "ThS. BS Nguyễn Văn A",
      licenseId: "CCHN-009911",
      hospital: "BV Da Liễu Trung Ương",
      email: "bs.nguyena@gmail.com",
      phoneNumber: "0912345678",
    });
    expect(valid.isValid).toBe(true);
    expect(
      sanitizeDoctorApprovalInput({
        fullName: "  BS. A ",
        licenseId: " CCHN-123 ",
        hospital: " BV Da Liễu ",
        email: " BS@Gmail.COM ",
        phoneNumber: "0912 345-678",
      }).email,
    ).toBe("bs@gmail.com");
  });

  it("validates shop approval inputs and canShopSignIn gates pending/rejected stores", () => {
    expect(
      validateShopApprovalInput({
        shopName: "La Roche Flagship",
        ownerName: "Nguyễn Mai",
        license: "GPKD-12345",
        category: "Dược mỹ phẩm",
        address: "123 Nguyễn Huệ, TP.HCM",
        email: "shop@test.vn",
      }).isValid,
    ).toBe(true);

    expect(canShopSignIn({ role: "shop", status: "pending", email: "s@test.vn" }).allowed).toBe(false);
    expect(canShopSignIn({ role: "shop", status: "active", email: "s@test.vn" }).allowed).toBe(true);
    expect(canShopSignIn({ role: "customer", status: "active", email: "hattn.23itb@vku.udn.vn" }).allowed).toBe(true);
  });

  it("filters buyer-visible products and maps approval badges", () => {
    expect(isProductVisibleToBuyer("approved")).toBe(true);
    expect(isProductVisibleToBuyer("pending")).toBe(false);
    expect(getProductApprovalBadge("pending").label).toBe("Chờ Admin duyệt");
    const items = [{ shopName: "La Roche-Posay Official Store" }, { shopName: "Innisfree Hub" }];
    expect(filterProductsByShop(items, "La Roche-Posay").length).toBe(1);
  });
});
