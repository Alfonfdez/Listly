// Listly app icon generator.
//
// Produces the six Expo assets in `assets/` from an SVG definition of the
// Listly mark: three list rows (bullet + bar), the middle row checked.
//
// Run it from a directory that can resolve `sharp`, e.g.:
//   cd ../Finly-app/Finly/FinlyApp && node ../../Listly-app/Listly/ListlyApp/scripts/gen-assets.mjs
// or install sharp temporarily: `npm i -D sharp` then `node scripts/gen-assets.mjs`.
//
// sharp is intentionally NOT a project dependency (icons change rarely).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', 'assets');
mkdirSync(OUT, { recursive: true });

// Palette (light theme)
const CYAN = '#0891B2';
const CYAN_D = '#22D3EE';
const SLATE = '#1E293B';
const WHITE = '#FFFFFF';

const SIZE = 1024;

// Mark: three list rows; the middle row is checked. Authored in a 1024 box,
// row block vertically centered on 512.
function markSvg({ mono }) {
  const cx = SIZE / 2;
  const barW = 400;
  const rowH = 92;
  const gap = 168;
  const dotR = 40;
  const mid = 512;
  const rows = [mid - gap, mid, mid + gap];
  const checked = 1;

  // Center the mark on the canvas horizontally. The visual left edge is the
  // checked row's ring (dotR + 4 radius + 9 half-stroke); the right edge is the
  // last bar's end. Place dotX so the content midpoint sits on `cx`.
  const ringR = dotR + 4;
  const ringStroke = 18;
  const leftEdge = ringR + ringStroke / 2; // distance left of dotX
  const rightEdge = dotR + 66 + barW; // distance right of dotX
  const dotX = cx - (rightEdge - leftEdge) / 2;
  const barX = dotX + dotR + 66;

  const barFill = mono ? WHITE : `url(#g)`;
  const plainBar = mono ? WHITE : SLATE;
  const dotFill = mono ? WHITE : CYAN_D;
  const checkColor = mono ? '#000000' : CYAN_D;

  return rows
    .map((y, i) => {
      const isChecked = i === checked;
      const bar = `<rect x="${barX}" y="${y - rowH / 2}" width="${barW}" height="${rowH}" rx="${rowH / 2}" fill="${isChecked ? barFill : plainBar}"/>`;
      if (!isChecked) {
        const dot = `<circle cx="${dotX}" cy="${y}" r="${dotR}" fill="${dotFill}"/>`;
        return dot + bar;
      }
      const check = `<path d="M ${dotX - 24} ${y + 2} l 17 19 l 33 -37" fill="none" stroke="${checkColor}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (mono) {
        const r = dotR + 6;
        return `<defs><mask id="cm"><rect x="${dotX - r - 8}" y="${y - r - 8}" width="${2 * r + 16}" height="${2 * r + 16}" fill="black"/><circle cx="${dotX}" cy="${y}" r="${r}" fill="white"/>${check.replace('stroke="#000000"', 'stroke="black"')}</mask></defs><circle cx="${dotX}" cy="${y}" r="${r}" fill="${WHITE}" mask="url(#cm)"/>` + bar;
      }
      const ring = `<circle cx="${dotX}" cy="${y}" r="${dotR + 4}" fill="none" stroke="${barFill}" stroke-width="18"/>`;
      return ring + bar + check;
    })
    .join('\n');
}

function wrap(inner, { background = null, mono = false }) {
  const bg = background ? `<rect width="${SIZE}" height="${SIZE}" fill="${background}"/>` : '';
  const defs = mono
    ? ''
    : `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${CYAN_D}"/><stop offset="1" stop-color="${CYAN}"/></linearGradient></defs>`;
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">${defs}${bg}${inner}</svg>`;
}

function scaled(inner, factor) {
  return `<g transform="translate(${SIZE / 2} ${SIZE / 2}) scale(${factor}) translate(${-SIZE / 2} ${-SIZE / 2})">${inner}</g>`;
}

const mark = () => markSvg({ mono: false });
const markMono = () => markSvg({ mono: true });

async function render(svg, file) {
  await sharp(Buffer.from(svg), { density: 384 }).resize(SIZE, SIZE).png().toFile(path.join(OUT, file));
  console.log('wrote', path.relative(OUT, path.join(OUT, file)));
}

// icon.png / favicon.png — white background square, mark at ~92%.
await render(wrap(scaled(mark(), 0.92), { background: WHITE }), 'icon.png');
await render(wrap(scaled(mark(), 0.92), { background: WHITE }), 'favicon.png');
// adaptive foreground — transparent. The mark is wide/short, so size by width:
// scale 0.9 fills ~49% of the canvas width, leaving comfortable padding inside
// the Android 66% safe zone (a touch lighter than other launcher icons).
await render(wrap(scaled(mark(), 0.9), {}), 'android-icon-foreground.png');
// adaptive background — flat white; Android composes the layers.
await render(wrap('', { background: WHITE }), 'android-icon-background.png');
// monochrome — white silhouette (check masked out), same scale as the foreground.
await render(wrap(scaled(markMono(), 0.9), { mono: true }), 'android-icon-monochrome.png');
// splash — transparent. The mark is wide/short (landscape), so size by width:
// scale 1.0 fills ~54% of the canvas width (matching Finly's splash weight) and
// leaves a comfortable vertical margin. Previously 0.42, which looked tiny.
await render(wrap(scaled(mark(), 1.0), {}), 'splash-icon.png');

console.log('done →', OUT);
