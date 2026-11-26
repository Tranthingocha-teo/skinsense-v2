"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  Stethoscope,
  Store,
  ArrowLeft,
  Save,
  MapPin,
  Phone,
  Mail,
  Award,
  Star,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Camera,
  Building,
  FileText,
  BadgeCheck,
  Edit3,
  X,
  XCircle,
  ShoppingBag,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { InitialsAvatar } from "@/components/initials-avatar";
import { SafeProductImage } from "@/components/safe-product-image";
import { normalizeShopId } from "@/lib/shop-utils";
import { pingChatSync, useChatSync, useStickToBottom } from "@/hooks/use-chat-sync";
import { ImageUploader } from "@/components/cloudinary-product-uploader";

export type RoleType = "customer" | "specialist" | "shop" | "admin";

export interface ChatMessageItem {
  id: string;
  sender: "shop" | "user";
  senderName?: string;
  text: string;
  time: string;
  createdAt?: string;
}

export interface ChatThreadItem {
  id: string;
  shopId: string;
  shopName: string;
  userId: string;
  userName: string;
  orderCode?: string;
  messages: ChatMessageItem[];
  updatedAt?: string;
}

const CHAT_POLL_INTERVAL_MS = 2000;

/** Server messages win; local optimistic temp_* messages not yet acknowledged are kept at the end. */
function mergeServerMessages(
  prev: ChatMessageItem[],
  server: ChatMessageItem[],
): ChatMessageItem[] {
  const pending = prev.filter((m) => m.id.startsWith("temp_"));
  const next = pending.length > 0 ? [...server, ...pending] : server;
  const sameAsPrev =
    next.length === prev.length &&
    next.every((m, i) => m.id === prev[i].id && m.text === prev[i].text);
  return sameAsPrev ? prev : next;
}

/** Cheap change signature for the shop inbox: thread ids + last message id + updatedAt. */
function shopThreadsSignature(threads: ChatThreadItem[]): string {
  return threads
    .map((t) => {
      const last = t.messages?.[t.messages.length - 1];
      return `${t.id}:${t.updatedAt ?? ""}:${last?.id ?? ""}:${t.messages?.length ?? 0}`;
    })
    .join("|");
}

function createLocalMessageId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatCurrentTimeHHMM(): string {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
}

interface RoleConfig {
  role: RoleType;
  title: string;
  roleBadge: string;
  badgeClass: string;
  primaryColor: string;
  backHref: string;
  backLabel: string;
  portalHref: string;
  portalLabel: string;
  icon: typeof User;
}

const ROLE_SETTINGS: Record<RoleType, RoleConfig> = {
  customer: {
    role: "customer",
    title: "Hồ Sơ Người Dùng",
    roleBadge: "Khách Hàng Thân Thiết",
    badgeClass: "bg-[#2D5A43]/10 text-[#2D5A43] border-[#2D5A43]/30",
    primaryColor: "#2D5A43",
    backHref: "/products",
    backLabel: "Cửa hàng SkinSense",
    portalHref: "/user/routine",
    portalLabel: "Xem Phác Đồ Routine",
    icon: User,
  },
  specialist: {
    role: "specialist",
    title: "Hồ Sơ Bác Sĩ Chuyên Khoa",
    roleBadge: "Bác Sĩ CCHN Bộ Y Tế",
    badgeClass: "bg-[#2D5A43]/10 text-[#2D5A43] border-[#2D5A43]/30",
    primaryColor: "#2D5A43",
    backHref: "/specialist",
    backLabel: "Cổng Bác Sĩ",
    portalHref: "/specialist",
    portalLabel: "Vào Cổng Khám Bệnh",
    icon: Stethoscope,
  },
  shop: {
    role: "shop",
    title: "Hồ Sơ Cửa Hàng (Shop)",
    roleBadge: "SkinSense Mall",
    badgeClass: "bg-[#C2410C]/10 text-[#C2410C] border-[#C2410C]/30",
    primaryColor: "#C2410C",
    backHref: "/shop",
    backLabel: "Kênh Bán Hàng",
    portalHref: "/shop",
    portalLabel: "Quản Lý Gian Hàng",
    icon: Store,
  },
  admin: {
    role: "admin",
    title: "Hồ Sơ Quản Trị Viên",
    roleBadge: "Super Admin Cấp Cao",
    badgeClass: "bg-[#2D5A43]/10 text-[#2D5A43] border-[#2D5A43]/30",
    primaryColor: "#2D5A43",
    backHref: "/admin",
    backLabel: "Admin Dashboard",
    portalHref: "/admin",
    portalLabel: "Vào Bảng Quản Trị",
    icon: ShieldCheck,
  },
};

interface OrderReview {
  rating: number;
  comment: string;
  tags: string[];
  createdAt: string;
}

interface UserOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: "pending" | "processing" | "delivering" | "delivered" | "cancelled";
  paymentMethod: "momo" | "cod" | "vietqr" | "card";
  paymentStatus: "unpaid" | "paid";
  shopName: string;
  brand: string;
  carrier: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variant: string;
    image?: string;
  }>;
  review?: OrderReview;
  paidAt?: string;
  createdAt: string;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })}`;
  } catch {
    return iso;
  }
}

export function RoleProfileView({ role }: { role: RoleType }) {
  const cfg = ROLE_SETTINGS[role];

  // Tab điều hướng: "profile" (Hồ sơ), "orders" (Đơn hàng), "messages" (Tin nhắn cho Shop)
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "messages">("profile");
  // /user/profile?tab=orders (the app's "Orders" tab) or ?tab=messages opens that tab directly.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "orders" || tab === "messages") setActiveTab(tab);
  }, []);

  // Trạng thái Chế độ xem nhãn (Label Mode) hay Chế độ chỉnh sửa (Edit Mode)
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Role Specific States
  // Customer
  const [custAddress, setCustAddress] = useState("");
  const [custSkinType, setCustSkinType] = useState("");
  const [custAllergies, setCustAllergies] = useState("");

  // Specialist
  const [specHospital, setSpecHospital] = useState("");
  const [specLicense, setSpecLicense] = useState("");
  const [specSpecialty, setSpecSpecialty] = useState("");
  const [specExpYears, setSpecExpYears] = useState("10");
  const [specBio, setSpecBio] = useState("");

  // Shop
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopLicense, setShopLicense] = useState("");
  const [shopCategory, setShopCategory] = useState("");

  // Orders State (Cho riêng Customer)
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [nowMs, setNowMs] = useState<number>(0);

  // Load Profile từ API
  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/profile?role=${role}`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.user) {
        const u = data.user;
        setUserId(u.id || "");
        setFullName(u.fullName || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setAvatarUrl(u.avatarUrl || "");

        if (role === "customer" && u.customer) {
          setCustAddress(u.customer.address || "");
          setCustSkinType(u.customer.skinType || "");
          setCustAllergies(u.customer.allergies || "");
        } else if (role === "specialist" && u.specialist) {
          setSpecHospital(u.specialist.hospital || "");
          setSpecLicense(u.specialist.licenseNumber || "");
          setSpecSpecialty(u.specialist.specialty || "");
          setSpecExpYears(u.specialist.experienceYears ? String(u.specialist.experienceYears) : "");
          setSpecBio(u.specialist.bio || "");
        } else if (role === "shop" && u.shop) {
          setShopName(u.shop.shopName || "");
          setShopAddress(u.shop.address || "");
          setShopLicense(u.shop.license || "");
          setShopCategory(u.shop.category || "");
        }

        // Nếu là Customer hoặc Shop thì tải luôn danh sách đơn hàng cho đúng user này
        if (role === "customer" || role === "shop") {
          loadUserOrders(
            role === "shop" ? u.shop?.shopName || u.fullName || "" : u.fullName || "",
            u.phone || "",
          );
          if (role === "shop") {
            void loadShopThreads();
          }
        }
      }
    } catch {
      toast.error("Không thể tải thông tin hồ sơ.");
    } finally {
      setLoading(false);
    }
  }

  // Tải danh sách đơn hàng dành riêng cho user hoặc gian hàng này
  async function loadUserOrders(targetName: string, userPhone: string) {
    try {
      setOrdersLoading(true);
      const query =
        role === "shop"
          ? `role=shop&shopName=${encodeURIComponent(targetName)}`
          : `role=customer&name=${encodeURIComponent(targetName)}&phone=${encodeURIComponent(userPhone)}`;
      const res = await fetch(`/api/user/orders?${query}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok && Array.isArray(json.orders)) {
        setOrders(json.orders);
      }
    } catch {
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setOrdersLoading(false);
    }
  }

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<UserOrder | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSelectedTags, setReviewSelectedTags] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewMode, setReviewMode] = useState<"create" | "view">("create");

  // Shopee Live Chat State (Phía Customer)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatOrder, setChatOrder] = useState<UserOrder | null>(null);
  const [activeChatShopId, setActiveChatShopId] = useState<string>("skinsense_mall");
  const [activeChatShopName, setActiveChatShopName] = useState<string>("Gian hàng SkinSense Mall");
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isShopTyping, setIsShopTyping] = useState(false);
  const [chatAuthRequired, setChatAuthRequired] = useState(false);

  // Shop Owner Messages Management State (Dành cho Role Shop)
  const [shopThreads, setShopThreads] = useState<ChatThreadItem[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [shopReplyInput, setShopReplyInput] = useState<string>("");
  const [shopReplySending, setShopReplySending] = useState(false);
  const [shopChatAuthRequired, setShopChatAuthRequired] = useState(false);

  // Mỗi lần gửi/tải lại tăng version: kết quả poll bắt đầu trước đó bị bỏ qua (tránh ghi đè dữ liệu mới)
  const shopSyncVersionRef = useRef(0);
  const shopReplyInFlightRef = useRef(false);

  // Shop chỉ đọc hộp thư của chính gian hàng mình: server suy ra shop từ phiên đăng nhập
  async function fetchShopThreads(signal?: AbortSignal): Promise<ChatThreadItem[] | null> {
    const res = await fetch("/api/chat?forShop=true", { cache: "no-store", signal });
    if (res.status === 401 || res.status === 403) {
      if (!signal?.aborted) {
        setShopChatAuthRequired(true);
        setShopThreads([]);
      }
      return null;
    }
    const data = await res.json();
    if (signal?.aborted) return null;
    setShopChatAuthRequired(false);
    return data.ok && Array.isArray(data.threads) ? (data.threads as ChatThreadItem[]) : null;
  }

  function applyShopThreads(threads: ChatThreadItem[]) {
    setShopThreads((prev) =>
      shopThreadsSignature(prev) === shopThreadsSignature(threads) ? prev : threads,
    );
    setSelectedThreadId((prev) =>
      prev && threads.some((t) => t.id === prev) ? prev : threads[0]?.id ?? "",
    );
  }

  // Tải các cuộc hội thoại dành cho Shop
  async function loadShopThreads() {
    const version = ++shopSyncVersionRef.current;
    try {
      const threads = await fetchShopThreads();
      if (threads && version === shopSyncVersionRef.current) applyShopThreads(threads);
    } catch {}
  }

  // Realtime Live Chat cho Chủ Shop: poll + đồng bộ chéo tab, không cần F5
  useChatSync<{ version: number; threads: ChatThreadItem[] }>({
    enabled: role === "shop" && activeTab === "messages" && !shopChatAuthRequired,
    intervalMs: CHAT_POLL_INTERVAL_MS,
    fetcher: async (signal) => {
      const version = shopSyncVersionRef.current;
      const threads = await fetchShopThreads(signal);
      return threads ? { version, threads } : null;
    },
    onData: ({ version, threads }) => {
      if (shopReplyInFlightRef.current || version !== shopSyncVersionRef.current) return;
      applyShopThreads(threads);
    },
  });

  const activeShopThread =
    shopThreads.find((t) => t.id === selectedThreadId) || shopThreads[0];
  const activeShopThreadLast = activeShopThread?.messages?.[activeShopThread.messages.length - 1];
  const shopChatListRef = useRef<HTMLDivElement | null>(null);
  const handleShopChatScroll = useStickToBottom(
    shopChatListRef,
    activeTab === "messages" ? activeShopThread?.id ?? "" : "",
    activeShopThreadLast?.id ?? "",
    activeShopThreadLast?.sender === "shop",
  );

  // Shop gửi phản hồi trực tiếp cho khách hàng
  async function handleSendShopReply() {
    if (!shopReplyInput.trim() || !selectedThreadId) return;
    const activeThread = shopThreads.find((t) => t.id === selectedThreadId);
    if (!activeThread) return;

    shopReplyInFlightRef.current = true;
    shopSyncVersionRef.current++;
    try {
      setShopReplySending(true);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: activeThread.shopId,
          shopName: activeThread.shopName || shopName || "Gian Hàng Mall",
          userId: activeThread.userId,
          userName: activeThread.userName,
          sender: "shop",
          senderName: shopName || activeThread.shopName || "Gian Hàng Mall",
          text: shopReplyInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.thread) {
        toast.success("Đã gửi phản hồi thành công đến khách hàng!");
        setShopReplyInput("");
        setShopThreads((prev) =>
          prev.map((t) => (t.id === activeThread.id ? (data.thread as ChatThreadItem) : t))
        );
        // Ping các tab khác sau khi server đã lưu tin nhắn
        pingChatSync();
      } else {
        toast.error(data.error || "Không thể gửi phản hồi.");
      }
    } catch {
      toast.error("Lỗi khi gửi phản hồi.");
    } finally {
      shopReplyInFlightRef.current = false;
      shopSyncVersionRef.current++;
      setShopReplySending(false);
    }
  }

  // Like tương tác đánh giá cộng đồng


  // Cập nhật trạng thái đơn hàng (Khách xác nhận đã nhận / Shop duyệt & chuẩn bị / Hủy)
  async function handleUpdateOrderStatus(
    orderCode: string,
    newStatus: UserOrder["status"],
  ) {
    try {
      const res = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          orderCode,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const serverOrder = data.order as UserOrder | undefined;
        setOrders((prev) =>
          prev.map((o) =>
            o.orderCode.toLowerCase() === orderCode.toLowerCase()
              ? serverOrder
                ? { ...o, ...serverOrder }
                : { ...o, status: newStatus }
              : o,
          ),
        );
        if (newStatus === "delivered") {
          toast.success("Đã xác nhận nhận hàng thành công! Hãy gửi đánh giá nhé.");
        } else if (newStatus === "cancelled") {
          toast.info("Đã hủy đơn hàng thành công.");
        } else if (newStatus === "processing") {
          toast.success("Shop đã phê duyệt và bắt đầu đóng gói đơn hàng.");
        } else if (newStatus === "delivering") {
          toast.success("Đã bàn giao đơn hàng cho đơn vị vận chuyển.");
        } else {
          toast.success("Cập nhật trạng thái đơn hàng thành công!");
        }
      } else {
        toast.error(data.error || "Không thể cập nhật trạng thái đơn hàng.");
      }
    } catch {
      toast.error("Lỗi kết nối khi cập nhật đơn hàng.");
    }
  }

  // Mở modal viết hoặc xem đánh giá
  function handleOpenReviewModal(order: UserOrder, mode: "create" | "view" = "create") {
    setReviewOrder(order);
    setReviewMode(mode);
    if (order.review) {
      setReviewRating(order.review.rating || 5);
      setReviewComment(order.review.comment || "");
      setReviewSelectedTags(order.review.tags || []);
    } else {
      setReviewRating(5);
      setReviewComment("");
      setReviewSelectedTags(["⭐ Sản phẩm chính hãng 100%", "📦 Đóng gói cẩn thận"]);
    }
  }

  // Gửi đánh giá sản phẩm
  async function handleSubmitReview() {
    if (!reviewOrder) return;
    try {
      setReviewSubmitting(true);
      const res = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_review",
          orderCode: reviewOrder.orderCode,
          review: {
            rating: reviewRating,
            comment: reviewComment,
            tags: reviewSelectedTags,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const serverOrder = data.order as UserOrder | undefined;
        toast.success("Cảm ơn bạn đã gửi đánh giá sản phẩm!");
        setOrders((prev) =>
          prev.map((o) =>
            o.orderCode.toLowerCase() === reviewOrder.orderCode.toLowerCase()
              ? serverOrder
                ? { ...o, ...serverOrder }
                : {
                    ...o,
                    review: {
                      rating: reviewRating,
                      comment: reviewComment,
                      tags: reviewSelectedTags,
                      createdAt: new Date().toISOString(),
                    },
                  }
              : o,
          ),
        );
        setReviewOrder(null);
      } else {
        toast.error(data.error || "Không thể gửi đánh giá.");
      }
    } catch {
      toast.error("Lỗi kết nối khi gửi đánh giá.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  // Shop đang mở trong khung chat (ref để bỏ qua phản hồi của shop cũ khi khách đổi shop)
  const chatShopRef = useRef(activeChatShopId);
  const chatSyncVersionRef = useRef(0);
  const chatSendInFlightRef = useRef(false);

  // Realtime Live Chat cho Khách Hàng: server suy ra khách từ phiên đăng nhập, không gửi userId
  useChatSync<{ version: number; shopId: string; messages: ChatMessageItem[] }>({
    enabled: isChatOpen && !chatAuthRequired,
    key: activeChatShopId,
    intervalMs: CHAT_POLL_INTERVAL_MS,
    // loadChatThreadForShop already fetches when the chat opens or the shop changes
    immediate: false,
    fetcher: async (signal) => {
      const version = chatSyncVersionRef.current;
      const shopId = activeChatShopId;
      const res = await fetch(`/api/chat?shopId=${encodeURIComponent(shopId)}`, {
        cache: "no-store",
        signal,
      });
      if (res.status === 401) {
        if (!signal.aborted) setChatAuthRequired(true);
        return null;
      }
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.thread?.messages)) return null;
      return { version, shopId, messages: data.thread.messages as ChatMessageItem[] };
    },
    onData: ({ version, shopId, messages }) => {
      // Trong lúc gửi (đang hiện "Shop đang soạn tin") không áp dụng kết quả poll,
      // để tin trả lời tự động chỉ hiện khi POST đã xong.
      if (
        chatSendInFlightRef.current ||
        version !== chatSyncVersionRef.current ||
        shopId !== chatShopRef.current
      ) {
        return;
      }
      setChatMessages((prev) => mergeServerMessages(prev, messages));
    },
  });

  const customerChatLast = chatMessages[chatMessages.length - 1];
  const customerChatListRef = useRef<HTMLDivElement | null>(null);
  const handleCustomerChatScroll = useStickToBottom(
    customerChatListRef,
    isChatOpen ? activeChatShopId : "",
    customerChatLast?.id ?? "",
    customerChatLast?.sender === "user",
  );

  // Tải lịch sử hội thoại cho đúng Shop đang chọn (tách biệt theo từng Shop)
  async function loadChatThreadForShop(
    shopId: string,
    shopDisplayName: string,
    order?: UserOrder | null,
  ) {
    chatShopRef.current = shopId;
    chatSyncVersionRef.current++;
    setActiveChatShopId(shopId);
    setActiveChatShopName(shopDisplayName);

    const buildWelcomeMessages = (): ChatMessageItem[] => {
      const welcomeText = order
        ? `Xin chào bạn! Cảm ơn bạn đã mua sắm tại ${shopDisplayName}. Shop có thể hỗ trợ gì cho đơn hàng ${order.orderCode} của bạn ạ?`
        : `Xin chào bạn! Cảm ơn bạn đã liên hệ gian hàng chính hãng ${shopDisplayName}. Shop có thể hỗ trợ tư vấn dược mỹ phẩm gì cho bạn ạ?`;
      return [
        {
          id: createLocalMessageId("init"),
          sender: "shop",
          text: welcomeText,
          time: formatCurrentTimeHHMM(),
        },
      ];
    };
    // Bỏ qua phản hồi đến muộn nếu khách đã chuyển sang shop khác
    const isStale = () => chatShopRef.current !== shopId;

    try {
      const res = await fetch(`/api/chat?shopId=${encodeURIComponent(shopId)}`, {
        cache: "no-store",
      });
      if (isStale()) return;
      if (res.status === 401) {
        setChatAuthRequired(true);
        setChatMessages(buildWelcomeMessages());
        return;
      }
      const data = await res.json();
      if (isStale()) return;
      setChatAuthRequired(false);
      if (data.ok && data.thread && Array.isArray(data.thread.messages)) {
        setChatMessages(data.thread.messages as ChatMessageItem[]);
      } else {
        setChatMessages(buildWelcomeMessages());
      }
    } catch {
      if (!isStale()) setChatMessages(buildWelcomeMessages());
    }
  }

  // Mở chat với Shop (TÁCH BIỆT THEO TỪNG SHOP)
  async function openChatWithShop(order?: UserOrder) {
    const sName = order?.shopName || "SkinSense Mall";
    const sId = normalizeShopId(sName);
    setChatOrder(order || null);
    setIsChatOpen(true);
    await loadChatThreadForShop(sId, sName, order || null);
  }

  // Khách hàng gửi tin nhắn chat đến đúng Shop
  async function handleSendChatMessage(customText?: string) {
    const text = (customText || chatInput).trim();
    if (!text) return;

    const shopId = activeChatShopId;
    const tempId = createLocalMessageId("temp");
    const tempUserMsg: ChatMessageItem = {
      id: tempId,
      sender: "user",
      text,
      time: formatCurrentTimeHHMM(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);
    setChatInput("");
    setIsShopTyping(true);
    chatSendInFlightRef.current = true;
    chatSyncVersionRef.current++;

    try {
      // Không gửi userId: server lấy khách hàng từ phiên đăng nhập
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          shopName: activeChatShopName,
          orderCode: chatOrder?.orderCode,
          sender: "user",
          text,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (!customText) setChatInput(text);
        if (res.status === 401) setChatAuthRequired(true);
        toast.error(data.error || "Không thể gửi tin nhắn.");
        return;
      }
      setChatAuthRequired(false);
      if (chatShopRef.current === shopId && data.thread && Array.isArray(data.thread.messages)) {
        const serverMessages = data.thread.messages as ChatMessageItem[];
        setChatMessages((prev) =>
          mergeServerMessages(prev.filter((m) => m.id !== tempId), serverMessages),
        );
      }
      // Ping các tab khác sau khi server đã lưu tin nhắn
      pingChatSync();
    } catch {
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Lỗi kết nối khi gửi tin nhắn.");
    } finally {
      chatSendInFlightRef.current = false;
      chatSyncVersionRef.current++;
      setIsShopTyping(false);
    }
  }

  useEffect(() => {
    loadData();
    const rafId = window.requestAnimationFrame(() => setNowMs(Date.now()));
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearInterval(intervalId);
    };
  }, [role]);

  // Lưu thông tin trực tiếp vào CSDL Supabase
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        id: userId,
        email,
        role,
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim(),
        phone: phone.trim(),
      };

      if (role === "customer") {
        payload.customer = {
          address: custAddress.trim(),
          skinType: custSkinType.trim(),
          allergies: custAllergies.trim(),
        };
      } else if (role === "specialist") {
        payload.specialist = {
          hospital: specHospital.trim(),
          licenseNumber: specLicense.trim(),
          specialty: specSpecialty.trim(),
          experienceYears: Number(specExpYears) || 5,
          bio: specBio.trim(),
        };
      } else if (role === "shop") {
        payload.shop = {
          shopName: shopName.trim(),
          address: shopAddress.trim(),
          license: shopLicense.trim(),
          category: shopCategory.trim(),
        };
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.ok) {
        toast.success(`Đã cập nhật hồ sơ thành công vào cơ sở dữ liệu!`);
        setIsEditing(false); // Quay về chế độ Label sau khi lưu
      } else {
        toast.error(result.error || "Lưu thất bại!");
      }
    } catch {
      toast.error("Lỗi kết nối khi cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  // Lọc danh sách đơn hàng theo trạng thái (kèm bộ lọc Chuẩn Bị Hàng & Đã Hủy)
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "pending") return (o.status === "pending" || o.paymentStatus === "unpaid") && o.status !== "cancelled";
    if (orderFilter === "processing") return o.status === "processing";
    if (orderFilter === "delivering") return o.status === "delivering";
    if (orderFilter === "delivered") return o.status === "delivered";
    if (orderFilter === "cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#E8E5DE] text-[#191B19] antialiased">
      {/* HEADER TƯƠNG ĐỒNG VỚI HỆ THỐNG SKINSENSE */}
      <header className="sticky top-0 z-30 border-b border-[#D8D4CA] bg-[#E8E5DE]/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={cfg.backHref}
              className="flex size-9 items-center justify-center rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] text-[#5C605C] hover:border-[#191B19] hover:text-[#191B19] transition"
              title={`Quay lại ${cfg.backLabel}`}
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-[#191B19] leading-tight flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{cfg.title}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${cfg.badgeClass}`}>
                  <BadgeCheck className="size-3" />
                  {cfg.roleBadge}
                </span>
              </h1>
              <p className="hidden text-xs text-[#5C605C] sm:block">
                Quản lý thông tin định danh cá nhân & thiết lập tài khoản
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {role === "customer" && (
              <Link
                href="/products"
                className="flex items-center gap-1.5 h-9 rounded-xl border border-[#C2410C]/40 bg-[#C2410C]/10 px-3.5 text-xs font-bold text-[#C2410C] hover:bg-[#C2410C] hover:text-white transition shadow-2xs"
                title="Khám phá danh sách dược mỹ phẩm chính hãng"
              >
                <ShoppingBag className="size-3.5" />
                <span>Cửa Hàng Mua Sắm</span>
              </Link>
            )}
            {role === "shop" && (
              <Link
                href="/shop"
                className="flex items-center gap-1.5 h-9 rounded-xl border border-[#C2410C]/40 bg-[#C2410C]/10 px-3.5 text-xs font-bold text-[#C2410C] hover:bg-[#C2410C] hover:text-white transition shadow-2xs"
                title="Xem danh sách quản lý sản phẩm của gian hàng"
              >
                <Package className="size-3.5" />
                <span>Danh Sách Sản Phẩm Shop</span>
              </Link>
            )}
            {activeTab === "profile" && (
              <>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 min-h-10 whitespace-nowrap rounded-xl bg-[#2D5A43] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#214332] transition cursor-pointer"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Chỉnh Sửa Hồ Sơ</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      loadData();
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-1.5 h-9 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] px-3.5 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition cursor-pointer"
                  >
                    <X className="size-3.5" />
                    <span>Hủy Chỉnh Sửa</span>
                  </button>
                )}
              </>
            )}

            <Link
              href={cfg.portalHref}
              className="hidden sm:flex items-center gap-1.5 h-9 rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3 text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition"
            >
              <span>{cfg.portalLabel}</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        {/* NẾU LÀ CUSTOMER HOẶC SHOP: HIỆN 2 TAB ĐIỀU HƯỚNG "HỒ SƠ" VÀ "ĐƠN HÀNG" */}
        {(role === "customer" || role === "shop") && (
          <div className="border-t border-[#D8D4CA]/70 bg-[#FAF8F5]/80 px-4 sm:px-6">
            <div className="mx-auto max-w-6xl flex items-center gap-2 py-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-[#2D5A43] text-white shadow-xs"
                    : "text-[#5C605C] hover:bg-white hover:text-[#191B19]"
                }`}
              >
                {role === "shop" ? <Store className="size-3.5" /> : <User className="size-3.5" />}
                <span>{role === "shop" ? "Thông Tin Gian Hàng" : "Thông Tin Cá Nhân"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-[#2D5A43] text-white shadow-xs"
                    : "text-[#5C605C] hover:bg-white hover:text-[#191B19]"
                }`}
              >
                <ShoppingBag className="size-3.5" />
                <span>{role === "shop" ? "Quản Lý Đơn Hàng Shop Mall" : "Đơn Mua Của Tôi"}</span>
                <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                  activeTab === "orders" ? "bg-white text-[#2D5A43]" : "bg-[#2D5A43]/15 text-[#2D5A43]"
                }`}>
                  {orders.length}
                </span>
              </button>

              {role === "shop" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("messages")}
                  className={`flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === "messages"
                      ? "bg-[#2D5A43] text-white shadow-xs"
                      : "text-[#5C605C] hover:bg-white hover:text-[#191B19]"
                  }`}
                >
                  <MessageSquare className="size-3.5" />
                  <span>Tin Nhắn Khách Hàng</span>
                  <span
                    className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                      activeTab === "messages"
                        ? "bg-white text-[#2D5A43]"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {shopThreads.length > 0 ? shopThreads.length : "Live"}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* THÂN TRANG */}
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
            <RefreshCw className="size-7 animate-spin text-[#2D5A43]" />
            <p className="text-xs font-semibold text-[#5C605C]">Đang tải hồ sơ từ Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ============================================================= */}
            {/* CỘT TRÁI: THẺ ĐẠI DIỆN HỒ SƠ & CHỈ SỐ HOẠT ĐỘNG (4 COLS)     */}
            {/* ============================================================= */}
            <div className="lg:col-span-4 space-y-6">
              {/* Thẻ Avatar & Định danh */}
              <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 shadow-xs text-center relative overflow-hidden">
                <div className="relative mx-auto size-24 rounded-full border-2 border-[#D8D4CA] shadow-sm overflow-hidden bg-white">
                  <InitialsAvatar name={fullName || email || "?"} seed={email} src={avatarUrl} label={fullName} className="size-full text-2xl" />
                </div>

                <h2 className="mt-3.5 text-lg font-bold text-[#191B19] leading-snug">
                  {fullName || "Người dùng"}
                </h2>
                <p className="text-xs text-[#5C605C] mt-0.5">{email}</p>

                <div className="mt-3 flex items-center justify-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${cfg.badgeClass}`}>
                    <cfg.icon className="size-3.5" />
                    <span>{cfg.roleBadge}</span>
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#D8D4CA]/60 flex items-center justify-between text-xs text-[#5C605C]">
                  <span>Trạng thái tài khoản:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Đang hoạt động
                  </span>
                </div>
              </div>

              {/* Thẻ Chỉ số hoạt động riêng cho Role */}
              {(role === "customer" || role === "shop") && (
              <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-5 shadow-xs space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C605C] flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#2D5A43]" />
                  <span>Chỉ số hoạt động</span>
                </h3>

                {/* Counted from the orders this page loaded. The tiles used to show fixed numbers
                    (12-day streak, 890 cases, 12.850+ sold) whatever the account had done. */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                    <div className="text-xl font-bold text-[#191B19]">{orders.length}</div>
                    <div className="text-[11px] text-[#5C605C] mt-0.5">{role === "shop" ? "Đơn hàng của shop" : "Đơn hàng"}</div>
                  </div>
                  <div className="rounded-xl border border-[#D8D4CA] bg-white p-3">
                    <div className="text-xl font-bold text-[#2D5A43]">{orders.filter((o) => o.status === "delivered").length}</div>
                    <div className="text-[11px] text-[#5C605C] mt-0.5">Đã giao thành công</div>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* ============================================================= */}
            {/* CỘT PHẢI: TAB HỒ SƠ HOẶC TAB DANH SÁCH ĐƠN HÀNG (8 COLS)       */}
            {/* ============================================================= */}
            <div className="lg:col-span-8">
              {/* =========================================================== */}
              {/* NẾU ĐANG CHỌN TAB "ĐƠN HÀNG" (CHO CUSTOMER HOẶC SHOP)     */}
              {/* =========================================================== */}
              {(role === "customer" || role === "shop") && activeTab === "orders" && (
                <div className="space-y-4">
                  {/* THANH BỘ LỌC TRẠNG THÁI ĐƠN HÀNG CHUẨN SHOPEE */}
                  <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-2.5 shadow-xs flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      {[
                        { key: "all", label: "Tất Cả" },
                        { key: "pending", label: "Chờ Thanh Toán" },
                        { key: "processing", label: "Chuẩn Bị Hàng" },
                        { key: "delivering", label: "Đang Vận Chuyển" },
                        { key: "delivered", label: "Đã Nhận Hàng" },
                        { key: "cancelled", label: "Đã Hủy" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setOrderFilter(tab.key)}
                          className={`h-8 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            orderFilter === tab.key
                              ? "bg-[#2D5A43] text-white shadow-2xs"
                              : "text-[#5C605C] hover:bg-white hover:text-[#191B19]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => loadUserOrders(fullName, phone)}
                      className="flex items-center gap-1 h-8 px-3 rounded-lg border border-[#D8D4CA] bg-white text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition"
                      title="Làm mới đơn hàng"
                    >
                      <RefreshCw className={`size-3 ${ordersLoading ? "animate-spin text-[#2D5A43]" : ""}`} />
                      <span>Làm mới</span>
                    </button>
                  </div>

                  {/* DANH SÁCH THẺ ĐƠN HÀNG (ORDER CARDS) */}
                  {ordersLoading ? (
                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-12 text-center">
                      <RefreshCw className="size-6 animate-spin text-[#2D5A43] mx-auto" />
                      <p className="text-xs font-semibold text-[#5C605C] mt-2">Đang tải đơn hàng của bạn...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-12 text-center space-y-3">
                      <ShoppingBag className="size-12 text-[#D8D4CA] mx-auto stroke-1" />
                      <h4 className="text-sm font-bold text-[#191B19]">Chưa có đơn hàng nào</h4>
                      <p className="text-xs text-[#5C605C] max-w-sm mx-auto">
                        Bạn chưa có đơn hàng nào trong mục này. Hãy ghé qua SkinSense Mall để chọn mua sản phẩm chăm sóc da nhé!
                      </p>
                      <Link
                        href="/products"
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#2D5A43] text-xs font-bold text-white shadow-xs hover:bg-[#214332] transition"
                      >
                        <ShoppingBag className="size-3.5" />
                        <span>Mua Sắm Ngay</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {filteredOrders.map((order) => {
                        const isPaid = order.paymentStatus === "paid";
                        const isCancelled = order.status === "cancelled";
                        const isPending = (order.status === "pending" || !isPaid) && !isCancelled;

                        // Tính thời gian còn lại trước khi đơn hàng hết hạn 3 ngày
                        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
                        const createdMs = new Date(order.createdAt).getTime();
                        const elapsedMs =
                          nowMs > 0 && !Number.isNaN(createdMs)
                            ? Math.max(0, nowMs - createdMs)
                            : 0;
                        const remainingHours = Math.max(1, Math.floor((THREE_DAYS_MS - elapsedMs) / (1000 * 60 * 60)));

                        return (
                          <div
                            key={order.id}
                            className={`rounded-2xl border overflow-hidden shadow-xs transition ${
                              isCancelled
                                ? "border-[#D8D4CA] bg-[#FAF8F5]/60 opacity-90"
                                : "border-[#D8D4CA] bg-[#FAF8F5] hover:border-[#2D5A43]/40"
                            }`}
                          >
                            {/* HEADER ĐƠN: TÊN SHOP, NÚT CHAT VỚI SHOP & TRẠNG THÁI */}
                            <div className="border-b border-[#D8D4CA] bg-white px-5 py-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-2.5 font-bold text-[#191B19]">
                                <div className="flex items-center gap-1.5">
                                  <Store className="size-3.5 text-[#C2410C]" />
                                  <span>{order.shopName || "Gian hàng SkinSense Mall"}</span>
                                  <span className="rounded bg-rose-600 px-1.5 py-0.2 text-[9px] text-white font-bold">
                                    Mall
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openChatWithShop(order)}
                                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-[#D8D4CA] bg-[#FAF8F5] text-[11px] font-semibold text-[#2D5A43] hover:border-[#2D5A43] hover:bg-[#2D5A43]/5 transition shadow-2xs cursor-pointer"
                                  title="Chat trực tiếp với Shop"
                                >
                                  <MessageSquare className="size-3" />
                                  <span>Chat Shop</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-[#5C605C]">
                                  {order.orderCode}
                                </span>
                                <span className="h-3 w-px bg-[#D8D4CA]" />
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${
                                    isCancelled
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : order.status === "delivered"
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      : order.status === "delivering"
                                      ? "bg-sky-50 text-sky-800 border-sky-300"
                                      : order.status === "processing"
                                      ? "bg-blue-50 text-blue-800 border-blue-300"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {isCancelled ? (
                                    <>
                                      <XCircle className="size-3" />
                                      <span>Đã Hủy</span>
                                    </>
                                  ) : order.status === "delivered" ? (
                                    <>
                                      <CheckCircle2 className="size-3 text-emerald-600" />
                                      <span>Giao Thành Công</span>
                                    </>
                                  ) : order.status === "delivering" ? (
                                    <>
                                      <Truck className="size-3 text-sky-600 animate-pulse" />
                                      <span>Đang Vận Chuyển</span>
                                    </>
                                  ) : order.status === "processing" ? (
                                    <>
                                      <Store className="size-3 text-blue-600" />
                                      <span>Shop Đang Chuẩn Bị</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="size-3 animate-pulse text-amber-600" />
                                      <span>Chờ thanh toán</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* THANH TIẾN TRÌNH THEO DÕI ĐƠN HÀNG CHUẨN SHOPEE (STEPPER TIMELINE) */}
                            {!isCancelled ? (
                              <div className="border-b border-[#D8D4CA]/60 bg-gradient-to-b from-[#FAF8F5] to-white px-4 sm:px-6 py-4">
                                <div className="text-[11px] font-bold text-[#5C605C] uppercase tracking-wider mb-3 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-[#2D5A43]">
                                    <Truck className="size-3.5" />
                                    Tiến trình vận đơn
                                  </span>
                                  <span className="font-mono text-[10px] text-[#5C605C]">
                                    Mã vận đơn: SS-VN{order.orderCode.replace(/\D/g, "") || "982101"}
                                  </span>
                                </div>

                                <div className="relative flex items-center justify-between max-w-xl mx-auto px-2">
                                  {/* Line ngầm */}
                                  <div className="absolute left-6 right-6 top-4 h-0.5 bg-[#E5E0D8]" />
                                  {/* Line tiến độ màu xanh */}
                                  <div
                                    className="absolute left-6 top-4 h-0.5 bg-emerald-600 transition-all duration-500"
                                    style={{
                                      width:
                                        order.status === "pending"
                                          ? "0%"
                                          : order.status === "processing"
                                          ? "33%"
                                          : order.status === "delivering"
                                          ? "66%"
                                          : "calc(100% - 48px)",
                                    }}
                                  />

                                  {[
                                    { key: "pending", label: "Đã Đặt Đơn", desc: "Chờ xác nhận", icon: Package, activeIf: ["pending", "processing", "delivering", "delivered"] },
                                    { key: "processing", label: "Chuẩn Bị Hàng", desc: "Shop đóng gói", icon: Store, activeIf: ["processing", "delivering", "delivered"] },
                                    { key: "delivering", label: "Đang Giao", desc: "Đang vận chuyển", icon: Truck, activeIf: ["delivering", "delivered"] },
                                    { key: "delivered", label: "Đã Nhận Hàng", desc: "Giao thành công", icon: CheckCircle2, activeIf: ["delivered"] },
                                  ].map((step, sIdx) => {
                                    const isReached = step.activeIf.includes(order.status);
                                    const isCurrent = (
                                      (order.status === "pending" && sIdx === 0) ||
                                      (order.status === "processing" && sIdx === 1) ||
                                      (order.status === "delivering" && sIdx === 2) ||
                                      (order.status === "delivered" && sIdx === 3)
                                    );
                                    const IconComponent = step.icon;

                                    return (
                                      <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
                                        <div
                                          className={`size-8 rounded-full flex items-center justify-center transition-all ${
                                            isReached
                                              ? "bg-emerald-600 text-white shadow-xs scale-105 ring-4 ring-emerald-100"
                                              : "bg-white border-2 border-[#D8D4CA] text-[#9CA3AF]"
                                          }`}
                                        >
                                          <IconComponent className="size-4" />
                                        </div>
                                        <span
                                          className={`text-xs font-bold mt-1.5 ${
                                            isCurrent ? "text-emerald-800" : isReached ? "text-[#191B19]" : "text-[#9CA3AF]"
                                          }`}
                                        >
                                          {step.label}
                                        </span>
                                        <span className="text-[10px] text-[#5C605C] hidden sm:block">
                                          {step.desc}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="border-b border-rose-200 bg-rose-50/70 px-5 py-2.5 flex items-center justify-between text-xs text-rose-800">
                                <div className="flex items-center gap-2 font-medium">
                                  <XCircle className="size-4 text-rose-600 shrink-0" />
                                  <span>Đơn hàng đã hủy</span>
                                </div>
                                <span className="text-[11px] text-rose-600">Đơn hàng không còn hiệu lực</span>
                              </div>
                            )}

                            {/* DANH SÁCH MẶT HÀNG TRONG ĐƠN (CÓ ẢNH THẬT SẮC NÉT) */}
                            <div className="p-5 divide-y divide-[#D8D4CA]/50 space-y-3">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((item, idx) => {
                                  return (
                                    <div key={idx} className="flex items-start justify-between gap-3 pt-2 first:pt-0">
                                      <div className="flex items-center gap-3">
                                        <div className="relative size-14 rounded-xl overflow-hidden border border-[#D8D4CA] bg-white shrink-0 shadow-2xs">
                                          <SafeProductImage
                                            src={item.image}
                                            alt={item.name}
                                            brand={order.brand}
                                            seed={item.id}
                                            className="size-full object-cover"
                                          />
                                        </div>
                                        <div>
                                          <h5 className="text-xs font-bold text-[#191B19] line-clamp-1">
                                            {item.name}
                                          </h5>
                                          <div className="text-[11px] text-[#5C605C] mt-0.5">
                                            Phân loại: <span className="font-medium text-[#191B19]">{item.variant || "Mặc định"}</span> | Số lượng: x{item.quantity}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="text-xs font-bold text-[#191B19]">
                                          {formatMoney(item.price * item.quantity)}
                                        </div>
                                        <div className="text-[10px] text-[#5C605C]">
                                          Đơn giá: {formatMoney(item.price)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-xs text-[#5C605C] py-2">
                                  Đơn hàng dược mỹ phẩm điều trị da chuyên sâu
                                </div>
                              )}
                            </div>

                            {/* CẢNH BÁO QUÁ HẠN 3 NGÀY HOẶC ĐÃ HỦY */}
                            {isPending && (
                              <div className="mx-5 mb-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2 text-xs font-medium text-amber-900 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="size-4 text-amber-600 animate-pulse shrink-0" />
                                  <span>
                                    Hạn thanh toán: còn <strong>{remainingHours} giờ</strong>
                                  </span>
                                </div>
                                <span className="text-[11px] text-amber-700/90 hidden sm:inline">
                                  (Đơn sẽ tự động hủy nếu quá 3 ngày chưa thanh toán)
                                </span>
                              </div>
                            )}

                            {isCancelled && (
                              <div className="mx-5 mb-3 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-medium text-rose-900 flex items-center gap-2">
                                <XCircle className="size-4 text-rose-600 shrink-0" />
                                <span>
                                  Đơn hàng này đã <strong>tự động hủy</strong> do quá thời hạn 3 ngày chưa thanh toán.
                                </span>
                              </div>
                            )}

                            {/* FOOTER ĐƠN: ĐƠN VỊ VẬN CHUYỂN, TỔNG TIỀN & CÁC NÚT THAO TÁC */}
                            <div className="border-t border-[#D8D4CA] bg-white px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
                              <div className="text-xs text-[#5C605C] flex items-center gap-2">
                                <Truck className="size-3.5 text-[#2D5A43]" />
                                <span>{order.carrier || "Giao nhanh"}</span>
                                <span className="text-[11px] text-[#9CA3AF]">•</span>
                                <span className="text-[11px] text-[#5C605C]">{formatDate(order.createdAt)}</span>
                              </div>

                              <div className="flex items-center gap-2.5 flex-wrap">
                                <div className="text-right mr-1">
                                  <span className="text-[11px] text-[#5C605C] mr-1.5">Thành tiền:</span>
                                  <strong className={`text-sm font-extrabold ${isCancelled ? "text-[#5C605C] line-through" : "text-[#C2410C]"}`}>
                                    {formatMoney(order.totalAmount)}
                                  </strong>
                                </div>

                                {/* NẾU LÀ SHOP VIEW: NÚT THAO TÁC DUYỆT & GIAO CỦA NGƯỜI BÁN */}
                                {role === "shop" && !isCancelled && (
                                  <>
                                    {order.status === "pending" && (isPaid || order.paymentMethod === "cod") && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOrderStatus(order.orderCode, "processing")}
                                        className="flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition cursor-pointer"
                                      >
                                        <Store className="size-3.5" />
                                        <span>Duyệt & Chuẩn Bị Hàng</span>
                                      </button>
                                    )}
                                    {order.status === "pending" && !isPaid && order.paymentMethod !== "cod" && (
                                      <span className="inline-flex items-center gap-1 h-8.5 px-3 rounded-xl border border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-800">
                                        Chờ khách thanh toán
                                      </span>
                                    )}
                                    {order.status === "processing" && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOrderStatus(order.orderCode, "delivering")}
                                        className="flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-sky-600 text-xs font-bold text-white shadow-2xs hover:bg-sky-700 transition cursor-pointer"
                                      >
                                        <Truck className="size-3.5" />
                                        <span>Giao Cho Shipper</span>
                                      </button>
                                    )}
                                    {order.status === "delivering" && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOrderStatus(order.orderCode, "delivered")}
                                        className="flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition cursor-pointer"
                                      >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>Đã Giao Thành Công</span>
                                      </button>
                                    )}
                                  </>
                                )}

                                {/* NẾU LÀ CUSTOMER VIEW: CÁC NÚT THAO TÁC KHÁCH HÀNG */}
                                {role === "customer" && (
                                  <>
                                    {/* 1. NÚT ĐÃ NHẬN ĐƯỢC HÀNG (KHI ĐANG GIAO) */}
                                    {order.status === "delivering" && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOrderStatus(order.orderCode, "delivered")}
                                        className="flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer"
                                      >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>Đã Nhận Được Hàng</span>
                                      </button>
                                    )}

                                    {/* 2. NÚT ĐÁNH GIÁ SẢN PHẨM (KHI ĐÃ GIAO THÀNH CÔNG) */}
                                    {order.status === "delivered" && (
                                      <>
                                        {order.review ? (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenReviewModal(order, "view")}
                                            className="flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                                          >
                                            <Star className="size-3.5 fill-amber-500 text-amber-500" />
                                            <span>Xem Đánh Giá ({order.review.rating}★)</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenReviewModal(order, "create")}
                                            className="flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-[#C2410C] text-xs font-bold text-white hover:bg-[#9A3412] transition shadow-xs cursor-pointer"
                                          >
                                            <Star className="size-3.5 fill-amber-300 text-amber-300" />
                                            <span>Viết Đánh Giá</span>
                                          </button>
                                        )}
                                      </>
                                    )}

                                    {/* 3. NÚT HỦY ĐƠN (KHI CHỜ THANH TOÁN HOẶC CHUẨN BỊ HÀNG) */}
                                    {(order.status === "pending" || order.status === "processing") && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOrderStatus(order.orderCode, "cancelled")}
                                        className="flex items-center gap-1 h-8.5 px-3 rounded-xl border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                      >
                                        <XCircle className="size-3" />
                                        <span>Hủy Đơn</span>
                                      </button>
                                    )}

                                    {/* 4. NÚT THANH TOÁN (KHI CHƯA THANH TOÁN) */}
                                    {isPending && (
                                      <Link
                                        href={`/shop/checkout?orderCode=${order.orderCode}&amount=${order.totalAmount}`}
                                        className="flex items-center gap-1 h-8.5 px-3.5 rounded-xl bg-[#C2410C] text-xs font-bold text-white shadow-2xs hover:bg-[#9A3412] transition"
                                      >
                                        <QrCode className="size-3" />
                                        <span>Thanh toán</span>
                                      </Link>
                                    )}

                                    {/* 5. NÚT MUA LẠI / ĐẶT LẠI */}
                                    {(order.status === "delivered" || isCancelled) && (
                                      <Link
                                        href="/products"
                                        className="flex items-center gap-1 h-8.5 px-3.5 rounded-xl border border-[#D8D4CA] bg-[#FAF8F5] text-xs font-bold text-[#191B19] hover:bg-white transition"
                                      >
                                        <span>{isCancelled ? "Đặt Lại Đơn Mới" : "Mua Lại"}</span>
                                      </Link>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================== */}
              {/* TAB 2: KÊNH CHAT TRỰC TIẾP KHÁCH HÀNG (DÀNH CHO SHOP)       */}
              {/* =========================================================== */}
              {role === "shop" && activeTab === "messages" && (
                <div className="rounded-2xl border border-[#D8D4CA] bg-white overflow-hidden shadow-xs">
                  {/* Header Chat Console */}
                  <div className="border-b border-[#D8D4CA] bg-[#FAF8F5] px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#191B19] flex items-center gap-2">
                        <MessageSquare className="size-4 text-[#2D5A43]" />
                        <span>Kênh Chat Trực Tiếp Khách Hàng (chat trực tiếp)</span>
                      </h3>
                      <p className="text-[11px] text-[#5C605C] mt-0.5">
                        Nhận tin nhắn, xem đơn hàng liên quan và phản hồi khách hàng theo thời gian thực
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadShopThreads()}
                      className="flex items-center gap-1 h-7.5 px-3 rounded-lg border border-[#D8D4CA] bg-white text-xs font-semibold text-[#5C605C] hover:text-[#191B19] transition cursor-pointer"
                    >
                      <RefreshCw className="size-3" />
                      <span>Làm mới tin nhắn</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
                    {/* Cột trái: Danh sách hội thoại khách hàng (5 cols) */}
                    <div className="md:col-span-5 border-r border-[#D8D4CA] bg-[#FAF8F5]/50 p-3 space-y-2 max-h-[550px] overflow-y-auto">
                      <div className="text-[10px] font-bold text-[#5C605C] uppercase tracking-wider px-2 py-1">
                        Hội thoại khách hàng ({shopThreads.length})
                      </div>
                      {shopThreads.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#5C605C]">
                          {shopChatAuthRequired
                            ? "Vui lòng đăng nhập bằng tài khoản Shop để xem và trả lời tin nhắn khách hàng."
                            : "Chưa có tin nhắn nào từ khách hàng"}
                        </div>
                      ) : (
                        shopThreads.map((thread) => {
                          const isSelected = thread.id === selectedThreadId;
                          const lastMsg = thread.messages?.[thread.messages.length - 1];
                          return (
                            <button
                              key={thread.id}
                              type="button"
                              onClick={() => setSelectedThreadId(thread.id)}
                              className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                                isSelected
                                  ? "bg-white border-[#2D5A43] shadow-xs ring-1 ring-[#2D5A43]"
                                  : "bg-white/80 border-[#D8D4CA]/80 hover:bg-white hover:border-[#D8D4CA]"
                              }`}
                            >
                              <div className="size-9 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {thread.userName?.slice(0, 2).toUpperCase() || "KH"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h5 className="text-xs font-bold text-[#191B19] truncate">
                                    {thread.userName}
                                  </h5>
                                  <span className="text-[10px] text-[#9CA3AF] shrink-0 font-mono">
                                    {lastMsg?.time || ""}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#5C605C] truncate mt-0.5">
                                  {lastMsg?.text || "Chưa có nội dung"}
                                </p>
                                {thread.orderCode && (
                                  <span className="inline-block mt-1 font-mono text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                                    #{thread.orderCode}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Cột phải: Khung chat chi tiết với khách đang chọn (7 cols) */}
                    <div className="md:col-span-7 flex flex-col h-[550px] bg-white">
                      {(() => {
                        const activeThread =
                          shopThreads.find((t) => t.id === selectedThreadId) || shopThreads[0];
                        if (!activeThread) {
                          return (
                            <div className="flex-1 flex items-center justify-center text-xs text-[#5C605C]">
                              Chọn một cuộc hội thoại bên trái để xem và phản hồi
                            </div>
                          );
                        }

                        return (
                          <>
                            {/* Header cuộc hội thoại */}
                            <div className="border-b border-[#D8D4CA]/70 bg-white p-3.5 flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-xs font-bold">
                                  {activeThread.userName?.slice(0, 2).toUpperCase() || "KH"}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-[#191B19]">
                                    {activeThread.userName} (Khách hàng)
                                  </h4>
                                  <p className="text-[10px] text-[#5C605C]">
                                    Đang chat về: {activeThread.orderCode ? `Đơn hàng #${activeThread.orderCode}` : "Tư vấn sản phẩm"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Danh sách tin nhắn */}
                            <div
                              ref={shopChatListRef}
                              onScroll={handleShopChatScroll}
                              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F7F4]/40"
                            >
                              {activeThread.messages?.map((msg: ChatMessageItem) => {
                                const isShopSender = msg.sender === "shop";
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex items-end gap-2 ${isShopSender ? "justify-end" : "justify-start"}`}
                                  >
                                    {!isShopSender && (
                                      <div className="size-7 rounded-full bg-neutral-200 text-[#191B19] flex items-center justify-center text-[10px] font-bold shrink-0">
                                        KH
                                      </div>
                                    )}
                                    <div
                                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                                        isShopSender
                                          ? "bg-[#2D5A43] text-white rounded-br-xs"
                                          : "bg-white text-[#191B19] border border-[#D8D4CA]/80 rounded-bl-xs"
                                      }`}
                                    >
                                      <p>{msg.text}</p>
                                      <span
                                        className={`text-[9px] block text-right mt-1 font-mono ${
                                          isShopSender ? "text-white/70" : "text-[#9CA3AF]"
                                        }`}
                                      >
                                        {msg.time}
                                      </span>
                                    </div>
                                    {isShopSender && (
                                      <div className="size-7 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                        SS
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Khung Shop gõ phản hồi */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSendShopReply();
                              }}
                              className="border-t border-[#D8D4CA] bg-white p-3 flex items-center gap-2 shrink-0"
                            >
                              <input
                                type="text"
                                value={shopReplyInput}
                                onChange={(e) => setShopReplyInput(e.target.value)}
                                placeholder={`Nhập tin nhắn phản hồi cho ${activeThread.userName}...`}
                                className="flex-1 h-9.5 rounded-xl border border-[#D8D4CA] px-3.5 text-xs text-[#191B19] placeholder:text-[#9CA3AF] focus:border-[#2D5A43] focus:outline-none"
                              />
                              <button
                                type="submit"
                                disabled={!shopReplyInput.trim() || shopReplySending}
                                className="h-9.5 px-4 rounded-xl bg-[#2D5A43] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#214332] transition disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
                              >
                                {shopReplySending ? (
                                  <RefreshCw className="size-3.5 animate-spin" />
                                ) : (
                                  <Send className="size-3.5" />
                                )}
                                <span>Gửi Cho Khách</span>
                              </button>
                            </form>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================== */}
              {/* TAB 3: HỒ SƠ THÔNG TIN (XEM NHÃN HOẶC FORM SỬA)             */}
              {/* =========================================================== */}
              {activeTab === "profile" && (
                <div>
                  {!isEditing ? (
                    /* CHẾ ĐỘ 1: XEM DẠNG NHÃN (LABEL VIEW MODE - MẶC ĐỊNH) */
                    <div className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 sm:p-7 shadow-xs space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-[#D8D4CA]">
                        <div>
                          <h3 className="text-base font-bold text-[#191B19]">
                            Thông Tin Chi Tiết Hồ Sơ
                          </h3>
                          <p className="text-xs text-[#5C605C] mt-0.5">
                            Dữ liệu lưu trữ chính xác trong cơ sở dữ liệu Supabase
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 h-8.5 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs font-bold text-[#191B19] hover:border-[#191B19] transition cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="size-3.5 text-[#2D5A43]" />
                          <span>Sửa</span>
                        </button>
                      </div>

                      {/* PHẦN 1: THÔNG TIN TÀI KHOẢN CHUNG */}
                      <div className="space-y-3.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                          1. Thông tin chung
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Họ tên */}
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                            <span className="text-[11px] font-semibold text-[#5C605C] block">Họ và tên hiển thị</span>
                            <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                              <User className="size-4 text-[#5C605C]" />
                              <span>{fullName || "Chưa cập nhật"}</span>
                            </p>
                          </div>

                          {/* Email */}
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                            <span className="text-[11px] font-semibold text-[#5C605C] block">Địa chỉ Email</span>
                            <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Mail className="size-4 text-[#5C605C]" />
                                <span>{email}</span>
                              </span>
                              <span className="text-[10px] text-[#2D5A43] font-bold">✓ Xác thực</span>
                            </p>
                          </div>

                          {/* Số điện thoại */}
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                            <span className="text-[11px] font-semibold text-[#5C605C] block">Số điện thoại</span>
                            <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                              <Phone className="size-4 text-[#5C605C]" />
                              <span>{phone || "Chưa cập nhật"}</span>
                            </p>
                          </div>

                          {/* Vai trò */}
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                            <span className="text-[11px] font-semibold text-[#5C605C] block">Vai trò hệ thống</span>
                            <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                              <BadgeCheck className="size-4 text-[#2D5A43]" />
                              <span>{cfg.roleBadge}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PHẦN 2: THÔNG TIN RIÊNG TỪNG ROLE */}
                      <div className="space-y-3.5 pt-4 border-t border-[#D8D4CA]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                          2. Thông tin chuyên biệt ({cfg.roleBadge})
                        </h4>

                        {/* Khách hàng */}
                        {role === "customer" && (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                              <span className="text-[11px] font-semibold text-[#5C605C] block">Địa chỉ nhận hàng mặc định</span>
                              <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                <MapPin className="size-4 text-[#C2410C] shrink-0" />
                                <span>{custAddress || "Chưa cập nhật"}</span>
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Tình trạng / Loại da</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1">
                                  {custSkinType || "Chưa cập nhật"}
                                </p>
                              </div>
                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Tiền sử dị ứng mỹ phẩm</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1">
                                  {custAllergies || "Chưa cập nhật"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bác sĩ */}
                        {role === "specialist" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Bệnh viện / Cơ sở y tế công tác</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                  <Building className="size-4 text-[#2D5A43]" />
                                  <span>{specHospital || "Chưa cập nhật"}</span>
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Số Chứng chỉ hành nghề (CCHN)</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                  <Award className="size-4 text-[#2D5A43]" />
                                  <span>{specLicense || "Chưa cập nhật"}</span>
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Chuyên khoa phụ trách</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1">
                                  {specSpecialty || "Chưa cập nhật"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Số năm kinh nghiệm</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1">
                                  {specExpYears ? `${specExpYears} năm kinh nghiệm` : "Chưa cập nhật"}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                              <span className="text-[11px] font-semibold text-[#5C605C] block">Tiểu sử chuyên môn (Bio)</span>
                              <p className="text-xs font-medium text-[#191B19] mt-1.5 leading-relaxed">
                                {specBio || "Chưa cập nhật"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Cửa hàng */}
                        {role === "shop" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Tên gian hàng chính thức</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                  <Store className="size-4 text-[#C2410C]" />
                                  <span>{shopName || "Chưa cập nhật"}</span>
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                                <span className="text-[11px] font-semibold text-[#5C605C] block">Mã số GPKD / CBMP</span>
                                <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                  <FileText className="size-4 text-[#5C605C]" />
                                  <span>{shopLicense || "Chưa cập nhật"}</span>
                                </p>
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                              <span className="text-[11px] font-semibold text-[#5C605C] block">Địa chỉ kho hàng & Trụ sở đăng ký</span>
                              <p className="text-sm font-bold text-[#191B19] mt-1 flex items-center gap-2">
                                <MapPin className="size-4 text-[#C2410C] shrink-0" />
                                <span>{shopAddress || "Chưa cập nhật"}</span>
                              </p>
                            </div>

                            <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5">
                              <span className="text-[11px] font-semibold text-[#5C605C] block">Ngành hàng dược mỹ phẩm</span>
                              <p className="text-sm font-bold text-[#191B19] mt-1">
                                {shopCategory || "Chưa cập nhật"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Admin */}
                        {role === "admin" && (
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-4 space-y-2">
                            <div className="text-xs font-bold text-[#191B19] flex items-center gap-2">
                              <ShieldCheck className="size-4 text-[#2D5A43]" />
                              <span>Đặc quyền Quản trị Toàn quyền (Super Admin)</span>
                            </div>
                            <p className="text-xs text-[#5C605C] leading-relaxed">
                              Toàn quyền kiểm soát cơ sở dữ liệu Supabase, kiểm duyệt phê duyệt tài khoản Bác sĩ, cấp phép gian hàng SkinSense Mall và cấu hình luồng thanh toán.
                            </p>
                            <div className="pt-2 text-xs text-[#191B19] font-medium">
                              <strong>Đơn vị trực thuộc:</strong> Viện CNTT & Y tế Số VKU
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* CHẾ ĐỘ 2: FORM CHỈNH SỬA (EDIT MODE KHI BẤM NÚT SỬA) */
                    <form
                      onSubmit={handleSave}
                      className="rounded-2xl border border-[#D8D4CA] bg-[#FAF8F5] p-6 sm:p-7 shadow-xs space-y-6"
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-[#D8D4CA]">
                        <div>
                          <h3 className="text-base font-bold text-[#191B19]">
                            Chỉnh Sửa Hồ Sơ ({cfg.roleBadge})
                          </h3>
                          <p className="text-xs text-[#5C605C] mt-0.5">
                            Nhập các thông tin cần thay đổi và bấm Lưu để cập nhật vào Database
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex items-center gap-1.5 h-8.5 rounded-xl border border-[#D8D4CA] bg-white px-3 text-xs font-bold text-[#5C605C] hover:text-[#191B19] transition cursor-pointer"
                        >
                          <X className="size-3.5" />
                          <span>Hủy</span>
                        </button>
                      </div>

                      {/* THÔNG TIN CHUNG */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                          1. Thông tin chung
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#191B19]">Họ và tên hiển thị *</label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required
                              className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#191B19]">Email (Đã xác thực)</label>
                            <input
                              type="email"
                              value={email}
                              readOnly
                              className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-[#F6F4EF] px-3.5 text-sm text-[#5C605C] cursor-not-allowed select-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#191B19]">Số điện thoại liên hệ</label>
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="09xx xxx xxx"
                              className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <ImageUploader
                              onUploadingChange={setUploading}
                              images={avatarUrl ? [avatarUrl] : []}
                              onChange={(next) => setAvatarUrl(next[0] ?? "")}
                              folder="avatars"
                              shape="round"
                              label="Ảnh đại diện"
                              emptyHint="Chưa có ảnh đại diện: hồ sơ hiện chữ viết tắt tên bạn."
                            />
                          </div>
                        </div>
                      </div>

                      {/* THÔNG TIN RIÊNG TỪNG ROLE */}
                      <div className="space-y-4 pt-4 border-t border-[#D8D4CA]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C605C]">
                          2. Thông tin chuyên biệt
                        </h4>

                        {/* Customer form */}
                        {role === "customer" && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#191B19]">Địa chỉ giao hàng mặc định</label>
                              <input
                                type="text"
                                value={custAddress}
                                onChange={(e) => setCustAddress(e.target.value)}
                                placeholder="Số nhà, đường, phường, quận..."
                                className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Tình trạng / Loại da</label>
                                <input
                                  type="text"
                                  value={custSkinType}
                                  onChange={(e) => setCustSkinType(e.target.value)}
                                  placeholder="Da hỗn hợp thiên dầu..."
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Ghi chú tiền sử dị ứng</label>
                                <input
                                  type="text"
                                  value={custAllergies}
                                  onChange={(e) => setCustAllergies(e.target.value)}
                                  placeholder="Dị ứng cồn khô, hương liệu..."
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Specialist form */}
                        {role === "specialist" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Bệnh viện công tác</label>
                                <input
                                  type="text"
                                  value={specHospital}
                                  onChange={(e) => setSpecHospital(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Số CCHN Bộ Y Tế</label>
                                <input
                                  type="text"
                                  value={specLicense}
                                  onChange={(e) => setSpecLicense(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Chuyên khoa</label>
                                <input
                                  type="text"
                                  value={specSpecialty}
                                  onChange={(e) => setSpecSpecialty(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Số năm kinh nghiệm</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={specExpYears}
                                  onChange={(e) => setSpecExpYears(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#191B19]">Tiểu sử chuyên môn (Bio)</label>
                              <textarea
                                rows={3}
                                value={specBio}
                                onChange={(e) => setSpecBio(e.target.value)}
                                className="w-full rounded-xl border border-[#D8D4CA] bg-white p-3 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                              />
                            </div>
                          </div>
                        )}

                        {/* Shop form */}
                        {role === "shop" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Tên gian hàng</label>
                                <input
                                  type="text"
                                  value={shopName}
                                  onChange={(e) => setShopName(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#191B19]">Mã số GPKD / CBMP</label>
                                <input
                                  type="text"
                                  value={shopLicense}
                                  onChange={(e) => setShopLicense(e.target.value)}
                                  className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#191B19]">Địa chỉ kho hàng & Trụ sở</label>
                              <input
                                type="text"
                                value={shopAddress}
                                onChange={(e) => setShopAddress(e.target.value)}
                                className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#191B19]">Ngành hàng dược mỹ phẩm</label>
                              <input
                                type="text"
                                value={shopCategory}
                                onChange={(e) => setShopCategory(e.target.value)}
                                className="h-10 w-full rounded-xl border border-[#D8D4CA] bg-white px-3.5 text-sm text-[#191B19] focus:border-[#191B19] focus:outline-none transition"
                              />
                            </div>
                          </div>
                        )}

                        {/* Admin form */}
                        {role === "admin" && (
                          <div className="rounded-xl border border-[#D8D4CA] bg-white p-3.5 text-xs text-[#5C605C]">
                            Tài khoản Quản trị viên Cấp cao (Super Admin) đồng bộ trực tiếp từ phân quyền Root hệ thống.
                          </div>
                        )}
                      </div>

                      {/* NÚT THAO TÁC KHI SỬA */}
                      <div className="pt-4 border-t border-[#D8D4CA] flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="h-10 px-4 rounded-xl border border-[#D8D4CA] bg-white text-xs font-bold text-[#5C605C] hover:bg-[#F6F4EF] transition"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          disabled={saving || uploading}
                          className="h-10 px-5 rounded-xl bg-[#2D5A43] text-xs font-bold text-white shadow-xs hover:bg-[#214332] transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />
                              <span>Đang lưu...</span>
                            </>
                          ) : (
                            <>
                              <Save className="size-3.5" />
                              <span>Lưu Thay Đổi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* 1. MODAL ĐÁNH GIÁ SẢN PHẨM CHUẨN SHOPEE (REVIEW MODAL)             */}
      {/* ================================================================= */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-[#D8D4CA] shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[#D8D4CA]/70 pb-3.5">
              <div>
                <h3 className="text-base font-bold text-[#191B19] flex items-center gap-2">
                  <Star className="size-4.5 text-amber-500 fill-amber-500" />
                  <span>Đánh Giá & Nhận Xét Sản Phẩm</span>
                </h3>
                <p className="text-xs text-[#5C605C] mt-0.5">
                  Đơn hàng: <span className="font-mono font-semibold">{reviewOrder.orderCode}</span> • {reviewOrder.shopName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                className="size-8 rounded-full flex items-center justify-center text-[#5C605C] hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Sản phẩm trong đơn */}
            <div className="rounded-xl border border-[#D8D4CA]/70 bg-[#FAF8F5] p-3.5 flex items-center gap-3">
              <div className="relative size-14 rounded-lg overflow-hidden border border-[#D8D4CA] bg-white shrink-0 shadow-2xs">
                <SafeProductImage
                  src={reviewOrder.items?.[0]?.image}
                  alt={reviewOrder.items?.[0]?.name || "Sản phẩm"}
                  brand={reviewOrder.brand}
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-[#191B19] line-clamp-1">
                  {reviewOrder.items?.[0]?.name || "Dược mỹ phẩm chăm sóc da chuyên sâu"}
                </h4>
                <p className="text-[11px] text-[#5C605C] mt-0.5">
                  Phân loại: <span className="font-medium text-[#191B19]">{reviewOrder.items?.[0]?.variant || "Mặc định"}</span>
                </p>
                <p className="text-[11px] font-semibold text-[#C2410C]">
                  {formatMoney(reviewOrder.totalAmount)}
                </p>
              </div>
            </div>

            {/* ======================================================= */}
            {/* PHẦN 1: ĐÁNH GIÁ CỦA BẠN (NẾU ĐÃ GỬI HOẶC ĐANG VIẾT)    */}
            {/* ======================================================= */}
            <div className="rounded-xl border border-[#D8D4CA] bg-white p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D8D4CA]/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#191B19] flex items-center gap-1.5">
                  <User className="size-3.5 text-[#2D5A43]" />
                  <span>Đánh giá của bạn</span>
                </h4>
                {reviewOrder.review && reviewMode === "view" && (
                  <button
                    type="button"
                    onClick={() => setReviewMode("create")}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#2D5A43] hover:underline cursor-pointer"
                  >
                    <Edit3 className="size-3" />
                    <span>Sửa đánh giá</span>
                  </button>
                )}
              </div>

              {reviewOrder.review && reviewMode === "view" ? (
                /* Hiển thị Đánh giá đã gửi của User */
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`size-4 ${
                            star <= (reviewOrder.review?.rating || 5)
                              ? "text-amber-500 fill-amber-500"
                              : "text-[#D8D4CA]"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-700">
                      Tuyệt vời ({reviewOrder.review.rating}/5)
                    </span>
                    <span className="text-[10px] text-[#9CA3AF]">•</span>
                    <span className="text-[11px] text-[#5C605C] font-mono">
                      {formatDate(reviewOrder.review.createdAt || new Date().toISOString())}
                    </span>
                  </div>

                  {reviewOrder.review.tags && reviewOrder.review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {reviewOrder.review.tags.map((t, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2D5A43]/10 text-[#2D5A43] border border-[#2D5A43]/20"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-[#191B19] leading-relaxed pt-1 bg-[#FAF8F5] p-3 rounded-lg border border-[#D8D4CA]/50">
                    {reviewOrder.review.comment || "Khách hàng hài lòng với sản phẩm."}
                  </p>
                </div>
              ) : (
                /* Form viết / sửa đánh giá của User */
                <div className="space-y-3.5">
                  {/* Chọn số sao tương tác */}
                  <div className="text-center py-1 space-y-1">
                    <span className="text-[11px] font-semibold text-[#5C605C] block">
                      Chọn mức độ hài lòng:
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Star
                            className={`size-6 transition-colors ${
                              (reviewHoverRating || reviewRating) >= star
                                ? "text-amber-500 fill-amber-500 drop-shadow-xs"
                                : "text-[#D8D4CA]"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-amber-700">
                      {(() => {
                        const current = reviewHoverRating || reviewRating;
                        if (current === 5) return "⭐⭐⭐⭐⭐ Tuyệt vời (5/5)";
                        if (current === 4) return "⭐⭐⭐⭐ Hài lòng (4/5)";
                        if (current === 3) return "⭐⭐⭐ Bình thường (3/5)";
                        if (current === 2) return "⭐⭐ Chưa hài lòng (2/5)";
                        return "⭐ Tệ (1/5)";
                      })()}
                    </p>
                  </div>

                  {/* Gợi ý Tag nhận xét nhanh */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#191B19] block">
                      Chọn đặc điểm bạn thích:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "⭐ Sản phẩm chính hãng 100%",
                        "📦 Đóng gói rất cẩn thận",
                        "🚚 Giao hàng nhanh như chớp",
                        "🌿 Da dịu ngay sau khi dùng",
                        "✨ Mùi hương dễ chịu, thấm nhanh",
                      ].map((tag) => {
                        const isSelected = reviewSelectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setReviewSelectedTags((prev) => prev.filter((t) => t !== tag));
                              } else {
                                setReviewSelectedTags((prev) => [...prev, tag]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border ${
                              isSelected
                                ? "bg-[#2D5A43] text-white border-[#2D5A43] shadow-2xs"
                                : "bg-white text-[#5C605C] border-[#D8D4CA] hover:border-[#191B19]"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Textarea bình luận */}
                  <div className="space-y-1">
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Chia sẻ trải nghiệm về kết cấu, độ lành tính và hiệu quả trên da..."
                      className="w-full rounded-xl border border-[#D8D4CA] p-3 text-xs leading-relaxed text-[#191B19] placeholder:text-[#9CA3AF] focus:border-[#2D5A43] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {reviewOrder.review && (
                      <button
                        type="button"
                        onClick={() => setReviewMode("view")}
                        className="h-8 px-3 rounded-lg border border-[#D8D4CA] bg-white text-xs font-semibold text-[#5C605C]"
                      >
                        Hủy sửa
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={reviewSubmitting}
                      onClick={handleSubmitReview}
                      className="flex items-center gap-1.5 h-8.5 px-4 rounded-xl bg-[#C2410C] text-xs font-bold text-white shadow-xs hover:bg-[#9A3412] transition cursor-pointer disabled:opacity-50"
                    >
                      {reviewSubmitting && <RefreshCw className="size-3 animate-spin" />}
                      <span>Gửi Đánh Giá Của Bạn</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Nút Đóng Modal */}
            <div className="flex items-center justify-end pt-3 border-t border-[#D8D4CA]/70">
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                className="h-9 px-5 rounded-xl border border-[#D8D4CA] bg-white text-xs font-bold text-[#191B19] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. HỘP THOẠI CHAT TRỰC TIẾP VỚI SHOP (TÁCH BIỆT TỪNG SHOP)       */}
      {/* ================================================================= */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[410px] h-[540px] max-h-[85vh] rounded-2xl bg-white border border-[#D8D4CA] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
          {/* Header Chat */}
          <div className="bg-[#2D5A43] text-white p-3.5 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative size-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Store className="size-4.5 text-white" />
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#2D5A43]" />
              </div>
              <div>
                <h4 className="text-xs font-bold flex items-center gap-1.5 text-white">
                  <span>{activeChatShopName}</span>
                  <span className="rounded bg-rose-600 px-1 py-0.2 text-[8px] font-bold">Mall</span>
                </h4>
                <p className="text-[10px] text-white/80 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>Đang hoạt động • Kênh chat riêng của Shop</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="size-7 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Nút chuyển đổi nhanh các Shop đang theo dõi */}
          <div className="border-b border-[#D8D4CA]/80 bg-[#F4F1EA] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0">
            <span className="text-[10px] font-bold text-[#5C605C] shrink-0">Chọn Shop:</span>
            {[
              { id: "larocheposay", name: "La Roche-Posay" },
              { id: "bioderma", name: "Bioderma" },
              { id: "cerave", name: "CeraVe" },
              { id: "skinsense_mall", name: "SkinSense Mall" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  const sName =
                    s.id === "larocheposay"
                      ? "La Roche-Posay Flagship Store"
                      : s.id === "bioderma"
                      ? "Bioderma Official Store"
                      : s.id === "cerave"
                      ? "CeraVe Official Mall"
                      : "SkinSense Official Medical Mall";
                  void loadChatThreadForShop(s.id, sName, chatOrder);
                }}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition shrink-0 cursor-pointer ${
                  activeChatShopId === s.id
                    ? "bg-[#2D5A43] text-white shadow-2xs"
                    : "bg-white text-[#5C605C] border border-[#D8D4CA] hover:border-[#2D5A43]"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Context Bar: Đơn hàng đang được hỏi */}
          {chatOrder && (
            <div className="border-b border-[#D8D4CA]/60 bg-[#FAF8F5] px-3.5 py-2 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Package className="size-3.5 text-[#2D5A43] shrink-0" />
                <span className="font-semibold text-[#191B19] truncate text-[11px]">
                  Đơn #{chatOrder.orderCode} ({formatMoney(chatOrder.totalAmount)})
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold shrink-0">
                {chatOrder.status === "delivered"
                  ? "Đã nhận hàng"
                  : chatOrder.status === "delivering"
                  ? "Đang giao"
                  : "Đã đặt"}
              </span>
            </div>
          )}

          {/* Auth notice when browsing without active session */}
          {chatAuthRequired && (
            <div className="border-b border-amber-200 bg-amber-50 px-3.5 py-2 text-[11px] text-amber-900 shrink-0">
              Đăng nhập tài khoản để lưu và đồng bộ hội thoại thực tế với gian hàng.
            </div>
          )}

          {/* Message Area */}
          <div
            ref={customerChatListRef}
            onScroll={handleCustomerChatScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F7F4]/60"
          >
            {chatMessages.map((msg) => {
              const isShop = msg.sender === "shop";
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isShop ? "justify-start" : "justify-end"}`}
                >
                  {isShop && (
                    <div className="size-7 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                      SS
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                      isShop
                        ? "bg-white text-[#191B19] border border-[#D8D4CA]/70 rounded-bl-xs"
                        : "bg-[#2D5A43] text-white rounded-br-xs"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 font-mono ${
                        isShop ? "text-[#9CA3AF]" : "text-white/70"
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isShopTyping && (
              <div className="flex items-center gap-2 text-xs text-[#5C605C] pt-1">
                <div className="size-7 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  SS
                </div>
                <div className="rounded-2xl rounded-bl-xs border border-[#D8D4CA]/70 bg-white px-3.5 py-2 shadow-2xs flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#2D5A43] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="size-1.5 rounded-full bg-[#2D5A43] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="size-1.5 rounded-full bg-[#2D5A43] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions (Gợi ý câu hỏi nhanh) */}
          <div className="border-t border-[#D8D4CA]/60 bg-white px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {[
              "📦 Khi nào giao hàng cho tôi?",
              "🧴 Da dầu mụn dùng serum nào?",
              "🔄 Chính sách đổi trả nếu kích ứng?",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSendChatMessage(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full border border-[#D8D4CA] bg-[#FAF8F5] text-[10px] font-semibold text-[#5C605C] hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition cursor-pointer shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage();
            }}
            className="border-t border-[#D8D4CA] bg-white p-2.5 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Nhắn tin cho ${activeChatShopName}...`}
              className="flex-1 h-9 rounded-xl border border-[#D8D4CA] px-3 text-xs text-[#191B19] placeholder:text-[#9CA3AF] focus:border-[#2D5A43] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              aria-label="Gửi tin nhắn"
              className="size-9 rounded-xl bg-[#2D5A43] text-white flex items-center justify-center hover:bg-[#214332] transition disabled:opacity-40 cursor-pointer shrink-0 shadow-2xs"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. NÚT CHAT NỔI VỚI SHOP (FLOATING CHAT BUTTON)                    */}
      {/* ================================================================= */}
      {!isChatOpen && role === "customer" && (
        <button
          type="button"
          onClick={() => openChatWithShop()}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 h-11 px-4 rounded-full bg-[#2D5A43] text-white shadow-xl hover:bg-[#214332] transition hover:scale-105 cursor-pointer border-2 border-white/80"
        >
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-400" />
          </span>
          <MessageSquare className="size-4" />
          <span className="text-xs font-bold tracking-wide">Chat với Shop</span>
        </button>
      )}
    </div>
  );
}
