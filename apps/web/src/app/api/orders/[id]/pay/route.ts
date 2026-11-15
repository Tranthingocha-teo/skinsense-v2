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

// Simulated MoMo confirmation from the phone that scanned the checkout QR (not signed in, hence
// CORS *). It pays exactly the order in the URL: unknown -> 404, cancelled -> 409.
async function pay(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const cleanId = decodeURIComponent(id || "").trim();

  try {
    const result = await ordersStore.markAsPaidAsync(cleanId);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.code === "NOT_FOUND" ? 404 : 409, headers: corsHeaders },
      );
    }
    return NextResponse.json(
      { ok: true, message: "Thanh toán đơn hàng thành công!", order: result.order },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Thanh toán thất bại" },
      { status: 500, headers: corsHeaders },
    );
  }
}

// POST /api/orders/[id]/pay
export async function POST(_request: Request, props: { params: Promise<{ id: string }> }) {
  return pay(props);
}

// GET /api/orders/[id]/pay (a simple request phone browsers never block on CORS)
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  return pay(props);
}
