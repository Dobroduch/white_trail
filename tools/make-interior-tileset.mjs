// Paints the Black Ram Hotel interior tileset used by the parlor and Room 4 (16×16, 8 columns, palette colours only):
//   assets/export/tilesets/hotel_interior.png   (also imported into Pixelorama: assets/source/pixelorama/tilesets/hotel_interior.pxo)
//   assets/levels/tilesets/hotel_interior.tsj   the Tiled tileset (every tile has a `name` property)
//   tools/data/hotel_tiles.json                 name → tile index, used by make-interior-levels.mjs
//
// The two rooms keep the geometry of the Pixelorama paintings they replace (door, hearth, stairs, pigeonholes, sconces; wardrobe, washstand,
// window, bed, the scrubbed boards), so every interactable, prop and light stays where it was. Warm light is added by the engine and by the
// baked light/glow image layers; these tiles are painted unlit, in the palette's own values.
//
// TILE ORDER IS FIXED once in use; add new tiles at the END of build(). After hand edits in Pixelorama the .pxo is the source of truth.
//   node tools/make-interior-tileset.mjs
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, hash, registry, writeTileset } from './lib/tilekit.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { tiles, names, addTile, addBlock } = registry();

// ---- shared pieces ----------------------------------------------------------------------------------------
const wood = (c, x, y, w, h, base = 'wood2', hi = 'wood3', lo = 'wood0') => { c.r(x, y, w, h, base); c.hl(x, x + w - 1, y, hi); c.hl(x, x + w - 1, y + h - 1, lo); c.vl(x, y, y + h - 1, hi); c.vl(x + w - 1, y, y + h - 1, lo); };

function damask(c, seed, base, mid, hi) { // wallpaper: tone-on-tone diamond medallions
  c.r(0, 0, T, T, base);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (hash(x, y, seed) > 0.93) c.p(x, y, mid);
  for (const [cx, cy] of [[4, 4], [12, 12]]) { // diamond motif
    for (let d = 0; d <= 3; d++) { c.p(cx - d, cy, mid); c.p(cx + d, cy, mid); c.p(cx, cy - d, mid); c.p(cx, cy + d, mid); }
    c.p(cx, cy, hi); c.p(cx - 1, cy - 1, mid); c.p(cx + 1, cy + 1, mid); c.p(cx - 1, cy + 1, mid); c.p(cx + 1, cy - 1, mid);
  }
  for (let x = 0; x < T; x += 8) c.vl(x, 0, T - 1, 'purple'); // faint stripes between motifs
}

function build() {
  // ============================== architecture ===================================================================
  addTile('ceiling_a', (c) => { c.r(0, 0, T, T, 'ink'); for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (hash(x, y, 3) > 0.9) c.p(x, y, 'wood0'); c.vl(0, 0, T - 1, 'wood0'); });
  addTile('ceiling_beam', (c) => { c.r(0, 0, T, T, 'ink'); c.r(2, 0, 12, T, 'wood0'); c.vl(2, 0, T - 1, 'wood1'); c.vl(13, 0, T - 1, 'ink'); for (let y = 0; y < T; y += 4) c.p(7, y, 'wood1'); });
  addTile('cornice', (c) => { c.r(0, 0, T, 6, 'wood0'); c.hl(0, 15, 6, 'wood1'); c.hl(0, 15, 7, 'wood2'); c.hl(0, 15, 8, 'wood0'); c.r(0, 9, T, 7, 'clear'); }); // crown moulding under the ceiling
  addTile('wallpaper_a', (c) => damask(c, 5, 'purple2', 'crimsonDark', 'dusk'));
  addTile('wallpaper_b', (c) => damask(c, 6, 'purple2', 'crimsonDark', 'dusk'));
  addTile('wallpaper_dark', (c) => { damask(c, 7, 'purple2', 'crimsonDark', 'dusk'); c.r(0, 0, T, 4, 'purple'); for (let x = 0; x < T; x++) c.p(x, 4, hash(x, 1, 8) > 0.5 ? 'purple2' : 'purple'); }); // shaded under the cornice
  addTile('wain_top_l', (c) => { c.r(0, 0, T, T, 'wood1'); c.hl(0, 15, 0, 'wood5'); c.hl(0, 15, 1, 'wood4'); c.hl(0, 15, 2, 'wood1'); c.hl(0, 15, 3, 'wood0'); c.r(2, 5, 13, 11, 'wood2'); c.hl(2, 14, 5, 'wood3'); c.vl(2, 5, 15, 'wood3'); c.vl(14, 5, 15, 'wood0'); });
  addTile('wain_top_r', (c) => { c.r(0, 0, T, T, 'wood1'); c.hl(0, 15, 0, 'wood5'); c.hl(0, 15, 1, 'wood4'); c.hl(0, 15, 2, 'wood1'); c.hl(0, 15, 3, 'wood0'); c.r(0, 5, 13, 11, 'wood2'); c.hl(0, 12, 5, 'wood3'); c.vl(0, 5, 15, 'wood0'); c.vl(12, 5, 15, 'wood0'); });
  addTile('wain_mid', (c) => { c.r(0, 0, T, T, 'wood1'); c.r(2, 0, 11, T, 'wood2'); c.vl(2, 0, 15, 'wood3'); c.vl(12, 0, 15, 'wood0'); for (let y = 0; y < T; y++) if (hash(3, y, 9) > 0.8) c.p(5 + (y % 4), y, 'wood1'); });
  addTile('wain_bot', (c) => { c.r(0, 0, T, T, 'wood1'); c.r(2, 0, 11, 9, 'wood2'); c.vl(2, 0, 8, 'wood3'); c.vl(12, 0, 8, 'wood0'); c.hl(2, 12, 8, 'wood0'); c.r(0, 11, T, 5, 'wood0'); c.hl(0, 15, 11, 'wood3'); c.hl(0, 15, 12, 'wood1'); }); // panel foot and skirting board
  const floor = (c, seed, off) => { // horizontal boards: long seams, staggered butt joints
    c.r(0, 0, T, T, 'wood2');
    for (let y = 0; y < T; y++) { const band = y % 5; for (let x = 0; x < T; x++) { const t = hash(x, y, seed); c.p(x, y, band === 0 ? 'wood1' : band === 4 ? 'wood0' : t > 0.9 ? 'wood1' : t > 0.55 ? 'wood2' : 'wood3'); } }
    for (let y = 0; y < T; y += 5) c.vl((off + y * 3) % T, y, y + 4, 'wood0');
  };
  addTile('floor_a', (c) => floor(c, 11, 3));
  addTile('floor_b', (c) => floor(c, 12, 9));
  addTile('floor_c', (c) => floor(c, 13, 14));
  addTile('floor_top', (c) => { floor(c, 14, 6); c.hl(0, 15, 0, 'wood0'); c.hl(0, 15, 1, 'wood4'); }); // the lit edge where the floor meets the skirting
  addTile('floor_scrubbed', (c) => { // scrubbed boards: paler, even, no grime, seams still dark (Room 4)
    for (let y = 0; y < T; y++) { const band = y % 5; for (let x = 0; x < T; x++) c.p(x, y, band === 0 ? 'wood3' : band === 4 ? 'wood2' : hash(x, y, 15) > 0.85 ? 'wood4' : 'wood5'); }
    for (let y = 0; y < T; y += 5) c.vl((5 + y * 3) % T, y, y + 4, 'wood2');
  });
  addTile('void', (c) => { c.r(0, 0, T, T, 'ink'); for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (hash(x, y, 16) > 0.94) c.p(x, y, 'navy'); });

  // ---- Room 4 walls: cold, grey-green stipple with a dark wainscot ----
  addTile('r4_wall_a', (c) => { c.r(0, 0, T, T, 'slate0'); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const t = hash(x, y, 20); if (t > 0.86) c.p(x, y, 'slate1'); else if (t < 0.07) c.p(x, y, 'navy3'); } });
  addTile('r4_wall_b', (c) => { c.r(0, 0, T, T, 'slate0'); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const t = hash(x, y, 21); if (t > 0.88) c.p(x, y, 'slate1'); else if (t < 0.06) c.p(x, y, 'navy3'); } });
  addTile('r4_wall_shade', (c) => { c.r(0, 0, T, T, 'navy3'); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (hash(x, y, 22) > 0.88) c.p(x, y, 'slate0'); });
  addTile('r4_wain_top', (c) => { c.r(0, 0, T, T, 'wood1'); c.hl(0, 15, 0, 'wood4'); c.hl(0, 15, 1, 'wood3'); c.hl(0, 15, 2, 'wood0'); c.r(0, 3, T, 13, 'wood1'); for (let x = 0; x < T; x += 8) c.vl(x, 3, 15, 'wood0'); });
  addTile('r4_wain', (c) => { c.r(0, 0, T, T, 'wood1'); for (let x = 0; x < T; x += 8) c.vl(x, 0, 15, 'wood0'); for (let y = 0; y < T; y++) if (hash(2, y, 23) > 0.82) c.p(3 + (y % 4), y, 'wood0'); });
  addTile('r4_wain_bot', (c) => { c.r(0, 0, T, T, 'wood1'); for (let x = 0; x < T; x += 8) c.vl(x, 0, 10, 'wood0'); c.r(0, 11, T, 5, 'wood0'); c.hl(0, 15, 11, 'wood2'); });
  addTile('wall_ghost', (c) => { c.r(0, 0, T, T, 'slate1'); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (hash(x, y, 24) > 0.8) c.p(x, y, 'slate0'); }); // pale patch where a picture hung

  // ============================== the parlor =======================================================================
  addBlock('door_parlor', 3, 6, (c) => { // front door with a glass pane (the snow falling past it is the windowSnow prop)
    c.r(3, 9, 43, 87, 'wood0'); c.vl(3, 9, 95, 'wood1'); c.hl(3, 45, 9, 'wood1');
    c.r(6, 12, 37, 84, 'wood2'); c.hl(6, 42, 12, 'wood3'); c.vl(6, 12, 95, 'wood3'); c.vl(42, 12, 95, 'wood0');
    c.r(13, 18, 25, 28, 'wood0'); c.r(15, 20, 21, 24, 'navy2'); c.hl(15, 35, 20, 'navy3'); c.vl(25, 20, 43, 'wood0'); c.hl(15, 35, 31, 'wood0'); // glass with mullions
    c.r(10, 52, 29, 38, 'wood1'); c.hl(10, 38, 52, 'wood3'); c.vl(10, 52, 89, 'wood3'); c.vl(38, 52, 89, 'wood0'); c.hl(10, 38, 89, 'wood0'); c.r(14, 56, 21, 29, 'wood2'); c.hl(14, 34, 56, 'wood3'); // lower panel
    c.r(36, 56, 2, 3, 'brass1'); c.p(36, 56, 'brass2'); c.hl(2, 46, 95, 'wood0'); // knob and threshold
  });
  addBlock('fireplace', 6, 6, (c) => { // stone hearth, mantel and the dark firebox (96×96; origin x 80, y 128)
    c.r(2, 3, 92, 8, 'wood3'); c.hl(2, 93, 3, 'wood5'); c.hl(2, 93, 10, 'wood0'); c.hl(2, 93, 4, 'wood4'); // mantel shelf
    for (let y = 11; y < 96; y++) for (let x = 5; x < 91; x++) { // stone courses: 7 px high, staggered 12 px blocks
      const row = Math.floor((y - 11) / 7), off = row % 2 ? 6 : 0, edgeY = (y - 11) % 7 === 6, edgeX = (x - off) % 12 === 0;
      c.p(x, y, edgeY || edgeX ? 'iron' : hash(x >> 1, y >> 1, 30 + row) > 0.78 ? 'stone2' : hash(x, y, 31) > 0.88 ? 'stone0' : 'stone1');
    }
    c.vl(5, 11, 95, 'stone2'); c.vl(90, 11, 95, 'stone0');
    c.r(24, 44, 44, 52, 'ink'); c.hl(24, 67, 44, 'iron'); c.vl(24, 44, 95, 'iron'); c.vl(67, 44, 95, 'iron'); // the firebox opening
    c.r(27, 47, 38, 3, 'navy'); for (let x = 27; x < 65; x += 2) c.p(x, 49, 'iron');
    c.r(28, 86, 36, 2, 'iron2'); for (let x = 29; x < 63; x += 3) c.vl(x, 80, 88, 'iron2'); // the grate
    c.r(11, 94, 74, 2, 'stone2'); c.hl(11, 84, 94, 'stone4'); // hearth stone
    c.r(12, 0, 2, 7, 'linen2'); c.p(12, 0, 'amberHi'); c.p(13, 0, 'kerosene'); c.r(75, 0, 2, 7, 'linen2'); c.p(75, 0, 'amberHi'); c.p(76, 0, 'kerosene'); // candles on the mantel
    c.r(44, 0, 6, 7, 'wood1'); c.r(45, 1, 4, 5, 'linen1'); c.p(46, 2, 'ink'); c.p(47, 3, 'ink'); c.p(48, 3, 'ink'); // the little clock
  });
  addBlock('photo_frame', 3, 2, (c) => { // framed photograph of a mine crew in front of an adit (48×32; brass plate too tarnished to read)
    c.r(3, 2, 42, 28, 'brass1'); c.hl(3, 44, 2, 'brass2'); c.vl(3, 2, 29, 'brass2'); c.hl(3, 44, 29, 'brass0'); c.vl(44, 2, 29, 'brass0');
    c.r(6, 5, 36, 20, 'paperInkDim'); c.r(7, 6, 34, 18, 'stone1'); c.r(7, 6, 34, 7, 'stone2'); c.r(34, 10, 7, 14, 'ink');
    for (let i = 0; i < 20; i++) { const x = 9 + i + (i % 3), y = 17 + (i % 2) * 2; c.p(x, y, 'ink'); c.p(x, y + 1, 'ink'); c.p(x, y - 1, 'linen0'); } // twenty-odd men squinting at the camera
    c.r(18, 26, 12, 3, 'brass0'); c.hl(19, 28, 27, 'brass1'); // the tarnished plate
  });
  addBlock('keyrack', 6, 4, (c) => { // pigeonholes behind the desk (96×64): 6 columns × 3 rows
    wood(c, 0, 0, 96, 64, 'wood1', 'wood3', 'wood0');
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const x = 3 + k * 15, y = 4 + r * 19; c.r(x, y, 12, 16, 'ink'); c.hl(x, x + 11, y, 'navy3'); if (hash(k, r, 40) > 0.55) c.r(x + 2, y + 9, 8, 5, 'linen1'); if (hash(k, r, 41) > 0.7) c.r(x + 3, y + 5, 6, 8, 'linen0'); } // letters and bills
  });
  addBlock('keyrow', 6, 1, (c) => { // the keys hung beneath, numbered 1–6; number 4 is missing (Room 4's key)
    c.hl(2, 93, 1, 'brass0');
    for (let k = 0; k < 6; k++) { const x = 8 + k * 15; if (k === 3) { c.p(x, 3, 'brass0'); continue; } c.vl(x, 2, 7, 'brass1'); c.r(x - 2, 8, 5, 4, 'brass2'); c.p(x, 9, 'ink'); c.p(x - 1, 13, 'linen1'); c.p(x + 1, 13, 'linen1'); }
  });
  addBlock('staircase', 7, 9, (c) => { // the stairs up to the rooms (112×144; origin x 480, y 80): newel, 9 treads, banister
    // newel post + cap at the foot
    c.r(12, 82, 7, 62, 'wood3'); c.vl(12, 82, 143, 'wood4'); c.vl(18, 82, 143, 'wood1'); c.r(10, 78, 11, 5, 'wood4'); c.hl(10, 20, 78, 'wood5'); c.r(13, 74, 5, 4, 'wood3');
    for (let k = 0; k < 9; k++) { // tread k: run 10, rise 9
      const x0 = 21 + k * 10, yTop = 135 - k * 9;
      c.r(x0, yTop, 10, 144 - yTop, 'wood1'); // riser face and everything beneath it
      c.r(x0, yTop, 11, 2, 'wood4'); c.hl(x0, x0 + 10, yTop, 'wood5'); // tread nosing, lit
      c.vl(x0, yTop + 2, 143, 'wood0'); for (let y = yTop + 3; y < 144; y += 4) c.p(x0 + 4, y, 'wood0');
    }
    for (let k = 0; k < 91; k++) { const x = 21 + k, y = 138 - Math.round(k * 0.93); c.p(x, y - 1, 'wood4'); c.p(x, y, 'wood2'); } // the banister rail
    for (let k = 0; k <= 8; k++) { const x = 24 + k * 10, y = 138 - Math.round((x - 21) * 0.93); c.vl(x, y + 2, y + 15, 'wood2'); c.vl(x + 1, y + 2, y + 15, 'wood0'); } // balusters
  });
  addBlock('landing', 3, 3, (c) => { // the dark opening on the upper landing (48×48), a beam above and a railing in front
    c.r(0, 0, 48, 48, 'ink'); for (let x = 0; x < 48; x++) for (let y = 0; y < 48; y++) if (hash(x, y, 42) > 0.95) c.p(x, y, 'navy');
    c.r(0, 0, 48, 4, 'wood0'); c.hl(0, 47, 4, 'wood1'); c.vl(0, 0, 47, 'wood0');
    c.r(0, 38, 48, 3, 'wood2'); c.hl(0, 47, 38, 'wood4'); for (let x = 3; x < 48; x += 8) c.vl(x, 41, 47, 'wood1');
  });
  const sconce = (c, cx) => { // brass sconce with a glass chimney; the lit flame lives on the glow layer (16×32, flame at y 11–19)
    c.r(cx - 2, 20, 5, 3, 'brass1'); c.hl(cx - 2, cx + 2, 20, 'brass2'); c.r(cx - 1, 23, 3, 5, 'brass0'); c.r(cx - 3, 12, 7, 8, 'wood0'); c.r(cx - 2, 12, 5, 8, 'brass0'); c.hl(cx - 3, cx + 3, 11, 'brass1');
  };
  addBlock('sconce_a', 1, 2, (c) => sconce(c, 7));
  addBlock('sconce_b', 1, 2, (c) => sconce(c, 13));
  addBlock('sconce_c', 1, 2, (c) => sconce(c, 3));
  addTile('sconce_flame_a', (c) => { c.r(5, 13, 5, 7, 'flame3'); c.r(6, 11, 3, 3, 'flame5'); c.p(7, 10, 'flame6'); }); // glow layer, tile (col 11, row 8) matches sconce_a
  addTile('sconce_flame_b', (c) => { c.r(11, 13, 5, 7, 'flame3'); c.r(12, 11, 3, 3, 'flame5'); c.p(13, 10, 'flame6'); });
  addTile('sconce_flame_c', (c) => { c.r(1, 13, 5, 7, 'flame3'); c.r(2, 11, 3, 3, 'flame5'); c.p(3, 10, 'flame6'); });

  // ============================== Room 4 =============================================================================
  addBlock('door_r4', 3, 6, (c) => { // plain door with the brass 4 above it (48×96; origin y 128; door top at 145)
    c.r(11, 17, 36, 79, 'wood0'); c.vl(11, 17, 95, 'wood1'); c.hl(11, 46, 17, 'wood1');
    c.r(14, 20, 30, 76, 'wood2'); c.hl(14, 43, 20, 'wood3'); c.vl(14, 20, 95, 'wood3'); c.vl(43, 20, 95, 'wood0');
    c.r(18, 26, 22, 28, 'wood1'); c.hl(18, 39, 26, 'wood3'); c.vl(18, 26, 53, 'wood3'); c.vl(39, 26, 53, 'wood0'); c.r(18, 60, 22, 30, 'wood1'); c.hl(18, 39, 60, 'wood3'); c.vl(18, 60, 89, 'wood3'); c.vl(39, 60, 89, 'wood0');
    c.r(36, 58, 2, 3, 'brass1'); c.p(36, 58, 'brass2');
    c.r(22, 4, 7, 9, 'wood0'); c.hl(23, 27, 5, 'brass2'); c.vl(23, 5, 8, 'brass2'); c.hl(23, 27, 8, 'brass2'); c.vl(27, 5, 12, 'brass2'); // the number 4
  });
  addBlock('wardrobe', 4, 7, (c) => { // tall two-door wardrobe (64×112; origin x 64, y 112): empty, smelling of lye and cedar
    wood(c, 2, 7, 60, 105, 'wood2', 'wood4', 'wood0'); c.r(0, 2, 64, 6, 'wood1'); c.hl(0, 63, 2, 'wood4'); c.hl(0, 63, 7, 'wood0'); // cornice
    for (const x0 of [6, 34]) { c.r(x0, 14, 24, 88, 'wood1'); c.hl(x0, x0 + 23, 14, 'wood3'); c.vl(x0, 14, 101, 'wood3'); c.vl(x0 + 23, 14, 101, 'wood0'); c.r(x0 + 3, 18, 18, 38, 'wood2'); c.hl(x0 + 3, x0 + 20, 18, 'wood3'); c.r(x0 + 3, 62, 18, 34, 'wood2'); c.hl(x0 + 3, x0 + 20, 62, 'wood3'); }
    c.r(29, 52, 2, 6, 'brass1'); c.r(33, 52, 2, 6, 'brass1'); c.r(2, 104, 60, 8, 'wood0'); c.hl(2, 61, 104, 'wood1');
  });
  addBlock('washstand', 3, 3, (c) => { // washstand with a basin and jug, a candle (48×48; origin x 128, y 176)
    wood(c, 4, 20, 40, 5, 'wood3', 'wood5', 'wood0'); c.r(6, 25, 36, 20, 'wood1'); c.hl(6, 41, 25, 'wood3'); c.r(9, 29, 30, 14, 'wood2'); c.hl(9, 38, 29, 'wood3'); c.r(22, 34, 4, 2, 'brass1'); // drawer
    c.r(5, 45, 4, 3, 'wood0'); c.r(39, 45, 4, 3, 'wood0');
    c.r(8, 14, 16, 6, 'linen2'); c.hl(8, 23, 14, 'linen3'); c.hl(10, 21, 15, 'linen1'); // basin, scoured so hard the glaze has gone dull
    c.r(27, 4, 8, 16, 'linen1'); c.hl(27, 34, 4, 'linen2'); c.vl(34, 6, 18, 'linen0'); c.r(25, 7, 3, 7, 'linen0'); // jug and its handle
    c.r(38, 8, 3, 12, 'linen2'); c.p(39, 7, 'amberHi'); c.p(39, 6, 'kerosene'); // candle
  });
  addTile('stool', (c) => { c.r(3, 6, 10, 3, 'wood3'); c.hl(3, 12, 6, 'wood5'); c.vl(4, 9, 15, 'wood1'); c.vl(11, 9, 15, 'wood1'); c.hl(4, 11, 12, 'wood0'); });
  addBlock('window_r4', 4, 5, (c) => { // the window onto the night: frame, snow on the sill (64×80; glass at local x 3…47, y 2…61, snow is a prop)
    c.r(0, 0, 54, 74, 'wood0'); c.vl(0, 0, 73, 'wood1'); c.hl(0, 53, 0, 'wood1');
    c.r(3, 2, 48, 66, 'navy'); for (let x = 3; x < 51; x++) for (let y = 2; y < 68; y++) if (hash(x, y, 50) > 0.985) c.p(x, y, 'snow3'); // a few stars of snow and sky
    c.vl(26, 2, 67, 'wood0'); c.vl(27, 2, 67, 'wood1'); c.hl(3, 50, 34, 'wood0'); c.hl(3, 50, 35, 'wood1');
    c.r(0, 68, 58, 5, 'wood2'); c.hl(0, 57, 68, 'wood4'); c.hl(0, 57, 72, 'wood0'); // sill
  });
  addBlock('bed', 8, 5, (c) => { // iron bed, purple quilt, one pillow (128×80; origin x 304, y 144)
    c.r(4, 22, 3, 58, 'iron2'); c.r(120, 14, 4, 66, 'iron2'); c.vl(4, 22, 79, 'stone2'); c.vl(120, 14, 79, 'stone2'); c.r(2, 18, 8, 4, 'iron2'); c.r(118, 10, 8, 4, 'iron2'); c.hl(2, 9, 18, 'stone4'); c.hl(118, 125, 10, 'stone4'); // posts, finials
    c.r(4, 34, 4, 2, 'iron'); c.r(4, 50, 120, 2, 'iron2'); c.hl(4, 123, 50, 'stone2'); // side rail
    c.r(7, 40, 113, 16, 'purple2'); c.hl(7, 119, 40, 'dusk'); c.hl(7, 119, 41, 'purple'); for (let x = 9; x < 118; x += 6) c.vl(x, 43, 54, 'purple'); c.hl(7, 119, 55, 'ink'); // the quilt, stitched
    c.r(92, 32, 26, 10, 'linen2'); c.hl(92, 117, 32, 'linen3'); c.hl(93, 116, 41, 'linen0'); c.vl(92, 33, 40, 'linen1'); // pillow
    c.r(7, 56, 113, 3, 'linen1'); c.hl(7, 119, 56, 'linen2'); // sheet hem
    c.r(8, 60, 112, 20, 'clear'); c.r(8, 71, 8, 9, 'wood0'); c.r(108, 71, 8, 9, 'wood0'); // dark under the bed
  });
}

build();
writeTileset(root, 'hotel_interior', { tiles, names, addTile }, 'tools/data/hotel_tiles.json');
