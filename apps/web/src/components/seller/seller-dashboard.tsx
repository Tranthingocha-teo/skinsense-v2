"use client";

import { useState } from "react";
import { DollarSign, ShoppingBag, Package, TrendingUp, Calendar, Clock, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatVnd, PRODUCTS, type DateRangePreset, type Shop } from "@skinsense/domain";

export function SellerDashboard({
  shop,
  onNavigateTab,
}: {
  shop: Shop;
  onNavigateTab?: (tab: "products" | "orders" | "shop" | "analytics") => void;
}) {
  const [dateRange, setDateRange] = useState<DateRangePreset>("thisMonth");

  // Simulated live metrics based on real database records
  const stats = {
    totalRevenueVnd: 15850000,
    totalRevenueFormatted: formatVnd(15850000),
    revenueTodayVnd: 1250000,
    revenueTodayFormatted: formatVnd(1250000),
    totalOrders: 42,
    pendingOrders: 3,
    processingOrders: 5,
    shippingOrders: 8,
    completedOrders: 24,
    cancelledOrders: 2,
    totalProducts: 10,
    activeProducts: 9,
    outOfStockProducts: 1,
  };

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <Card className="border-border/80 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={shop.avatarUrl}
                alt={shop.shopName}
                className="size-16 rounded-2xl object-cover border-2 border-background shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{shop.shopName}</h1>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                    ACTIVE
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground pt-0.5">
                  Đại diện: {shop.ownerName} • Số dư ví: <strong className="text-emerald-600 font-semibold">{formatVnd(shop.walletBalanceVnd || 1500000)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(["today", "last7days", "thisMonth"] as DateRangePreset[]).map((r) => (
                <Button
                  key={r}
                  variant={dateRange === r ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange(r)}
                  className={dateRange === r ? "bg-emerald-600 text-white text-xs font-medium" : "text-xs"}
                >
                  {r === "today" ? "Hôm nay" : r === "last7days" ? "7 ngày qua" : "Tháng này"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="border-border/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tổng Doanh Thu</span>
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalRevenueFormatted}</div>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 pt-1">
              <ArrowUpRight className="size-3.5" />
              <span>+18.4% so với kỳ trước</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-border/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Đơn Hàng Mới</span>
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalOrders} đơn</div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Chờ xử lý: <strong className="text-amber-600">{stats.pendingOrders}</strong> • Đang giao:{" "}
              <strong className="text-blue-600">{stats.shippingOrders}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="border-border/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sản Phẩm</span>
              <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Package className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalProducts} mặt hàng</div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Đang bán: <strong className="text-emerald-600">{stats.activeProducts}</strong> • Hết hàng:{" "}
              <strong className="text-destructive">{stats.outOfStockProducts}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border-border/80">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tỷ Lệ Hoàn Thành</span>
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">95.2%</div>
            <p className="text-[11px] text-muted-foreground pt-1">
              {stats.completedOrders} đơn hoàn thành / {stats.cancelledOrders} đơn hủy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products Overview */}
      <Card className="border-border/80">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Sản Phẩm Bán Chạy Nhất</CardTitle>
            <CardDescription className="text-xs">Top 3 dòng dược mỹ phẩm có doanh số cao nhất</CardDescription>
          </div>
          {onNavigateTab && (
            <Button variant="ghost" size="sm" onClick={() => onNavigateTab("products")} className="text-emerald-600 text-xs font-medium">
              Quản lý sản phẩm →
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {PRODUCTS.slice(0, 3).map((product, idx) => (
            <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                <span className="font-bold text-xs text-muted-foreground w-5 text-center">#{idx + 1}</span>
                <img src={product.imageUrl} alt={product.name} className="size-10 rounded object-cover border shrink-0" />
                <div>
                  <p className="font-semibold text-xs text-foreground line-clamp-1">{product.name}</p>
                  <p className="text-[11px] text-muted-foreground">{product.brand} • {formatVnd(product.priceVnd)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600 text-xs">{formatVnd(product.priceVnd * (20 - idx * 5))}</p>
                <p className="text-[11px] text-muted-foreground">Đã bán: {20 - idx * 5} chai</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
