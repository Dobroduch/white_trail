// One-off patch: the first night's aftermath is seen, not told over black (NOTES.md §23). Finch waits at the top of the
// creek path on the hotel forecourt in the grey light, only while `firstLightFinch` holds (set by SLICE_END, cleared by
// CH2_OPEN). Idempotent: the map is marked with the map property `firstLight` once patched.
//   node tools/patch-first-light.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const f = resolve(root, 'assets/levels/black_ram_exterior.tmj');
const P = (name, type, value) => ({ name, type, value });
const S = (name, value) => P(name, 'string', typeof value === 'string' ? value : JSON.stringify(value));
const map = JSON.parse(readFileSync(f, 'utf8'));
if (map.properties.some((p) => p.name === 'firstLight')) { console.log('black_ram_exterior.tmj: already patched'); process.exit(0); }
const gameplay = map.layers.find((l) => l.name === 'gameplay');
map.nextobjectid = map.nextobjectid || Math.max(0, ...gameplay.objects.map((o) => o.id)) + 1;
// a few steps west of where Silas comes up from the creek (spawn fromCreek, x 930), facing him
gameplay.objects.push({
  id: map.nextobjectid++, name: 'finch', type: 'npc', x: 888, y: 225, width: 0, height: 0, rotation: 0, visible: true,
  properties: [S('label', 'Constable Finch'), S('sprite', 'finch_idle'), S('dialogue', 'FINCH_DAY'), P('facing', 'float', 1), S('if', { flag: 'firstLightFinch' })],
});
map.properties.push(P('firstLight', 'bool', true));
writeFileSync(f, JSON.stringify(map, null, 1) + '\n');
console.log('black_ram_exterior.tmj: patched');
