import os from "os";
import path from "path";
import { normalizeShopId } from "@/lib/shop-utils";
import { createPersistentJsonStore } from "@/lib/supabase/storage-json";

export interface ChatMessage {
  id: string;
  sender: "shop" | "user";
  senderName: string;
  text: string;
  time: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  shopId: string;
  shopName: string;
  userId: string;
  userName: string;
  orderCode?: string;
  messages: ChatMessage[];
  updatedAt: string;
}

const CHAT_FILE = path.join(process.cwd(), ".chat-db.json");
const FALLBACK_CHAT_FILE = path.join(os.tmpdir(), ".skinsense-chat-db.json");

function getInitialThreads(): ChatThread[] {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return [
    {
      id: "thread_larocheposay_dung",
      shopId: "larocheposay",
      shopName: "La Roche-Posay Flagship Store",
      userId: "thuy_dung",
      userName: "Thùy Dung",
      orderCode: "SHOPEE-SS-982101",
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      messages: [
        {
          id: "m_lrp_1",
          sender: "shop",
          senderName: "La Roche-Posay Flagship Store",
          text: "Xin chào bạn Thùy Dung! Cảm ơn bạn đã mua sắm tại La Roche-Posay Flagship Store. Shop có thể hỗ trợ gì cho đơn hàng Duo+M của bạn ạ?",
          time: formatTime(new Date(Date.now() - 1000 * 60 * 60)),
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
        {
          id: "m_lrp_2",
          sender: "user",
          senderName: "Thùy Dung",
          text: "Dạ shop ơi, kem dưỡng Duo+M này da đang có mụn viêm thoa toàn mặt hay chỉ chấm mụn vậy ạ?",
          time: formatTime(new Date(Date.now() - 1000 * 60 * 45)),
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          id: "m_lrp_3",
          sender: "shop",
          senderName: "La Roche-Posay Flagship Store",
          text: "Dạ bạn có thể thoa một lớp mỏng toàn mặt sau bước làm sạch và chấm thêm 1 nốt dày hơn lên các nốt mụn viêm sưng để gom cồi nhanh hơn nhé!",
          time: formatTime(new Date(Date.now() - 1000 * 60 * 30)),
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
      ],
    },
    {
      id: "thread_bioderma_dung",
      shopId: "bioderma",
      shopName: "Bioderma Official Store",
      userId: "thuy_dung",
      userName: "Thùy Dung",
      orderCode: "SHOPEE-SS-485002",
      updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      messages: [
        {
          id: "m_bio_1",
          sender: "shop",
          senderName: "Bioderma Official Store",
          text: "Chào Thùy Dung! Cảm ơn bạn đã ghé thăm gian hàng Bioderma chính hãng. Bạn cần tư vấn về sản phẩm hay vận chuyển đơn hàng ạ?",
          time: formatTime(new Date(Date.now() - 1000 * 60 * 120)),
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
      ],
    },
    {
      id: "thread_cerave_dung",
      shopId: "cerave",
      shopName: "CeraVe Official Mall",
      userId: "thuy_dung",
      userName: "Thùy Dung",
      orderCode: "SHOPEE-SS-330003",
      updatedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      messages: [
        {
          id: "m_cer_1",
          sender: "shop",
          senderName: "CeraVe Official Mall",
          text: "Chào bạn! CeraVe hỗ trợ đổi trả 15 ngày miễn phí cho các sản phẩm chăm sóc da. Shop có thể giúp gì cho bạn hôm nay?",
          time: formatTime(new Date(Date.now() - 1000 * 60 * 200)),
          createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
        },
      ],
    },
    {
      id: "thread_skinsense_dung",
      shopId: "skinsense_mall",
      shopName: "SkinSense Official Medical Mall",
      userId: "thuy_dung",
      userName: "Thùy Dung",
      orderCode: "SHOPEE-SS-998877",
      updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      messages: [
        {
          id: "m_ss_1",
          sender: "shop",
          senderName: "SkinSense Official Medical Mall",
          text: "Chào bạn Thùy Dung! Chào mừng bạn đến với sàn Dược Mỹ Phẩm SkinSense kết nối trực tiếp Bác sĩ Da liễu. Bạn cần hỗ trợ gì ạ?",
          time: formatTime(new Date(Date.now() - 1000 * 60 * 10)),
          createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        },
      ],
    },
  ];
}

const persistence = createPersistentJsonStore<ChatThread[]>({
  storagePath: "chat/chat_registry.json",
  primaryFile: CHAT_FILE,
  fallbackFile: FALLBACK_CHAT_FILE,
  overrideEnvVar: "SKINSENSE_CHAT_DB_PATH",
  getInitial: getInitialThreads,
});

function resolveDefaultShopName(cleanShopId: string, providedName?: string): string {
  if (providedName?.trim()) return providedName.trim();
  if (cleanShopId === "larocheposay") return "La Roche-Posay Flagship Store";
  if (cleanShopId === "bioderma") return "Bioderma Official Store";
  if (cleanShopId === "cerave") return "CeraVe Official Mall";
  if (cleanShopId === "skinsense_mall") return "SkinSense Official Medical Mall";
  return cleanShopId;
}

function resolveOrInitThread(
  list: ChatThread[],
  shopId: string,
  userId: string,
  options?: { userName?: string; shopName?: string },
): { nextList: ChatThread[]; thread: ChatThread; created: boolean } {
  const cleanUserId = userId.trim();
  if (!cleanUserId) {
    throw new Error("Thiếu userId để tải hội thoại");
  }

  const cleanShopId = normalizeShopId(shopId);
  const existing = list.find(
    (t) => t.shopId === cleanShopId && t.userId === cleanUserId,
  );
  if (existing) {
    return { nextList: list, thread: existing, created: false };
  }

  const defaultName = resolveDefaultShopName(cleanShopId, options?.shopName);
  const createdThread: ChatThread = {
    id: `thread_${cleanShopId}_${cleanUserId}`,
    shopId: cleanShopId,
    shopName: defaultName,
    userId: cleanUserId,
    userName: options?.userName?.trim() || "Khách hàng",
    messages: [
      {
        id: `init_${Date.now()}`,
        sender: "shop",
        senderName: defaultName,
        text: `Xin chào bạn! Cảm ơn bạn đã liên hệ gian hàng chính hãng ${defaultName}. Shop có thể hỗ trợ tư vấn dược mỹ phẩm gì cho bạn ạ?`,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  return { nextList: [...list, createdThread], thread: createdThread, created: true };
}

function applySendMessage(
  list: ChatThread[],
  params: {
    shopId: string;
    shopName?: string;
    userId: string;
    userName?: string;
    orderCode?: string;
    sender: "shop" | "user";
    senderName?: string;
    text: string;
  },
): { nextList: ChatThread[]; thread: ChatThread; autoReply?: ChatMessage } {
  const cleanShopId = normalizeShopId(params.shopId);
  const userId = params.userId.trim();
  if (!userId) {
    throw new Error("Thiếu userId khi gửi tin nhắn");
  }
  const userName = params.userName?.trim() || "Khách hàng";

  const threadIndex = list.findIndex(
    (t) => t.shopId === cleanShopId && t.userId === userId,
  );

  const now = new Date();
  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const resolvedShopName = resolveDefaultShopName(cleanShopId, params.shopName);
  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: params.sender,
    senderName:
      params.senderName?.trim() ||
      (params.sender === "user" ? userName : resolvedShopName),
    text: params.text.trim(),
    time: timeStr,
    createdAt: now.toISOString(),
  };

  let targetThread: ChatThread;

  if (threadIndex === -1) {
    targetThread = {
      id: `thread_${cleanShopId}_${userId}`,
      shopId: cleanShopId,
      shopName: resolvedShopName,
      userId,
      userName,
      orderCode: params.orderCode,
      messages: [newMsg],
      updatedAt: now.toISOString(),
    };
    list.unshift(targetThread);
  } else {
    targetThread = list[threadIndex];
    if (params.orderCode) targetThread.orderCode = params.orderCode;
    if (params.shopName) targetThread.shopName = params.shopName;
    targetThread.messages.push(newMsg);
    targetThread.updatedAt = now.toISOString();
    list.splice(threadIndex, 1);
    list.unshift(targetThread);
  }

  let autoReply: ChatMessage | undefined;
  if (params.sender === "user") {
    const lower = params.text.toLowerCase();
    let replyText = `Dạ ${targetThread.shopName} đã nhận được tin nhắn và sẽ hỗ trợ kiểm tra ngay cho bạn ạ!`;

    if (lower.includes("giao") || lower.includes("khi nào") || lower.includes("vận chuyển")) {
      replyText = `Dạ đơn hàng của bạn đã được đóng gói cẩn thận và bàn giao cho đơn vị SPX Express, dự kiến giao trong 1-2 ngày tới bạn nhé!`;
    } else if (lower.includes("dùng") || lower.includes("bha") || lower.includes("serum") || lower.includes("routine")) {
      replyText = `Dạ bạn nên dùng sau bước làm sạch và toner, thoa một lớp mỏng và luôn nhớ chống nắng kỹ vào ban ngày bạn nhé!`;
    } else if (lower.includes("đổi") || lower.includes("trả") || lower.includes("lỗi") || lower.includes("hỏng")) {
      replyText = `Dạ sản phẩm chính hãng 100% và shop hỗ trợ đổi trả miễn phí trong 15 ngày nếu có bất kỳ lỗi nào từ nhà sản xuất ạ.`;
    }

    autoReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: "shop",
      senderName: targetThread.shopName,
      text: replyText,
      time: timeStr,
      createdAt: new Date(Date.now() + 500).toISOString(),
    };
    targetThread.messages.push(autoReply);
  }

  return { nextList: list, thread: targetThread, autoReply };
}

export const chatStore = {
  normalizeShopId,

  getAllThreads(): ChatThread[] {
    return persistence.readSync();
  },

  async getAllThreadsAsync(): Promise<ChatThread[]> {
    return persistence.readAsync();
  },

  getThread(
    shopId: string,
    userId: string,
    options?: { userName?: string; shopName?: string },
  ): ChatThread {
    const { nextList, thread, created } = resolveOrInitThread(
      persistence.readSync(),
      shopId,
      userId,
      options,
    );
    if (created) persistence.writeSync(nextList);
    return thread;
  },

  async getThreadAsync(
    shopId: string,
    userId: string,
    options?: { userName?: string; shopName?: string },
  ): Promise<ChatThread> {
    return persistence.withLock(async () => {
      const list = await persistence.readAsync();
      const { nextList, thread, created } = resolveOrInitThread(list, shopId, userId, options);
      if (created) await persistence.writeAsync(nextList);
      return thread;
    });
  },

  getThreadsForShop(shopId?: string): ChatThread[] {
    const list = persistence.readSync();
    if (!shopId) return list;
    const clean = normalizeShopId(shopId);
    return list.filter((t) => t.shopId === clean);
  },

  async getThreadsForShopAsync(shopId?: string): Promise<ChatThread[]> {
    const list = await persistence.readAsync();
    if (!shopId) return list;
    const clean = normalizeShopId(shopId);
    return list.filter((t) => t.shopId === clean);
  },

  sendMessage(params: {
    shopId: string;
    shopName?: string;
    userId: string;
    userName?: string;
    orderCode?: string;
    sender: "shop" | "user";
    senderName?: string;
    text: string;
  }): { thread: ChatThread; autoReply?: ChatMessage } {
    const { nextList, thread, autoReply } = applySendMessage(persistence.readSync(), params);
    persistence.writeSync(nextList);
    return { thread, autoReply };
  },

  async sendMessageAsync(params: {
    shopId: string;
    shopName?: string;
    userId: string;
    userName?: string;
    orderCode?: string;
    sender: "shop" | "user";
    senderName?: string;
    text: string;
  }): Promise<{ thread: ChatThread; autoReply?: ChatMessage }> {
    return persistence.withLock(async () => {
      const list = await persistence.readAsync();
      const { nextList, thread, autoReply } = applySendMessage(list, params);
      await persistence.writeAsync(nextList);
      return { thread, autoReply };
    });
  },
};
