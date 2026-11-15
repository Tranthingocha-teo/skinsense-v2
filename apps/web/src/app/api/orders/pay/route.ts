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

// Fallback of /api/orders/[id]/pay for the pay-demo page. A code is required: without one this
// used to pay whichever customer's order was pending first.
async function pay(code: string) {
  if (!code) {
    return NextResponse.json({ ok: false, error: "Thiếu mã đơn hàng" }, { status: 400, headers: corsHeaders });
  }
  try {
    const result = await ordersStore.markAsPaidAsync(code);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.code === "NOT_FOUND" ? 404 : 409, headers: corsHeaders },
      );
    }
    return NextResponse.json(
      { ok: true, message: "Thanh toán thành công", order: result.order },
      { headers: corsHeaders },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Lỗi thanh toán" }, { status: 500, headers: corsHeaders });
  }
}

function codeFromQuery(request: Request): string {
  const { searchParams } = new URL(request.url);
  return (searchParams.get("code") || searchParams.get("orderCode") || "").trim();
}

export async function POST(request: Request) {
  let code = "";
  try {
    const body = await request.json();
    code = String(body.orderCode || body.code || "").trim();
  } catch {}
  return pay(code || codeFromQuery(request));
}

export async function GET(request: Request) {
  return pay(codeFromQuery(request));
}
