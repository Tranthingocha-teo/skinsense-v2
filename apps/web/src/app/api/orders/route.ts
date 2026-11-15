import { NextResponse } from "next/server";
import { ordersStore } from "@/lib/orders-store";
import { requireRoleActor } from "@/lib/session-auth";
import { normalizeShopId } from "@/lib/shop-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    if (
      actor.role === "shop" &&
      actor.shopId &&
      normalizeShopId(order.shopName) !== actor.shopId
    ) {
      return NextResponse.json({ ok: false, error: "Không có quyền xem đơn hàng này." }, { status: 403 });
    }
    if (
      actor.role === "customer" &&
      order.customerName.trim().toLowerCase() !== actor.fullName.trim().toLowerCase()
    ) {
      return NextResponse.json({ ok: false, error: "Không có quyền xem đơn hàng này." }, { status: 403 });
    }
    return NextResponse.json({ ok: true, order });
  }

  const allOrders = await ordersStore.getAllAsync();
  const scopedOrders =
    actor.role === "admin"
      ? allOrders
      : actor.role === "shop"
        ? allOrders.filter((o) => actor.shopId && normalizeShopId(o.shopName) === actor.shopId)
        : allOrders.filter(
            (o) => o.customerName.trim().toLowerCase() === actor.fullName.trim().toLowerCase(),
          );

  return NextResponse.json({ ok: true, orders: scopedOrders });
}

// POST /api/orders (Tạo đơn hàng mới - trạng thái pending)
export async function POST(request: Request) {
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

    const newOrder = await ordersStore.createAsync({
      orderCode,
      customerName: customerName || "Khách Hàng Shopee",
      customerPhone: customerPhone || "0987654321",
      shippingAddress: shippingAddress || "TP. Hồ Chí Minh",
      totalAmount: Number(totalAmount),
      status: "pending",
      paymentMethod,
      paymentStatus: "unpaid",
      shopName,
      brand,
      carrier: "SPX Express (Freeship Xtra)",
      items,
    });

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
