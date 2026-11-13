// Chapter 2 ("Deceit and Isolation", the second day) art, painted in palette colours only (src/data/palette.js), at the
// game's native density (1 px = 1 px at 480×270). Writes, each with an editable Pixelorama source (.pxo, tools/lib/pxo.mjs):
//   assets/export/environments/parallax/town_sky_day.png   overcast storm daylight, the evening sky's clouds re-lit
//   assets/export/tilesets/store_interior.png (+ .tsj, tools/data/store_tiles.json)     Rusk's general store, inside
//   assets/export/tilesets/hillside_exterior.png (+ .tsj, tools/data/hillside_tiles.json) chapel, graveyard, telegraph tower
//   assets/export/characters/rusk.png, vale.png, ada.png   26×42 two-frame idle sheets
//   assets/export/map/chapel.png, tower.png, path_village_chapel.png, path_chapel_tower.png   Silas's map pieces (300×168)
// The three people are re-dressed from existing sheets (conductor → Rusk, Finch → Reverend Vale, Mrs. Gable → Ada Bell) by an
// explicit colour map, so they keep the cast's proportions and animation but land 100% on the palette.
//
// TILE ORDER IS FIXED once the tilesets are in use: add new tiles at the END of each build function.
//
//   node tools/make-chapter2-art.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, hash, rgb, Canvas, registry, writeTileset } from './lib/tilekit.mjs';
import { decodePNG, encodePNG } from './lib/png.mjs';
import { writePxo } from './lib/pxo.mjs';
import { PALETTE } from '../src/data/palette.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const R = (p) => resolve(root, p);
const SRC = 'assets/source/pixelorama';

// ---------------- a 3×5 pixel font for stencils and lettering ----------------
const FONT = {
  A: '010101111101101', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011',
  I: '111010010010111', L: '100100100100111', N: '101111111111101', O: '010101101101010', P: '110101110100100', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', W: '101101111111101', K: '101101110101101', '.': '000000000000010', ' ': '000000000000000',
};
function letters(c, str, x, y, col) {
  let cx = x;
  for (const ch of str) { const g = FONT[ch] || FONT[' ']; for (let i = 0; i < 15; i++) if (g[i] === '1') c.p(cx + (i % 3), y + Math.floor(i / 3), col); cx += 4; }
}

// ---------------- 1. the day sky ----------------
function daySky() {
  const ev = decodePNG(readFileSync(R('assets/export/environments/parallax/town_sky_evening.png')));
  const lum = (i) => ev.data[i] * 0.3 + ev.data[i + 1] * 0.59 + ev.data[i + 2] * 0.11;
  const uniq = [...new Set(Array.from({ length: ev.width * ev.height }, (_, k) => lum(k * 4)).map((v) => Math.round(v)))].sort((a, b) => a - b);
  // dark → light: a low grey overcast, brighter toward the horizon, cloud edges catching thin light
  const ramp = ['snow0', 'slate5', 'snow1', 'snow1', 'haze2', 'snow2', 'snow3'];
  const out = new Canvas(ev.width, ev.height);
  for (let y = 0; y < ev.height; y++) for (let x = 0; x < ev.width; x++) {
    const i = (y * ev.width + x) * 4;
    if (!ev.data[i + 3]) continue;
    const q = uniq.indexOf(Math.round(lum(i))) / Math.max(1, uniq.length - 1);
    const lift = Math.min(1, q * 0.75 + (y / ev.height) * 0.35); // the storm thins toward the horizon
    out.p(x, y, ramp[Math.min(ramp.length - 1, Math.floor(lift * ramp.length))]);
  }
  return out;
}

// ---------------- shared painters ----------------
function planks(c, x0, y0, w, h, seed, { vertical = true, base = 'wood2', dark = 'wood1', hi = 'wood3', every = 8 } = {}) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = vertical ? x : y, v = vertical ? y : x;
    const seam = (u + x0 * 0) % every === 0;
    let col = seam ? dark : (u % every === 1 ? hi : base);
    if (!seam && hash(Math.floor(u / every), Math.floor(v / 23), seed) > 0.7) col = col === base ? 'wood3' : col;
    if (!seam && hash(x, y, seed + 9) > 0.965) col = dark; // knots and grain
    c.p(x0 + x, y0 + y, col);
  }
}
function snowCap(c, x0, x1, y, seed, depth = 3) {
  for (let x = x0; x <= x1; x++) { const d = Math.max(1, Math.round(depth - 1 + hash(x, 1, seed) * 2)); for (let k = 0; k < d; k++) c.p(x, y - k, k === d - 1 ? 'snow4' : 'snow3'); }
}

// ---------------- 2. store interior ----------------
function buildStore() {
  const reg = registry();
  const { addTile, addBlock } = reg;
  addTile('wall_a', (c) => planks(c, 0, 0, T, T, 1));
  addTile('wall_b', (c) => planks(c, 0, 0, T, T, 2));
  addTile('wall_shadow', (c) => { planks(c, 0, 0, T, T, 3, { base: 'wood1', dark: 'wood0', hi: 'wood2' }); });
  addTile('wall_top', (c) => { planks(c, 0, 0, T, T, 4, { base: 'wood1', dark: 'wood0', hi: 'wood2' }); c.r(0, 0, T, 4, 'wood0'); c.hl(0, 15, 4, 'ink'); });
  addTile('ceiling', (c) => { c.r(0, 0, T, T, 'wood0'); for (let y = 2; y < T; y += 5) c.hl(0, 15, y, 'ink'); for (let x = 0; x < T; x++) if (hash(x, 2, 5) > 0.85) c.p(x, 3, 'wood1'); });
  addTile('ceiling_beam', (c) => { c.r(0, 0, T, T, 'wood0'); c.r(0, 6, T, 8, 'wood2'); c.hl(0, 15, 6, 'wood3'); c.hl(0, 15, 13, 'ink'); });
  addTile('skirting', (c) => { planks(c, 0, 0, T, 10, 6); c.r(0, 10, T, 6, 'wood1'); c.hl(0, 15, 10, 'wood3'); c.hl(0, 15, 15, 'ink'); });
  // the back shelving: four shelves of goods (96×96)
  addBlock('shelves', 6, 6, (c) => {
    c.r(0, 0, 96, 96, 'wood1');
    for (let x = 0; x < 96; x += 4) c.vl(x, 0, 95, 'wood0');
    c.r(0, 0, 3, 96, 'wood3'); c.r(93, 0, 3, 96, 'wood3'); c.vl(2, 0, 95, 'wood4'); c.vl(95, 0, 95, 'ink');
    const shelfY = [22, 46, 70, 94];
    for (const sy of shelfY) { c.r(0, sy - 1, 96, 3, 'wood4'); c.hl(0, 95, sy - 1, 'wood5'); c.hl(0, 95, sy + 2, 'ink'); }
    // row 1: tins with brass labels
    for (let i = 0; i < 11; i++) { const x = 5 + i * 8; c.r(x, 11, 6, 10, i % 3 ? 'iron2' : 'stone3'); c.r(x, 14, 6, 3, i % 2 ? 'brass1' : 'crimsonDark'); c.hl(x, x + 5, 11, 'slate4'); }
    // row 2: stoneware and glass jars
    for (let i = 0; i < 8; i++) { const x = 5 + i * 11; c.r(x + 1, 33, 7, 12, i % 2 ? 'haze1' : 'stone4'); c.r(x + 2, 31, 5, 2, 'iron2'); c.vl(x + 2, 34, 43, i % 2 ? 'haze2' : 'linen0'); }
    // row 3: bolts of cloth and blankets
    const cloth = ['crimsonDark', 'haze0', 'linen1', 'slate2', 'rust', 'linen0'];
    for (let i = 0; i < 6; i++) { const x = 4 + i * 15; c.r(x, 54, 13, 15, cloth[i]); c.hl(x, x + 12, 54, 'ink'); for (let y = 57; y < 69; y += 3) c.hl(x + 1, x + 11, y, i === 2 || i === 5 ? 'linen0' : 'ink'); }
    // row 4: lamp chimneys, wicks, boxes of cartridges, candles
    for (let i = 0; i < 5; i++) { const x = 5 + i * 8; c.r(x + 1, 82, 4, 11, 'snow2'); c.r(x, 86, 6, 4, 'snow3'); c.p(x + 2, 83, 'bone'); }
    for (let i = 0; i < 4; i++) { const x = 48 + i * 11; c.r(x, 84, 9, 9, 'paper2'); c.hl(x, x + 8, 84, 'paperInkDim'); c.r(x + 2, 87, 5, 2, 'crimson'); }
  });
  // the counter: plank front, worn top; the account book open on it, a brass scale (112×48, top row is what stands on it)
  addBlock('counter', 7, 3, (c) => {
    c.r(0, 18, 112, 30, 'wood2');
    for (let x = 0; x < 112; x += 16) { c.r(x + 2, 24, 12, 20, 'wood1'); c.hl(x + 2, x + 13, 24, 'wood0'); c.vl(x + 2, 24, 43, 'wood0'); c.hl(x + 2, x + 13, 43, 'wood3'); }
    c.r(0, 15, 112, 4, 'wood4'); c.hl(0, 111, 15, 'wood5'); c.hl(0, 111, 19, 'ink'); c.hl(0, 111, 47, 'ink');
    for (let x = 30; x < 70; x++) if (hash(x, 1, 7) > 0.5) c.p(x, 16, 'wood5'); // worn bright where goods are slid across
    // the account book: open, ruled, a red column, one line scraped pale (14 px from its left)
    c.r(8, 9, 34, 6, 'paper'); c.r(8, 14, 34, 1, 'paper2'); c.vl(25, 9, 14, 'paperRule');
    for (let y = 10; y < 14; y++) { c.hl(10, 22, y, y % 2 ? 'paperRule' : 'paper'); c.hl(27, 39, y, y % 2 ? 'paperRule' : 'paper'); }
    c.vl(20, 10, 13, 'inkRed'); c.vl(36, 10, 13, 'inkRed');
    c.hl(27, 33, 11, 'linen3'); c.hl(27, 33, 12, 'linen2'); // the scraped entry
    for (const x of [11, 14, 17, 28, 31, 34]) c.p(x, 10, 'paperInk');
    c.r(6, 13, 2, 2, 'wood0'); c.r(42, 13, 2, 2, 'wood0');
    // brass scale
    c.r(74, 13, 14, 2, 'brass1'); c.vl(80, 4, 12, 'brass0'); c.hl(72, 88, 4, 'brass2'); c.r(70, 6, 6, 2, 'brass1'); c.r(84, 7, 6, 2, 'brass1');
    // a glass jar of horehound
    c.r(96, 5, 8, 10, 'haze1'); c.r(97, 7, 6, 7, 'rust'); c.r(96, 3, 8, 2, 'iron2'); c.vl(97, 6, 13, 'haze2');
  });
  // the pot-bellied stove with its pipe (32×64) and the pipe on its own
  addBlock('stove', 2, 4, (c) => {
    c.r(6, 0, 6, 26, 'iron'); c.vl(7, 0, 25, 'iron2'); c.vl(11, 0, 25, 'ink'); // the pipe lines up with the `pipe` tile above
    c.r(7, 24, 18, 4, 'iron2'); c.hl(6, 25, 24, 'stone3');
    for (let y = 28; y < 52; y++) { const half = Math.round(8 + Math.sin(((y - 28) / 24) * Math.PI) * 4); c.hl(16 - half, 15 + half, y, 'iron'); c.p(16 - half, y, 'ink'); c.p(15 + half, y, 'ink'); c.p(17 - half, y, 'iron2'); }
    c.r(11, 36, 10, 7, 'ink'); c.r(12, 37, 8, 5, 'ember'); c.r(13, 38, 6, 3, 'kerosene'); c.hl(14, 17, 39, 'amber'); // the firebox window
    c.r(8, 52, 16, 3, 'iron2'); for (const x of [8, 22]) c.r(x, 55, 2, 9, 'iron'); c.hl(4, 27, 63, 'ink');
  });
  addTile('pipe', (c) => { c.r(6, 0, 6, T, 'iron'); c.vl(7, 0, 15, 'iron2'); c.vl(11, 0, 15, 'ink'); });
  // two oil barrels, stencilled (48×32)
  addBlock('barrels', 3, 2, (c) => {
    for (const bx of [2, 25]) {
      for (let y = 3; y < 32; y++) { const bulge = Math.round(Math.sin(((y - 3) / 29) * Math.PI) * 2); c.hl(bx - bulge, bx + 19 + bulge, y, 'wood3'); c.p(bx - bulge, y, 'wood1'); c.p(bx + 19 + bulge, y, 'wood1'); }
      for (const hy of [6, 17, 28]) c.hl(bx - 1, bx + 20, hy, 'iron2');
      c.r(bx, 1, 20, 3, 'wood2'); c.hl(bx, bx + 19, 1, 'wood4');
      letters(c, 'OIL', bx + 4, 10, 'ink');
    }
  });
  addBlock('sacks', 2, 2, (c) => {
    for (const [sx, sy, col] of [[1, 10, 'linen0'], [14, 12, 'paper2'], [7, 1, 'linen1']]) {
      for (let y = 0; y < 18; y++) { const w = Math.round(13 - Math.abs(y - 9) * 0.4); c.hl(sx + (13 - w) / 2, sx + (13 - w) / 2 + w, sy + y, col); }
      c.hl(sx + 3, sx + 9, sy, 'stone4'); c.p(sx + 6, sy + 1, 'stone4');
    }
    letters(c, 'F', 18, 20, 'paperInkDim');
  });
  addBlock('crates', 2, 2, (c) => {
    for (const [x, y, w, h] of [[0, 14, 30, 18], [4, 0, 24, 14]]) {
      c.r(x, y, w, h, 'wood3'); c.hl(x, x + w - 1, y, 'wood5'); c.vl(x, y, y + h - 1, 'wood4'); c.vl(x + w - 1, y, y + h - 1, 'wood1'); c.hl(x, x + w - 1, y + h - 1, 'wood1');
      c.line(x + 1, y + 1, x + w - 2, y + h - 2, 'wood2');
    }
  });
  // the long crate in the back: lid propped, packing sawdust, empty; stencil on the lid (48×32)
  addBlock('powder_crate', 3, 2, (c) => {
    c.r(2, 14, 44, 18, 'wood3'); c.hl(2, 45, 14, 'wood5'); c.hl(2, 45, 31, 'wood1'); c.vl(2, 14, 31, 'wood4'); c.vl(45, 14, 31, 'wood1');
    for (const x of [14, 30]) c.vl(x, 15, 30, 'wood2');
    c.r(4, 15, 40, 3, 'paper2'); for (let x = 4; x < 44; x++) if (hash(x, 1, 21) > 0.6) c.p(x, 14, 'linen0'); // sawdust, no sticks
    // the lid, leaned against the wall behind
    c.r(6, 1, 38, 12, 'wood4'); c.hl(6, 43, 1, 'wood5'); c.hl(6, 43, 12, 'wood1');
    letters(c, 'GIANT', 9, 3, 'paperInk'); letters(c, 'POWDER', 9, 8, 'paperInk');
  });
  // the street window, daylight and snow beyond (48×48)
  addBlock('window', 3, 3, (c) => {
    c.r(0, 0, 48, 48, 'wood1'); c.r(3, 3, 42, 40, 'snow2');
    for (let y = 3; y < 43; y++) for (let x = 3; x < 45; x++) { if (y < 16) c.p(x, y, 'haze2'); if (hash(x, y, 31) > 0.93) c.p(x, y, 'bone'); }
    c.r(3, 30, 42, 13, 'snow3'); c.hl(3, 44, 30, 'snow4');
    c.vl(23, 3, 42, 'wood2'); c.vl(24, 3, 42, 'wood1'); c.hl(3, 44, 22, 'wood2');
    c.r(0, 43, 48, 5, 'wood4'); c.hl(0, 47, 43, 'wood5'); c.hl(0, 47, 47, 'ink');
    for (let x = 4; x < 44; x++) if (hash(x, 4, 33) > 0.55) c.p(x, 42, 'snow4');
  });
  addBlock('door', 2, 3, (c) => {
    c.r(0, 0, 32, 48, 'wood1'); c.r(3, 3, 26, 45, 'wood2');
    c.r(6, 6, 20, 16, 'haze2'); c.vl(16, 6, 21, 'wood1'); for (let y = 6; y < 22; y++) for (let x = 6; x < 26; x++) if (hash(x, y, 35) > 0.9) c.p(x, y, 'snow3');
    c.r(6, 26, 20, 18, 'wood3'); c.hl(6, 25, 26, 'wood4'); c.r(24, 30, 2, 3, 'brass1');
    c.p(23, 2, 'brass2'); c.r(21, 0, 5, 2, 'brass1'); // the shop bell
  });
  // the boot rack: miners' boots and gum boots, no riding boots (48×32)
  addBlock('boot_rack', 3, 2, (c) => {
    c.r(0, 20, 48, 2, 'wood4'); c.r(0, 30, 48, 2, 'wood3'); c.vl(0, 18, 31, 'wood1'); c.vl(47, 18, 31, 'wood1');
    for (let i = 0; i < 5; i++) {
      const x = 3 + i * 9, tall = i % 2 === 0;
      c.r(x, tall ? 6 : 12, 5, tall ? 14 : 8, i === 4 ? 'iron' : 'wood1'); c.r(x, 16, 8, 4, i === 4 ? 'iron' : 'wood1'); c.hl(x, x + 7, 19, 'ink');
      c.vl(x, tall ? 6 : 12, 19, i === 4 ? 'iron2' : 'wood2');
    }
    for (let i = 0; i < 4; i++) { const x = 5 + i * 11; c.r(x, 24, 8, 6, 'stone0'); c.r(x + 1, 22, 3, 3, 'stone0'); } // overshoes below
  });
  addBlock('lamp', 1, 2, (c) => {
    c.vl(8, 0, 12, 'iron2');
    c.r(4, 13, 9, 3, 'brass1'); c.r(5, 16, 7, 8, 'haze2'); c.vl(6, 17, 23, 'bone'); c.r(4, 24, 9, 3, 'brass1'); c.hl(3, 13, 27, 'brass0'); c.r(7, 20, 3, 3, 'linen1');
  });
  addTile('floor_shadow', (c) => { c.r(0, 0, T, T, 'wood0'); for (let y = 0; y < T; y += 4) c.hl(0, 15, y, 'ink'); });
  writeTileset(root, 'store_interior', reg, 'tools/data/store_tiles.json');
  return reg;
}

// ---------------- 3. hillside: chapel, graveyard, telegraph tower ----------------
function buildHillside() {
  const reg = registry();
  const { addTile, addBlock } = reg;
  // the chapel front: whitewashed clapboard gone grey, a snow-loaded gable, bell cote, arched door, round window (128×160)
  addBlock('chapel', 8, 10, (c) => {
    const L = 16, Rt = 111, eave = 62, peak = 26, base = 159;
    // walls
    for (let y = eave; y <= base; y++) for (let x = L; x <= Rt; x++) { const course = (y - eave) % 6; c.p(x, y, course === 0 ? 'stone4' : course === 1 ? 'linen1' : hash(x, y, 41) > 0.92 ? 'linen1' : 'linen0'); }
    for (let y = eave; y <= base; y++) { c.p(L, y, 'stone2'); c.p(Rt, y, 'stone1'); c.p(Rt - 1, y, 'stone4'); }
    // gable wall between eave and roof line
    for (let y = peak + 6; y < eave; y++) { const half = Math.round(((y - peak - 6) / (eave - peak - 6)) * 46); for (let x = 64 - half; x <= 63 + half; x++) { const course = (y - eave + 60) % 6; c.p(x, y, course === 0 ? 'stone4' : 'linen0'); } }
    // roof: two raking boards with snow on the slopes
    for (let i = 0; i <= 58; i++) {
      const y = peak + Math.round(i * 0.62);
      for (const x of [64 - i, 63 + i]) { c.p(x, y, 'wood1'); c.p(x, y + 1, 'wood2'); c.p(x, y + 2, 'wood0'); c.p(x, y - 1, 'snow3'); c.p(x, y - 2, i % 3 ? 'snow4' : 'snow3'); if (hash(x, 2, 43) > 0.55) c.p(x, y - 3, 'snow4'); }
    }
    // bell cote on the ridge, the bell hanging in it
    c.r(56, 6, 16, 22, 'linen0'); c.r(59, 10, 10, 13, 'navy3'); c.hl(54, 73, 5, 'wood1'); c.hl(55, 72, 4, 'wood2'); snowCap(c, 54, 73, 3, 44, 3);
    for (let i = 0; i < 9; i++) c.hl(64 - Math.round(i * 0.9), 63 + Math.round(i * 0.9), i - 6 + 4, i < 2 ? 'snow4' : 'wood1');
    c.r(61, 13, 6, 6, 'brass1'); c.r(60, 18, 8, 2, 'brass2'); c.vl(64, 11, 12, 'iron2'); c.p(63, 14, 'brass2');
    // round window
    c.disc(64, 46, 7, 'wood1'); c.disc(64, 46, 5, 'navy3'); c.line(59, 46, 69, 46, 'wood2'); c.line(64, 41, 64, 51, 'wood2');
    // door: arched, two leaves, iron strap hinges; steps
    for (let y = 104; y < 150; y++) { const half = y < 114 ? Math.round(Math.sqrt(Math.max(0, 121 - (114 - y) * (114 - y)))) : 11; c.hl(64 - half, 63 + half, y, y < 106 ? 'wood0' : 'wood1'); }
    c.vl(64, 106, 149, 'wood0'); for (const hy of [118, 136]) { c.hl(54, 61, hy, 'iron2'); c.hl(66, 73, hy, 'iron2'); }
    c.p(61, 128, 'brass1'); c.p(66, 128, 'brass1');
    c.r(48, 150, 32, 4, 'stone2'); c.hl(48, 79, 150, 'snow3'); c.r(44, 154, 40, 6, 'stone1'); c.hl(44, 83, 154, 'snow3');
    // narrow side windows, dark
    for (const wx of [30, 90]) { c.r(wx, 84, 8, 22, 'wood1'); c.r(wx + 1, 86, 6, 19, 'navy3'); c.hl(wx + 1, wx + 6, 95, 'wood1'); c.hl(wx - 1, wx + 8, 106, 'snow3'); }
    // snow banked against the base
    for (let x = L - 4; x <= Rt + 4; x++) { if (x > 44 && x < 84) continue; const h = Math.round(3 + hash(x, 7, 45) * 4); for (let k = 0; k < h; k++) c.p(x, base - k, k === h - 1 ? 'snow4' : 'snow3'); }
  });
  const headstone = (c, x, w, top, shape, seed) => {
    for (let y = top; y < 31; y++) for (let xx = x; xx < x + w; xx++) {
      if (shape === 'round' && y < top + 4 && Math.hypot(xx - (x + w / 2 - 0.5), (top + 4) - y) > w / 2) continue;
      c.p(xx, y, xx === x ? 'stone4' : xx === x + w - 1 ? 'stone0' : hash(xx, y, seed) > 0.9 ? 'stone2' : 'stone3');
    }
    for (let k = 0; k < 3; k++) c.hl(x + 2, x + w - 3, top + 7 + k * 3, 'stone1'); // weathered lettering
    snowCap(c, x, x + w - 1, top + 1, seed + 1, 2);
    c.hl(x - 2, x + w + 1, 31, 'snow3');
  };
  addBlock('stone_round', 1, 2, (c) => headstone(c, 3, 10, 9, 'round', 51));
  addBlock('stone_tall', 1, 2, (c) => headstone(c, 4, 8, 4, 'flat', 52));
  addBlock('stone_lean', 1, 2, (c) => { headstone(c, 3, 9, 13, 'round', 53); for (let y = 13; y < 18; y++) c.p(12, y, 'stone0'); });
  addBlock('cross_wood', 1, 2, (c) => { c.r(7, 6, 3, 25, 'wood2'); c.vl(7, 6, 30, 'wood3'); c.r(3, 11, 11, 3, 'wood2'); c.hl(3, 13, 11, 'wood3'); snowCap(c, 3, 13, 10, 54, 2); snowCap(c, 7, 9, 5, 55, 2); c.hl(4, 12, 31, 'snow3'); });
  // Amos Pell's stone, bigger, the lettering legible up close (32×32)
  addBlock('pell_stone', 2, 2, (c) => {
    for (let y = 4; y < 31; y++) for (let x = 4; x < 28; x++) { if (y < 9 && Math.hypot(x - 15.5, 9 - y) > 12) continue; c.p(x, y, x === 4 ? 'stone4' : x === 27 ? 'stone0' : hash(x, y, 56) > 0.9 ? 'stone2' : 'stone3'); }
    letters(c, 'PELL', 8, 12, 'stone0'); c.hl(8, 23, 19, 'stone1'); c.hl(9, 22, 22, 'stone1'); c.hl(11, 20, 25, 'stone1');
    snowCap(c, 6, 25, 6, 57, 3); c.hl(1, 30, 31, 'snow3');
  });
  // the disturbed grave, closed: snow scraped off, frozen clods thrown back, raw earth (64×16)
  addBlock('grave_closed', 4, 1, (c) => {
    for (let x = 4; x < 60; x++) { const h = Math.round(5 - Math.abs(x - 32) / 9); for (let y = 0; y < h; y++) c.p(x, 15 - y, y === h - 1 ? 'stone1' : 'wood0'); }
    for (let i = 0; i < 26; i++) { const x = 2 + Math.floor(hash(i, 1, 58) * 60), y = 9 + Math.floor(hash(i, 2, 58) * 6); c.r(x, y, 2, 2, hash(i, 3, 58) > 0.5 ? 'stone0' : 'wood1'); c.p(x, y, 'snow2'); }
    for (const x of [0, 1, 62, 63]) for (let y = 10; y < 16; y++) c.p(x, y, 'snow3');
  });
  // the same grave opened: boards pulled aside; in the hole, a crate of paper-wrapped sticks, a coil of fuse, a tin of caps,
  // all wrapped in a rotted grey cavalry jacket stiff with old blood (64×32)
  addBlock('grave_open', 4, 2, (c) => {
    c.r(6, 14, 52, 18, 'ink'); c.hl(6, 57, 14, 'wood0'); c.vl(6, 14, 31, 'wood0'); c.vl(57, 14, 31, 'wood0');
    c.r(0, 26, 7, 6, 'stone0'); c.r(57, 25, 7, 7, 'stone0'); c.hl(0, 6, 26, 'snow2'); c.hl(57, 63, 25, 'snow2');
    // boards leaned out of the hole
    c.line(2, 30, 14, 4, 'wood3'); c.line(3, 30, 15, 4, 'wood2'); c.line(4, 30, 16, 4, 'wood1');
    // the jacket: grey wool, a yellow-edged cuff, brown-black stains
    c.r(10, 18, 44, 13, 'slate4'); for (let x = 10; x < 54; x++) if (hash(x, 1, 59) > 0.6) c.p(x, 18, 'slate5');
    c.r(12, 22, 9, 6, 'crimsonDark'); c.r(40, 24, 6, 5, 'crimsonDark'); c.hl(48, 53, 21, 'brass1');
    // the crate inside it, the sticks: new paper wrappers, a printed band
    c.r(20, 16, 22, 10, 'wood3'); c.hl(20, 41, 16, 'wood5');
    for (let i = 0; i < 5; i++) { const y = 17 + i * 2; c.hl(21, 40, y, 'paper'); c.p(21, y, 'paper2'); c.p(30, y, 'crimson'); }
    // coil of fuse and the caps tin
    c.ring(48, 18, 3, 'stone4'); c.ring(48, 18, 2, 'iron2'); c.r(13, 15, 5, 4, 'iron2'); c.hl(13, 17, 15, 'brass2');
  });
  addTile('rail', (c) => { c.hl(0, 15, 4, 'iron'); c.hl(0, 15, 13, 'iron'); for (const x of [1, 6, 11]) { c.vl(x, 2, 15, 'iron'); c.p(x, 1, 'iron2'); c.p(x, 0, 'iron'); } for (let x = 0; x < T; x++) if (hash(x, 1, 60) > 0.6) c.p(x, 3, 'snow3'); });
  addTile('rail_post', (c) => { c.r(6, 0, 4, T, 'iron'); c.vl(6, 0, 15, 'iron2'); c.r(5, 0, 6, 2, 'iron2'); c.hl(0, 15, 4, 'iron'); c.hl(0, 15, 13, 'iron'); snowCap(c, 5, 10, 0, 61, 1); });
  // the telegraph tower on the shoulder of the ridge: splayed timber legs, X braces, a ladder, the platform and the
  // cross-arm with its glass insulators (80×176). Wires leave it on both sides at y 13.
  addBlock('tower', 5, 11, (c) => {
    const top = 34, foot = 175;
    for (let y = top; y <= foot; y++) {
      const k = (y - top) / (foot - top), lx = Math.round(30 - k * 22), rx = Math.round(49 + k * 22);
      c.p(lx, y, 'wood1'); c.p(lx + 1, y, 'wood3'); c.p(lx + 2, y, 'wood2');
      c.p(rx, y, 'wood2'); c.p(rx + 1, y, 'wood1'); c.p(rx + 2, y, 'wood0');
    }
    for (const [y0, y1] of [[40, 76], [76, 116], [116, 160]]) {
      const lxa = Math.round(30 - ((y0 - top) / (foot - top)) * 22) + 2, rxa = Math.round(49 + ((y0 - top) / (foot - top)) * 22);
      const lxb = Math.round(30 - ((y1 - top) / (foot - top)) * 22) + 2, rxb = Math.round(49 + ((y1 - top) / (foot - top)) * 22);
      c.line(lxa, y0, rxb, y1, 'wood1'); c.line(rxa, y0, lxb, y1, 'wood2'); c.hl(lxb, rxb, y1, 'wood2'); c.hl(lxb, rxb, y1 + 1, 'wood0');
    }
    for (let y = top + 4; y <= foot; y += 6) c.hl(37, 43, y, 'wood3'); c.vl(36, top + 2, foot, 'wood1'); c.vl(44, top + 2, foot, 'wood1'); // ladder
    // platform and railing
    c.r(22, top - 2, 37, 4, 'wood2'); c.hl(22, 58, top - 2, 'wood4'); c.hl(22, 58, top + 1, 'ink'); snowCap(c, 22, 58, top - 3, 62, 2);
    c.hl(22, 58, top - 11, 'wood3'); for (const x of [22, 34, 46, 58]) c.vl(x, top - 11, top - 2, 'wood1');
    // the mast and cross-arm, insulators
    c.r(39, 4, 3, top - 8, 'wood2'); c.vl(39, 4, top - 5, 'wood3'); c.r(18, 10, 45, 3, 'wood2'); c.hl(18, 62, 10, 'wood4'); snowCap(c, 18, 62, 9, 63, 1);
    for (const x of [21, 29, 51, 59]) { c.r(x, 6, 3, 4, 'haze2'); c.p(x + 1, 5, 'bone'); }
  });
  // the cut wire: one line hanging from the cross-arm, the end bent back to look torn (32×48)
  addBlock('wire_cut', 2, 3, (c) => { for (let y = 0; y < 40; y++) c.p(Math.round(6 + Math.sin(y / 9) * 2 + y * 0.12), y, 'iron2'); c.line(11, 40, 8, 44, 'iron2'); c.p(8, 45, 'slate6'); c.p(12, 40, 'slate6'); });
  // a lantern hook on the platform rail, the timber above it blacked with soot (16×16)
  addTile('soot_hook', (c) => { c.r(3, 0, 10, 7, 'wood0'); for (let x = 2; x < 14; x++) if (hash(x, 1, 64) > 0.4) c.p(x, 7, 'ink'); c.vl(8, 6, 11, 'iron2'); c.p(9, 11, 'iron2'); c.p(9, 12, 'iron2'); });
  addTile('wire_span', (c) => { for (let x = 0; x < T; x++) { c.p(x, 3, 'iron2'); c.p(x, 9, 'iron'); } });
  addBlock('rock_big', 3, 2, (c) => {
    for (let x = 0; x < 48; x++) { const h = Math.round(18 + Math.sin(x / 7) * 6 + hash(x, 1, 65) * 4 - Math.abs(x - 24) * 0.35); for (let y = 0; y < h; y++) c.p(x, 31 - y, y === h - 1 ? 'snow3' : y > h - 4 ? 'snow2' : (x + y) % 7 === 0 ? 'stone2' : x < 20 ? 'stone1' : 'stone0'); }
  });
  addBlock('rock_small', 2, 1, (c) => { for (let x = 2; x < 30; x++) { const h = Math.round(9 - Math.abs(x - 16) * 0.5 + hash(x, 1, 66) * 2); for (let y = 0; y < h; y++) c.p(x, 15 - y, y === h - 1 ? 'snow3' : x < 14 ? 'stone1' : 'stone0'); } });
  addTile('path_stones', (c) => { for (const [x, w] of [[1, 5], [8, 6]]) { c.r(x, 1, w, 2, 'stone2'); c.hl(x, x + w - 1, 1, 'snow3'); } });
  writeTileset(root, 'hillside_exterior', reg, 'tools/data/hillside_tiles.json');
  return reg;
}

// ---------------- 4. people: re-dressed sheets, colour-mapped onto the palette ----------------
function recolour(srcName, outName, map, edit) {
  const im = decodePNG(readFileSync(R(`assets/export/characters/${srcName}.png`)));
  const pal = Object.entries(PALETTE).map(([n, h]) => [n, rgb(h)]);
  const nearest = (r, g, b) => pal.reduce((best, [n, c]) => { const d = (c[0] - r) ** 2 * 0.3 + (c[1] - g) ** 2 * 0.59 + (c[2] - b) ** 2 * 0.11; return d < best.d ? { n, d } : best; }, { n: 'ink', d: Infinity }).n;
  const c = new Canvas(im.width, im.height);
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    const i = (y * im.width + x) * 4;
    if (!im.data[i + 3]) continue;
    const hex = '#' + [0, 1, 2].map((k) => im.data[i + k].toString(16).padStart(2, '0')).join('');
    c.p(x, y, map[hex] || nearest(im.data[i], im.data[i + 1], im.data[i + 2]));
  }
  if (edit) edit(c, im);
  writeFileSync(R(`assets/export/characters/${outName}.png`), encodePNG(c.w, c.h, c.d));
  writePxo(R(`${SRC}/characters/${outName}.pxo`), c.w, c.h, [{ name: outName, data: c.d }]);
  return c;
}
function buildPeople() {
  const skin = { '#cfa486': 'paper2', '#c99a7a': 'paper2', '#d0a68a': 'paper2', '#9a6f56': 'wood5', '#8f6e5a': 'stone4', '#a9806a': 'linen0' };
  const ink = { '#0d1018': 'ink', '#120d09': 'ink', '#1a1410': 'ink' };
  // Jonah Rusk, storekeeper: the conductor's build, a brown store coat, cloth cap, grey whiskers
  recolour('conductor', 'rusk', { ...ink, ...skin, '#24304a': 'wood3', '#18202f': 'wood2', '#3c4d70': 'wood4', '#121722': 'wood1', '#262a35': 'iron',
    '#9a948f': 'stone4', '#c9cfd6': 'linen1', '#c9973f': 'brass1', '#241912': 'wood1', '#3a2a1e': 'wood2' }, (c) => {
    // a canvas apron over the lower coat, both frames
    for (const f of [0, 26]) for (let y = 19; y < 31; y++) for (let x = f + 9; x < f + 17; x++) { const px = c.get(x, y); if (px[3]) c.p(x, y, y === 19 ? 'linen0' : x === f + 9 ? 'linen0' : 'linen1'); }
  });
  // Reverend Elias Vale: Finch's build in a black frock coat, white collar, pale
  recolour('finch', 'vale', { ...ink, '#cfa486': 'linen1', '#9a6f56': 'stone4', '#8f6e5a': 'stone4', '#a9806a': 'linen0',
    '#5a4632': 'navy3', '#3d2f22': 'navy2', '#241912': 'ink', '#2b2e3a': 'navy2', '#3a2f26': 'navy2', '#7a6146': 'slate1', '#2a1e16': 'navy',
    '#4a5048': 'bone', '#343a34': 'linen1', '#c9cfd6': 'navy3', '#878380': 'navy3', '#3a2618': 'ink' });
  // Ada Bell, telegraph operator: Mrs. Gable's build in a dark blue serge dress, sleeve protectors, red hair pinned up
  recolour('gable', 'ada', { ...ink, ...skin, '#43304a': 'haze0', '#2a1e2a': 'slate0', '#1c141e': 'navy2', '#5e4668': 'haze1',
    '#c7beae': 'slate2', '#9d9484': 'slate1', '#3b2f2a': 'rust', '#5a4a40': 'wood3', '#7a6a60': 'wood4', '#c9973f': 'brass2', [PALETTE.brass1]: 'brass1' });
}

// ---------------- 5. Silas's map pieces ----------------
function mapPieces() {
  const W = 300, H = 168;
  const piece = (name, fn) => { const c = new Canvas(W, H); fn(c); writeFileSync(R(`assets/export/map/${name}.png`), encodePNG(W, H, c.d)); return { name, data: c.d }; };
  const INK = 'paperInk', DIM = 'paperInkDim';
  const dash = (c, pts, col = DIM) => { let k = 0; for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let s = 0; s <= n; s++, k++) if (k % 4 < 2) c.p(Math.round(x0 + ((x1 - x0) * s) / n), Math.round(y0 + ((y1 - y0) * s) / n), col); } };
  const pieces = [];
  // the chapel above the west end of the street, its graves beside it
  pieces.push(piece('chapel', (c) => {
    const x = 104, y = 60; // base line
    for (let i = 0; i <= 9; i++) { c.p(x - 9 + i, y - 12 - Math.round(i * 0.8), INK); c.p(x + 9 - i, y - 12 - Math.round(i * 0.8), INK); }
    c.vl(x - 8, y - 12, y, INK); c.vl(x + 8, y - 12, y, INK); c.hl(x - 8, x + 8, y, INK); c.vl(x, y - 25, y - 21, INK); c.hl(x - 1, x + 1, y - 24, INK);
    c.r(x - 1, y - 5, 3, 5, INK);
    for (const [gx, gy] of [[x + 14, y - 1], [x + 19, y], [x + 24, y - 1], [x + 16, y + 4], [x + 22, y + 4]]) { c.vl(gx, gy - 3, gy, DIM); c.hl(gx - 1, gx + 1, gy - 2, DIM); }
    c.p(x + 27, y + 3, 'inkRed'); c.p(x + 28, y + 4, 'inkRed'); c.p(x + 26, y + 4, 'inkRed'); // the opened grave, marked
  }));
  pieces.push(piece('tower', (c) => {
    const x = 64, y = 64;
    c.line(x - 5, y, x - 1, y - 18, INK); c.line(x + 5, y, x + 1, y - 18, INK); c.hl(x - 3, x + 3, y - 18, INK); c.hl(x - 4, x + 4, y - 20, INK);
    c.line(x - 4, y - 4, x + 3, y - 12, DIM); c.line(x + 4, y - 4, x - 3, y - 12, DIM);
    for (let i = 0; i < 14; i++) if (i % 3 !== 2) c.p(x + 6 + i, y - 19 + Math.round(Math.sin(i / 8) * 2), DIM); // the wire, running off
    for (let i = 0; i < 14; i++) if (i % 3 !== 2) c.p(x - 6 - i, y - 19 + Math.round(i * 0.4), DIM);
    c.p(x + 21, y - 18, 'inkRed'); c.p(x + 22, y - 17, 'inkRed'); // the cut
    for (let i = 0; i < 3; i++) { const px = x - 30 + i * 8; c.line(px, y + 6, px + 6, y - 2, DIM); c.line(px + 6, y - 2, px + 12, y + 6, DIM); } // ridge shoulder
  }));
  pieces.push(piece('path_village_chapel', (c) => dash(c, [[150, 86], [138, 76], [124, 66], [112, 62]])));
  pieces.push(piece('path_chapel_tower', (c) => dash(c, [[95, 61], [84, 63], [72, 64]])));
  return pieces;
}

// ---------------- run ----------------
mkdirSync(R('assets/export/characters'), { recursive: true });
const sky = daySky();
writeFileSync(R('assets/export/environments/parallax/town_sky_day.png'), encodePNG(sky.w, sky.h, sky.d));
writePxo(R(`${SRC}/environments/town_sky_day.pxo`), sky.w, sky.h, [{ name: 'sky_day', data: sky.d }]);
console.log('town_sky_day.png', sky.w, sky.h);
for (const [name, build] of [['store_interior', buildStore], ['hillside_exterior', buildHillside]]) {
  build();
  const img = decodePNG(readFileSync(R(`assets/export/tilesets/${name}.png`)));
  writePxo(R(`${SRC}/tilesets/${name}.pxo`), img.width, img.height, [{ name: 'tiles', data: img.data }]);
}
buildPeople();
console.log('rusk.png, vale.png, ada.png');
const pieces = mapPieces();
writePxo(R(`${SRC}/map/silas_map_chapter2.pxo`), 300, 168, pieces);
console.log('map pieces:', pieces.map((p) => p.name).join(', '));
