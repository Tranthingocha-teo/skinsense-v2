import { formatVnd, type Zone, type ZoneTelemetry } from '@skinsense/domain';
import { Link, router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { fetchApprovedMarketplaceProducts, type MarketplaceApiProduct } from '@/lib/api';
import { Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ProductImage } from '@/components/artwork';

const ZONE_FILTERS: { id: Zone | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'forehead', label: 'Trán' },
  { id: 'leftCheek', label: 'Má trái' },
  { id: 'rightCheek', label: 'Má phải' },
  { id: 'nose', label: 'Mũi' },
  { id: 'chin', label: 'Cằm' },
];

export function ProductCard({ product }: { product: MarketplaceApiProduct }) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={product.name}
      onPress={() => router.push('/store' as Href)}
      className="w-[232px] rounded-[20px] border border-border/80 bg-card p-3.5 shadow-xs active:scale-[0.98]"
    >
      <View className="aspect-square w-full overflow-hidden rounded-[14px] bg-surface-2">
        <ProductImage
          uri={product.coverImage || product.images?.[0]}
          name={product.name}
          brand={product.brand || product.shopName}
          category={product.category}
          seed={product.id}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <View className="mt-2.5 gap-1">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {product.brand || product.shopName}
        </Text>
        <Text numberOfLines={2} className="text-[13.5px] font-medium leading-[18px]">
          {product.name}
        </Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-[14px] font-bold text-primary">{formatVnd(product.price)}</Text>
          <Text numberOfLines={1} className="max-w-[90px] text-[11px] text-muted-foreground">
            {product.shopName}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function RecommendedProductsSection({
  title = 'Gợi ý sản phẩm cho làn da của bạn',
  subtitle = 'Sản phẩm thật đã được Ban Quản Trị SkinSense kiểm duyệt',
}: {
  telemetryMap?: Partial<Record<Zone, ZoneTelemetry>>;
  title?: string;
  subtitle?: string;
}) {
  const [products, setProducts] = useState<MarketplaceApiProduct[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchApprovedMarketplaceProducts()
      .then((list) => !cancelled && setProducts(list))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <View className="mt-4 gap-3">
      <View className="px-5">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <Icon as={Sparkles} size={18} className="text-primary" />
            <Text role="heading" aria-level="2" className="text-[17px] font-semibold">
              {title}
            </Text>
          </View>
          <Link href={'/store' as Href} asChild>
            <Pressable
              role="button"
              className="min-h-9 justify-center rounded-full border border-border/80 bg-surface-2 px-3.5 py-1 active:scale-[0.97]"
            >
              <Text className="text-[11.5px] font-medium text-primary">Sàn & Routine</Text>
            </Pressable>
          </Link>
        </View>
        {subtitle && <Text className="mt-0.5 text-[12.5px] font-light text-muted-foreground">{subtitle}</Text>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-3 px-5 pb-3 pt-1">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}
