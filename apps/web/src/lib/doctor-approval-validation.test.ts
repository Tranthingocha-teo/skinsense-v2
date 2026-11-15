import { describe, expect, it } from "vitest";
import {
  sanitizeDoctorApprovalInput,
  validateDoctorApprovalInput,
} from "./doctor-approval-validation";

describe("Doctor Approval Validation", () => {
  it("rejects when fullName is empty or too short", () => {
    const result = validateDoctorApprovalInput({ fullName: "  ", licenseId: "CCHN-123456", hospital: "BV Da Liễu", email: "dr.ha@example.com" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Họ và tên");
  });

  it("rejects when licenseId is missing", () => {
    const result = validateDoctorApprovalInput({ fullName: "BS. Nguyễn Văn A", licenseId: "  ", hospital: "BV Da Liễu", email: "dr.ha@example.com" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Số Chứng chỉ hành nghề");
  });

  it("rejects when hospital is missing", () => {
    const result = validateDoctorApprovalInput({ fullName: "BS. Nguyễn Văn A", licenseId: "CCHN-123456", hospital: "", email: "dr.ha@example.com" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Bệnh viện");
  });

  it("rejects invalid email addresses", () => {
    const result = validateDoctorApprovalInput({ fullName: "BS. Nguyễn Văn A", licenseId: "CCHN-123456", hospital: "BV Da Liễu", email: "dr.ha@" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Email hợp lệ");
  });

  it("rejects short password", () => {
    const result = validateDoctorApprovalInput({ fullName: "BS. Nguyễn Văn A", licenseId: "CCHN-123456", hospital: "BV Da Liễu", email: "dr.ha@example.com", password: "123" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("ít nhất 6 ký tự");
  });

  it("rejects invalid phone format", () => {
    const result = validateDoctorApprovalInput({ fullName: "BS. Nguyễn Văn A", licenseId: "CCHN-123456", hospital: "BV Da Liễu", email: "dr.ha@example.com", phoneNumber: "abc123" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Số điện thoại liên hệ không hợp lệ");
  });

  it("accepts valid input and correctly sanitizes all fields", () => {
    const raw = {
      fullName: "  BS. Trần Thị Ngọc Hà  ",
      licenseId: "  CCHN-889900/BYT  ",
      hospital: "  Bệnh viện Da Liễu Đà Nẵng ",
      email: "  DR.HA@EXAMPLE.COM  ",
      phoneNumber: " 0905 123 456 ",
      specialty: "  Chuyên khoa Da liễu & Thẩm mỹ  ",
      password: "securePassword123",
    };

    const validation = validateDoctorApprovalInput(raw);
    expect(validation.isValid).toBe(true);

    const sanitized = sanitizeDoctorApprovalInput(raw);
    expect(sanitized.fullName).toBe("BS. Trần Thị Ngọc Hà");
    expect(sanitized.licenseId).toBe("CCHN-889900/BYT");
    expect(sanitized.hospital).toBe("Bệnh viện Da Liễu Đà Nẵng");
    expect(sanitized.email).toBe("dr.ha@example.com");
    expect(sanitized.phoneNumber).toBe("0905123456");
    expect(sanitized.specialty).toBe("Chuyên khoa Da liễu & Thẩm mỹ");
  });
});
