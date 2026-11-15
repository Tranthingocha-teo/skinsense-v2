"use client";

import { useState } from "react";
import { Store, Phone, Mail, MapPin, Tag, FileText, Upload, Save, CheckCircle2, AlertCircle, Eye, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { validateShopProfileUpdate, type ShopProfileUpdateInput, type Shop } from "@skinsense/domain";

const CATEGORIES = [
  "Dược mỹ phẩm & Chăm sóc da liễu",
  "Tẩy trang & Sữa rửa mặt",
  "Toner & Nước hoa hồng",
  "Serum & Tinh chất đặc trị",
  "Kem dưỡng & Khóa ẩm",
  "Kem chống nắng phổ rộng",
  "Mặt nạ & Sản phẩm làm dịu",
  "Sản phẩm chấm mụn",
  "Thương hiệu Mỹ phẩm Hàn Quốc",
  "Ngành hàng Chăm sóc da khác",
];

export function ShopManagementForm({
  shop,
  onSave,
}: {
  shop: Shop;
  onSave?: (updated: Partial<Shop>) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Editable Fields
  const [shopName, setShopName] = useState(shop.shopName);
  const [phone, setPhone] = useState(shop.phone);
  const [email, setEmail] = useState(shop.email || "");
  const [address, setAddress] = useState(shop.address);
  const [category, setCategory] = useState("Dược mỹ phẩm & Chăm sóc da liễu");
  const [description, setDescription] = useState("Chuyên phân phối dược mỹ phẩm nhập khẩu chính hãng 100%, tư vấn chuẩn da liễu.");
  const [avatarUrl, setAvatarUrl] = useState(shop.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState("https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80");
  const [operatingStatus, setOperatingStatus] = useState<"open" | "temporarily_closed">("open");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const input: ShopProfileUpdateInput = {
      shopName,
      phone,
      email,
      address,
      category,
      description,
      avatarUrl,
      bannerUrl,
      operatingStatus,
    };

    const validation = validateShopProfileUpdate(input);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSuccessMsg("Cập nhật thông tin gian hàng và trạng thái hoạt động thành công!");
      if (onSave) {
        onSave({
          shopName,
          phone,
          address,
          avatarUrl,
        });
      }
    } catch {
      setErrorMsg("Không thể cập nhật hồ sơ gian hàng. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="size-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5">
          <AlertCircle className="size-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Operating Status Card */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Power className="size-5 text-emerald-600" />
              <div>
                <CardTitle className="text-base font-bold">Trạng Thái Hoạt Động Của Gian Hàng</CardTitle>
                <CardDescription className="text-xs">
                  Bật/tắt trạng thái nhận đơn hàng tự động từ người mua.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={operatingStatus === "open" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                {operatingStatus === "open" ? "MỞ CỬA HÀNG" : "TẠM ĐÓNG CỬA"}
              </Badge>
              <Switch
                checked={operatingStatus === "open"}
                onCheckedChange={(checked) => setOperatingStatus(checked ? "open" : "temporarily_closed")}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Info Card */}
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Store className="size-5 text-emerald-600" />
            <span>Thông Tin Gian Hàng & Nhận Diện</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tên Gian Hàng *</Label>
              <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
              {errors.shopName && <p className="text-xs text-destructive">{errors.shopName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ngành Hàng Chính *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Logo / Avatar (URL)</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Banner Bìa Gian Hàng (URL)</Label>
              <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mô Tả Giới Thiệu Gian Hàng</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Business Address */}
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <MapPin className="size-5 text-emerald-600" />
            <span>Liên Hệ & Địa Chỉ Xuất Hàng</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Số Điện Thoại *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email Liên Hệ *</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Địa Chỉ Kinh Doanh / Lấy Hàng *</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium min-w-36 gap-2">
          <Save className="size-4" />
          <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
        </Button>
      </div>
    </form>
  );
}
