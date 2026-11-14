// Builds Chapter 2's three new Tiled maps and patches the existing maps for the second day (the DAY phase):
//   assets/levels/rusk_store.tmj       RUSK_STORE  Rusk's general store, inside (30×17 tiles, one screen)
//   assets/levels/chapel_graveyard.tmj GRAVEYARD   the chapel and graveyard above Main Street (48×17)
//   assets/levels/telegraph_tower.tmj  TELEGRAPH   the telegraph tower on the shoulder of the ridge (42×17)
// and, in place: main_street.tmj (day sky, the store door and the chapel lane, Finch by day), black_ram_exterior.tmj
// (day sky, the hotel door ends the day once the case is ready), black_ram_parlor.tmj (Mrs. Gable by day).
// Art: tools/make-chapter2-art.mjs (run it first). Interactable / dialogue / evidence ids are in src/data/.
//
// Run it ONCE; after that Tiled owns the maps. It refuses to overwrite a new map or re-patch an old one unless --force.
//
//   node tools/make-chapter2-art.mjs && node tools/make-chapter2-levels.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const force = process.argv.includes('--force');
const R = (p) => resolve(root, p);
const P = (name, type, value) => ({ name, type, value });
const S = (name, value) => P(name, 'string', typeof value === 'string' ? value : JSON.stringify(value));
const h = (a, b, s = 0) => { let n = Math.imul(a * 374761393 + b * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) % 1024 / 1024; };
const ids = (name) => JSON.parse(readFileSync(R(`tools/data/${name}_tiles.json`), 'utf8'));
const count = (tsj) => JSON.parse(readFileSync(R(`assets/levels/tilesets/${tsj}.tsj`), 'utf8')).tilecount;

// A map under construction: tilesets by key, tile layers, objects.
function newMap(cols, { tilesets, props }) {
  const ROWS = 17;
  let gid = 1;
  const ts = {}, tsList = [];
  for (const [key, tsj, json] of tilesets) { ts[key] = { first: gid, ids: json ? ids(json) : null }; tsList.push({ firstgid: gid, source: `tilesets/${tsj}.tsj` }); gid += count(tsj); }
  const layers = [];
  let lid = 1, oid = 1;
  const m = {
    cols, ROWS, ts,
    g(key, name) { const t = ts[key]; if (typeof name === 'number') return t.first + name; if (!(name in t.ids)) throw new Error(`no tile ${key}.${name}`); return t.first + t.ids[name]; },
    tiles(name, extra = {}) { const l = { id: lid++, name, type: 'tilelayer', width: cols, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data: new Array(cols * ROWS).fill(0), ...extra }; layers.push(l); return l; },
    image(name, image, extra = {}) { layers.push({ id: lid++, name, type: 'imagelayer', image, x: 0, y: 0, opacity: 1, visible: true, ...extra }); },
    put(l, c, r, g) { if (c >= 0 && c < cols && r >= 0 && r < ROWS) l.data[r * cols + c] = g; },
    block(l, key, name, c0, r0, wt, ht) { for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) m.put(l, c0 + c, r0 + r, m.g(key, `${name}_${r}_${c}`)); },
    objects: [],
    obj(type, name, x, y, properties = [], extra = {}) { m.objects.push({ id: oid++, name, type, x, y, width: 0, height: 0, rotation: 0, visible: true, point: true, properties, ...extra }); },
    rect(type, name, x, y, w, hh, properties = []) { m.objects.push({ id: oid++, name, type, x, y, width: w, height: hh, rotation: 0, visible: true, properties }); },
    finish() {
      layers.push({ id: lid++, name: 'gameplay', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects: m.objects });
      return { type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down', width: cols, height: ROWS,
        tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1, nextlayerid: lid, nextobjectid: oid, properties: props, tilesets: tsList, layers };
    },
  };
  return m;
}
function writeNew(file, map) {
  const f = R(`assets/levels/${file}`);
  if (existsSync(f) && !force) { console.log(`${file} exists; Tiled owns it (use --force to rebuild it).`); return; }
  writeFileSync(f, JSON.stringify(map, null, 1) + '\n');
  console.log(`${file} written: ${map.width}×${map.height} tiles`);
}
const BR_SNOW_TOP = 7, BR_SNOW_FILL = 8;
const groundRows = (m, l) => { for (let c = 0; c < m.cols; c++) { m.put(l, c, 14, m.g('br', BR_SNOW_TOP)); m.put(l, c, 15, m.g('br', BR_SNOW_FILL)); m.put(l, c, 16, m.g('br', BR_SNOW_FILL)); } };
const DAY_SKY = '../export/environments/parallax/town_sky_day.png';

// ======================= RUSK_STORE =======================
{
  const m = newMap(30, {
    tilesets: [['hotel', 'hotel_interior', 'hotel'], ['st', 'store_interior', 'store']],
    props: [S('name', "RUSK'S GENERAL STORE"), P('exterior', 'bool', false), P('travel', 'float', 1), S('ambience', 'room4'), P('darkness', 'float', 0.3),
      S('ambient', 'warm'), S('surface', 'wood'), S('day', { darkness: 0.22 })],
  });
  const room = m.tiles('room'), furn = m.tiles('furniture');
  for (let c = 0; c < 30; c++) {
    m.put(room, c, 0, m.g('st', c % 6 === 3 ? 'ceiling_beam' : 'ceiling')); m.put(room, c, 1, m.g('st', 'ceiling'));
    m.put(room, c, 2, m.g('st', 'wall_top'));
    for (let r = 3; r < 13; r++) m.put(room, c, r, m.g('st', c >= 28 ? 'wall_shadow' : (c + (r > 7 ? 1 : 0)) % 2 ? 'wall_a' : 'wall_b'));
    m.put(room, c, 13, m.g('st', 'skirting'));
    m.put(room, c, 14, m.g('hotel', 'floor_top'));
    m.put(room, c, 15, m.g('hotel', ['floor_a', 'floor_b', 'floor_c'][c % 3])); m.put(room, c, 16, m.g('st', 'floor_shadow'));
  }
  m.block(furn, 'st', 'door', 1, 11, 2, 3);
  m.block(furn, 'st', 'window', 4, 8, 3, 3);
  m.block(furn, 'st', 'barrels', 4, 12, 3, 2);
  for (let r = 2; r < 10; r++) m.put(furn, 8, r, m.g('st', 'pipe'));
  m.block(furn, 'st', 'stove', 8, 10, 2, 4);
  m.block(furn, 'st', 'boot_rack', 10, 12, 3, 2);
  m.block(furn, 'st', 'shelves', 14, 4, 6, 6);
  m.block(furn, 'st', 'counter', 13, 11, 7, 3);
  m.block(furn, 'st', 'lamp', 11, 2, 1, 2); m.block(furn, 'st', 'lamp', 20, 2, 1, 2);
  m.block(furn, 'st', 'sacks', 22, 12, 2, 2);
  m.block(furn, 'st', 'crates', 24, 12, 2, 2);
  m.block(furn, 'st', 'powder_crate', 26, 12, 3, 2);
  m.rect('bounds', 'walkable', 36, 187.5, 420, 90);
  m.obj('spawn', 'fromStreet', 48, 225, [P('facing', 'float', 1)]);
  m.obj('door', 'st_door', 32, 225, [S('label', 'Main Street'), S('verb', 'Go out'), S('to', 'VILLAGE'), S('spawn', 'fromStore'), P('minutes', 'float', 1)]);
  m.obj('interactable', 'st_oil', 90, 205, [S('label', 'Oil barrels'), S('evidence', 'STORE_OIL')]);
  m.obj('interactable', 'st_stove', 136, 200, [S('label', 'Stove'), S('lines', 'A pot-bellied stove, banked up hot. The only warm thing in Crow\'s Hollow that doesn\'t want something from me.'), P('warm', 'bool', true)]);
  m.obj('interactable', 'st_boots', 184, 208, [S('label', 'Boot rack'), S('evidence', 'STORE_BOOTS')]);
  m.obj('interactable', 'st_ledger', 238, 190, [S('label', 'Account book'), S('evidence', 'STORE_LEDGER'), P('important', 'bool', true)]);
  m.obj('interactable', 'st_shelves', 288, 120, [S('label', 'Shelves'), S('lines', 'Tins, jars, cloth, lamp chimneys, cartridges. Everything a snowed-in town needs, and not much of it.'), S('again', 'Prices chalked on the shelf edges, and chalked up again lately.')]);
  m.obj('npc', 'rusk', 344, 225, [S('label', 'Jonah Rusk'), S('sprite', 'rusk_idle'), S('dialogue', 'RUSK'), P('facing', 'float', -1)]);
  m.obj('interactable', 'st_sacks', 376, 208, [S('label', 'Sacks'), S('lines', 'Flour, oats, coffee beans. The flour sacks are stamped with a Denver mill.')]);
  m.obj('interactable', 'st_crate', 440, 206, [S('label', 'Long crate'), S('evidence', 'STORE_CRATE'), P('important', 'bool', true)]);
  m.obj('light', 'stoveGlow', 136, 196, [P('r', 'float', 64), P('warm', 'float', 0.26)]);
  m.obj('light', 'window', 88, 150, [P('r', 'float', 80), P('warm', 'float', 0), P('strength', 'float', 0.8)]);
  m.obj('light', 'shopLight', 300, 150, [P('r', 'float', 110), P('warm', 'float', 0.08), P('strength', 'float', 0.7)]);
  m.obj('event', 'STORE_ENTER', 0, 0, [S('script', 'STORE_ENTER'), S('if', { notFlag: 'storeEntered' })]);
  writeNew('rusk_store.tmj', m.finish());
}

// ======================= GRAVEYARD =======================
{
  const m = newMap(48, {
    tilesets: [['br', 'black_ram_exterior', null], ['ms', 'main_street_exterior', 'main_street'], ['sm', 'sawmill_exterior', 'sawmill'], ['hs', 'hillside_exterior', 'hillside']],
    props: [S('name', 'THE CHAPEL AND THE GRAVES'), P('exterior', 'bool', true), P('travel', 'float', 6), S('ambience', 'road'), P('darkness', 'float', 0.3),
      P('snow', 'float', 0.55), P('wind', 'float', 0.6), P('fog', 'float', 0.22), S('day', { darkness: 0.28 })],
  });
  m.image('sky', DAY_SKY, { parallaxx: 0 });
  m.image('mountains', '../export/environments/parallax/town_mountains.png', { parallaxx: 0.08 });
  m.image('pines_far', '../export/environments/parallax/road_pines_far.png', { parallaxx: 0.4, repeatx: true });
  const ground = m.tiles('ground'), back = m.tiles('back'), graves = m.tiles('graves'), details = m.tiles('details');
  groundRows(m, ground);
  m.block(back, 'hs', 'chapel', 2, 4, 8, 10);
  for (let c = 12; c <= 40; c++) m.put(back, c, 13, m.g('hs', c % 7 === 5 ? 'rail_post' : 'rail'));
  const stones = [[14, 'stone_round'], [17, 'cross_wood'], [19, 'stone_tall'], [22, 'stone_lean'], [24, 'stone_round'], [27, 'cross_wood'], [37, 'stone_tall'], [39, 'stone_lean']];
  for (const [c, n] of stones) m.block(graves, 'hs', n, c, 12, 1, 2);
  m.block(graves, 'hs', 'pell_stone', 30, 12, 2, 2);
  m.block(graves, 'hs', 'grave_closed', 32, 13, 4, 1);
  m.block(back, 'ms', 'pine_a', 42, 8, 4, 6); m.block(back, 'ms', 'pine_b', 11, 10, 2, 4); m.block(back, 'ms', 'pine_b', 46, 10, 2, 4);
  for (let c = 0; c < 48; c++) if (h(c, 1, 3) > 0.7 && (c < 2 || c > 10)) m.put(details, c, 14, m.g('hs', 'path_stones'));
  m.rect('bounds', 'walkable', 9, 187.5, 750, 90);
  m.obj('spawn', 'fromVillage', 24, 225, [P('facing', 'float', 1)]);
  m.obj('spawn', 'fromTower', 744, 225, [P('facing', 'float', -1)]);
  m.obj('exit', 'westEdge', 0, 176, [S('side', 'left'), S('to', 'VILLAGE'), S('spawn', 'fromChapel')]);
  m.obj('exit', 'eastEdge', 768, 176, [S('side', 'right'), S('to', 'TELEGRAPH'), S('spawn', 'fromChapel')]);
  m.obj('interactable', 'gy_door', 96, 200, [S('label', 'Chapel door'), S('lines', 'Shut, and the latch is cold. Through the crack: dark pews, and the smell of a stove let go out.')]);
  m.obj('interactable', 'gy_bell', 152, 120, [S('label', 'Bell'), S('lines', 'A small bell in the cote. The rope hangs inside. Whoever rings it can see the whole town from the door.')]);
  m.obj('npc', 'vale', 208, 225, [S('label', 'Reverend Vale'), S('sprite', 'vale_idle'), S('dialogue', 'VALE'), P('facing', 'float', 1)]);
  m.obj('interactable', 'gy_rows', 296, 205, [S('label', 'Graves'), S('lines', 'Names and dates, most of them miners. Eighteen-seventy-one, seventy-two, seventy-two, seventy-two.'), S('again', 'A bad year, seventy-two. The year the Pale workings closed.')]);
  m.obj('interactable', 'gy_pell', 488, 200, [S('label', 'Headstone'), S('evidence', 'GRAVE_STONE')]);
  m.obj('interactable', 'gy_grave', 540, 220, [S('label', 'Disturbed grave'), S('evidence', 'GRAVE_DISTURBED'), P('important', 'bool', true), S('if', { notFlag: 'graveOpened' })]);
  m.obj('interactable', 'gy_cache', 540, 220, [S('label', 'What was buried'), S('evidence', 'GRAVE_CACHE'), P('important', 'bool', true), S('if', { flag: 'graveOpened' })]);
  m.obj('interactable', 'gy_prints', 604, 222, [S('label', 'Prints by the fence'), S('evidence', 'GRAVE_PRINTS'), P('important', 'bool', true)]);
  m.obj('interactable', 'gy_wire', 712, 180, [S('label', 'Path'), S('lines', 'The path climbs on past the graves, along the line of telegraph poles.')]);
  m.obj('prop', 'graveOpen', 0, 0, [S('propType', 'stamp'), S('id', 'graveOpen'), S('args', ['assets/levels/tilesets/hillside_exterior.tsj', 'grave_open', 4, 2, 512, 192]), S('if', { flag: 'graveOpened' })]);
  m.obj('event', 'GRAVEYARD_ENTER', 0, 0, [S('script', 'GRAVEYARD_ENTER'), S('if', { notFlag: 'graveyardEntered' })]);
  writeNew('chapel_graveyard.tmj', m.finish());
}

// ======================= TELEGRAPH =======================
{
  const m = newMap(42, {
    tilesets: [['br', 'black_ram_exterior', null], ['ms', 'main_street_exterior', 'main_street'], ['stn', 'station_exterior', 'station'], ['hs', 'hillside_exterior', 'hillside']],
    props: [S('name', 'THE TELEGRAPH TOWER'), P('exterior', 'bool', true), P('travel', 'float', 9), S('ambience', 'road'), P('darkness', 'float', 0.32),
      P('snow', 'float', 0.7), P('wind', 'float', 0.85), P('fog', 'float', 0.3), S('day', { darkness: 0.3 })],
  });
  m.image('sky', DAY_SKY, { parallaxx: 0 });
  m.image('mountains', '../export/environments/parallax/sawmill_mountains_far.png', { parallaxx: 0.06 });
  m.image('ridge', '../export/environments/parallax/sawmill_ridge.png', { parallaxx: 0.22, offsety: 30 });
  m.image('pines_far', '../export/environments/parallax/road_pines_far.png', { parallaxx: 0.4, repeatx: true, offsety: 14 });
  const ground = m.tiles('ground'), back = m.tiles('back'), structure = m.tiles('structure'), details = m.tiles('details');
  groundRows(m, ground);
  // telegraph poles along the path, the wire from pole to pole and on to the tower
  for (const pc of [6, 15]) {
    m.put(structure, pc - 1, 3, m.g('stn', 'pole_cross_l')); m.put(structure, pc, 3, m.g('stn', 'pole_cross_m')); m.put(structure, pc + 1, 3, m.g('stn', 'pole_cross_r'));
    for (let r = 4; r < 13; r++) m.put(structure, pc, r, m.g('stn', 'pole')); m.put(structure, pc, 13, m.g('stn', 'pole_foot'));
  }
  for (let c = 0; c < 24; c++) if (![6, 15].includes(c)) m.put(details, c, 3, m.g('hs', 'wire_span'));
  m.block(structure, 'hs', 'tower', 24, 3, 5, 11);
  m.block(details, 'hs', 'wire_cut', 29, 3, 2, 3);
  for (let c = 31; c < 42; c++) m.put(details, c, 3, m.g('hs', 'wire_span'));
  m.put(details, 26, 4, m.g('hs', 'soot_hook'));
  m.block(back, 'hs', 'rock_big', 33, 12, 3, 2); m.block(back, 'hs', 'rock_small', 11, 13, 2, 1); m.block(back, 'hs', 'rock_small', 38, 13, 2, 1);
  m.block(back, 'ms', 'pine_a', 0, 8, 4, 6); m.block(back, 'ms', 'pine_b', 20, 10, 2, 4); m.block(back, 'ms', 'pine_a', 38, 8, 4, 6);
  m.rect('bounds', 'walkable', 9, 187.5, 654, 90);
  m.obj('spawn', 'fromChapel', 24, 225, [P('facing', 'float', 1)]);
  m.obj('exit', 'westEdge', 0, 176, [S('side', 'left'), S('to', 'GRAVEYARD'), S('spawn', 'fromTower')]);
  m.obj('exit', 'eastEdge', 672, 176, [S('side', 'right'), S('to', 'TELEGRAPH'), S('spawn', 'fromChapel'), S('if', { flag: 'never' }),
    S('blockedLines', 'The path runs on along the ridge, toward the old workings. Not today, and not without knowing what is up there.')]);
  m.obj('interactable', 'tw_pole', 104, 190, [S('label', 'Telegraph pole'), S('lines', 'A pole of the line from the station, the glass insulators frosted. The wire here is whole and humming in the wind.')]);
  m.obj('npc', 'ada', 352, 225, [S('label', 'Ada Bell'), S('sprite', 'ada_idle'), S('dialogue', 'ADA'), P('facing', 'float', 1)]);
  m.obj('interactable', 'tw_soot', 418, 84, [S('label', 'Lantern hook'), S('evidence', 'TOWER_SOOT'), P('important', 'bool', true)]);
  m.obj('interactable', 'tw_wire', 474, 110, [S('label', 'Hanging wire'), S('evidence', 'TOWER_WIRE'), P('important', 'bool', true)]);
  m.obj('interactable', 'tw_view', 540, 200, [S('label', 'The valley'), S('evidence', 'TOWER_VIEW')]);
  m.obj('event', 'TOWER_ENTER', 0, 0, [S('script', 'TOWER_ENTER'), S('if', { notFlag: 'towerEntered' })]);
  writeNew('telegraph_tower.tmj', m.finish());
}

// ======================= patches to the existing maps =======================
function patch(file, marker, fn) {
  const f = R(`assets/levels/${file}`);
  const map = JSON.parse(readFileSync(f, 'utf8'));
  const objs = (function find(ls) { for (const l of ls) { if (l.type === 'objectgroup') return l; if (l.layers) { const x = find(l.layers); if (x) return x; } } return null; })(map.layers);
  if ((map.properties || []).some((p) => p.name === 'chapter2') && !force) { console.log(`${file} already patched for Chapter 2; left unchanged.`); return; }
  void marker;
  let oid = map.nextobjectid || Math.max(...objs.objects.map((o) => o.id)) + 1;
  const add = (type, name, x, y, properties = []) => { objs.objects.push({ id: oid++, name, type, x, y, width: 0, height: 0, rotation: 0, visible: true, point: true, properties }); };
  const prop = (name) => objs.objects.find((o) => o.name === name);
  const setProp = (o, name, type, value) => { o.properties = (o.properties || []).filter((p) => p.name !== name); o.properties.push(P(name, type, value)); };
  const addDaySky = () => {
    const grp = map.layers.find((l) => l.type === 'group' && l.name === 'parallax');
    if (!grp || grp.layers.some((l) => l.name === 'sky_day')) return;
    const at = grp.layers.findIndex((l) => l.name === 'sky_night') + 1;
    grp.layers.splice(at, 0, { id: map.nextlayerid++, name: 'sky_day', type: 'imagelayer', image: DAY_SKY, x: 0, y: 0, opacity: 1, visible: true, parallaxx: 0, properties: [S('phase', 'DAY')] });
  };
  const setMapProp = (name, value) => { map.properties = map.properties.filter((p) => p.name !== name); map.properties.push(S(name, value)); };
  fn({ add, prop, setProp, addDaySky, setMapProp, map });
  map.properties = (map.properties || []).filter((p) => p.name !== 'chapter2');
  map.properties.push(P('chapter2', 'bool', true)); // patched once (see the header)
  map.nextobjectid = oid;
  writeFileSync(f, JSON.stringify(map, null, 1) + '\n');
  console.log(`${file}: patched for Chapter 2`);
}
const dayVariant = (o, lines) => { const v = o.properties.find((p) => p.name === 'variants'); const list = JSON.parse(v.value); if (!list.some((x) => x.if && x.if.phase === 'DAY')) list.unshift({ if: { phase: 'DAY' }, lines }); v.value = JSON.stringify(list); };

patch('main_street.tmj', 'storeDoor', ({ add, prop, setProp, addDaySky, setMapProp }) => {
  addDaySky();
  setMapProp('day', { darkness: 0.3, ambience: 'village', weather: { snow: 0.55, wind: 0.5, fog: 0.2 } });
  add('door', 'storeDoor', 296, 225, [S('label', "Rusk's store"), S('verb', 'Go in'), S('to', 'RUSK_STORE'), S('spawn', 'fromStreet'), S('phase', 'DAY')]);
  add('door', 'chapelLane', 560, 225, [S('label', 'Chapel lane'), S('verb', 'Walk up'), S('to', 'GRAVEYARD'), S('spawn', 'fromVillage'), P('minutes', 'float', 4), S('phase', 'DAY')]);
  add('spawn', 'fromStore', 296, 225, [P('facing', 'float', 1)]);
  add('spawn', 'fromChapel', 560, 225, [P('facing', 'float', -1)]);
  add('npc', 'finch', 150, 225, [S('label', 'Constable Finch'), S('sprite', 'finch_idle'), S('dialogue', 'FINCH_DAY'), P('facing', 'float', 1), S('phase', 'DAY')]);
  add('event', 'VILLAGE_DAY', 0, 0, [S('bark', 'Main Street by daylight. Smoke from the chimneys, and nobody out who doesn\'t have to be.'), S('do', [{ set: { villageDaySeen: true } }]), S('if', { all: [{ phase: 'DAY' }, { notFlag: 'villageDaySeen' }] })]);
  const west = prop('westEdge');
  setProp(west, 'if', 'string', JSON.stringify({ any: [{ phase: 'EVENING' }, { phase: 'NIGHT' }] }));
  setProp(west, 'blockedLines', 'string', 'The road goes down to the station. No train will come up today, and nothing I need is down there.');
  dayVariant(prop('ms_lamp'), ['The street lamp, cold. Someone has trimmed the wick ready for tonight.']);
  dayVariant(prop('vl_window'), ['A cabin window, the curtain drawn even by day.']);
  const store = prop('vl_store');
  const lines = store.properties.find((p) => p.name === 'lines').value;
  store.properties = store.properties.filter((p) => p.name !== 'lines');
  store.properties.push(S('variants', [{ if: { phase: 'DAY' }, lines: ['Rusk\'s store, open: smoke from the stovepipe, the door on the latch. The account book is gone from the window.'] }, { if: {}, lines: [lines] }]));
});

patch('black_ram_exterior.tmj', 'CH2_DAY_EXIT', ({ add, prop, setProp, addDaySky, setMapProp }) => {
  addDaySky();
  setMapProp('day', { darkness: 0.3, ambience: 'village', weather: { snow: 0.55, wind: 0.5, fog: 0.2 } });
  setProp(prop('eastEdge'), 'blockedLines', 'string', 'The path drops away toward the creek and the old mill. Nothing more for me down there now.');
  const door = prop('hotelDoor');
  // the second day ends at the hotel door: once the day's work is done, going in settles it with Finch over supper
  setProp(door, 'scriptIf', 'string', JSON.stringify({ if: { all: [{ phase: 'DAY' }, { flag: 'ch2DuskReady' }, { notFlag: 'chapter2Complete' }] }, script: 'CH2_END' }));
  add('event', 'CH2_DAY_EXIT', 0, 0, [S('bark', 'The Black Ram by day: the porch swept, the lamp out, every curtain drawn.'), S('do', [{ set: { forecourtDaySeen: true } }]), S('if', { all: [{ phase: 'DAY' }, { notFlag: 'forecourtDaySeen' }, { flag: 'ch2Started' }] }), P('delay', 'float', 1.5)]);
  dayVariant(prop('lampPost'), ['The street lamp, out. Oil costs money up here, and daylight is free.']);
});

patch('black_ram_parlor.tmj', 'gableDay', ({ add, setMapProp }) => {
  setMapProp('day', { darkness: 0.24, ambience: 'parlor' });
  add('npc', 'gable', 414, 225, [S('label', 'Mrs. Gable'), S('sprite', 'gable_idle'), S('dialogue', 'GABLE_DAY'), P('facing', 'float', -1), P('z', 'float', 2), S('phase', 'DAY')]);
  // the second day's supper with Finch (CH2_END): Finch at the fire, the fire lit, only while `ch2Supper` holds
  add('npc', 'finch', 183, 225, [S('label', 'Constable Finch'), S('sprite', 'finch_idle'), S('dialogue', 'FINCH_DAY'), P('facing', 'float', 1), S('phase', 'DAY'), S('if', { flag: 'ch2Supper' })]);
  add('prop', 'fire', 0, 0, [S('propType', 'fire'), S('args', [84, 148]), S('id', 'fireSupper'), S('if', { all: [{ phase: 'DAY' }, { flag: 'ch2Supper' }] })]);
});

patch('room_4.tmj', 'r4_day', ({ setMapProp }) => {
  setMapProp('day', { darkness: 0.3 });
});
