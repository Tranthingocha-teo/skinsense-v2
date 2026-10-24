import { color } from '@skinsense/tokens/tokens.json';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING = 113.1; // 2π · r18, the canvas MARKDRAW dash length
// DESIGN.md: two circle strokes 1.4s cubic-bezier(0.65, 0, 0.35, 1), the second 0.25s later,
// then the dot fades in over 0.4s at 1.2s. Strokes jump under reduced motion; the fade stays.
const DRAW = { duration: 1400, easing: Easing.bezier(0.65, 0, 0.35, 1), reduceMotion: ReduceMotion.System };
let drawn = false; // once per app session

// The logo mark (canvas MARK / MARKDRAW), drawn with react-native-svg + Reanimated instead of Skia (not installed).
export function Mark({ size }: { size: number }) {
  const fg = color[useColorScheme() === 'dark' ? 'dark' : 'light'].fg;
  const first = useSharedValue(drawn ? 0 : RING);
  const second = useSharedValue(drawn ? 0 : RING);
  const dot = useSharedValue(drawn ? 1 : 0);

  useEffect(() => {
    if (drawn) return;
    drawn = true;
    first.value = withTiming(0, DRAW);
    second.value = withDelay(250, withTiming(0, DRAW));
    dot.value = withDelay(1200, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.Never }));
  }, [dot, first, second]);

  const firstProps = useAnimatedProps(() => ({ strokeDashoffset: first.value }));
  const secondProps = useAnimatedProps(() => ({ strokeDashoffset: second.value }));
  const dotProps = useAnimatedProps(() => ({ opacity: dot.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <AnimatedCircle cx={28} cy={32} r={18} stroke={fg} strokeWidth={1.6} strokeDasharray={RING} animatedProps={firstProps} />
      <AnimatedCircle cx={36} cy={32} r={18} stroke={fg} strokeOpacity={0.45} strokeWidth={1.6} strokeDasharray={RING} animatedProps={secondProps} />
      <AnimatedCircle cx={32} cy={14.45} r={2.2} fill={fg} animatedProps={dotProps} />
    </Svg>
  );
}
