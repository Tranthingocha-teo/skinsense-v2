"use client";

import { useState } from "react";
import { TrendingUp, DollarSign, ShoppingBag, ArrowUpRight, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVnd, type DateRangePreset } from "@skinsense/domain";

export function SalesAnalytics() {
  const [range, setRange] = useState<DateRangePreset>("thisMonth");

  const analyticsData = {
    grossRevenue: 16800000,
    platformFee: 840000,
    netEarnings: 15960000,
    totalOrdersCount: 42,
    completedOrdersCount: 40,
    avgOrderValue: 400000,
  };

  const dailyBreakdown = [
    { date: "01/10", revenue: 1250000, orders: 3 },
    { date: "02/10", revenue: 1890000, orders: 5 },
    { date: "03/10", revenue: 2100000, orders: 6 },
    { date: "04/10", revenue: 1450000, orders: 4 },
    { date: "05/10", revenue: 3200000, orders: 8 },
    { date: "06/10", revenue: 2750000, orders: 7 },
    { date: "07/10", revenue: 4160000, orders: 9 },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-emerald-600" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Khung Thời Gian Báo Cáo</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              ["today", "Hôm nay"],
              ["yesterday", "Hôm qua"],
              ["last7days", "7 ngày qua"],
              ["last30days", "30 ngày qua"],
              ["thisMonth", "Tháng này"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={range === key ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(key as DateRangePreset)}
              className={range === key ? "bg-emerald-600 text-white text-xs font-medium" : "text-xs"}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tổng Doanh Số (Gross Sales)</p>
            <p className="text-2xl font-bold text-foreground pt-1">{formatVnd(analyticsData.grossRevenue)}</p>
            <p className="text-[11px] text-muted-foreground pt-1">Tổng tiền người mua đã thanh toán</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Phí Sàn SkinSense (5%)</p>
            <p className="text-2xl font-bold text-destructive pt-1">-{formatVnd(analyticsData.platformFee)}</p>
            <p className="text-[11px] text-muted-foreground pt-1">Phí duy trì kênh bán hàng & vận hành</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-emerald-500/5 border-emerald-500/30">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 font-bold">Thực Nhận Về Ví (Net Revenue)</p>
            <p className="text-2xl font-bold text-emerald-600 pt-1">{formatVnd(analyticsData.netEarnings)}</p>
            <p className="text-[11px] text-muted-foreground pt-1">Doanh thu giải ngân chính thức</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Table */}
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base font-bold">Biểu Đồ & Bảng Biến Động Doanh Thu Theo Ngày</CardTitle>
          <CardDescription className="text-xs">Chi tiết doanh số phát sinh thực tế từng ngày trong kỳ báo cáo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyBreakdown.map((row) => (
              <div key={row.date} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs">
                <span className="font-semibold text-foreground">{row.date}</span>
                <span className="text-muted-foreground">{row.orders} đơn hàng</span>
                <span className="font-bold text-emerald-600">{formatVnd(row.revenue)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
