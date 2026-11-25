// Builds Chapter 4's new Tiled map and patches the existing maps for the fourth day:
//   assets/levels/cutler_loft.tmj  CUTLER_LOFT  Wade Cutler's loft over the woodshed, east end of Main Street (27×17)
// and, in place:
//   main_street.tmj         Cutler saddling up by the woodshed; the loft door (padlocked until he rides out)
//   rusk_store.tmj          the poison register under the counter; Rusk gone if he ran
//   constable_office.tmj    Ada Bell at Finch's stove if she was told to go home; Finch's card if he went up the ridge
//   telegraph_tower.tmj     Ada stays down in town on the fourth day if she was told to go home
//   black_ram_parlor.tmj    the fourth day's morning (the third night's cup and tin cleared away); supper with Finch;
//                           waiting by the dead fire for first light, after the third night's end card
//   black_ram_exterior.tmj  the hotel door ends the fourth day once its work is done
// Built from existing tiles (store / hotel interiors). Art: tools/make-chapter4-art.mjs. Ids: src/data/.
//
// Run it ONCE; after that Tiled owns the maps. It refuses to overwrite the new map or re-patch an old one unless --force.
//   node tools/make-chapter4-art.mjs && node tools/make-chapter4-levels.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const force = process.argv.includes('--force');
const R = (p) => resolve(root, p);
const P = (name, type, value) => ({ name, type, value });
const S = (name, value) => P(name, 'string', typeof value === 'string' ? value : JSON.stringify(value));
const ids = (name) => JSON.parse(readFileSync(R(`tools/data/${name}_tiles.json`), 'utf8'));
const count = (tsj) => JSON.parse(readFileSync(R(`assets/levels/tilesets/${tsj}.tsj`), 'utf8')).tilecount;

// ======================= CUTLER_LOFT =======================
{
  const f = R('assets/levels/cutler_loft.tmj');
  if (existsSync(f) && !force) console.log('cutler_loft.tmj exists; Tiled owns it (use --force to rebuild it).');
  else {
    const cols = 27, ROWS = 17;
    const ts = [['hotel', 'hotel_interior', 'hotel'], ['st', 'store_interior', 'store']];
    let gid = 1; const T = {}, tsList = [];
    for (const [k, tsj, json] of ts) { T[k] = { first: gid, ids: ids(json) }; tsList.push({ firstgid: gid, source: `tilesets/${tsj}.tsj` }); gid += count(tsj); }
    const g = (k, n) => { if (!(n in T[k].ids)) throw new Error(`no tile ${k}.${n}`); return T[k].first + T[k].ids[n]; };
    const layer = (id, name) => ({ id, name, type: 'tilelayer', width: cols, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data: new Array(cols * ROWS).fill(0) });
    const room = layer(1, 'room'), furn = layer(2, 'furniture');
    const put = (l, c, r, v) => { if (c >= 0 && c < cols && r >= 0 && r < ROWS) l.data[r * cols + c] = v; };
    const block = (l, k, n, c0, r0, wt, ht) => { for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) put(l, c0 + c, r0 + r, g(k, `${n}_${r}_${c}`)); };
    for (let c = 0; c < cols; c++) {
      // a low loft: beams close overhead, rough board walls, shadow toward the eaves at both ends
      for (let r = 0; r < 3; r++) put(room, c, r, g('st', c % 5 === 1 ? 'ceiling_beam' : 'ceiling'));
      put(room, c, 3, g('st', 'wall_top'));
      for (let r = 4; r < 13; r++) put(room, c, r, g('st', c >= 25 || c === 0 ? 'wall_shadow' : (c + (r > 8 ? 1 : 0)) % 2 ? 'wall_b' : 'wall_a'));
      put(room, c, 13, g('st', 'skirting'));
      put(room, c, 14, g('hotel', 'floor_top'));
      put(room, c, 15, g('hotel', ['floor_c', 'floor_b', 'floor_a'][c % 3])); put(room, c, 16, g('st', 'floor_shadow'));
    }
    block(furn, 'st', 'door', 1, 11, 2, 3);
    block(furn, 'st', 'window', 4, 7, 3, 3);
    for (let r = 3; r < 10; r++) put(furn, 8, r, g('st', 'pipe'));
    block(furn, 'st', 'stove', 8, 10, 2, 4);
    block(furn, 'hotel', 'bed', 11, 9, 8, 5); // the bunk
    block(furn, 'st', 'lamp', 15, 3, 1, 2);
    block(furn, 'st', 'shelves', 20, 4, 6, 6);
    block(furn, 'st', 'powder_crate', 21, 12, 3, 2);
    block(furn, 'st', 'sacks', 25, 12, 2, 2);
    const objs = []; let oid = 1;
    const obj = (type, name, x, y, properties = [], w = 0, h = 0) => objs.push({ id: oid++, name, type, x, y, width: w, height: h, rotation: 0, visible: true, point: !w, properties });
    obj('bounds', 'walkable', 36, 187.5, [], 388, 90);
    obj('spawn', 'fromStreet', 48, 225, [P('facing', 'float', 1)]);
    obj('door', 'lf_door', 32, 225, [S('label', 'Main Street'), S('verb', 'Go down'), S('to', 'VILLAGE'), S('spawn', 'fromLoft'), P('minutes', 'float', 1)]);
    obj('interactable', 'lf_window', 80, 140, [S('label', 'Window'), S('lines', 'A small window over the street. From here you see the hotel door, the store, and the chapel lane. A man could sit here and know who goes where.')]);
    obj('interactable', 'lf_stove', 136, 200, [S('label', 'Stove'), S('evidence', 'EV4_ASHES'), P('important', 'bool', true)]);
    obj('interactable', 'lf_bunk', 240, 205, [S('label', 'Bunk'), S('evidence', 'EV4_KIT')]);
    obj('interactable', 'lf_shelf', 368, 130, [S('label', 'Shelf'), S('evidence', 'EV4_TALLY'), P('important', 'bool', true)]);
    obj('interactable', 'lf_crate', 360, 212, [S('label', 'Crate'), S('lines', 'A GIANT POWDER crate, the twin of the one in Rusk\'s back corner. Empty, but for sawdust and one paper band, dated this autumn.')]);
    obj('light', 'window', 88, 140, [P('r', 'float', 90), P('warm', 'float', 0), P('strength', 'float', 0.85)]);
    obj('light', 'stoveGlow', 136, 196, [P('r', 'float', 44), P('warm', 'float', 0.2)]);
    obj('light', 'chink', 300, 120, [P('r', 'float', 70), P('warm', 'float', 0), P('strength', 'float', 0.45)]);
    obj('event', 'LOFT_ENTER', 0, 0, [S('script', 'LOFT_ENTER'), S('if', { notFlag: 'loftEntered' })]);
    const map = { type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down', width: cols, height: ROWS,
      tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1, nextlayerid: 4, nextobjectid: oid,
      properties: [S('name', "CUTLER'S LOFT"), P('exterior', 'bool', false), P('travel', 'float', 1), S('ambience', 'room4'), P('darkness', 'float', 0.3),
        S('ambient', 'cold'), S('surface', 'wood'), S('day', { darkness: 0.14 })],
      tilesets: tsList, layers: [room, furn, { id: 3, name: 'gameplay', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects: objs }] };
    writeFileSync(f, JSON.stringify(map, null, 1) + '\n');
    console.log('cutler_loft.tmj written');
  }
}

// ======================= patches =======================
function patch(file, fn) {
  const f = R(`assets/levels/${file}`);
  const map = JSON.parse(readFileSync(f, 'utf8'));
  if (map.properties.some((p) => p.name === 'chapter4') && !force) { console.log(`${file}: already patched for Chapter 4`); return; }
  const gameplay = map.layers.find((l) => l.name === 'gameplay');
  let oid = map.nextobjectid || Math.max(0, ...gameplay.objects.map((o) => o.id)) + 1;
  const add = (type, name, x, y, properties) => gameplay.objects.push({ id: oid++, name, type, x, y, width: 0, height: 0, rotation: 0, visible: true, point: true, properties });
  const all = (name) => gameplay.objects.filter((o) => o.name === name);
  const prop = (name) => { const o = all(name)[0]; if (!o) throw new Error(`${file}: no object ${name}`); return o; };
  const get = (o, name) => (o.properties.find((p) => p.name === name) || {}).value;
  const setProp = (o, name, type, value) => { o.properties = (o.properties || []).filter((p) => p.name !== name); o.properties.push(P(name, type, value)); };
  fn({ add, prop, all, get, setProp, map });
  map.properties = map.properties.filter((p) => p.name !== 'chapter4');
  map.properties.push(P('chapter4', 'bool', true));
  map.nextobjectid = oid;
  writeFileSync(f, JSON.stringify(map, null, 1) + '\n');
  console.log(`${file}: patched for Chapter 4`);
}
const andIf = (o, get, setProp, cond) => { const cur = get(o, 'if'); setProp(o, 'if', 'string', JSON.stringify(cur ? { all: [JSON.parse(cur), cond] } : cond)); };
const named = { any: [{ evidence: 'T4_RUSK_CONFESS' }, { evidence: 'T4_RUSK_CUTLER' }, { flag: 'knowsLoft' }] };

patch('main_street.tmj', ({ add, prop, get, setProp }) => {
  // the woodshed is Cutler's: on the fourth day its look gives way to the loft door over it
  andIf(prop('ms_woodshed'), get, setProp, { notFlag: 'ch4Started' });
  add('npc', 'cutler', 628, 225, [S('label', 'Wade Cutler'), S('sprite', 'cutler_idle'), S('dialogue', 'CUTLER'), P('facing', 'float', -1), S('phase', 'DAY'),
    S('if', { all: [{ flag: 'ch4Started' }, named, { notFlag: 'cutlerGone' }] })]);
  add('interactable', 'ms_shed4', 668, 195, [S('label', 'Woodshed'), S('phase', 'DAY'), S('if', { all: [{ flag: 'ch4Started' }, { notFlag: 'cutlerGone' }] }),
    S('lines', 'A woodshed with a loft over it, and a ladder-stair up the side to a door with a good padlock on it. Somebody lives up there who does not care for visitors.')]);
  add('door', 'loftDoor', 668, 225, [S('label', 'Cutler\'s loft'), S('verb', 'Go up'), S('to', 'CUTLER_LOFT'), S('spawn', 'fromStreet'), S('phase', 'DAY'),
    S('if', { all: [{ flag: 'ch4Started' }, { flag: 'cutlerGone' }] }), S('blockedLines', 'Padlocked.')]);
  add('spawn', 'fromLoft', 668, 225, [P('facing', 'float', -1)]);
});

patch('rusk_store.tmj', ({ add, prop, get, setProp }) => {
  andIf(prop('rusk'), get, setProp, { notFlag: 'ruskFled' });
  add('interactable', 'st_register', 272, 196, [S('label', 'Under the counter'), S('evidence', 'EV4_REGISTER'), P('important', 'bool', true), S('if', { flag: 'ch4Started' })]);
  add('interactable', 'st_backdoor', 470, 200, [S('label', 'Back door'), S('lines', 'Banging on its latch in the wind. His coat is still on the peg. Tracks go out across the yard, fast, toward nowhere in particular.'), S('if', { flag: 'ruskFled' })]);
});

patch('constable_office.tmj', ({ add, prop, get, setProp }) => {
  andIf(prop('finch'), get, setProp, { any: [{ notFlag: 'ch4Started' }, { notFlag: 'huntForGuest' }] });
  add('npc', 'ada', 96, 225, [S('label', 'Ada Bell'), S('sprite', 'ada_idle'), S('dialogue', 'ADA'), P('facing', 'float', 1),
    S('if', { all: [{ flag: 'ch4Started' }, { flag: 'adaWarned' }] })]);
  add('interactable', 'of_card', 200, 190, [S('label', 'A card on the desk'), S('if', { all: [{ flag: 'ch4Started' }, { flag: 'huntForGuest' }] }),
    S('lines', 'In Finch\'s careful hand: GONE UP THE RIDGE AFTER THE WOMAN. BACK BY DARK. E.F. The ink is a day old, and the stove is out.')]);
});

patch('telegraph_tower.tmj', ({ prop, get, setProp }) => {
  andIf(prop('ada'), get, setProp, { any: [{ notFlag: 'ch4Started' }, { notFlag: 'adaWarned' }] });
});

patch('black_ram_parlor.tmj', ({ add, all, get, setProp, map }) => {
  for (const o of all('finch')) if (get(o, 'phase') === 'DAY') setProp(o, 'if', 'string', JSON.stringify({ any: [{ flag: 'ch2Supper' }, { flag: 'ch3Supper' }, { all: [{ flag: 'ch4Supper' }, { notFlag: 'huntForGuest' }] }] }));
  for (const n of ['pl_cup', 'pl_tin', 'pl_kitchen']) for (const o of all(n)) andIf(o, get, setProp, { notFlag: 'ch4Started' });
  // after the fourth day Mrs. Gable has gone up at night, as on the third
  const nightProp = map.properties.find((p) => p.name === 'night');
  const night = JSON.parse(nightProp.value);
  for (const n of night.npcs || []) if (n.id === 'gable') n.if = { all: [{ notFlag: 'ch3Night' }, { notFlag: 'chapter4Complete' }] };
  nightProp.value = JSON.stringify(night);
  // after the third night's end card ("Sit by the dead fire a while"): wait there for the fourth day
  add('interactable', 'pl_wait', 216, 195, [S('label', 'Armchair'), S('verb', 'Sit'), S('dialogue', 'DAWN_WAIT'), S('phase', 'NIGHT'),
    S('if', { all: [{ flag: 'chapter3Complete' }, { notFlag: 'ch4Started' }] })]);
  andIf(all('pl_fire')[0], get, setProp, { any: [{ notFlag: 'chapter3Complete' }, { flag: 'ch4Started' }, { phase: 'DAY' }] });
});

patch('black_ram_exterior.tmj', ({ prop, get, setProp }) => {
  const door = prop('hotelDoor');
  const list = JSON.parse(get(door, 'scriptIf'));
  for (const e of list) if (e.script === 'CH3_EVENING') e.if = { all: [...e.if.all, { notFlag: 'ch4Started' }] };
  list.unshift({ if: { all: [{ phase: 'DAY' }, { flag: 'ch4DuskReady' }, { notFlag: 'chapter4Complete' }] }, script: 'CH4_EVENING' });
  setProp(door, 'scriptIf', 'string', JSON.stringify(list));
});
