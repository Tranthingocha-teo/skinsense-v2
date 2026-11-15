import { NextResponse } from "next/server";
import { ordersStore } from "@/lib/orders-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/orders/[id]/status?since=1794708...
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");
  const cleanId = decodeURIComponent(id || "").trim();

  // 1. Kiểm tra đơn hàng cụ thể theo mã hoặc đơn mới nhất nếu mã là latest
  let order = ordersStore.findByCode(cleanId);
  if (!order && cleanId.toLowerCase() === "latest") {
    const all = ordersStore.getAll();
    order = all.find((o) => o.status === "pending" || o.paymentStatus === "unpaid") || all[0];
  }

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
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  // 2. Chống lệch mã (Fallback): Nếu người dùng vừa thanh toán bất kỳ đơn nào trên điện thoại từ lúc mở modal
  if (sinceParam) {
    const sinceTimestamp = parseInt(sinceParam, 10);
    if (!isNaN(sinceTimestamp)) {
      const allOrders = ordersStore.getAll();
      const recentPaid = allOrders.find((o) => {
        if (o.paymentStatus !== "paid") return false;
        if (!o.paidAt) return false;
        const paidTime = new Date(o.paidAt).getTime();
        return paidTime >= sinceTimestamp - 5000; // trong khoảng từ khi mở modal
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
            status: 200,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        );
      }
    }
  }

  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Chưa tìm thấy đơn hàng.", paid: false },
      {
        status: 200, // Trả về 200 paid: false thay vì 404 để polling client không bị gián đoạn
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paid: false,
      totalAmount: order.totalAmount,
      shopName: order.shopName,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
