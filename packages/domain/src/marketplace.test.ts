import { describe, expect, it } from "vitest";

import {
  formatVnd,
  generateVietQrUrl,
  getListingsForProduct,
  getShopById,
  INITIAL_LISTINGS,
  INITIAL_SHOPS,
} from "./marketplace";

describe("Marketplace Domain Entity & VietQR generator", () => {
  it("provides initial approved shops and listings", () => {
    expect(INITIAL_SHOPS.length).toBeGreaterThanOrEqual(3);
    for (const shop of INITIAL_SHOPS) {
      expect(shop.id).toBeDefined();
      expect(shop.shopName).toBeDefined();
      expect(shop.status).toBe("approved");
      expect(shop.rating).toBeGreaterThanOrEqual(4.5);
    }

    expect(INITIAL_LISTINGS.length).toBeGreaterThanOrEqual(5);
    for (const listing of INITIAL_LISTINGS) {
      expect(listing.id).toBeDefined();
      expect(listing.shopId).toBeDefined();
      expect(listing.productId).toBeDefined();
      expect(listing.priceVnd).toBeGreaterThan(0);
      expect(listing.priceFormatted).toContain("₫");
    }
  });

  it("formats VND amounts accurately", () => {
    expect(formatVnd(385000)).toBe("385.000₫");
    expect(formatVnd(1200000)).toBe("1.200.000₫");
  });

  it("generates a valid VietQR payment URL", () => {
    const qrUrl = generateVietQrUrl({
      bankId: "MB",
      accountNo: "999988886666",
      amount: 385000,
      memo: "SKINSENSE-ORD-001",
    });

    expect(qrUrl).toContain("https://img.vietqr.io/image/MB-999988886666-compact2.png");
    expect(qrUrl).toContain("amount=385000");
    expect(qrUrl).toContain("addInfo=SKINSENSE-ORD-001");
  });

  it("retrieves shop by id and listings for product", () => {
    const shop = getShopById("shop-skinsense-official");
    expect(shop).toBeDefined();
    expect(shop?.shopName).toBe("SkinSense Official Store");
    expect(shop?.isOfficial).toBe(true);

    const listings = getListingsForProduct("lrp-effaclar-duo-m");
    expect(listings.length).toBeGreaterThanOrEqual(2);
    expect(listings.some((l) => l.shopId === "shop-skinsense-official")).toBe(true);
  });
});
