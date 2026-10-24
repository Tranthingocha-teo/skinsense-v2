import {
  getProductById,
  PRODUCTS,
  type Product,
  type Zone,
  type ZoneTelemetry,
} from '@skinsense/domain';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { ExternalLink, Sparkles, Star } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

const ZONE_FILTERS: { id: Zone | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'forehead', label: 'Trán' },
  { id: 'leftCheek', label: 'Má trái' },
  { id: 'rightCheek', label: 'Má phải' },
  { id: 'nose', label: 'Mũi' },
  { id: 'chin', label: 'Cằm' },
];

export function ProductCard({
  product,
  zone,
}: {
  product: Product;
  zone?: Zone;
}) {
  const query = zone ? `?zone=${zone}` : '';
  return (
    <Pressable
      role="button"
      accessibilityLabel={product.name}
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id, ...(zone ? { zone } : {}) } } as any)}
      className="w-[220px] rounded-card border border-border bg-card p-3 active:scale-[0.98]"
    >
      <View className="relative aspect-square w-full overflow-hidden rounded-control bg-surface-2">
        <Image
          source={{ uri: product.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
        <View className="absolute right-2 top-2 rounded-pill bg-background/80 px-2 py-0.5 backdrop-blur-sm">
          <View className="flex-row items-center gap-1">
            <Icon as={Star} size={12} className="text-amber-500 fill-amber-500" />
            <Text className="text-[11px] font-medium">{product.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View className="mt-2.5 gap-1">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {product.brand}
        </Text>
        <Text numberOfLines={2} className="text-[13.5px] font-medium leading-[18px]">
          {product.name}
        </Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-[14px] font-bold text-primary">{product.priceFormatted}</Text>
          <Text className="text-[11px] text-muted-foreground">{product.category}</Text>
        </View>
        {product.keyActives[0] && (
          <View className="mt-1.5 self-start rounded-pill bg-surface-2 px-2 py-0.5">
            <Text numberOfLines={1} className="text-[10.5px] text-foreground">
              {product.keyActives[0]}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function RecommendedProductsSection({
  telemetryMap,
  title = 'Gợi ý sản phẩm cho làn da của bạn',
  subtitle = 'Dựa trên phân tích số đo mẩn đỏ, độ sần và nốt mụn từng vùng',
}: {
  telemetryMap?: Partial<Record<Zone, ZoneTelemetry>>;
  title?: string;
  subtitle?: string;
}) {
  const [selectedZone, setSelectedZone] = useState<Zone | 'all'>('all');

  const filteredProducts =
    selectedZone === 'all'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.targetZones.includes(selectedZone));

  return (
    <View className="mt-4 gap-3">
      <View className="px-5">
        <View className="flex-row items-center gap-2">
          <Icon as={Sparkles} size={18} className="text-primary" />
          <Text role="heading" aria-level="2" className="text-[17px] font-semibold">
            {title}
          </Text>
        </View>
        {subtitle && (
          <Text className="mt-0.5 text-[12.5px] font-light text-muted-foreground">
            {subtitle}
          </Text>
        )}
      </View>

      {/* Filter Tabs by Zone */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row gap-2 px-5 pb-1"
      >
        {ZONE_FILTERS.map((filter) => {
          const active = selectedZone === filter.id;
          return (
            <Pressable
              key={filter.id}
              role="tab"
              aria-selected={active}
              onPress={() => setSelectedZone(filter.id)}
              className={`rounded-pill px-3.5 py-1.5 border ${
                active
                  ? 'bg-foreground border-foreground'
                  : 'bg-card border-border'
              }`}
            >
              <Text
                className={`text-[12.5px] font-medium ${
                  active ? 'text-background' : 'text-foreground'
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Horizontal Cards Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row gap-3 px-5 pb-3 pt-1"
      >
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            zone={selectedZone === 'all' ? undefined : selectedZone}
          />
        ))}
      </ScrollView>
    </View>
  );
}
