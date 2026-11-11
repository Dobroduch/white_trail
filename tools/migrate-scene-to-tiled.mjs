// One-off migration: turn a hand-written scene from src/world/scenes.js into a Tiled map that owns its
// LAYOUT (bounds, ground, spawns, exits, doors, NPCs, interactables, lights, props, events, map settings),
// while the scene keeps its existing painter for the art (map property `painter` = the scene id). Pass 2
// then replaces the painter with Tiled layers built from tilesets.
//
// Use it BEFORE deleting the scene from scenes.js; after that Tiled owns the map and this tool must not
// be run again for it (it refuses to overwrite an existing file unless --force).
//
//   node tools/migrate-scene-to-tiled.mjs STATION assets/levels/blackwood_station.tmj
//
// The map is gridded 8×8 so any scene width that is a whole number of world units fits exactly
// (a world unit is 1.5 px). Pass 2 resizes maps to 16 px tiles when the art is repainted from tilesets.
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES } from '../src/world/scenes.js';

const [id, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!id || !out || !SCENES[id]) { console.error('usage: node tools/migrate-scene-to-tiled.mjs SCENE_ID assets/levels/file.tmj'); process.exit(1); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const file = resolve(root, out);
if (existsSync(file) && !process.argv.includes('--force')) { console.error(`${out} exists; Tiled owns it. Use --force to discard its edits.`); process.exit(1); }

const sc = SCENES[id];
const N = 1.5, px = (v) => Math.round(v * N * 100) / 100;
const pxW = Math.round(sc.width * N), pxH = 272;
let oid = 1;
const P = (name, value) => ({ name, type: typeof value === 'boolean' ? 'bool' : typeof value === 'number' ? 'float' : 'string', value });
const props = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => P(k, typeof v === 'object' ? JSON.stringify(v) : v));
const point = (cls, name, x, y, p = {}) => ({ id: oid++, name, type: cls, x: px(x), y: px(y), width: 0, height: 0, rotation: 0, visible: true, point: true, properties: props(p) });
const rect = (cls, name, x0, y0, w, h, p = {}) => ({ id: oid++, name, type: cls, x: px(x0), y: px(y0), width: px(w), height: px(h), rotation: 0, visible: true, properties: props(p) });
const lines = (a) => (a ? a.join('\n') : undefined);
const cond = (c) => (c && Object.keys(c).length ? c : undefined);
const groundY = sc.ground[0][1];

const objs = [];
objs.push(rect('bounds', 'walkable', sc.bounds[0], groundY - 25, sc.bounds[1] - sc.bounds[0], 60));
const flat = sc.ground.every((p) => p[1] === groundY);
if (!flat) objs.push({ id: oid++, name: 'ground', type: 'ground', x: 0, y: 0, width: 0, height: 0, rotation: 0, visible: true, polyline: sc.ground.map(([x, y]) => ({ x: px(x), y: px(y) })), properties: [] });
for (const [name, s] of Object.entries(sc.spawns)) objs.push(point('spawn', name, s.x, groundY, { facing: s.facing }));
for (const e of sc.exits || []) {
  const x0 = e.side === 'left' ? 0 : sc.width - 8;
  objs.push(rect('exit', e.side === 'left' ? 'westEdge' : 'eastEdge', x0, groundY - 50, 8, 80, { side: e.side, to: e.to, spawn: e.spawn, if: cond(e.if), blockedLines: lines(e.blockedLines), blockedScript: e.blockedScript, scriptIf: e.scriptIf }));
}
for (const d of sc.doors || []) objs.push(point('door', d.id, d.x, groundY, { label: d.label, verb: d.verb, to: d.to, spawn: d.spawn, minutes: d.minutes, if: cond(d.if), blockedLines: lines(d.blockedLines) }));
for (const n of sc.npcs || []) objs.push(point('npc', n.id, n.x, groundY, { sprite: n.sprite, facing: n.facing, dialogue: n.dialogue, label: n.name, z: n.z, lantern: n.lantern, candle: n.candle, if: cond(n.if) }));
for (const i of sc.interactables || []) objs.push(point('interactable', i.id, i.x, i.y, { label: i.label, lines: lines(i.lines), again: lines(i.again), variants: i.variants, evidence: i.evidence, dialogue: i.dialogue, verb: i.verb, important: i.important, warm: i.warm, radius: i.radius ? px(i.radius) : undefined, if: cond(i.if) }));
for (const l of sc.lights || []) objs.push(point('light', 'light', l.x, l.y, { r: px(l.r), warm: l.warm, strength: l.strength }));
for (const p of sc.props || []) objs.push(point('prop', p.type, 0, 0, { propType: p.type, args: p.args, id: p.id, if: cond(p.if) }));
for (const e of sc.events || []) {
  // top-level xMin/xMax conditions become the event rectangle; the rest stays as the `if` JSON
  let c = e.if, lo = null, hi = null;
  if (c && c.all) {
    const rest = [];
    for (const t of c.all) { if (t.xMin != null && Object.keys(t).length === 1) lo = t.xMin; else if (t.xMax != null && Object.keys(t).length === 1) hi = t.xMax; else rest.push(t); }
    c = rest.length === 1 ? rest[0] : rest.length ? { all: rest } : undefined;
  }
  const p = { script: e.script, bark: e.bark, delay: e.delay, do: e.do, if: cond(c) };
  objs.push(lo != null || hi != null ? rect('event', e.id, lo ?? 0, groundY - 60, (hi ?? sc.width) - (lo ?? 0), 100, p) : point('event', e.id, 0, 0, p));
}

const mapProps = { name: sc.name, exterior: sc.exterior !== false, travel: sc.travel, ambience: sc.ambience, darkness: sc.darkness, surface: sc.surface, ambient: sc.ambient, music: sc.music, painter: id,
  snow: sc.weather ? sc.weather.snow : undefined, wind: sc.weather ? sc.weather.wind : undefined, fog: sc.weather ? sc.weather.fog : undefined, night: sc.night };
const map = {
  type: 'map', version: '1.10', tiledversion: '1.11.0', orientation: 'orthogonal', renderorder: 'right-down',
  width: pxW / 8, height: pxH / 8, tilewidth: 8, tileheight: 8, infinite: false, compressionlevel: -1,
  nextlayerid: 3, nextobjectid: oid, properties: props(mapProps), tilesets: [],
  layers: [{ id: 1, name: 'gameplay', type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects: objs }],
};
writeFileSync(file, JSON.stringify(map, null, 1) + String.fromCharCode(10));
console.log(`wrote ${out}: ${objs.length} objects, ${pxW}×${pxH} px`);
