// PASS 2 bootstrap for Crow's Hollow Main Street (scene VILLAGE): replaces the Pass 1 playfield (a stitched crop of
// the old painted town image) with a tile-built street. 45×17 tiles of 16 px (720 px = 480 units, as before).
//   cabin (logs, pitched snow roof, chimney, the watcher's window) · Rusk's false-front store (clapboard, lettered
//   board, cracked shop window, porch awning) · the street lamp · rutted street snow with a hitching rail, stump and
//   cordwood · the barred woodshed at the east end.
// Tilesets: Black Ram (logs, windows, lamp, boardwalk, snow) + station (pitched roof) + sawmill (fence, barrel, crate,
// planks, roof snow, cordwood) + main_street_exterior (the rest). Objects and the parallax group are kept as they are.
//
// Run ONCE. After that the map belongs to Tiled. Refuses to run on a map that already has tile layers unless --force.
//
//   node tools/make-main-street-tileset.mjs && node tools/make-main-street-level.mjs [--force]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const file = resolve(root, 'assets/levels/main_street.tmj');
const map = JSON.parse(readFileSync(file, 'utf8'));
if (map.layers.some((l) => l.type === 'tilelayer') && !process.argv.includes('--force')) {
  console.error('main_street.tmj already has tile layers; Tiled owns it. Use --force to rebuild the layers (objects are kept).');
  process.exit(1);
}
const load = (f) => JSON.parse(readFileSync(resolve(root, f), 'utf8'));
const STT = load('tools/data/station_tiles.json'), SAW = load('tools/data/sawmill_tiles.json'), MS = load('tools/data/main_street_tiles.json');
const BR = 1, ST = 41, SM = 105, MST = 241; // firstgids: black_ram (40), station (64), sawmill (136), main_street (48)
const need = (tbl, base, name) => { if (!(name in tbl)) throw new Error('unknown tile ' + name); return base + tbl[name]; };
const st = (n) => need(STT, ST, n), sm = (n) => need(SAW, SM, n), ms = (n) => need(MS, MST, n), br = (i) => BR + i;
const FLIP_H = 0x80000000;
const B = { wall: 0, wallShadow: 1, beam: 4, boardwalk: 5, snowTop: 7, snowFill: 8, win: 9, chimney: 30, chimneyTop: 31, lampTop: 32, lampPole: 33, lampGlow: 34, wallEndL: 37, wallEndR: 38 };

const COLS = 45, ROWS = 17;
const layer = () => new Array(COLS * ROWS).fill(0);
const put = (l, c, r, gid) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) l[r * COLS + c] = gid; };
const blk = (l, ts, name, c, r, wt, ht) => { for (let j = 0; j < ht; j++) for (let i = 0; i < wt; i++) put(l, c + i, r + j, ts(`${name}_${j}_${i}`)); };
const brBlock = (l, first, c, r, wt, ht) => { for (let j = 0; j < ht; j++) for (let i = 0; i < wt; i++) put(l, c + i, r + j, br(first + j * wt + i)); };

const ground = layer(), wall = layer(), struct = layer(), roof = layer(), glow = layer();

// ---- ground: snow crust at y 224; boardwalk in front of the store; rutted street; prints toward the hotel ----
for (let c = 0; c < COLS; c++) { put(ground, c, 14, br(B.snowTop)); put(ground, c, 15, br(B.snowFill)); put(ground, c, 16, br(B.snowFill)); }
for (let c = 13; c <= 23; c++) put(ground, c, 14, br(B.boardwalk));
for (let c = 25; c <= 37; c++) put(ground, c, 14, ms(c % 2 ? 'street_a' : 'street_b'));
for (const c of [27, 28, 31]) put(ground, c, 14, ms(c % 2 ? 'street_prints_a' : 'street_prints_b')); // one set of prints along the street, east

// ---- the cabin: logs under a pitched snow roof (cols 1–12), chimney, two windows (the left one is the watcher's) ----
const slope = (c) => (c <= 6 ? c - 1 : 12 - c), PITCH = 3, EAVE_Y = 132;
for (let c = 1; c <= 12; c++) {
  const i = slope(c), y = EAVE_Y - PITCH * i, r0 = Math.floor(y / 16), a = y - r0 * 16, flip = c > 6 ? FLIP_H : 0;
  put(roof, c, r0, st(`roof_slope_${a}`) | flip);
  if (a + 10 >= 16) put(roof, c, r0 + 1, st(`roof_slope_${a - 16}`) | flip);
  if (i <= 1) put(roof, c, 9, st('eave_icicles'));
  if (c >= 2 && c <= 11) { const top = Math.floor((y + 9) / 16); for (let r = top; r <= 13; r++) put(wall, c, r, br(c === 2 ? B.wallEndL : c === 11 ? B.wallEndR : r === top ? B.wallShadow : B.wall)); }
}
put(struct, 9, 5, br(B.chimneyTop)); for (let r = 6; r <= 7; r++) put(struct, 9, r, br(B.chimney));
brBlock(struct, B.win, 5, 10, 2, 2); // x 80–111: where the watcher stands (the watcher prop draws the lamp-lit figure)
brBlock(struct, B.win, 8, 10, 2, 2);
blk(struct, ms, 'door_dark', 3, 11, 2, 3);
put(struct, 2, 13, ms('doorstep_drift'));

// ---- Rusk's general store: false front, lettered board, cracked window, porch awning (cols 13–23) ----
for (let c = 13; c <= 23; c++) {
  put(roof, c, 7, sm(c % 2 ? 'roof_snow_a' : 'roof_snow_b'));
  put(struct, c, 9, br(B.beam)); // awning with icicles
  for (let r = 10; r <= 13; r++) put(wall, c, r, ms(r === 10 ? 'siding_shadow' : (c + r) % 2 ? 'siding_a' : 'siding_b'));
}
put(struct, 13, 8, ms('parapet')); put(struct, 23, 8, ms('parapet')); blk(struct, ms, 'sign_rusk', 14, 8, 9, 1);
for (let r = 8; r <= 13; r++) { put(wall, 13, r, ms('siding_end_l')); put(wall, 23, r, ms('siding_end_r')); }
blk(struct, ms, 'shop_window', 14, 11, 5, 2);
blk(struct, ms, 'door_dark', 20, 11, 2, 3);
for (const c of [13, 23]) { for (let r = 10; r <= 12; r++) put(struct, c, r, ms('eave_post')); put(struct, c, 13, ms('eave_post_foot')); }

// ---- the street lamp (lit in the evening, out at night: st lamp text) ----
put(struct, 24, 9, br(B.lampTop)); for (let r = 10; r <= 13; r++) put(struct, 24, r, br(B.lampPole)); put(glow, 24, 9, br(B.lampGlow));
put(struct, 12, 13, sm('barrel')); put(struct, 25, 13, sm('crate'));

// ---- the street: hitching rail, a stump, cordwood stacked beside the shed ----
put(struct, 28, 13, sm('fence_post')); put(struct, 29, 13, sm('fence_span')); put(struct, 30, 13, sm('fence_post'));
put(struct, 33, 13, sm('stump'));
blk(struct, sm, 'logstack', 34, 12, 3, 2);

// ---- the woodshed, barred from outside (cols 38–44) ----
for (let c = 38; c <= 44; c++) {
  put(roof, c, 8, sm(c === 38 ? 'roof_end_l' : c === 44 ? 'roof_end_r' : c % 2 ? 'roof_board' : 'roof_board_b'));
  for (let r = 9; r <= 13; r++) put(wall, c, r, sm(r === 9 ? 'plank_top' : (c + r) % 2 ? 'plank_a' : 'plank_b'));
}
for (const c of [38, 44]) { for (let r = 9; r <= 12; r++) put(struct, c, r, sm('post')); put(struct, c, 13, sm('post_foot')); }
for (let c = 38; c <= 44; c++) put(roof, c, 7, sm(c % 2 ? 'roof_snow_a' : 'roof_snow_b'));
blk(struct, ms, 'shed_door', 39, 11, 3, 3);
put(struct, 43, 11, ms('shed_window'));
put(struct, 37, 13, sm('drift_a'));

// ---- assemble the map ----
const keep = (n) => map.layers.find((l) => l.name === n);
const parallax = keep('parallax'), objects = keep('gameplay'), foreground = keep('foreground');
const P = (name, type, value) => ({ name, type, value });
let id = 1;
const renum = (l) => { l.id = id++; if (l.layers) l.layers.forEach(renum); return l; };
const tl = (name, data, props = []) => ({ id: id++, name, type: 'tilelayer', width: COLS, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data, ...(props.length ? { properties: props } : {}) });
renum(parallax);
const layers = [parallax, tl('ground', ground), tl('wall', wall), tl('structure', struct), tl('roof', roof),
  tl('glow_evening', glow, [P('role', 'string', 'glow'), P('phase', 'string', 'EVENING')]), renum(objects), renum(foreground)];
map.layers = layers;
map.tilesets = [
  { firstgid: BR, source: 'tilesets/black_ram_exterior.tsj' }, { firstgid: ST, source: 'tilesets/station_exterior.tsj' },
  { firstgid: SM, source: 'tilesets/sawmill_exterior.tsj' }, { firstgid: MST, source: 'tilesets/main_street_exterior.tsj' },
];
map.nextlayerid = id;
writeFileSync(file, JSON.stringify(map, null, 1) + String.fromCharCode(10));
console.log('main_street.tmj rebuilt: 45×17 tiles (cabin, store, lamp, street, woodshed)');
