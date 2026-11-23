// Chapter 3 ("What the Snow Keeps", the third day and night) art, in palette colours only (src/data/palette.js).
// Writes, each with an editable Pixelorama source (.pxo, tools/lib/pxo.mjs):
//   assets/export/characters/mercer.png         Gideon Mercer, 26×42 two-frame idle sheet (re-dressed from Finch's build)
//   assets/export/items/inventory/brass_button_inventory.png, gable_note_inventory.png, grey_glove_inventory.png (48×48)
//   assets/export/map/office.png                Silas's map: the constable's office at the west end of Main Street
// The constable's office itself is built from the existing store / hotel interior tiles (tools/make-chapter3-levels.mjs);
// its cell, the bench under canvas and the coffee pot are drawn by props (src/world/props.js), like the parlor's desk.
//
//   node tools/make-chapter3-art.mjs
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

// ---------------- Gideon Mercer: Finch's build, a charcoal greatcoat, an oxblood waistcoat, white whiskers ----------------
function mercer() {
  const im = decodePNG(readFileSync(R('assets/export/characters/finch.png')));
  const pal = Object.entries(PALETTE).map(([n, h]) => [n, rgb(h)]);
  const nearest = (r, g, b) => pal.reduce((best, [n, c]) => { const d = (c[0] - r) ** 2 * 0.3 + (c[1] - g) ** 2 * 0.59 + (c[2] - b) ** 2 * 0.11; return d < best.d ? { n, d } : best; }, { n: 'ink', d: Infinity }).n;
  const map = {
    '#0d1018': 'ink', '#120d09': 'ink', '#1a1410': 'ink',
    '#cfa486': 'paper2', '#9a6f56': 'wood5', '#8f6e5a': 'stone4', '#a9806a': 'linen0', // skin
    '#5a4632': 'slate1', '#3d2f22': 'slate0', '#7a6146': 'slate2', '#3a2f26': 'slate0', '#2a1e16': 'navy3', // greatcoat
    '#241912': 'ink', '#2b2e3a': 'navy2', '#3a3f4c': 'iron2',
    '#4a5048': 'crimsonDark', '#343a34': 'rust', // the waistcoat
    '#c9cfd6': 'slate2', '#878380': 'slate1', '#3a2618': 'wood1', // (Finch's badge: not on Mercer's coat)
  };
  const c = new Canvas(im.width, im.height);
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    const i = (y * im.width + x) * 4;
    if (!im.data[i + 3]) continue;
    const h = '#' + [0, 1, 2].map((k) => im.data[i + k].toString(16).padStart(2, '0')).join('');
    c.p(x, y, map[h] || nearest(im.data[i], im.data[i + 1], im.data[i + 2]));
  }
  // white side-whiskers and a white moustache where the skin meets the hat brim's shadow (both frames)
  for (const f of [0, 26]) {
    for (let y = 0; y < 16; y++) for (let x = f; x < f + 26; x++) {
      const p = c.get(x, y);
      if (!p[3]) continue;
      const isSkin = p[0] === rgb(PALETTE.paper2)[0] && p[1] === rgb(PALETTE.paper2)[1];
      const left = c.get(x - 1, y), right = c.get(x + 1, y);
      if (isSkin && y >= 8 && (!left[3] || !right[3] || left[0] < 40 || right[0] < 40)) c.p(x, y, 'linen3');
    }
  }
  mkdirSync(R(`${SRC}/characters`), { recursive: true });
  save('assets/export/characters/mercer.png', `${SRC}/characters/mercer.pxo`, c, 'mercer');
}

// ---------------- inventory illustrations, 48×48, ink-outlined like the others ----------------
function outline(c) {
  const o = new Canvas(c.w, c.h);
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    if (c.get(x, y)[3]) { o.d.set(c.get(x, y), (y * c.w + x) * 4); continue; }
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => c.get(x + dx, y + dy)[3])) o.p(x, y, 'ink');
  }
  return o;
}
function button() {
  const c = new Canvas(48, 48);
  const cx = 24, cy = 23, r = 13;
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d > r) continue;
    const lit = (x - cx) * -0.6 + (y - cy) * -0.8; // light from the upper left
    c.p(x, y, d > r - 1.5 ? 'brass0' : d > r - 3 ? (lit > 0 ? 'brass2' : 'brass1') : lit > 5 ? 'amberHi' : lit > -3 ? 'brass2' : 'brass1');
  }
  // the five-point star embossed in the face
  const star = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const rr = k % 2 ? 3.2 : 7.5; star.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  const inStar = (x, y) => { let n = false; for (let i = 0, j = star.length - 1; i < star.length; j = i++) { const [xi, yi] = star[i], [xj, yj] = star[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) n = !n; } return n; };
  for (let y = cy - 8; y <= cy + 8; y++) for (let x = cx - 8; x <= cx + 8; x++) if (inStar(x + 0.5, y + 0.5)) c.p(x, y, inStar(x + 1.5, y + 1.5) ? 'brass0' : 'amberHi');
  // torn threads still in the shank, and a dark smear dried on the rim
  for (const [x, y] of [[36, 32], [37, 33], [38, 33], [37, 34], [39, 35], [36, 35]]) c.p(x, y, 'linen1');
  for (const [x, y] of [[14, 30], [15, 31], [15, 30], [16, 32], [17, 32]]) c.p(x, y, 'crimsonDark');
  const o = outline(c);
  save('assets/export/items/inventory/brass_button_inventory.png', `${SRC}/items/brass_button_inventory.pxo`, o, 'brass_button');
}
function note() {
  const c = new Canvas(48, 48);
  // a torn half-sheet, folded once (the fold shaded), lying a little askew
  for (let y = 9; y < 40; y++) for (let x = 7; x < 42; x++) {
    const sx = x + Math.round((y - 9) * -0.08);
    if (sx < 7 || sx > 41) continue;
    const ragged = y === 9 && (x * 7) % 5 < 2;
    if (ragged) continue;
    c.p(sx, y, y >= 24 && y <= 25 ? 'paper2' : y > 25 ? 'paper' : 'linen2');
  }
  // block capitals: short ink strokes in three lines
  const lines = [[11, 13, [4, 3, 3]], [11, 18, [3, 4]], [11, 29, [3, 3]]];
  for (const [x0, y0, words] of lines) {
    let x = x0;
    for (const w of words) { for (let i = 0; i < w; i++) { c.p(x + i * 2, y0, 'paperInk'); c.p(x + i * 2, y0 + 1, 'paperInk'); if (i % 2) c.p(x + i * 2 + 1, y0, 'paperInk'); } x += w * 2 + 3; }
  }
  // five strokes, struck through
  for (let i = 0; i < 4; i++) for (let y = 32; y < 38; y++) c.p(22 + i * 3, y, 'paperInk');
  for (let i = 0; i < 14; i++) c.p(20 + i, 37 - Math.round(i * 0.4), 'paperInk');
  const o = outline(c);
  save('assets/export/items/inventory/gable_note_inventory.png', `${SRC}/items/gable_note_inventory.pxo`, o, 'gable_note');
}
function glove() {
  const c = new Canvas(48, 48);
  const fill = (x, y, col) => c.p(x, y, col);
  // the cuff, the palm, four fingers and a thumb, lying flat: soft grey kid, darker in the creases
  for (let y = 30; y < 41; y++) for (let x = 15; x < 30; x++) fill(x, y, y < 32 ? 'slate6' : x % 4 === 0 ? 'slate5' : 'slate6');
  for (let y = 18; y < 31; y++) for (let x = 14; x < 31; x++) fill(x, y, x > 27 ? 'slate5' : 'slate6');
  const fingers = [[15, 7], [19, 5], [23, 6], [27, 9]];
  for (const [fx, top] of fingers) for (let y = top; y < 19; y++) for (let x = fx; x < fx + 3; x++) fill(x, y, x === fx + 2 ? 'slate5' : 'slate6');
  for (let y = 22; y < 28; y++) for (let x = 31; x < 31 + Math.max(1, 4 - Math.abs(y - 25)); x++) fill(x, y, 'slate5'); // thumb
  for (const [fx, top] of fingers) fill(fx + 1, top, 'slate7');
  // a "C" worked in grey silk on the back of the hand
  for (const [x, y] of [[21, 22], [22, 21], [23, 21], [20, 23], [20, 24], [20, 25], [21, 26], [22, 27], [23, 27]]) fill(x, y, 'slate7');
  // the cuff's two pearl buttons
  fill(18, 35, 'bone'); fill(18, 38, 'bone');
  const o = outline(c);
  save('assets/export/items/inventory/grey_glove_inventory.png', `${SRC}/items/grey_glove_inventory.pxo`, o, 'grey_glove');
}

// ---------------- Silas's map: the office at the west end of Main Street ----------------
function mapOffice() {
  const c = new Canvas(300, 168);
  const x = 146, y = 82; // the west end of the street line
  c.hl(x - 5, x + 5, y, 'paperInk'); c.vl(x - 5, y - 6, y, 'paperInk'); c.vl(x + 5, y - 6, y, 'paperInk');
  for (let i = 0; i <= 6; i++) { c.p(x - 6 + i, y - 6 - Math.round(i * 0.5), 'paperInk'); c.p(x + 6 - i, y - 6 - Math.round(i * 0.5), 'paperInk'); }
  // a small star over the door: the law
  for (const [dx, dy] of [[0, -2], [-1, -1], [0, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]) c.p(x + dx, y - 3 + dy, 'inkRed');
  writeFileSync(R('assets/export/map/office.png'), encodePNG(300, 168, c.d));
  writePxo(R(`${SRC}/map/silas_map_chapter3.pxo`), 300, 168, [{ name: 'office', data: c.d }]);
  console.log('assets/export/map/office.png');
}

mkdirSync(R(`${SRC}/items`), { recursive: true });
mercer();
button();
note();
glove();
mapOffice();
