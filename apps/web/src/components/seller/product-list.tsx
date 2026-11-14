"use client";

import { useState } from "react";
import { Search, Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, Archive, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatVnd, PRODUCTS, type Product } from "@skinsense/domain";

export interface ExtendedProduct extends Product {
  stock?: number;
  status?: "draft" | "active" | "inactive" | "out_of_stock";
}

export function ProductList({
  products = PRODUCTS.map((p) => ({ ...p, stock: 50, status: "active" as const })),
  onAddProduct,
  onEditProduct,
  onArchiveProduct,
}: {
  products?: ExtendedProduct[];
  onAddProduct?: () => void;
  onEditProduct?: (product: ExtendedProduct) => void;
  onArchiveProduct?: (productId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [productList, setProductList] = useState<ExtendedProduct[]>(products);
  const [archiveTarget, setArchiveTarget] = useState<ExtendedProduct | null>(null);

  const categories = Array.from(new Set(productList.map((p) => p.category)));

  const filtered = productList.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || (p.status ?? "active") === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  function toggleStatus(productId: string) {
    setProductList((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const nextStatus = p.status === "active" ? "inactive" : "active";
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  }

  function handleConfirmArchive() {
    if (!archiveTarget) return;
    setProductList((prev) => prev.filter((p) => p.id !== archiveTarget.id));
    if (onArchiveProduct) onArchiveProduct(archiveTarget.id);
    setArchiveTarget(null);
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên sản phẩm hoặc thương hiệu..."
              className="pl-9"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động (Active)</option>
            <option value="inactive">Ẩn (Inactive)</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
        </div>

        {onAddProduct && (
          <Button onClick={onAddProduct} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2">
            <Plus className="size-4" />
            <span>Thêm sản phẩm mới</span>
          </Button>
        )}
      </div>

      {/* Product Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">Sản Phẩm</TableHead>
              <TableHead>Danh Mục</TableHead>

<TableHead className="text-right">Giá Bán (VND)</TableHead>
              <TableHead className="text-center">Kho Hàng</TableHead>
              <TableHead className="text-center">Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy sản phẩm nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => {
                const stock = product.stock ?? 50;
                const status = product.status ?? "active";

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="size-12 rounded-lg object-cover bg-muted border shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-sm line-clamp-1 text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{product.category}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">{formatVnd(product.priceVnd)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={stock > 0 ? "bg-muted text-foreground" : "bg-destructive/10 text-destructive border-destructive/20"}>
                        {stock > 0 ? `${stock} chai/lọ` : "Hết hàng"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                        {status === "active" ? "Đang bán" : "Tạm ẩn"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleStatus(product.id)}
                          title={status === "active" ? "Tạm ẩn sản phẩm" : "Hiện sản phẩm"}
                        >
                          {status === "active" ? <ToggleRight className="size-5 text-emerald-600" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
                        </Button>
                        {onEditProduct && (
                          <Button variant="ghost" size="icon" onClick={() => onEditProduct(product)} title="Sửa sản phẩm">
                            <Edit2 className="size-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setArchiveTarget(product)}
                          title="Lưu trữ / Xóa"
                          className="hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Archive Modal */}
      <Dialog open={!!archiveTarget} onOpenChange={(v) => { if (!v) setArchiveTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span>Xác Nhận Lưu Trữ / Xóa Sản Phẩm</span>
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              Bạn có chắc chắn muốn lưu trữ sản phẩm <strong>{archiveTarget?.name}</strong>? Sản phẩm sẽ ngừng xuất hiện trên cửa hàng nhưng dữ liệu lịch sử đơn hàng của người mua vẫn được giữ nguyên.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmArchive} variant="destructive">
              Xác nhận lưu trữ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
