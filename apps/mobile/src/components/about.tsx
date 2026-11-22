import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Mark } from '@/components/mark';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import licenses from '@/lib/licenses.json';

const CARD = 'rounded-card border border-border bg-card';
const LINE = 'border-t border-border';
const PREVIEW = 5;

export function About() {
  const { t } = useTranslation();
  const [all, setAll] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  return (
    <ScrollView contentContainerClassName="pb-10 pt-4">
      <View className="flex-row items-center gap-1 pl-2.5 pr-[18px]">
        <Link href="/settings" asChild>
          <Pressable role="button" aria-label={t('about.back')} className="size-11 items-center justify-center">
            <Icon as={ChevronLeft} size={23} strokeWidth={1.5} className="text-foreground" />
          </Pressable>
        </Link>
        <Text role="heading" aria-level="1" className="font-display text-[34px] font-light leading-[39px]">
          {t('about.title')}
        </Text>
      </View>

      <View className="items-center gap-2 px-8 pt-5">
        <Mark size={52} />
        <Text className="font-display text-[34px] font-light leading-[41px]">SkinSense</Text>
        <Text className="text-[13px] font-light text-muted-foreground">{t('about.version', { version: Constants.expoConfig?.version })}</Text>
        <Text className="pt-1.5 text-center text-[14.5px] font-light leading-[22px]">{t('about.tagline')}</Text>
      </View>

      <View className="gap-2.5 px-5 pt-5">
        <View className={`${CARD} pl-[18px] pr-3`}>
          <Pressable
            role="button"
            onPress={() =>
              setModalContent({
                title: t('settings.privacy'),
                body: 'Ảnh chụp da, hồ sơ bệnh án chuyên khoa và thông tin đơn hàng SkinSense được lưu bảo mật trên hệ thống Supabase với cơ chế phân quyền 4 vai trò (Khách hàng, Bác sĩ, Gian hàng, Quản trị viên).',
              })
            }
            className="min-h-[52px] flex-row items-center justify-between"
          >
            <Text className="text-[15px]">{t('settings.privacy')}</Text>
            <View className="size-11 items-center justify-center">
              <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
            </View>
          </Pressable>
          <Pressable
            role="button"
            onPress={() =>
              setModalContent({
                title: t('about.source'),
                body: 'SkinSense v2 Mobile (Expo React Native + Domain Rules + Supabase Backend APIs). Mọi luồng 4 vai trò hoạt động trực tiếp bằng giao diện native di động.',
              })
            }
            className={`min-h-[52px] flex-row items-center justify-between ${LINE}`}
          >
            <Text className="text-[15px]">{t('about.source')}</Text>
            <View className="size-11 items-center justify-center">
              <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
            </View>
          </Pressable>
        </View>

        <Text className="px-1 pt-2.5 text-[11px] font-medium uppercase tracking-[1.32px] text-muted-foreground">{t('about.licenses')}</Text>
        <View className={`${CARD} px-[18px]`}>
          {(all ? licenses : licenses.slice(0, PREVIEW)).map(({ name, license }, i) => (
            <View key={name} className={`min-h-11 flex-row items-center justify-between gap-3 py-2 ${i ? LINE : ''}`}>
              <Text className="flex-1 text-[14.5px] font-light">{name}</Text>
              <Text className="text-[14.5px] font-light text-muted-foreground">{license}</Text>
            </View>
          ))}
          {!all && (
            <Pressable role="button" onPress={() => setAll(true)} className={`min-h-12 flex-row items-center justify-between ${LINE}`}>
              <Text className="text-[14.5px]">{t('about.showAll')}</Text>
              <View className="-mr-3 size-11 items-center justify-center">
                <Icon as={ChevronRight} size={18} strokeWidth={1.5} className="text-muted-foreground" />
              </View>
            </Pressable>
          )}
        </View>
      </View>

      <Modal visible={modalContent !== null} animationType="slide" transparent onRequestClose={() => setModalContent(null)}>
        <View className="flex-1 justify-end bg-black/75">
          <View className="rounded-t-3xl border-t border-border bg-card p-5 pb-14 gap-3">
            <Text className="font-display text-[18px] font-semibold text-foreground">{modalContent?.title}</Text>
            <Text className="text-[13px] leading-5 text-muted-foreground">{modalContent?.body}</Text>
            <Pressable
              role="button"
              onPress={() => setModalContent(null)}
              className="mt-2 h-11 items-center justify-center rounded-control bg-primary"
            >
              <Text className="text-[14px] font-semibold text-primary-foreground">Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
