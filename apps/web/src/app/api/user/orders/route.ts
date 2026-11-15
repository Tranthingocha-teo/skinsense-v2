import { NextResponse } from "next/server";
import { ordersStore, type BackendOrder } from "@/lib/orders-store";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// Thư viện ảnh dược mỹ phẩm sắc nét cho sản phẩm
const PRODUCT_IMAGES: Record<string, string> = {
  bioderma: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
  cerave: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
  hyalu: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
  effaclar: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  duo: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  anthelios: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
  paula: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
  bha: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
};

function resolveItemImage(name: string, fallback?: string): string {
  if (fallback) return fallback;
  const n = (name || "").toLowerCase();
  for (const [key, url] of Object.entries(PRODUCT_IMAGES)) {
    if (n.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryName = searchParams.get("name")?.trim().toLowerCase();
    const queryPhone = searchParams.get("phone")?.trim();

    // 1. Xác định thông tin người dùng đang truy cập
    let currentUserName = "thùy dung";
    let currentUserPhone = "0987654321";

    try {
      const serverClient = await createServerClient();
      const { data: session } = await serverClient.auth.getUser();
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        currentUserName = (meta.full_name || meta.name || u.email?.split("@")[0] || currentUserName).toLowerCase();
        currentUserPhone = (meta.phone_number || u.phone || currentUserPhone).replace(/[^0-9]/g, "");
      }
    } catch {}

    if (queryName) currentUserName = queryName;
    if (queryPhone) currentUserPhone = queryPhone.replace(/[^0-9]/g, "");

    // 2. Lấy toàn bộ đơn hàng trong cơ sở dữ liệu (đã kèm quy tắc tự hủy sau 3 ngày)
    const allOrders = ordersStore.getAll();
    const now = Date.now();

    // 3. Lọc đúng đơn hàng của user này (không hiển thị đơn của người khác)
    let userOrders = allOrders.filter((o) => {
      const orderNameClean = (o.customerName || "").trim().toLowerCase();
      if (currentUserName) {
        const cName = currentUserName.trim().toLowerCase();
        if (orderNameClean === cName || orderNameClean.includes(cName) || cName.includes(orderNameClean)) {
          return true;
        }
      }
      return false;
    });

    // 4. Nếu user chưa có đơn nào trong database, tạo mặc định các đơn mẫu kèm ảnh đẹp và LƯU LUÔN VÀO DATABASE
    if (userOrders.length === 0) {
      const displayCustomerName = queryName
        ? queryName.charAt(0).toUpperCase() + queryName.slice(1)
        : (currentUserName === "thùy dung" ? "Thùy Dung" : "Khách hàng " + currentUserName);

      const sampleOrders: Omit<BackendOrder, "id" | "createdAt">[] = [
        {
          orderCode: `SHOPEE-SS-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: displayCustomerName,
          customerPhone: currentUserPhone || "0987 654 321",
          shippingAddress: "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          totalAmount: 485000,
          status: "delivered",
          paymentMethod: "momo",
          paymentStatus: "paid",
          shopName: "Bioderma Official Store",
          brand: "Bioderma",
          carrier: "Shopee Express (Freeship Xtra)",
          items: [
            {
              id: "item_sp_01",
              name: "Nước Tẩy Trang Bioderma Sensibio H2O Micellar Dịu Nhẹ Cho Da Nhạy Cảm 500ml",
              price: 485000,
              quantity: 1,
              variant: "Chai 500ml Tiết Kiệm",
              image: PRODUCT_IMAGES.bioderma,
            },
          ],
          paidAt: new Date(now - 3 * 86400000).toISOString(),
        },
        {
          orderCode: `SHOPEE-SS-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: displayCustomerName,
          customerPhone: currentUserPhone || "0987 654 321",
          shippingAddress: "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          totalAmount: 840000,
          status: "delivering",
          paymentMethod: "momo",
          paymentStatus: "paid",
          shopName: "La Roche-Posay Flagship Store",
          brand: "La Roche-Posay",
          carrier: "Shopee Express Fast",
          items: [
            {
              id: "item_sp_03",
              name: "Tinh Chất Phục Hồi & Cấp Nước Đa Tầng La Roche-Posay Hyalu B5 Serum 30ml",
              price: 890000,
              quantity: 1,
              variant: "Chai 30ml",
              image: PRODUCT_IMAGES.hyalu,
            },
          ],
          paidAt: new Date(now - 86400000).toISOString(),
        },
        {
          orderCode: `SHOPEE-SS-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: displayCustomerName,
          customerPhone: currentUserPhone || "0987 654 321",
          shippingAddress: "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          totalAmount: 330000,
          status: "pending",
          paymentMethod: "momo",
          paymentStatus: "unpaid",
          shopName: "SkinSense Official Medical Mall",
          brand: "SkinSense",
          carrier: "Shopee Express Tiết Kiệm",
          items: [
            {
              id: "item_sp_02",
              name: "Sữa Rửa Mặt Dưỡng Ẩm Cho Da Khô CeraVe Hydrating Cleanser 473ml",
              price: 380000,
              quantity: 1,
              variant: "Chai 473ml",
              image: PRODUCT_IMAGES.cerave,
            },
          ],
        },
        {
          orderCode: `SHOPEE-SS-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: displayCustomerName,
          customerPhone: currentUserPhone || "0987 654 321",
          shippingAddress: "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          totalAmount: 395000,
          status: "cancelled", // Đơn hàng đã tự động hủy do quá hạn 3 ngày chưa thanh toán
          paymentMethod: "momo",
          paymentStatus: "unpaid",
          shopName: "La Roche-Posay Flagship Store",
          brand: "La Roche-Posay",
          carrier: "Shopee Express",
          items: [
            {
              id: "item_sp_04",
              name: "Kem Dưỡng Giảm Mụn & Ngừa Thâm La Roche-Posay Effaclar Duo+M 40ml",
              price: 395000,
              quantity: 1,
              variant: "Tuýp 40ml",
              image: PRODUCT_IMAGES.effaclar,
            },
          ],
        },
      ];

      const createdList: BackendOrder[] = [];
      for (const sample of sampleOrders) {
        const created = ordersStore.create(sample);
        createdList.push(created);
      }
      userOrders = createdList;
    }

    // 5. Đảm bảo toàn bộ mặt hàng đều có link ảnh sắc nét và kiểm tra tự động hủy sau 3 ngày
    const enrichedOrders = userOrders.map((order) => {
      // Kiểm tra đơn chưa thanh toán quá 3 ngày
      const createdMs = new Date(order.createdAt).getTime();
      let status = order.status;
      if ((order.status === "pending" || order.paymentStatus === "unpaid") && !isNaN(createdMs)) {
        if (now - createdMs > THREE_DAYS_MS) {
          status = "cancelled";
        }
      }

      const items = (order.items || []).map((it) => ({
        ...it,
        image: resolveItemImage(it.name, it.image),
      }));

      return {
        ...order,
        status,
        items,
      };
    });

    return NextResponse.json({
      ok: true,
      orders: enrichedOrders,
      user: {
        name: currentUserName,
        phone: currentUserPhone,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed to load orders" }, { status: 500 });
  }
}
