#!/usr/bin/env bun
// prepare-portrait.mjs — deterministic build-time image processing for the site portrait.
// Reads public/avatar.png (640x640 RGBA), emits dithered/glitched variants + ASCII art + 88x31 banner.
// Fully deterministic: seeded mulberry32 PRNG (seed 1303), no Math.random / Date.now in generation.

import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'public', 'avatar.png');
const OUT_PUBLIC = path.join(ROOT, 'public', 'generated');
const OUT_LIB = path.join(ROOT, 'lib', 'generated');

// ---------------------------------------------------------------- palette
const DARK = [0x06, 0x06, 0x06];
const LIGHT = [0xe6, 0xe1, 0xd6];
const GHOST = [0x4a, 0x48, 0x42];
const ASH = [0x8c, 0x88, 0x80];
const EMBER = [0xff, 0x4b, 0x11];
const WIRE = [0x26, 0x25, 0x1f];
const BLACK = [0x00, 0x00, 0x00];

// ---------------------------------------------------------------- PRNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(1303);
const randInt = (min, max) => min + Math.floor(rnd() * (max - min + 1)); // inclusive

// ---------------------------------------------------------------- helpers
/** Area-averaging (box) resample of a grayscale Float64Array. */
function boxResample(src, sw, sh, dw, dh) {
  const dst = new Float64Array(dw * dh);
  const sx = sw / dw;
  const sy = sh / dh;
  for (let oy = 0; oy < dh; oy++) {
    const y0 = oy * sy;
    const y1 = (oy + 1) * sy;
    for (let ox = 0; ox < dw; ox++) {
      const x0 = ox * sx;
      const x1 = (ox + 1) * sx;
      let acc = 0;
      let area = 0;
      for (let iy = Math.floor(y0); iy < Math.ceil(y1); iy++) {
        const wy = Math.min(y1, iy + 1) - Math.max(y0, iy);
        if (wy <= 0) continue;
        for (let ix = Math.floor(x0); ix < Math.ceil(x1); ix++) {
          const wx = Math.min(x1, ix + 1) - Math.max(x0, ix);
          if (wx <= 0) continue;
          const w = wx * wy;
          acc += src[iy * sw + ix] * w;
          area += w;
        }
      }
      dst[oy * dw + ox] = acc / area;
    }
  }
  return dst;
}

/** binary map (Uint8Array of 0/1) -> RGBA PNG buffer using DARK/LIGHT palette */
function binaryToPng(map, w, h) {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h; i++) {
    const c = map[i] ? LIGHT : DARK;
    png.data[i * 4] = c[0];
    png.data[i * 4 + 1] = c[1];
    png.data[i * 4 + 2] = c[2];
    png.data[i * 4 + 3] = 255;
  }
  return PNG.sync.write(png, PNG_OPTS);
}

// RGB (no alpha), max deflate, filter None — dither patterns compress far better
// without adaptive filtering, and nothing here uses transparency.
const PNG_OPTS = { colorType: 2, deflateLevel: 9, filterType: 0 };

// ---------------------------------------------------------------- 1. preprocessing
const srcPng = PNG.sync.read(fs.readFileSync(SRC));
const SW = srcPng.width;
const SH = srcPng.height;

// alpha-composite on black + BT.601 grayscale
let gray = new Float64Array(SW * SH);
let gMin = Infinity;
let gMax = -Infinity;
for (let i = 0; i < SW * SH; i++) {
  const a = srcPng.data[i * 4 + 3] / 255;
  const r = srcPng.data[i * 4] * a;
  const g = srcPng.data[i * 4 + 1] * a;
  const b = srcPng.data[i * 4 + 2] * a;
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  gray[i] = l;
  if (l < gMin) gMin = l;
  if (l > gMax) gMax = l;
}

// contrast stretch (normalize to actual min/max), then a small black-point cut:
// the source backdrop is ~#0d0d0d (not pure black), so after normalize it sits
// around L~20 and would speckle the dithers / ASCII edges. Clamp lows to zero.
const range = gMax - gMin || 1;
const BLACK_POINT = 30;
for (let i = 0; i < SW * SH; i++) {
  const n = ((gray[i] - gMin) / range) * 255;
  gray[i] = Math.max(0, ((n - BLACK_POINT) / (255 - BLACK_POINT)) * 255);
}

// artistic vertical fade: L' = L * (1 - 0.45 * (y/H)^1.5)
for (let y = 0; y < SH; y++) {
  const fade = 1.0 - 0.45 * Math.pow(y / SH, 1.5);
  for (let x = 0; x < SW; x++) gray[y * SW + x] *= fade;
}

// downsample 640 -> 480 (scale 0.75) via box average
const W = Math.round(SW * 0.75);
const H = Math.round(SH * 0.75);
const pre = boxResample(gray, SW, SH, W, H);

// ---------------------------------------------------------------- 2. Atkinson dither
function atkinson(src, w, h) {
  const buf = Float64Array.from(src);
  const out = new Uint8Array(w * h);
  const taps = [
    [1, 0],
    [2, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [0, 2],
  ];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const old = buf[y * w + x];
      const bit = old >= 128 ? 1 : 0;
      out[y * w + x] = bit;
      const err = (old - (bit ? 255 : 0)) / 8;
      for (const [dx, dy] of taps) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny < h) buf[ny * w + nx] += err;
      }
    }
  }
  return out;
}

const atkinsonClean = atkinson(pre, W, H); // kept pristine for bayer-less bands variant

// --- dissolution of bottom 35% rows -------------------------------------
const dissolved = Uint8Array.from(atkinsonClean);
const zoneStart = Math.floor(H * 0.65);
const zoneEnd = H - 1;
const zoneSpan = zoneEnd - zoneStart || 1;

for (let y = zoneStart; y <= zoneEnd; y++) {
  const t = (y - zoneStart) / zoneSpan; // 0 at top of zone, 1 at bottom
  const pRow = 0.15 + 0.7 * t; // 0.15 -> 0.85 linearly
  if (rnd() >= pRow) continue;

  const nSeg = randInt(3, 7);
  // random cut points -> segments of random length
  const cuts = [];
  for (let i = 0; i < nSeg - 1; i++) cuts.push(1 + Math.floor(rnd() * (W - 2)));
  cuts.sort((a, b) => a - b);
  const bounds = [0, ...cuts, W];

  const orig = dissolved.slice(y * W, (y + 1) * W);
  for (let s = 0; s < nSeg; s++) {
    const x0 = bounds[s];
    const x1 = bounds[s + 1];
    if (x1 <= x0) continue;
    const pZero = 0.15 + 0.6 * t; // zero-out probability also grows downward
    if (rnd() < pZero) {
      dissolved.fill(0, y * W + x0, y * W + x1); // -> #060606
    } else {
      const shift = randInt(4, 24) * (rnd() < 0.5 ? -1 : 1);
      for (let x = x0; x < x1; x++) {
        const sx = x - shift;
        dissolved[y * W + x] = sx >= x0 && sx < x1 ? orig[sx] : 0; // wrap-fill black
      }
    }
  }
}

// two "smeared row repeats": duplicate a zone row downward 3-8 rows
for (let k = 0; k < 2; k++) {
  const sy = randInt(zoneStart, zoneEnd);
  const reps = randInt(3, 8);
  const row = dissolved.slice(sy * W, (sy + 1) * W);
  for (let d = 1; d <= reps; d++) {
    const ty = sy + d;
    if (ty > zoneEnd) break;
    dissolved.set(row, ty * W);
  }
}

// ---------------------------------------------------------------- 3. Bayer 4x4
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const bayerMap = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const threshold = ((BAYER4[y % 4][x % 4] + 0.5) / 16) * 255;
    bayerMap[y * W + x] = pre[y * W + x] >= threshold ? 1 : 0;
  }
}

// ---------------------------------------------------------------- 4. datamosh bands
const bands = Uint8Array.from(atkinsonClean);
const nBands = randInt(10, 14);
// roles: exactly 2 row-repeats, ~1/3 solid black, rest shifted
const roles = [];
roles.push('repeat', 'repeat');
const nBlack = Math.round(nBands / 3);
for (let i = 0; i < nBlack; i++) roles.push('black');
while (roles.length < nBands) roles.push('shift');
// deterministic Fisher-Yates shuffle
for (let i = roles.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [roles[i], roles[j]] = [roles[j], roles[i]];
}

for (let b = 0; b < nBands; b++) {
  const bh = randInt(2, 24);
  const by = randInt(0, H - bh);
  const role = roles[b];
  if (role === 'black') {
    bands.fill(0, by * W, (by + bh) * W);
  } else if (role === 'repeat') {
    const row = bands.slice(by * W, (by + 1) * W);
    for (let y = by + 1; y < by + bh; y++) bands.set(row, y * W);
  } else {
    const shift = randInt(8, 60) * (rnd() < 0.5 ? -1 : 1);
    for (let y = by; y < by + bh; y++) {
      const orig = bands.slice(y * W, (y + 1) * W);
      for (let x = 0; x < W; x++) {
        const sx = x - shift;
        bands[y * W + x] = sx >= 0 && sx < W ? orig[sx] : 0; // wrap-fill black
      }
    }
  }
}

// ---------------------------------------------------------------- 5. ASCII
const AW = 72;
const AH = Math.round((H * (AW / W)) / 2); // 2:1 glyph aspect compensation
const asciiSrc = boxResample(pre, W, H, AW, AH);
const RAMP = ' .:-=+*#%@'; // dark background: dark pixel -> space
const lines = [];
for (let y = 0; y < AH; y++) {
  let line = '';
  for (let x = 0; x < AW; x++) {
    const l = Math.max(0, Math.min(255, asciiSrc[y * AW + x]));
    line += RAMP[Math.round((l / 255) * 9)];
  }
  lines.push(line.padEnd(AW, ' ')); // exactly 72 chars
}
const asciiJson = JSON.stringify({ width: AW, height: AH, lines }, null, 2);

// large variant: 110 columns, same ramp and 2:1 glyph compensation (no PRNG use here,
// so the seeded stream — and every PNG above/below — stays byte-identical)
const AW_LARGE = 110;
const AH_LARGE = Math.round((H * (AW_LARGE / W)) / 2);
const asciiSrcLarge = boxResample(pre, W, H, AW_LARGE, AH_LARGE);
const linesLarge = [];
for (let y = 0; y < AH_LARGE; y++) {
  let line = '';
  for (let x = 0; x < AW_LARGE; x++) {
    const l = Math.max(0, Math.min(255, asciiSrcLarge[y * AW_LARGE + x]));
    line += RAMP[Math.round((l / 255) * 9)];
  }
  linesLarge.push(line.padEnd(AW_LARGE, ' ')); // exactly 110 chars
}
const asciiLargeJson = JSON.stringify({ width: AW_LARGE, height: AH_LARGE, lines: linesLarge }, null, 2);

// ---------------------------------------------------------------- 6. 88x31 banner
const BW = 88;
const BH = 31;
const banner = new PNG({ width: BW, height: BH });
const put = (x, y, c) => {
  const i = (y * BW + x) * 4;
  banner.data[i] = c[0];
  banner.data[i + 1] = c[1];
  banner.data[i + 2] = c[2];
  banner.data[i + 3] = 255;
};
const at = (x, y) => {
  const i = (y * BW + x) * 4;
  return [banner.data[i], banner.data[i + 1], banner.data[i + 2]];
};
// background
for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) put(x, y, BLACK);
// 1px wire frame
for (let x = 0; x < BW; x++) {
  put(x, 0, WIRE);
  put(x, BH - 1, WIRE);
}
for (let y = 0; y < BH; y++) {
  put(0, y, WIRE);
  put(BW - 1, y, WIRE);
}

// 3x5 pixel font (hand-drawn bitmaps), 1px letter spacing
const FONT = {
  n: ['...', '##.', '#.#', '#.#', '#.#'],
  s: ['.##', '#..', '.#.', '..#', '##.'],
  v: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  k: ['#.#', '#.#', '##.', '#.#', '#.#'],
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  3: ['###', '..#', '.##', '..#', '###'],
};
const TEXT = 'nsvk13';
const textW = TEXT.length * 3 + (TEXT.length - 1); // 23
const tx = BW - 4 - textW; // 61 -> 4px from right edge
const ty = BH - 4 - 5; // 22 -> 4px from bottom edge
for (let ci = 0; ci < TEXT.length; ci++) {
  const glyph = FONT[TEXT[ci]];
  for (let gy = 0; gy < 5; gy++) {
    for (let gx = 0; gx < 3; gx++) {
      if (glyph[gy][gx] === '#') put(tx + ci * 4 + gx, ty + gy, LIGHT);
    }
  }
}

// scattered dots: 12 ghost, 3 ash, exactly 1 ember — inside frame, on empty black only
function scatter(count, color) {
  let placed = 0;
  while (placed < count) {
    const x = randInt(2, BW - 3);
    const y = randInt(2, BH - 3);
    const [r, g, b] = at(x, y);
    if (r === 0 && g === 0 && b === 0) {
      put(x, y, color);
      placed++;
    }
  }
}
scatter(12, GHOST);
scatter(3, ASH);
scatter(1, EMBER);

// ---------------------------------------------------------------- write outputs
fs.mkdirSync(OUT_PUBLIC, { recursive: true });
fs.mkdirSync(OUT_LIB, { recursive: true });

const outputs = [
  [path.join(OUT_PUBLIC, 'avatar-atkinson.png'), binaryToPng(dissolved, W, H)],
  [path.join(OUT_PUBLIC, 'avatar-bayer.png'), binaryToPng(bayerMap, W, H)],
  [path.join(OUT_PUBLIC, 'avatar-bands.png'), binaryToPng(bands, W, H)],
  [path.join(OUT_LIB, 'avatar-ascii.json'), Buffer.from(asciiJson + '\n')],
  [path.join(OUT_LIB, 'avatar-ascii-large.json'), Buffer.from(asciiLargeJson + '\n')],
  [path.join(OUT_PUBLIC, 'banner-88x31.png'), PNG.sync.write(banner, PNG_OPTS)],
];

for (const [file, buf] of outputs) {
  fs.writeFileSync(file, buf);
  console.log(`${path.relative(ROOT, file)}  ${buf.length} bytes`);
}
