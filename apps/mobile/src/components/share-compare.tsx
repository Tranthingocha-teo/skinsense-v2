import { Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Share, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function MobileShareCompare({
  beforeDate,
  afterDate,
  beforeUrl: _beforeUrl,
  afterUrl: _afterUrl,
}: {
  beforeDate: string;
  afterDate: string;
  beforeUrl?: string;
  afterUrl?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [blurEyes, setBlurEyes] = useState(true);
  const [showDates, setShowDates] = useState(true);

  async function handleShare() {
    try {
      const message = `${t('trends.shareMessage', { before: beforeDate, after: afterDate })}\n#SkinSense`;
      await Share.share({
        message,
        title: t('trends.shareTitle'),
      });
      setOpen(false);
    } catch {
      // User dismissed
    }
  }

  return (
    <>
      <Pressable
        role="button"
        onPress={() => setOpen(true)}
        className="-my-3 -mr-2 h-11 flex-row items-center gap-1.5 px-2"
        accessibilityLabel={t('trends.share')}
      >
        <Icon as={Share2} size={16} strokeWidth={1.5} className="text-foreground" />
        <Text className="text-[13px] font-medium">{t('trends.share')}</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessible={false}
          onPress={() => setOpen(false)}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
        />
        <View className="absolute bottom-0 left-0 right-0 gap-4 rounded-t-card border-t border-border bg-card p-6 pb-9">
          <View className="h-1 w-10 self-center rounded-pill bg-border" />
          <View className="gap-1">
            <Text role="heading" className="font-display text-[22px] font-normal">
              {t('trends.shareTitle')}
            </Text>
            <Text className="text-[13px] font-light text-muted-foreground">
              {beforeDate} → {afterDate}
            </Text>
          </View>

          <View className="gap-3 py-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px]">Che mắt bảo mật (Blur eyes)</Text>
              <Switch value={blurEyes} onValueChange={setBlurEyes} />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px]">Hiển thị ngày chụp</Text>
              <Switch value={showDates} onValueChange={setShowDates} />
            </View>
          </View>

          <View className="flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => setOpen(false)}
            >
              <Text>{t('shell.cancel')}</Text>
            </Button>
            <Button
              className="flex-1"
              onPress={handleShare}
            >
              <Text className="font-medium text-primary-foreground">
                {t('trends.share')}
              </Text>
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}
