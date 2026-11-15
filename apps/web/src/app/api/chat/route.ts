import { NextResponse } from "next/server";
import { chatStore } from "@/lib/chat-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/chat?shopId=...&userId=...&forShop=true
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId") || "";
    const userId = searchParams.get("userId") || "thuy_dung";
    const forShop = searchParams.get("forShop") === "true";

    if (forShop) {
      // Dành cho Role Shop: lấy toàn bộ các cuộc hội thoại khách hàng gửi đến Shop này
      const threads = chatStore.getThreadsForShop(shopId || undefined);
      return NextResponse.json({ ok: true, threads });
    }

    // Dành cho Role Customer: lấy đúng cuộc hội thoại giữa user và shop này
    const thread = chatStore.getThread(shopId, userId);
    return NextResponse.json({ ok: true, thread });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// POST /api/chat
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      shopId,
      shopName,
      userId,
      userName,
      orderCode,
      sender,
      senderName,
      text,
    } = body;

    if (!shopId || !text || !sender) {
      return NextResponse.json(
        { ok: false, error: "Thiếu thông tin shopId, text hoặc sender" },
        { status: 400 }
      );
    }

    const result = chatStore.sendMessage({
      shopId,
      shopName,
      userId: userId || "thuy_dung",
      userName: userName || "Thùy Dung",
      orderCode,
      sender,
      senderName,
      text,
    });

    return NextResponse.json({
      ok: true,
      thread: result.thread,
      autoReply: result.autoReply,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
