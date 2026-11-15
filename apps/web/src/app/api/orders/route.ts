import { NextResponse } from "next/server";
import { isOrderOwnedByActor, ordersStore } from "@/lib/orders-store";
import { requireRoleActor } from "@/lib/session-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAYMENT_METHODS = ["momo", "cod", "vietqr", "card"];

// GET /api/orders?code=...
export async function GET(request: Request) {
  const auth = await requireRoleActor(request, ["admin", "shop", "customer"]);
  if (!auth.ok) return auth.response;
  const { actor } = auth;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const order = await ordersStore.findByCodeAsync(code);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy đơn hàng." }, { status: 404 });
    }
    if (!isOrderOwnedByActor(order, actor)) {
      return NextResponse.json({ ok: false, error: "Không có quyền xem đơn hàng này." }, { status: 403 });
    }
    return NextResponse.json({ ok: true, order });
  }

  const allOrders = await ordersStore.getAllAsync();
  return NextResponse.json({ ok: true, orders: allOrders.filter((o) => isOrderOwnedByActor(o, actor)) });
}

// POST /api/orders (Tạo đơn hàng mới - trạng thái pending)
// Signed-in buyers only, and the order is bound to the buyer's user id: it used to be anonymous,
// so anyone could write orders into the store and buyers found their orders only by name.
export async function POST(request: Request) {
  const auth = await requireRoleActor(request);
  if (!auth.ok) return auth.response;
  const { actor } = auth;

  try {
    const body = await request.json();
    const {
      orderCode,
      customerName,
      customerPhone,
      shippingAddress,
      totalAmount,
      paymentMethod = "momo",
      shopName = "SkinSense Official",
      brand = "La Roche-Posay",
      items = [],
    } = body;

    if (!orderCode || !totalAmount) {
      return NextResponse.json(
        { ok: false, error: "Thiếu orderCode hoặc totalAmount." },
        { status: 400 },
      );
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ ok: false, error: "Phương thức thanh toán không hợp lệ." }, { status: 400 });
    }
    // A code that already exists (a random 6-digit collision, a double submit, or someone else's
    // code) must not replace that order: the create used to overwrite it.
    const newOrder = await ordersStore.createIfAbsentAsync({
      orderCode: String(orderCode),
      customerId: actor.userId,
      customerName: String(customerName || actor.fullName),
      customerPhone: String(customerPhone || actor.phone || ""),
      shippingAddress: String(shippingAddress || ""),
      totalAmount: Number(totalAmount),
      status: "pending",
      paymentMethod,
      paymentStatus: "unpaid",
      shopName,
      brand,
      carrier: "SPX Express (Freeship Xtra)",
      items,
    });
    if (!newOrder) {
      return NextResponse.json({ ok: false, error: "Mã đơn hàng đã tồn tại, vui lòng thử lại." }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      message: "Tạo đơn hàng thành công",
      order: newOrder,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Tạo đơn hàng thất bại" },
      { status: 500 },
    );
  }
}
