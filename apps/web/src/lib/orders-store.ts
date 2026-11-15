import fs from "fs";
import path from "path";

export interface BackendOrder {
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
  }>;
  paidAt?: string;
  createdAt: string;
}

const DB_FILE = path.join(process.cwd(), ".orders-db.json");

function readFromDisk(): BackendOrder[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
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
          items: [],
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content) as BackendOrder[];
  } catch {
    return [];
  }
}

function writeToDisk(orders: BackendOrder[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), "utf-8");
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
};
