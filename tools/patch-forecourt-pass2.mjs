// PASS 2 detail patch for the hotel forecourt (assets/levels/black_ram_exterior.tmj): the map keeps its hotel, annex,
// boardwalk, lamp and windows; this adds the things the screen was missing:
//   * the street continuing in from Main Street (rutted snow) and snow trodden flat toward the door
//   * one set of fresh prints heading east, away from the porch, toward the creek path
//   * clutter that makes it a working frontage: barrels, crate, a bench, drifts at the building feet, a shrub
//   * the way on to the creek: a broken fence, the MILL board on its post (with an interactable), pines
// It uses the sawmill and main_street tilesets in addition to Black Ram. Idempotent: refuses to run twice
// (the map already lists the extra tilesets) unless --force, which re-applies onto the current layers.
//
// Run ONCE. After that the map belongs to Tiled.
//   node tools/make-main-street-tileset.mjs && node tools/patch-forecourt-pass2.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const file = resolve(root, 'assets/levels/black_ram_exterior.tmj');
const map = JSON.parse(readFileSync(file, 'utf8'));
if (map.tilesets.length > 1 && !process.argv.includes('--force')) { console.error('forecourt already patched (extra tilesets present). Tiled owns it. Use --force to re-apply.'); process.exit(1); }
const load = (f) => JSON.parse(readFileSync(resolve(root, f), 'utf8'));
const SAW = load('tools/data/sawmill_tiles.json'), MS = load('tools/data/main_street_tiles.json');
const BR = 1, SM = 41, MST = 177; // firstgids: black_ram (40), sawmill (136), main_street (88)
const need = (tbl, base, name) => { if (!(name in tbl)) throw new Error('unknown tile ' + name); return base + tbl[name]; };
const sm = (n) => need(SAW, SM, n), ms = (n) => need(MS, MST, n);

const COLS = 60;
const ground = map.layers.find((l) => l.name === 'ground').data;
const details = map.layers.find((l) => l.name === 'details').data;
const put = (arr, c, r, gid) => { arr[r * COLS + c] = gid; };
const blk = (arr, ts, name, c, r, wt, ht) => { for (let j = 0; j < ht; j++) for (let i = 0; i < wt; i++) put(arr, c + i, r + j, ts(`${name}_${j}_${i}`)); };

// ---- ground (row 14) ----
for (const c of [0, 1, 2, 3]) put(ground, c, 14, ms(c % 2 ? 'street_a' : 'street_b')); // the street arrives from Main Street
for (let c = 4; c <= 44; c++) if (c >= 14 && c <= 36) put(ground, c, 14, ms(c % 2 ? 'trodden_a' : 'trodden_b')); // beaten flat in front of the door
for (const c of [45, 47, 50, 52, 55, 57]) put(ground, c, 14, ms(c % 2 ? 'street_prints_a' : 'street_prints_b')); // one set of prints, leaving east
for (const c of [38, 41, 43]) put(ground, c, 14, ms(c % 2 ? 'street_prints_b' : 'street_prints_a'));

// ---- details (rows 12–13 mostly; the layer holds the rail at cols 14–16) ----
put(details, 2, 13, sm('barrel')); put(details, 3, 13, sm('crate'));
put(details, 13, 13, sm('drift_r')); put(details, 17, 13, ms('shrub')); // between the annex and the hotel
put(details, 19, 13, sm('drift_l'));
blk(details, ms, 'bench', 40, 13, 2, 1); // a bench under the east windows
put(details, 43, 13, ms('shrub'));
blk(details, sm, 'sign', 44, 12, 2, 2); // MILL, on its post, where the street turns toward the creek
put(details, 46, 13, sm('fence_broken'));
// the east outbuilding (cols 47–53): a plank door, a small window, an unlit lantern left on its hook
blk(details, ms, 'door_dark', 49, 11, 2, 3); put(details, 52, 11, ms('shed_window')); put(details, 48, 11, sm('hook_lantern'));
blk(details, ms, 'pine_a', 54, 8, 4, 6); // the pines that frame the way down to the creek
blk(details, ms, 'pine_b', 58, 10, 2, 4);

// ---- tilesets, objects ----
map.tilesets = [
  { firstgid: BR, source: 'tilesets/black_ram_exterior.tsj' }, { firstgid: SM, source: 'tilesets/sawmill_exterior.tsj' },
  { firstgid: MST, source: 'tilesets/main_street_exterior.tsj' },
];
const gp = map.layers.find((l) => l.name === 'gameplay');
const P = (name, type, value) => ({ name, type, value });
let nextId = map.nextobjectid;
if (!gp.objects.some((o) => o.name === 'millSign')) gp.objects.push({ id: nextId++, name: 'millSign', type: 'interactable', x: 720, y: 195, width: 0, height: 0, rotation: 0, visible: true, point: true,
  properties: [P('label', 'string', 'Old sign'), P('lines', 'string', 'A weathered board: MILL. It points down the bank toward the creek.')] });
map.nextobjectid = nextId;
writeFileSync(file, JSON.stringify(map, null, 1) + String.fromCharCode(10));
console.log('black_ram_exterior.tmj patched: street, prints, clutter, MILL sign, pines');
