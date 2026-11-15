"use client";

import { useState } from "react";
import { ShopManagementForm } from "@/components/seller/shop-management-form";
import { ShopPreviewCard } from "@/components/seller/shop-preview-card";
import { INITIAL_SHOPS, type Shop } from "@skinsense/domain";

export default function ShopPage() {
  const [shop, setShop] = useState<Shop>(INITIAL_SHOPS[0]);

  const handleSave = (updated: Partial<Shop>) => {
    setShop((prev) => ({ ...prev, ...updated }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Hồ Sơ Cửa Hàng</h1>
        <p className="text-sm text-muted-foreground pt-0.5">
          Quản lý thông tin thương hiệu, hình ảnh đại diện, banner, địa chỉ và trạng thái hoạt động của gian hàng
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ShopManagementForm shop={shop} onSave={handleSave} />
        </div>
        <div className="space-y-4">
          <div className="font-semibold text-sm text-foreground">Xem Trước Gian Hàng</div>
          <ShopPreviewCard shop={shop} />
        </div>
      </div>
    </div>
  );
}
