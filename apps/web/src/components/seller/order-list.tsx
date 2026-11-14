"use client";

import { useState } from "react";
import { Search, Truck, CheckCircle2, XCircle, Clock, Package, Eye, Send, AlertCircle, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVnd, type Order, type OrderStatus } from "@skinsense/domain";

const DEMO_ORDERS: Order[] = [
  {
    id: "ORD-982104-SPX1",
    shopId: "shop-skinsense-official",
    shopName: "SkinSense Official Store",
    productId: "lrp-effaclar-duo-m",
    productName: "Effaclar Duo+M Giảm Mụn & Ngừa Thâm 40ml",
    productImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80",
    priceVnd: 375000,
    quantity: 1,
    totalVnd: 375000,
    totalFormatted: "375.000₫",
    customerName: "Trần Thị Ngọc Hà",
    customerPhone: "0912345678",
    customerAddress: "Tòa Landmark 72, Mễ Trì, Nam Từ Liêm, Hà Nội",
    note: "Giao giờ hành chính giúp em",
    paymentMethod: "cod",
    status: "processing",
    trackingCode: "SPX-VN982104",
    shippingProvider: "SPX Express",
    shopEarningsVnd: 356250,
    platformFeeVnd: 18750,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "ORD-639201-SPX2",
    shopId: "shop-skinsense-official",
    shopName: "SkinSense Official Store",
    productId: "skin1004-centella-ampoule",
    productName: "Tinh Chất Rau Má Madagascar Centella Ampoule 100ml",
    productImage: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
    priceVnd: 330000,
    quantity: 2,
    totalVnd: 660000,
    totalFormatted: "660.000₫",
    customerName: "Nguyễn Văn Hùng",
    customerPhone: "0988776655",
    customerAddress: "158 Nguyễn Thái Học, Ba Đình, Hà Nội",
    paymentMethod: "vietqr",
    status: "pending",
    trackingCode: "SPX-VN639201",
    shippingProvider: "SPX Express",
    shopEarningsVnd: 627000,
    platformFeeVnd: 33000,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "ORD-119832-SPX3",
    shopId: "shop-skinsense-official",
    shopName: "SkinSense Official Store",
    productId: "lrp-cicaplast-b5-plus",
    productName: "Cicaplast Baume B5+ Phục Hồi & Làm Dịu Da 40ml",
    productImage: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80",
    priceVnd: 365000,
    quantity: 1,
    totalVnd: 365000,
    totalFormatted: "365.000₫",
    customerName: "Phạm Hoàng Yến",
    customerPhone: "0933112233",
    customerAddress: "45 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh",
    paymentMethod: "vietqr",
    status: "completed",
    trackingCode: "SPX-VN119832",
    shippingProvider: "SPX Express",
    shopEarningsVnd: 346750,
    platformFeeVnd: 18250,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

const STATUS_TABS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "Tất cả đơn hàng" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "processing", label: "Đang xử lý / Đóng gói" },
  { id: "shipping", label: "Đang giao hàng" },
  { id: "completed", label: "Hoàn thành" },
  { id: "cancelled", label: "Đã hủy" },
];

export function OrderList({
  orders = DEMO_ORDERS,
  onViewOrderDetail,
}: {
  orders?: Order[];
  onViewOrderDetail?: (order: Order) => void;
}) {
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [orderList, setOrderList] = useState<Order[]>(orders);

  const filtered = orderList.filter((o) => {
    const matchesTab = activeTab === "all" || o.status === activeTab;
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.productName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  function handleConfirmOrder(orderId: string) {
    setOrderList((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "processing" as const } : o)));
  }

  function handleShipOrder(orderId: string) {
    setOrderList((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "shipping" as const } : o)));
  }

  return (
    <div className="space-y-4">
      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b flex-1">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "bg-emerald-600 text-white font-medium text-xs shrink-0" : "text-xs shrink-0 text-muted-foreground"}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mã đơn hàng, tên khách..."
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Mã Đơn & Ngày Đặt</TableHead>
              <TableHead>Khách Hàng</TableHead>
              <TableHead>Sản Phẩm Mua</TableHead>
              <TableHead className="text-right">Tổng Tiền (VND)</TableHead>
              <TableHead className="text-center">Thanh Toán</TableHead>
              <TableHead className="text-center">Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không có đơn hàng nào trong danh mục này.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <p className="font-semibold text-xs text-foreground">{order.id}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-xs text-foreground">{order.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">{order.customerPhone}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img src={order.productImage} alt={order.productName} className="size-9 rounded object-cover border shrink-0" />
                      <div>
                        <p className="text-xs font-medium line-clamp-1">{order.productName}</p>
                        <p className="text-[11px] text-muted-foreground">x{order.quantity}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600 text-xs">
                    {formatVnd(order.totalVnd)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {order.paymentMethod === "vietqr" ? "VietQR (Đã chuyển)" : "COD"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        order.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px]"
                          : order.status === "shipping"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[11px]"
                          : order.status === "processing"
                          ? "bg-purple-500/10 text-purple-600 border-purple-500/20 text-[11px]"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px]"
                      }
                    >
                      {order.status === "pending"
                        ? "Chờ xác nhận"
                        : order.status === "processing"
                        ? "Đang chuẩn bị"
                        : order.status === "shipping"
                        ? "Đang giao"
                        : order.status === "completed"
                        ? "Hoàn thành"
                        : "Đã hủy"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmOrder(order.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-2.5"
                        >
                          Xác nhận
                        </Button>
                      )}
                      {order.status === "processing" && (
                        <Button
                          size="sm"
                          onClick={() => handleShipOrder(order.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-2.5 gap-1"
                        >
                          <Send className="size-3" />
                          <span>Giao hàng</span>
                        </Button>
                      )}
                      {onViewOrderDetail && (
                        <Button variant="ghost" size="icon" className="h-8 size-8" onClick={() => onViewOrderDetail(order)}>
                          <Eye className="size-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
