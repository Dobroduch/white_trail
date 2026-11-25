// Chapter 5 ("The Fall", the fourth night) art, in palette colours only (src/data/palette.js).
// Writes, each with an editable Pixelorama source (.pxo, tools/lib/pxo.mjs):
//   assets/export/characters/clara.png        Clara Mercer, 26×42 two-frame idle sheet (re-dressed from Ada Bell's build):
//                                             a grey hooded riding cloak over a dark oxblood dress
//   assets/export/map/ridge.png               Silas's map: the ridge path, east from the telegraph tower along the top
//   assets/export/map/workings.png            Silas's map: the Pale workings, the mine mouth on the ridge
//   assets/export/map/observatory.png         Silas's map: the observatory cabin, above the workings
//   assets/export/map/path_tower_ridge.png    the way from the tower onto the ridge
// The ridge, the cabin and the workings are built from existing tiles (tools/make-chapter5-levels.mjs); the Pale
// Figure, the telescope, the paymaster's chest, the charge and the fall are props (src/world/props.js).
//
//   node tools/make-chapter5-art.mjs
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

// ---------------- Clara Mercer: Ada's build in a grey hooded cloak ----------------
function clara() {
  const im = decodePNG(readFileSync(R('assets/export/characters/ada.png')));
  const map = {
    '#0b0d14': 'ink',
    '#39466a': 'stone1', '#4d5d7f': 'stone2', // Ada's blue coat: a grey riding cloak
    '#1c2434': 'iron', '#232d3f': 'iron2', '#2b3649': 'stone1', // the skirt and the cloak's shadow side
    '#0f1524': 'wood0', // boots
    '#5b3423': 'crimsonDark', // Ada's scarf and hair: Clara's auburn hair under the hood
    '#a07a3a': 'stone4', '#8a6a2a': 'stone2', // brass buttons: a plain clasp
    '#4e3826': 'stone1', '#634832': 'stone2', '#7a5a3e': 'stone2', // the hair, under the hood
    '#c4b694': 'paper2',
  };
  const c = new Canvas(im.width, im.height);
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    const i = (y * im.width + x) * 4;
    if (!im.data[i + 3]) continue;
    const h = '#' + [0, 1, 2].map((k) => im.data[i + k].toString(16).padStart(2, '0')).join('');
    c.p(x, y, map[h] || 'ink');
  }
  // the hood: a rim of cloth over the crown of the head, one pixel above and around it (both frames)
  for (const f of [0, 26]) {
    let top = -1, l = 99, r = -1;
    for (let y = 0; y < 14 && top < 0; y++) for (let x = f; x < f + 26; x++) if (c.get(x, y)[3]) { top = y; break; }
    if (top < 0) continue;
    for (let x = f; x < f + 26; x++) if (c.get(x, top + 2)[3]) { l = Math.min(l, x); r = Math.max(r, x); }
    for (let x = l; x <= r; x++) { if (top > 0) c.p(x, top - 1, 'ink'); c.p(x, top, x === l || x === r ? 'ink' : 'stone2'); }
    for (let y = top; y < top + 9; y++) { c.p(l - 1, y, 'ink'); c.p(l, y, 'stone1'); c.p(r + 1, y, 'ink'); c.p(r, y, 'stone1'); }
  }
  mkdirSync(R(`${SRC}/characters`), { recursive: true });
  save('assets/export/characters/clara.png', `${SRC}/characters/clara.pxo`, c, 'clara');
}

// ---------------- Silas's map: the ridge, the workings, the cabin (pencil on the parchment, 300×168) ----------------
const dash = (c, pts, col, on = 3, off = 2) => {
  let k = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= n; s++, k++) if (k % (on + off) < on) c.p(Math.round(x0 + (x1 - x0) * s / n), Math.round(y0 + (y1 - y0) * s / n), col);
  }
};
const RIDGE_PTS = [[70, 42], [84, 34], [100, 29], [120, 26], [140, 24], [157, 24]];
function mapPieces() {
  const out = (name, c) => {
    writeFileSync(R(`assets/export/map/${name}.png`), encodePNG(300, 168, c.d));
    console.log(`assets/export/map/${name}.png`);
    return { name, data: c.d };
  };
  const layers = [];
  // the way up from the tower: a short pencil line
  { const c = new Canvas(300, 168); dash(c, [[66, 46], [70, 42]], 'paperInkDim', 2, 2); layers.push(out('path_tower_ridge', c)); }
  // the ridge: the path along the crest, and the crest itself drawn as a jagged line above it
  {
    const c = new Canvas(300, 168);
    dash(c, RIDGE_PTS, 'paperInk');
    const crest = [[78, 30], [86, 25], [92, 27], [102, 21], [110, 23], [120, 17], [128, 20], [138, 15], [146, 18], [154, 13], [162, 16]];
    for (let i = 0; i < crest.length - 1; i++) {
      const [x0, y0] = crest[i], [x1, y1] = crest[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= n; s++) c.p(Math.round(x0 + (x1 - x0) * s / n), Math.round(y0 + (y1 - y0) * s / n), 'paperInkDim');
    }
    // the Pale Figure's pole, a small cross by the path
    c.vl(112, 22, 26, 'paperInk'); c.hl(110, 114, 23, 'paperInk');
    layers.push(out('ridge', c));
  }
  // the workings: a mine mouth (an arch with timbers) at the path's east end, a cart rail running in
  {
    const c = new Canvas(300, 168);
    const x = 165, y = 25;
    c.vl(x - 4, y - 5, y, 'paperInk'); c.vl(x + 4, y - 5, y, 'paperInk'); c.hl(x - 5, x + 5, y - 6, 'paperInk');
    for (let yy = y - 5; yy <= y; yy++) for (let xx = x - 3; xx <= x + 3; xx++) c.p(xx, yy, 'paperInkDim');
    c.hl(x - 7, x + 7, y + 1, 'paperInk');
    for (let i = 0; i < 4; i++) c.p(x - 6 + i * 4, y + 2, 'paperInk'); // rail ties
    layers.push(out('workings', c));
  }
  // the observatory cabin: a little house with a dome, up a short spur above the workings
  {
    const c = new Canvas(300, 168);
    dash(c, [[172, 23], [182, 20], [190, 20]], 'paperInkDim', 2, 2);
    const x = 198, y = 21;
    c.hl(x - 5, x + 5, y, 'paperInk'); c.vl(x - 5, y - 5, y, 'paperInk'); c.vl(x + 5, y - 5, y, 'paperInk'); c.hl(x - 5, x + 5, y - 5, 'paperInk');
    for (let i = -3; i <= 3; i++) c.p(x + i, y - 6 - Math.round(Math.sqrt(9 - i * i) * 0.9), 'paperInk'); // the dome
    c.p(x + 3, y - 10, 'paperInk'); c.p(x + 4, y - 11, 'paperInk'); // the telescope slot
    layers.push(out('observatory', c));
  }
  writePxo(R(`${SRC}/map/silas_map_chapter5.pxo`), 300, 168, layers);
}

clara();
mapPieces();
