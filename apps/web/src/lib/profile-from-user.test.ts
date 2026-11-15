import { describe, expect, it } from "vitest";
import { profileFromAuthUser } from "./profile-from-user";

const base = { id: "u1", email: "New.User@Example.com", created_at: "2026-11-01T00:00:00Z" };

describe("profileFromAuthUser", () => {
  it("a brand-new customer gets their own identity and empty details, no sample persona", () => {
    const p = profileFromAuthUser({ ...base, user_metadata: { full_name: "New User" } }, "customer");
    expect(p).toMatchObject({ id: "u1", email: "new.user@example.com", fullName: "New User", phone: "" });
    expect(p.customer).toEqual({ address: "", skinType: "", allergies: "" });
    expect(JSON.stringify(p)).not.toMatch(/Thùy Dung|khachhang@gmail.com|Nguyễn Huệ/);
  });

  it("prefers the profiles row, then metadata, then the email name", () => {
    expect(profileFromAuthUser({ ...base, user_metadata: { full_name: "Meta" } }, "customer", { profile: { full_name: "Row" } }).fullName).toBe("Row");
    expect(profileFromAuthUser({ ...base, user_metadata: {} }, "customer").fullName).toBe("new.user");
  });

  it("reads a shop's own details from its application", () => {
    const p = profileFromAuthUser(
      { ...base, user_metadata: { full_name: "Owner", phone_number: "0900", shop_details: { shopName: "My Shop", license: "GPKD-1", category: "Serum", address: "Đà Nẵng" } } },
      "shop",
    );
    expect(p.shop).toEqual({ shopName: "My Shop", address: "Đà Nẵng", license: "GPKD-1", category: "Serum", phone: "0900" });
    expect(JSON.stringify(p)).not.toMatch(/La Roche-Posay/);
  });

  it("maps a specialists row to the shape the profile page reads", () => {
    const p = profileFromAuthUser({ ...base, user_metadata: { hospital: "Meta Hospital" } }, "specialist", {
      specialist: { id: "u1", hospital: "BV Da Liễu", license_number: "CCHN-1", specialty: "Mụn", experience_years: 7, bio: "Bio" },
    });
    expect(p.specialist).toEqual({ id: "u1", hospital: "BV Da Liễu", licenseNumber: "CCHN-1", specialty: "Mụn", experienceYears: 7, bio: "Bio" });
  });
});
