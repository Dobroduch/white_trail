// Shared helpers for the tileset painters (tools/make-*-tileset.mjs): a tiny RGBA raster canvas that paints with
// palette names, a tile registry (single tiles and blocks sliced into tiles), the Black Ram snow tiles, and the writer
// for the PNG + Tiled .tsj + name→index json. Palette colours only, so exports pass `palette.mjs --check --strict`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PALETTE as C } from '../../src/data/palette.js';
import { decodePNG, encodePNG } from './png.mjs';

export const T = 16, COLS = 8;
export const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const hash = (x, y, s = 0) => { let n = Math.imul(x * 374761393 + y * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) % 1024 / 1024; };

export class Canvas {
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

/** Tile registry: addTile(name, fn(canvas)), addBlock(name, wt, ht, fn(bigCanvas)) sliced as name_row_col. */
export function registry() {
  const tiles = []; // { name, data }
  const names = new Map();
  const addTile = (name, fn) => { const c = new Canvas(T, T); fn(c); names.set(name, tiles.length); tiles.push({ name, data: c.d }); };
  const addBlock = (name, wt, ht, fn) => {
    const c = new Canvas(wt * T, ht * T);
    fn(c);
    for (let ty = 0; ty < ht; ty++) for (let tx = 0; tx < wt; tx++) {
      const t = new Canvas(T, T);
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.d.set(c.get(tx * T + x, ty * T + y), (y * T + x) * 4);
      names.set(`${name}_${ty}_${tx}`, tiles.length);
      tiles.push({ name: `${name}_${ty}_${tx}`, data: t.d });
    }
  };
  return { tiles, names, addTile, addBlock };
}

/** The Black Ram tileset's tiles, copyable into new tiles so locations share their snow, windows, doors. */
export function blackRam(root) {
  const BR = decodePNG(readFileSync(resolve(root, 'assets/export/tilesets/black_ram_exterior.png')));
  return (i, c) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const s = ((Math.floor(i / COLS) * T + y) * BR.width + (i % COLS) * T + x) * 4; c.d.set(BR.data.subarray(s, s + 4), (y * T + x) * 4); } };
}
export const BR_SNOW_TOP = 7, BR_SNOW_FILL = 8;

/** Write <tilesetName>.png, the Tiled tileset (.tsj) and the name→index json. Pads to a whole row. */
export function writeTileset(root, tilesetName, { tiles, names, addTile }, jsonOut) {
  while (tiles.length % COLS) addTile('pad' + tiles.length, () => {});
  const rows = Math.ceil(tiles.length / COLS), W = COLS * T, H = rows * T;
  const img = new Uint8Array(W * H * 4);
  tiles.forEach((t, i) => { const ox = (i % COLS) * T, oy = Math.floor(i / COLS) * T; for (let y = 0; y < T; y++) img.set(t.data.subarray(y * T * 4, (y + 1) * T * 4), ((oy + y) * W + ox) * 4); });
  mkdirSync(resolve(root, 'assets/export/tilesets'), { recursive: true });
  writeFileSync(resolve(root, `assets/export/tilesets/${tilesetName}.png`), encodePNG(W, H, img));
  const tsj = {
    type: 'tileset', version: '1.10', tiledversion: '1.11.0', name: tilesetName, tilewidth: T, tileheight: T, columns: COLS,
    tilecount: tiles.length, margin: 0, spacing: 0, image: `../../export/tilesets/${tilesetName}.png`, imagewidth: W, imageheight: H,
    tiles: tiles.map((t, i) => ({ id: i, properties: [{ name: 'name', type: 'string', value: t.name }] })).filter((t) => !t.properties[0].value.startsWith('pad')),
  };
  writeFileSync(resolve(root, `assets/levels/tilesets/${tilesetName}.tsj`), JSON.stringify(tsj, null, 1) + String.fromCharCode(10));
  mkdirSync(resolve(root, 'tools/data'), { recursive: true });
  writeFileSync(resolve(root, jsonOut), JSON.stringify(Object.fromEntries(names), null, 1) + String.fromCharCode(10));
  console.log(`${tilesetName}.png: ${tiles.length} tiles, ${W}×${H}`);
}
