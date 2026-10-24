import { color } from '@skinsense/tokens/tokens.json';
import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, useColorScheme, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ExternalLink } from '@/components/external-link';
import { Mark } from '@/components/mark';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import licenses from '@/lib/licenses.json';

// Canvas AndroidAbout. The license list is checked in (src/lib/licenses.json, guarded by
// licenses.test.ts); its first five entries are the canvas preview, "Xem tất cả" shows the rest.
const CARD = 'rounded-card border border-border bg-card';
const LINE = 'border-t border-border';
const PREVIEW = 5;
// The web app's public privacy page (same URL as settings.tsx and sign-in.tsx).
const PRIVACY_URL = 'https://skinsense-v2.vercel.app/privacy';
const SOURCE_URL = 'https://github.com/Tranthingocha-teo/skinsense-v2';

export function About() {
  const { t } = useTranslation();
  const muted = color[useColorScheme() === 'dark' ? 'dark' : 'light'].muted;
  const [all, setAll] = useState(false);
  const links = [
    [t('settings.privacy'), PRIVACY_URL],
    [t('about.source'), SOURCE_URL],
  ] as const;

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
          {links.map(([label, url], i) => (
            <ExternalLink key={url} href={url} asChild>
              <Pressable className={`min-h-[52px] flex-row items-center justify-between ${i ? LINE : ''}`}>
                <Text className="text-[15px]">{label}</Text>
                <View className="size-11 items-center justify-center">
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <Path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                  </Svg>
                </View>
              </Pressable>
            </ExternalLink>
          ))}
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
    </ScrollView>
  );
}
