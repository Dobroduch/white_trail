// One-off patch: the Black Ram answers the time of day (see NOTES.md §22).
//   black_ram_exterior.tmj  the hotel's (and its neighbour's) windows leave the baked glow_evening / glow_night tile
//                           layers and become one `hotelWindows` prop that lights, dims and reflects daylight by the
//                           hour; smoke from both chimneys (the west one answers the parlor fire).
//   black_ram_parlor.tmj    the hearth burns by day as well as in the evening (embers only in the small hours);
//                           the supper-only fire of the second day is folded into it.
//   room_4.tmj              by day a rag rug lies over the scrubbed boards (and is what Silas examines there).
// Idempotent: each map is marked with the map property `atmosphere` once patched.
//   node tools/patch-hotel-atmosphere.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const R = (p) => resolve(root, p);
const P = (name, type, value) => ({ name, type, value });
const S = (name, value) => P(name, 'string', typeof value === 'string' ? value : JSON.stringify(value));

function patch(file, fn) {
  const f = R(`assets/levels/${file}`);
  const map = JSON.parse(readFileSync(f, 'utf8'));
  map.properties = map.properties || [];
  if (map.properties.some((p) => p.name === 'atmosphere')) { console.log(`${file}: already patched`); return; }
  const gameplay = map.layers.find((l) => l.name === 'gameplay');
  const obj = (name) => gameplay.objects.find((o) => o.name === name);
  const setProp = (o, name, type, value) => {
    o.properties = (o.properties || []).filter((p) => p.name !== name);
    o.properties.push(P(name, type, value));
  };
  const add = (type, name, x, y, properties, w = 0, h = 0) => {
    map.nextobjectid = map.nextobjectid || Math.max(0, ...gameplay.objects.map((o) => o.id)) + 1;
    gameplay.objects.push({ id: map.nextobjectid++, name, type, x, y, width: w, height: h, rotation: 0, visible: true, properties });
  };
  fn({ map, gameplay, obj, setProp, add });
  map.properties.push(P('atmosphere', 'bool', true));
  writeFileSync(f, JSON.stringify(map, null, 1) + '\n');
  console.log(`${file}: patched`);
}

// The 2×2-tile windows of the hotel (and the house to its west), in tile coordinates, and whose lamp lights each.
const WINDOWS = [
  { tx: 7, ty: 10, room: 'house' },
  { tx: 22, ty: 6, room: 'guest1' }, { tx: 26, ty: 6, room: 'guest2' }, { tx: 32, ty: 6, room: 'keeper' }, { tx: 36, ty: 6, room: 'room4' },
  { tx: 22, ty: 10, room: 'parlor' }, { tx: 34, ty: 10, room: 'parlor' },
];

patch('black_ram_exterior.tmj', ({ map, obj, setProp, add }) => {
  // the windows leave the baked glow layers (the street lamp's glow tile stays)
  for (const name of ['glow_evening', 'glow_night']) {
    const l = map.layers.find((x) => x.name === name);
    for (const w of WINDOWS) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) l.data[(w.ty + dy) * map.width + w.tx + dx] = 0;
  }
  add('prop', 'hotelWindows', 0, 0, [S('propType', 'hotelWindows'), S('args', WINDOWS)]);
  // chimney tops at tiles (21, 2) and (37, 2): native px → world units (÷ 1.5)
  add('prop', 'smokeHearth', 0, 0, [S('propType', 'chimneySmoke'), S('args', [(21 * 16 + 8) / 1.5, 32 / 1.5, 'hearth'])]);
  add('prop', 'smokeStove', 0, 0, [S('propType', 'chimneySmoke'), S('args', [(37 * 16 + 8) / 1.5, 32 / 1.5, 'stove'])]);
  const ev = obj('CH2_DAY_EXIT');
  setProp(ev, 'bark', 'string', 'The Black Ram by day: the porch swept, the lamp out, smoke from the parlor chimney.');
});

patch('black_ram_parlor.tmj', ({ gameplay, obj, setProp }) => {
  const props = gameplay.objects.filter((o) => o.type === 'prop' && (o.properties || []).some((p) => p.name === 'propType' && p.value === 'fire'));
  // keep the evening fire, burning by day too; drop the supper-only copy
  const supper = props.find((o) => (o.properties || []).some((p) => p.name === 'id' && p.value === 'fireSupper'));
  if (supper) gameplay.objects.splice(gameplay.objects.indexOf(supper), 1);
  const hearth = props.find((o) => o !== supper);
  setProp(hearth, 'id', 'string', 'hearth');
  setProp(hearth, 'if', 'string', JSON.stringify({ any: [{ phase: 'EVENING' }, { phase: 'DAY' }] }));
  setProp(obj('pl_fire'), 'variants', 'string', JSON.stringify([
    { if: { phase: 'NIGHT' }, lines: ['Embers. The room has gone cold around them.'] },
    { if: { phase: 'DAY' }, lines: ['Built up again since the small hours, and burning hard. Whatever else Mrs. Gable lets go, she does not let the fire go.'] },
    { if: {}, lines: ['Pine logs, burning well. The first warm air I\'ve breathed since the train.'] },
  ]));
});

patch('room_4.tmj', ({ obj, setProp, add }) => {
  // by night and evening the boards themselves; by day the rug that now covers them
  setProp(obj('r4_floor'), 'if', 'string', JSON.stringify({ any: [{ phase: 'EVENING' }, { phase: 'NIGHT' }] }));
  add('interactable', 'r4_rug', 280, 228, [S('label', 'Rug'), S('evidence', 'ROOM4_RUG'), S('phase', 'DAY')]);
  add('prop', 'rug', 0, 0, [S('propType', 'rug'), S('args', [187, 151]), S('phase', 'DAY')]);
});
