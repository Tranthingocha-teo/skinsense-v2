import { describe, expect, it } from "vitest";
import { normalizeShopId, shopIdClaim } from "./shop-utils";

describe("shopIdClaim", () => {
  it("fixes a shop's tenancy from its application name when the role is granted", () => {
    expect(shopIdClaim("shop", {}, { shop_name: "My Beauty Hub" })).toEqual({ shop_id: "my_beauty_hub" });
    expect(shopIdClaim("shop", {}, { shop_details: { shopName: "Hub Two" } })).toEqual({ shop_id: "hub_two" });
  });

  it("keeps an existing claim, so renaming the shop later cannot move it into another shop", () => {
    expect(shopIdClaim("shop", { shop_id: "my_beauty_hub" }, { shop_name: "La Roche-Posay" })).toEqual({ shop_id: "my_beauty_hub" });
  });

  it("is empty for other roles", () => {
    expect(shopIdClaim("customer", {}, { shop_name: "x" })).toEqual({});
    expect(shopIdClaim("specialist", {}, {})).toEqual({});
  });
});

describe("normalizeShopId", () => {
  it("maps known brand stores to canonical IDs", () => {
    expect(normalizeShopId("La Roche-Posay Flagship Store")).toBe("larocheposay");
    expect(normalizeShopId("Bioderma Official Store")).toBe("bioderma");
    expect(normalizeShopId("CeraVe Skincare Mall")).toBe("cerave");
    expect(normalizeShopId("SkinSense Official Medical Mall")).toBe("skinsense_mall");
  });

  it("slugifies distinct third-party shops uniquely without collisions", () => {
    const hanaId = normalizeShopId("Hana Clinic Store");
    const klinikId = normalizeShopId("Klinik Glow Store");
    const vietShopId = normalizeShopId("Phòng Khám Da Liễu Ánh Dương");

    expect(hanaId).toBe("hana_clinic_store");
    expect(klinikId).toBe("klinik_glow_store");
    expect(vietShopId).toBe("phong_kham_da_lieu_anh_duong");
    expect(hanaId).not.toBe(klinikId);
    expect(hanaId).not.toBe("skinsense_mall");
  });
});
