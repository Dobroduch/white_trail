// Builds Chapter 5's new Tiled maps and patches the existing maps for the fourth night:
//   assets/levels/ridge_path.tmj         RIDGE        the ridge path in the storm, east of the telegraph tower (60×17):
//                                                    the second cut in the wire, the Pale Figure, the mine mouth, the
//                                                    spur up to the cabin; Finch in the snow if he went up after "the woman"
//   assets/levels/observatory_cabin.tmj  OBSERVATORY  Clara's mother's cabin, the old observatory, above the workings (27×17)
//   assets/levels/pale_workings.tmj      WORKINGS     the Pale workings: the drift, the paymaster's chest, the 1872 fall (39×17)
// and, in place:
//   telegraph_tower.tmj     the tower's east edge opens onto the ridge on the fourth night; no way back down that night;
//                           Ada Bell is not at the tower at night
//   black_ram_parlor.tmj    after "Sit by the fire a while" on the fourth day's end card: the front door takes Silas up
//                           the ridge (NIGHT_GO)
// The ridge reuses the road's parallax and ground (wilderness tiles) with hillside rocks and a cut wire; the cabin is
// built from store / hotel interior tiles; the workings from the wheel pit's stone and timber. The mine mouth, the Pale
// Figure, the telescope, the chest, the charge and the fall are props (src/world/props.js). Art:
// tools/make-chapter5-art.mjs. Ids of interactables / dialogue / evidence: src/data/.
//
// Run it ONCE; after that Tiled owns the maps. It refuses to overwrite a new map or re-patch an old one unless --force.
//   node tools/make-chapter5-art.mjs && node tools/make-chapter5-levels.mjs
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
const h = (a, b, s = 0) => { let n = Math.imul(a * 374761393 + b * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) % 1024 / 1024; };
const writeMap = (f, map) => { writeFileSync(f, JSON.stringify(map, null, 1) + '\n'); };
const objectsOf = () => {
  const objs = []; let oid = 1;
  const obj = (type, name, x, y, properties = [], w = 0, hh = 0) => objs.push({ id: oid++, name, type, x, y, width: w, height: hh, rotation: 0, visible: true, point: !w, properties });
  return { objs, obj, next: () => oid };
};
// who is where on the fourth night
const CLARA_AT_CABIN = { all: [{ flag: 'knowsObservatory' }, { notFlag: 'huntForGuest' }] };

// ======================= RIDGE =======================
{
  const f = R('assets/levels/ridge_path.tmj');
  if (existsSync(f) && !force) console.log('ridge_path.tmj exists; Tiled owns it (use --force to rebuild it).');
  else {
    const road = JSON.parse(readFileSync(R('assets/levels/road_to_crows_hollow.tmj'), 'utf8'));
    const RC = road.width, COLS = 60, ROWS = road.height;
    const WI = ids('wilderness'), HI = ids('hillside');
    const HS = 1 + count('wilderness_exterior'); // the hillside tileset after the wilderness one
    const drop = new Set(Object.entries(WI).filter(([k]) => /^(sign_crow|sign_crow_wide|notice|orecar)_\d+_\d+$/.test(k)).map(([, v]) => v + 1));
    const cut = (l) => {
      const out = Object.assign({}, l, { width: COLS, data: new Array(COLS * ROWS).fill(0) });
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const g = l.data[r * RC + c]; out.data[r * COLS + c] = l.name === 'fence' || drop.has(g) ? 0 : g; }
      return out;
    };
    const layers = road.layers.filter((l) => l.type !== 'objectgroup').map((l) => (l.type === 'tilelayer' ? cut(l) : JSON.parse(JSON.stringify(l))));
    const L = (name) => layers.find((l) => l.name === name);
    const put = (l, c, r, g) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) l.data[r * COLS + c] = g; };
    const hs = (n) => { if (!(n in HI)) throw new Error('no hillside tile ' + n); return HS + HI[n]; };
    const wi = (n) => { if (!(n in WI)) throw new Error('no wilderness tile ' + n); return 1 + WI[n]; };
    const block = (l, g, n, c0, r0, wt, ht) => { for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) put(l, c0 + c, r0 + r, g(`${n}_${r}_${c}`)); };
    const behind = L('props_behind'), front = L('props_front');
    // rocks along the crest, the cut wire on its pole, an ore car rusted to its rail outside the mine mouth
    block(behind, hs, 'rock_big', 3, 12, 3, 2);
    block(behind, hs, 'wire_cut', 9, 11, 2, 3);
    block(behind, hs, 'rock_small', 17, 13, 2, 1);
    block(behind, hs, 'rock_big', 31, 12, 3, 2);
    block(behind, hs, 'rock_small', 40, 13, 2, 1);
    block(behind, wi, 'orecar', 44, 11, 3, 3);
    block(front, hs, 'rock_small', 40, 14, 2, 1);
    block(behind, hs, 'rock_big', 57, 12, 3, 2);
    const { objs, obj, next } = objectsOf();
    obj('bounds', 'walkable', 6, 187.5, [], 948, 90);
    const gr = road.layers.find((l) => l.type === 'objectgroup').objects.find((o) => o.type === 'ground');
    objs.push({ id: next(), name: 'ground', type: 'ground', x: 0, y: 0, width: 0, height: 0, rotation: 0, visible: true, properties: [],
      polyline: [{ x: 0, y: 228 }, { x: 180, y: 224 }, { x: 390, y: 230 }, { x: 600, y: 225 }, { x: 810, y: 229 }, { x: 960, y: 226 }] });
    obj('spawn', 'fromTower', 21, 225, [P('facing', 'float', 1)]);
    obj('spawn', 'fromWorkings', 846, 225, [P('facing', 'float', -1)]);
    obj('spawn', 'fromCabin', 938, 225, [P('facing', 'float', -1)]);
    obj('exit', 'westEdge', 0, 150, [S('side', 'left'), S('to', 'TELEGRAPH'), S('spawn', 'fromRidge')], 12, 0);
    obj('exit', 'eastEdge', 948, 150, [S('side', 'right'), S('to', 'OBSERVATORY'), S('spawn', 'fromRidge'), S('if', { flag: 'knowsObservatory' }),
      S('blockedLines', 'Above the mine mouth the path forks, and forks again, and the snow has filled every one. Without knowing what is up there, I would walk off the edge looking for it.')], 12, 0);
    obj('door', 'rg_mouth', 846, 225, [S('label', 'Mine mouth'), S('verb', 'Go in'), S('to', 'WORKINGS'), S('spawn', 'fromRidge'), P('minutes', 'float', 2),
      S('if', { any: [{ notFlag: 'knowsObservatory' }, { flag: 'huntForGuest' }, { flag: 'cabinVisited' }] }),
      S('blockedLines', 'Lamplight inside, far back, and the sound of a pick. Clara first. Whatever Cutler is doing in there, she is the one who saw what he did.')]);
    obj('interactable', 'rg_wire', 150, 180, [S('label', 'Telegraph wire'), S('evidence', 'EV5_WIRE')]);
    obj('interactable', 'rg_figure', 432, 170, [S('label', 'The pale shape'), S('evidence', 'EV5_FIGURE'), P('important', 'bool', true)]);
    obj('npc', 'finch', 588, 225, [S('label', 'Constable Finch'), S('sprite', 'finch_idle'), S('dialogue', 'FINCH_RIDGE'), P('facing', 'float', -1), S('if', { flag: 'huntForGuest' })]);
    obj('interactable', 'rg_tracks', 720, 214, [S('label', 'Tracks'), S('variants', [
      { if: { flag: 'huntForGuest' }, lines: ['Hoofprints of a shod horse, and beside them two sets of boots coming down from the summit spur: a man\'s, heavy, and a smaller pair that drags.'] },
      { if: {}, lines: ['Hoofprints, half filled: a shod horse led up to the mine mouth this afternoon. Beyond them, nearer and lighter, one small pair of boots going the same way, not an hour old.'] },
    ])]);
    obj('interactable', 'rg_valley', 290, 200, [S('label', 'The valley'), S('lines', 'Somewhere below, under the snow, is Crow\'s Hollow. From up here I could not tell you which way it lies.')]);
    obj('light', 'mouthGlow', 846, 196, [P('r', 'float', 40), P('warm', 'float', 0.5), P('strength', 'float', 0.5)]);
    obj('prop', 'paleFigure', 0, 0, [S('propType', 'paleFigure'), S('args', [288, 151])]);
    obj('prop', 'mineMouth', 0, 0, [S('propType', 'mineMouth'), S('args', [564, 151])]);
    obj('event', 'RIDGE_ENTER', 0, 0, [S('script', 'RIDGE_ENTER'), S('if', { notFlag: 'ridgeEntered' })]);
    obj('event', 'FIGURE_SEEN', 300, 150, [S('script', 'FIGURE_SEEN'), S('if', { notFlag: 'figureSeen' })], 60, 90);
    obj('event', 'BELL', 640, 150, [S('script', 'BELL'), S('if', { all: [{ flag: 'valeTurned' }, { notFlag: 'bellRang' }] })], 80, 90);
    const map = { type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down', width: COLS, height: ROWS,
      tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1, nextlayerid: 30, nextobjectid: next(),
      properties: [S('name', 'THE RIDGE'), P('exterior', 'bool', true), P('travel', 'float', 12), S('ambience', 'road'),
        P('darkness', 'float', 0.86), P('snow', 'float', 1), P('wind', 'float', 1), P('fog', 'float', 0.55)],
      tilesets: [{ firstgid: 1, source: 'tilesets/wilderness_exterior.tsj' }, { firstgid: HS, source: 'tilesets/hillside_exterior.tsj' }],
      layers: [...layers.filter((l) => l.name !== 'foreground'), { id: 20, name: 'gameplay', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects: objs },
        ...layers.filter((l) => l.name === 'foreground')] };
    writeMap(f, map);
    console.log('ridge_path.tmj written');
  }
}

// ======================= OBSERVATORY =======================
{
  const f = R('assets/levels/observatory_cabin.tmj');
  if (existsSync(f) && !force) console.log('observatory_cabin.tmj exists; Tiled owns it (use --force to rebuild it).');
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
      // a round-roofed cabin: the dome's ribs overhead, the slot in it shut with a canvas
      for (let r = 0; r < 2; r++) put(room, c, r, g('st', c % 4 === 2 ? 'ceiling_beam' : 'ceiling'));
      put(room, c, 2, g('st', 'wall_top'));
      for (let r = 3; r < 13; r++) put(room, c, r, g('st', c === 0 || c >= 24 ? 'wall_shadow' : (c + (r > 7 ? 1 : 0)) % 2 ? 'wall_a' : 'wall_b'));
      put(room, c, 13, g('st', 'skirting'));
      put(room, c, 14, g('hotel', 'floor_top'));
      put(room, c, 15, g('hotel', ['floor_a', 'floor_c', 'floor_b'][c % 3])); put(room, c, 16, g('st', 'floor_shadow'));
    }
    block(furn, 'st', 'door', 1, 11, 2, 3);
    block(furn, 'st', 'window', 5, 6, 3, 3);
    for (let r = 2; r < 10; r++) put(furn, 10, r, g('st', 'pipe'));
    block(furn, 'st', 'stove', 10, 10, 2, 4);
    block(furn, 'hotel', 'bed', 15, 9, 8, 5); // a narrow cot under the books
    block(furn, 'st', 'shelves', 17, 3, 6, 6); // her mother's books and plates
    block(furn, 'st', 'lamp', 13, 3, 1, 2);
    const { objs, obj, next } = objectsOf();
    obj('bounds', 'walkable', 36, 187.5, [], 330, 90);
    obj('spawn', 'fromRidge', 48, 225, [P('facing', 'float', 1)]);
    obj('door', 'ob_door', 32, 225, [S('label', 'The ridge'), S('verb', 'Go out'), S('to', 'RIDGE'), S('spawn', 'fromCabin'), P('minutes', 'float', 6)]);
    obj('npc', 'clara', 250, 225, [S('label', 'Clara Mercer'), S('sprite', 'clara_idle'), S('dialogue', 'CABIN_IN'), P('facing', 'float', -1),
      S('if', { all: [CLARA_AT_CABIN, { notFlag: 'claraWithSilas' }] })]);
    obj('interactable', 'ob_telescope', 120, 180, [S('label', 'Telescope'), S('evidence', 'EV5_TELESCOPE')]);
    obj('interactable', 'ob_table', 300, 200, [S('label', 'Table'), S('evidence', 'EV5_PAPERS'), P('important', 'bool', true)]);
    obj('interactable', 'ob_shelf', 300, 120, [S('label', 'Shelf'), S('lines', 'Star charts gone soft with damp, a box of glass plates, and a woman\'s hand in the margins: "M.M., Oct. 1871. Saturn clear." Her mother\'s.')]);
    obj('interactable', 'ob_upset', 210, 210, [S('label', 'Overturned chair'), S('if', { flag: 'huntForGuest' }),
      S('lines', 'A chair on its back, the stove door open and the fire kicked out across the floor. Somebody was taken out of here, and did not go quietly.')]);
    obj('light', 'stoveGlow', 166, 196, [P('r', 'float', 46), P('warm', 'float', 0.3)]);
    obj('light', 'lamp', 208, 120, [P('r', 'float', 80), P('warm', 'float', 0.25), P('strength', 'float', 0.8)]);
    obj('prop', 'telescope', 0, 0, [S('propType', 'telescope'), S('args', [80, 149])]);
    obj('event', 'CABIN_ENTER', 0, 0, [S('script', 'CABIN_ENTER'), S('if', { notFlag: 'cabinVisited' })]);
    const map = { type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down', width: cols, height: ROWS,
      tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1, nextlayerid: 4, nextobjectid: next(),
      properties: [S('name', 'THE OBSERVATORY CABIN'), P('exterior', 'bool', false), P('travel', 'float', 1), S('ambience', 'room4'), P('darkness', 'float', 0.4),
        S('ambient', 'cold'), S('surface', 'wood')],
      tilesets: tsList, layers: [room, furn, { id: 3, name: 'gameplay', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects: objs }] };
    writeMap(f, map);
    console.log('observatory_cabin.tmj written');
  }
}

// ======================= WORKINGS =======================
{
  const f = R('assets/levels/pale_workings.tmj');
  if (existsSync(f) && !force) console.log('pale_workings.tmj exists; Tiled owns it (use --force to rebuild it).');
  else {
    const COLS = 39, ROWS = 17, BR = 1, WP = 1 + count('black_ram_exterior');
    const ID = ids('wheel_pit');
    const W = (name) => { if (!(name in ID)) throw new Error('unknown wheel_pit tile ' + name); return WP + ID[name]; };
    const lay = () => new Array(COLS * ROWS).fill(0);
    const put = (l, c, r, g) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) l[r * COLS + c] = g; };
    const block = (l, name, c0, r0, wt, ht) => { for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) put(l, c0 + c, r0 + r, W(`${name}_${r}_${c}`)); };
    const back = lay(), frame = lay(), floor = lay(), detail = lay();
    // back: the rock of the drift, wet near the mouth; dark overhead
    for (let c = 0; c < COLS; c++) for (let r = 0; r < 14; r++) put(back, c, r, r < 3 ? W('void') : W(r === 3 ? 'stone_top' : c < 6 && r === 4 ? 'stone_wet' : h(c, r, 5) > 0.5 ? 'stone_a' : 'stone_b'));
    // the way in, top left: the mouth, open to the storm
    block(frame, 'shaft', 0, 11, 2, 3); for (let r = 3; r < 11; r++) { put(frame, 0, r, W(r % 2 ? 'stone_a' : 'stone_b')); put(frame, 1, r, W(r % 2 ? 'stone_b' : 'stone_a')); }
    // timbering: caps on posts every few yards, sagging toward the far end
    for (let c = 2; c < COLS; c++) { put(frame, c, 1, W('planks_under')); put(frame, c, 2, W(c % 7 === 4 ? 'beam_worn' : 'beam_h')); }
    for (const c of [3, 10, 17, 24, 31]) for (let r = 3; r < 14; r++) put(frame, c, r, W('post_v'));
    for (let c = 2; c < 8; c++) put(detail, c, 3, h(c, 3, 9) > 0.3 ? W('icicles') : 0);
    // floor: rock and old ice, snow blown in at the mouth
    for (let c = 0; c < COLS; c++) { put(floor, c, 14, W(c < 5 ? 'ice_top' : 'stone_top')); put(floor, c, 15, W(c < 5 ? 'ice_fill' : h(c, 15) > 0.5 ? 'stone_a' : 'stone_b')); put(floor, c, 16, W(h(c, 16) > 0.5 ? 'stone_b' : 'stone_a')); }
    put(detail, 2, 13, W('drift')); put(detail, 4, 13, W('drift'));
    const { objs, obj, next } = objectsOf();
    obj('bounds', 'walkable', 30, 187.5, [], 447, 90);
    obj('spawn', 'fromRidge', 42, 225, [P('facing', 'float', 1)]);
    obj('door', 'wk_out', 28, 225, [S('label', 'The ridge'), S('verb', 'Go out'), S('to', 'RIDGE'), S('spawn', 'fromWorkings'), P('minutes', 'float', 1),
      S('if', { notFlag: 'climaxStarted' }), S('blockedLines', 'Not now.')]);
    obj('interactable', 'wk_timber', 160, 160, [S('label', 'Timber'), S('evidence', 'EV5_TIMBER')]);
    obj('interactable', 'wk_chest', 354, 214, [S('label', 'Iron chest'), S('evidence', 'EV5_PAYROLL'), P('important', 'bool', true), S('if', { notFlag: 'workingsBlown' })]);
    obj('npc', 'mercer', 312, 225, [S('label', 'Gideon Mercer'), S('sprite', 'mercer_idle'), S('dialogue', 'MERCER_WK'), P('facing', 'float', 1)]);
    obj('npc', 'cutler', 450, 225, [S('label', 'Wade Cutler'), S('sprite', 'cutler_idle'), S('dialogue', 'CUTLER_FALL'), P('facing', 'float', -1),
      S('if', { all: [{ notFlag: 'cutlerShot' }, { notFlag: 'cutlerRan' }] })]);
    obj('npc', 'clara', 70, 225, [S('label', 'Clara Mercer'), S('sprite', 'clara_idle'), S('dialogue', 'CLARA_WK'), P('facing', 'float', 1),
      S('if', { all: [{ flag: 'claraWithSilas' }, { notFlag: 'claraLost' }] })]);
    obj('npc', 'clara', 489, 225, [S('label', 'Clara Mercer'), S('sprite', 'clara_idle'), S('dialogue', 'CLARA_WK'), P('facing', 'float', -1),
      S('if', { all: [{ notFlag: 'claraWithSilas' }, { notFlag: 'claraLost' }, { any: [{ notFlag: 'workingsBlown' }, { flag: 'townCame' }] }] })]);
    obj('light', 'mouth', 30, 186, [P('r', 'float', 54), P('strength', 'float', 0.35)]);
    obj('light', 'mercerLamp', 330, 186, [P('r', 'float', 80), P('warm', 'float', 0.6), P('strength', 'float', 0.9)]);
    obj('light', 'fallLamp', 470, 180, [P('r', 'float', 90), P('warm', 'float', 0.55)]);
    obj('prop', 'chest', 0, 0, [S('propType', 'chest'), S('args', [236, 150]), S('if', { notFlag: 'workingsBlown' })]);
    obj('prop', 'charge', 0, 0, [S('propType', 'charge'), S('args', [334, 150])]);
    obj('prop', 'fall', 0, 0, [S('propType', 'fall'), S('args', [345, 150])]);
    obj('event', 'WORKINGS_ENTER', 0, 0, [S('script', 'WORKINGS_ENTER'), S('if', { notFlag: 'workingsEntered' })]);
    obj('event', 'CLIMAX', 393, 150, [S('script', 'CLIMAX'), S('if', { notFlag: 'climaxStarted' })], 160, 90);
    let lid = 1;
    const tl = (name, data) => ({ id: lid++, name, type: 'tilelayer', width: COLS, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data });
    const map = { type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down', width: COLS, height: ROWS,
      tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1,
      properties: [S('name', 'THE PALE WORKINGS'), P('exterior', 'bool', true), P('nightSky', 'bool', false), P('travel', 'float', 1), S('ambience', 'creek'),
        P('darkness', 'float', 0.88), P('snow', 'float', 0.05), P('wind', 'float', 0.15), P('fog', 'float', 0.2), P('groundY', 'float', 224)],
      tilesets: [{ firstgid: BR, source: 'tilesets/black_ram_exterior.tsj' }, { firstgid: WP, source: 'tilesets/wheel_pit.tsj' }],
      layers: [tl('back', back), tl('frame', frame), tl('floor', floor), tl('details', detail),
        { id: lid++, name: 'gameplay', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects: objs }] };
    map.nextlayerid = lid; map.nextobjectid = next();
    writeMap(f, map);
    console.log('pale_workings.tmj written');
  }
}

// ======================= patches =======================
function patch(file, fn) {
  const f = R(`assets/levels/${file}`);
  const map = JSON.parse(readFileSync(f, 'utf8'));
  if (map.properties.some((p) => p.name === 'chapter5') && !force) { console.log(`${file}: already patched for Chapter 5`); return; }
  const gameplay = map.layers.find((l) => l.name === 'gameplay');
  let oid = map.nextobjectid || Math.max(0, ...gameplay.objects.map((o) => o.id)) + 1;
  const add = (type, name, x, y, properties) => gameplay.objects.push({ id: oid++, name, type, x, y, width: 0, height: 0, rotation: 0, visible: true, point: true, properties });
  const all = (name) => gameplay.objects.filter((o) => o.name === name);
  const prop = (name) => { const o = all(name)[0]; if (!o) throw new Error(`${file}: no object ${name}`); return o; };
  const get = (o, name) => (o.properties.find((p) => p.name === name) || {}).value;
  const setProp = (o, name, type, value) => { o.properties = (o.properties || []).filter((p) => p.name !== name); o.properties.push(P(name, type, value)); };
  fn({ add, prop, all, get, setProp, map });
  map.properties = map.properties.filter((p) => p.name !== 'chapter5');
  map.properties.push(P('chapter5', 'bool', true));
  map.nextobjectid = oid;
  writeMap(f, map);
  console.log(`${file}: patched for Chapter 5`);
}
const andIf = (o, get, setProp, cond) => { const cur = get(o, 'if'); setProp(o, 'if', 'string', JSON.stringify(cur ? { all: [JSON.parse(cur), cond] } : cond)); };

patch('telegraph_tower.tmj', ({ add, prop, get, setProp }) => {
  andIf(prop('ada'), get, setProp, { notFlag: 'ch5Started' });
  const east = prop('eastEdge');
  setProp(east, 'to', 'string', 'RIDGE'); setProp(east, 'spawn', 'string', 'fromTower');
  setProp(east, 'if', 'string', JSON.stringify({ flag: 'ch5Started' }));
  const west = prop('westEdge');
  setProp(west, 'if', 'string', JSON.stringify({ notFlag: 'ch5Started' }));
  setProp(west, 'blockedLines', 'string', 'Not back down. Not tonight.');
  add('spawn', 'fromRidge', 650, 225, [P('facing', 'float', -1)]);
});

patch('black_ram_parlor.tmj', ({ prop, get, setProp }) => {
  // after the fourth day's end card ("Sit by the fire a while"): the front door is the way up the ridge
  const door = prop('pl_front');
  const cur = get(door, 'scriptIf');
  const list = cur ? [].concat(JSON.parse(cur)) : [];
  list.unshift({ if: { all: [{ phase: 'NIGHT' }, { flag: 'chapter4Complete' }, { notFlag: 'ch5Started' }] }, script: 'NIGHT_GO' });
  setProp(door, 'scriptIf', 'string', JSON.stringify(list));
});
