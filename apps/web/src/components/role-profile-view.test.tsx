import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleProfileView } from "./role-profile-view";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const sampleDeliveredOrder = {
  id: "ORD-TEST-1",
  orderCode: "SHOPEE-TEST-1",
  customerName: "Nguyễn Minh Anh",
  customerPhone: "0901234567",
  shippingAddress: "Đà Nẵng",
  totalAmount: 485000,
  status: "delivered" as const,
  paymentMethod: "momo" as const,
  paymentStatus: "paid" as const,
  shopName: "Bioderma Official Store",
  brand: "Bioderma",
  carrier: "SPX Express",
  items: [
    {
      id: "item_1",
      name: "Bioderma Sensibio H2O 500ml",
      price: 485000,
      quantity: 1,
      variant: "Chai 500ml",
    },
  ],
  createdAt: new Date().toISOString(),
};

describe("RoleProfileView", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/profile")) {
          return new Response(
            JSON.stringify({
              ok: true,
              user: {
                id: "cust_minh_anh",
                email: "minhanh@example.com",
                fullName: "Nguyễn Minh Anh",
                phone: "0901234567",
                avatarUrl: "",
                customer: { address: "Đà Nẵng", skinType: "Da nhạy cảm", allergies: "Không" },
                shop: { shopName: "La Roche-Posay Flagship Store", address: "HCM", license: "GP1", category: "Skincare" },
              },
            }),
            { status: 200 },
          );
        }
        if (url.startsWith("/api/user/orders")) {
          return new Response(JSON.stringify({ ok: true, orders: [sampleDeliveredOrder] }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({ ok: false }), { status: 401 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders floating Chat với Shop button for customer but hides it for shop role", async () => {
    const { rerender } = render(<RoleProfileView role="customer" />);
    await waitFor(() => {
      expect(screen.getByText("Chat với Shop")).toBeTruthy();
    });

    rerender(<RoleProfileView role="shop" />);
    await waitFor(() => {
      expect(screen.queryByText("Chat với Shop")).toBeNull();
    });
  });

  const deliveringOrder = {
    ...sampleDeliveredOrder,
    id: "ORD-TEST-2",
    orderCode: "SHOPEE-TEST-2",
    status: "delivering" as const,
    paymentMethod: "cod" as const,
    paymentStatus: "unpaid" as const,
  };

  it("shows only the buyer's own review form, no invented reviews from other buyers", async () => {
    render(<RoleProfileView role="customer" />);

    fireEvent.click(await screen.findByText(/Đơn Mua Của Tôi/i));
    fireEvent.click(await screen.findByText("Viết Đánh Giá"));

    expect(await screen.findByText("Đánh giá của bạn")).toBeTruthy();
    expect(screen.queryByText("tranngoc***")).toBeNull();
    expect(screen.queryByText(/đánh giá tiêu biểu/i)).toBeNull();
    expect(screen.queryByText(/Đã mua hàng/)).toBeNull();
  });

  it("syncs paymentStatus and status from server response on delivery confirmation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.startsWith("/api/profile")) {
          return new Response(
            JSON.stringify({
              ok: true,
              user: {
                id: "cust_minh_anh",
                email: "minhanh@example.com",
                fullName: "Nguyễn Minh Anh",
                phone: "0901234567",
                avatarUrl: "",
                customer: { address: "Đà Nẵng", skinType: "Da nhạy cảm", allergies: "Không" },
              },
            }),
            { status: 200 },
          );
        }
        if (url === "/api/user/orders" && init?.method === "POST") {
          return new Response(
            JSON.stringify({
              ok: true,
              order: {
                ...deliveringOrder,
                status: "delivered",
                paymentStatus: "paid",
                paidAt: "2026-11-15T12:00:00Z",
              },
            }),
            { status: 200 },
          );
        }
        if (url.startsWith("/api/user/orders")) {
          return new Response(JSON.stringify({ ok: true, orders: [deliveringOrder] }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({ ok: false }), { status: 401 });
      }),
    );

    render(<RoleProfileView role="customer" />);

    const ordersTab = await screen.findByText(/Đơn Mua Của Tôi/i);
    fireEvent.click(ordersTab);

    const confirmBtn = await screen.findByText("Đã Nhận Được Hàng");
    fireEvent.click(confirmBtn);

    expect(await screen.findByText("Viết Đánh Giá")).toBeTruthy();
  });

  it("queries shop orders cleanly and hides Duyệt & Chuẩn Bị Hàng for unpaid MoMo orders", async () => {
    const unpaidMomoOrder = {
      ...sampleDeliveredOrder,
      id: "ORD-MOMO-UNPAID",
      orderCode: "SHOPEE-MOMO-UNPAID",
      status: "pending" as const,
      paymentMethod: "momo" as const,
      paymentStatus: "unpaid" as const,
      shopName: "La Roche-Posay Flagship Store",
    };

    const requestedUrls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        requestedUrls.push(url);
        if (url.startsWith("/api/profile")) {
          return new Response(
            JSON.stringify({
              ok: true,
              user: {
                id: "shop_lrp",
                email: "shop@lrp.vn",
                fullName: "La Roche-Posay Official Flagship Store",
                phone: "1900 123 456",
                avatarUrl: "",
                shop: {
                  shopName: "La Roche-Posay Official Flagship Store",
                  address: "HCM",
                  license: "GP1",
                  category: "Skincare",
                },
              },
            }),
            { status: 200 },
          );
        }
        if (url.startsWith("/api/user/orders")) {
          return new Response(JSON.stringify({ ok: true, orders: [unpaidMomoOrder] }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({ ok: false }), { status: 401 });
      }),
    );

    render(<RoleProfileView role="shop" />);

    const shopOrdersTab = await screen.findByText(/Quản Lý Đơn Hàng Shop Mall/i);
    fireEvent.click(shopOrdersTab);

    expect(await screen.findByText("Chờ khách thanh toán")).toBeTruthy();
    expect(screen.queryByText("Duyệt & Chuẩn Bị Hàng")).toBeNull();
    expect(requestedUrls.some((u) => u.includes("/api/user/orders?role=shop"))).toBe(true);
  });
});
