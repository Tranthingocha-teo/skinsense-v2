"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SellerRegistrationModal } from "@/components/seller/seller-registration-modal";
import { SellerStatusCard } from "@/components/seller/seller-status-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Store, ShieldCheck } from "lucide-react";
import type { ShopStatus } from "@skinsense/domain";

export default function RegisterPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ShopStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmitted = () => {
    setStatus("pending");
    setModalOpen(false);
  };

  const handleDevApprove = () => {
    setStatus("approved");
    router.push("/seller/dashboard");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Store className="size-6 text-emerald-600" />
          Đăng Ký Trở Thành Người Bán
        </h1>
        <p className="text-sm text-muted-foreground pt-0.5">
          Gia nhập nền tảng dược mỹ phẩm SkinSense để tiếp cận hàng triệu khách hàng chăm sóc da chuyên sâu
        </p>
      </div>

      {status ? (
        <div className="space-y-4">
          <SellerStatusCard
            status={status}
            shopName="Gian Hàng SkinSense Đăng Ký"
            ownerName="Chủ Gian Hàng"
            onManageShop={() => router.push("/seller/dashboard")}
          />

          {status === "pending" && (
            <Card className="border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <strong>Dev Mode / Kiểm Thử:</strong> Nhấn nút bên để giả lập Quản trị viên duyệt hồ sơ ngay lập tức.
                </div>
                <Button size="sm" onClick={handleDevApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                  Duyệt Nhanh (Dev Mode)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600" />
              Quyền Lợi Gian Hàng Dược Mỹ Phẩm Chính Hãng
            </CardTitle>
            <CardDescription>
              Đồng hành cùng SkinSense đưa các sản phẩm chăm sóc da đạt chuẩn y khoa tới người dùng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <div className="font-bold text-sm text-foreground mb-1">Tiếp Cận Chuẩn Khách Hàng</div>
                <p className="text-xs text-muted-foreground">Khách hàng được phân tích da AI và đề xuất sản phẩm phù hợp 100%.</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <div className="font-bold text-sm text-foreground mb-1">Doanh Thu Giải Ngân Tự Động</div>
                <p className="text-xs text-muted-foreground">Tiền hàng về ví ngay khi đơn thành công, minh bạch chi phí sàn.</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <div className="font-bold text-sm text-foreground mb-1">Bảo Hộ Thương Hiệu</div>
                <p className="text-xs text-muted-foreground">Xác thực chứng nhận đại lý chính hãng và nhãn Official Store.</p>
              </div>
            </div>

            <Button onClick={() => setModalOpen(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5">
              <Sparkles className="size-4 mr-2" />
              Nộp Hồ Sơ Đăng Ký Cửa Hàng
            </Button>
          </CardContent>
        </Card>
      )}

      <SellerRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}
