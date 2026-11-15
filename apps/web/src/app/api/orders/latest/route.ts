import { NextResponse } from "next/server";
import { ordersStore } from "@/lib/orders-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/orders/latest - Lấy đơn hàng mới nhất đang chờ thanh toán
export async function GET() {
  const allOrders = ordersStore.getAll();
  // Ưu tiên đơn hàng pending mới nhất, nếu không có lấy đơn mới nhất
  const pending = allOrders.find((o) => o.status === "pending" || o.paymentStatus === "unpaid");
  const latest = pending || allOrders[0] || null;

  if (!latest) {
    return NextResponse.json({ ok: false, error: "Chưa có đơn hàng nào" }, { headers: corsHeaders });
  }

  return NextResponse.json(
    {
      ok: true,
      orderCode: latest.orderCode,
      totalAmount: latest.totalAmount,
      shopName: latest.shopName,
      status: latest.status,
      paymentStatus: latest.paymentStatus,
      paid: latest.paymentStatus === "paid" || latest.status === "processing",
      items: latest.items,
    },
    { headers: corsHeaders },
  );
}
