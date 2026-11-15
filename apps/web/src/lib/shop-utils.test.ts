import { describe, expect, it } from "vitest";
import { normalizeShopId } from "./shop-utils";

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
