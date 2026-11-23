// Builds Chapter 3's new Tiled map and patches the existing maps for the third day and night:
//   assets/levels/constable_office.tmj  FINCH_OFFICE  the constable's office and jail, the west cabin on Main Street (30×17)
// and, in place:
//   main_street.tmj         the office door; Finch keeps to his office on the third day
//   room_4.tmj              under the bed, the wardrobe's false back, the service stair; the rug stays from day 2 on
//   black_ram_parlor.tmj    Finch at supper on the third evening; the third night (no Mrs. Gable, the coffee pot on the
//                           hob, the cup and the tin after waking, the kitchen passage); the front door stays bolted
//   chapel_graveyard.tmj    Hale's burial: the new grave, Gideon Mercer and Finch at it, the prints Mercer leaves
//   black_ram_exterior.tmj  the hotel door ends the third day once its work is done
// Built from existing tiles (store / hotel interiors); the cell, the shrouded bench, the new grave and the coffee pot are
// props (src/world/props.js). Art: tools/make-chapter3-art.mjs. Ids of interactables / dialogue / evidence: src/data/.
//
// Run it ONCE; after that Tiled owns the maps. It refuses to overwrite the new map or re-patch an old one unless --force.
//   node tools/make-chapter3-art.mjs && node tools/make-chapter3-levels.mjs
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

// ======================= FINCH_OFFICE =======================
{
  const f = R('assets/levels/constable_office.tmj');
  if (existsSync(f) && !force) console.log('constable_office.tmj exists; Tiled owns it (use --force to rebuild it).');
  else {
    const cols = 30, ROWS = 17;
    const ts = [['hotel', 'hotel_interior', 'hotel'], ['st', 'store_interior', 'store']];
    let gid = 1; const T = {}, tsList = [];
    for (const [k, tsj, json] of ts) { T[k] = { first: gid, ids: ids(json) }; tsList.push({ firstgid: gid, source: `tilesets/${tsj}.tsj` }); gid += count(tsj); }
    const g = (k, n) => { if (!(n in T[k].ids)) throw new Error(`no tile ${k}.${n}`); return T[k].first + T[k].ids[n]; };
    const layer = (id, name) => ({ id, name, type: 'tilelayer', width: cols, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data: new Array(cols * ROWS).fill(0) });
    const room = layer(1, 'room'), furn = layer(2, 'furniture');
    const put = (l, c, r, v) => { if (c >= 0 && c < cols && r >= 0 && r < ROWS) l.data[r * cols + c] = v; };
    const block = (l, k, n, c0, r0, wt, ht) => { for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) put(l, c0 + c, r0 + r, g(k, `${n}_${r}_${c}`)); };
    for (let c = 0; c < cols; c++) {
      put(room, c, 0, g('st', c % 7 === 2 ? 'ceiling_beam' : 'ceiling')); put(room, c, 1, g('st', 'ceiling'));
      put(room, c, 2, g('st', 'wall_top'));
      for (let r = 3; r < 13; r++) put(room, c, r, g('st', c >= 28 ? 'wall_shadow' : (c + (r > 7 ? 1 : 0)) % 2 ? 'wall_b' : 'wall_a'));
      put(room, c, 13, g('st', 'skirting'));
      put(room, c, 14, g('hotel', 'floor_top'));
      put(room, c, 15, g('hotel', ['floor_b', 'floor_a', 'floor_c'][c % 3])); put(room, c, 16, g('st', 'floor_shadow'));
    }
    block(furn, 'st', 'door', 1, 11, 2, 3);
    block(furn, 'st', 'window', 4, 8, 3, 3);
    for (let r = 2; r < 10; r++) put(furn, 8, r, g('st', 'pipe'));
    block(furn, 'st', 'stove', 8, 10, 2, 4);
    block(furn, 'st', 'counter', 11, 11, 7, 3); // Finch's desk
    block(furn, 'st', 'lamp', 14, 2, 1, 2);
    block(furn, 'st', 'shelves', 19, 4, 6, 6); // the evidence shelf
    block(furn, 'st', 'crates', 22, 12, 2, 2);
    const objs = []; let oid = 1;
    const obj = (type, name, x, y, properties = [], w = 0, h = 0) => objs.push({ id: oid++, name, type, x, y, width: w, height: h, rotation: 0, visible: true, point: !w, properties });
    obj('bounds', 'walkable', 36, 187.5, [], 420, 90);
    obj('spawn', 'fromStreet', 48, 225, [P('facing', 'float', 1)]);
    obj('door', 'of_door', 32, 225, [S('label', 'Main Street'), S('verb', 'Go out'), S('to', 'VILLAGE'), S('spawn', 'fromOffice'), P('minutes', 'float', 1)]);
    obj('interactable', 'of_window', 80, 150, [S('label', 'Window'), S('lines', 'Main Street through the glass, and the station road where it comes into town. Whoever sits at this desk sees every arrival.'), S('again', 'The glass is wiped clean in one patch, at about the height of a seated man\'s eyes.')]);
    obj('interactable', 'of_stove', 136, 200, [S('label', 'Stove'), S('lines', 'A stove banked up hot, and a pot of coffee keeping black on the back of it. Finch\'s cups are on every flat surface in the room.'), P('warm', 'bool', true)]);
    obj('interactable', 'of_desk', 230, 190, [S('label', 'Desk'), S('evidence', 'EV3_PAD')]);
    obj('npc', 'finch', 150, 225, [S('label', 'Constable Finch'), S('sprite', 'finch_idle'), S('dialogue', 'FINCH_OFFICE'), P('facing', 'float', 1), S('phase', 'DAY')]);
    obj('interactable', 'of_shelf', 316, 130, [S('label', 'Shelf'), S('evidence', 'EV3_SHELF')]);
    obj('interactable', 'of_body', 342, 205, [S('label', 'Sheriff Hale'), S('evidence', 'EV3_COAT'), P('important', 'bool', true)]);
    obj('interactable', 'of_cell', 432, 180, [S('label', 'Cell'), S('variants', [
      { if: { flag: 'powderMoved' }, lines: ['The cell has a tenant after all: two crates of Giant Powder under a tarp, dug out of Amos Pell\'s grave. Finch has put the key on a nail by the door, as far from the stove as the room allows.'] },
      { if: {}, lines: ['An empty cell. A blanket folded on the cot, and a Bible nobody has opened.'] },
    ])]);
    obj('prop', 'jailCell', 0, 0, [S('propType', 'jailCell'), S('args', [262, 64, 56, 86])]);
    obj('prop', 'shroud', 0, 0, [S('propType', 'shroud'), S('args', [228, 140]), S('if', { notFlag: 'burialDone' })]);
    obj('light', 'stoveGlow', 136, 196, [P('r', 'float', 64), P('warm', 'float', 0.26)]);
    obj('light', 'window', 88, 150, [P('r', 'float', 84), P('warm', 'float', 0), P('strength', 'float', 0.85)]);
    obj('light', 'lamp', 224, 140, [P('r', 'float', 96), P('warm', 'float', 0.1), P('strength', 'float', 0.7)]);
    obj('event', 'OFFICE_ENTER', 0, 0, [S('script', 'OFFICE_ENTER'), S('if', { notFlag: 'officeEntered' })]);
    const map = { type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down', width: cols, height: ROWS,
      tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1, nextlayerid: 4, nextobjectid: oid,
      properties: [S('name', "CONSTABLE'S OFFICE"), P('exterior', 'bool', false), P('travel', 'float', 1), S('ambience', 'room4'), P('darkness', 'float', 0.32),
        S('ambient', 'warm'), S('surface', 'wood'), S('day', { darkness: 0.26 })],
      tilesets: tsList, layers: [room, furn, { id: 3, name: 'gameplay', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects: objs }] };
    writeFileSync(f, JSON.stringify(map, null, 1) + '\n');
    console.log('constable_office.tmj written');
  }
}

// ======================= patches =======================
function patch(file, fn) {
  const f = R(`assets/levels/${file}`);
  const map = JSON.parse(readFileSync(f, 'utf8'));
  if (map.properties.some((p) => p.name === 'chapter3') && !force) { console.log(`${file}: already patched for Chapter 3`); return; }
  const gameplay = map.layers.find((l) => l.name === 'gameplay');
  let oid = map.nextobjectid || Math.max(0, ...gameplay.objects.map((o) => o.id)) + 1;
  const add = (type, name, x, y, properties) => gameplay.objects.push({ id: oid++, name, type, x, y, width: 0, height: 0, rotation: 0, visible: true, point: true, properties });
  const all = (name) => gameplay.objects.filter((o) => o.name === name);
  const prop = (name) => { const o = all(name)[0]; if (!o) throw new Error(`${file}: no object ${name}`); return o; };
  const get = (o, name) => (o.properties.find((p) => p.name === name) || {}).value;
  const setProp = (o, name, type, value) => { o.properties = (o.properties || []).filter((p) => p.name !== name); o.properties.push(P(name, type, value)); };
  fn({ add, prop, all, get, setProp, map });
  map.properties = map.properties.filter((p) => p.name !== 'chapter3');
  map.properties.push(P('chapter3', 'bool', true));
  map.nextobjectid = oid;
  writeFileSync(f, JSON.stringify(map, null, 1) + '\n');
  console.log(`${file}: patched for Chapter 3`);
}
const andIf = (o, get, setProp, cond) => { const cur = get(o, 'if'); setProp(o, 'if', 'string', JSON.stringify(cur ? { all: [JSON.parse(cur), cond] } : cond)); };

patch('main_street.tmj', ({ add, all, get, setProp }) => {
  add('door', 'officeDoor', 64, 225, [S('label', "Constable's office"), S('verb', 'Go in'), S('to', 'FINCH_OFFICE'), S('spawn', 'fromStreet'), S('phase', 'DAY'),
    S('if', { flag: 'ch3Started' }), S('blockedLines', 'Locked. A card in the window, in a careful hand: CONSTABLE OUT. ENQUIRE AT THE BLACK RAM.')]);
  add('spawn', 'fromOffice', 64, 225, [P('facing', 'float', 1)]);
  // on the third day Finch keeps to his office (the sheriff lies there until noon)
  for (const o of all('finch')) if (get(o, 'phase') === 'DAY') andIf(o, get, setProp, { notFlag: 'ch3Started' });
});

patch('room_4.tmj', ({ add, prop, get, setProp }) => {
  // the rug, once laid (day 2), stays laid; the bare boards belong to the first night only
  setProp(prop('r4_floor'), 'if', 'string', JSON.stringify({ notFlag: 'ch2Started' }));
  const rug = prop('r4_rug'); rug.properties = rug.properties.filter((p) => p.name !== 'phase'); setProp(rug, 'if', 'string', JSON.stringify({ flag: 'ch2Started' }));
  const rugProp = prop('rug'); rugProp.properties = rugProp.properties.filter((p) => p.name !== 'phase'); setProp(rugProp, 'if', 'string', JSON.stringify({ flag: 'ch2Started' }));
  // the third day: what Silas only looks for once he has seen Hale's coat, and then where the wardrobe leads
  add('interactable', 'r4_underbed', 332, 228, [S('label', 'Under the bed'), S('evidence', 'EV3_BUTTON'), P('important', 'bool', true), S('if', { all: [{ flag: 'ch3Started' }, { evidence: 'EV3_COAT' }] })]);
  andIf(prop('r4_wardrobe'), get, setProp, { any: [{ notFlag: 'ch3Started' }, { noEvidence: 'EV3_BUTTON' }] });
  add('interactable', 'r4_panel', 91, 174, [S('label', 'Wardrobe'), S('evidence', 'EV3_PANEL'), P('important', 'bool', true), S('if', { all: [{ flag: 'ch3Started' }, { evidence: 'EV3_BUTTON' }] })]);
  add('interactable', 'r4_stair', 66, 206, [S('label', 'Service stair'), S('evidence', 'EV3_GLOVE'), S('if', { flag: 'stairFound' })]);
});

patch('black_ram_parlor.tmj', ({ add, all, get, setProp, map }) => {
  for (const o of all('finch')) if (get(o, 'phase') === 'DAY') setProp(o, 'if', 'string', JSON.stringify({ any: [{ flag: 'ch2Supper' }, { flag: 'ch3Supper' }] }));
  // the third night: Mrs. Gable has gone up (her night self lives in the map's `night` override)
  const nightProp = map.properties.find((p) => p.name === 'night');
  const night = JSON.parse(nightProp.value);
  for (const n of night.npcs || []) if (n.id === 'gable') n.if = { notFlag: 'ch3Night' };
  nightProp.value = JSON.stringify(night);
  const mp = all('pl_front')[0];
  andIf(mp, get, setProp, { notFlag: 'ch3Night' });
  setProp(mp, 'blockedLines', 'string', 'Bolted, and Mrs. Gable has the key upstairs. I\'m sitting up with the stair tonight in any case.');
  add('prop', 'coffeePot', 0, 0, [S('propType', 'coffeePot'), S('args', [102, 149]), S('if', { flag: 'ch3Night' })]);
  add('interactable', 'pl_pot', 152, 206, [S('label', 'Coffee pot'), S('dialogue', 'COFFEE'), S('verb', 'Look at'), S('if', { all: [{ flag: 'ch3Night' }, { notFlag: 'drankCoffee' }] })]);
  add('interactable', 'pl_cup', 168, 214, [S('label', 'My cup'), S('evidence', 'EV3_CUP'), P('important', 'bool', true), S('if', { flag: 'woke3' })]);
  add('interactable', 'pl_tin', 128, 160, [S('label', 'Coffee tin'), S('evidence', 'EV3_TIN'), P('important', 'bool', true), S('if', { flag: 'woke3' })]);
  add('interactable', 'pl_kitchen', 500, 200, [S('label', 'Kitchen passage'), S('lines', 'The door to the kitchen passage stands an inch open. Mrs. Gable bolts it every night; I watched her do it. Beyond it, the back stair goes up into the dark.'), S('if', { flag: 'woke3' })]);
});

patch('black_ram_exterior.tmj', ({ prop, get, setProp }) => {
  const door = prop('hotelDoor');
  const cur = JSON.parse(get(door, 'scriptIf'));
  setProp(door, 'scriptIf', 'string', JSON.stringify([cur, { if: { all: [{ phase: 'DAY' }, { flag: 'ch3DuskReady' }, { notFlag: 'ch3Night' }] }, script: 'CH3_EVENING' }]));
});

patch('chapel_graveyard.tmj', ({ add }) => {
  add('prop', 'newGrave', 0, 0, [S('propType', 'newGrave'), S('args', [176, 152]), S('if', { flag: 'burialOn' })]);
  add('npc', 'mercer', 316, 225, [S('label', 'Gideon Mercer'), S('sprite', 'mercer_idle'), S('dialogue', 'MERCER'), P('facing', 'float', -1), S('if', { all: [{ flag: 'burialOn' }, { notFlag: 'mercerGone' }] })]);
  add('npc', 'finch', 356, 225, [S('label', 'Constable Finch'), S('sprite', 'finch_idle'), S('dialogue', 'FINCH_OFFICE'), P('facing', 'float', -1), S('if', { all: [{ flag: 'burialOn' }, { notFlag: 'mercerGone' }] })]);
  add('interactable', 'gy_heel', 300, 222, [S('label', 'Prints by the grave'), S('evidence', 'EV3_HEEL'), S('if', { flag: 'burialDone' })]);
  add('interactable', 'gy_newgrave', 264, 214, [S('label', 'Hale\'s grave'), S('lines', 'Frozen earth, broken with a pick and thrown back. A plank with his name burned in it, until there\'s a stone.'), S('if', { flag: 'burialOn' })]);
  add('event', 'BURIAL', 0, 0, [S('script', 'BURIAL'), S('if', { all: [{ flag: 'ch3Started' }, { flag: 'ch3SawHale' }, { notFlag: 'burialDone' }] })]);
  add('event', 'MERCER_GONE', 0, 0, [S('do', [{ set: { mercerGone: true } }]), S('if', { all: [{ flag: 'burialDone' }, { notFlag: 'mercerGone' }] })]);
});
