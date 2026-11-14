"use client";

import { useState } from "react";
import { ProductList, type ExtendedProduct } from "@/components/seller/product-list";
import { ProductEditorModal } from "@/components/seller/product-editor-modal";
import { PRODUCTS, type ProductInput } from "@skinsense/domain";

export default function ProductsPage() {
  const [products, setProducts] = useState<ExtendedProduct[]>(
    PRODUCTS.map((p) => ({ ...p, stock: 50, status: "active" as const }))
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setEditorOpen(true);
  };

  const handleEditProduct = (product: ExtendedProduct) => {
    setEditingProduct(product);
    setEditorOpen(true);
  };

  const handleArchiveProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleSaveProduct = (input: ProductInput) => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: input.name,
                brand: input.brand,
                category: input.category,
                priceVnd: input.priceVnd,
                summary: input.summary || p.summary,
                description: input.description || p.description,
                howToUse: input.howToUse || p.howToUse,
                caution: input.caution || p.caution,
                stock: input.stock ?? p.stock,
              }
            : p
        )
      );
    } else {
      const newProduct: ExtendedProduct = {
        id: `sp-${Date.now()}`,
        name: input.name,
        brand: input.brand,
        category: input.category,
        priceVnd: input.priceVnd,
        priceFormatted: input.priceVnd.toLocaleString("vi-VN") + "₫",
        rating: 5.0,
        reviewCount: 0,
        primaryImageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80",
        summary: input.summary || "",
        description: input.description || "",
        keyActives: input.ingredients ? input.ingredients.split(",").map((s) => s.trim()) : [],
        howToUse: input.howToUse || "",
        caution: input.caution || "",
        stock: input.stock || 50,
        status: "active",
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản Lý Sản Phẩm</h1>
        <p className="text-sm text-muted-foreground pt-0.5">
          Quản lý danh mục sản phẩm, giá bán, tồn kho và hiển thị trên gian hàng Marketplace
        </p>
      </div>

      <ProductList
        products={products}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onArchiveProduct={handleArchiveProduct}
      />

      <ProductEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialProduct={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
