// Bootstraps the first Tiled example location, the Black Ram Hotel exterior:
//   assets/export/tilesets/black_ram_exterior.png   placeholder 16×16 tileset, palette colours only
//   assets/levels/tilesets/black_ram_exterior.tsj    Tiled tileset (JSON) pointing at that PNG
//   assets/levels/black_ram_exterior.tmj             the starter map (only if it does not exist yet)
//
// The tileset is deliberately simple programmer art: it exists so the pipeline can be demonstrated
// and tested end to end. Replace it by painting assets/source/pixelorama/tilesets/black_ram_exterior.pxo
// in Pixelorama on the same 16×16 grid and exporting over the PNG — tile indices stay the same, so
// the map keeps working. After the first run the map belongs to Tiled: edit it there. This script
// never overwrites the map unless you pass --force (which discards your Tiled edits).
//
//   node tools/make-demo-level.mjs [--force]
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTE as C } from '../src/data/palette.js';
import { encodePNG } from './lib/png.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const T = 16, COLS = 8;
const TILES = [
  'wall', 'wall_shadow', 'roof', 'roof_snow', 'beam', 'boardwalk', 'boardwalk_edge', 'snow_top',
  'snow_fill', 'win_tl', 'win_tr', 'win_bl', 'win_br', 'winlit_tl', 'winlit_tr', 'winlit_bl',
  'winlit_br', 'door_tl', 'door_tr', 'door_ml', 'door_mr', 'door_bl', 'door_br', 'sign_0',
  'sign_1', 'sign_2', 'sign_3', 'sign_4', 'sign_5', 'post', 'chimney', 'chimney_top',
  'lamp_top', 'lamp_pole', 'lamp_glow', 'rail', 'drift', 'wall_end_l', 'wall_end_r', 'shadow',
];
const ID = Object.fromEntries(TILES.map((n, i) => [n, i]));
const ROWS = Math.ceil(TILES.length / COLS);
const W = COLS * T, H = ROWS * T;
const img = new Uint8Array(W * H * 4);

const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
let ox = 0, oy = 0;
const p = (x, y, col) => {
  if (x < 0 || y < 0 || x >= T || y >= T || !col) return;
  const i = ((oy + y) * W + ox + x) * 4;
  img.set([...rgb(col), 255], i);
};
const r = (x, y, w, h, col) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p(x + i, y + j, col); };
const hash = (x, y, s) => { let n = Math.imul(x * 374761393 + y * 668265263 + s * 1013904223, 1274126177); n ^= n >>> 13; return ((n >>> 0) % 1000) / 1000; };

// 3×5 capitals for the sign
const FONT = { B: '110101110101110', L: '100100100100111', A: '010101111101101', C: '011100100100011', K: '101101110101101', R: '110101110110101', M: '101111111101101', H: '101101111101101', O: '010101101101010', T: '111010010010010', E: '111100110100111', ' ': '000000000000000' };

function logs(dark) {
  const base = dark ? [C.wood1, C.wood2, C.wood0] : [C.wood3, C.wood4, C.wood1];
  for (let y = 0; y < T; y++) {
    const band = y % 4;
    for (let x = 0; x < T; x++) {
      let col = band === 3 ? base[2] : band === 0 ? base[1] : base[0];
      if (band !== 3 && hash(x, y, dark ? 7 : 3) > 0.9) col = dark ? C.wood0 : C.wood2;
      p(x, y, col);
    }
  }
}
function windowTile(q, lit) {
  // 32×32 window split in quadrants: frame wood5, panes navy (or warm light on the glow layer)
  const qx = q % 2, qy = q >> 1;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const X = qx * T + x, Y = qy * T + y;
    const frame = X < 3 || X > 28 || Y < 3 || Y > 26 || X === 15 || X === 16 || Y === 14;
    const sill = Y >= 27 && Y <= 29 && X >= 1 && X <= 30;
    if (lit) {
      if (frame || sill || Y > 29) continue;
      const k = Math.max(0, (Y - 3) / 24);
      p(x, y, k < 0.3 ? C.flame5 : k < 0.65 ? C.flame4 : C.flame3);
      if ((X + Y) % 7 === 0) p(x, y, C.flame2);
    } else {
      if (Y > 29) { logs(false); continue; }
      if (sill) p(x, y, Y === 27 ? C.snow4 : C.snow2);
      else if (frame) p(x, y, X === 15 || X === 16 || Y === 14 ? C.wood4 : C.wood5);
      else p(x, y, (X * 3 + Y) % 11 === 0 ? C.slate1 : C.navy2);
    }
  }
}
function doorTile(part) {
  const qx = part % 2, qy = part >> 1; // 2×3 tiles
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const X = qx * T + x, Y = qy * T + y;
    if (X < 2 || X > 29 || Y < 2) p(x, y, C.wood5);
    else if (X < 4 || X > 27) p(x, y, C.wood0);
    else {
      const panel = (Y > 6 && Y < 20) || (Y > 24 && Y < 42);
      const inset = panel && ((X > 6 && X < 14) || (X > 17 && X < 25));
      p(x, y, inset ? C.wood1 : C.wood2);
      if (X === 24 && Y === 24) p(x, y, C.brass2);
    }
  }
}

const painters = {
  wall: () => logs(false),
  wall_shadow: () => logs(true),
  roof: () => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p(x, y, (y % 4 === 3 || (x + (y >> 2) * 4) % 8 === 0) ? C.iron : C.wood1); },
  roof_snow: () => { for (let x = 0; x < T; x++) { const d = 9 + Math.round(hash(x, 0, 5) * 4); r(x, 4, 1, d - 4, C.snow3); p(x, 4, C.snow4); p(x, 5, C.snow4); r(x, d, 1, T - d, C.wood1); if (hash(x, 1, 9) > 0.8) p(x, d, C.snow2); } },
  beam: () => { r(0, 0, T, 4, C.snow3); r(0, 0, T, 1, C.snow4); r(0, 4, T, 8, C.wood4); r(0, 11, T, 1, C.wood1); r(0, 12, T, 4, C.wood0); for (let x = 2; x < T; x += 6) p(x, 7, C.wood5); },
  boardwalk: () => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p(x, y, x % 8 === 7 ? C.wood1 : y < 2 ? C.wood4 : C.wood3); },
  boardwalk_edge: () => { r(0, 0, T, 3, C.wood2); r(0, 3, T, T - 3, C.wood0); r(2, 3, 2, T - 3, C.wood1); r(11, 3, 2, T - 3, C.wood1); },
  snow_top: () => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p(x, y, y === 0 ? C.snow4 : y < 4 ? C.snow3 : (x + y) % 2 && y < 9 ? C.snow3 : C.snow2); },
  snow_fill: () => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p(x, y, (x * 7 + y * 3) % 5 === 0 ? C.snow1 : y > 9 && (x + y) % 2 ? C.snow0 : C.snow2); },
  win_tl: () => windowTile(0, false), win_tr: () => windowTile(1, false), win_bl: () => windowTile(2, false), win_br: () => windowTile(3, false),
  winlit_tl: () => windowTile(0, true), winlit_tr: () => windowTile(1, true), winlit_bl: () => windowTile(2, true), winlit_br: () => windowTile(3, true),
  door_tl: () => doorTile(0), door_tr: () => doorTile(1), door_ml: () => doorTile(2), door_mr: () => doorTile(3), door_bl: () => doorTile(4), door_br: () => doorTile(5),
  post: () => { r(6, 0, 4, T, C.wood4); r(9, 0, 1, T, C.wood2); r(6, 0, 1, T, C.wood5); },
  chimney: () => { for (let y = 0; y < T; y++) for (let x = 3; x < 13; x++) p(x, y, (y % 4 === 0 || (x + (y >> 2) * 3) % 6 === 0) ? C.stone0 : C.stone2); },
  chimney_top: () => { r(2, 8, 12, 8, C.stone1); r(2, 6, 12, 3, C.snow3); r(3, 5, 10, 1, C.snow4); for (let y = 9; y < T; y++) for (let x = 3; x < 13; x++) p(x, y, (y % 4 === 0) ? C.stone0 : C.stone2); },
  lamp_top: () => { r(5, 4, 6, 9, C.iron2); r(6, 5, 4, 7, C.amberHi); r(7, 6, 2, 5, C.flame6); r(4, 3, 8, 1, C.iron); r(5, 2, 6, 1, C.snow3); r(7, 13, 2, 3, C.iron); },
  lamp_pole: () => { r(7, 0, 2, T, C.iron); r(7, 0, 1, T, C.iron2); r(5, 14, 6, 2, C.iron); },
  lamp_glow: () => { r(6, 5, 4, 7, C.amberHi); r(7, 6, 2, 5, C.flame6); },
  rail: () => { r(0, 4, T, 2, C.wood4); r(0, 6, T, 1, C.wood1); r(1, 4, 2, 12, C.wood3); r(13, 4, 2, 12, C.wood3); r(0, 3, T, 1, C.snow3); },
  drift: () => { for (let x = 0; x < T; x++) { const h = Math.round(5 + Math.sin(x / 2.5) * 3); r(x, T - h, 1, h, C.snow3); p(x, T - h, C.snow4); } },
  wall_end_l: () => { logs(false); for (let y = 0; y < T; y += 4) { r(0, y, 3, 3, C.wood5); p(1, y + 1, C.wood2); } },
  wall_end_r: () => { logs(false); for (let y = 0; y < T; y += 4) { r(13, y, 3, 3, C.wood5); p(14, y + 1, C.wood2); } },
  shadow: () => r(0, 0, T, T, C.wood0),
};
const SIGN = ' BLACK RAM HOTEL ';
for (let s = 0; s < 6; s++) {
  painters[`sign_${s}`] = () => {
    r(0, 2, T, 12, C.wood0); r(0, 2, T, 1, C.wood4); r(0, 13, T, 1, C.wood4);
    if (s === 0) r(0, 2, 1, 12, C.wood4);
    if (s === 5) r(15, 2, 1, 12, C.wood4);
    // 96 px board, 17 glyphs of 4 px plus a margin, centred
    const total = SIGN.length * 4 - 1, start = Math.floor((96 - total) / 2) - s * T;
    [...SIGN].forEach((ch, i) => {
      const g = FONT[ch] || FONT[' '];
      for (let k = 0; k < 15; k++) if (g[k] === '1') p(start + i * 4 + (k % 3), 5 + Math.floor(k / 3), C.brass2);
    });
  };
}

TILES.forEach((name, i) => { ox = (i % COLS) * T; oy = Math.floor(i / COLS) * T; painters[name](); });

const out = (rel, data) => { const f = join(root, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, data); console.log('wrote', rel); };
out('assets/export/tilesets/black_ram_exterior.png', encodePNG(W, H, img));
out('assets/levels/tilesets/black_ram_exterior.tsj', JSON.stringify({
  type: 'tileset', version: '1.10', tiledversion: '1.11.0', name: 'black_ram_exterior',
  tilewidth: T, tileheight: T, columns: COLS, tilecount: TILES.length, margin: 0, spacing: 0,
  image: '../../export/tilesets/black_ram_exterior.png', imagewidth: W, imageheight: H,
  tiles: TILES.map((n, i) => ({ id: i, properties: [{ name: 'name', type: 'string', value: n }] })),
}, null, 1) + '\n');

// ---------------- the starter map ----------------
const mapFile = join(root, 'assets/levels/black_ram_exterior.tmj');
if (existsSync(mapFile) && !process.argv.includes('--force')) {
  console.log('kept assets/levels/black_ram_exterior.tmj (already exists; edit it in Tiled, or pass --force to regenerate)');
  process.exit(0);
}
const MW = 60, MH = 17; // 960×272 native px = 640×181 world units
const layer = () => new Array(MW * MH).fill(0);
const set = (L, x, y, name) => { if (x >= 0 && x < MW && y >= 0 && y < MH) L[y * MW + x] = ID[name] + 1; };
const fillT = (L, x0, y0, w, h, name) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(L, x, y, name); };
const win = (L, x, y, lit) => { const k = lit ? 'winlit_' : 'win_'; set(L, x, y, k + 'tl'); set(L, x + 1, y, k + 'tr'); set(L, x, y + 1, k + 'bl'); set(L, x + 1, y + 1, k + 'br'); };

const ground = layer(), buildings = layer(), details = layer(), glowE = layer(), glowN = layer();
fillT(ground, 0, 14, MW, 1, 'snow_top'); fillT(ground, 0, 15, MW, 2, 'snow_fill');
// the hotel: two storeys, columns 20–39
fillT(buildings, 21, 2, 1, 1, 'chimney_top'); set(buildings, 21, 3, 'chimney');
fillT(buildings, 37, 2, 1, 1, 'chimney_top'); set(buildings, 37, 3, 'chimney');
fillT(buildings, 20, 4, 20, 1, 'roof_snow'); fillT(buildings, 20, 5, 20, 1, 'roof');
fillT(buildings, 20, 6, 20, 3, 'wall'); set(buildings, 20, 6, 'wall_end_l'); set(buildings, 39, 6, 'wall_end_r');
fillT(buildings, 20, 9, 20, 1, 'beam');
fillT(buildings, 20, 10, 20, 3, 'wall_shadow');
fillT(buildings, 18, 13, 24, 1, 'boardwalk');
for (const x of [22, 26, 32, 36]) win(buildings, x, 6, false);
win(buildings, 22, 10, false); win(buildings, 34, 10, false);
fillT(buildings, 29, 10, 2, 3, 'shadow');
// a neighbouring cabin (left) and a shed (right), same tiles
fillT(buildings, 4, 8, 9, 1, 'roof_snow'); fillT(buildings, 4, 9, 9, 1, 'roof');
fillT(buildings, 4, 10, 9, 4, 'wall'); set(buildings, 4, 10, 'wall_end_l'); set(buildings, 12, 10, 'wall_end_r');
win(buildings, 7, 10, false);
fillT(buildings, 47, 9, 7, 1, 'roof_snow'); fillT(buildings, 47, 10, 7, 4, 'wall_shadow');
// details layer: door, sign, porch posts, lamp post, hitching rail
const dn = ['door_tl', 'door_tr', 'door_ml', 'door_mr', 'door_bl', 'door_br'];
dn.forEach((n, i) => set(details, 29 + (i % 2), 10 + (i >> 1), n));
for (let s = 0; s < 6; s++) set(details, 27 + s, 9, `sign_${s}`);
for (const x of [20, 39]) fillT(details, x, 10, 1, 3, 'post');
set(details, 43, 10, 'lamp_top'); fillT(details, 43, 11, 1, 3, 'lamp_pole');
fillT(details, 14, 13, 3, 1, 'rail');
fillT(details, 0, 13, 2, 1, 'drift'); fillT(details, 55, 13, 3, 1, 'drift');
// emissive: every window lit in the evening; one upstairs window at night
for (const x of [22, 26, 32, 36]) win(glowE, x, 6, true);
win(glowE, 22, 10, true); win(glowE, 34, 10, true); win(glowE, 7, 10, true);
set(glowE, 43, 10, 'lamp_glow');
win(glowN, 36, 6, true);

let oid = 1;
const P = (name, type, value) => ({ name, type, value });
const obj = (o) => Object.assign({ id: oid++, rotation: 0, visible: true, width: 0, height: 0 }, o);
const point = (name, type, x, y, properties = []) => obj({ name, type, x, y, point: true, properties });
const objects = [
  obj({ name: 'walkable', type: 'bounds', x: 6, y: 200, width: 948, height: 25 }),
  obj({ name: 'street', type: 'ground', x: 0, y: 225, polyline: [{ x: 0, y: 0 }, { x: 960, y: 0 }] }),
  point('fromStreet', 'spawn', 120, 225, [P('facing', 'int', 1)]),
  point('fromHotel', 'spawn', 480, 225, [P('facing', 'int', 1)]),
  point('hotelDoor', 'door', 480, 225, [
    P('label', 'string', 'Black Ram Hotel'), P('verb', 'string', 'Enter'), P('to', 'string', 'PARLOR'), P('spawn', 'string', 'fromStreet')]),
  obj({ name: 'westEdge', type: 'exit', x: 0, y: 176, width: 12, height: 49, properties: [
    P('side', 'string', 'left'), P('to', 'string', 'VILLAGE'), P('spawn', 'string', 'fromHotel')] }),
  obj({ name: 'eastEdge', type: 'exit', x: 948, y: 176, width: 12, height: 49, properties: [
    P('side', 'string', 'right'), P('to', 'string', 'VILLAGE'), P('spawn', 'string', 'fromHotel')] }),
  obj({ name: 'hotelSign', type: 'interactable', x: 432, y: 146, width: 96, height: 14, properties: [
    P('label', 'string', 'Hotel sign'),
    P('lines', 'string', 'BLACK RAM HOTEL, in brass letters someone still polishes.\nThe paint around them has been left to the weather.')] }),
  obj({ name: 'lampPost', type: 'interactable', x: 688, y: 160, width: 16, height: 64, properties: [
    P('label', 'string', 'Street lamp'),
    P('variants', 'string', JSON.stringify([
      { if: { phase: 'NIGHT' }, lines: ['The lamp has been let go out. Oil costs money up here.'] },
      { if: {}, lines: ['A kerosene street lamp, the only one on this side of the street.'] },
    ]))] }),
  obj({ name: 'hitchingRail', type: 'interactable', x: 224, y: 208, width: 48, height: 16, properties: [
    P('label', 'string', 'Hitching rail'),
    P('lines', 'string', 'A hitching rail, snow undisturbed along its length. No horses tied here tonight.')] }),
  obj({ name: 'HOTEL_STREET_ENTER', type: 'event', x: 380, y: 176, width: 200, height: 49, properties: [
    P('bark', 'string', 'The Black Ram. Every window lit, and nobody on the porch.'), P('phase', 'string', 'EVENING')] }),
  point('porchLamp', 'light', 480, 150, [P('r', 'float', 78), P('warm', 'float', 0.26)]),
  point('streetLamp', 'light', 696, 168, [P('r', 'float', 60), P('warm', 'float', 0.22), P('phase', 'string', 'EVENING')]),
  point('upstairsNight', 'light', 592, 112, [P('r', 'float', 30), P('warm', 'float', 0.1), P('phase', 'string', 'NIGHT')]),
];

const tile = (name, data, properties = []) => ({ type: 'tilelayer', id: 0, name, width: MW, height: MH, x: 0, y: 0, opacity: 1, visible: true, data, properties });
const image = (name, file, parallaxx, properties = []) => ({ type: 'imagelayer', id: 0, name, image: `../export/environments/parallax/${file}`, x: 0, y: 0, offsetx: 0, offsety: 0, opacity: 1, visible: true, parallaxx, parallaxy: 1, repeatx: false, repeaty: false, properties });
const PH = (v) => P('phase', 'string', v);
const layers = [
  { type: 'group', id: 0, name: 'parallax', opacity: 1, visible: true, x: 0, y: 0, layers: [
    image('sky_evening', 'town_sky_evening.png', 0, [PH('EVENING')]),
    image('sky_night', 'town_sky_night.png', 0, [PH('NIGHT')]),
    image('mountains', 'town_mountains.png', 0.08),
    image('far_trees', 'town_far_trees.png', 0.3),
    image('far_rooftops', 'town_far_rooftops.png', 0.5),
    image('far_lights', 'town_far_lights_evening.png', 0.5, [P('role', 'string', 'glow'), PH('EVENING')]),
    image('street_fog', 'town_fog.png', 1, [P('role', 'string', 'back')]),
  ] },
  tile('ground', ground), tile('buildings', buildings), tile('details', details),
  tile('glow_evening', glowE, [P('role', 'string', 'glow'), PH('EVENING')]),
  tile('glow_night', glowN, [P('role', 'string', 'glow'), PH('NIGHT')]),
  { type: 'objectgroup', id: 0, name: 'gameplay', opacity: 1, visible: true, x: 0, y: 0, draworder: 'topdown', objects },
  Object.assign(image('foreground', 'town_fog.png', 1.2, [P('role', 'string', 'front')]), { image: '../export/environments/town/front.png' }),
];
let lid = 1;
const number = (ls) => ls.forEach((l) => { l.id = lid++; if (l.layers) number(l.layers); });
number(layers);
const map = {
  type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down',
  width: MW, height: MH, tilewidth: T, tileheight: T, infinite: false, compressionlevel: -1,
  nextlayerid: lid, nextobjectid: oid, backgroundcolor: '#05070c',
  properties: [
    P('name', 'string', 'THE BLACK RAM HOTEL'), P('exterior', 'bool', true), P('travel', 'int', 2),
    P('ambience', 'string', 'village'), P('darkness', 'float', 0.64),
    P('snow', 'float', 0.7), P('wind', 'float', 0.6), P('fog', 'float', 0.3),
    P('night', 'string', JSON.stringify({ darkness: 0.84, ambience: 'village_night', weather: { snow: 0.9, wind: 0.85, fog: 0.4 } })),
  ],
  tilesets: [{ firstgid: 1, source: 'tilesets/black_ram_exterior.tsj' }],
  layers,
};
out('assets/levels/black_ram_exterior.tmj', JSON.stringify(map, null, 1) + '\n');
