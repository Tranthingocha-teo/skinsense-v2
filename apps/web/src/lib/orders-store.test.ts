import { describe, expect, it } from "vitest";
import { applyMarkAsPaid, isOrderOwnedByActor, type BackendOrder } from "./orders-store";

function order(over: Partial<BackendOrder>): BackendOrder {
  return {
    id: "ORD-1",
    orderCode: "SHOPEE-SS-100001",
    customerName: "Nguyễn Văn A",
    customerPhone: "0900000001",
    shippingAddress: "x",
    totalAmount: 100000,
    status: "pending",
    paymentMethod: "momo",
    paymentStatus: "unpaid",
    shopName: "CeraVe Vietnam Official Store",
    brand: "CeraVe",
    carrier: "SPX",
    items: [],
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe("applyMarkAsPaid", () => {
  it("pays exactly the order with that code", () => {
    const list = [order({ orderCode: "A" }), order({ id: "ORD-2", orderCode: "B" })];
    const res = applyMarkAsPaid(list, "b");
    expect(res.ok && res.order.orderCode).toBe("B");
    expect(list[0].paymentStatus).toBe("unpaid");
    expect(list[1]).toMatchObject({ paymentStatus: "paid", status: "processing" });
  });

  it("never guesses: 'latest', an empty or an unknown code pay nothing and create nothing", () => {
    for (const code of ["latest", "", "SHOPEE-SS-999999"]) {
      const list = [order({})];
      const res = applyMarkAsPaid(list, code);
      expect(res).toMatchObject({ ok: false, code: "NOT_FOUND" });
      expect(list).toHaveLength(1);
      expect(list[0].paymentStatus).toBe("unpaid");
    }
  });

  it("refuses a cancelled order and leaves a paid one unchanged", () => {
    expect(applyMarkAsPaid([order({ status: "cancelled" })], "SHOPEE-SS-100001")).toMatchObject({ ok: false, code: "CANCELLED" });
    const paid = order({ paymentStatus: "paid", status: "delivering", paidAt: "2026-01-01T00:00:00.000Z" });
    const res = applyMarkAsPaid([paid], "SHOPEE-SS-100001");
    expect(res).toMatchObject({ ok: true, mutated: false });
    expect(paid).toMatchObject({ status: "delivering", paidAt: "2026-01-01T00:00:00.000Z" });
  });
});

describe("isOrderOwnedByActor", () => {
  const customer = { role: "customer", userId: "u1", fullName: "Nguyễn Văn A", phone: "" };

  it("binds a customer's order to their user id, not their name", () => {
    expect(isOrderOwnedByActor(order({ customerId: "u1" }), customer)).toBe(true);
    // Same recipient name, someone else's order.
    expect(isOrderOwnedByActor(order({ customerId: "u2" }), customer)).toBe(false);
  });

  it("falls back to name or phone only for legacy orders without customerId", () => {
    expect(isOrderOwnedByActor(order({ customerName: "nguyen van a" }), customer)).toBe(true);
    expect(isOrderOwnedByActor(order({ customerName: "Trần B" }), customer)).toBe(false);
  });

  it("scopes a shop to its own shop id and lets an admin see everything", () => {
    const shop = { role: "shop", userId: "s1", fullName: "x", phone: "", shopId: "cerave" };
    expect(isOrderOwnedByActor(order({}), shop)).toBe(true);
    expect(isOrderOwnedByActor(order({ shopName: "Bioderma Official Store" }), shop)).toBe(false);
    expect(isOrderOwnedByActor(order({}), { ...shop, shopId: undefined })).toBe(false);
    expect(isOrderOwnedByActor(order({ customerId: "u9" }), { role: "admin", userId: "a", fullName: "", phone: "" })).toBe(true);
    expect(isOrderOwnedByActor(order({}), { role: "specialist", userId: "d", fullName: "Nguyễn Văn A", phone: "" })).toBe(false);
  });
});
