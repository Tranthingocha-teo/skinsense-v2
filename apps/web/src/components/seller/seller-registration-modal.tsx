"use client";

import { useState } from "react";
import { Store, User, Phone, Mail, MapPin, Tag, FileText, CheckCircle2, AlertCircle, Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateSellerRegistration, type SellerRegistrationInput } from "@skinsense/domain";

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

export function SellerRegistrationModal({
  trigger,
  onSuccess,
}: {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  function resetForm() {
    setShopName("");
    setOwnerName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCategory(CATEGORIES[0]);
    setDescription("");
    setAvatarUrl("");
    setFieldErrors({});
    setFormError(null);
    setSubmittedSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const input: SellerRegistrationInput = {
      shopName,
      ownerName,
      phone,
      email,
      address,
      category,
      description,
      avatarUrl,
    };

    const validation = validateSellerRegistration(input);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      // Simulate/Persist registration logic
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    } catch {
      setFormError("Đã xảy ra lỗi trong quá trình gửi đơn đăng ký. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
            <Store className="size-4" />
            <span>Đăng ký bán hàng / Supplier</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
            <Store className="size-6 text-emerald-600" />
            <span>Đăng Ký Gian Hàng / Người Bán SkinSense</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Trở thành đối tác cung cấp dược mỹ phẩm chính hãng trên hệ thống SkinSense Vietnam.
          </DialogDescription>
        </DialogHeader>

        {submittedSuccess ? (
          <div className="py-8 px-4 text-center space-y-4">
            <div className="mx-auto size-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Gửi đơn đăng ký thành công!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Đơn đăng ký Gian hàng <strong>{shopName}</strong> của bạn đã được tiếp nhận và đang ở trạng thái{" "}
              <span className="text-amber-600 font-semibold">PENDING (Chờ xét duyệt)</span>. Ban Quản Trị SkinSense sẽ
              kiểm duyệt và phản hồi trong vòng 24 giờ.
            </p>
            <div className="pt-4">
              <Button onClick={() => setOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                Đã hiểu & Đóng
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shop Name */}
              <div className="space-y-1.5">
                <Label htmlFor="shopName" className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Tên Gian Hàng *
                </Label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="shopName"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Ví dụ: La Roche-Posay Official"
                    className="pl-9"
                  />
                </div>
                {fieldErrors.shopName && <p className="text-xs text-destructive">{fieldErrors.shopName}</p>}
              </div>

              {/* Owner Name */}
              <div className="space-y-1.5">
                <Label htmlFor="ownerName" className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Họ & Tên Người Đại Diện *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="ownerName"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="pl-9"
                  />
                </div>
                {fieldErrors.ownerName && <p className="text-xs text-destructive">{fieldErrors.ownerName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Số Điện Thoại Liên Hệ *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    className="pl-9"
                  />
                </div>
                {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                  Email Kinh Doanh *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seller@skinsense.vn"
                    className="pl-9"
                  />
                </div>
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                Ngành Hàng Kinh Doanh Chính *
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.category && <p className="text-xs text-destructive">{fieldErrors.category}</p>}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                Địa Chỉ Kinh Doanh / Kho Hàng *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Tòa nhà Keangnam, Mễ Trì, Nam Từ Liêm, Hà Nội"
                  className="pl-9"
                />
              </div>
              {fieldErrors.address && <p className="text-xs text-destructive">{fieldErrors.address}</p>}
            </div>

            {/* Avatar URL */}
            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl" className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                Logo / Avatar Gian Hàng (Link hình ảnh)
              </Label>
              <div className="relative">
                <Upload className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
                Mô Tả Ngắn Về Gian Hàng
              </Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu về dòng sản phẩm, thế mạnh thương hiệu hoặc cam kết chất lượng..."
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-32">
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi đơn đăng ký</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
