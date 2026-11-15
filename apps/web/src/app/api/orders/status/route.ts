import { NextResponse } from "next/server";
import { ordersStore } from "@/lib/orders-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/orders/status?code=...&since=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || searchParams.get("id") || "";
  const sinceParam = searchParams.get("since");

  if (code) {
    const order = ordersStore.findByCode(code);
    if (order && (order.paymentStatus === "paid" || order.status === "processing")) {
      return NextResponse.json(
        {
          ok: true,
          orderCode: order.orderCode,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paid: true,
          totalAmount: order.totalAmount,
          shopName: order.shopName,
          paidAt: order.paidAt,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
    }
  }

  // Fallback theo thời gian mở modal
  if (sinceParam) {
    const sinceTimestamp = parseInt(sinceParam, 10);
    if (!isNaN(sinceTimestamp)) {
      const allOrders = ordersStore.getAll();
      const recentPaid = allOrders.find((o) => {
        if (o.paymentStatus !== "paid") return false;
        if (!o.paidAt) return false;
        const paidTime = new Date(o.paidAt).getTime();
        return paidTime >= sinceTimestamp - 5000;
      });

      if (recentPaid) {
        return NextResponse.json(
          {
            ok: true,
            orderCode: recentPaid.orderCode,
            status: recentPaid.status,
            paymentStatus: recentPaid.paymentStatus,
            paid: true,
            totalAmount: recentPaid.totalAmount,
            shopName: recentPaid.shopName,
            paidAt: recentPaid.paidAt,
            matchedRecent: true,
          },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
              Pragma: "no-cache",
            },
          },
        );
      }
    }
  }

  return NextResponse.json(
    { ok: true, paid: false, orderCode: code },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );
}
