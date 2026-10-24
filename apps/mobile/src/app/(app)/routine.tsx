import { color } from '@skinsense/tokens/tokens.json';
import { useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { RoutineChecklist } from '@/components/routine-checklist';

// Canvas AndroidRoutine: the night tint carried over from Xu hướng, under the status bar
// (SVG: the NativeWind tokens are HSL vars, gradients need hex).
function NightTint() {
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Svg width="100%" height={240} style={{ position: 'absolute', top: 0 }} aria-hidden>
      <Defs>
        <LinearGradient id="tint" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette['photo-b']} />
          <Stop offset="1" stopColor={palette.bg} />
        </LinearGradient>
        <RadialGradient id="glow" cx="75%" cy="10%" rx="60%" ry="60%">
          <Stop offset="0" stopColor={palette['photo-c']} stopOpacity={0.3} />
          <Stop offset="0.7" stopColor={palette['photo-c']} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#tint)" />
      <Rect width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}

export default function RoutineScreen() {
  // className on SafeAreaView is not interop'd by NativeWind 4; the plain View carries the token.
  return (
    <View className="flex-1 bg-background">
      <NightTint />
      <SafeAreaView style={{ flex: 1 }}>
        <RoutineChecklist />
      </SafeAreaView>
    </View>
  );
}
