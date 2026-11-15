import { initialsOf, ownImageUrl, productShape, tintIndex, type ProductShape } from '@skinsense/domain';
import { color } from '@skinsense/tokens/tokens.json';
import { Image } from 'expo-image';
import QRCode from 'qrcode';
import { useMemo, useState } from 'react';
import { useColorScheme, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui/text';

// The app's own artwork, so no screen shows a stock or hotlinked photo (mirrors the web's
// components/product-art.tsx and initials-avatar.tsx; rules in packages/domain/src/artwork.ts).

// Muted hues (sage, clay, sand, sea, plum, stone), mixed into the theme's surface colour.
const TINTS = ['#7FA68A', '#C08A72', '#B39A64', '#6E9DAD', '#B0809E', '#8B8FB8'];

function mix(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(p(a, i) * (1 - t) + p(b, i) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function usePalette() {
  return color[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

function useTint(seed: string) {
  const palette = usePalette();
  const tint = TINTS[tintIndex(seed, TINTS.length)]!;
  return { palette, bg: mix(palette.surface, tint, 0.26), ink: mix(palette.surface, tint, 0.6) };
}

type Box = { x: number; y: number; w: number; h: number };

function shapeParts(shape: ProductShape): { parts: React.ReactNode; label: Box } {
  switch (shape) {
    case 'pump':
      return {
        parts: (
          <>
            <Rect x={39} y={13} width={20} height={5} rx={2} />
            <Rect x={57} y={14} width={11} height={3} rx={1.5} />
            <Rect x={47.5} y={17} width={5} height={11} />
            <Rect x={42} y={27} width={16} height={9} rx={2} />
            <Rect x={31} y={35} width={38} height={52} rx={8} />
          </>
        ),
        label: { x: 36, y: 50, w: 28, h: 24 },
      };
    case 'dropper':
      return {
        parts: (
          <>
            <Rect x={44} y={11} width={12} height={22} rx={6} />
            <Rect x={40} y={32} width={20} height={10} rx={2} />
            <Rect x={35} y={41} width={30} height={46} rx={7} />
          </>
        ),
        label: { x: 39, y: 53, w: 22, h: 22 },
      };
    case 'jar':
      return {
        parts: (
          <>
            <Rect x={23} y={38} width={54} height={13} rx={3} />
            <Rect x={25} y={50} width={50} height={36} rx={8} />
          </>
        ),
        label: { x: 33, y: 57, w: 34, h: 22 },
      };
    case 'tube':
      return {
        parts: (
          <>
            <Rect x={28} y={10} width={44} height={6} rx={1.5} />
            <Path d="M30 15 H70 L63 73 H37 Z" />
            <Rect x={40} y={72} width={20} height={15} rx={2.5} />
          </>
        ),
        label: { x: 37, y: 30, w: 26, h: 26 },
      };
    default:
      return {
        parts: (
          <>
            <Rect x={41} y={11} width={18} height={10} rx={2} />
            <Rect x={44} y={20} width={12} height={10} />
            <Rect x={33} y={29} width={34} height={58} rx={9} />
          </>
        ),
        label: { x: 37, y: 46, w: 26, h: 24 },
      };
  }
}

/** Drawn packaging silhouette with the brand's initials, for a product without its own photo. */
export function ProductArt({
  name,
  brand,
  category,
  seed,
  className,
  style,
}: {
  name: string;
  brand?: string;
  category?: string;
  seed?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette, bg, ink } = useTint(seed ?? brand ?? name);
  const { parts, label } = shapeParts(productShape(category, name));
  const initials = initialsOf(brand || name);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      className={`items-center justify-center overflow-hidden ${className ?? ''}`}
      style={[{ backgroundColor: bg }, style]}
    >
      <Svg viewBox="0 0 100 100" width="86%" height="86%">
        <Ellipse cx={50} cy={89} rx={24} ry={2.4} fill={palette.fg} opacity={0.08} />
        <G fill={ink} stroke={palette.fg} strokeOpacity={0.28} strokeWidth={0.8} strokeLinejoin="round">
          {parts}
        </G>
        <Rect x={label.x} y={label.y} width={label.w} height={label.h} rx={2} fill={palette.surface} opacity={0.92} />
        <SvgText
          x={label.x + label.w / 2}
          y={label.y + label.h / 2 + (initials.length > 1 ? 3.5 : 4)}
          textAnchor="middle"
          fill={palette.fg}
          fontSize={initials.length > 1 ? 12 : 14}
        >
          {initials}
        </SvgText>
      </Svg>
    </View>
  );
}

/** A product's own uploaded photo, or ProductArt when it has none or it fails to load. */
export function ProductImage({
  uri,
  name,
  brand,
  category,
  seed,
  className,
  style,
}: {
  uri?: string | null;
  name: string;
  brand?: string;
  category?: string;
  seed?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const own = ownImageUrl(uri);
  const [failed, setFailed] = useState<string | null>(null);
  if (!own || failed === own) {
    return <ProductArt name={name} brand={brand} category={category} seed={seed} className={className} style={style} />;
  }
  return (
    <Image
      source={{ uri: own }}
      className={className}
      style={[{ width: '100%', height: '100%' }, style as object]}
      contentFit="cover"
      accessibilityLabel={name}
      onError={() => setFailed(own)}
    />
  );
}

/** A person's or shop's own picture, else their initials on a tint derived from their id. */
export function InitialsAvatar({
  name,
  seed,
  uri,
  size = 40,
  rounded = 999,
}: {
  name: string;
  seed?: string;
  uri?: string | null;
  size?: number;
  rounded?: number;
}) {
  const { palette, bg } = useTint(seed ?? name);
  const own = ownImageUrl(uri);
  const [failed, setFailed] = useState<string | null>(null);
  if (own && failed !== own) {
    return (
      <Image
        source={{ uri: own }}
        style={{ width: size, height: size, borderRadius: rounded }}
        contentFit="cover"
        accessibilityLabel={name}
        onError={() => setFailed(own)}
      />
    );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={{ width: size, height: size, borderRadius: rounded, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: palette.fg, fontSize: Math.max(11, Math.round(size * 0.36)), fontWeight: '500' }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

/** A QR code drawn on the device with react-native-svg; no QR image service is called. */
export function QrImage({ value, size = 192, label }: { value: string; size?: number; label?: string }) {
  const path = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
    let d = '';
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) {
        if (modules.get(y, x)) d += `M${x + 2} ${y + 2}h1v1h-1z`;
      }
    }
    return { d, n: modules.size + 4 };
  }, [value]);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label ?? 'Mã QR'} style={{ width: size, height: size }}>
      <Svg viewBox={`0 0 ${path.n} ${path.n}`} width={size} height={size}>
        <Rect x={0} y={0} width={path.n} height={path.n} fill="#FFFFFF" />
        <Path d={path.d} fill="#191B19" />
      </Svg>
    </View>
  );
}
