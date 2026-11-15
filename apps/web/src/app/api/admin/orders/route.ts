import { NextResponse } from "next/server";
import { requireRoleActor } from "@/lib/session-auth";
import { isValidOrderStatus, ordersStore, type OrderStatus } from "@/lib/orders-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Platform commission on an order. */
const COMMISSION_RATE = 0.08;

export interface AdminOrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  shopName: string;
  totalAmount: number;
  commission: number;
  status: OrderStatus;
  paymentStatus: "unpaid" | "paid";
  paymentMethod: string;
  createdAt: string;
}

// The console used to read its own sample file (admin/admin_orders_registry.json, four made-up
// orders) instead of the orders customers place, so the admin never saw a real order and a status
// change there touched nothing. Both methods now work on the one orders store.
export async function GET(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const orders: AdminOrderItem[] = (await ordersStore.getAllAsync())
      .map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        customerName: o.customerName,
        shopName: o.shopName,
        totalAmount: o.totalAmount,
        commission: Math.round(o.totalAmount * COMMISSION_RATE),
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Không tải được đơn hàng." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRoleActor(request, ["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const { orderCode, status } = await request.json();
    if (!orderCode || typeof orderCode !== "string") {
      return NextResponse.json({ ok: false, error: "Thiếu mã đơn hàng." }, { status: 400 });
    }
    if (!isValidOrderStatus(status)) {
      return NextResponse.json({ ok: false, error: "Trạng thái đơn hàng không hợp lệ." }, { status: 400 });
    }

    const result = await ordersStore.updateStatusSafeAsync(orderCode, status);
    if (!result.ok) {
      const httpStatus = result.code === "NOT_FOUND" ? 404 : result.code === "INVALID_STATUS" ? 400 : 409;
      return NextResponse.json({ ok: false, error: result.error }, { status: httpStatus });
    }
    return NextResponse.json({ ok: true, order: result.order, message: "Đã cập nhật trạng thái đơn hàng." });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Cập nhật đơn hàng thất bại" }, { status: 500 });
  }
}
