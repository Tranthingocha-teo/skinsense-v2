import { NextResponse } from "next/server";
import { ordersStore } from "@/lib/orders-store";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Payment status of exactly one order, for the checkout poll and the pay-demo page.
 * It used to fall back to "any order paid since the QR modal opened" (and "latest" to any pending
 * order), so one customer's checkout reported success when a different customer paid.
 * Unknown codes answer 200 paid:false so the poll keeps running while the order is being saved.
 */
export async function orderStatusResponse(code: string): Promise<NextResponse> {
  const clean = code.trim();
  const order = clean ? await ordersStore.findByCodeAsync(clean) : undefined;
  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Chưa tìm thấy đơn hàng.", paid: false, orderCode: clean },
      { status: 200, headers: noStore },
    );
  }
  return NextResponse.json(
    {
      ok: true,
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paid: order.paymentStatus === "paid",
      totalAmount: order.totalAmount,
      shopName: order.shopName,
      paidAt: order.paidAt,
    },
    { status: 200, headers: noStore },
  );
}
