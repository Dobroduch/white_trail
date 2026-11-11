// Asset loading: pixel-art sprites are stored as palette strings in assets/sprites/sprites.json
// and rasterised to canvases at startup. Missing/malformed assets log a clear console error and
// fall back to a deliberate silhouette so the game never fails silently.
import { makeCanvas } from './display.js';

const sprites = new Map(); // name -> { frames: [canvas], flipped: [canvas], w, h }
let palette = {};
const errors = [];

export function assetErrors() { return errors.slice(); }

export async function loadSprites(url = 'assets/sprites/sprites.json') {
  let data = null;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    const msg = `[assets] Could not load sprite sheet "${url}" (${err.message}). Using fallback silhouettes.`;
    console.error(msg);
    errors.push(msg);
    data = { palette: {}, sprites: {} };
  }
  palette = data.palette || {};
  for (const [name, def] of Object.entries(data.sprites || {})) {
    try {
      const rowsList = def.frames || [def.rows];
      const frames = rowsList.map((rows) => rasterise(rows, def.palette));
      register(name, frames);
    } catch (err) {
      const msg = `[assets] Sprite "${name}" is malformed: ${err.message}`;
      console.error(msg);
      errors.push(msg);
    }
  }
  buildComposites();
}

function rasterise(rows, extraPalette) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('no rows');
  const w = rows[0].length;
  const h = rows.length;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const pal = Object.assign({}, palette, extraPalette || {});
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    if (row.length !== w) throw new Error(`row ${y} has width ${row.length}, expected ${w}`);
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch];
      if (!col) throw new Error(`unknown palette key "${ch}" at ${x},${y}`);
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function flip(c) {
  const f = makeCanvas(c.width, c.height);
  const ctx = f.getContext('2d');
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(c, 0, 0);
  return f;
}

function register(name, frames) {
  sprites.set(name, { frames, flipped: frames.map(flip), w: frames[0].width, h: frames[0].height });
}

// A second "breathing" frame: the upper body settles one pixel. Used for restrained idle loops.
function breathFrame(c, splitRow) {
  const out = makeCanvas(c.width, c.height);
  const ctx = out.getContext('2d');
  ctx.drawImage(c, 0, splitRow, c.width, c.height - splitRow, 0, splitRow, c.width, c.height - splitRow);
  ctx.drawImage(c, 0, 0, c.width, splitRow, 0, 1, c.width, splitRow);
  return out;
}

function buildComposites() {
  // Silas: body + leg frames -> idle[2] + walk[4]
  const body = sprites.get('silas_body');
  const legs = sprites.get('silas_legs');
  if (body && legs) {
    const bodyC = body.frames[0];
    const compose = (legC, bob) => {
      const c = makeCanvas(16, 28);
      const ctx = c.getContext('2d');
      ctx.drawImage(legC, 0, 22);
      ctx.drawImage(bodyC, 0, bob);
      return c;
    };
    const idle0 = compose(legs.frames[0], 0);
    const idle1 = breathFrame(idle0, 12);
    register('silas_idle', [idle0, idle1]);
    register('silas_walk', [
      compose(legs.frames[1], 0), compose(legs.frames[2], 1),
      compose(legs.frames[3], 0), compose(legs.frames[4], 1),
    ]);
  } else {
    const msg = '[assets] Silas sprite parts missing; using fallback silhouette.';
    console.error(msg);
    errors.push(msg);
  }
  for (const n of ['conductor', 'finch', 'gable']) {
    const s = sprites.get(n);
    if (s) register(n + '_idle', [s.frames[0], breathFrame(s.frames[0], 14)]);
  }
}

function fallback(name) {
  const msg = `[assets] Missing sprite "${name}"; drawing fallback silhouette.`;
  if (!errors.includes(msg)) { console.error(msg); errors.push(msg); }
  const c = makeCanvas(12, 26);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b0d14';
  ctx.fillRect(3, 0, 6, 6);
  ctx.fillRect(1, 6, 10, 14);
  ctx.fillRect(2, 20, 3, 6);
  ctx.fillRect(7, 20, 3, 6);
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(5, 2, 2, 2);
  register(name, [c]);
  return sprites.get(name);
}

export function getSprite(name) {
  return sprites.get(name) || fallback(name);
}

// Draw a sprite with its feet at (x, y). facing: 1 = right, -1 = left.
export function drawSprite(ctx, name, frame, x, y, facing = 1) {
  const s = getSprite(name);
  const list = facing < 0 ? s.flipped : s.frames;
  const img = list[((frame % list.length) + list.length) % list.length];
  ctx.drawImage(img, Math.round(x - s.w / 2), Math.round(y - s.h));
}
