import { describe, expect, it } from "vitest";
import {
  validateShopApprovalInput,
  sanitizeShopApprovalInput,
  type ShopApprovalInput,
} from "./shop-approval-validation";

describe("Shop Approval Validation", () => {
  const validPayload: ShopApprovalInput = {
    shopName: "La Roche-Posay VN Flagship",
    ownerName: "Trần Quốc Tuấn",
    license: "GPKD-882910-HCM",
    category: "Dược mỹ phẩm trị mụn & phục hồi",
    address: "Quận 1, TP. Hồ Chí Minh",
    email: "shop.laroche@skinsense.vn",
    password: "securePassword123@",
    phoneNumber: "0905123456",
  };

  it("validates successfully with correct payload", () => {
    const result = validateShopApprovalInput(validPayload);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("fails if shopName is missing or too short", () => {
    const result = validateShopApprovalInput({ ...validPayload, shopName: " " });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Tên Gian hàng");
  });

  it("fails if ownerName is missing", () => {
    const result = validateShopApprovalInput({ ...validPayload, ownerName: "" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Họ và tên Chủ sở hữu");
  });

  it("fails if license is missing or too short", () => {
    const result = validateShopApprovalInput({ ...validPayload, license: "1" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Mã số thuế hoặc Số ĐKKD");
  });

  it("fails if address is missing", () => {
    const result = validateShopApprovalInput({ ...validPayload, address: "" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Địa chỉ gian hàng");
  });

  it("fails if email is invalid", () => {
    const result = validateShopApprovalInput({ ...validPayload, email: "invalid-email" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Email");
  });

  it("fails if password is shorter than 6 characters", () => {
    const result = validateShopApprovalInput({ ...validPayload, password: "123" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("6 ký tự");
  });

  it("fails if phoneNumber is invalid", () => {
    const result = validateShopApprovalInput({ ...validPayload, phoneNumber: "123" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Số điện thoại");
  });

  it("sanitizes input properly", () => {
    const sanitized = sanitizeShopApprovalInput({
      shopName: "  Innisfree Vietnam  ",
      ownerName: "  Lê Thu Thảo  ",
      license: "  MST-991204-HN  ",
      category: "  Mỹ phẩm thiên nhiên  ",
      address: "  Hoàn Kiếm, Hà Nội  ",
      email: "  SHOP.INNISFREE@GMAIL.COM  ",
      password: "pass123456",
      phoneNumber: " 0988.333.444 ",
    });

    expect(sanitized.shopName).toBe("Innisfree Vietnam");
    expect(sanitized.ownerName).toBe("Lê Thu Thảo");
    expect(sanitized.license).toBe("MST-991204-HN");
    expect(sanitized.category).toBe("Mỹ phẩm thiên nhiên");
    expect(sanitized.address).toBe("Hoàn Kiếm, Hà Nội");
    expect(sanitized.email).toBe("shop.innisfree@gmail.com");
    expect(sanitized.phoneNumber).toBe("0988333444");
  });
});
