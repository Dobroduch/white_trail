// Pixel-art painting primitives. Everything is drawn with integer rects so it stays on the grid.
import { BAYER4, mulberry32, noise1 } from '../engine/rng.js';
import { makeCanvas } from '../engine/display.js';

export const PAL = {
  navy: '#090d16', navy2: '#0f1524', navy3: '#161e2e',
  slate0: '#1c2434', slate1: '#232d3f', slate2: '#2b3649', slate: '#334155', slate4: '#475569',
  slate5: '#64748b', slate6: '#94a3b8', slate7: '#cbd5e1', bone: '#f1f5f9',
  purple: '#171026', purple2: '#21183a',
  amber: '#f59e0b', kerosene: '#d97706', amberHi: '#fcd34d', ember: '#b45309',
  crimson: '#991b1b', crimsonDark: '#4a1010',
  wood0: '#1a120d', wood1: '#2a1c14', wood2: '#3b2a1e', wood3: '#4e3826', wood4: '#634832', wood5: '#7a5a3e',
  snow0: '#5d6a80', snow1: '#7d8aa0', snow2: '#a3afc2', snow3: '#c8d1de', snow4: '#e4e9f0',
  ink: '#0b0d14', iron: '#24272e', iron2: '#3a3f4a', rust: '#5b3423',
};

export function canvas(w, h) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

export function rect(ctx, x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export function px(ctx, x, y, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }

export function hline(ctx, x0, x1, y, col) { rect(ctx, Math.min(x0, x1), y, Math.abs(x1 - x0) + 1, 1, col); }
export function vline(ctx, x, y0, y1, col) { rect(ctx, x, Math.min(y0, y1), 1, Math.abs(y1 - y0) + 1, col); }

// Bresenham line
export function line(ctx, x0, y0, x1, y1, col) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  ctx.fillStyle = col;
  for (let i = 0; i < 2000; i++) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Vertical dithered gradient between a list of colours (ordered Bayer dithering).
export function ditherGradient(ctx, x, y, w, h, colors) {
  const n = colors.length - 1;
  for (let yy = 0; yy < h; yy++) {
    const t = (yy / Math.max(1, h - 1)) * n;
    const i = Math.min(n - 1, Math.floor(t));
    const f = t - i;
    for (let xx = 0; xx < w; xx++) {
      const thr = (BAYER4[yy & 3][xx & 3] + 0.5) / 16;
      ctx.fillStyle = f > thr ? colors[i + 1] : colors[i];
      ctx.fillRect(x + xx, y + yy, 1, 1);
    }
  }
}

// Fill with a dither mix of two colours at ratio r (0..1).
export function ditherFill(ctx, x, y, w, h, a, b, r) {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const thr = (BAYER4[(y + yy) & 3][(x + xx) & 3] + 0.5) / 16;
    ctx.fillStyle = r > thr ? b : a;
    ctx.fillRect(x + xx, y + yy, 1, 1);
  }
}

// Mountain ridge silhouette with snow caps.
export function mountains(ctx, w, baseY, amp, seed, body, snow, edge) {
  const rng = mulberry32(seed);
  const heights = [];
  for (let x = 0; x < w; x++) {
    const n = noise1(x / 46, seed) * 0.6 + noise1(x / 17, seed + 7) * 0.28 + noise1(x / 6, seed + 3) * 0.12;
    heights.push(Math.round(baseY - n * amp));
  }
  for (let x = 0; x < w; x++) {
    const top = heights[x];
    rect(ctx, x, top, 1, 200 - top, body);
    if (edge) px(ctx, x, top, edge);
    // snow: near peaks and on left-facing slopes
    const slope = (heights[x + 1] ?? top) - top;
    const peakness = (baseY - top) / amp;
    if (peakness > 0.45) {
      const depth = Math.round(2 + peakness * 6 + (slope > 0 ? 2 : 0) + rng() * 2);
      for (let d = 0; d < depth; d++) {
        if (d > depth - 3 && (x + d) % 2) continue;
        px(ctx, x, top + d, snow);
      }
    }
  }
  return heights;
}

// A pixel pine tree. tiers of widening sawtooth with snow on the upper edges.
export function pine(ctx, x, baseY, h, col, snowCol, rng, trunkCol) {
  x = Math.round(x); baseY = Math.round(baseY);
  const top = baseY - h;
  const foliageH = h - Math.max(2, Math.round(h * 0.1));
  const tierH = Math.max(3, Math.round(h / 6));
  if (trunkCol) rect(ctx, x, baseY - Math.round(h * 0.14), 1, Math.round(h * 0.14), trunkCol);
  for (let r = 0; r < foliageH; r++) {
    const within = r % tierH;
    const tier = Math.floor(r / tierH);
    const hw = Math.max(0, Math.round(within * 0.8 + tier * 1.25 + r * 0.06));
    rect(ctx, x - hw, top + r, hw * 2 + 1, 1, col);
    if (snowCol && within <= 1 && r > 0) {
      const sw = Math.max(1, Math.round(hw * 0.7));
      for (let i = -hw; i <= -hw + sw; i++) if (rng() > 0.25) px(ctx, x + i, top + r, snowCol);
      if (rng() > 0.6) px(ctx, x + hw, top + r, snowCol);
    }
  }
}

export function pineRow(ctx, w, baseY, minH, maxH, spacing, seed, col, snowCol, trunkCol) {
  const rng = mulberry32(seed);
  let x = -10 + rng() * spacing;
  while (x < w + 10) {
    const h = minH + rng() * (maxH - minH);
    pine(ctx, x, baseY + rng() * 4, h, col, snowCol, rng, trunkCol);
    x += spacing * (0.5 + rng() * 0.9);
  }
}

// Snow ground band following a height function, with a lit top edge.
export function snowGround(ctx, w, groundAt, bottom, seed, tones = [PAL.snow4, PAL.snow3, PAL.snow2, PAL.snow1]) {
  const rng = mulberry32(seed);
  for (let x = 0; x < w; x++) {
    const g = Math.round(groundAt(x));
    const depth = bottom - g;
    for (let y = 0; y < depth; y++) {
      const t = y / Math.max(1, depth);
      const thr = (BAYER4[(g + y) & 3][x & 3] + 0.5) / 16;
      let col;
      if (y === 0) col = tones[0];
      else if (t < 0.25) col = t * 4 > thr ? tones[2] : tones[1];
      else col = (t - 0.25) * 1.4 > thr ? tones[3] : tones[2];
      px(ctx, x, g + y, col);
    }
    if (rng() > 0.93) px(ctx, x, g + 1 + Math.floor(rng() * 6), tones[3]);
  }
}

// Horizontal timber planking.
export function planks(ctx, x, y, w, h, base, dark, light, seed, plankH = 4) {
  const rng = mulberry32(seed);
  rect(ctx, x, y, w, h, base);
  for (let yy = y; yy < y + h; yy += plankH) {
    hline(ctx, x, x + w - 1, yy, dark);
    let sx = x + Math.floor(rng() * 30);
    while (sx < x + w) {
      vline(ctx, sx, yy, Math.min(y + h - 1, yy + plankH - 1), dark);
      sx += 18 + Math.floor(rng() * 26);
    }
    for (let i = 0; i < w / 9; i++) {
      const gx = x + Math.floor(rng() * w);
      px(ctx, gx, yy + 1 + Math.floor(rng() * (plankH - 1)), rng() > 0.5 ? light : dark);
    }
  }
}

// Vertical board siding.
export function siding(ctx, x, y, w, h, base, dark, light, seed, boardW = 4) {
  const rng = mulberry32(seed);
  rect(ctx, x, y, w, h, base);
  for (let xx = x; xx < x + w; xx += boardW) {
    vline(ctx, xx, y, y + h - 1, dark);
    if (rng() > 0.5) vline(ctx, xx + 1, y, y + h - 1, light);
    for (let i = 0; i < h / 8; i++) px(ctx, xx + 1 + Math.floor(rng() * (boardW - 1)), y + Math.floor(rng() * h), dark);
  }
}

export function windowPane(ctx, x, y, w, h, frame, glass, lit) {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, frame);
  rect(ctx, x, y, w, h, glass);
  if (lit) {
    rect(ctx, x, y + h - Math.ceil(h / 3), w, Math.ceil(h / 3), lit);
  }
  vline(ctx, x + Math.floor(w / 2), y, y + h - 1, frame);
  hline(ctx, x, x + w - 1, y + Math.floor(h / 2), frame);
}

// ---- Tiny 3x5 sign font (uppercase, digits, a few marks) ----
const GLYPHS = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111101101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101101111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
  8: '111101111101111', 9: '111101111001110',
  "'": '010010000000000', '.': '000000000000010', '-': '000000111000000', ' ': '000000000000000',
  ',': '000000000010100', '/': '001001010100100', '&': '010101010101011', '½': '100101010101011',
};
export function signText(ctx, str, x, y, col) {
  let cx = Math.round(x);
  for (const ch of str.toUpperCase()) {
    const g = GLYPHS[ch];
    if (g) {
      for (let i = 0; i < 15; i++) if (g[i] === '1') px(ctx, cx + (i % 3), y + Math.floor(i / 3), col);
    }
    cx += 4;
  }
  return cx - x;
}
export function signWidth(str) { return str.length * 4 - 1; }

// Soft fog strip texture (alpha blobs, dithered) for drifting ground fog.
export function fogTexture(w, h, seed, col) {
  const [c, ctx] = canvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = noise1(x / 22, seed) * 0.6 + noise1(x / 7 + y * 0.3, seed + 5) * 0.4;
    const fall = 1 - Math.abs(y - h / 2) / (h / 2);
    const v = n * fall;
    const thr = (BAYER4[y & 3][x & 3] + 0.5) / 16;
    if (v * 1.3 > thr + 0.25) px(ctx, x, y, col);
  }
  return c;
}
