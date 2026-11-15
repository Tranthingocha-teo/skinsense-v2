import { NextResponse } from "next/server";
import { ordersStore } from "@/lib/orders-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    let code = "";
    try {
      const body = await request.json();
      code = body.orderCode || body.code || "";
    } catch {}

    if (!code) {
      const { searchParams } = new URL(request.url);
      code = searchParams.get("code") || searchParams.get("orderCode") || "";
    }

    if (!code) {
      const allOrders = ordersStore.getAll();
      const latestPending = allOrders.find((o) => o.status === "pending" || o.paymentStatus === "unpaid");
      if (latestPending) {
        code = latestPending.orderCode;
      }
    }

    if (!code) {
      return NextResponse.json({ ok: false, error: "Thiếu mã đơn hàng" }, { status: 400, headers: corsHeaders });
    }

    const updated = ordersStore.markAsPaid(code);
    return NextResponse.json(
      { ok: true, message: "Thanh toán thành công", order: updated },
      { headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Lỗi thanh toán" }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let code = searchParams.get("code") || searchParams.get("orderCode") || "";

  if (!code) {
    const allOrders = ordersStore.getAll();
    const latestPending = allOrders.find((o) => o.status === "pending" || o.paymentStatus === "unpaid");
    if (latestPending) {
      code = latestPending.orderCode;
    }
  }

  if (!code) {
    return NextResponse.json({ ok: false, error: "Thiếu mã đơn hàng" }, { status: 400, headers: corsHeaders });
  }

  const updated = ordersStore.markAsPaid(code);
  return NextResponse.json(
    { ok: true, message: "Thanh toán thành công", order: updated },
    { headers: corsHeaders },
  );
}
