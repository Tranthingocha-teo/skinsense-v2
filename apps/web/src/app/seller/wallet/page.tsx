"use client";

import { SellerWallet } from "@/components/seller/seller-wallet";
import { INITIAL_SHOPS } from "@skinsense/domain";

export default function WalletPage() {
  const shop = INITIAL_SHOPS[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ví Người Bán</h1>
        <p className="text-sm text-muted-foreground pt-0.5">
          Theo dõi số dư khả dụng, lịch sử doanh thu giải ngân từ đơn hàng và tạo yêu cầu rút tiền về ngân hàng
        </p>
      </div>

      <SellerWallet shop={shop} />
    </div>
  );
}
