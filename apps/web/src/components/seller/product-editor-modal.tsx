"use client";

import { useState } from "react";
import { Plus, X, Upload, Check, AlertCircle, Loader2, Package, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { validateProductInput, type ProductInput, type Product } from "@skinsense/domain";

const CATEGORIES = [
  "Tẩy trang & Sữa rửa mặt",
  "Toner & Nước hoa hồng",
  "Serum & Tinh chất đặc trị",
  "Kem dưỡng & Khóa ẩm",
  "Kem chống nắng phổ rộng",
  "Mặt nạ & Sản phẩm làm dịu",
  "Sản phẩm chấm mụn",
  "Thực phẩm chức năng da liễu",
  "Sản phẩm chăm sóc da khác",
];

const SKIN_TYPES = [
  { id: "oily", label: "Da dầu / Bã nhờn" },
  { id: "dry", label: "Da khô / Thiếu ẩm" },
  { id: "combination", label: "Da hỗn hợp" },
  { id: "sensitive", label: "Da nhạy cảm / Dễ kích ứng" },
  { id: "normal", label: "Da thường" },
];

export function ProductEditorModal({
  open,
  onOpenChange,
  initialProduct,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProduct?: Product | null;
  onSave?: (productData: ProductInput) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [name, setName] = useState(initialProduct?.name || "");
  const [brand, setBrand] = useState(initialProduct?.brand || "");
  const [category, setCategory] = useState(initialProduct?.category || CATEGORIES[0]);
  const [priceVnd, setPriceVnd] = useState<number>(initialProduct?.priceVnd || 350000);
  const [originalPriceVnd, setOriginalPriceVnd] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number>(50);
  const [summary, setSummary] = useState(initialProduct?.summary || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [ingredients, setIngredients] = useState(initialProduct?.keyActives?.join(", ") || "");
  const [skinTypes, setSkinTypes] = useState<string[]>(["oily", "sensitive"]);
  const [howToUse, setHowToUse] = useState(initialProduct?.howToUse || "");
  const [caution, setCaution] = useState(initialProduct?.caution || "");
  const [origin, setOrigin] = useState("Pháp");
  const [imageUrl, setImageUrl] = useState(
    initialProduct?.imageUrl || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80"
  );

  function toggleSkinType(id: string) {
    setSkinTypes((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const input: ProductInput = {
      name,
      brand,
      category,
      priceVnd,
      originalPriceVnd,
      stock,
      summary,
      description,
      ingredients,
      skinTypeCompatibility: skinTypes,
      howToUse,
      caution,
      origin,
      images: [imageUrl],
    };

    const validation = validateProductInput(input);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await new Promise((res) => setTimeout(res, 600));
      if (onSave) onSave(input);
      onOpenChange(false);
    } catch {
      setErrors({ form: "Lỗi lưu thông tin sản phẩm. Vui lòng kiểm tra lại." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Package className="size-5 text-emerald-600" />
            <span>{initialProduct ? "Chỉnh Sửa Thông Tin Sản Phẩm" : "Thêm Sản Phẩm Mới Vào Gian Hàng"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cung cấp đầy đủ thông tin chuẩn dược mỹ phẩm giúp người mua dễ dàng lựa chọn sản phẩm phù hợp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.form && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tên Sản Phẩm *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên sản phẩm đầy đủ..." />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Thương Hiệu *</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="La Roche-Posay, Skin1004..." />
              {errors.brand && <p className="text-xs text-destructive">{errors.brand}</p>}
            </div>
          </div>

          {/* Category & Origin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Danh Mục *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Xuất Xứ</Label>
              <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Pháp, Hàn Quốc, Mỹ..." />
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Giá Bán Niêm Yết (VND) *</Label>
              <Input type="number" value={priceVnd} onChange={(e) => setPriceVnd(Number(e.target.value))} />
              {errors.priceVnd && <p className="text-xs text-destructive">{errors.priceVnd}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Giá Gốc Gạch Đi (VND)</Label>
              <Input
                type="number"
                value={originalPriceVnd || ""}
                onChange={(e) => setOriginalPriceVnd(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="450000"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Kho Hàng *</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock}</p>}
            </div>
          </div>

          {/* Skin Type Compatibility */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tương Thích Loại Da</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {SKIN_TYPES.map((st) => (
                <label key={st.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skinTypes.includes(st.id)}
                    onChange={() => toggleSkinType(st.id)}
                    className="size-4 rounded border-input text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{st.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ingredients & Image */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Thành Phần Chính / Active Ingredients</Label>
            <Input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Niacinamide, BHA 2%, Panthenol B5..." />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Link Hình Ảnh Sản Phẩm</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>

          {/* Descriptions & Usage */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tóm Tắt Công Dụng Sản Phẩm</Label>
            <Textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Tóm tắt công dụng nổi bật..." />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hướng Dẫn Sử Dụng & Lưu Ý</Label>
            <Textarea rows={2} value={howToUse} onChange={(e) => setHowToUse(e.target.value)} placeholder="Thoa 1-2 lần/ngày sau bước cleanser..." />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-32">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Lưu sản phẩm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
