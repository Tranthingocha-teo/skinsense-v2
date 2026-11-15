import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  formatVnd,
  generateVietQrUrl,
  getListingsForProduct,
  getShopById,
  INITIAL_LISTINGS,
  INITIAL_SHOPS,
  ORDER_STATUSES,
  validateOrderStatusTransition,
  validateProductInput,
  validateSellerRegistration,
} from "./marketplace";
import { sellerOrders } from "./schema";

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

describe("Seller System Domain Rules", () => {
  it("validates seller registration inputs accurately", () => {
    const valid = validateSellerRegistration({
      shopName: "Dược Mỹ Phẩm Chính Hãng",
      ownerName: "Nguyễn Văn A",
      phone: "0912345678",
      email: "shop@skinsense.vn",
      address: "123 Đường Cầu Giấy, Hà Nội",
      category: "Dược mỹ phẩm",
    });
    expect(valid.valid).toBe(true);

    const invalid = validateSellerRegistration({
      shopName: "A",
      ownerName: "",
      phone: "12345",
      email: "invalid-email",
      address: "123",
      category: "",
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.shopName).toBeDefined();
    expect(invalid.errors.phone).toBeDefined();
    expect(invalid.errors.email).toBeDefined();
  });

  it("enforces order state machine transition rules", () => {
    expect(validateOrderStatusTransition("pending", "processing").allowed).toBe(true);
    expect(validateOrderStatusTransition("processing", "shipping").allowed).toBe(true);
    expect(validateOrderStatusTransition("shipping", "completed").allowed).toBe(true);
    expect(validateOrderStatusTransition("completed", "pending").allowed).toBe(false);
    expect(validateOrderStatusTransition("cancelled", "shipping").allowed).toBe(false);
  });

  it("lets a seller confirm a pending order and deliver a shipped one", () => {
    expect(validateOrderStatusTransition("pending", "confirmed").allowed).toBe(true);
    expect(validateOrderStatusTransition("confirmed", "processing").allowed).toBe(true);
    expect(validateOrderStatusTransition("shipping", "delivered").allowed).toBe(true);
    expect(validateOrderStatusTransition("delivered", "completed").allowed).toBe(true);
  });

  it("uses exactly the order statuses the database check constraint accepts", () => {
    const status = getTableConfig(sellerOrders).columns.find((c) => c.name === "status");
    expect(status?.enumValues).toEqual([...ORDER_STATUSES]);
  });

  const base = { name: "Serum B5", brand: "LRP", category: "Serum", priceVnd: 100000, stock: 3 };

  it.each([
    ["NaN price", { priceVnd: Number.NaN }, "priceVnd"],
    ["fractional price", { priceVnd: 1000.5 }, "priceVnd"],
    ["negative price", { priceVnd: -1 }, "priceVnd"],
    ["infinite price", { priceVnd: Number.POSITIVE_INFINITY }, "priceVnd"],
    ["NaN stock", { stock: Number.NaN }, "stock"],
    ["fractional stock", { stock: 2.5 }, "stock"],
    ["negative stock", { stock: -1 }, "stock"],
    ["fractional original price", { originalPriceVnd: 150000.5 }, "originalPriceVnd"],
  ])("rejects a product with %s", (_label, patch, field) => {
    const result = validateProductInput({ ...base, ...patch });
    expect(result.valid).toBe(false);
    expect(result.errors[field]).toBeDefined();
  });

  it("accepts a product with zero price and zero stock", () => {
    expect(validateProductInput({ ...base, priceVnd: 0, stock: 0 }).valid).toBe(true);
  });
});

