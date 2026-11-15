import { orderStatusResponse } from "@/lib/order-status-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/orders/status?code=... (fallback of /api/orders/[id]/status for the checkout poll)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return orderStatusResponse(searchParams.get("code") || searchParams.get("id") || "");
}
