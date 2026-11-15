"use client";

import { useRouter } from "next/navigation";
import { SellerDashboard } from "@/components/seller/seller-dashboard";
import { INITIAL_SHOPS } from "@skinsense/domain";

export default function DashboardPage() {
  const router = useRouter();
  const shop = INITIAL_SHOPS[0];

  const handleNavigateTab = (tab: "products" | "orders" | "shop" | "analytics") => {
    router.push(`/seller/${tab}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Bảng Điều Khiển</h1>
        <p className="text-sm text-muted-foreground pt-0.5">
          Tổng quan hoạt động kinh doanh và hiệu suất bán hàng của cửa hàng
        </p>
      </div>

      <SellerDashboard shop={shop} onNavigateTab={handleNavigateTab} />
    </div>
  );
}
