import fs from "fs";
import os from "os";
import path from "path";

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "delivering",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export interface OrderReview {
  rating: number; // 1-5 sao
  comment: string;
  tags: string[];
  createdAt: string;
}

export interface BackendOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: OrderStatus;
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

const DB_FILE = path.join(process.cwd(), ".orders-db.json");
const FALLBACK_DB_FILE = path.join(os.tmpdir(), ".skinsense-orders-db.json");
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function resolveOrdersReadPath(): string {
  const override = process.env.SKINSENSE_ORDERS_DB_PATH?.trim();
  if (override) return override;
  if (fs.existsSync(DB_FILE)) return DB_FILE;
  if (fs.existsSync(FALLBACK_DB_FILE)) return FALLBACK_DB_FILE;
  return DB_FILE;
}

export const PRODUCT_IMAGES: Record<string, string> = {
  bioderma: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
  cerave: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
  hyalu: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80",
  effaclar: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  duo: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  anthelios: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
  paula: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
  bha: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
};

export function resolveProductImage(name: string, fallback?: string): string {
  if (fallback && fallback.startsWith("http")) return fallback;
  const n = (name || "").toLowerCase();
  for (const [key, url] of Object.entries(PRODUCT_IMAGES)) {
    if (n.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80";
}

function readFromDisk(): BackendOrder[] {
  const dbPath = resolveOrdersReadPath();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ dbPath)) {
      const initial: BackendOrder[] = [
        {
          id: "ORD-9821",
          orderCode: "SHOPEE-SS-982101",
          customerName: "Trần Thị Ngọc Hà",
          customerPhone: "0987654321",
          shippingAddress: "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          totalAmount: 395000,
          status: "processing",
          paymentMethod: "momo",
          paymentStatus: "paid",
          shopName: "La Roche-Posay Flagship Store",
          brand: "La Roche-Posay",
          carrier: "SPX Express",
          items: [
            {
              id: "item_sp_01",
              name: "Kem Dưỡng Giảm Mụn & Ngừa Thâm La Roche-Posay Effaclar Duo+M 40ml",
              price: 395000,
              quantity: 1,
              variant: "Tuýp 40ml",
              image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
            },
          ],
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      writeToDisk(initial);
      return initial;
    }
    const content = fs.readFileSync(/*turbopackIgnore: true*/ dbPath, "utf-8");
    const list = JSON.parse(content) as BackendOrder[];

    // QUY TẮC TỰ ĐỘNG HỦY: Nếu đơn hàng chưa thanh toán sau 3 ngày thì tự động hủy luôn
    let hasExpired = false;
    let needUpdate = false;
    const now = Date.now();
    for (const order of list) {
      if ((order.status === "pending" || order.paymentStatus === "unpaid") && order.status !== "cancelled") {
        const createdMs = new Date(order.createdAt).getTime();
        if (!isNaN(createdMs) && now - createdMs > THREE_DAYS_MS) {
          order.status = "cancelled";
          hasExpired = true;
        }
      }

      // Đảm bảo mọi item đều có link ảnh sắc nét
      if (Array.isArray(order.items)) {
        for (const it of order.items) {
          if (!it.image) {
            it.image = resolveProductImage(it.name);
            needUpdate = true;
          }
        }
      }
    }

    if (hasExpired || needUpdate) {
      writeToDisk(list);
    }

    return list;
  } catch {
    return [];
  }
}

function writeToDisk(orders: BackendOrder[]) {
  const payload = JSON.stringify(orders, null, 2);
  const override = process.env.SKINSENSE_ORDERS_DB_PATH?.trim();
  const primaryPath = override || DB_FILE;
  try {
    fs.mkdirSync(path.dirname(primaryPath), { recursive: true });
    fs.writeFileSync(primaryPath, payload, "utf-8");
    return;
  } catch {
    if (override) return;
  }
  try {
    fs.writeFileSync(FALLBACK_DB_FILE, payload, "utf-8");
  } catch {}
}

export const ordersStore = {
  getAll(): BackendOrder[] {
    return readFromDisk();
  },

  findByCode(code: string): BackendOrder | undefined {
    const list = readFromDisk();
    const clean = code.trim().toLowerCase();
    return list.find(
      (o) => o.orderCode.toLowerCase() === clean || o.id.toLowerCase() === clean,
    );
  },

  create(order: Omit<BackendOrder, "id" | "createdAt">): BackendOrder {
    const list = readFromDisk();
    const newOrder: BackendOrder = {
      ...order,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newOrder, ...list.filter((o) => o.orderCode.toLowerCase() !== order.orderCode.toLowerCase())];
    writeToDisk(updated);
    return newOrder;
  },

  markAsPaid(code: string): BackendOrder {
    const list = readFromDisk();
    const clean = code.trim().toLowerCase();

    // Hỗ trợ tự động thanh toán đơn mới nhất nếu mã là latest hoặc rỗng
    if (clean === "latest" || !clean) {
      const pendingIndex = list.findIndex(
        (o) => o.status === "pending" || o.paymentStatus === "unpaid",
      );
      if (pendingIndex !== -1) {
        list[pendingIndex].paymentStatus = "paid";
        list[pendingIndex].status = "processing";
        list[pendingIndex].paidAt = new Date().toISOString();
        writeToDisk(list);
        return list[pendingIndex];
      }
      if (list.length > 0) {
        list[0].paymentStatus = "paid";
        list[0].status = "processing";
        list[0].paidAt = new Date().toISOString();
        writeToDisk(list);
        return list[0];
      }
    }

    const index = list.findIndex(
      (o) => o.orderCode.toLowerCase() === clean || o.id.toLowerCase() === clean,
    );

    if (index === -1) {
      // Tự động tạo đơn hàng đã thanh toán nếu mã chưa có trong file
      const autoCreated: BackendOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        orderCode: code,
        customerName: "Khách hàng MoMo",
        customerPhone: "0901234567",
        shippingAddress: "Địa chỉ giao hàng mặc định",
        totalAmount: 395000,
        status: "processing",
        paymentMethod: "momo",
        paymentStatus: "paid",
        shopName: "Shopee Mall Flagship",
        brand: "Dược Mỹ Phẩm",
        carrier: "SPX Express",
        items: [],
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      writeToDisk([autoCreated, ...list]);
      return autoCreated;
    }

    list[index].paymentStatus = "paid";
    list[index].status = "processing";
    list[index].paidAt = new Date().toISOString();
    writeToDisk(list);
    return list[index];
  },

  updateStatusSafe(
    codeOrId: string,
    status: unknown,
  ):
    | { ok: true; order: BackendOrder }
    | {
        ok: false;
        code: "INVALID_STATUS" | "NOT_FOUND" | "INVALID_TRANSITION" | "PAYMENT_REQUIRED";
        error: string;
      } {
    if (!isValidOrderStatus(status)) {
      return {
        ok: false,
        code: "INVALID_STATUS",
        error: "Trạng thái đơn hàng không hợp lệ.",
      };
    }

    const list = readFromDisk();
    const clean = codeOrId.trim().toLowerCase();
    const index = list.findIndex(
      (o) => o.orderCode.toLowerCase() === clean || o.id.toLowerCase() === clean,
    );
    if (index === -1) {
      return { ok: false, code: "NOT_FOUND", error: "Không tìm thấy đơn hàng" };
    }

    const current = list[index];
    if (current.status === status) {
      return { ok: true, order: current };
    }

    const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
      pending: ["processing", "cancelled"],
      processing: ["delivering", "cancelled"],
      delivering: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    if (!allowedTransitions[current.status].includes(status)) {
      return {
        ok: false,
        code: "INVALID_TRANSITION",
        error: `Không thể chuyển đơn hàng từ trạng thái "${current.status}" sang "${status}".`,
      };
    }

    // Chặn bỏ qua thanh toán: đơn chưa thanh toán không COD không thể duyệt xử lý hoặc hoàn thành
    if (
      status !== "cancelled" &&
      current.paymentStatus === "unpaid" &&
      current.paymentMethod !== "cod"
    ) {
      return {
        ok: false,
        code: "PAYMENT_REQUIRED",
        error: "Đơn hàng chưa thanh toán không thể duyệt xử lý hoặc xác nhận giao hàng.",
      };
    }

    current.status = status;
    // Chỉ khi đơn COD hoàn tất giao từ trạng thái đang giao mới ghi nhận đã thu tiền
    if (status === "delivered" && current.paymentMethod === "cod" && current.paymentStatus === "unpaid") {
      current.paymentStatus = "paid";
      if (!current.paidAt) current.paidAt = new Date().toISOString();
    }

    writeToDisk(list);
    return { ok: true, order: current };
  },

  updateStatus(
    codeOrId: string,
    status: OrderStatus,
  ): BackendOrder | undefined {
    const result = this.updateStatusSafe(codeOrId, status);
    return result.ok ? result.order : undefined;
  },

  addReviewSafe(
    codeOrId: string,
    review: OrderReview,
  ):
    | { ok: true; order: BackendOrder }
    | { ok: false; code: "NOT_FOUND" | "NOT_DELIVERED"; error: string } {
    const list = readFromDisk();
    const clean = codeOrId.trim().toLowerCase();
    const index = list.findIndex(
      (o) => o.orderCode.toLowerCase() === clean || o.id.toLowerCase() === clean,
    );
    if (index === -1) {
      return { ok: false, code: "NOT_FOUND", error: "Không tìm thấy đơn hàng" };
    }
    if (list[index].status !== "delivered") {
      return {
        ok: false,
        code: "NOT_DELIVERED",
        error: "Chỉ có thể đánh giá đơn hàng đã giao thành công.",
      };
    }
    list[index].review = review;
    writeToDisk(list);
    return { ok: true, order: list[index] };
  },

  addReview(codeOrId: string, review: OrderReview): BackendOrder | undefined {
    const result = this.addReviewSafe(codeOrId, review);
    return result.ok ? result.order : undefined;
  },
};
