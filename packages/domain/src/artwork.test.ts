import { describe, expect, it } from "vitest";

import { crc16Ccitt, initialsOf, ownImageUrl, productShape, tintIndex, vietQrMemo, vietQrPayload } from "./artwork";

describe("ownImageUrl", () => {
  it("keeps uploads and local images", () => {
    const cloud = "https://res.cloudinary.com/demo/image/upload/v1/p.jpg";
    expect(ownImageUrl(cloud)).toBe(cloud);
    expect(ownImageUrl("  /apk-qr.svg ")).toBe("/apk-qr.svg");
    expect(ownImageUrl("data:image/png;base64,AAA")).toBe("data:image/png;base64,AAA");
    expect(ownImageUrl("blob:http://localhost/1")).toBe("blob:http://localhost/1");
  });

  it("drops empty values and stock or third-party placeholder hosts", () => {
    expect(ownImageUrl(undefined)).toBeUndefined();
    expect(ownImageUrl(null)).toBeUndefined();
    expect(ownImageUrl("   ")).toBeUndefined();
    for (const url of [
      "https://images.unsplash.com/photo-1?w=600",
      "https://i.pravatar.cc/100",
      "https://picsum.photos/200",
      "https://placehold.co/600x400",
      "https://via.placeholder.com/150",
      "https://api.qrserver.com/v1/create-qr-code/?data=x",
      "https://quickchart.io/qr?text=x",
      "https://img.vietqr.io/image/MB-1-compact2.png",
      "https://randomuser.me/api/portraits/women/1.jpg",
      "https://ui-avatars.com/api/?name=A",
      "//images.unsplash.com/photo-1",
    ]) {
      expect(ownImageUrl(url), url).toBeUndefined();
    }
  });
});

describe("initialsOf", () => {
  it("takes the first letters of the first and last words", () => {
    expect(initialsOf("Trần Thị Ngọc Hà")).toBe("TH");
    expect(initialsOf("La Roche-Posay")).toBe("LR");
    expect(initialsOf("skin1004")).toBe("S");
    expect(initialsOf("  bác sĩ   đặng  ")).toBe("BĐ");
  });

  it("falls back to a neutral mark for empty names", () => {
    expect(initialsOf("")).toBe("·");
    expect(initialsOf("  -- ")).toBe("·");
  });
});

describe("tintIndex", () => {
  it("is deterministic and in range", () => {
    expect(tintIndex("user-1", 6)).toBe(tintIndex("user-1", 6));
    for (const seed of ["", "a", "shop-skinsense-official", "Trần Hà"]) {
      const i = tintIndex(seed, 5);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(5);
    }
  });

  it("spreads different seeds", () => {
    const seen = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((s) => tintIndex(s, 6)));
    expect(seen.size).toBeGreaterThan(2);
  });
});

describe("productShape", () => {
  it("reads the packaging from the category or the name, in Vietnamese or English", () => {
    expect(productShape("Kem chống nắng", "Anthelios UVMune")).toBe("tube");
    expect(productShape("", "Sunscreen SPF 50")).toBe("tube");
    expect(productShape("Sữa rửa mặt", "CeraVe Foaming")).toBe("pump");
    expect(productShape("Tinh chất phục hồi", "Centella Ampoule")).toBe("dropper");
    expect(productShape("Kem dưỡng phục hồi", "Cicaplast Baume B5+")).toBe("jar");
    expect(productShape("Toner", "Nước hoa hồng")).toBe("bottle");
    expect(productShape(undefined, "Something")).toBe("bottle");
  });
});

describe("vietQrPayload", () => {
  it("computes CRC-16/CCITT-FALSE", () => {
    expect(crc16Ccitt("123456789")).toBe("29B1");
  });

  it("builds an EMVCo VietQR string with amount, memo and a valid checksum", () => {
    const payload = vietQrPayload({ bankBin: "970422", accountNo: "999988886666", amount: 385000, memo: "SKINSENSE-ORD-001" });
    expect(payload.startsWith("000201010212")).toBe(true);
    expect(payload).toContain("0010A000000727");
    expect(payload).toContain("0006970422");
    expect(payload).toContain("0112999988886666");
    expect(payload).toContain("5303704");
    expect(payload).toContain("5406385000");
    expect(payload).toContain("5802VN");
    expect(payload).toContain("0817SKINSENSE-ORD-001");
    const body = payload.slice(0, -4);
    expect(body.endsWith("6304")).toBe(true);
    expect(payload.slice(-4)).toBe(crc16Ccitt(body));
  });

  it("keeps the memo to what bank apps accept", () => {
    expect(vietQrMemo("Đơn hàng số 12 – thanh toán nhanh giúp mình")).toBe("Don hang so 12  thanh toa");
    expect(vietQrMemo("SS-123456")).toBe("SS-123456");
    const payload = vietQrPayload({ bankBin: "970422", accountNo: "1", amount: 1, memo: "Đặt hàng" });
    expect(payload).toContain("0808Dat hang");
    expect(payload.slice(-4)).toBe(crc16Ccitt(payload.slice(0, -4)));
  });
});
