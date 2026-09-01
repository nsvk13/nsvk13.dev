#!/usr/bin/env bun
// prepare-art.mjs — deterministic procedural art assets in the site's 1-bit glitch/dreamcore style.
//   public/generated/moonpath.png   1200x560 "moon path of broken pixels"      (seed 1901)
//   public/generated/contour.svg    topographic contour map of a noise field    (seed 2301)
// Fully deterministic: each asset owns its own mulberry32 stream; no Math.random / Date.now.

import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PUBLIC = path.join(ROOT, 'public', 'generated');

// ---------------------------------------------------------------- palette
const DARK = [0x06, 0x06, 0x06];
const LIGHT = [0xe6, 0xe1, 0xd6];

// RGB (no alpha), max deflate, filter None — same as prepare-portrait; the image is
// mostly flat black with dither noise, adaptive filtering does not help here.
const PNG_OPTS = { colorType: 2, deflateLevel: 9, filterType: 0 };

// ---------------------------------------------------------------- PRNG / noise
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
const makeRandInt = (rnd) => (min, max) => min + Math.floor(rnd() * (max - min + 1)); // inclusive
const makeSign = (rnd) => () => (rnd() < 0.5 ? -1 : 1);

/** 2D value noise: seeded lattice of [0,1) values, quintic (C2) interpolation, wraps at `size`. */
function makeValueNoise(rnd, size = 256) {
  const table = new Float64Array(size * size);
  for (let i = 0; i < table.length; i++) table[i] = rnd();
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const tx = fade(x - xi);
    const ty = fade(y - yi);
    const x0 = ((xi % size) + size) % size;
    const y0 = ((yi % size) + size) % size;
    const x1 = (x0 + 1) % size;
    const y1 = (y0 + 1) % size;
    const a = table[y0 * size + x0];
    const b = table[y0 * size + x1];
    const c = table[y1 * size + x0];
    const d = table[y1 * size + x1];
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty; // [0,1]
  };
}

/** Fractal Brownian motion over `noise`, normalized back to [0,1]. */
function fbm(noise, x, y, octaves, lacunarity = 2, gain = 0.5) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x * f, y * f);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm;
}

// ---------------------------------------------------------------- raster helpers
/** Atkinson error diffusion (identical to prepare-portrait). src in 0..255 -> Uint8Array of 0/1. */
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

/** binary map (Uint8Array of 0/1) -> RGB PNG buffer using DARK/LIGHT palette */
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

// ================================================================ 1. moonpath.png
function buildMoonpath() {
  const rnd = mulberry32(1901);
  const randInt = makeRandInt(rnd);
  const sign = makeSign(rnd);
  const W = 1200;
  const H = 560;
  const noise = makeValueNoise(rnd);

  // --- luminance field: a column of gaussian blobs (moon on top, reflections below) + faint noise
  const BLOBS = [
    { cx: 600, cy: 120, sx: 90, sy: 40, a: 1.0 }, // moon: bright, compact
    { cx: 600, cy: 290, sx: 140, sy: 35, a: 0.7 }, // first reflection
    { cx: 600, cy: 440, sx: 220, sy: 30, a: 0.5 }, // second reflection, wide
    { cx: 600, cy: 530, sx: 300, sy: 22, a: 0.22 }, // faint tail at the bottom edge
  ];
  const L0 = new Float64Array(W * H); // pristine field, also drives the dust distribution
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = 0;
      for (const b of BLOBS) {
        const dx = (x - b.cx) / b.sx;
        const dy = (y - b.cy) / b.sy;
        v += b.a * Math.exp(-0.5 * (dx * dx + dy * dy));
      }
      v += 0.08 * (fbm(noise, x / 40, y / 40, 3) - 0.5); // signed, so the black stays black
      L0[y * W + x] = Math.max(0, Math.min(1, v));
    }
  }

  // --- horizontal smear: per-row box blur of seeded length, ~30% rows also shifted
  const F = new Float64Array(W * H);
  const prefix = new Float64Array(W + 1);
  const tmp = new Float64Array(W);
  for (let y = 0; y < H; y++) {
    const row = y * W;
    prefix[0] = 0;
    for (let x = 0; x < W; x++) prefix[x + 1] = prefix[x] + L0[row + x];
    const k = randInt(6, 70);
    const half = Math.floor(k / 2);
    for (let x = 0; x < W; x++) {
      const a = Math.max(0, x - half);
      const b = Math.min(W, x - half + k);
      tmp[x] = (prefix[b] - prefix[a]) / (b - a);
    }
    let shift = 0;
    if (rnd() < 0.3) shift = randInt(5, 45) * sign();
    for (let x = 0; x < W; x++) {
      const sx = x - shift;
      F[row + x] = sx >= 0 && sx < W ? tmp[sx] : 0;
    }
  }

  // --- tears: horizontal segments copied from a nearby row with an offset
  const N_TEARS = 60;
  for (let n = 0; n < N_TEARS; n++) {
    const h = randInt(1, 6);
    const w = randInt(80, 600);
    const x0 = randInt(0, W - w);
    const y0 = randInt(0, H - h);
    const dy = randInt(2, 20) * sign();
    const shift = randInt(10, 80) * sign();
    // snapshot the source rows so a segment never reads what it has just written
    const srcTop = Math.max(0, Math.min(y0, y0 + dy));
    const srcBot = Math.min(H, Math.max(y0 + h, y0 + h + dy));
    const snap = F.slice(srcTop * W, srcBot * W);
    for (let y = y0; y < y0 + h; y++) {
      const sy = Math.max(0, Math.min(H - 1, y + dy));
      const srow = (sy - srcTop) * W;
      for (let x = x0; x < x0 + w; x++) {
        const sx = x - shift;
        F[y * W + x] = sx >= 0 && sx < W ? snap[srow + sx] : 0;
      }
    }
  }

  // --- dead rows: fully black
  const N_DEAD = 25;
  for (let n = 0; n < N_DEAD; n++) {
    const y = randInt(0, H - 1);
    F.fill(0, y * W, (y + 1) * W);
  }

  // --- smeared repeats: a row duplicated downwards 2-5 rows
  const N_REPEAT = 15;
  for (let n = 0; n < N_REPEAT; n++) {
    const y = randInt(0, H - 1);
    const reps = randInt(2, 5);
    const row = F.slice(y * W, (y + 1) * W);
    for (let d = 1; d <= reps; d++) {
      const ty = y + d;
      if (ty >= H) break;
      F.set(row, ty * W);
    }
  }

  // --- 1-bit: Atkinson (it swallows anything darker than ~12% -> the field stays pure black)
  const src255 = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) src255[i] = F[i] * 255;
  const map = atkinson(src255, W, H);

  // --- dust: single light pixels, density ~ L (tiny floor so a few land in the dark)
  const N_DUST = 500;
  let placed = 0;
  for (let guard = 0; placed < N_DUST && guard < 400000; guard++) {
    const x = randInt(0, W - 1);
    const y = randInt(0, H - 1);
    const i = y * W + x;
    const weight = Math.pow(L0[i], 0.6) * 0.95 + 0.003;
    if (rnd() < weight && !map[i]) {
      map[i] = 1;
      placed++;
    }
  }

  // --- dashed hairlines: a pixel every 3-7px, 100-400px long
  const nLines = randInt(5, 8);
  for (let n = 0; n < nLines; n++) {
    const len = randInt(100, 400);
    const x0 = randInt(0, W - len);
    const y = randInt(0, H - 1);
    const step = randInt(3, 7);
    for (let x = x0; x < x0 + len; x += step) map[y * W + x] = 1;
  }

  let white = 0;
  for (let i = 0; i < W * H; i++) white += map[i];
  return { buf: binaryToPng(map, W, H), whiteFraction: white / (W * H), dust: placed };
}

// ================================================================ 2. contour.svg
// marching-squares cases: corner bits tl=8 tr=4 br=2 bl=1; edges T R B L
const MS_CASES = {
  1: [['L', 'B']],
  2: [['B', 'R']],
  3: [['L', 'R']],
  4: [['T', 'R']],
  6: [['T', 'B']],
  7: [['T', 'L']],
  8: [['T', 'L']],
  9: [['T', 'B']],
  11: [['T', 'R']],
  12: [['L', 'R']],
  13: [['R', 'B']],
  14: [['L', 'B']],
};
// saddles, resolved by the cell centre: [centre below iso, centre above iso]
const MS_SADDLE = {
  5: [
    [['T', 'R'], ['L', 'B']],
    [['T', 'L'], ['R', 'B']],
  ],
  10: [
    [['T', 'L'], ['R', 'B']],
    [['T', 'R'], ['L', 'B']],
  ],
};

/** Marching squares over a (cols+1)x(rows+1) node grid. Returns raw segments [[x0,y0],[x1,y1]] in cell units. */
function marchingSquares(hf, cols, rows, iso) {
  const nx = cols + 1;
  const segs = [];
  // Edge points are always interpolated from the lower-index node to the higher-index
  // node, so the same edge yields bit-identical coordinates from both adjacent cells
  // and the stitcher can match endpoints exactly.
  const pt = (ia, ib) => {
    const ha = hf[ia];
    const hb = hf[ib];
    const t = (iso - ha) / (hb - ha);
    const ax = ia % nx;
    const ay = (ia - ax) / nx;
    const bx = ib % nx;
    const by = (ib - bx) / nx;
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const tl = j * nx + i;
      const tr = tl + 1;
      const bl = tl + nx;
      const br = bl + 1;
      const code =
        (hf[tl] >= iso ? 8 : 0) | (hf[tr] >= iso ? 4 : 0) | (hf[br] >= iso ? 2 : 0) | (hf[bl] >= iso ? 1 : 0);
      if (code === 0 || code === 15) continue;
      let pairs = MS_CASES[code];
      if (code === 5 || code === 10) {
        const centre = (hf[tl] + hf[tr] + hf[br] + hf[bl]) / 4;
        pairs = MS_SADDLE[code][centre >= iso ? 1 : 0];
      }
      const edge = (e) =>
        e === 'T' ? pt(tl, tr) : e === 'R' ? pt(tr, br) : e === 'B' ? pt(bl, br) : pt(tl, bl);
      for (const [a, b] of pairs) segs.push([edge(a), edge(b)]);
    }
  }
  return segs;
}

/** Stitch segments into polylines by shared endpoints (tolerance 1e-6). */
function stitch(segs) {
  const key = (p) => `${Math.round(p[0] * 1e6)},${Math.round(p[1] * 1e6)}`;
  const byKey = new Map();
  for (let s = 0; s < segs.length; s++) {
    for (const p of segs[s]) {
      const k = key(p);
      const list = byKey.get(k);
      if (list) list.push(s);
      else byKey.set(k, [s]);
    }
  }
  const used = new Uint8Array(segs.length);
  const takeUnused = (k) => {
    const list = byKey.get(k);
    if (!list) return -1;
    for (const s of list) if (!used[s]) return s;
    return -1;
  };
  // walk from `start` outward until the chain ends or comes back to `stopKey`
  const walk = (start, stopKey) => {
    const out = [];
    let cur = start;
    for (;;) {
      const s = takeUnused(key(cur));
      if (s < 0) return { pts: out, closed: false };
      used[s] = 1;
      const [p, q] = segs[s];
      cur = key(p) === key(cur) ? q : p;
      if (key(cur) === stopKey) return { pts: out, closed: true };
      out.push(cur);
    }
  };

  const polylines = [];
  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const [a, b] = segs[s];
    const fwd = walk(b, key(a));
    let pts;
    let closed = fwd.closed;
    if (closed) {
      pts = [a, b, ...fwd.pts];
    } else {
      const back = walk(a, key(b)); // cannot close here: the forward walk already exhausted b's side
      pts = [...back.pts.reverse(), a, b, ...fwd.pts];
    }
    polylines.push({ pts, closed });
  }
  return polylines;
}

function buildContour(cols, rows) {
  const rnd = mulberry32(2301);
  const noise = makeValueNoise(rnd);
  const nx = cols + 1;
  const ny = rows + 1;
  const hf = new Float64Array(nx * ny);
  // sample in normalized space (4x2 base lattice cells, 4 octaves) so the landscape
  // does not depend on the grid resolution — only the contour resolution does
  let hMin = Infinity;
  let hMax = -Infinity;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const h = fbm(noise, (i / cols) * 4, (j / rows) * 2, 4);
      hf[j * nx + i] = h;
      if (h < hMin) hMin = h;
      if (h > hMax) hMax = h;
    }
  }

  const LEVELS = 9;
  const scale = 1600 / cols; // viewBox 1600x800
  const fmt = (v) => String(Math.round(v * scale * 10) / 10); // 1 decimal, no trailing .0
  const paths = [];
  let totalPoints = 0;
  let closedCount = 0;
  for (let k = 0; k < LEVELS; k++) {
    const iso = hMin + (hMax - hMin) * (0.15 + (0.7 * k) / (LEVELS - 1));
    const polylines = stitch(marchingSquares(hf, cols, rows, iso));
    for (const { pts, closed } of polylines) {
      if (pts.length < 4) continue;
      let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
      for (let p = 1; p < pts.length; p++) d += ` L${fmt(pts[p][0])} ${fmt(pts[p][1])}`;
      if (closed) d += ' Z';
      paths.push(`<path data-level="${k}" d="${d}"/>`);
      totalPoints += pts.length;
      if (closed) closedCount++;
    }
  }

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800" fill="none" stroke="currentColor" ' +
    'stroke-width="1" stroke-linejoin="round" stroke-linecap="round">\n' +
    paths.join('\n') +
    '\n</svg>\n';
  return { svg, cols, rows, paths: paths.length, closed: closedCount, totalPoints };
}

// ---------------------------------------------------------------- write outputs
fs.mkdirSync(OUT_PUBLIC, { recursive: true });

const moon = buildMoonpath();
const moonFile = path.join(OUT_PUBLIC, 'moonpath.png');
fs.writeFileSync(moonFile, moon.buf);
console.log(
  `${path.relative(ROOT, moonFile)}  ${moon.buf.length} bytes  (light ${(moon.whiteFraction * 100).toFixed(2)}%, dust ${moon.dust})`,
);

const SVG_LIMIT = 250 * 1024;
let contour = buildContour(160, 80);
if (Buffer.byteLength(contour.svg) > SVG_LIMIT) contour = buildContour(120, 60);
const contourFile = path.join(OUT_PUBLIC, 'contour.svg');
fs.writeFileSync(contourFile, contour.svg);
console.log(
  `${path.relative(ROOT, contourFile)}  ${Buffer.byteLength(contour.svg)} bytes  (grid ${contour.cols}x${contour.rows}, ${contour.paths} paths, ${contour.closed} closed, ${contour.totalPoints} points)`,
);
