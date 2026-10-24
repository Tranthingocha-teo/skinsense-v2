import { describe, expect, it } from "vitest";

import {
  classifyZoneCondition,
  explainProductRecommendation,
  getProductById,
  getProducts,
  PRODUCTS,
  recommendProductsForZone,
} from "./products";

describe("Products catalog & Recommendation domain logic", () => {
  it("provides authentic dermatological products with complete fields", () => {
    const products = getProducts();
    expect(products.length).toBeGreaterThanOrEqual(10);
    for (const p of products) {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.brand).toBeDefined();
      expect(p.priceVnd).toBeGreaterThan(0);
      expect(p.rating).toBeGreaterThanOrEqual(4.0);
      expect(p.imageUrl).toMatch(/^https:\/\//);
      expect(p.affiliateUrl).toMatch(/^https:\/\//);
      expect(p.targetZones.length).toBeGreaterThan(0);
      expect(p.targetClasses.length).toBeGreaterThan(0);
      expect(p.keyActives.length).toBeGreaterThan(0);
    }
  });

  it("retrieves product by id", () => {
    const p = getProductById("skin1004-centella-ampoule");
    expect(p).toBeDefined();
    expect(p?.brand).toBe("Skin1004");
  });

  it("classifies acne blemish condition when spots are detected", () => {
    const condition = classifyZoneCondition("forehead", {
      redness: 1.0,
      unevenness: 1.2,
      spotCount: 2,
    });
    expect(condition).toBe("acne_blemish");
  });

  it("classifies calming redness when redness is elevated", () => {
    const condition = classifyZoneCondition("leftCheek", {
      redness: 2.8,
      unevenness: 1.2,
      spotCount: 0,
    });
    expect(condition).toBe("calming_redness");
  });

  it("recommends tailored products for zone condition", () => {
    const products = recommendProductsForZone("forehead", {
      redness: 0.5,
      unevenness: 1.2,
      spotCount: 3,
    });
    expect(products.length).toBeGreaterThan(0);
    expect(products.some((p) => p.targetClasses.includes("acne_blemish"))).toBe(true);
  });

  it("generates clinical explanation for product recommendation", () => {
    const p = getProductById("skin1004-centella-ampoule")!;
    const explanation = explainProductRecommendation(p, "rightCheek", {
      redness: 2.5,
      unevenness: 1.1,
      spotCount: 0,
    });
    expect(explanation).toContain("Vùng má phải có chỉ số mẩn đỏ");
    expect(explanation).toContain("Rau Má");
  });
});
