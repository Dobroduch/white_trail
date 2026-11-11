// Tiled JSON (.tmj) → THE WHITE TRAIL scene definition. Pure data, no DOM: the browser loader
// (levels.js), the renderer (tiledRender.js) and the Node validator (tools/validate.mjs) share it.
//
// UNITS. Tiled maps are authored in NATIVE pixels (1 Tiled px = 1 native px = 1 Pixelorama px).
// The game's scene logic uses WORLD units (1 world unit = WORLD_SCALE = 1.5 native px), so every
// object position is divided by 1.5 here. A 960 px wide map is a 640-unit scene; the camera frames
// 270 native px vertically, so maps are at least 270 px tall (17 rows of 16 px; the 2 px below
// 270 are never shown).
//
// The result has exactly the shape of an entry in src/world/scenes.js, so every existing system
// (doors, exits, interaction, conditions, events, lights, weather, ambience, save) works unchanged.
// See docs/TILED_LEVELS.md for the authoring reference.

export const NATIVE_PER_WORLD = 1.5;
export const MIN_MAP_HEIGHT = 270;

const w = (v) => Math.round((v / NATIVE_PER_WORLD) * 100) / 100; // native px -> world units

/** Tiled custom properties ([{name,type,value}]) -> plain object. */
export function props(o) {
  const out = {};
  for (const p of (o && o.properties) || []) out[p.name] = p.value;
  return out;
}

// Tiled ≥1.9 writes the object's class as `type`; 1.8 wrote `class`. Accept either.
const kindOf = (o) => String(o.type || o.class || '').trim().toLowerCase();

function json(v, where, errors) {
  if (v == null || v === '') return undefined;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch (e) { errors.push(`${where}: invalid JSON "${v}" (${e.message})`); return undefined; }
}
// Multi-line Tiled string -> list of dialogue lines (one line per non-empty text line).
const lines = (v) => (v == null || v === '' ? undefined : String(v).split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
const num = (v, d) => (v == null || v === '' || Number.isNaN(Number(v)) ? d : Number(v));

// Combine an object's `if` JSON with its optional `phase` property into one condition.
function condition(p, where, errors) {
  const parts = [];
  const c = json(p.if, where + '.if', errors);
  if (c) parts.push(c);
  if (p.phase) parts.push({ phase: String(p.phase).toUpperCase() });
  if (!parts.length) return undefined;
  return parts.length === 1 ? parts[0] : { all: parts };
}

// Object anchor in world units: points use their position; rectangles/ellipses their centre
// (x) and centre (y) — except `bottom` anchoring for things that stand on the ground.
function anchor(o) {
  const cx = o.point ? o.x : o.x + (o.width || 0) / 2;
  const cy = o.point ? o.y : o.y + (o.height || 0) / 2;
  return { x: w(cx), y: w(cy), bottom: w(o.y + (o.height || 0)) };
}

function walkLayers(layers, fn, parent = null) {
  for (const l of layers || []) {
    if (l.type === 'group') walkLayers(l.layers, fn, l);
    else fn(l, parent);
  }
}

/**
 * Convert a parsed Tiled map into a scene definition.
 * @returns {{ id:string, scene:object, errors:string[], warnings:string[] }}
 */
export function sceneFromTiled(map, id) {
  const errors = [], warnings = [];
  if (!map || map.type !== 'map') errors.push(`${id}: not a Tiled map (type "${map && map.type}")`);
  if (map.orientation !== 'orthogonal') errors.push(`${id}: orientation must be orthogonal`);
  if (map.infinite) errors.push(`${id}: infinite maps are not supported (Map ▸ Map Properties ▸ uncheck Infinite)`);
  const pxW = map.width * map.tilewidth, pxH = map.height * map.tileheight;
  if (pxH < MIN_MAP_HEIGHT) errors.push(`${id}: map is ${pxH} px tall; it must be at least ${MIN_MAP_HEIGHT} px (the native view height)`);
  if (pxW % 3) warnings.push(`${id}: map width ${pxW} px is not a multiple of 3, so the scene is not a whole number of world units`);
  const mp = props(map);
  const scene = {
    name: mp.name || id,
    width: Math.floor(w(pxW)),
    exterior: mp.exterior !== false,
    travel: num(mp.travel, 3),
    darkness: num(mp.darkness, 0.6),
    ambience: mp.ambience || 'silence',
    exits: [], doors: [], npcs: [], interactables: [], props: [], lights: [], events: [], spawns: {},
    weather: null,
    tiled: { pxW, pxH, source: id },
  };
  if (mp.surface) scene.surface = mp.surface;
  if (mp.ambient) scene.ambient = mp.ambient;
  if (mp.music) scene.music = mp.music;
  if (mp.snow != null || mp.wind != null || mp.fog != null) {
    scene.weather = { snow: num(mp.snow, 0), wind: num(mp.wind, 0), fog: num(mp.fog, 0) };
  }
  const night = json(mp.night, `${id}.night`, errors);
  if (night) scene.night = night;

  let groundY = mp.groundY != null ? w(num(mp.groundY, 225)) : null; // native px, like everything in the map
  const lightsNight = [];
  let phased = false;

  walkLayers(map.layers, (layer) => {
    if (layer.type !== 'objectgroup') return;
    for (const o of layer.objects || []) {
      const kind = kindOf(o);
      const p = props(o);
      const where = `${id}: ${kind || 'object'} "${o.name || o.id}"`;
      const a = anchor(o);
      const cond = condition(p, where, errors);
      switch (kind) {
        case 'spawn':
          if (!o.name) { errors.push(`${where}: a spawn needs a name (e.g. fromStreet)`); break; }
          scene.spawns[o.name] = { x: a.x, facing: num(p.facing, 1) < 0 ? -1 : 1 };
          break;
        case 'bounds':
          if (o.point) { errors.push(`${where}: bounds must be a rectangle`); break; }
          scene.bounds = [w(o.x), w(o.x + o.width)];
          break;
        case 'ground': {
          const pts = o.polyline || o.polygon;
          if (!pts || pts.length < 2) { errors.push(`${where}: ground must be a polyline with at least 2 points`); break; }
          scene.ground = pts.map((q) => [w(o.x + q.x), w(o.y + q.y)]).sort((m, n) => m[0] - n[0]);
          break;
        }
        case 'exit': {
          const side = p.side || (a.x < scene.width / 2 ? 'left' : 'right');
          if (side !== 'left' && side !== 'right') errors.push(`${where}: side must be left or right`);
          const ex = { side, to: p.to, spawn: p.spawn };
          if (cond) ex.if = cond;
          if (p.blockedLines) ex.blockedLines = lines(p.blockedLines);
          if (p.blockedScript) ex.blockedScript = p.blockedScript;
          scene.exits.push(ex);
          break;
        }
        case 'door': {
          const d = { id: o.name || `door_${o.id}`, x: a.x, label: p.label || o.name || 'Door', verb: p.verb || 'Enter', to: p.to, spawn: p.spawn };
          if (p.minutes != null) d.minutes = num(p.minutes, 1);
          if (cond) d.if = cond;
          if (p.blockedLines) d.blockedLines = lines(p.blockedLines);
          scene.doors.push(d);
          break;
        }
        case 'interactable': {
          const it = { id: o.name || `obj_${o.id}`, x: a.x, y: a.y, label: p.label || o.name || 'Something' };
          for (const k of ['evidence', 'dialogue', 'verb']) if (p[k]) it[k] = p[k];
          if (p.lines) it.lines = lines(p.lines);
          if (p.again) it.again = lines(p.again);
          if (p.variants) it.variants = json(p.variants, where + '.variants', errors);
          if (p.important) it.important = true;
          if (p.warm) it.warm = true;
          if (num(p.radius, 0) > 0) it.radius = w(num(p.radius, 0)); // native px; 0/empty = engine default
          if (cond) it.if = cond;
          scene.interactables.push(it);
          break;
        }
        case 'npc': {
          const n = { id: o.name, sprite: p.sprite, x: a.x, facing: num(p.facing, -1) < 0 ? -1 : 1, dialogue: p.dialogue, name: p.label || o.name };
          if (!o.name) errors.push(`${where}: an npc needs a name (its character id, e.g. finch)`);
          if (p.z != null) n.z = num(p.z, 8);
          if (p.lantern) n.lantern = true;
          if (p.candle) n.candle = true;
          if (cond) n.if = cond;
          scene.npcs.push(n);
          break;
        }
        case 'light': {
          const r = p.r != null ? num(p.r, 40) / NATIVE_PER_WORLD : o.ellipse || o.width ? w(Math.max(o.width, o.height) / 2) : 40;
          const L = { x: a.x, y: a.y, r: Math.round(r * 100) / 100 };
          if (p.warm != null) L.warm = num(p.warm, 0);
          if (p.strength != null) L.strength = num(p.strength, 1);
          const ph = p.phase ? String(p.phase).toUpperCase() : 'ALL';
          if (ph !== 'NIGHT') scene.lights.push(L); // evening set = untagged + EVENING
          if (ph !== 'EVENING') lightsNight.push(L); // night set = untagged + NIGHT
          if (ph !== 'ALL') phased = true;
          break;
        }
        case 'prop': {
          const pr = { type: p.propType || o.name };
          if (!pr.type) errors.push(`${where}: a prop needs propType`);
          if (p.args) pr.args = json(p.args, where + '.args', errors);
          if (p.id) pr.id = p.id;
          if (cond) pr.if = cond;
          scene.props.push(pr);
          break;
        }
        case 'event': {
          const ev = { id: o.name || `EVENT_${o.id}`, if: cond || {} };
          if (p.script) ev.script = p.script;
          if (p.bark) ev.bark = p.bark;
          if (p.delay != null) ev.delay = num(p.delay, 0);
          if (p.do) ev.do = json(p.do, where + '.do', errors);
          if (p.xMin != null || p.xMax != null || !o.point) {
            // a rectangle (or explicit xMin/xMax) makes the event fire only while Silas is inside it
            const lo = p.xMin != null ? w(num(p.xMin, 0)) : !o.point ? w(o.x) : null;
            const hi = p.xMax != null ? w(num(p.xMax, 0)) : !o.point ? w(o.x + o.width) : null;
            const all = [ev.if];
            if (lo != null) all.push({ xMin: lo });
            if (hi != null) all.push({ xMax: hi });
            ev.if = { all };
          }
          scene.events.push(ev);
          break;
        }
        case '':
          warnings.push(`${where}: object has no class/type and was ignored`);
          break;
        default:
          warnings.push(`${where}: unknown object class "${kind}" was ignored`);
      }
    }
  });

  // Lights tagged with a phase: the night set replaces the evening set at night (scenes.js `night`
  // overrides keys). Untagged lights are shared by both phases.
  if (phased) scene.night = Object.assign({}, scene.night || {}, { lights: lightsNight });

  if (!scene.ground) {
    if (groundY == null) groundY = 150;
    scene.ground = [[0, groundY], [scene.width, groundY]];
  }
  if (!scene.bounds) scene.bounds = [4, scene.width - 4];
  if (!Object.keys(scene.spawns).length) {
    errors.push(`${id}: no spawn object (add a point with class "spawn")`);
    scene.spawns.default = { x: scene.width / 2, facing: 1 };
  }
  for (const k of ['exits', 'doors', 'npcs', 'interactables', 'props', 'events']) if (!scene[k].length) delete scene[k];
  return { id, scene, errors, warnings };
}

/**
 * Layer plan for the renderer: which Tiled layers are drawn where.
 * role: 'back' (parallax, behind the playfield) | 'main' (playfield) | 'glow' (emissive, drawn after
 * lighting) | 'front' (foreground parallax). `factor` is Tiled's horizontal parallax (parallaxx).
 */
export function layerPlan(map) {
  const out = [];
  walkLayers(map.layers, (l, parent) => {
    if (l.type !== 'tilelayer' && l.type !== 'imagelayer') return;
    if (l.visible === false || (parent && parent.visible === false)) return;
    const p = Object.assign({}, props(parent), props(l));
    const factor = (l.parallaxx != null ? l.parallaxx : 1) * (parent && parent.parallaxx != null ? parent.parallaxx : 1);
    let role = (p.role || '').toLowerCase();
    if (!role) role = factor < 1 ? 'back' : factor > 1 ? 'front' : 'main';
    out.push({
      layer: l, name: l.name, role, factor,
      phase: p.phase ? String(p.phase).toUpperCase() : null,
      opacity: (l.opacity != null ? l.opacity : 1) * (parent && parent.opacity != null ? parent.opacity : 1),
      offx: (l.offsetx || 0) + ((parent && parent.offsetx) || 0),
      offy: (l.offsety || 0) + ((parent && parent.offsety) || 0),
    });
  });
  return out;
}

// Resolve a path written in a map/tileset (relative to that file) against its URL.
export function resolveUrl(base, rel) {
  if (/^([a-z]+:)?\//i.test(rel)) return rel;
  const parts = base.split('/'); parts.pop();
  for (const seg of rel.replace(/\\/g, '/').split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}
