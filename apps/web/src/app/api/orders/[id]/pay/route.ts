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

// POST /api/orders/[id]/pay
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const cleanId = decodeURIComponent(id || "").trim();

  try {
    const updated = ordersStore.markAsPaid(cleanId);

    return NextResponse.json(
      {
        ok: true,
        message: "Thanh toán đơn hàng thành công!",
        order: updated,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Thanh toán thất bại" },
      { status: 500, headers: corsHeaders },
    );
  }
}

// GET /api/orders/[id]/pay (Hỗ trợ trình duyệt điện thoại gửi request đơn giản không bị chặn CORS)
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const cleanId = decodeURIComponent(id || "").trim();
  const updated = ordersStore.markAsPaid(cleanId);

  return NextResponse.json(
    {
      ok: true,
      message: "Thanh toán đơn hàng thành công!",
      order: updated,
    },
    {
      status: 200,
      headers: corsHeaders,
    },
  );
}
