// Paints the Blackwood Station exterior tileset (16×16, 8 columns, palette colours only):
//   assets/export/tilesets/station_exterior.png   (also imported into Pixelorama as the editable source:
//                                                   assets/source/pixelorama/tilesets/station_exterior.pxo)
//   assets/levels/tilesets/station_exterior.tsj   the Tiled tileset (every tile has a `name` property)
//   tools/data/station_tiles.json                 name → tile index, used by make-station-level.mjs
//
// The station map ALSO uses the Black Ram tileset (windows, door, wall, lamp, chimney, deck boards, snow), so this
// set holds only what that one lacks: the pitched snow roof (a tile per rise), the BLACKWOOD sign, TEL plate,
// timetable board, freight, track bed and rails, the telegraph pole and its wires.
//
// TILE ORDER IS FIXED once in use. Add new tiles at the END of build(). After hand edits in Pixelorama the .pxo is the
// source of truth and re-running this overwrites them.
//
//   node tools/make-station-tileset.mjs
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, hash, registry, blackRam, writeTileset } from './lib/tilekit.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { tiles, names, addTile, addBlock } = registry();
const brTile = blackRam(root);
void brTile;

// 3×5 capitals (W is 5 wide)
const FONT = {
  B: ['110', '101', '110', '101', '110'], L: ['100', '100', '100', '100', '111'], A: ['010', '101', '111', '101', '101'],
  C: ['011', '100', '100', '100', '011'], K: ['101', '101', '110', '101', '101'], O: ['010', '101', '101', '101', '010'],
  D: ['110', '101', '101', '101', '110'], E: ['111', '100', '110', '100', '111'], T: ['111', '010', '010', '010', '010'],
  W: ['10001', '10001', '10101', '10101', '01010'], ' ': ['00', '00', '00', '00', '00'],
};
const textWidth = (s) => [...s].reduce((n, ch) => n + FONT[ch][0].length + 1, -1);
function text(c, s, x, y, col) {
  for (const ch of s) { const g = FONT[ch]; g.forEach((row, j) => [...row].forEach((v, i) => v === '1' && c.p(x + i, y + j, col))); x += g[0].length + 1; }
}

// Roof tile for a left slope whose surface enters at local y = a and rises PITCH px per tile (a may be negative: the part of a
// body that spills into the row below). Right slopes are these tiles flipped horizontally in Tiled (flip H).
const PITCH = 3, THICK = 10;
function roofSlope(c, a) {
  for (let x = 0; x < T; x++) {
    const top = a - Math.round((x * PITCH) / T);
    for (let d = 0; d <= THICK; d++) {
      const y = top + d;
      const col = d === 0 ? 'snow4' : d === 1 ? 'snow3' : d === 2 ? 'snow2' : d === 3 ? ((x + a) % 4 ? 'snow1' : 'wood1') : d === THICK ? 'wood0' : d === 7 ? 'wood0' : (hash(x, d, 5) > 0.82 ? 'wood2' : 'wood1');
      c.p(x, y, col);
    }
    if (hash(x, a, 6) > 0.55) c.p(x, top - 1, 'snow3'); // wind-lifted crust
  }
}

function build() {
  // ============================== pitched roof (all rises) =================================================
  for (let a = -15; a <= 15; a++) addTile(`roof_slope_${a}`, (c) => roofSlope(c, a));
  addTile('eave_icicles', (c) => { for (let x = 1; x < T; x += 3) { const len = 3 + Math.floor(hash(x, 3, 60) * 7); for (let y = 0; y < len; y++) c.p(x, y, y < len - 1 ? 'snow2' : 'snow4'); } });

  // ============================== signs & boards ===========================================================
  addBlock('sign_blackwood', 6, 1, (c) => { // 96×16 board, brass lettering like the hotel's
    c.r(0, 2, 96, 13, 'wood0'); c.hl(0, 95, 2, 'wood2'); c.hl(0, 95, 14, 'wood1'); c.vl(0, 2, 14, 'wood2'); c.vl(95, 2, 14, 'wood1');
    for (let x = 1; x < 95; x++) { c.p(x, 1, hash(x, 1, 12) > 0.3 ? 'snow3' : 'snow4'); if (hash(x, 2, 12) > 0.75) c.p(x, 0, 'snow4'); }
    const w = textWidth('BLACKWOOD'); text(c, 'BLACKWOOD', Math.floor((96 - w) / 2), 5, 'brass2');
    c.p(3, 4, 'iron2'); c.p(92, 4, 'iron2');
  });
  addBlock('tel_plate', 2, 1, (c) => { c.r(2, 4, 28, 9, 'wood0'); c.hl(2, 29, 4, 'wood2'); c.hl(2, 29, 12, 'wood1'); text(c, 'TEL', 11, 6, 'snow2'); });
  addBlock('timetable', 2, 2, (c) => { // chalk timetable on a boarded frame
    c.r(2, 2, 28, 28, 'wood1'); c.hl(2, 29, 2, 'wood3'); c.vl(2, 2, 29, 'wood2'); c.vl(29, 2, 29, 'wood0'); c.hl(2, 29, 29, 'wood0');
    c.r(5, 5, 22, 22, 'slate0'); c.hl(5, 26, 5, 'slate1');
    for (let i = 0; i < 5; i++) c.hl(7, 7 + 6 + ((i * 5) % 9), 8 + i * 3, i === 0 ? 'snow3' : 'slate6');
    c.line(7, 23, 23, 21, 'snow4'); // the same word, chalked beside every row
    c.hl(1, 30, 1, 'snow3'); c.hl(2, 29, 0, 'snow4');
  });
  addBlock('freight', 3, 2, (c) => { // a crate of lamp oil and two mail sacks, snow on top (48×32, bottom-aligned)
    c.r(1, 15, 22, 17, 'wood3'); c.hl(1, 22, 15, 'wood5'); c.vl(1, 15, 31, 'wood4'); c.vl(22, 15, 31, 'wood1'); c.hl(1, 22, 31, 'wood1');
    c.line(2, 16, 21, 30, 'wood2'); c.line(21, 16, 2, 30, 'wood2'); c.hl(0, 23, 14, 'snow4'); c.hl(2, 21, 13, 'snow3'); for (let x = 3; x < 21; x += 3) c.p(x, 12, 'snow4');
    c.r(24, 19, 14, 13, 'stone1'); c.hl(24, 37, 19, 'stone4'); c.vl(24, 19, 31, 'stone2'); c.vl(37, 19, 31, 'stone0'); c.hl(26, 35, 18, 'stone1'); c.hl(25, 36, 17, 'snow3'); c.hl(27, 34, 16, 'snow4'); c.hl(28, 33, 25, 'stone0');
    c.r(38, 24, 9, 8, 'stone0'); c.hl(38, 46, 24, 'stone2'); c.hl(39, 45, 23, 'snow3'); c.hl(40, 44, 22, 'snow4');
  });

  // ============================== track bed and rails (the back layer, behind the train) ======================
  for (let v = 0; v < 4; v++) addTile(`bank_top_${v}`, (c) => { // dark ballast bank with a drifting snow crust
    for (let x = 0; x < T; x++) {
      const top = 3 + Math.round(2 + Math.sin((x + v * 5) / 3.2) * 2 + hash(x, v, 8) * 1.5);
      c.p(x, top - 1, 'snow3'); c.p(x, top, 'snow4');
      for (let y = top + 1; y < T; y++) c.p(x, y, y < top + 3 ? 'snow1' : hash(x, y, 9) > 0.9 ? 'slate2' : 'navy3');
    }
  });
  addTile('rails', (c) => { // two rails on dark sleepers, ballast around them (the rail head sits at native y 213)
    c.r(0, 0, T, T, 'navy3');
    for (let x = 0; x < T; x++) if (hash(x, 4, 14) > 0.8) c.p(x, 1 + (x % 3), 'slate2');
    c.r(1, 8, 4, 8, 'wood0'); c.r(9, 8, 4, 8, 'wood0'); c.hl(1, 4, 8, 'wood1'); c.hl(9, 12, 8, 'wood1');
    c.hl(0, 15, 5, 'iron2'); c.hl(0, 15, 6, 'stone2'); c.hl(0, 15, 7, 'iron'); c.hl(0, 15, 4, 'snow2'); // rail with snow along its head
    for (let x = 0; x < T; x++) if (hash(x, 2, 15) > 0.65) c.p(x, 4, 'snow4');
  });
  addTile('ballast', (c) => { c.r(0, 0, T, T, 'navy3'); for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (hash(x, y, 16) > 0.88) c.p(x, y, 'slate2'); });

  // ============================== telegraph pole ============================================================
  addTile('pole', (c) => { c.r(7, 0, 4, T, 'wood1'); c.vl(7, 0, T - 1, 'wood3'); c.vl(10, 0, T - 1, 'wood0'); for (let y = 0; y < T; y += 5) c.p(8, y, 'wood0'); });
  addTile('pole_foot', (c) => { c.r(7, 0, 4, 12, 'wood1'); c.vl(7, 0, 11, 'wood3'); c.vl(10, 0, 11, 'wood0'); c.hl(4, 14, 12, 'snow4'); c.hl(2, 15, 13, 'snow3'); c.hl(0, 15, 14, 'snow2'); c.hl(0, 15, 15, 'snow1'); });
  addTile('pole_cross_l', (c) => { c.r(0, 7, 16, 3, 'wood1'); c.hl(0, 15, 7, 'wood3'); c.hl(0, 15, 9, 'wood0'); c.r(3, 4, 2, 3, 'slate6'); c.p(3, 4, 'bone'); });
  addTile('pole_cross_m', (c) => { c.r(0, 7, 16, 3, 'wood1'); c.hl(0, 15, 7, 'wood3'); c.hl(0, 15, 9, 'wood0'); c.r(7, 0, 4, 7, 'wood1'); c.vl(7, 0, 6, 'wood3'); c.vl(10, 0, 6, 'wood0'); c.hl(6, 11, 0, 'snow4'); });
  addTile('pole_cross_r', (c) => { c.r(0, 7, 16, 3, 'wood1'); c.hl(0, 15, 7, 'wood3'); c.hl(0, 15, 9, 'wood0'); c.r(11, 4, 2, 3, 'slate6'); c.p(11, 4, 'bone'); });
  // (the wires themselves are an image layer, drawn by make-station-level.mjs)
}

build();
writeTileset(root, 'station_exterior', { tiles, names, addTile }, 'tools/data/station_tiles.json');
