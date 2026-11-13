// One-off patch (run once; Tiled owns the map): swap the clipped 4-tile CROW'S HOLLOW signpost on the Road for the
// 6-tile `sign_crow_wide` block (tools/make-wilderness-tileset.mjs). The post keeps its column, so the rd_sign
// interactable stays where it is. Refuses to touch cells that hold something other than the old sign or nothing.
//
//   node tools/make-wilderness-tileset.mjs && node tools/patch-road-sign.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const file = resolve(root, 'assets/levels/road_to_crows_hollow.tmj');
const map = JSON.parse(readFileSync(file, 'utf8'));
const ID = JSON.parse(readFileSync(resolve(root, 'tools/data/wilderness_tiles.json'), 'utf8'));
const fg = map.tilesets.find((t) => t.source.includes('wilderness_exterior')).firstgid;
const layer = map.layers.find((l) => l.type === 'tilelayer' && l.name === 'props_behind');
const COL = 12, ROW = 11, WT = 6, HT = 4;
const oldGids = new Set(Object.entries(ID).filter(([k]) => /^sign_crow_\d+_\d+$/.test(k)).map(([, v]) => fg + v));
let changed = 0;
for (let r = 0; r < HT; r++) for (let c = 0; c < WT; c++) {
  const i = (ROW + r) * map.width + COL + c;
  const cur = layer.data[i];
  if (cur && !oldGids.has(cur)) throw new Error(`cell ${COL + c},${ROW + r} holds gid ${cur}, not the old sign; refusing to overwrite`);
  const name = `sign_crow_wide_${r}_${c}`;
  if (!(name in ID)) throw new Error('missing tile ' + name + ' (run make-wilderness-tileset.mjs first)');
  if (cur !== fg + ID[name]) { layer.data[i] = fg + ID[name]; changed++; }
}
writeFileSync(file, JSON.stringify(map, null, 1) + String.fromCharCode(10));
console.log(`road_to_crows_hollow.tmj: ${changed} sign cells updated`);
