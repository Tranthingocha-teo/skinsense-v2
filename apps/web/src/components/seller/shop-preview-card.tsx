"use client";

import { Star, MapPin, Phone, CheckCircle2, ShieldCheck, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Shop } from "@skinsense/domain";
import { InitialsAvatar } from "@/components/initials-avatar";

export function ShopPreviewCard({ shop }: { shop: Shop }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <div className="relative h-32 sm:h-40 bg-muted">
        {/* No banner uploaded yet: the photo-placeholder gradient from DESIGN.md. */}
        <div aria-hidden className="size-full bg-[linear-gradient(135deg,var(--photo-a),var(--photo-b)_55%,var(--photo-c))]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
      </div>

      <CardContent className="relative px-6 pb-6 pt-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-4">
          <div className="flex items-end gap-3">
            <InitialsAvatar
              name={shop.shopName}
              seed={shop.id}
              src={shop.avatarUrl}
              label={shop.shopName}
              className="size-20 rounded-2xl border-4 border-background shadow-md text-xl"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{shop.shopName}</h2>
                {shop.isOfficial && (
                  <Badge className="bg-emerald-600 text-white font-semibold text-[11px] gap-1">
                    <ShieldCheck className="size-3" />
                    <span>CHÍNH HÃNG</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>Đại diện: {shop.ownerName}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Star className="size-3.5 fill-amber-500" />
                  {shop.rating.toFixed(1)} ({shop.reviewCount} đánh giá)
                </span>
              </p>
            </div>
          </div>

          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-3 py-1">
            MỞ CỬA BÁN HÀNG
          </Badge>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-emerald-600" />
            <span>{shop.address}</span>
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-3.5 shrink-0 text-emerald-600" />
            <span>Hotline: {shop.phone}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
