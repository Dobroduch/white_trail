// Paints the Old Sawmill exterior tileset (16×16 tiles, 8 columns, palette colours only) and writes
//   assets/export/tilesets/sawmill_exterior.png     the tileset image (also imported into Pixelorama as the
//                                                    editable source: assets/source/pixelorama/tilesets/sawmill_exterior.pxo)
//   assets/levels/tilesets/sawmill_exterior.tsj     the Tiled tileset (tile names as properties)
//   tools/data/sawmill_tiles.json                   name → tile index, used by make-sawmill-level.mjs
//
// Lighting is left to the engine (the game darkens and warms the scene), so the tiles are painted in
// the palette's own dark values. Pixel density is the game's native 1 px = 1 px at 480×270.
//
// TILE ORDER IS FIXED once the tileset is in use: Tiled stores tiles by index. Add new tiles at the END of
// the list in `build()` (a new row), never in the middle. Hand edits in Pixelorama are fine; after that the
// .pxo is the source of truth and re-running this script overwrites them.
//
//   node tools/make-sawmill-tileset.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTE as C } from '../src/data/palette.js';
import { decodePNG, encodePNG } from './lib/png.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const T = 16, COLS = 8;
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const hash = (x, y, s = 0) => { let n = Math.imul(x * 374761393 + y * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) % 1024 / 1024; };

// ---- tiny raster canvas (RGBA, palette names) ------------------------------------------------------
class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h * 4); }
  p(x, y, name) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !name) return;
    const c = name === 'clear' ? [0, 0, 0, 0] : [...rgb(C[name]), 255];
    this.d.set(c, (y * this.w + x) * 4);
  }
  get(x, y) { const i = (y * this.w + x) * 4; return this.d.subarray(i, i + 4); }
  r(x, y, w, h, n) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, n); }
  hl(x0, x1, y, n) { for (let x = x0; x <= x1; x++) this.p(x, y, n); }
  vl(x, y0, y1, n) { for (let y = y0; y <= y1; y++) this.p(x, y, n); }
  line(x0, y0, x1, y1, n) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx - dy;
    for (;;) { this.p(x0, y0, n); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; } }
  }
  disc(cx, cy, rad, n) { for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.6) this.p(cx + x, cy + y, n); }
  ring(cx, cy, rad, n) { for (let a = 0; a < 360; a += 1) this.p(cx + Math.cos((a * Math.PI) / 180) * rad, cy + Math.sin((a * Math.PI) / 180) * rad, n); }
}

// ---- tile registry ---------------------------------------------------------------------------------
const tiles = []; // { name, data: Uint8Array(16*16*4) }
const names = new Map();
function addTile(name, fn) {
  const c = new Canvas(T, T);
  fn(c);
  names.set(name, tiles.length);
  tiles.push({ name, data: c.d });
}
// A big drawing sliced into (wt × ht) tiles named `${name}_${row}_${col}`.
function addBlock(name, wt, ht, fn) {
  const c = new Canvas(wt * T, ht * T);
  fn(c);
  for (let ty = 0; ty < ht; ty++) for (let tx = 0; tx < wt; tx++) {
    const t = new Canvas(T, T);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.d.set(c.get(tx * T + x, ty * T + y), (y * T + x) * 4);
    names.set(`${name}_${ty}_${tx}`, tiles.length);
    tiles.push({ name: `${name}_${ty}_${tx}`, data: t.d });
  }
}

// the Black Ram tileset's snow tiles are reused for the ground so both locations share one snow
const BR = decodePNG(readFileSync(resolve(root, 'assets/export/tilesets/black_ram_exterior.png')));
const brTile = (i, c) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const s = ((Math.floor(i / COLS) * T + y) * BR.width + (i % COLS) * T + x) * 4; c.d.set(BR.data.subarray(s, s + 4), (y * T + x) * 4); } };
const BR_SNOW_TOP = 7, BR_SNOW_FILL = 8;

// ---- painters --------------------------------------------------------------------------------------
// Vertical plank: seams, grain, a lit left edge. `x0` = left edge of the plank within the tile (6 px wide).
function plank(c, x0, w, shade, seed) {
  const body = shade === 0 ? 'wood1' : 'wood2', hi = shade === 0 ? 'wood2' : 'wood3', lo = 'wood0';
  c.r(x0, 0, w, T, body);
  c.vl(x0, 0, T - 1, hi);
  c.vl(x0 + w - 1, 0, T - 1, lo);
  for (let y = 0; y < T; y++) if (hash(x0, y, seed) > 0.86) c.p(x0 + 1 + Math.floor(hash(y, x0, seed) * (w - 2)), y, lo);
}
const woodWall = (c, seed, broken) => {
  // 16 px = 2 planks of 8 px; `broken` = bitmask of missing planks (their gap shows the dark inside)
  for (let i = 0; i < 2; i++) {
    if (broken & (1 << i)) { c.r(i * 8, 0, 8, T, 'ink'); c.vl(i * 8, 0, T - 1, 'wood0'); continue; }
    plank(c, i * 8, 8, (i + seed) % 2, seed + i);
  }
};
const snowCrust = (c, y0, seed) => { // wind-packed snow lip: bright top, bluish body
  for (let x = 0; x < T; x++) {
    const h = y0 + Math.round(hash(x, seed, 1) * 2);
    c.p(x, h, 'snow4'); c.p(x, h + 1, 'snow3');
    if (hash(x, seed, 2) > 0.5) c.p(x, h + 2, 'snow2');
  }
};
function post(c, off, w = 6, marks = null, cleat = false) {
  c.r(off, 0, w, T, 'wood2');
  c.vl(off, 0, T - 1, 'wood3'); c.vl(off + 1, 0, T - 1, 'wood3');
  c.vl(off + w - 1, 0, T - 1, 'wood0'); c.vl(off + w - 2, 0, T - 1, 'wood1');
  for (let y = 0; y < T; y++) if (hash(off, y, 71) > 0.8) c.p(off + 2 + (y % 2), y, 'wood1');
  if (marks) for (const [y, len] of marks) c.vl(off + 3, y, y + len, 'linen1');
  if (cleat) { c.r(off - 2, 6, 3, 3, 'iron2'); c.p(off - 2, 6, 'iron'); }
}

function build() {
  // ============================== snow, sawdust, water =================================================
  addTile('sawdust_top', (c) => { // packed earth + sawdust band under the shed roof (replaces snow_top)
    brTile(BR_SNOW_FILL, c);
    c.r(0, 0, T, 7, 'wood1');
    for (let x = 0; x < T; x++) {
      for (let y = 1; y < 7; y++) { const t = hash(x, y, 7); c.p(x, y, t < 0.45 ? 'wood2' : t < 0.78 ? 'wood3' : 'wood1'); }
      if (hash(x, 0, 8) > 0.55) c.p(x, 1, 'wood4');
    }
    c.hl(0, T - 1, 7, 'snow1');
  });
  const prints = (c, a) => {
    for (const [x, y] of a) { c.r(x, y, 4, 1, 'wood0'); c.p(x + 4, y, 'wood0'); c.p(x, y + 1, 'wood0'); c.p(x - 1, y, 'wood0'); }
  };
  addTile('sawdust_prints_a', (c) => { names.get('sawdust_top'); c.d.set(tiles[names.get('sawdust_top')].data); prints(c, [[2, 2], [10, 3]]); });
  addTile('sawdust_prints_b', (c) => { c.d.set(tiles[names.get('sawdust_top')].data); prints(c, [[5, 3], [13, 2]]); });
  addTile('sawdust_ash', (c) => { // the ash pit: a low heap of ash and charred ends
    c.d.set(tiles[names.get('sawdust_top')].data);
    for (let x = 1; x < 15; x++) { const h = 1 + Math.round(Math.sin(((x - 1) / 14) * Math.PI) * 2); for (let y = 1; y <= h + 2; y++) c.p(x, 3 - h + y, hash(x, y, 9) > 0.45 ? 'stone0' : 'iron'); }
    for (let i = 0; i < 8; i++) c.p(2 + Math.floor(hash(i, 1, 4) * 12), 1 + Math.floor(hash(i, 2, 4) * 3), hash(i, 3, 4) > 0.5 ? 'stone2' : 'wood0');
  });
  const snowPrints = (c, pts) => {
    brTile(BR_SNOW_TOP, c);
    for (const [x, y] of pts) { c.r(x, y, 3, 2, 'snow1'); c.hl(x, x + 2, y - 1, 'snow4'); c.p(x + 3, y, 'snow2'); }
  };
  addTile('snow_prints_a', (c) => snowPrints(c, [[2, 3], [10, 5]]));
  addTile('snow_prints_b', (c) => snowPrints(c, [[5, 5], [13, 3]]));
  const furrow = (c, dy) => { // a dragged body's furrow: trough with a ridge of pushed snow beside it
    brTile(BR_SNOW_TOP, c);
    for (let x = 0; x < T; x++) {
      const y = 3 + dy + Math.round(Math.sin(x / 2.6) * 0.6);
      c.p(x, y, 'snow0'); c.p(x, y + 1, 'snow1'); c.p(x, y + 2, 'snow0');
      c.p(x, y - 1, 'snow4'); if (x % 3) c.p(x, y + 3, 'snow2');
    }
  };
  addTile('furrow_a', (c) => furrow(c, 0));
  addTile('furrow_b', (c) => furrow(c, 1));
  addTile('bank', (c) => { // snow bank dropping into the creek
    c.d.set(tiles[0].data);
    brTile(BR_SNOW_FILL, c);
    for (let x = 0; x < T; x++) {
      const top = Math.round(1 + (x / 15) * 8);
      for (let y = 0; y < top; y++) c.p(x, y, 'clear');
      c.p(x, top, 'snow4'); c.p(x, top + 1, 'snow3');
      for (let y = top + 8; y < T; y++) c.p(x, y, hash(x, y, 12) > 0.93 ? 'navy3' : 'navy2');
    }
  });
  addTile('ice_edge', (c) => { // creek surface at native y 233: pale ice rim, then black water (rows above are open air)
    c.r(0, 9, T, 7, 'navy');
    for (let x = 0; x < T; x++) { c.p(x, 9, x % 3 ? 'snow1' : 'snow2'); c.p(x, 10, 'haze0'); if (hash(x, 3, 5) > 0.6) c.p(x, 11, 'navy3'); }
    for (let i = 0; i < 3; i++) c.hl(2 + i * 5, 4 + i * 5, 13 + (i % 2), 'haze0');
  });
  addTile('water', (c) => {
    c.r(0, 0, T, T, 'navy');
    for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (hash(x, y, 6) > 0.93) c.p(x, y, 'navy3');
    for (let i = 0; i < 3; i++) { const y = 3 + i * 5; c.hl(1 + i * 3, 5 + i * 3, y, 'navy3'); c.p(2 + i * 3, y - 1, 'haze0'); }
  });
  addTile('drift_a', (c) => { // wind drift piled against the shed's foot
    for (let x = 0; x < T; x++) {
      const h = Math.round(Math.sin((x / 15) * Math.PI) * 9) + 2;
      for (let y = 0; y < h; y++) c.p(x, 16 - 1 - y, y > h - 3 ? 'snow4' : y > h - 5 ? 'snow3' : y > 1 ? 'snow1' : 'snow0');
    }
  });
  addTile('drift_l', (c) => { for (let x = 0; x < T; x++) { const h = Math.round((x / 15) * 8) + 2; for (let y = 0; y < h; y++) c.p(x, 15 - y, y > h - 3 ? 'snow4' : y > h - 5 ? 'snow3' : y > 1 ? 'snow1' : 'snow0'); } });
  addTile('drift_r', (c) => { for (let x = 0; x < T; x++) { const h = Math.round(((15 - x) / 15) * 8) + 2; for (let y = 0; y < h; y++) c.p(x, 15 - y, y > h - 3 ? 'snow4' : y > h - 5 ? 'snow3' : y > 1 ? 'snow1' : 'snow0'); } });

  // ============================== timber structure =====================================================
  addTile('post', (c) => post(c, 5));
  addTile('post_edge_r', (c) => post(c, 10)); // post flush to a tile's right side
  addTile('post_edge_l', (c) => post(c, 3));
  addTile('post_foot', (c) => { post(c, 5); c.r(3, 13, 10, 3, 'wood0'); c.hl(3, 12, 13, 'snow3'); c.hl(4, 10, 12, 'snow4'); });
  addTile('post_marks', (c) => post(c, 10, 6, [[3, 3], [9, 4]])); // pale cuts on the carved post
  addTile('post_marks_b', (c) => { post(c, 10, 6, [[1, 3], [7, 3], [12, 3]]); c.line(9, 13, 12, 10, 'linen1'); });
  addTile('cleat_r', (c) => { c.r(0, 11, 5, 4, 'iron2'); c.hl(0, 4, 11, 'stone2'); c.hl(0, 4, 14, 'iron'); c.p(4, 12, 'iron'); }); // iron cleat the rope is made fast to (right of the post)
  addTile('post_cleat', (c) => post(c, 10, 6, null, true)); // iron cleat the rope is made fast to
  addTile('post_snow', (c) => { post(c, 5); snowCrust(c, 0, 3); });
  addTile('plank_a', (c) => woodWall(c, 0, 0));
  addTile('plank_b', (c) => woodWall(c, 1, 0));
  addTile('plank_gap_l', (c) => woodWall(c, 0, 1));
  addTile('plank_gap_r', (c) => woodWall(c, 1, 2));
  addTile('plank_gap_both', (c) => woodWall(c, 0, 3));
  addTile('plank_end_a', (c) => { woodWall(c, 0, 0); for (let i = 0; i < 2; i++) { const cut = 7 + Math.round(hash(i, 1, 33) * 7); c.r(i * 8, cut, 8, T - cut, 'clear'); c.p(i * 8 + 2, cut, 'wood0'); c.p(i * 8 + 5, cut + 1, 'wood0'); } }); // ragged bottom edge of a plank
  addTile('plank_end_b', (c) => { woodWall(c, 1, 0); const cut = [3, 11]; for (let i = 0; i < 2; i++) { c.r(i * 8, cut[i], 8, T - cut[i], 'clear'); c.p(i * 8 + 3, cut[i], 'wood0'); } });
  addTile('plank_top', (c) => { // top of the wall under the roof: darker, shadowed
    woodWall(c, 0, 0); c.r(0, 0, T, 3, 'wood0'); c.hl(0, T - 1, 3, 'wood1');
  });
  // roof: boards with a heavy snow load and icicles
  addTile('roof_snow_a', (c) => { for (let x = 0; x < T; x++) { const h = 6 + Math.round(Math.sin(x / 2.5) * 1.2 + hash(x, 1, 3) * 1.5); for (let y = 16 - h; y < 16; y++) c.p(x, y, y === 16 - h ? 'snow4' : y < 16 - h + 2 ? 'snow3' : y < 16 - h + 4 ? 'snow2' : 'snow1'); } });
  addTile('roof_snow_b', (c) => { for (let x = 0; x < T; x++) { const h = 4 + Math.round(Math.sin(x / 1.9 + 2) * 1.0 + hash(x, 2, 3) * 1.8); for (let y = 16 - h; y < 16; y++) c.p(x, y, y === 16 - h ? 'snow4' : y < 16 - h + 2 ? 'snow3' : y < 16 - h + 4 ? 'snow2' : 'snow1'); } });
  addTile('roof_board', (c) => { // roof boards seen edge-on, snow overhanging, icicles
    c.r(0, 0, T, 9, 'wood1');
    for (let x = 0; x < T; x++) { c.p(x, 0, 'snow3'); c.p(x, 1, x % 5 ? 'snow2' : 'snow1'); }
    c.hl(0, T - 1, 5, 'wood0'); c.hl(0, T - 1, 8, 'wood0');
    for (let x = 0; x < T; x += 4) c.vl(x, 2, 4, 'wood2');
    for (let x = 1; x < T; x += 3) { const len = 2 + Math.floor(hash(x, 4, 6) * 5); for (let y = 0; y < len; y++) c.p(x, 9 + y, y < len - 1 ? 'snow2' : 'snow4'); }
  });
  addTile('roof_board_b', (c) => {
    c.r(0, 0, T, 9, 'wood1');
    for (let x = 0; x < T; x++) { c.p(x, 0, 'snow3'); c.p(x, 1, x % 4 ? 'snow2' : 'snow1'); }
    c.hl(0, T - 1, 4, 'wood0'); c.hl(0, T - 1, 8, 'wood0');
    for (let x = 2; x < T; x += 5) c.vl(x, 5, 7, 'wood2');
    for (let x = 0; x < T; x += 4) { const len = 3 + Math.floor(hash(x, 5, 6) * 6); for (let y = 0; y < len; y++) c.p(x, 9 + y, y < len - 1 ? 'snow2' : 'snow4'); }
  });
  addTile('roof_end_l', (c) => { c.r(2, 0, 14, 9, 'wood1'); for (let x = 2; x < T; x++) { c.p(x, 0, 'snow3'); c.p(x, 1, 'snow2'); } c.hl(2, 15, 5, 'wood0'); c.hl(2, 15, 8, 'wood0'); c.vl(2, 0, 8, 'wood0'); c.vl(3, 2, 8, 'wood2'); c.p(4, 9, 'snow3'); c.vl(7, 9, 13, 'snow2'); c.p(7, 14, 'snow4'); });
  addTile('roof_end_r', (c) => { c.r(0, 0, 14, 9, 'wood1'); for (let x = 0; x < 14; x++) { c.p(x, 0, 'snow3'); c.p(x, 1, 'snow2'); } c.hl(0, 13, 5, 'wood0'); c.hl(0, 13, 8, 'wood0'); c.vl(13, 0, 8, 'wood0'); c.vl(12, 2, 8, 'wood2'); c.vl(9, 9, 12, 'snow2'); c.p(9, 13, 'snow4'); });
  addTile('beam_h', (c) => { // heavy horizontal timber, snow lying along its top
    c.r(0, 9, T, 7, 'wood2'); c.hl(0, T - 1, 9, 'wood3'); c.hl(0, T - 1, 10, 'wood3'); c.hl(0, T - 1, 15, 'wood0'); c.hl(0, T - 1, 14, 'wood1');
    for (let x = 0; x < T; x++) if (hash(x, 1, 21) > 0.82) c.p(x, 11 + (x % 3), 'wood1');
    for (let x = 0; x < T; x++) { c.p(x, 8, 'snow4'); c.p(x, 7, hash(x, 2, 22) > 0.4 ? 'snow3' : 'clear'); if (hash(x, 3, 22) > 0.7) c.p(x, 6, 'snow4'); }
  });
  addTile('beam_end_l', (c) => { c.r(2, 9, 14, 7, 'wood2'); c.hl(2, 15, 9, 'wood3'); c.hl(2, 15, 10, 'wood3'); c.hl(2, 15, 15, 'wood0'); c.hl(2, 15, 14, 'wood1'); c.vl(2, 9, 15, 'wood0'); for (let x = 2; x < T; x++) { c.p(x, 8, 'snow4'); c.p(x, 7, 'snow3'); } });
  addTile('beam_end_r', (c) => { c.r(0, 9, 14, 7, 'wood2'); c.hl(0, 13, 9, 'wood3'); c.hl(0, 13, 10, 'wood3'); c.hl(0, 13, 15, 'wood0'); c.hl(0, 13, 14, 'wood1'); c.vl(13, 9, 15, 'wood0'); for (let x = 0; x < 14; x++) { c.p(x, 8, 'snow4'); c.p(x, 7, 'snow3'); } });
  addTile('brace_up', (c) => { for (let i = 0; i < 16; i++) { c.r(i, 15 - i, 3, 1, 'wood1'); c.p(i, 14 - i, 'wood2'); c.p(i + 3, 15 - i, 'wood0'); } });
  addTile('rope_burn', (c) => { // pale scuffing on the beam's underside where the rope ran
    c.d.set(tiles[names.get('beam_h')].data);
    for (let i = 0; i < 5; i++) c.p(5 + i, 13, 'linen0'); c.p(7, 14, 'linen0'); c.p(6, 12, 'linen1');
  });

  // ============================== machinery & big pieces ==============================================
  addTile('rail', (c) => { // carriage rail on sleepers
    c.r(0, 11, T, 2, 'iron2'); c.hl(0, T - 1, 11, 'stone2'); c.hl(0, T - 1, 13, 'iron');
    c.r(1, 13, 3, 3, 'wood1'); c.r(9, 13, 3, 3, 'wood1'); c.hl(1, 3, 13, 'wood2'); c.hl(9, 11, 13, 'wood2');
  });
  addBlock('log', 7, 2, (c) => { // the clamped log on the carriage (112×32): bark above, carriage bed below
    // carriage bed + legs
    c.r(0, 18, 112, 3, 'wood1'); c.hl(0, 111, 18, 'wood3'); c.hl(0, 111, 20, 'wood0');
    c.r(6, 21, 3, 11, 'wood0'); c.r(94, 21, 3, 11, 'wood0'); c.vl(6, 21, 31, 'wood1'); c.vl(94, 21, 31, 'wood1');
    // log body
    for (let y = 4; y < 18; y++) for (let x = 5; x < 107; x++) {
      const t = (y - 4) / 13, g = hash(x >> 2, y, 41);
      c.p(x, y, t < 0.12 ? 'wood4' : t < 0.34 ? 'wood3' : t < 0.78 ? (g > 0.7 ? 'wood1' : 'wood2') : 'wood1');
    }
    for (let x = 5; x < 107; x++) { c.p(x, 4, 'wood5'); if (hash(x, 1, 42) > 0.55) c.p(x, 3, 'wood2'); c.p(x, 17, 'wood0'); }
    // clamp irons
    for (const x of [30, 84]) { c.r(x, 2, 3, 17, 'iron2'); c.vl(x, 2, 18, 'iron'); c.r(x - 1, 2, 5, 2, 'iron'); }
    // cut end (the sawn face, left) and snow caught on top
    c.disc(8, 11, 7, 'wood4'); c.ring(8, 11, 4, 'wood3'); c.ring(8, 11, 2, 'wood2'); c.p(8, 11, 'wood1');
    for (let x = 12; x < 100; x++) if (hash(x, 3, 43) > 0.45) { c.p(x, 3, 'snow3'); if (hash(x, 4, 43) > 0.7) c.p(x, 2, 'snow4'); }
  });
  addBlock('blade', 2, 2, (c) => { // circular blade, rust-eaten, with the arbor
    const cx = 16, cy = 16;
    for (let a = 0; a < 48; a++) {
      const t = (a / 48) * Math.PI * 2, tooth = a % 2 ? 14 : 12;
      for (let rr = 6; rr <= tooth; rr++) c.p(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, rr > 10 ? 'rust' : 'iron2');
    }
    c.ring(cx, cy, 10, 'iron'); c.ring(cx, cy, 7, 'iron');
    for (let a = 0; a < 40; a++) { const t = (a / 40) * Math.PI * 2; if (hash(a, 1, 44) > 0.6) c.p(cx + Math.cos(t) * 9, cy + Math.sin(t) * 9, 'stone2'); }
    c.disc(cx, cy, 3, 'iron'); c.disc(cx, cy, 1, 'stone4');
    for (let x = 22; x < 31; x++) if (hash(x, 1, 45) > 0.4) c.p(x, 3, 'snow3'); // snow caught in the teeth
  });
  addBlock('wheel', 6, 6, (c) => { // the stopped, iced waterwheel (96×96); hub at (48,48)
    const cx = 48, cy = 48, R = 42;
    for (let a = 0; a < 720; a++) {
      const t = (a / 720) * Math.PI * 2;
      for (const [rr, col] of [[R, 'wood2'], [R - 1, 'wood3'], [R - 2, 'wood1'], [R - 11, 'wood1'], [R - 12, 'wood2']]) c.p(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, col);
    }
    for (let k = 0; k < 12; k++) { // spokes and paddle boards
      const t = (k / 12) * Math.PI * 2 + 0.1;
      for (let rr = 5; rr < R - 2; rr++) { const x = cx + Math.cos(t) * rr, y = cy + Math.sin(t) * rr; c.p(x, y, 'wood1'); c.p(x + 1, y, 'wood0'); }
      const bx = cx + Math.cos(t) * (R - 5), by = cy + Math.sin(t) * (R - 5);
      c.r(Math.round(bx) - 3, Math.round(by) - 3, 6, 6, 'wood1'); c.r(Math.round(bx) - 3, Math.round(by) - 3, 6, 1, 'wood3'); c.r(Math.round(bx) - 3, Math.round(by) + 2, 6, 1, 'wood0');
      if (Math.sin(t) > 0.15) for (let i = 0; i < 4 + (k % 3); i++) c.p(bx, by + 3 + i, i < 3 + (k % 3) ? 'snow2' : 'snow4'); // icicles hanging off the lower paddles
    }
    for (let a = 360; a < 540; a++) { const t = (a / 720) * Math.PI * 2; if (hash(a, 1, 46) > 0.35) c.p(cx + Math.cos(t + Math.PI) * R, cy + Math.sin(t + Math.PI) * R - 1, 'snow3'); }
    c.disc(cx, cy, 4, 'iron'); c.disc(cx, cy, 2, 'iron2'); c.p(cx, cy, 'stone4');
    for (let a = 0; a < 40; a++) c.p(cx - 6 + Math.floor(hash(a, 1, 47) * 12), cy - 6 + Math.floor(hash(a, 2, 47) * 12), 'clear'); // gaps between the spokes read as sky
  });

  // ============================== the approach: fence, logs, sign =====================================
  addTile('fence_post', (c) => { c.r(6, 4, 4, 12, 'wood2'); c.vl(6, 4, 15, 'wood3'); c.vl(9, 4, 15, 'wood0'); c.hl(5, 10, 3, 'snow4'); c.hl(6, 9, 2, 'snow3'); c.hl(0, 15, 8, 'wood1'); c.hl(0, 15, 12, 'wood1'); c.hl(0, 5, 7, 'snow2'); c.hl(10, 15, 7, 'snow2'); });
  addTile('fence_span', (c) => { c.hl(0, 15, 8, 'wood1'); c.hl(0, 15, 9, 'wood0'); c.hl(0, 15, 12, 'wood1'); c.hl(0, 15, 13, 'wood0'); for (let x = 0; x < 16; x++) { c.p(x, 7, hash(x, 1, 50) > 0.3 ? 'snow2' : 'snow4'); c.p(x, 11, hash(x, 2, 50) > 0.6 ? 'snow1' : 'clear'); } });
  addTile('fence_broken', (c) => { c.r(6, 8, 4, 8, 'wood1'); c.vl(6, 8, 15, 'wood2'); c.line(9, 8, 12, 3, 'wood2'); c.line(10, 8, 13, 4, 'wood1'); c.hl(5, 10, 7, 'snow4'); c.hl(0, 5, 12, 'wood1'); c.hl(0, 4, 11, 'snow2'); });
  addBlock('logstack', 3, 2, (c) => { // cordwood stack, the log ends facing us (48×32)
    c.r(0, 0, 48, 32, 'clear');
    for (let row = 0; row < 3; row++) for (let col = 0; col < (row === 2 ? 4 : 5); col++) {
      const cx = (row === 2 ? 10 : 6) + col * 9 + (row === 1 ? 4 : 0), cy = 27 - row * 8 + (row === 1 ? 0 : 0);
      c.disc(cx, cy, 4, 'wood1'); c.ring(cx, cy, 3, 'wood3'); c.ring(cx, cy, 1, 'wood2'); c.p(cx, cy, 'wood0'); c.p(cx - 2, cy - 3, 'wood4');
    }
    for (let x = 2; x < 46; x++) { if (hash(x, 1, 51) > 0.3) c.p(x, 4, 'snow3'); if (hash(x, 2, 51) > 0.6) c.p(x, 3, 'snow4'); }
    c.hl(4, 44, 5, 'snow2');
  });
  addBlock('sign', 2, 2, (c) => { // MILL board on a leaning post
    c.r(4, 8, 5, 24, 'wood1'); c.vl(4, 8, 31, 'wood3'); c.vl(8, 8, 31, 'wood0');
    c.r(1, 0, 30, 14, 'wood2'); c.hl(1, 30, 0, 'snow4'); c.hl(2, 29, 1, 'snow3'); c.hl(1, 30, 13, 'wood0'); c.vl(1, 0, 13, 'wood3'); c.vl(30, 0, 13, 'wood0');
    const font = { M: ['101', '111', '111', '101', '101'], I: ['111', '010', '010', '010', '111'], L: ['100', '100', '100', '100', '111'] };
    let x = 6; for (const ch of 'MILL') { font[ch].forEach((row, j) => [...row].forEach((v, i) => v === '1' && c.p(x + i, 4 + j, 'linen1'))); x += 5; }
    c.p(3, 3, 'iron2'); c.p(28, 3, 'iron2');
  });
  addTile('stump', (c) => { c.r(3, 6, 10, 10, 'wood1'); c.vl(3, 6, 15, 'wood3'); c.vl(12, 6, 15, 'wood0'); c.hl(2, 13, 5, 'wood4'); c.hl(3, 12, 6, 'wood3'); c.hl(4, 11, 4, 'snow4'); c.hl(5, 10, 3, 'snow3'); for (let i = 0; i < 4; i++) c.p(5 + i * 2, 5, 'wood2'); });
  addTile('barrel', (c) => { c.r(3, 3, 10, 13, 'wood2'); c.vl(3, 4, 14, 'wood3'); c.vl(12, 4, 14, 'wood0'); c.hl(3, 12, 5, 'iron2'); c.hl(3, 12, 13, 'iron2'); c.hl(3, 12, 2, 'snow4'); c.hl(4, 11, 1, 'snow3'); c.hl(3, 12, 3, 'wood4'); });
  addTile('crate', (c) => { c.r(1, 4, 14, 12, 'wood2'); c.hl(1, 14, 4, 'wood4'); c.hl(1, 14, 15, 'wood0'); c.vl(1, 4, 15, 'wood3'); c.vl(14, 4, 15, 'wood0'); c.line(2, 5, 13, 14, 'wood1'); c.line(13, 5, 2, 14, 'wood1'); c.hl(1, 14, 3, 'snow4'); c.hl(2, 13, 2, 'snow3'); });
  addTile('icicle_row', (c) => { for (let x = 1; x < T; x += 3) { const len = 2 + Math.floor(hash(x, 7, 60) * 6); for (let y = 0; y < len; y++) c.p(x, y, y < len - 1 ? 'snow2' : 'snow4'); } });
  addTile('hook_lantern', (c) => { c.vl(8, 0, 4, 'iron2'); c.r(6, 5, 5, 6, 'iron'); c.hl(6, 10, 5, 'iron2'); c.hl(7, 9, 11, 'iron2'); c.r(7, 6, 3, 4, 'navy2'); }); // an unlit lantern left on its hook
  addBlock('rope', 4, 5, (c) => { // the rope from the burn on the beam to the cleat on the post (64×80); the beam is above, the cleat at its foot
    for (let i = 0; i <= 77; i++) { const t = i / 77, x = 58 - t * 54, y = 1 + i; c.p(x, y, 'brass1'); c.p(x + 1, y, 'brass0'); if (i % 4 === 0) c.p(x - 1, y, 'brass2'); }
  });
  // ---- pad to a whole row
  while (tiles.length % COLS) addTile('pad' + tiles.length, () => {});
}

build();
const rows = Math.ceil(tiles.length / COLS);
const W = COLS * T, H = rows * T;
const img = new Uint8Array(W * H * 4);
tiles.forEach((t, i) => { const ox = (i % COLS) * T, oy = Math.floor(i / COLS) * T; for (let y = 0; y < T; y++) img.set(t.data.subarray(y * T * 4, (y + 1) * T * 4), ((oy + y) * W + ox) * 4); });
mkdirSync(resolve(root, 'assets/export/tilesets'), { recursive: true });
writeFileSync(resolve(root, 'assets/export/tilesets/sawmill_exterior.png'), encodePNG(W, H, img));
const tsj = {
  type: 'tileset', version: '1.10', tiledversion: '1.11.0', name: 'sawmill_exterior', tilewidth: T, tileheight: T, columns: COLS,
  tilecount: tiles.length, margin: 0, spacing: 0, image: '../../export/tilesets/sawmill_exterior.png', imagewidth: W, imageheight: H,
  tiles: tiles.map((t, i) => ({ id: i, properties: [{ name: 'name', type: 'string', value: t.name }] })).filter((t) => !t.properties[0].value.startsWith('pad')),
};
writeFileSync(resolve(root, 'assets/levels/tilesets/sawmill_exterior.tsj'), JSON.stringify(tsj, null, 1) + String.fromCharCode(10));
mkdirSync(resolve(root, 'tools/data'), { recursive: true });
writeFileSync(resolve(root, 'tools/data/sawmill_tiles.json'), JSON.stringify(Object.fromEntries(names), null, 1) + String.fromCharCode(10));
console.log(`sawmill_exterior.png: ${tiles.length} tiles, ${W}×${H}`);
