// PASS 2 bootstrap for the Old Sawmill: turns the layout-only map (assets/levels/old_sawmill.tmj, made by
// migrate-scene-to-tiled.mjs) into a full tile-built level:
//   * the map becomes 54×17 tiles of 16 px (864 px = a 576-unit scene; the creek end gains 16 units)
//   * tile layers  ground · back_wall · structure · details   from the Black Ram + sawmill tilesets
//   * the existing Pixelorama parallax PNGs (sky, far range, ridge, pines, foreground) become image layers
//   * the map property `painter` is removed, so Tiled is now the only source of the scene's art
// Objects (clues, exits, spawns, lights, events…) are left exactly as they are.
//
// Run it ONCE. After that the map belongs to Tiled: edit it there. The script refuses to run on a map that
// already has tile layers unless you pass --force (which rebuilds the layers, keeping the objects).
//
//   node tools/make-sawmill-tileset.mjs && node tools/make-sawmill-level.mjs [--force]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const file = resolve(root, 'assets/levels/old_sawmill.tmj');
const map = JSON.parse(readFileSync(file, 'utf8'));
if (map.layers.some((l) => l.type === 'tilelayer') && !process.argv.includes('--force')) {
  console.error('old_sawmill.tmj already has tile layers; Tiled owns it. Use --force to rebuild the layers (objects are kept).');
  process.exit(1);
}
const ID = JSON.parse(readFileSync(resolve(root, 'tools/data/sawmill_tiles.json'), 'utf8'));
const FLIP_H = 0x80000000;
const BR = 1, SM = 41; // firstgid of black_ram_exterior / sawmill_exterior
const brSnowTop = BR + 7, brSnowFill = BR + 8;
const S = (name) => { if (!(name in ID)) throw new Error('unknown sawmill tile ' + name); return SM + ID[name]; };

const COLS = 54, ROWS = 17;
const layer = () => new Array(COLS * ROWS).fill(0);
const put = (l, col, row, gid) => { if (col >= 0 && col < COLS && row >= 0 && row < ROWS) l[row * COLS + col] = gid; };
const block = (l, name, col, row, wt, ht) => { for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) put(l, col + c, row + r, S(`${name}_${r}_${c}`)); };
const h = (a, b, s = 0) => { let n = Math.imul(a * 374761393 + b * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) % 1024 / 1024; };

const ground = layer(), wall = layer(), struct = layer(), detail = layer();

// ---- ground: snow crust at y 224, snow below; sawdust floor inside the shed; the creek on the right ----
for (let c = 0; c <= 45; c++) { put(ground, c, 14, brSnowTop); put(ground, c, 15, brSnowFill); put(ground, c, 16, brSnowFill); }
for (let c = 12; c <= 30; c++) put(ground, c, 14, S('sawdust_top'));
put(ground, 23, 14, S('sawdust_ash'));
for (const c of [26, 28]) put(ground, c, 14, S(c === 26 ? 'sawdust_prints_a' : 'sawdust_prints_b')); // boot impressions under the roof edge
for (let c = 3; c <= 10; c += 2) put(ground, c, 14, S(c % 4 === 3 ? 'snow_prints_a' : 'snow_prints_b')); // one set of prints coming in from the bridge
for (let c = 38; c <= 45; c++) put(ground, c, 14, S(c % 2 ? 'furrow_a' : 'furrow_b')); // drag furrow, creek bank toward the wheel
put(ground, 46, 14, S('bank')); put(ground, 46, 15, S('water')); put(ground, 46, 16, S('water'));
for (let c = 47; c < COLS; c++) { put(ground, c, 14, S('ice_edge')); put(ground, c, 15, S('water')); put(ground, c, 16, S('water')); }

// ---- the shed: hanging broken planks between four posts, snow-laden board roof ----
const posts = [12, 18, 25, 30];
for (let c = 13; c <= 29; c++) {
  if (posts.includes(c)) continue;
  const depth = 2 + Math.floor(h(c, 1, 5) * 3); // rows of plank that survive below the roof (2–4)
  for (let r = 9; r < 9 + depth; r++) put(wall, c, r, r === 9 ? S('plank_top') : S(h(c, r, 6) > 0.8 ? (h(c, r, 7) > 0.5 ? 'plank_gap_l' : 'plank_gap_r') : (c + r) % 2 ? 'plank_a' : 'plank_b'));
  put(wall, c, 9 + depth, S(h(c, 2, 8) > 0.5 ? 'plank_end_a' : 'plank_end_b'));
}
for (const c of posts) { for (let r = 9; r <= 12; r++) put(struct, c, r, S('post')); put(struct, c, 13, S('post_foot')); }
put(struct, 11, 8, S('roof_end_l')); put(struct, 31, 8, S('roof_end_r'));
for (let c = 12; c <= 30; c++) put(struct, c, 8, S(c % 3 ? 'roof_board' : 'roof_board_b'));
put(struct, 11, 7, 0); for (let c = 12; c <= 30; c++) put(struct, c, 7, S(c % 2 ? 'roof_snow_a' : 'roof_snow_b'));
for (let c = 13; c <= 24; c++) put(struct, c, 13, S('rail')); // the carriage rail
put(struct, 11, 13, S('drift_l')); put(struct, 31, 13, S('drift_a'));
block(detail, 'log', 14, 12, 7, 2); // log on the carriage (x 224–336)
block(detail, 'blade', 21, 12, 2, 2); // blade (centre 352, 208)

// ---- the wheel frame: two posts, a snow-topped beam, braces, rope and the stopped wheel ----
put(struct, 32, 5, S('beam_end_l')); for (let c = 33; c <= 44; c++) put(struct, c, 5, S('beam_h')); put(struct, 36, 5, S('rope_burn')); put(struct, 45, 5, S('beam_end_r'));
for (let r = 6; r <= 13; r++) { put(struct, 32, r, S(r === 11 ? 'post_marks' : r === 12 ? 'post_marks_b' : 'post_edge_r')); put(struct, 45, r, S('post_edge_l')); }
put(struct, 32, 13, S('post_edge_r'));
put(struct, 33, 10, S('cleat_r'));
put(struct, 33, 6, S('brace_up')); put(struct, 44, 6, S('brace_up') | FLIP_H);
block(detail, 'wheel', 39, 8, 6, 6);
// rope: from the burn on the beam (x≈586) down to the cleat on the post (x≈532, y 174), drawn as a rope block
// (tiles named rope_r_c in the tileset when present; otherwise skipped)
if (ID.rope_0_0 !== undefined) block(detail, 'rope', 33, 6, 4, 5);
put(detail, 33, 13, S('drift_r'));

// ---- the approach: cordwood, a stump, a broken fence with a gap, and the MILL board ----
block(detail, 'logstack', 0, 12, 3, 2);
put(detail, 3, 13, S('stump'));
put(detail, 4, 13, S('fence_post')); put(detail, 5, 13, S('fence_span')); put(detail, 6, 13, S('fence_post')); put(detail, 7, 13, S('fence_span')); put(detail, 8, 13, S('fence_broken'));
block(detail, 'sign', 9, 12, 2, 2);

// ---- assemble the map ----
const objectsLayer = map.layers.find((l) => l.type === 'objectgroup');
const P = (name, type, value) => ({ name, type, value });
let id = 1;
const img = (name, image, extra = {}) => ({ id: id++, name, type: 'imagelayer', image, opacity: 1, visible: true, x: 0, y: 0, ...extra });
const tl = (name, data, props = []) => ({ id: id++, name, type: 'tilelayer', width: COLS, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data, ...(props.length ? { properties: props } : {}) });
const par = '../export/environments/parallax/';
const parallax = { id: id++, name: 'parallax', type: 'group', opacity: 1, visible: true, x: 0, y: 0, layers: [
  img('sky', par + 'sawmill_sky.png', { parallaxx: 0 }),
  img('mountains_far', par + 'sawmill_mountains_far.png', { parallaxx: 0.06, repeatx: true }),
  img('ridge', par + 'sawmill_ridge.png', { parallaxx: 0.22, repeatx: true, properties: [P('ridge', 'bool', true)] }), // the closing lantern stands on this layer's top edge
  img('pines', par + 'sawmill_pines.png', { parallaxx: 0.45, repeatx: true }),
] };
objectsLayer.id = id++;
map.layers = [
  parallax,
  tl('ground', ground), tl('back_wall', wall), tl('structure', struct), tl('details', detail),
  objectsLayer,
  img('foreground', par + 'sawmill_front.png', { parallaxx: 1.2, repeatx: true, properties: [P('role', 'string', 'front')] }),
];
map.width = COLS; map.height = ROWS; map.tilewidth = 16; map.tileheight = 16;
map.tilesets = [{ firstgid: BR, source: 'tilesets/black_ram_exterior.tsj' }, { firstgid: SM, source: 'tilesets/sawmill_exterior.tsj' }];
map.properties = map.properties.filter((p) => p.name !== 'painter');
map.nextlayerid = id;
writeFileSync(file, JSON.stringify(map, null, 1) + String.fromCharCode(10));
console.log('old_sawmill.tmj rebuilt: 54×17 tiles, tile layers + parallax; painter property removed');
