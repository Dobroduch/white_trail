// PASS 2 bootstrap for the Road to Crow's Hollow and the Creek Path: turns the layout-only maps
// (assets/levels/road_to_crows_hollow.tmj and creek_path.tmj, made by migrate-scene-to-tiled.mjs) into tile-built levels with the
// wilderness_exterior tileset: rolling snow terrain (the crust follows the `ground` polyline), fences, the signpost, the ore car,
// the notice board; the creek bank and black water, the footbridge and the deadfall. The existing Pixelorama parallax PNGs become
// image layers (the Road keeps its distant village lights and their glow). The `painter` property is removed.
//
// The Road's ground is raised 3 px (terrain tiles need a crust at least 1 px below the tile top). The Creek's ground is unchanged and
// its map grows 12 px (a 768-unit scene) so its width is a whole number of tiles.
//
// Run ONCE; after that Tiled owns the maps. Refuses to run on a map that already has tile layers unless --force.
//   node tools/make-wilderness-tileset.mjs && node tools/make-wilderness-levels.mjs [--force]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TILES = JSON.parse(readFileSync(resolve(root, 'tools/data/wilderness_tiles.json'), 'utf8'));
const G = (name) => { if (!(name in TILES)) throw new Error('unknown tile ' + name); return 1 + TILES[name]; }; // firstgid 1
const P = (name, type, value) => ({ name, type, value });
const hash = (a, b, s) => { let n = Math.imul(a * 374761393 + b * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) % 1024 / 1024; };

function build(file, prefix, { cols, ground, parallax, front, fill }) {
  const path = resolve(root, 'assets/levels/' + file);
  const map = JSON.parse(readFileSync(path, 'utf8'));
  if (map.layers.some((l) => l.type === 'tilelayer') && !process.argv.includes('--force')) { console.error(`${file} already has tile layers; Tiled owns it. Use --force to rebuild.`); return; }
  const ROWS = 17;
  const layer = () => new Array(cols * ROWS).fill(0);
  const put = (l, c, r, gid) => { if (c >= 0 && c < cols && r >= 0 && r < ROWS) l[r * cols + c] = gid; };
  const blk = (l, name, c, r, wt, ht) => { for (let j = 0; j < ht; j++) for (let i = 0; i < wt; i++) put(l, c + i, r + j, G(`${name}_${j}_${i}`)); };
  const at = (px) => { // ground y (native px) at x, from the polyline
    for (let i = 0; i < ground.length - 1; i++) { const [x0, y0] = ground[i], [x1, y1] = ground[i + 1]; if (px >= x0 && px <= x1) return y0 + ((px - x0) / (x1 - x0)) * (y1 - y0); }
    return ground[ground.length - 1][1];
  };
  const sOf = (c) => Math.max(0, Math.min(12, Math.round(at(c * 16 + 8)) - 224)); // crust row inside tile row 14
  const L = { behindFence: layer(), behind: layer(), terrain: layer(), frontProps: layer() };
  fill({ cols, put, blk, sOf, L, G, hash });

  const objects = map.layers.find((l) => l.type === 'objectgroup');
  const poly = ground.map(([x, y]) => ({ x, y }));
  const gobj = objects.objects.find((o) => o.type === 'ground');
  if (gobj) gobj.polyline = poly; else objects.objects.push({ id: map.nextobjectid++, name: 'ground', type: 'ground', x: 0, y: 0, width: 0, height: 0, rotation: 0, visible: true, polyline: poly, properties: [] });
  const east = objects.objects.find((o) => o.name === 'eastEdge'); if (east) east.x = cols * 16 - 12;

  let id = 1;
  const img = (name, image, extra = {}) => ({ id: id++, name, type: 'imagelayer', image, opacity: 1, visible: true, x: 0, y: 0, ...extra });
  const tl = (name, data) => ({ id: id++, name, type: 'tilelayer', width: cols, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data });
  const par = '../export/environments/parallax/';
  const group = { id: id++, name: 'parallax', type: 'group', opacity: 1, visible: true, x: 0, y: 0,
    layers: parallax.map(([n, f, extra]) => img(n, `${par}${prefix}_${n}.png`, { parallaxx: f, repeatx: f !== 0, ...(extra || {}) })) };
  objects.id = id++;
  map.layers = [group, tl('fence', L.behindFence), tl('props_behind', L.behind), tl('ground', L.terrain), tl('props_front', L.frontProps), objects,
    img('foreground', par + front[0], { parallaxx: front[1], repeatx: true, properties: [P('role', 'string', 'front')] })];
  map.width = cols; map.height = ROWS; map.tilewidth = 16; map.tileheight = 16;
  map.tilesets = [{ firstgid: 1, source: 'tilesets/wilderness_exterior.tsj' }];
  map.properties = map.properties.filter((p) => p.name !== 'painter');
  map.nextlayerid = id;
  writeFileSync(path, JSON.stringify(map, null, 1) + String.fromCharCode(10));
  console.log(`${file} rebuilt: ${cols}×17 tiles`);
}

// ------------------------------------------------------------------------------------------------------ ROAD
const ROAD_GROUND = [[0, 225], [180, 222], [390, 228], [600, 223.5], [810, 226.5], [1020, 222], [1200, 225]].map(([x, y]) => [x, y + 3]);
build('road_to_crows_hollow.tmj', 'road', {
  cols: 75, ground: ROAD_GROUND,
  parallax: [['sky', 0], ['mountains_far', 0.08], ['mountains_near', 0.18], ['lights', 0.32], ['lights_glow', 0.32, { properties: [P('role', 'string', 'glow')] }], ['pines_far', 0.42], ['pines_near', 0.7]],
  front: ['road_front.png', 1.3],
  fill({ cols, put, blk, sOf, L, G }) {
    for (let c = 0; c < cols; c++) { put(L.terrain, c, 14, G(`t_rut_${'ab'[c % 2]}_s${sOf(c)}`)); put(L.terrain, c, 15, G('snow_body')); put(L.terrain, c, 16, G('snow_body')); }
    for (const [a, b] of [[3, 28], [42, 61]]) for (let c = a; c <= b; c++) { // the fence beside the road, broken near the signpost
      if (c === 21) continue;
      if (c === 20) { put(L.behindFence, c, 13, G('fence_broken_top')); continue; }
      const post = c % 2 === 1;
      put(L.behindFence, c, 13, G(post ? 'fence_post_top' : 'fence_span_top'));
      if (post) put(L.behindFence, c, 14, G('fence_post_foot'));
    }
    blk(L.behind, 'sign_crow_wide', 12, 11, 6, 4); // CROW'S HOLLOW (rd_sign); the 4-wide sign_crow block clipped the board
    blk(L.behind, 'orecar', 32, 12, 3, 3); // half-buried ore car (rd_orecar)
    blk(L.behind, 'notice', 67, 11, 3, 4); // the notice board near the village (rd_notice)
  },
});

// ------------------------------------------------------------------------------------------------------ CREEK
const CREEK_GROUND = [[0, 225], [300, 229.5], [630, 234], [900, 235.5], [1140, 235.5], [1152, 235.5]];
build('creek_path.tmj', 'creek', {
  cols: 72, ground: CREEK_GROUND,
  parallax: [['sky', 0], ['mountains_far', 0.08], ['mountains_near', 0.2], ['mill', 0.45], ['pines', 0.72]],
  front: ['creek_front.png', 1.25],
  fill({ cols, put, blk, sOf, L, G, hash }) {
    for (let c = 0; c < cols; c++) {
      const s = sOf(c), bridge = c >= 59 && c <= 63;
      const kind = c >= 3 && c <= 57 && c % 2 ? 'prints' : hash(c, 1, 9) > 0.72 ? 'tuft' : 'plain'; // fresh prints toward the bridge, dry grass between
      if (!bridge) put(L.terrain, c, 14, G(`t_${kind}_${'ab'[c % 2]}_s${s}`));
      put(L.terrain, c, 15, bridge ? G(`creek_water_${'ab'[c % 2]}`) : G(`creek_edge_${'ab'[(c >> 1) % 2]}`));
      put(L.terrain, c, 16, G(`creek_water_${'ab'[(c + 1) % 2]}`));
    }
    blk(L.frontProps, 'bridge', 59, 13, 5, 3); // the footbridge over to the sawmill (ck_bridge)
    blk(L.behind, 'deadfall', 64, 9, 8, 6); // two pines down across the bank path (ck_deadfall)
  },
});
