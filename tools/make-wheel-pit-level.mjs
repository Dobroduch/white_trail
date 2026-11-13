// Builds the optional hidden area under the sawmill's waterwheel, assets/levels/wheel_pit.tmj (30×17 tiles = a 320-unit
// scene, one screen), from the wheel_pit tileset (tools/make-wheel-pit-tileset.mjs) and the Black Ram snow tiles, and
// links it into the sawmill map:
//   * old_sawmill.tmj gains the wheel_pit tileset, the race-mouth arch on its back_wall layer behind the wheel, a
//     `door` that only exists once Silas knows about the pit (`showIf`), its return spawn, and a zone event in which
//     he recognises the entrance. Nothing else on the sawmill map changes.
//
// Run it ONCE. After that both maps belong to Tiled. It refuses to overwrite wheel_pit.tmj or to patch the sawmill a
// second time unless you pass --force.
//
//   node tools/make-wheel-pit-tileset.mjs && node tools/make-wheel-pit-level.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const force = process.argv.includes('--force');
const ID = JSON.parse(readFileSync(resolve(root, 'tools/data/wheel_pit_tiles.json'), 'utf8'));
const P = (name, type, value) => ({ name, type, value });
const h = (a, b, s = 0) => { let n = Math.imul(a * 374761393 + b * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; n = Math.imul(n, 1274126177); return ((n ^ (n >>> 16)) >>> 0) % 1024 / 1024; };

// ---------------- the pit ----------------
const pitFile = resolve(root, 'assets/levels/wheel_pit.tmj');
if (existsSync(pitFile) && !force) {
  console.log('wheel_pit.tmj exists; Tiled owns it (use --force to rebuild it).');
} else {
  const COLS = 30, ROWS = 17, BR = 1, WP = 41; // black_ram_exterior (40 tiles), then wheel_pit
  const W = (name) => { if (!(name in ID)) throw new Error('unknown wheel_pit tile ' + name); return WP + ID[name]; };
  const layer = () => new Array(COLS * ROWS).fill(0);
  const put = (l, c, r, g) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) l[r * COLS + c] = g; };
  const block = (l, name, c0, r0, wt, ht) => { for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) put(l, c0 + c, r0 + r, W(`${name}_${r}_${c}`)); };
  const back = layer(), frame = layer(), floor = layer(), detail = layer();
  // back: darkness above, the far race wall from row 5 down
  for (let c = 0; c < COLS; c++) for (let r = 0; r < 14; r++) put(back, c, r, r < 5 ? W('void') : W(r === 5 ? 'stone_wet' : (c + r) % 2 ? 'stone_a' : 'stone_b'));
  // side walls: the near race walls framing the pit
  for (let r = 3; r < 14; r++) { for (const c of [0, 1, 28, 29]) put(frame, c, r, W(r === 3 ? 'stone_top' : (c + r) % 2 ? 'stone_a' : 'stone_b')); }
  // the way in (top left): a gap in the wall, open to the mill yard
  block(frame, 'shaft', 2, 11, 2, 3); for (let r = 3; r < 11; r++) { put(frame, 2, r, W(r % 2 ? 'stone_a' : 'stone_b')); put(frame, 3, r, W(r % 2 ? 'stone_b' : 'stone_a')); }
  put(frame, 2, 3, W('stone_top')); put(frame, 3, 3, W('stone_top'));
  // roof: the underside of the wheel housing, beams on posts, icicles
  for (let c = 4; c < 28; c++) { put(frame, c, 0, W('planks_under')); put(frame, c, 1, W('planks_under')); put(frame, c, 2, W(c === 11 ? 'beam_worn' : 'beam_h')); put(detail, c, 3, h(c, 3, 2) > 0.35 ? W('icicles') : 0); }
  for (const c of [6, 17, 26]) for (let r = 3; r < 14; r++) put(back, c, r, W('post_v'));
  // the lower rim of the stopped wheel, frozen into the race on the right
  block(detail, 'wheel_rim', 20, 8, 4, 4);
  // floor: ice over the race, the frozen hollow, a drift where snow falls in through the gap
  for (let c = 0; c < COLS; c++) { put(floor, c, 14, W('ice_top')); put(floor, c, 15, W('ice_fill')); put(floor, c, 16, c > 22 ? W('water') : W('ice_fill')); }
  block(floor, 'hollow', 12, 14, 3, 1);
  put(detail, 4, 13, W('drift')); put(detail, 27, 13, W('drift'));
  let oid = 1;
  const obj = (type, name, x, y, props = [], extra = {}) => ({ id: oid++, name, type, x, y, width: 0, height: 0, rotation: 0, visible: true, point: true, properties: props, ...extra });
  const objects = [
    { id: oid++, name: 'walkable', type: 'bounds', x: 66, y: 187.5, width: 360, height: 90, rotation: 0, visible: true, properties: [] },
    obj('spawn', 'fromSawmill', 72, 225, [P('facing', 'float', 1)]),
    obj('door', 'pit_out', 54, 225, [P('label', 'string', 'Mill yard'), P('verb', 'string', 'Climb up'), P('to', 'string', 'SAWMILL'), P('spawn', 'string', 'fromPit'), P('minutes', 'float', 1)]),
    obj('interactable', 'wp_hollow', 216, 228, [P('label', 'string', 'Hollow in the ice'), P('evidence', 'string', 'PIT_HOLLOW'), P('important', 'bool', true)]),
    obj('interactable', 'wp_beam', 184, 70, [P('label', 'string', 'Beam'), P('lines', 'string', 'A beam across the pit, worn bright in one place. A rope has run over it lately, and not an empty one.')]),
    obj('interactable', 'wp_wheel', 352, 198, [P('label', 'string', 'Wheel'), P('lines', 'string', 'The bottom of the wheel, frozen into the race. Ice hangs from the paddles. Nobody has turned it in years.')]),
    obj('interactable', 'wp_water', 400, 240, [P('label', 'string', 'Race'), P('lines', 'string', 'Under the ice the race still runs, black, out toward the creek. Cold comes up off it like a cellar.')]),
    obj('light', 'gapLight', 48, 186, [P('r', 'float', 54), P('strength', 'float', 0.35)]),
    obj('light', 'hollowGlow', 216, 222, [P('r', 'float', 30), P('strength', 'float', 0.3)]),
    obj('event', 'PIT_ENTER', 0, 0, [P('bark', 'string', 'Cold as a cellar. Colder. Nothing down here has thawed since autumn.'), P('do', 'string', '[{"set":{"enteredWheelPit":true}}]'), P('if', 'string', '{"notFlag":"enteredWheelPit"}')]),
  ];
  let lid = 1;
  const tl = (name, data) => ({ id: lid++, name, type: 'tilelayer', width: COLS, height: ROWS, x: 0, y: 0, opacity: 1, visible: true, data });
  const map = {
    type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down',
    width: COLS, height: ROWS, tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1,
    properties: [P('name', 'string', 'THE WHEEL PIT'), P('exterior', 'bool', true), P('nightSky', 'bool', false), P('travel', 'float', 1), P('ambience', 'string', 'creek'),
      P('darkness', 'float', 0.86), P('snow', 'float', 0.08), P('wind', 'float', 0.1), P('fog', 'float', 0.25), P('groundY', 'float', 224)],
    tilesets: [{ firstgid: BR, source: 'tilesets/black_ram_exterior.tsj' }, { firstgid: WP, source: 'tilesets/wheel_pit.tsj' }],
    layers: [tl('back', back), tl('frame', frame), tl('floor', floor), tl('details', detail),
      { id: lid++, name: 'gameplay', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects }],
  };
  map.nextlayerid = lid; map.nextobjectid = oid;
  writeFileSync(pitFile, JSON.stringify(map, null, 1) + String.fromCharCode(10));
  console.log('wheel_pit.tmj written: 30×17 tiles');
}

// ---------------- the sawmill: race mouth, hidden door, return spawn, recognition event ----------------
const millFile = resolve(root, 'assets/levels/old_sawmill.tmj');
const mill = JSON.parse(readFileSync(millFile, 'utf8'));
const objs = mill.layers.find((l) => l.type === 'objectgroup');
if (objs.objects.some((o) => o.name === 'sm_pit') && !force) {
  console.log('old_sawmill.tmj already links the wheel pit; left unchanged.');
} else {
  let ts = mill.tilesets.find((t) => t.source.endsWith('wheel_pit.tsj'));
  if (!ts) {
    const last = mill.tilesets[mill.tilesets.length - 1];
    const lastCount = JSON.parse(readFileSync(resolve(root, 'assets/levels', last.source), 'utf8')).tilecount;
    ts = { firstgid: last.firstgid + lastCount, source: 'tilesets/wheel_pit.tsj' };
    mill.tilesets.push(ts);
  }
  const wall = mill.layers.find((l) => l.type === 'tilelayer' && l.name === 'back_wall');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const i = (12 + r) * mill.width + 40 + c;
    if (wall.data[i] && !force) throw new Error(`sawmill back_wall ${40 + c},${12 + r} is not empty`);
    wall.data[i] = ts.firstgid + ID[`race_mouth_${r}_${c}`];
  }
  objs.objects = objs.objects.filter((o) => !['sm_pit', 'fromPit', 'PIT_RECOGNISED'].includes(o.name));
  let oid = mill.nextobjectid || Math.max(...objs.objects.map((o) => o.id)) + 1;
  const add = (o) => { objs.objects.push({ id: oid++, rotation: 0, visible: true, ...o }); };
  add({ name: 'sm_pit', type: 'door', x: 657, y: 225, width: 0, height: 0, point: true, properties: [
    P('label', 'string', 'Wheel pit'), P('verb', 'string', 'Climb down'), P('to', 'string', 'WHEEL_PIT'), P('spawn', 'string', 'fromSawmill'), P('minutes', 'float', 1),
    P('showIf', 'string', '{"flag":"knowsWheelPit"}')] });
  add({ name: 'fromPit', type: 'spawn', x: 657, y: 225, width: 0, height: 0, point: true, properties: [P('facing', 'float', -1)] });
  add({ name: 'PIT_RECOGNISED', type: 'event', x: 600, y: 150, width: 120, height: 80, properties: [
    P('bark', 'string', 'There, behind the wheel. The mouth of the race. That is where the furrow starts.'),
    P('do', 'string', '[{"set":{"pitRecognised":true}}]'),
    P('if', 'string', '{"all":[{"flag":"knowsWheelPit"},{"notFlag":"pitRecognised"}]}')] });
  mill.nextobjectid = oid;
  writeFileSync(millFile, JSON.stringify(mill, null, 1) + String.fromCharCode(10));
  console.log(`old_sawmill.tmj: wheel_pit tileset at firstgid ${ts.firstgid}, race mouth, hidden door, spawn and event added`);
}
