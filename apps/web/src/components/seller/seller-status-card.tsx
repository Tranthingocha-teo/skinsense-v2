"use client";

import { Clock, CheckCircle2, XCircle, Store, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ShopStatus } from "@skinsense/domain";

export function SellerStatusCard({
  status,
  shopName = "Gian Hàng SkinSense",
  ownerName = "Chủ gian hàng",
  createdAt = "Hôm nay",
  onManageShop,
}: {
  status: ShopStatus;
  shopName?: string;
  ownerName?: string;
  createdAt?: string;
  onManageShop?: () => void;
}) {
  if (status === "approved") {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>{shopName}</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                    APPROVED
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">Đại diện: {ownerName} • Đã duyệt chính thức</CardDescription>
              </div>
            </div>
            {onManageShop && (
              <Button onClick={onManageShop} className="bg-emerald-600 hover:bg-emerald-700 text-white size-sm text-xs font-medium">
                Vào Kênh Người Bán
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          Tài khoản của bạn đã được xác minh tư cách Gian hàng Dược mỹ phẩm chính hãng trên SkinSense Vietnam.
        </CardContent>
      </Card>
    );
  }

  if (status === "rejected") {
    return (
      <Card className="border-destructive/30 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <XCircle className="size-6" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>{shopName}</span>
                <Badge variant="destructive" className="text-xs">
                  REJECTED
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">Đơn đăng ký không được chấp nhận</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          Rất tiếc, đơn đăng ký bán hàng của bạn chưa đáp ứng đủ tiêu chuẩn xét duyệt tư cách Supplier. Vui lòng kiểm tra lại giấy phép kinh doanh hoặc liên hệ bộ phận hỗ trợ.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600">
            <Clock className="size-6" />
          </div>
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span>{shopName}</span>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                PENDING (Chờ xét duyệt)
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">Gửi ngày: {createdAt} • Đang được Ban Quản Trị xem xét</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-muted-foreground">
        Hồ sơ gian hàng của bạn đang trong tiến trình kiểm tra danh mục dược mỹ phẩm. Thời gian xử lý trung bình từ 12-24 giờ làm việc.
      </CardContent>
    </Card>
  );
}
