import { View } from 'react-native';

import { ClinicalStorefront } from '@/components/clinical-storefront';

export default function StoreScreen() {
  return (
    <View className="flex-1 bg-background">
      <ClinicalStorefront />
    </View>
  );
}
