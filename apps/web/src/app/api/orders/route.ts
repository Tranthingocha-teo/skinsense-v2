import { NextResponse } from "next/server";
import { ordersStore } from "@/lib/orders-store";
import { createClient } from "@/lib/supabase/client";

// GET /api/orders?code=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const order = ordersStore.findByCode(code);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy đơn hàng." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, order });
  }

  return NextResponse.json({ ok: true, orders: ordersStore.getAll() });
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

    // 1. Lưu vào in-memory store
    const newOrder = ordersStore.create({
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

    // 2. Thử đồng bộ sang Supabase table "orders" nếu có kết nối
    try {
      const supabase = createClient();
      await supabase.from("orders").insert([
        {
          id: newOrder.id,
          order_code: newOrder.orderCode,
          customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          shipping_address: newOrder.shippingAddress,
          total_amount: newOrder.totalAmount,
          status: "pending",
          carrier: newOrder.carrier,
          items: newOrder.items,
        },
      ]);
    } catch {
      // Bỏ qua lỗi Supabase nếu bảng chưa tạo, in-memory store đã đảm bảo 100% hoạt động
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
