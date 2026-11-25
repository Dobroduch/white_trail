// Chapter 4 ("Struck Through", the fourth day) art, in palette colours only (src/data/palette.js).
// Writes, each with an editable Pixelorama source (.pxo, tools/lib/pxo.mjs):
//   assets/export/characters/cutler.png                 Wade Cutler, 26×42 two-frame idle sheet (re-dressed from the conductor)
//   assets/export/items/inventory/tally_book_inventory.png   Cutler's tally book (48×48)
//   assets/export/map/loft.png                          Silas's map: Cutler's loft over the woodshed, east end of Main Street
// Cutler's loft itself is built from the existing store / hotel interior tiles (tools/make-chapter4-levels.mjs).
//
//   node tools/make-chapter4-art.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rgb, Canvas } from './lib/tilekit.mjs';
import { decodePNG, encodePNG } from './lib/png.mjs';
import { writePxo } from './lib/pxo.mjs';
import { PALETTE } from '../src/data/palette.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const R = (p) => resolve(root, p);
const SRC = 'assets/source/pixelorama';
const save = (path, pxo, c, name) => {
  writeFileSync(R(path), encodePNG(c.w, c.h, c.d));
  writePxo(R(pxo), c.w, c.h, [{ name, data: c.d }]);
  console.log(path);
};

// ---------------- Wade Cutler: the conductor's build in a brown canvas coat, a dark hat, a knife at the belt ----------------
function cutler() {
  const im = decodePNG(readFileSync(R('assets/export/characters/conductor.png')));
  const map = {
    '#0d1018': 'ink', '#121722': 'wood0', '#18202f': 'wood1', '#24304a': 'wood3', '#3c4d70': 'wood4', // the coat, in place of the uniform
    '#262a35': 'iron', // trousers
    '#c99a7a': 'paper2', '#9a6f56': 'wood5', '#1a1410': 'ink', // skin, and the shadow under the brim
    '#9a948f': 'wood2', '#c9cfd6': 'wood3', // the conductor's white whiskers: a dark beard, a younger man
    '#c9973f': 'wood1', // the cap badge: the hat band
    '#241912': 'wood0', '#3a2a1e': 'wood2', '#120d09': 'ink', // boots
  };
  const pal = Object.entries(PALETTE).map(([n, h]) => [n, rgb(h)]);
  const nearest = (r, g, b) => pal.reduce((best, [n, c]) => { const d = (c[0] - r) ** 2 * 0.3 + (c[1] - g) ** 2 * 0.59 + (c[2] - b) ** 2 * 0.11; return d < best.d ? { n, d } : best; }, { n: 'ink', d: Infinity }).n;
  const c = new Canvas(im.width, im.height);
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    const i = (y * im.width + x) * 4;
    if (!im.data[i + 3]) continue;
    const h = '#' + [0, 1, 2].map((k) => im.data[i + k].toString(16).padStart(2, '0')).join('');
    c.p(x, y, map[h] || nearest(im.data[i], im.data[i + 1], im.data[i + 2]));
  }
  // per frame: the knife: a pale worn sheath hanging from the belt on his left hip
  for (const f of [0, 26]) {
    // the sheath: find the coat's left edge at belt height and hang it just inside
    let edge = -1;
    for (let x = f; x < f + 26 && edge < 0; x++) { const p = c.get(x, 26); if (p[3] && p[0] > 20) edge = x; }
    if (edge >= 0) {
      for (let y = 24; y < 33; y++) { c.p(edge + 1, y, y === 24 ? 'stone2' : 'linen0'); c.p(edge + 2, y, y < 26 ? 'stone2' : 'paper2'); }
      c.p(edge + 1, 23, 'wood5'); c.p(edge + 2, 23, 'wood5'); // the hilt
      c.p(edge + 1, 33, 'ink'); c.p(edge + 2, 33, 'ink');
    }
  }
  mkdirSync(R(`${SRC}/characters`), { recursive: true });
  save('assets/export/characters/cutler.png', `${SRC}/characters/cutler.pxo`, c, 'cutler');
}

// ---------------- inventory: the tally book, 48×48, ink-outlined like the others ----------------
function outline(c) {
  const o = new Canvas(c.w, c.h);
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    if (c.get(x, y)[3]) { o.d.set(c.get(x, y), (y * c.w + x) * 4); continue; }
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => c.get(x + dx, y + dy)[3])) o.p(x, y, 'ink');
  }
  return o;
}
function tallyBook() {
  const c = new Canvas(48, 48);
  // a small book lying open, a worn brown cover showing at the edges
  for (let y = 10; y < 39; y++) for (let x = 5; x < 43; x++) c.p(x, y, y > 36 || x < 7 || x > 40 ? 'wood3' : 'wood4');
  for (let y = 11; y < 36; y++) for (let x = 8; x < 40; x++) c.p(x, y, x === 23 || x === 24 ? 'paper2' : x < 23 ? 'paper' : 'linen2');
  // block capitals on the left page: short square strokes
  for (const yy of [14, 18, 22]) for (let x = 10; x < 21; x += 2) if ((x * yy) % 7 !== 3) { c.p(x, yy, 'paperInk'); c.p(x, yy + 1, 'paperInk'); }
  // the shares on the right page: five strokes, struck through, row after row; the last row fresh and red-brown
  const rows = [14, 20, 26, 31];
  rows.forEach((yy, k) => {
    const ink = k === rows.length - 1 ? 'inkRed' : 'paperInk';
    c.p(26, yy + 1, ink); c.p(27, yy + 1, ink); // initials
    for (let i = 0; i < 4; i++) for (let y = yy; y < yy + 4; y++) c.p(30 + i * 2, y, ink);
    for (let i = 0; i < 9; i++) c.p(29 + i, yy + 3 - Math.round(i * 0.4), ink);
  });
  const o = outline(c);
  save('assets/export/items/inventory/tally_book_inventory.png', `${SRC}/items/tally_book_inventory.pxo`, o, 'tally_book');
}

// ---------------- Silas's map: the loft over the woodshed, at the east end of Main Street ----------------
function mapLoft() {
  const c = new Canvas(300, 168);
  const x = 194, y = 92; // just below the street line, at its east end
  c.hl(x - 4, x + 4, y, 'paperInk'); c.vl(x - 4, y - 5, y, 'paperInk'); c.vl(x + 4, y - 5, y, 'paperInk');
  c.hl(x - 5, x + 5, y - 5, 'paperInk'); // a flat shed roof
  c.vl(x, y - 4, y - 1, 'paperInkDim'); c.p(x + 1, y - 4, 'paperInkDim'); // a ladder up to the loft
  // five strokes struck through, small, by the shed: Cutler's count
  for (let i = 0; i < 4; i++) c.vl(x + 7 + i * 2, y - 4, y - 1, 'inkRed');
  for (let i = 0; i < 8; i++) c.p(x + 6 + i, y - 1 - Math.round(i * 0.4), 'inkRed');
  writeFileSync(R('assets/export/map/loft.png'), encodePNG(300, 168, c.d));
  writePxo(R(`${SRC}/map/silas_map_chapter4.pxo`), 300, 168, [{ name: 'loft', data: c.d }]);
  console.log('assets/export/map/loft.png');
}

mkdirSync(R(`${SRC}/items`), { recursive: true });
cutler();
tallyBook();
mapLoft();
