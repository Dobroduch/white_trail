// Paints the wilderness tileset used by the Road to Crow's Hollow and the Creek Path (16×16, 8 columns, palette only):
//   assets/export/tilesets/wilderness_exterior.png   (also imported into Pixelorama: assets/source/pixelorama/tilesets/wilderness_exterior.pxo)
//   assets/levels/tilesets/wilderness_exterior.tsj   the Tiled tileset (every tile has a `name` property)
//   tools/data/wilderness_tiles.json                 name → tile index, used by make-wilderness-levels.mjs
//
// TERRAIN. Both scenes have rolling ground, so the ground is tiles whose snow crust sits at local y = s (t_<kind>_<a|b>_s<s>,
// s = 0…12): the crust of a column is at native y 224 + s, and the Tiled `ground` polyline Silas walks on follows it.
// Kinds: plain, rut (wagon ruts), tuft (dry grass), prints (a boot print pair). Things that stand on the ground are drawn on a layer
// BEHIND the terrain with their feet sunk into row 14, so the terrain tiles clip them at any slope.
//
// TILE ORDER IS FIXED once in use; add new tiles at the END of build(). After hand edits in Pixelorama the .pxo is the source of
// truth and re-running this overwrites them.
//
//   node tools/make-wilderness-tileset.mjs
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, hash, registry, blackRam, writeTileset, BR_SNOW_FILL } from './lib/tilekit.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { tiles, names, addTile, addBlock } = registry();
const brTile = blackRam(root);

const FONT = {
  C: ['011', '100', '100', '100', '011'], R: ['110', '101', '110', '101', '101'], O: ['010', '101', '101', '101', '010'],
  W: ['10001', '10001', '10101', '10101', '01010'], "'": ['01', '01', '00', '00', '00'], S: ['011', '100', '010', '001', '110'],
  H: ['101', '101', '111', '101', '101'], L: ['100', '100', '100', '100', '111'], ' ': ['00', '00', '00', '00', '00'],
};
const textWidth = (s) => [...s].reduce((n, ch) => n + FONT[ch][0].length + 1, -1);
const text = (c, s, x, y, col) => { for (const ch of s) { const g = FONT[ch]; g.forEach((row, j) => [...row].forEach((v, i) => v === '1' && c.p(x + i, y + j, col))); x += g[0].length + 1; } };

// ground tile whose snow crust is at local y = s
function terrain(c, s, kind, seed) {
  brTile(BR_SNOW_FILL, c);
  for (let x = 0; x < T; x++) {
    for (let y = 0; y < s; y++) c.p(x, y, 'clear');
    const lump = s > 0 && hash(x, seed, 31) > 0.72;
    if (lump) { c.p(x, s - 1, 'snow3'); }
    c.p(x, s, 'snow4'); c.p(x, s + 1, 'snow3'); c.p(x, s + 2, hash(x, seed, 32) > 0.4 ? 'snow2' : 'snow1');
  }
  if (kind === 'rut') {
    for (let x = 0; x < T; x++) {
      const y1 = s + 4 + Math.round(Math.sin(x / 3 + seed) * 0.5), y2 = s + 8;
      c.p(x, y1, 'snow1'); c.p(x, y1 + 1, 'snow0'); c.p(x, y2, 'snow1'); if (x % 3) c.p(x, y2 + 1, 'snow0');
    }
  } else if (kind === 'tuft') {
    for (const [x, hgt] of [[3 + seed * 2, 5 + (seed % 3)], [10 + seed, 6 + ((seed + 1) % 3)]]) {
      for (let k = 0; k < hgt; k++) { c.p(x + (k > 3 ? 1 : 0), s - 1 - k, 'ink'); if (k > 1) c.p(x - 1 - (k % 2), s - 1 - k + 1, 'ink'); }
      c.p(x - 2, s - 2, 'snow3'); c.p(x + 2, s - 3, 'snow3');
    }
  } else if (kind === 'prints') {
    for (const [x, dy] of [[2 + seed * 2, 4], [10 - seed, 7]]) { c.r(x, s + dy, 3, 2, 'snow1'); c.hl(x, x + 2, s + dy - 1, 'snow4'); c.p(x + 3, s + dy, 'snow2'); }
  }
}

function build() {
  for (const kind of ['plain', 'rut', 'tuft', 'prints']) for (const v of [0, 1]) for (let s = 0; s <= 12; s++) addTile(`t_${kind}_${'ab'[v]}_s${s}`, (c) => terrain(c, s, kind, v + 1));

  // ---- the creek: a snow bank turning to ice, and the black water below ----
  for (const v of [0, 1]) {
    addTile(`creek_edge_${'ab'[v]}`, (c) => { // row 15: bank snow above, ice rim at local y 8, dark water below
      brTile(BR_SNOW_FILL, c);
      for (let y = 5; y < T; y++) for (let x = 0; x < T; x++) c.p(x, y, 'clear');
      for (let x = 0; x < T; x++) { const yy = 5 + Math.round(Math.sin((x + v * 7) / 2.4) * 0.8 + hash(x, v, 41)); c.p(x, yy, 'snow2'); c.p(x, yy + 1, 'snow1'); c.p(x, yy + 2, 'haze0'); }
      for (let x = 0; x < T; x++) for (let y = 9; y < T; y++) c.p(x, y, hash(x, y, 42 + v) > 0.9 ? 'navy3' : 'navy');
      for (let x = 0; x < T; x++) c.p(x, 8, x % 3 ? 'snow1' : 'snow2');
    });
    addTile(`creek_water_${'ab'[v]}`, (c) => { // row 16: black water, ice floes and ripples
      c.r(0, 0, T, T, 'navy');
      for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (hash(x, y, 43 + v) > 0.93) c.p(x, y, 'navy3');
      for (let i = 0; i < 3; i++) { const y = 2 + i * 5 + ((i + v) % 2), x = (i * 5 + v * 4) % 11; c.hl(x, x + 3 + (i % 3), y, 'slate2'); c.hl(x + 1, x + 2 + (i % 3), y - 1, 'haze0'); }
    });
  }
  addTile('under_bridge', (c) => { c.r(0, 0, T, T, 'navy2'); for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (hash(x, y, 44) > 0.88) c.p(x, y, 'navy3'); });

  // ---- road furniture ----
  addBlock('sign_crow', 4, 4, (c) => { // the CROW'S HOLLOW signpost: arrow board on a post (64×64; the post's foot is sunk 18 px)
    c.r(18, 14, 4, 50, 'wood1'); c.vl(18, 14, 63, 'wood2'); c.vl(21, 14, 63, 'wood0');
    const t = "CROW'S HOLLOW", w = textWidth(t) + 8;
    c.r(14, 2, w, 12, 'wood2'); c.hl(14, 14 + w - 1, 2, 'wood4'); c.hl(14, 14 + w - 1, 13, 'wood0');
    for (let i = 0; i < 6; i++) c.vl(14 + w + i, 2 + i, 13 - i, 'wood2');
    for (let x = 14; x < 14 + w; x++) { c.p(x, 1, hash(x, 1, 51) > 0.3 ? 'snow3' : 'snow4'); }
    text(c, t, 18, 5, 'linen1');
  });
  addBlock('orecar', 3, 3, (c) => { // a half-buried ore car on a stub of rail (48×48)
    c.hl(0, 47, 36, 'iron2'); c.hl(0, 47, 37, 'iron');
    c.r(10, 18, 30, 15, 'rust'); c.hl(8, 41, 17, 'wood1'); c.hl(8, 41, 18, 'wood0'); c.vl(10, 18, 32, 'wood0');
    for (let i = 0; i < 6; i++) c.vl(14 + i * 5, 20, 30, 'wood1');
    c.r(14, 33, 6, 5, 'iron'); c.r(30, 33, 6, 5, 'iron'); c.p(16, 35, 'iron2'); c.p(32, 35, 'iron2');
    for (let x = 8; x < 42; x++) { c.p(x, 16, 'snow4'); if (hash(x, 1, 52) > 0.4) c.p(x, 15, 'snow3'); if (hash(x, 2, 52) > 0.75) c.p(x, 14, 'snow4'); }
    for (let x = 2; x < 46; x++) { const h = Math.max(0, Math.round(7 - Math.abs(x - 22) / 3)); for (let y = 0; y < h; y++) c.p(x, 36 - y, y > h - 2 ? 'snow4' : 'snow3'); }
  });
  addBlock('notice', 3, 4, (c) => { // the notice board near the village (48×64): two posts, a roof, papers
    c.r(3, 14, 3, 50, 'wood1'); c.r(40, 14, 3, 50, 'wood1'); c.vl(3, 14, 63, 'wood2'); c.vl(40, 14, 63, 'wood2');
    c.r(1, 8, 44, 5, 'wood1'); c.hl(1, 44, 8, 'wood3'); c.hl(1, 44, 12, 'wood0'); for (let x = 1; x < 45; x++) { c.p(x, 7, 'snow4'); if (hash(x, 1, 53) > 0.3) c.p(x, 6, 'snow3'); }
    c.r(6, 13, 34, 26, 'wood2'); c.hl(6, 39, 13, 'wood3'); c.vl(6, 13, 38, 'wood3'); c.vl(39, 13, 38, 'wood0'); c.hl(6, 39, 38, 'wood0');
    c.r(10, 17, 14, 18, 'paper'); c.hl(10, 23, 17, 'paper2'); for (let i = 0; i < 5; i++) c.hl(12, 12 + 8 - (i % 2) * 2, 20 + i * 3, 'paperInkDim'); c.r(12, 18, 6, 1, 'crimsonDark'); // the notice for Sheriff Hale
    c.r(26, 19, 8, 9, 'linen0'); c.hl(26, 33, 19, 'linen1'); c.hl(28, 31, 22, 'paperInkDim'); c.hl(28, 32, 25, 'paperInkDim');
    c.p(8, 15, 'iron2'); c.p(37, 15, 'iron2');
  });
  // fence: a post tile pair (top at row 13, foot sunk into row 14), span and broken span
  addTile('fence_post_top', (c) => { c.r(6, 4, 4, 12, 'wood1'); c.vl(6, 4, 15, 'wood2'); c.vl(9, 4, 15, 'wood0'); c.hl(5, 10, 3, 'snow4'); c.hl(6, 9, 2, 'snow3'); c.hl(0, 15, 8, 'wood0'); c.hl(0, 15, 13, 'wood0'); c.hl(0, 5, 7, 'snow2'); c.hl(10, 15, 7, 'snow2'); });
  addTile('fence_post_foot', (c) => { c.r(6, 0, 4, 11, 'wood1'); c.vl(6, 0, 10, 'wood2'); c.vl(9, 0, 10, 'wood0'); });
  addTile('fence_span_top', (c) => { c.hl(0, 15, 8, 'wood0'); c.hl(0, 15, 9, 'wood1'); c.hl(0, 15, 13, 'wood0'); c.hl(0, 15, 14, 'wood1'); for (let x = 0; x < 16; x++) c.p(x, 7, hash(x, 1, 54) > 0.3 ? 'snow2' : 'snow4'); });
  addTile('fence_span_foot', (c) => {});
  addTile('fence_broken_top', (c) => { c.r(6, 8, 4, 8, 'wood1'); c.vl(6, 8, 15, 'wood2'); c.line(9, 8, 13, 2, 'wood1'); c.line(10, 8, 14, 3, 'wood0'); c.hl(5, 10, 7, 'snow4'); c.hl(0, 5, 13, 'wood0'); c.hl(0, 4, 12, 'snow2'); c.line(0, 14, 5, 13, 'wood1'); });

  // ---- the creek path ----
  addBlock('bridge', 5, 3, (c) => { // footbridge (80×48; origin row 13): deck top at local y 28 (= native 236), rails above, piles into the water
    for (const x of [8, 38, 70]) { c.r(x, 28, 4, 20, 'wood1'); c.vl(x, 28, 47, 'wood2'); c.vl(x + 3, 28, 47, 'wood0'); }
    c.r(0, 28, 80, 4, 'wood3'); c.hl(0, 79, 28, 'wood5'); c.hl(0, 79, 31, 'wood0'); for (let x = 7; x < 80; x += 8) c.vl(x, 29, 31, 'wood1'); // deck planks
    c.r(0, 32, 80, 3, 'wood1'); c.hl(0, 79, 32, 'wood2'); c.hl(0, 79, 34, 'wood0'); // stringer
    for (const x of [2, 38, 76]) { c.r(x, 10, 3, 18, 'wood1'); c.vl(x, 10, 27, 'wood2'); c.p(x, 9, 'snow4'); c.p(x + 1, 9, 'snow3'); } // rail posts
    c.hl(2, 77, 12, 'brass1'); c.hl(2, 77, 13, 'brass0'); c.line(5, 13, 22, 28, 'wood2'); c.line(41, 13, 58, 28, 'wood2'); // handrail, braces
    for (let x = 3; x < 78; x++) { c.p(x, 27, hash(x, 1, 55) > 0.35 ? 'snow3' : 'snow4'); if (hash(x, 2, 55) > 0.75) c.p(x, 26, 'snow4'); } // snow along the deck
  });
  addBlock('deadfall', 8, 6, (c) => { // two pines down across the bank path (128×96; trunks end at y 92)
    const trunk = (x0, y0, x1, y1, th) => { for (let t = 0; t <= 100; t++) { const x = x0 + ((x1 - x0) * t) / 100, y = y0 + ((y1 - y0) * t) / 100; for (let k = 0; k < th; k++) { c.p(x, y + k, k === 0 ? 'wood2' : k === th - 1 ? 'ink' : 'wood0'); } if (t % 2) c.p(x, y - 1, hash(t, y0, 56) > 0.35 ? 'snow3' : 'snow4'); } };
    trunk(0, 26, 118, 88, 7); trunk(14, 92, 124, 24, 6);
    c.r(60, 20, 7, 74, 'ink'); c.vl(60, 20, 93, 'wood0'); c.hl(60, 66, 19, 'snow4'); // the stump still standing between them
    for (let i = 0; i < 22; i++) { const x = 6 + Math.floor(hash(i, 1, 57) * 112), y = 28 + Math.floor(hash(i, 2, 57) * 60), d = hash(i, 3, 57) > 0.5 ? 6 : -6; c.line(x, y, x + d, y - 5, 'wood0'); c.p(x + d, y - 6, 'snow3'); }
    for (let x = 2; x < 126; x += 3) if (hash(x, 4, 58) > 0.6) c.p(x, 88 + Math.floor(hash(x, 5, 58) * 6), 'snow3');
  });
  addTile('snow_body', (c) => brTile(BR_SNOW_FILL, c)); // plain snow under the terrain (appended)
}

build();
writeTileset(root, 'wilderness_exterior', { tiles, names, addTile }, 'tools/data/wilderness_tiles.json');
