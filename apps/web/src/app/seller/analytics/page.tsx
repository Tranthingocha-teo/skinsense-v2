"use client";

import { SalesAnalytics } from "@/components/seller/sales-analytics";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Phân Tích Kinh Doanh</h1>
        <p className="text-sm text-muted-foreground pt-0.5">
          Thống kê chi tiết biểu đồ doanh thu, xu hướng bán hàng và top sản phẩm chạy nhất
        </p>
      </div>

      <SalesAnalytics />
    </div>
  );
}
