import {
  explainProductRecommendation,
  getProductById,
  type Product,
  type Zone,
  type ZoneTelemetry,
} from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function ProductDetail({
  productId,
  zone = 'forehead',
  telemetry,
}: {
  productId: string;
  zone?: Zone;
  telemetry?: ZoneTelemetry;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { top, bottom } = useSafeAreaInsets();
  const product = getProductById(productId);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-background">
        <Text className="text-center text-lg font-medium">Không tìm thấy sản phẩm</Text>
        <Pressable
          role="button"
          onPress={() => router.back()}
          className="mt-4 rounded-control bg-primary px-5 py-2.5"
        >
          <Text className="font-medium text-primary-foreground">Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const defaultTelem: ZoneTelemetry = telemetry ?? {
    redness: 1.5,
    unevenness: 1.4,
    spotCount: 0,
  };

  const clinicalExplanation = explainProductRecommendation(product, zone, defaultTelem);

  async function openPurchaseLink() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const supported = await Linking.canOpenURL(product!.affiliateUrl);
      if (supported) {
        await Linking.openURL(product!.affiliateUrl);
      } else {
        await Linking.openURL('https://shopee.vn');
      }
    } catch {
      await Linking.openURL('https://shopee.vn');
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* Top Header */}
      <View
        style={{ paddingTop: Math.max(top, 12) }}
        className="flex-row items-center justify-between border-b border-border/40 px-3 pb-2.5 bg-background/95"
      >
        <Pressable
          role="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          className="size-11 items-center justify-center rounded-pill active:bg-surface-2"
        >
          <Icon as={ChevronLeft} size={24} strokeWidth={1.5} className="text-foreground" />
        </Pressable>
        <Text className="font-display text-[18px] font-medium">Chi tiết sản phẩm</Text>
        <View className="size-11" />
      </View>

      {/* Main Scrollable View */}
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-32 pt-3"
        showsVerticalScrollIndicator={false}
      >
        {/* Product Hero Image */}
        <View className="aspect-square w-full overflow-hidden rounded-card border border-border bg-surface-2 shadow-sm">
          <Image
            source={{ uri: product.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* Brand & Title Info */}
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <View className="rounded-pill bg-surface-2 px-2.5 py-1">
              <Text className="text-[11.5px] font-semibold uppercase tracking-wider text-primary">
                {product.brand}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 rounded-pill bg-amber-500/10 px-2.5 py-1">
              <Icon as={Star} size={13} className="text-amber-500 fill-amber-500" />
              <Text className="text-[12px] font-semibold text-amber-500">{product.rating.toFixed(1)}</Text>
              <Text className="text-[11px] text-muted-foreground">({product.reviewsCount.toLocaleString()} đánh giá)</Text>
            </View>
          </View>

          <Text role="heading" aria-level="1" className="font-display text-[22px] font-medium leading-[28px]">
            {product.name}
          </Text>

          <View className="mt-1 flex-row items-baseline gap-2">
            <Text className="text-[24px] font-bold text-primary">{product.priceFormatted}</Text>
            <Text className="text-[13px] text-muted-foreground">· {product.category}</Text>
          </View>
        </View>

        {/* AI & Clinical Match Explanation */}
        <View className="gap-2 rounded-card border border-primary/20 bg-primary/5 p-4">
          <View className="flex-row items-center gap-2">
            <Icon as={Sparkles} size={18} className="text-primary" />
            <Text className="text-[14.5px] font-semibold text-primary">
              Vì sao sản phẩm này phù hợp với da bạn?
            </Text>
          </View>
          <Text className="text-[13.5px] font-light leading-[20px] text-foreground">
            {clinicalExplanation}
          </Text>
        </View>

        {/* Key Actives */}
        <View className="gap-2.5">
          <Text role="heading" aria-level="2" className="text-[15px] font-semibold">
            Hoạt chất chính
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {product.keyActives.map((active, i) => (
              <View key={i} className="flex-row items-center gap-1.5 rounded-pill border border-border bg-card px-3 py-1.5">
                <Icon as={CheckCircle2} size={13} className="text-success" />
                <Text className="text-[12.5px] font-medium">{active}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Detailed Description */}
        <View className="gap-2">
          <Text role="heading" aria-level="2" className="text-[15px] font-semibold">
            Công dụng nổi bật
          </Text>
          <Text className="text-[14px] font-light leading-[22px] text-muted-foreground">
            {product.description}
          </Text>
        </View>

        {/* How to use */}
        <View className="gap-2">
          <Text role="heading" aria-level="2" className="text-[15px] font-semibold">
            Hướng dẫn trong chu trình Routine
          </Text>
          <View className="rounded-card border border-border bg-card p-3.5">
            <Text className="text-[13.5px] font-light leading-[21px]">
              {product.howToUse}
            </Text>
          </View>
        </View>

        {/* Caution if any */}
        {product.caution && (
          <View className="flex-row gap-2.5 rounded-card border border-amber-500/20 bg-amber-500/5 p-3.5">
            <Icon as={AlertTriangle} size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <Text className="flex-1 text-[12.5px] font-light leading-[19px] text-amber-600 dark:text-amber-400">
              {product.caution}
            </Text>
          </View>
        )}

        {/* Authentic Warranty Badge */}
        <View className="flex-row items-center justify-center gap-2 py-2">
          <Icon as={ShieldCheck} size={16} className="text-success" />
          <Text className="text-[12.5px] font-light text-muted-foreground">
            Cam kết 100% phân phối chính hãng qua Shopee Mall / Web thương hiệu
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={{ paddingBottom: Math.max(bottom, 14) }}
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/95 px-5 pt-3 backdrop-blur-md"
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-[11.5px] text-muted-foreground">Giá tham khảo</Text>
            <Text className="text-[20px] font-bold text-foreground">{product.priceFormatted}</Text>
          </View>
          <Pressable
            role="button"
            accessibilityLabel="Bấm vào mua hàng"
            onPress={openPurchaseLink}
            className="flex-[1.5] h-12 flex-row items-center justify-center gap-2 rounded-control bg-primary active:opacity-90"
          >
            <Icon as={ExternalLink} size={17} className="text-primary-foreground" />
            <Text className="text-[15px] font-medium text-primary-foreground">
              Mua hàng chính hãng
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
