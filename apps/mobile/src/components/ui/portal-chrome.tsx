import { color } from '@skinsense/tokens/tokens.json';
import { type LucideIcon } from 'lucide-react-native';
import { useId, type ReactNode } from 'react';
import { Pressable, ScrollView, useColorScheme, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export type PortalTone = 'botanical' | 'gold' | 'terracotta' | 'neutral';

export const MODERN_CARD = 'rounded-[20px] border border-border/80 bg-card';
export const MODERN_SUBCARD = 'rounded-[14px] border border-border/70 bg-surface-2';
export const MODERN_INPUT =
  'h-12 rounded-[14px] border border-border/90 bg-background px-3.5 text-[14px] text-foreground';
export const EYEBROW_LABEL =
  'text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground';

/**
 * Low-cost atmospheric top gradient synced with C3 Night Photo palette tokens.
 */
export function AmbientBackdrop({
  height = 240,
  tone = 'botanical',
}: {
  height?: number;
  tone?: PortalTone;
}) {
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const uid = useId().replace(/:/g, '_');

  const secondaryGlow =
    tone === 'gold'
      ? '#C9B98A'
      : tone === 'terracotta'
        ? '#C77E52'
        : tone === 'neutral'
          ? palette['photo-a']
          : palette['photo-a'];

  return (
    <Svg
      width="100%"
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
      aria-hidden
    >
      <Defs>
        <LinearGradient id={`ab_base_${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette['photo-b']} stopOpacity={0.92} />
          <Stop offset="1" stopColor={palette.bg} stopOpacity={1} />
        </LinearGradient>
        <RadialGradient id={`ab_orb1_${uid}`} cx="18%" cy="22%" rx="78%" ry="68%">
          <Stop offset="0" stopColor={secondaryGlow} stopOpacity={0.34} />
          <Stop offset="0.75" stopColor={secondaryGlow} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`ab_orb2_${uid}`} cx="85%" cy="10%" rx="62%" ry="58%">
          <Stop offset="0" stopColor={palette['photo-c']} stopOpacity={0.28} />
          <Stop offset="0.75" stopColor={palette['photo-c']} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#ab_base_${uid})`} />
      <Rect width="100%" height="100%" fill={`url(#ab_orb1_${uid})`} />
      <Rect width="100%" height="100%" fill={`url(#ab_orb2_${uid})`} />
    </Svg>
  );
}

/**
 * Crisp 4-color official Google 'G' vector mark for native Sign-In button.
 */
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <Path
        fill="#EA4335"
        d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.79 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.91 6.16-4.91z"
      />
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
    </Svg>
  );
}

export interface PortalTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

/**
 * Editorial portal top bar shared across Admin, Shop, Specialist, and Profile screens.
 */
export function PortalHeader({
  topInset,
  eyebrow,
  title,
  subtitle,
  icon,
  tone = 'botanical',
  eyebrowClassName,
  iconWellClassName,
  iconClassName,
  actions,
  tabs,
  activeTab,
  onSelectTab,
}: {
  topInset: number;
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: PortalTone;
  eyebrowClassName?: string;
  iconWellClassName?: string;
  iconClassName?: string;
  actions?: ReactNode;
  tabs?: readonly PortalTabItem[];
  activeTab?: string;
  onSelectTab?: (id: string) => void;
}) {
  return (
    <View
      style={{ paddingTop: Math.max(topInset, 12) + 4 }}
      className="relative overflow-hidden border-b border-border/80 bg-card px-4 pb-3.5"
    >
      <AmbientBackdrop height={190} tone={tone} />
      <View className="flex-row items-center justify-between gap-2.5">
        <View className="flex-1 flex-row items-center gap-3">
          <View
            className={`size-10 items-center justify-center rounded-[14px] border border-border/80 ${
              iconWellClassName || 'bg-surface-2/90'
            }`}
          >
            <Icon as={icon} size={19} strokeWidth={1.6} className={iconClassName || 'text-foreground'} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text
              numberOfLines={1}
              className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] ${
                eyebrowClassName || 'text-muted-foreground'
              }`}
            >
              {eyebrow}
            </Text>
            <Text numberOfLines={1} className="font-display text-[19px] font-normal text-foreground leading-[24px]">
              {title}
            </Text>
          </View>
        </View>
        {actions ? <View className="flex-row items-center gap-1.5">{actions}</View> : null}
      </View>

      {subtitle ? (
        <Text numberOfLines={2} className="mt-2 text-[11.5px] leading-4 text-muted-foreground">
          {subtitle}
        </Text>
      ) : null}

      {tabs && tabs.length > 0 && onSelectTab ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row gap-2 pt-3"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                role="tab"
                aria-selected={active}
                onPress={() => onSelectTab(tab.id)}
                className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:scale-[0.98] ${
                  active
                    ? 'border-foreground bg-foreground'
                    : 'border-border/80 bg-surface-2/90'
                }`}
              >
                <Icon
                  as={tab.icon}
                  size={13}
                  strokeWidth={1.7}
                  className={active ? 'text-background' : 'text-muted-foreground'}
                />
                <Text
                  numberOfLines={1}
                  className={`text-[12px] font-medium ${active ? 'text-background' : 'text-foreground'}`}
                >
                  {tab.label}
                </Text>
                {tab.count !== undefined && tab.count > 0 ? (
                  <View
                    className={`rounded-full px-1.5 py-0.5 ${
                      active ? 'bg-background/20' : 'bg-amber-600/90'
                    }`}
                  >
                    <Text className={`text-[9.5px] font-bold ${active ? 'text-background' : 'text-white'}`}>
                      {tab.count}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

/**
 * Tactile squircle icon button used consistently in headers.
 */
export function HeaderIconButton({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="size-9 items-center justify-center rounded-[12px] border border-border/80 bg-surface-2/90 active:scale-[0.96]"
    >
      <Icon
        as={icon}
        size={15}
        strokeWidth={1.6}
        className={destructive ? 'text-destructive' : 'text-foreground'}
      />
    </Pressable>
  );
}

/**
 * Refined status / feedback toast banner.
 */
export function ToastBanner({
  message,
  icon,
  tone = 'success',
}: {
  message: string;
  icon: LucideIcon;
  tone?: 'success' | 'warning' | 'danger';
}) {
  const styles =
    tone === 'danger'
      ? 'border-destructive/40 bg-destructive/10 text-destructive'
      : tone === 'warning'
        ? 'border-amber-500/35 bg-amber-500/10 text-amber-500'
        : 'border-emerald-500/35 bg-emerald-500/12 text-emerald-500';
  const iconColor =
    tone === 'danger' ? 'text-destructive' : tone === 'warning' ? 'text-amber-500' : 'text-emerald-500';

  return (
    <View className={`flex-row items-center gap-2.5 rounded-[16px] border px-3.5 py-3 ${styles}`}>
      <Icon as={icon} size={16} className={iconColor} />
      <Text className={`flex-1 text-[12.5px] font-medium leading-4 ${iconColor}`}>{message}</Text>
    </View>
  );
}

/**
 * Reusable bottom-sheet modal card with drag pill and safe bottom padding.
 */
export function BottomSheetFrame({
  bottomInset = 0,
  maxHeightClass = 'max-h-[88%]',
  children,
}: {
  bottomInset?: number;
  maxHeightClass?: string;
  children: ReactNode;
}) {
  return (
    <View className="flex-1 justify-end bg-black/75">
      <View
        style={{ paddingBottom: Math.max(bottomInset + 18, 32) }}
        className={`${maxHeightClass} rounded-t-[28px] border-t border-border/90 bg-card px-5 pt-3`}
      >
        <View className="mb-3 items-center">
          <View className="h-1 w-10 rounded-full bg-border" />
        </View>
        {children}
      </View>
    </View>
  );
}
