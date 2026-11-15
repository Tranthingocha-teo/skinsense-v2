import { orderStatusResponse } from "@/lib/order-status-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/orders/[id]/status
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return orderStatusResponse(decodeURIComponent(id || ""));
}
