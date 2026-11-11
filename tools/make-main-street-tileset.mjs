// Paints the Crow's Hollow Main Street tileset (16×16, 8 columns, palette colours only):
//   assets/export/tilesets/main_street_exterior.png   (also imported into Pixelorama as the editable source:
//                                                      assets/source/pixelorama/tilesets/main_street_exterior.pxo)
//   assets/levels/tilesets/main_street_exterior.tsj   the Tiled tileset (every tile has a `name` property)
//   tools/data/main_street_tiles.json                 name → tile index, used by make-main-street-level.mjs
//
// The street map also uses the Black Ram tileset (log walls, windows, lamp, chimney, boardwalk, snow), the station
// tileset (the pitched snow roof, icicles) and the sawmill tileset (fence, barrel, crate, stump, cordwood, roof snow). This set
// holds what those lack: clapboard siding for the false-front store, the RUSK GEN'L STORE board, the cracked shop window,
// dark doors, the barred woodshed door and window, rutted street snow, footprints.
//
// TILE ORDER IS FIXED once in use; add new tiles at the END of build(). After hand edits in Pixelorama the .pxo is the
// source of truth and re-running this overwrites them.
//
//   node tools/make-main-street-tileset.mjs
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, hash, registry, blackRam, writeTileset, BR_SNOW_TOP } from './lib/tilekit.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { tiles, names, addTile, addBlock } = registry();
const brTile = blackRam(root);

const FONT = {
  R: ['110', '101', '110', '101', '101'], U: ['101', '101', '101', '101', '111'], S: ['011', '100', '010', '001', '110'],
  K: ['101', '101', '110', '101', '101'], G: ['011', '100', '101', '101', '011'], E: ['111', '100', '110', '100', '111'],
  N: ['101', '111', '111', '111', '101'], L: ['100', '100', '100', '100', '111'], T: ['111', '010', '010', '010', '010'],
  O: ['010', '101', '101', '101', '010'], "'": ['01', '01', '00', '00', '00'], ' ': ['00', '00', '00', '00', '00'],
};
const textWidth = (s) => [...s].reduce((n, ch) => n + FONT[ch][0].length + 1, -1);
function text(c, s, x, y, col) {
  for (const ch of s) { const g = FONT[ch]; g.forEach((row, j) => [...row].forEach((v, i) => v === '1' && c.p(x + i, y + j, col))); x += g[0].length + 1; }
}

// clapboard: 4 px courses, lit upper edge, shadowed lower edge, a few nails and grain flecks. `dark` = under the awning.
function siding(c, seed, dark) {
  const hi = dark ? 'wood2' : 'wood3', body = dark ? 'wood1' : 'wood2', lo = 'wood0';
  for (let y = 0; y < T; y++) {
    const band = y % 4;
    for (let x = 0; x < T; x++) {
      let col = band === 0 ? hi : band === 3 ? lo : body;
      if (band !== 3 && hash(x, y, seed) > 0.9) col = dark ? lo : 'wood1';
      c.p(x, y, col);
    }
  }
  for (let y = 1; y < T; y += 4) c.p(((y * 7 + seed * 5) % 12) + 2, y + 1, 'wood0');
}

function build() {
  addTile('siding_a', (c) => siding(c, 1, false));
  addTile('siding_b', (c) => siding(c, 2, false));
  addTile('siding_shadow', (c) => siding(c, 3, true));
  addTile('siding_end_l', (c) => { siding(c, 4, false); c.r(0, 0, 4, T, 'wood4'); c.vl(0, 0, T - 1, 'wood5'); c.vl(3, 0, T - 1, 'wood0'); });
  addTile('siding_end_r', (c) => { siding(c, 5, false); c.r(12, 0, 4, T, 'wood4'); c.vl(12, 0, T - 1, 'wood5'); c.vl(15, 0, T - 1, 'wood0'); });
  addTile('parapet', (c) => { c.r(0, 4, T, 12, 'wood1'); c.hl(0, 15, 4, 'wood3'); c.hl(0, 15, 15, 'wood0'); for (let x = 0; x < T; x++) { c.p(x, 3, hash(x, 1, 20) > 0.3 ? 'snow3' : 'snow4'); if (hash(x, 2, 20) > 0.6) c.p(x, 2, 'snow4'); } });
  addBlock('sign_rusk', 9, 1, (c) => { // the false front's lettered board (144×16)
    c.r(0, 3, 144, 12, 'wood0'); c.hl(0, 143, 3, 'wood2'); c.hl(0, 143, 14, 'wood1'); c.vl(0, 3, 14, 'wood2'); c.vl(143, 3, 14, 'wood1');
    for (let x = 0; x < 144; x++) { c.p(x, 2, hash(x, 1, 21) > 0.3 ? 'snow3' : 'snow4'); if (hash(x, 2, 21) > 0.7) c.p(x, 1, 'snow4'); }
    const s = "RUSK GEN'L STORE", w = textWidth(s); text(c, s, Math.floor((144 - w) / 2), 6, 'linen1');
    for (let x = 6; x < 138; x += 3) if (hash(x, 3, 22) > 0.85) c.p(x, 11, 'wood1'); // weathering through the paint
  });
  addBlock('shop_window', 5, 2, (c) => { // dark shop window: cracked pane, a counter, sacks, the account book left open (80×32)
    c.r(0, 2, 80, 28, 'wood1'); c.hl(0, 79, 2, 'wood3'); c.hl(0, 79, 3, 'wood2'); c.vl(0, 2, 29, 'wood2'); c.vl(79, 2, 29, 'wood0');
    c.r(3, 5, 74, 21, 'navy2');
    for (let y = 5; y < 26; y++) for (let x = 3; x < 77; x++) if (y > 17 && hash(x, y, 23) > 0.85) c.p(x, y, 'navy3');
    c.r(8, 19, 52, 7, 'wood0'); c.hl(8, 59, 19, 'wood1'); // counter
    c.r(5, 13, 9, 7, 'stone0'); c.hl(6, 12, 12, 'stone1'); c.r(63, 10, 10, 10, 'wood1'); c.hl(63, 72, 10, 'wood2'); // sacks, a barrel
    c.r(30, 17, 9, 2, 'linen0'); c.hl(30, 38, 17, 'linen1'); c.vl(34, 17, 18, 'paperInk'); // the open account book
    c.line(40, 5, 50, 25, 'snow1'); c.line(41, 5, 51, 25, 'snow0'); c.line(45, 15, 56, 12, 'snow1'); c.line(47, 20, 36, 22, 'snow0'); // the crack
    c.line(4, 6, 12, 6, 'slate2'); c.line(4, 7, 8, 7, 'slate1');
    c.r(0, 27, 80, 4, 'wood2'); c.hl(0, 79, 27, 'wood4'); c.hl(0, 79, 30, 'wood0'); // sill with snow
    for (let x = 1; x < 79; x++) { c.p(x, 26, hash(x, 1, 24) > 0.35 ? 'snow3' : 'snow4'); if (hash(x, 2, 24) > 0.7) c.p(x, 25, 'snow4'); }
  });
  addBlock('door_dark', 2, 3, (c) => { // plank door, dark transom (32×48)
    c.r(0, 0, 32, 48, 'wood0'); c.vl(0, 0, 47, 'wood1'); c.vl(31, 0, 47, 'wood1'); c.hl(0, 31, 0, 'wood1');
    c.r(3, 3, 26, 9, 'navy2'); c.hl(3, 28, 3, 'navy3'); c.vl(15, 3, 11, 'wood0'); c.vl(16, 3, 11, 'wood0'); // transom
    c.hl(2, 29, 13, 'wood3'); c.hl(2, 29, 14, 'wood1');
    c.r(3, 15, 26, 33, 'wood2'); c.vl(3, 15, 47, 'wood3');
    for (let x = 3; x < 29; x += 6) c.vl(x + 5, 15, 47, 'wood1');
    for (let y = 15; y < 48; y++) for (let x = 4; x < 29; x++) if (hash(x, y, 25) > 0.9) c.p(x, y, 'wood1');
    c.r(23, 30, 2, 2, 'brass1'); c.p(23, 30, 'brass2'); // knob
    c.hl(2, 29, 47, 'snow3'); c.hl(4, 27, 46, 'snow2');
  });
  addBlock('shed_door', 3, 3, (c) => { // woodshed door, barred from outside (48×48)
    c.r(3, 3, 42, 45, 'wood1'); c.hl(3, 44, 3, 'wood3'); c.vl(3, 3, 47, 'wood2'); c.vl(44, 3, 47, 'wood0');
    for (let x = 3; x < 45; x += 7) c.vl(x + 6, 3, 47, 'wood0');
    for (let y = 3; y < 48; y++) for (let x = 4; x < 44; x++) if (hash(x, y, 26) > 0.92) c.p(x, y, 'wood0');
    c.line(6, 7, 41, 42, 'wood3'); c.line(7, 7, 42, 42, 'wood2'); c.line(41, 7, 6, 42, 'wood3'); c.line(42, 7, 7, 42, 'wood2');
    c.r(0, 22, 48, 5, 'iron2'); c.hl(0, 47, 22, 'stone2'); c.hl(0, 47, 26, 'iron'); // the bar across both posts
    c.r(21, 26, 6, 7, 'iron'); c.hl(21, 26, 26, 'iron2'); c.p(23, 29, 'stone4'); // padlock
    c.hl(2, 45, 0, 'snow4'); c.hl(1, 46, 1, 'snow3'); c.hl(0, 47, 2, 'snow2');
    for (let x = 2; x < 46; x++) if (hash(x, 1, 27) > 0.5) c.p(x, 47, 'snow3');
  });
  addTile('shed_window', (c) => { c.r(4, 3, 9, 9, 'wood0'); c.r(5, 4, 7, 7, 'navy2'); c.line(5, 4, 11, 10, 'slate2'); c.hl(3, 13, 12, 'wood3'); c.hl(4, 12, 11, 'snow3'); c.hl(4, 12, 2, 'snow4'); c.hl(5, 11, 1, 'snow3'); });
  const rut = (c, a) => { // packed street snow with cart ruts (two shallow grooves)
    brTile(BR_SNOW_TOP, c);
    for (let x = 0; x < T; x++) {
      const y = 4 + a + Math.round(Math.sin(x / 3) * 0.5);
      c.p(x, y, 'snow1'); c.p(x, y + 1, 'snow0'); c.p(x, y - 1, 'snow4');
      const y2 = 9 + a; c.p(x, y2, 'snow1'); c.p(x, y2 + 1, 'snow0');
    }
  };
  addTile('street_a', (c) => rut(c, 0));
  addTile('street_b', (c) => rut(c, 1));
  const prints = (c, pts) => { brTile(BR_SNOW_TOP, c); for (const [x, y] of pts) { c.r(x, y, 3, 2, 'snow1'); c.hl(x, x + 2, y - 1, 'snow4'); c.p(x + 3, y, 'snow2'); } };
  addTile('street_prints_a', (c) => prints(c, [[2, 3], [10, 5]]));
  addTile('street_prints_b', (c) => prints(c, [[5, 5], [13, 3]]));
  addTile('doorstep_drift', (c) => { for (let x = 0; x < T; x++) { const h = Math.round(Math.sin((x / 15) * Math.PI) * 5) + 1; for (let y = 0; y < h; y++) c.p(x, 15 - y, y > h - 2 ? 'snow4' : y > h - 4 ? 'snow3' : 'snow1'); } });
  addTile('eave_post', (c) => { c.r(6, 0, 4, T, 'wood2'); c.vl(6, 0, 15, 'wood3'); c.vl(9, 0, 15, 'wood0'); }); // porch post
  addTile('eave_post_foot', (c) => { c.r(6, 0, 4, 13, 'wood2'); c.vl(6, 0, 12, 'wood3'); c.vl(9, 0, 12, 'wood0'); c.hl(4, 11, 13, 'snow3'); c.hl(5, 10, 12, 'snow4'); });
  // ---- appended for the hotel forecourt (Pass 2): pines, shrub, bench, trodden snow ----
  const pine = (c, cx, baseY, tiers, half, seed) => { // dark snow-laden pine: layered drooping boughs on a bare trunk
    c.r(cx - 2, baseY - 14, 4, 14, 'wood1'); c.vl(cx - 2, baseY - 14, baseY - 1, 'wood2'); c.vl(cx + 1, baseY - 14, baseY - 1, 'wood0');
    for (let k = 0; k < tiers; k++) {
      const topY = baseY - 14 - (tiers - k) * 15 + 6, w = Math.round((half * (k + 1.4)) / tiers);
      for (let d = 0; d < 20; d++) {
        const y = topY + d, span = Math.min(w, Math.round((d * w) / 17) + 1);
        for (let x = -span; x <= span; x++) {
          const edge = Math.abs(x) >= span - 1, lit = x < 0;
          const droop = Math.floor(hash(x + seed, d, 70) * 2);
          c.p(cx + x, y + (edge ? droop : 0), d < 2 ? 'snow4' : d < 4 && !edge ? (hash(x, d, 71) > 0.4 ? 'snow3' : 'slate4') : edge ? (lit ? 'slate2' : 'navy3') : hash(x + seed, y, 72) > 0.86 ? 'slate0' : lit ? 'navy3' : 'navy2');
        }
      }
    }
  };
  addBlock('pine_a', 4, 6, (c) => pine(c, 32, 96, 5, 26, 1));
  addBlock('pine_b', 2, 4, (c) => pine(c, 16, 64, 3, 14, 7));
  addTile('shrub', (c) => { for (let x = 1; x < 15; x++) { const h = 4 + Math.round(Math.sin(((x - 1) / 13) * Math.PI) * 6); for (let y = 0; y < h; y++) c.p(x, 15 - y, y > h - 3 ? (y === h - 1 ? 'snow4' : 'snow3') : hash(x, y, 73) > 0.5 ? 'navy3' : 'slate0'); } for (let i = 0; i < 4; i++) c.p(3 + i * 3, 15 - 5 - (i % 2), 'wood2'); });
  addBlock('bench', 2, 1, (c) => { c.r(2, 7, 28, 3, 'wood2'); c.hl(2, 29, 7, 'wood4'); c.hl(2, 29, 9, 'wood0'); c.r(4, 10, 3, 6, 'wood1'); c.r(25, 10, 3, 6, 'wood1'); c.r(2, 3, 28, 2, 'wood1'); c.hl(2, 29, 3, 'wood3'); c.vl(5, 3, 7, 'wood0'); c.vl(26, 3, 7, 'wood0'); for (let x = 3; x < 29; x++) { c.p(x, 6, hash(x, 1, 74) > 0.35 ? 'snow3' : 'snow4'); if (hash(x, 2, 74) > 0.7) c.p(x, 5, 'snow4'); } });
  const trodden = (c, seed) => { // snow beaten flat by many boots toward the door
    brTile(BR_SNOW_TOP, c);
    for (let i = 0; i < 9; i++) { const x = Math.floor(hash(i, seed, 75) * 13), y = 2 + Math.floor(hash(i, seed, 76) * 11); c.r(x, y, 3, 2, 'snow0'); c.hl(x, x + 2, y - 1, 'snow2'); }
    for (let x = 0; x < T; x++) if (hash(x, seed, 77) > 0.7) c.p(x, 5 + (x % 6), 'snow1');
  };
  addTile('trodden_a', (c) => trodden(c, 1));
  addTile('trodden_b', (c) => trodden(c, 2));
}

build();
writeTileset(root, 'main_street_exterior', { tiles, names, addTile }, 'tools/data/main_street_tiles.json');
