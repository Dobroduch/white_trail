// PASS 2 bootstrap for Blackwood Station: turns the layout-only map (assets/levels/blackwood_station.tmj, made by
// migrate-scene-to-tiled.mjs) into a tile-built level:
//   * 54×17 tiles of 16 px (864 px = a 576-unit scene; the road end gains 16 units)
//   * parallax image layers (the existing Pixelorama sky, ranges, pines), a fog band and a TRACK BED tile layer behind
//     the train, then deck · wall · structure · roof tile layers, a glow layer for the lit window and lamp, a wires
//     image layer, and the existing foreground drifts
//   * the map property `painter` is removed, so Tiled is the only source of the station's art
// Objects (conductor, clues, exits, spawns, lights, the train prop, the intro event) are left exactly as they are.
//
// Run ONCE. After that the map belongs to Tiled. Refuses to run on a map that already has tile layers unless --force.
//
//   node tools/make-station-tileset.mjs && node tools/make-station-level.mjs [--force]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTE as C } from '../src/data/palette.js';
import { encodePNG } from './lib/png.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const file = resolve(root, 'assets/levels/blackwood_station.tmj');
const map = JSON.parse(readFileSync(file, 'utf8'));
if (map.layers.some((l) => l.type === 'tilelayer') && !process.argv.includes('--force')) {
  console.error('blackwood_station.tmj already has tile layers; Tiled owns it. Use --force to rebuild the layers (objects are kept).');
  process.exit(1);
}
const ID = JSON.parse(readFileSync(resolve(root, 'tools/data/station_tiles.json'), 'utf8'));
const FLIP_H = 0x80000000;
const BR = 1, ST = 41; // firstgid of black_ram_exterior / station_exterior
const S = (name) => { if (!(name in ID)) throw new Error('unknown station tile ' + name); return ST + ID[name]; };
// Black Ram tile indices used here (see assets/source/pixelorama/tilesets/scripts/README.md)
const B = { wall: 0, wallShadow: 1, boardwalk: 5, snowFill: 8, win: 9, winLit: 13, door: 17, chimney: 30, chimneyTop: 31, lampTop: 32, lampPole: 33, lampGlow: 34, wallEndL: 37, wallEndR: 38 };
const G = (i) => BR + i;

const COLS = 54, ROWS = 17;
const layer = () => new Array(COLS * ROWS).fill(0);
const put = (l, col, row, gid) => { if (col >= 0 && col < COLS && row >= 0 && row < ROWS) l[row * COLS + col] = gid; };
const blk = (l, name, col, row, wt, ht) => { for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) put(l, col + c, row + r, S(`${name}_${r}_${c}`)); };
const brBlock = (l, first, col, row, wt, ht) => { for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) put(l, col + c, row + r, G(first + r * wt + c)); };
const h = (a, b, s = 0) => { let n = Math.imul(a * 374761393 + b * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) % 1024 / 1024; };

const trackbed = layer(), deck = layer(), wall = layer(), struct = layer(), roof = layer(), glow = layer();

// ---- track bed behind the train: snow-crusted ballast bank, rails and sleepers (rail head at native y 213) ----
for (let c = 0; c < COLS; c++) { put(trackbed, c, 12, S(`bank_top_${Math.floor(h(c, 1, 3) * 4)}`)); put(trackbed, c, 13, S('rails')); }

// ---- the platform deck, full width: boards over a bank of snow ----
for (let c = 0; c < COLS; c++) { put(deck, c, 14, G(B.boardwalk)); put(deck, c, 15, G(B.snowFill)); put(deck, c, 16, G(B.snowFill)); }

// ---- the station house: log walls under a pitched snow roof, cols 29–46 ----
const slope = (c) => (c <= 37 ? c - 29 : 46 - c); // tiles from the eave
const PITCH = 3, EAVE_Y = 132; // roof surface at the eave, native y
for (let c = 29; c <= 46; c++) {
  const i = slope(c), y = EAVE_Y - PITCH * i, r0 = Math.floor(y / 16), a = y - r0 * 16, flip = c > 37 ? FLIP_H : 0;
  put(roof, c, r0, S(`roof_slope_${a}`) | flip);
  if (a + 10 >= 16) put(roof, c, r0 + 1, S(`roof_slope_${a - 16}`) | flip);
  if (i <= 1) put(roof, c, 9, S('eave_icicles'));
  if (c >= 30 && c <= 45) {
    const top = Math.floor((y + 9) / 16);
    for (let r = top; r <= 13; r++) put(wall, c, r, c === 30 ? G(B.wallEndL) : c === 45 ? G(B.wallEndR) : G(r === top ? B.wallShadow : B.wall));
  }
}
for (let r = 5; r <= 7; r++) put(struct, 40, r, G(B.chimney)); put(struct, 40, 4, G(B.chimneyTop)); // chimney poking through the roof
blk(struct, 'sign_blackwood', 34, 8, 6, 1);
brBlock(struct, B.win, 32, 10, 2, 2); // waiting room: dark (st_waiting looks through it)
brBlock(struct, B.win, 39, 10, 2, 2); brBlock(glow, B.winLit, 39, 10, 2, 2); // telegraph office: a lamp still burns (st_telegraph)
blk(struct, 'tel_plate', 39, 12, 2, 1);
brBlock(struct, B.door, 35, 11, 2, 3); // front door: 32×48
blk(struct, 'timetable', 42, 10, 2, 2); // the chalk board with the same word beside every return train (st_timetable)

// ---- lamp post, freight (st_freight), telegraph pole ----
put(struct, 24, 9, G(B.lampTop)); for (let r = 10; r <= 13; r++) put(struct, 24, r, G(B.lampPole)); put(glow, 24, 9, G(B.lampGlow));
blk(struct, 'freight', 27, 12, 3, 2);
put(roof, 46, 6, S('pole_cross_l')); put(roof, 47, 6, S('pole_cross_m')); put(roof, 48, 6, S('pole_cross_r'));
for (let r = 7; r <= 12; r++) put(struct, 47, r, S('pole')); put(struct, 47, 13, S('pole_foot'));

// ---- the telegraph wires: two catenaries from the left edge to the crossarm (and on past it), an image layer ----
const WW = COLS * 16, WH = ROWS * 16, wimg = new Uint8Array(WW * WH * 4);
const wp = (x, y, name) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= WW || y >= WH) return; const hex = C[name]; wimg.set([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255], (y * WW + x) * 4); };
for (const [dy, name] of [[0, 'slate2'], [5, 'slate1']]) {
  for (let x = 0; x <= 739; x++) wp(x, 102 + dy + Math.sin((x / 739) * Math.PI) * 12, name); // sags between the last pole and this one
  for (let x = 740; x < WW; x++) wp(x, 102 + dy + ((x - 740) / (WW - 740)) * 6, name);
}
mkdirSync(resolve(root, 'assets/export/levels'), { recursive: true });
writeFileSync(resolve(root, 'assets/export/levels/station_wires.png'), encodePNG(WW, WH, wimg));

// ---- assemble the map ----
const objectsLayer = map.layers.find((l) => l.type === 'objectgroup');
const east = objectsLayer.objects.find((o) => o.name === 'eastEdge'); // the road end moved 16 units east with the wider map
if (east) east.x = WW - 12;
const P = (name, type, value) => ({ name, type, value });
let id = 1;
const img = (name, image, extra = {}) => ({ id: id++, name, type: 'imagelayer', image, opacity: 1, visible: true, x: 0, y: 0, ...extra });
const tl = (name, data, props = []) => ({ id: id++, name, type: 'tilelayer', width: COLS, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data, ...(props.length ? { properties: props } : {}) });
const par = '../export/environments/parallax/';
const parallax = { id: id++, name: 'parallax', type: 'group', opacity: 1, visible: true, x: 0, y: 0, layers: [
  img('sky', par + 'station_sky.png', { parallaxx: 0 }),
  img('mountains_far', par + 'station_mountains_far.png', { parallaxx: 0.08, repeatx: true }),
  img('mountains_near', par + 'station_mountains_near.png', { parallaxx: 0.2, repeatx: true }),
  img('pines', par + 'station_pines.png', { parallaxx: 0.4, repeatx: true }),
] };
objectsLayer.id = id++;
map.layers = [
  parallax,
  img('haze', par + 'station_haze.png', { repeatx: true, properties: [P('role', 'string', 'back')] }),
  tl('trackbed', trackbed, [P('role', 'string', 'back')]), // behind the train prop; rails and sleepers
  tl('deck', deck), tl('wall', wall), tl('structure', struct), tl('roof', roof),
  img('wires', '../export/levels/station_wires.png'),
  tl('glow', glow, [P('role', 'string', 'glow')]),
  objectsLayer,
  img('foreground', '../export/environments/station/front.png', { repeatx: true, properties: [P('role', 'string', 'front')] }),
];
map.width = COLS; map.height = ROWS; map.tilewidth = 16; map.tileheight = 16;
map.tilesets = [{ firstgid: BR, source: 'tilesets/black_ram_exterior.tsj' }, { firstgid: ST, source: 'tilesets/station_exterior.tsj' }];
map.properties = map.properties.filter((p) => p.name !== 'painter');
map.nextlayerid = id;
writeFileSync(file, JSON.stringify(map, null, 1) + String.fromCharCode(10));
console.log('blackwood_station.tmj rebuilt: 54×17 tiles, track bed, house, pole, wires; painter property removed');
