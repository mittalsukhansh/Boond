// scripts/check-design.mjs
import fs from 'node:fs';
import path from 'node:path';

const exts = ['.css', '.jsx', '.js', '.html'];
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
  );

const files = [...walk('src'), 'index.html'].filter(
  (f) => fs.existsSync(f) && exts.includes(path.extname(f))
);

function hsl(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2, d = max - min;
  let s = 0, hue = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: hue, s, l };
}

const banned = [
  [/gradient\s*\(/i, 'gradient'],
  [/backdrop-filter/i, 'backdrop-filter'],
  [/box-shadow\s*:\s*(?!none)/i, 'box-shadow'],
  [/text-shadow/i, 'text-shadow'],
  [/filter\s*:\s*blur/i, 'blur'],
  [/\b(indigo|blue|sky|cyan|violet|purple)-\d{2,3}\b/i, 'tailwind blue/purple class'],
  [/#646cff|#535bf2|#61dafb/i, 'Vite/React template colour'],
];

let failed = false;
const fail = (file, msg) => {
  console.error(`design check: ${file}: ${msg}`);
  failed = true;
};

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const isTokens = file.replace(/\\/g, '/').endsWith('styles/tokens.css');

  for (const [re, name] of banned) if (re.test(text)) fail(file, `banned: ${name}`);

  if (!isTokens && /(?:rgb|hsl)a?\s*\(/i.test(text)) fail(file, 'colour function outside tokens.css');

  for (const m of text.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    if (!isTokens) { fail(file, `hex literal ${m[0]} outside tokens.css`); continue; }
    const { h, s, l } = hsl(m[0]);
    if (s > 0.15 && l > 0.08 && l < 0.97 && h >= 180 && h <= 280)
      fail(file, `blue/purple hue ${m[0]} (hue ${Math.round(h)})`);
  }
}

if (failed) process.exit(1);
console.log('design check passed');
