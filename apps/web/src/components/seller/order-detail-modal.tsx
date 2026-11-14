"use client";

import { MapPin, Phone, User, Truck, DollarSign, Package, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatVnd, calculateOrderFinancials, type Order } from "@skinsense/domain";

export function OrderDetailModal({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!order) return null;

  const { shopEarningsVnd, platformFeeVnd } = calculateOrderFinancials(order.totalVnd);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-lg font-bold">
            <span className="flex items-center gap-2">
              <Package className="size-5 text-emerald-600" />
              <span>Chi Tiết Đơn Hàng {order.id}</span>
            </span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
              {order.status.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Đặt ngày: {new Date(order.createdAt).toLocaleString("vi-VN")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Customer Shipping Address */}
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5">
            <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <MapPin className="size-3.5 text-emerald-600" />
              <span>Địa Chỉ Giao Hàng Cho Khách</span>
            </p>
            <p className="font-semibold text-foreground">{order.customerName} - {order.customerPhone}</p>
            <p className="text-muted-foreground">{order.customerAddress}</p>
            {order.note && <p className="text-amber-600 italic">Ghi chú: "{order.note}"</p>}
          </div>

          {/* Purchased Item */}
          <div className="p-3 rounded-lg border border-border space-y-2">
            <p className="font-bold text-foreground">Sản Phẩm Đã Mua</p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img src={order.productImage} alt={order.productName} className="size-12 rounded object-cover border shrink-0" />
                <div>
                  <p className="font-semibold text-foreground line-clamp-1">{order.productName}</p>
                  <p className="text-muted-foreground">Đơn giá: {formatVnd(order.priceVnd)} x {order.quantity}</p>
                </div>
              </div>
              <p className="font-bold text-emerald-600">{formatVnd(order.totalVnd)}</p>
            </div>
          </div>

          {/* Shipping & Tracking */}
          <div className="p-3 rounded-lg border border-border space-y-1.5">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Truck className="size-3.5 text-emerald-600" />
              <span>Thông Tin Vận Chuyển & Mã Vận Đơn</span>
            </p>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Đơn vị vận chuyển:</span>
              <span className="font-semibold text-foreground">{order.shippingProvider || "SPX Express"}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Mã vận đơn (Tracking Code):</span>
              <span className="font-mono font-bold text-emerald-600">{order.trackingCode || "SPX-VN982104"}</span>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-3 rounded-lg border border-border bg-emerald-500/5 space-y-1.5">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-emerald-600" />
              <span>Phân Bố Doanh Thu & Phí Sàn</span>
            </p>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Tổng tiền đơn hàng:</span>
              <span className="font-semibold text-foreground">{formatVnd(order.totalVnd)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Phí hoa hồng sàn SkinSense (5%):</span>
              <span className="text-destructive">-{formatVnd(platformFeeVnd)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-emerald-600 pt-1 border-t text-sm">
              <span>Doanh thu thực nhận về ví:</span>
              <span>{formatVnd(shopEarningsVnd)}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
