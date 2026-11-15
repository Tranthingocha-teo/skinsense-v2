import { NextResponse } from "next/server";
import { chatStore } from "@/lib/chat-store";
import { getAuthenticatedActor } from "@/lib/session-auth";
import { normalizeShopId } from "@/lib/shop-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_MESSAGE_LENGTH = 2000;

// GET /api/chat?shopId=...&forShop=true
export async function GET(req: Request) {
  try {
    const actor = await getAuthenticatedActor(req);
    if (!actor) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng đăng nhập để xem hội thoại." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedShopId = searchParams.get("shopId")?.trim() || "";
    const forShop = searchParams.get("forShop") === "true";

    if (forShop) {
      if (actor.role !== "shop" && actor.role !== "admin") {
        return NextResponse.json(
          { ok: false, error: "Chỉ tài khoản Shop hoặc Admin mới xem được hộp thư gian hàng." },
          { status: 403 },
        );
      }

      // Admin may list every shop (or filter by ?shopId). A shop account is scoped to
      // the shop derived from its session; the shopId query param is ignored for tenancy.
      if (actor.role === "admin") {
        const threads = requestedShopId
          ? await chatStore.getThreadsForShopAsync(normalizeShopId(requestedShopId))
          : await chatStore.getAllThreadsAsync();
        return NextResponse.json({ ok: true, threads });
      }

      const threads = await chatStore.getThreadsForShopAsync(actor.shopId);
      return NextResponse.json({ ok: true, threads });
    }

    // Role khách hàng chỉ đọc được cuộc hội thoại của chính mình với shop đã chọn
    const resolvedShopId = normalizeShopId(requestedShopId || "skinsense_mall");
    const thread = await chatStore.getThreadAsync(resolvedShopId, actor.userId, {
      userName: actor.fullName,
    });
    return NextResponse.json({ ok: true, thread });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Lỗi tải hội thoại" },
      { status: 500 },
    );
  }
}

// POST /api/chat
export async function POST(req: Request) {
  try {
    const actor = await getAuthenticatedActor(req);
    if (!actor) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng đăng nhập để gửi tin nhắn." },
        { status: 401 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
    }

    const rawShopId = typeof body.shopId === "string" ? body.shopId.trim() : "";
    const rawShopName = typeof body.shopName === "string" ? body.shopName.trim() : "";
    const rawTargetUserId = typeof body.userId === "string" ? body.userId.trim() : "";
    const rawTargetUserName = typeof body.userName === "string" ? body.userName.trim() : "";
    const rawOrderCode = typeof body.orderCode === "string" ? body.orderCode.trim() : undefined;
    const rawSender = body.sender === "shop" ? "shop" : "user";
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Nội dung tin nhắn không được để trống" },
        { status: 400 },
      );
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự.` },
        { status: 400 },
      );
    }

    if (rawSender === "shop") {
      if (actor.role !== "shop" && actor.role !== "admin") {
        return NextResponse.json(
          { ok: false, error: "Bạn không có quyền gửi tin nhắn dưới danh nghĩa Shop." },
          { status: 403 },
        );
      }

      if (!rawTargetUserId) {
        return NextResponse.json(
          { ok: false, error: "Thiếu mã khách hàng nhận phản hồi." },
          { status: 400 },
        );
      }

      const requestedNormalizedShop = rawShopId ? normalizeShopId(rawShopId) : actor.shopId;
      if (
        actor.role === "shop" &&
        actor.shopId &&
        requestedNormalizedShop &&
        requestedNormalizedShop !== actor.shopId
      ) {
        return NextResponse.json(
          { ok: false, error: "Không thể trả lời tin nhắn của gian hàng khác." },
          { status: 403 },
        );
      }

      const effectiveShopId =
        actor.role === "admin"
          ? normalizeShopId(rawShopId || rawShopName || "skinsense_mall")
          : actor.shopId || normalizeShopId(actor.shopName || rawShopName || "skinsense_mall");

      const result = await chatStore.sendMessageAsync({
        shopId: effectiveShopId,
        shopName: actor.role === "admin" ? rawShopName || undefined : actor.shopName,
        userId: rawTargetUserId,
        userName: rawTargetUserName || undefined,
        orderCode: rawOrderCode,
        sender: "shop",
        senderName: actor.role === "admin" ? actor.fullName : actor.shopName || actor.fullName,
        text,
      });

      return NextResponse.json({
        ok: true,
        thread: result.thread,
        autoReply: result.autoReply,
      });
    }

    // Khách hàng chỉ được gửi tin nhắn bằng chính userId đã xác thực
    const targetShopId = normalizeShopId(rawShopId || rawShopName || "skinsense_mall");
    const result = await chatStore.sendMessageAsync({
      shopId: targetShopId,
      shopName: rawShopName || undefined,
      userId: actor.userId,
      userName: actor.fullName,
      orderCode: rawOrderCode,
      sender: "user",
      senderName: actor.fullName,
      text,
    });

    return NextResponse.json({
      ok: true,
      thread: result.thread,
      autoReply: result.autoReply,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Lỗi gửi tin nhắn" },
      { status: 500 },
    );
  }
}
