"use client";

import { useState } from "react";
import { OrderList } from "@/components/seller/order-list";
import { OrderDetailModal } from "@/components/seller/order-detail-modal";
import { type Order } from "@skinsense/domain";

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản Lý Đơn Hàng</h1>
        <p className="text-sm text-muted-foreground pt-0.5">
          Theo dõi, xác nhận đơn hàng, cập nhật vận đơn và xử lý quy trình đóng gói giao hàng
        </p>
      </div>

      <OrderList onSelectOrder={handleSelectOrder} />

      <OrderDetailModal
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
