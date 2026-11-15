import { ownImageUrl } from "@skinsense/domain";
import { NextResponse } from "next/server";
import { isOrderOwnedByActor, isValidOrderStatus, ordersStore, type BackendOrder } from "@/lib/orders-store";
import { getAuthenticatedActor } from "@/lib/session-auth";
import { normalizeShopId } from "@/lib/shop-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// An item keeps the image its shop uploaded; stock photos from old rows are dropped so the
// client draws the product instead (components/product-art.tsx).
function resolveItemImage(fallback?: string): string {
  return ownImageUrl(fallback) ?? "";
}

export async function GET(req: Request) {
  try {
    const actor = await getAuthenticatedActor(req);
    if (!actor) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng đăng nhập để xem đơn hàng." },
        { status: 401 },
      );
    }

    const allOrders = await ordersStore.getAllAsync();
    const now = Date.now();

    let currentUserName = actor.fullName || "Khách hàng";
    let currentUserPhone = actor.phone || "0987654321";
    let userOrders: BackendOrder[] = [];

    if (actor.role === "admin") {
      userOrders = allOrders;
    } else if (actor.role === "shop") {
      const targetShopId =
        actor.shopId || normalizeShopId(actor.shopName || "La Roche-Posay Flagship Store");
      currentUserName = actor.shopName || "La Roche-Posay Flagship Store";
      currentUserPhone = actor.phone || "";
      userOrders = allOrders.filter((o) => normalizeShopId(o.shopName) === targetShopId);
    } else {
      userOrders = allOrders.filter((o) => isOrderOwnedByActor(o, actor));
    }

    // A customer with no orders sees an empty list. This used to invent four sample orders
    // (fixed address, other shops) and save them as if the customer had placed them.

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
        image: resolveItemImage(it.image),
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

export async function POST(req: Request) {
  try {
    const actor = await getAuthenticatedActor(req);
    if (!actor) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng đăng nhập để thao tác đơn hàng." },
        { status: 401 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Dữ liệu yêu cầu không hợp lệ." }, { status: 400 });
    }

    const action = typeof body.action === "string" ? body.action : "";
    const orderCode = typeof body.orderCode === "string" ? body.orderCode.trim() : "";

    if (!orderCode) {
      return NextResponse.json({ ok: false, error: "Thiếu mã đơn hàng" }, { status: 400 });
    }

    const existingOrder = await ordersStore.findByCodeAsync(orderCode);
    if (!existingOrder) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    if (!isOrderOwnedByActor(existingOrder, actor)) {
      return NextResponse.json(
        { ok: false, error: "Bạn không có quyền thao tác trên đơn hàng này." },
        { status: 403 },
      );
    }

    if (action === "update_status") {
      const status = body.status;
      if (!status || !isValidOrderStatus(status)) {
        return NextResponse.json(
          { ok: false, error: "Trạng thái cập nhật không hợp lệ." },
          { status: 400 },
        );
      }

      if (actor.role === "customer" && status !== "cancelled" && status !== "delivered") {
        return NextResponse.json(
          { ok: false, error: "Khách hàng chỉ có thể hủy đơn hoặc xác nhận đã nhận hàng." },
          { status: 403 },
        );
      }

      const result = await ordersStore.updateStatusSafeAsync(orderCode, status);
      if (!result.ok) {
        const httpStatus =
          result.code === "NOT_FOUND" ? 404 : result.code === "INVALID_STATUS" ? 400 : 409;
        return NextResponse.json({ ok: false, error: result.error }, { status: httpStatus });
      }
      return NextResponse.json({ ok: true, order: result.order });
    }

    if (action === "add_review") {
      if (actor.role !== "customer") {
        return NextResponse.json(
          { ok: false, error: "Chỉ khách hàng mua đơn mới có thể gửi đánh giá." },
          { status: 403 },
        );
      }

      const rawReview = body.review as Record<string, unknown> | undefined;
      if (!rawReview || typeof rawReview !== "object") {
        return NextResponse.json({ ok: false, error: "Vui lòng chọn số sao đánh giá" }, { status: 400 });
      }

      const parsedRating = Number(rawReview.rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return NextResponse.json(
          { ok: false, error: "Số sao đánh giá phải từ 1 đến 5." },
          { status: 400 },
        );
      }

      const rawComment = typeof rawReview.comment === "string" ? rawReview.comment.trim() : "";
      if (rawComment.length > 1000) {
        return NextResponse.json(
          { ok: false, error: "Nội dung đánh giá tối đa 1000 ký tự." },
          { status: 400 },
        );
      }

      const rawTags = Array.isArray(rawReview.tags)
        ? rawReview.tags
            .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
            .slice(0, 10)
            .map((t) => t.trim().slice(0, 80))
        : [];

      const reviewPayload = {
        rating: parsedRating,
        comment: rawComment,
        tags: rawTags,
        createdAt: new Date().toISOString(),
      };

      const result = await ordersStore.addReviewSafeAsync(orderCode, reviewPayload);
      if (!result.ok) {
        const httpStatus = result.code === "NOT_FOUND" ? 404 : 409;
        return NextResponse.json({ ok: false, error: result.error }, { status: httpStatus });
      }
      return NextResponse.json({ ok: true, order: result.order });
    }

    return NextResponse.json({ ok: false, error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Lỗi xử lý đơn hàng" },
      { status: 500 },
    );
  }
}
