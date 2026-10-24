import { color } from '@skinsense/tokens/tokens.json';
import { useColorScheme } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

// Canvas .night: the tint under the status bar on screens without a photo
// (SVG: the NativeWind tokens are HSL vars, gradients need hex). Same recipe as the
// local copies in (tabs)/trends.tsx and (tabs)/routine.tsx.
export function NightTint({ height }: { height: number }) {
  const palette = color[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Svg width="100%" height={height} style={{ position: 'absolute', top: 0 }} aria-hidden>
      <Defs>
        <LinearGradient id="night-tint" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette['photo-b']} />
          <Stop offset="1" stopColor={palette.bg} />
        </LinearGradient>
        <RadialGradient id="night-glow" cx="75%" cy="10%" rx="60%" ry="60%">
          <Stop offset="0" stopColor={palette['photo-c']} stopOpacity={0.32} />
          <Stop offset="0.7" stopColor={palette['photo-c']} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#night-tint)" />
      <Rect width="100%" height="100%" fill="url(#night-glow)" />
    </Svg>
  );
}
