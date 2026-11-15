import { NextResponse } from "next/server";

export interface OrderItem {
  id: string;
  customerName: string;
  shopName: string;
  totalAmount: number;
  commission: number; // 8% fee
  status: "completed" | "shipping" | "disputed" | "processing";
  createdAt: string;
  disputeReason?: string;
}

let ORDERS_STORE: OrderItem[] = [
  {
    id: "ORD-9821",
    customerName: "Trần Thị Ngọc Hà",
    shopName: "La Roche-Posay VN Flagship",
    totalAmount: 990000,
    commission: 79200,
    status: "completed",
    createdAt: "2026-11-06",
  },
  {
    id: "ORD-9822",
    customerName: "Nguyễn Văn Đinh",
    shopName: "La Roche-Posay VN Flagship",
    totalAmount: 495000,
    commission: 39600,
    status: "shipping",
    createdAt: "2026-11-08",
  },
  {
    id: "ORD-9823",
    customerName: "Lê Thị Bích Thảo",
    shopName: "CeraVe Skincare Official",
    totalAmount: 760000,
    commission: 60800,
    status: "disputed",
    disputeReason: "Giao sai dung tích chai (đặt 473ml giao 236ml)",
    createdAt: "2026-11-07",
  },
  {
    id: "ORD-9824",
    customerName: "Hoàng Minh Tuấn",
    shopName: "Innisfree Beauty Hub",
    totalAmount: 580000,
    commission: 46400,
    status: "processing",
    createdAt: "2026-11-09",
  },
];

export async function GET() {
  return NextResponse.json({ ok: true, orders: ORDERS_STORE });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, action, disputeReason } = body; // action: "resolve" | "ship" | "complete"

    if (!orderId) {
      return NextResponse.json({ error: "Thiếu orderId." }, { status: 400 });
    }

    ORDERS_STORE = ORDERS_STORE.map((o) => {
      if (o.id !== orderId) return o;
      if (action === "resolve") {
        return { ...o, status: "completed", disputeReason: undefined };
      }
      if (action === "ship") {
        return { ...o, status: "shipping" };
      }
      if (action === "complete") {
        return { ...o, status: "completed" };
      }
      return o;
    });

    return NextResponse.json({ ok: true, message: "Đã cập nhật đơn hàng thành công" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Cập nhật đơn hàng thất bại" }, { status: 500 });
  }
}
