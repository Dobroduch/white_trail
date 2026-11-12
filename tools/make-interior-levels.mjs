// PASS 2 bootstrap for the Black Ram Hotel interiors: turns the layout-only maps (assets/levels/black_ram_parlor.tmj and room_4.tmj, made by
// migrate-scene-to-tiled.mjs) into tile-built rooms with the hotel_interior tileset. Every feature keeps the position of the Pixelorama painting
// it replaces (door, hearth, photograph, pigeonholes, sconces, stairs; wardrobe, washstand, window, bed, the scrubbed boards), so the objects,
// props (fire, patrons, desk, window snow) and lights are untouched.
//   * Parlor: 39×17 tiles (624 px = a 416-unit room; the east wall gains 24 px so the width is whole tiles)
//   * Room 4: 30×17 tiles (480 px = 320 units, as before)
// The authored light and glow passes (assets/export/environments/{parlor,room4}/light_*.png, glow_*.png) stay as phase-tagged image layers
// over the tiles. The `painter` property is removed.
//
// Run ONCE; after that Tiled owns the maps. Refuses to run on a map that already has tile layers unless --force.
//   node tools/make-interior-tileset.mjs && node tools/make-interior-levels.mjs [--force]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TILES = JSON.parse(readFileSync(resolve(root, 'tools/data/hotel_tiles.json'), 'utf8'));
const G = (name) => { if (!(name in TILES)) throw new Error('unknown tile ' + name); return 1 + TILES[name]; };
const P = (name, type, value) => ({ name, type, value });
const hash = (a, b, s) => { let n = Math.imul(a * 374761393 + b * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) % 1024 / 1024; };

function build(file, env, { cols, fill, images }) {
  const path = resolve(root, 'assets/levels/' + file);
  const map = JSON.parse(readFileSync(path, 'utf8'));
  if (map.layers.some((l) => l.type === 'tilelayer') && !process.argv.includes('--force')) { console.error(`${file} already has tile layers; Tiled owns it. Use --force to rebuild.`); return; }
  const ROWS = 17;
  const layer = () => new Array(cols * ROWS).fill(0);
  const put = (l, c, r, gid) => { if (c >= 0 && c < cols && r >= 0 && r < ROWS) l[r * cols + c] = gid; };
  const blk = (l, name, c, r, wt, ht) => { for (let j = 0; j < ht; j++) for (let i = 0; i < wt; i++) put(l, c + i, r + j, G(`${name}_${j}_${i}`)); };
  const L = { room: layer(), furniture: layer() };
  fill({ cols, put, blk, L, G, hash });

  const objects = map.layers.find((l) => l.type === 'objectgroup');
  let id = 1;
  const tl = (name, data) => ({ id: id++, name, type: 'tilelayer', width: cols, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data });
  const img = (name, file2, props) => ({ id: id++, name, type: 'imagelayer', image: `../export/environments/${env}/${file2}`, opacity: 1, visible: true, x: 0, y: 0, properties: props });
  const layers = [tl('room', L.room), tl('furniture', L.furniture)];
  for (const [name, f, role, phase] of images) layers.push(img(name, f, [P('phase', 'string', phase), ...(role ? [P('role', 'string', role)] : [])]));
  objects.id = id++;
  layers.push(objects);
  map.layers = layers;
  map.width = cols; map.height = ROWS; map.tilewidth = 16; map.tileheight = 16;
  map.tilesets = [{ firstgid: 1, source: 'tilesets/hotel_interior.tsj' }];
  map.properties = map.properties.filter((p) => p.name !== 'painter');
  map.nextlayerid = id;
  writeFileSync(path, JSON.stringify(map, null, 1) + String.fromCharCode(10));
  console.log(`${file} rebuilt: ${cols}×17 tiles`);
}

// ------------------------------------------------------------------------------------------------------ PARLOR
build('black_ram_parlor.tmj', 'parlor', {
  cols: 39,
  images: [['light_evening', 'light_evening.png', null, 'EVENING'], ['glow_evening', 'glow_evening.png', 'glow', 'EVENING']],
  fill({ cols, put, blk, L, G, hash }) {
    for (let c = 0; c < cols; c++) {
      put(L.room, c, 0, G(c % 5 === 3 ? 'ceiling_beam' : 'ceiling_a'));
      put(L.room, c, 1, G('wallpaper_dark')); put(L.furniture, c, 1, G('cornice'));
      for (let r = 2; r <= 10; r++) put(L.room, c, r, G((c + r) % 2 ? 'wallpaper_a' : 'wallpaper_b'));
      put(L.room, c, 11, G(c % 2 ? 'wain_top_r' : 'wain_top_l')); put(L.room, c, 12, G('wain_mid')); put(L.room, c, 13, G('wain_bot'));
      put(L.room, c, 14, G('floor_top'));
      for (const r of [15, 16]) put(L.room, c, r, G(['floor_a', 'floor_b', 'floor_c'][Math.floor(hash(c, r, 2) * 3)]));
    }
    blk(L.furniture, 'door_parlor', 0, 8, 3, 6); // front door with a glass pane (the snow past it is the windowSnow prop)
    blk(L.furniture, 'fireplace', 5, 8, 6, 6); // the hearth; the fire is a prop standing in the firebox
    blk(L.furniture, 'photo_frame', 14, 5, 3, 2); // pl_photo
    blk(L.furniture, 'keyrack', 23, 6, 6, 4); blk(L.furniture, 'keyrow', 23, 10, 6, 1); // pigeonholes; key 4 is missing
    blk(L.furniture, 'sconce_a', 11, 8, 1, 2); blk(L.furniture, 'sconce_b', 20, 8, 1, 2); blk(L.furniture, 'sconce_c', 30, 8, 1, 2);
    blk(L.furniture, 'staircase', 30, 5, 7, 9); // up to the rooms (pl_stairs)
    blk(L.furniture, 'landing', 35, 2, 3, 3); // the dark upper landing
  },
});

// ------------------------------------------------------------------------------------------------------ ROOM 4
build('room_4.tmj', 'room4', {
  cols: 30,
  images: [['light_evening', 'light_evening.png', null, 'EVENING'], ['light_night', 'light_night.png', null, 'NIGHT'],
    ['glow_evening', 'glow_evening.png', 'glow', 'EVENING'], ['glow_night', 'glow_night.png', 'glow', 'NIGHT']],
  fill({ cols, put, blk, L, G, hash }) {
    for (let c = 0; c < cols; c++) {
      put(L.room, c, 0, G(c % 6 === 2 ? 'ceiling_beam' : 'ceiling_a'));
      put(L.room, c, 1, G('r4_wall_shade')); put(L.furniture, c, 1, G('cornice'));
      for (let r = 2; r <= 10; r++) put(L.room, c, r, G(hash(c, r, 3) > 0.5 ? 'r4_wall_a' : 'r4_wall_b'));
      put(L.room, c, 11, G('r4_wain_top')); put(L.room, c, 12, G('r4_wain')); put(L.room, c, 13, G('r4_wain_bot'));
      put(L.room, c, 14, G('floor_top'));
      for (const r of [15, 16]) put(L.room, c, r, G(['floor_a', 'floor_b', 'floor_c'][Math.floor(hash(c, r, 4) * 3)]));
    }
    for (let c = 16; c <= 18; c++) for (const r of [14, 15]) put(L.room, c, r, G('floor_scrubbed')); // the scrubbed boards (r4_floor): paler than the grimy floor
    put(L.furniture, 8, 4, G('wall_ghost')); put(L.furniture, 9, 4, G('wall_ghost')); put(L.furniture, 8, 5, G('wall_ghost')); put(L.furniture, 9, 5, G('wall_ghost')); // a pale patch where a picture hung
    blk(L.furniture, 'door_r4', 0, 8, 3, 6); // Room 4's door (r4_door)
    blk(L.furniture, 'wardrobe', 4, 7, 4, 7); // r4_wardrobe
    blk(L.furniture, 'washstand', 8, 11, 3, 3); // r4_wash
    put(L.furniture, 12, 13, G('stool'));
    blk(L.furniture, 'window_r4', 13, 6, 4, 5); // r4_window: the dark night and the snow (prop)
    blk(L.furniture, 'bed', 19, 9, 8, 5); // r4_bed
  },
});
