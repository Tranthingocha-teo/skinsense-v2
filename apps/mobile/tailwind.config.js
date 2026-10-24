const { hairlineWidth } = require('nativewind/theme');
const { radius } = require('@skinsense/tokens/tokens.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        success: 'hsl(var(--success))',
        'surface-2': 'hsl(var(--surface-2))',
        'photo-a': 'hsl(var(--photo-a))',
        'photo-b': 'hsl(var(--photo-b))',
        'photo-c': 'hsl(var(--photo-c))',
      },
      borderWidth: { hairline: hairlineWidth() },
      // DESIGN.md radius roles; nativewind.css carries colours only.
      borderRadius: { control: `${radius.control}px`, card: `${radius.card}px`, pill: `${radius.pill}px` },
      // Family names registered by the expo-font plugin in app.json (weighted XML families on Android).
      fontFamily: { display: ['Noto Serif Display'], body: ['Manrope'] },
    },
  },
  plugins: [],
};
