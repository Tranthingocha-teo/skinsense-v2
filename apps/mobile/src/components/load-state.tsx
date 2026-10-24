import { CloudOff, RotateCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

// What a data screen renders before its data arrives: loading, or a failed load with a retry.
export function LoadState({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  const { t } = useTranslation();
  if (!failed) {
    return (
      <View className="py-16">
        <ActivityIndicator accessibilityLabel={t('common.loading')} className="text-primary" />
      </View>
    );
  }
  // Canvas AndroidLoadError: centred in the space the screen's data would fill.
  return (
    <View role="alert" className="my-auto items-center gap-[18px] px-10 pb-[72px] pt-8">
      <View className="size-16 items-center justify-center rounded-pill border border-border">
        <Icon as={CloudOff} size={28} strokeWidth={1.5} />
      </View>
      <Text className="text-center text-[15.5px] font-light leading-6">{t('common.loadError')}</Text>
      <Pressable role="button" onPress={onRetry} className="h-12 flex-row items-center gap-2.5 rounded-control border border-muted-foreground px-6">
        <Icon as={RotateCw} size={18} strokeWidth={1.5} />
        <Text className="text-[15px]">{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}
