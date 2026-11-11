// Bootstraps Crow's Hollow Main Street (scene id VILLAGE) as a Tiled map.
//
// PASS 1 (gameplay-complete layout). The old hand-written VILLAGE scene was one 640-unit street with the
// Black Ram Hotel in the middle. The hotel now has its own forecourt map (black_ram_exterior.tmj), so
// Main Street is the WEST part of the old street: the cabin with the watcher's window, Rusk's general
// store, the street lamp, and a stretch of road down to the forecourt. Its artwork is composed here from
// the existing Pixelorama export (assets/export/environments/town/main.png), cut at the hotel, so
// nothing the player already saw has changed. Pass 2 repaints it from tilesets.
//
//   assets/export/levels/main_street_playfield.png   composed playfield (derived, regenerate any time)
//   assets/levels/main_street.tmj                    the map. Written ONLY if it does not exist; after
//                                                    that Tiled owns it (use --force to discard edits)
//
//   node tools/make-main-street.mjs [--force]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from './lib/png.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const force = process.argv.includes('--force');
const W = 720, H = 270; // 480 world units

// ---- playfield image ------------------------------------------------------------------------
const src = decodePNG(readFileSync(resolve(root, 'assets/export/environments/town/main.png')));
const out = new Uint8Array(W * H * 4);
const copyCols = (sx, dx, n) => {
  for (let y = 0; y < H; y++) for (let i = 0; i < n; i++) {
    if (dx + i < 0 || dx + i >= W) continue;
    const s = (y * src.width + sx + i) * 4, d = (y * W + dx + i) * 4;
    out.set(src.data.subarray(s, s + 4), d);
  }
};
const topOf = (x) => { for (let y = 0; y < H; y++) if (src.data[(y * src.width + x) * 4 + 3] > 0) return y; return H; };
const copyGround = (sx, dx) => { // ground band only (rows below the building bases)
  for (let y = 226; y < H; y++) { const s = (y * src.width + sx) * 4, d = (y * W + dx) * 4; out.set(src.data.subarray(s, s + 4), d); }
};
copyCols(0, 0, 408); // cabin, Rusk's store, street lamp
copyCols(690, 610, 110); // woodshed
// plain street between them: tile the cleanest ground columns (nothing above y 226)
const clean = []; for (let x = 0; x < src.width; x++) if (topOf(x) >= 224) clean.push(x);
for (let x = 408, k = 0; x < 610; x++, k++) copyGround(clean[k % clean.length], x);
mkdirSync(resolve(root, 'assets/export/levels'), { recursive: true });
writeFileSync(resolve(root, 'assets/export/levels/main_street_playfield.png'), encodePNG(W, H, out));
console.log('wrote assets/export/levels/main_street_playfield.png');

// ---- map ------------------------------------------------------------------------------------
const mapPath = resolve(root, 'assets/levels/main_street.tmj');
if (existsSync(mapPath) && !force) { console.log('main_street.tmj exists; left untouched (Tiled owns it). Use --force to rebuild.'); process.exit(0); }

const forecourt = JSON.parse(readFileSync(resolve(root, 'assets/levels/black_ram_exterior.tmj'), 'utf8'));
const parallax = JSON.parse(JSON.stringify(forecourt.layers.find((l) => l.name === 'parallax')));
let nextLayer = 100, nextObj = 1;
const P = (name, type, value) => ({ name, type, value });
const obj = (cls, name, x, y, props, extra = {}) => ({ id: nextObj++, name, type: cls, class: cls, x, y, width: 0, height: 0, rotation: 0, visible: true, ...(extra.point === false ? {} : { point: true }), ...extra.box, properties: Object.entries(props).map(([k, v]) => P(k, typeof v === 'boolean' ? 'bool' : typeof v === 'number' ? 'float' : 'string', v)) });
const box = (cls, name, x, y, w, h, props) => ({ ...obj(cls, name, x, y, props, { point: false }), width: w, height: h });
const q = (o) => JSON.stringify(o);

const objects = [
  box('bounds', 'walkable', 6, 200, 708, 40, {}),
  { ...obj('ground', 'street', 0, 225, {}, { point: false }), polyline: [{ x: 0, y: 0 }, { x: 720, y: 0 }] },
  obj('spawn', 'fromRoad', 21, 225, { facing: 1 }),
  obj('spawn', 'fromHotel', 699, 225, { facing: -1 }),
  box('exit', 'westEdge', 0, 176, 12, 100, { side: 'left', to: 'ROAD', spawn: 'fromVillage' }),
  box('exit', 'eastEdge', 708, 176, 12, 100, { side: 'right', to: 'BLACK_RAM_EXTERIOR', spawn: 'fromWest' }),
  obj('interactable', 'vl_window', 100.5, 180, { label: 'Window', variants: q([
    { if: { phase: 'NIGHT' }, lines: ['Dark now, like every window on the street.'] },
    { if: { flag: 'curtainDrawn' }, lines: ["The curtain is drawn. Whoever was watching would rather I didn't see them do it."] },
    { if: {}, lines: ['Someone is standing at the window, watching the street.'] },
  ]) }),
  obj('interactable', 'vl_store', 264, 189, { label: 'General store', lines: "Rusk's general store. Dark. Through the glass: sacks, barrels, a counter, and an account book left open on it, too far off to read." }),
  obj('interactable', 'ms_lamp', 395, 168, { label: 'Street lamp', variants: q([
    { if: { phase: 'NIGHT' }, lines: ['The lamp is out. It has been out for some time; the glass is frosted over from inside.'] },
    { if: {}, lines: ['A street lamp, lit. The only one on this stretch that is.'] },
  ]) }),
  obj('interactable', 'ms_woodshed', 668, 195, { label: 'Woodshed', lines: 'A woodshed, the door barred from outside. Snow lies over the step, unbroken. Nobody has fetched fuel from here today.' }),
  obj('npc', 'finch', 504, 225, { sprite: 'finch_idle', facing: -1, dialogue: 'FINCH_MEET', label: 'Constable Finch', lantern: true, if: q({ all: [{ notFlag: 'metFinch' }, { phase: 'EVENING' }] }) }),
  obj('prop', 'watcher', 0, 0, { propType: 'watcher', id: 'watcher' }),
  obj('light', 'streetLamp', 396, 165, { r: 54, warm: 0.18 }),
  box('event', 'VILLAGE_WATCHER', 66, 176, 114, 100, { script: 'VILLAGE_WATCHER', if: q({ all: [{ notFlag: 'curtainDrawn' }, { phase: 'EVENING' }] }) }),
  box('event', 'FINCH_MEET', 375, 176, 345, 100, { script: 'FINCH_MEET', if: q({ all: [{ notFlag: 'metFinch' }, { phase: 'EVENING' }] }) }),
];

const img = (name, image, extra = {}) => ({ id: nextLayer++, name, type: 'imagelayer', image, opacity: 1, visible: true, x: 0, y: 0, ...extra });
const map = {
  type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down',
  width: 45, height: 17, tilewidth: 16, tileheight: 16, infinite: false, compressionlevel: -1,
  backgroundcolor: '#000000', nextlayerid: 200, nextobjectid: 100,
  properties: [
    P('name', 'string', "CROW'S HOLLOW"), P('exterior', 'bool', true), P('travel', 'int', 12),
    P('ambience', 'string', 'village'), P('darkness', 'float', 0.64),
    P('snow', 'float', 0.7), P('wind', 'float', 0.6), P('fog', 'float', 0.3),
    P('night', 'string', q({ darkness: 0.84, ambience: 'village_night', weather: { snow: 0.9, wind: 0.85, fog: 0.4 } })),
  ],
  tilesets: [],
  layers: [
    parallax,
    img('buildings', '../export/levels/main_street_playfield.png'),
    { id: nextLayer++, name: 'gameplay', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects },
    img('foreground', '../export/environments/town/front.png', { parallaxx: 1.2, properties: [P('role', 'string', 'front')] }),
  ],
};
// ids inside the cloned parallax group must not clash with the new layers
let id = 1; const renum = (ls) => ls.forEach((l) => { l.id = id++; if (l.layers) renum(l.layers); });
renum(map.layers); map.nextlayerid = id;
objects.forEach((o, i) => { o.id = i + 1; }); map.nextobjectid = objects.length + 1;
mkdirSync(dirname(mapPath), { recursive: true });
writeFileSync(mapPath, JSON.stringify(map, null, 1) + String.fromCharCode(10));
console.log('wrote assets/levels/main_street.tmj');
