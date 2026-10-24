import { color } from '@skinsense/tokens/tokens.json';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Canvas TABS snippet (design-2/build.mjs): 72px bar, 23px icons at stroke 1.5, 11px labels,
// active fg 600 / inactive muted 400. Solid bg instead of the canvas blur (DESIGN.md: glass only
// over the photo; blur costs GPU on Android). Spot marking and the routine editor stack above
// the tabs in the (app) Stack.
const TABS = [
  {
    name: 'index',
    label: 'nav.today',
    renderIcon: () => <Path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />,
  },
  {
    name: 'capture',
    label: 'nav.capture',
    renderIcon: () => (
      <>
        <Rect x={3} y={7} width={18} height={13} rx={2.5} />
        <Path d="M8 7l1.6-2.5h4.8L16 7" />
        <Circle cx={12} cy={13.2} r={3.4} />
      </>
    ),
  },
  {
    name: 'trends',
    label: 'nav.trends',
    renderIcon: () => <Path d="M4 16l5-5 4 3 7-7M15 7h5v5" />,
  },
  {
    name: 'settings',
    label: 'nav.settings',
    renderIcon: () => (
      <>
        <Path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <Circle cx={16} cy={7} r={2} />
        <Circle cx={8} cy={17} r={2} />
      </>
    ),
  },
] as const;

export default function TabsLayout() {
  const { t } = useTranslation();
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.fg,
        tabBarInactiveTintColor: palette.muted,
        // getTabBarHeight returns a numeric height as is, so the inset is added here.
        tabBarStyle: { height: 72 + bottom, paddingBottom: 6 + bottom, backgroundColor: palette.bg, borderTopColor: palette.line },
        tabBarItemStyle: { gap: 4 },
        tabBarLabel: ({ focused, color: tint, children }) => (
          <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: focused ? '600' : '400', letterSpacing: 0.44, color: tint }}>{children}</Text>
        ),
      }}>
      {TABS.map(({ name, label, renderIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(label),
            tabBarIcon: ({ color: tint }) => (
              <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={tint} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                {renderIcon()}
              </Svg>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
