// Paints the wheel-pit tileset (16×16, 8 columns, palette colours only):
//   assets/export/tilesets/wheel_pit.png        the image
//   assets/levels/tilesets/wheel_pit.tsj        the Tiled tileset (every tile has a `name` property)
//   tools/data/wheel_pit_tiles.json             name → tile index, used by make-wheel-pit-level.mjs
//
// The wheel pit is the optional hidden place under the sawmill's waterwheel (assets/levels/wheel_pit.tmj): the stone
// race the wheel turned in, roofed by the wheel housing's timbers, its floor iced over. It also holds `race_mouth`, the
// low dark arch at the foot of the wheel on the sawmill map. That arch sits on the sawmill's back_wall layer, behind the
// wheel, so before Silas knows about the pit it reads as nothing more than shadow under the paddles.
//
// TILE ORDER IS FIXED once in use; add new tiles at the END of build().
//
//   node tools/make-wheel-pit-tileset.mjs
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, hash, registry, writeTileset } from './lib/tilekit.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { tiles, names, addTile, addBlock } = registry();

// dressed stone in 8 px courses, joints offset every other course
function masonry(c, seed, w = T, h = T, ox = 0, oy = 0) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gy = y + oy, gx = x + ox, course = Math.floor(gy / 8), off = course % 2 ? 6 : 0;
    const bx = Math.floor((gx + off) / 12), joint = (gx + off) % 12 === 0 || gy % 8 === 0;
    let col = hash(bx, course, seed) > 0.5 ? 'stone0' : 'stone1';
    if (!joint && (gy % 8 === 1 || (gx + off) % 12 === 1)) col = hash(bx, course, seed + 1) > 0.6 ? 'stone2' : col;
    if (!joint && hash(gx, gy, seed + 2) > 0.94) col = 'iron2';
    c.p(x, y, joint ? 'ink' : col);
  }
}

function build() {
  addTile('void', (c) => { c.r(0, 0, T, T, 'navy2'); for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (hash(x, y, 1) > 0.9) c.p(x, y, 'navy'); });
  addTile('stone_a', (c) => masonry(c, 3));
  addTile('stone_b', (c) => masonry(c, 4, T, T, 8, 0));
  addTile('stone_wet', (c) => { masonry(c, 5); for (const x of [3, 9, 13]) for (let y = 0; y < 6 + (x % 5); y++) c.p(x, y, y % 3 ? 'snow0' : 'slate4'); });
  addTile('stone_top', (c) => { masonry(c, 6); for (let x = 0; x < T; x++) { c.p(x, 0, 'snow4'); c.p(x, 1, 'snow3'); if (hash(x, 2, 7) > 0.5) c.p(x, 2, 'snow2'); } });
  addTile('beam_h', (c) => { c.r(0, 3, T, 10, 'wood1'); c.hl(0, 15, 3, 'wood3'); c.hl(0, 15, 4, 'wood2'); c.hl(0, 15, 12, 'wood0'); for (let x = 0; x < T; x++) if (hash(x, 1, 8) > 0.7) c.p(x, 7 + (x % 3), 'wood0'); });
  addTile('beam_worn', (c) => { // the one beam across the pit: worn bright where a loaded rope ran over it lately
    c.r(0, 3, T, 10, 'wood1'); c.hl(0, 15, 3, 'wood3'); c.hl(0, 15, 4, 'wood2'); c.hl(0, 15, 12, 'wood0');
    c.r(5, 3, 6, 2, 'wood5'); c.hl(6, 9, 5, 'wood4'); c.p(7, 6, 'wood4'); c.p(4, 3, 'linen0'); c.p(11, 4, 'linen0');
  });
  addTile('post_v', (c) => { c.r(4, 0, 8, T, 'wood1'); c.vl(4, 0, 15, 'wood3'); c.vl(5, 0, 15, 'wood2'); c.vl(11, 0, 15, 'wood0'); for (let y = 0; y < T; y += 5) c.p(8, y + (y % 2), 'wood0'); });
  addTile('planks_under', (c) => { // underside of the wheel-housing floor
    c.r(0, 0, T, T, 'wood0');
    for (let y = 0; y < T; y += 4) { c.hl(0, 15, y, 'ink'); c.hl(0, 15, y + 1, 'wood1'); }
    for (let x = 0; x < T; x++) if (hash(x, 3, 9) > 0.86) c.vl(x, 2, 3, 'navy');
  });
  addTile('icicles', (c) => { for (let x = 0; x < T; x++) { const len = Math.floor(hash(x, 1, 10) * 9); for (let y = 0; y < len; y++) c.p(x, y, y < len - 2 ? 'snow2' : y === len - 1 ? 'bone' : 'snow3'); if (len > 3 && x % 2) c.p(x, 0, 'snow4'); } });
  addTile('ice_top', (c) => { // floor ice; the crust (walk line) is local y 0 = native y 224
    c.r(0, 0, T, T, 'slate1');
    for (let x = 0; x < T; x++) { c.p(x, 0, hash(x, 0, 11) > 0.3 ? 'haze2' : 'snow3'); c.p(x, 1, 'snow1'); c.p(x, 2, 'haze1'); c.p(x, 3, 'haze0'); }
    c.line(2, 6, 7, 9, 'slate4'); c.line(7, 9, 12, 7, 'slate4'); c.line(9, 12, 14, 15, 'slate'); // cracks
  });
  addTile('ice_fill', (c) => { c.r(0, 0, T, T, 'slate0'); for (let x = 0; x < T; x++) for (let y = 0; y < T; y++) if (hash(x, y, 12) > 0.92) c.p(x, y, 'slate2'); c.line(1, 4, 6, 2, 'slate2'); });
  addTile('water', (c) => { c.r(0, 0, T, T, 'navy'); for (let i = 0; i < 3; i++) c.hl((i * 5) % 11, (i * 5) % 11 + 3, 3 + i * 5, 'slate2'); });
  addTile('drift', (c) => { for (let x = 0; x < T; x++) { const h = Math.max(0, Math.round(9 - Math.abs(x - 7) * 1.1 + hash(x, 1, 13) * 2)); for (let y = 0; y < h; y++) c.p(x, 15 - y, y === h - 1 ? 'snow4' : y > h - 3 ? 'snow3' : 'snow2'); } });
  // the frozen hollow: a man-length depression in the packed snow on the ice, frost feathers grown inside it, and
  // strands of new hemp caught in its rim (48×16, sits on the floor row so its top is the crust line)
  addBlock('hollow', 3, 1, (c) => {
    for (let x = 0; x < 48; x++) { c.p(x, 0, 'snow3'); c.p(x, 1, 'snow2'); }
    for (let x = 3; x < 45; x++) { const d = Math.round(3 + Math.sin(((x - 3) / 42) * Math.PI) * 3); for (let y = 1; y <= d; y++) c.p(x, y, y === d ? 'snow0' : 'haze0'); }
    for (let i = 0; i < 34; i++) { const x = 5 + Math.floor(hash(i, 1, 14) * 38), y = 2 + Math.floor(hash(i, 2, 14) * 4); c.p(x, y, hash(i, 3, 14) > 0.5 ? 'bone' : 'haze2'); c.p(x + 1, y - 1, 'haze2'); }
    c.line(9, 2, 16, 4, 'brass1'); c.line(10, 3, 17, 5, 'brass0'); c.line(30, 4, 37, 2, 'brass1'); // hemp strands
    for (let x = 0; x < 48; x++) { c.p(x, 8, 'snow1'); c.p(x, 9, 'haze1'); c.p(x, 10, 'haze0'); for (let y = 11; y < 16; y++) c.p(x, y, 'slate1'); }
  });
  // the lower rim of the waterwheel, frozen into the race: rim arc and three paddles hung with ice (64×64)
  addBlock('wheel_rim', 4, 4, (c) => {
    const cx = 32, cy = -34, r = 76;
    for (let a = 40; a <= 140; a += 0.4) { const x = cx + Math.cos((a * Math.PI) / 180) * r, y = cy + Math.sin((a * Math.PI) / 180) * r; for (let k = 0; k < 4; k++) c.p(x, y - k, k === 0 ? 'wood0' : k === 3 ? 'wood3' : 'wood1'); }
    for (const a of [62, 90, 118]) {
      const x0 = cx + Math.cos((a * Math.PI) / 180) * (r - 30), y0 = cy + Math.sin((a * Math.PI) / 180) * (r - 30);
      const x1 = cx + Math.cos((a * Math.PI) / 180) * (r + 2), y1 = cy + Math.sin((a * Math.PI) / 180) * (r + 2);
      c.line(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), 'wood2'); c.line(Math.round(x0) + 1, Math.round(y0), Math.round(x1) + 1, Math.round(y1), 'wood1');
      for (let k = 0; k < 4; k++) c.p(Math.round(x1) + k - 2, Math.round(y1) + 1 + (k % 2), 'snow2');
    }
  });
  // the way in from the mill yard: a gap in the race wall open to the snow above (32×48)
  addBlock('shaft', 2, 3, (c) => {
    c.r(0, 0, 32, 48, 'navy3');
    for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) if (hash(x, y, 15) > 0.97) c.p(x, y, 'snow1'); // snow drifting down through the gap
    for (let y = 0; y < 48; y++) { c.p(0, y, 'stone1'); c.p(1, y, 'ink'); c.p(30, y, 'ink'); c.p(31, y, 'stone1'); }
    for (let x = 0; x < 32; x++) { c.p(x, 0, 'snow4'); c.p(x, 1, 'snow3'); }
    for (let i = 0; i < 4; i++) { const y = 10 + i * 9; c.hl(6, 25, y, 'stone2'); c.hl(6, 25, y + 1, 'stone0'); c.hl(6, 25, y + 2, 'ink'); } // stones set as a rough step
    for (let x = 2; x < 30; x++) { const h = Math.round(6 - Math.abs(x - 16) / 3); for (let y = 0; y < h; y++) c.p(x, 47 - y, y === h - 1 ? 'snow4' : 'snow3'); }
  });
  // on the SAWMILL map, behind the wheel: the low dark arch where the race runs in under the frame (32×32)
  addBlock('race_mouth', 2, 2, (c) => {
    masonry(c, 16, 32, 32);
    for (let y = 6; y < 32; y++) { const half = y < 14 ? Math.round(Math.sqrt(Math.max(0, 64 - (14 - y) * (14 - y))) * 1.4) : 11; for (let x = 16 - half; x < 16 + half; x++) c.p(x, y, y < 9 || x === 16 - half || x === 15 + half ? 'iron' : 'ink'); }
    for (let x = 6; x < 26; x++) if (hash(x, 1, 17) > 0.45) { const l = 1 + Math.floor(hash(x, 2, 17) * 4); for (let y = 0; y < l; y++) c.p(x, 7 + y, 'snow1'); }
    for (let x = 0; x < 32; x++) { c.p(x, 0, 'snow3'); if (hash(x, 3, 17) > 0.5) c.p(x, 1, 'snow2'); }
  });
}

build();
writeTileset(root, 'wheel_pit', { tiles, names, addTile }, 'tools/data/wheel_pit_tiles.json');
