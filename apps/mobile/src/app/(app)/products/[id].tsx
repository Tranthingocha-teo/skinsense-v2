import { type Zone } from '@skinsense/domain';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ProductDetail } from '@/components/product-detail';

export default function ProductDetailScreen() {
  const { id, zone } = useLocalSearchParams<{ id: string; zone?: Zone }>();
  return (
    <View className="flex-1 bg-background">
      <ProductDetail productId={id} zone={zone} />
    </View>
  );
}
