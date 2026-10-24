import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { MarketProductShops } from '@/components/market-product-shops';

export default function MarketProductShopsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();

  return (
    <View className="flex-1 bg-background">
      <MarketProductShops productId={productId} />
    </View>
  );
}
