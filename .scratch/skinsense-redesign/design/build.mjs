// Writes the light/dark twins of every src/<Variant><Screen>.html by filling /*TOKENS*/,
// and warns on token pairs below WCAG AA (4.5:1). C1 Today dark doubles as Main.dc.html.
import { readFileSync, writeFileSync } from 'node:fs';

const here = (p) => new URL(p, import.meta.url);
const T = JSON.parse(readFileSync(here('./tokens.json'), 'utf8'));
const lum = (h) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const PAIRS = [['fg', 'bg'], ['muted', 'bg'], ['muted', 'surface'], ['on-accent', 'accent'], ['accent', 'surface'], ['good', 'surface']];

let warnings = 0;
for (const v of ['C1', 'C2', 'C3']) {
  for (const theme of ['Light', 'Dark']) {
    const t = T[v][theme.toLowerCase()];
    for (const [a, b] of PAIRS) {
      const r = ratio(t[a], t[b]);
      if (r < 4.5) { warnings++; console.warn(`AA fail ${v} ${theme} ${a}/${b} ${r.toFixed(2)}`); }
    }
    const block = Object.entries(t).map(([k, x]) => `--${k}: ${x};`).join(' ');
    for (const screen of ['Today', 'Hero', 'Trends']) {
      const src = readFileSync(here(`./src/${v}${screen}.html`), 'utf8').replace('/*TOKENS*/', block);
      const out = v === 'C1' && screen === 'Today' && theme === 'Dark' ? 'Main' : `${v}${screen}${theme}`;
      writeFileSync(here(`./${out}.dc.html`), src);
    }
  }
}
console.log(`built 18 artboards, ${warnings} contrast warnings`);
