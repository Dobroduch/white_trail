// Asset loading: pixel-art sprites are stored as palette strings in assets/sprites/sprites.json
// and rasterised to canvases at startup. Missing/malformed assets log a clear console error and
// fall back to a deliberate silhouette so the game never fails silently.
import { makeCanvas, snapN, WORLD_SCALE } from './display.js';
import { artMode } from '../world/artMode.js';

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

// ---------------- native-density PNG sprite sheets (authored in Pixelorama) ----------------
// assets/export/characters/*.png — 1 image pixel = 1 NATIVE pixel (2/3 of a world unit), so these
// carry 1.5x the detail of the legacy palette-string sprites at the same on-screen size. Each sheet is
// a horizontal strip of equal frames. `anchor` is the native-px column of the character's centre of
// mass when facing right (mirrored when facing left), so turning around never makes the body jump.
// A missing sheet logs an error and the legacy sprite stays in use.
export const NATIVE_SHEETS = [
  { url: 'assets/export/characters/silas_vance.png', fw: 28, fh: 42, anchor: 12, sprites: { silas_idle: [0, 1], silas_walk: [2, 3, 4, 5] } },
  { url: 'assets/export/characters/lantern.png', fw: 9, fh: 12, anchor: 4.5, sprites: { lantern_on: [0], lantern_off: [1] } },
  { url: 'assets/export/characters/conductor.png', fw: 26, fh: 42, anchor: 11, sprites: { conductor_idle: [0, 1] } },
  { url: 'assets/export/characters/finch.png', fw: 26, fh: 42, anchor: 10.5, sprites: { finch_idle: [0, 1] } },
  { url: 'assets/export/characters/gable.png', fw: 26, fh: 42, anchor: 11, sprites: { gable_idle: [0, 1] } },
  { url: 'assets/export/characters/patron.png', fw: 18, fh: 21, anchor: 8.5, sprites: { patron: [0], patron_look: [1] } },
];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url + '?v=2';
  });
}

export async function loadNativeSheets(defs = NATIVE_SHEETS) {
  await Promise.all(defs.map(async (d) => {
    let img;
    try { img = await loadImage(d.url); } catch (err) {
      const msg = `[assets] ${err.message}; keeping the legacy sprite(s) ${Object.keys(d.sprites).join(', ')}.`;
      console.error(msg); errors.push(msg); return;
    }
    const cut = (i) => {
      const c = makeCanvas(d.fw, d.fh);
      c.getContext('2d').drawImage(img, i * d.fw, 0, d.fw, d.fh, 0, 0, d.fw, d.fh);
      return c;
    };
    for (const [name, idx] of Object.entries(d.sprites)) {
      const frames = idx.map(cut);
      if (sprites.has(name)) sprites.set(name + '@legacy', sprites.get(name));
      sprites.set(name, {
        frames, flipped: frames.map(flip), native: true,
        w: d.fw / WORLD_SCALE, h: d.fh / WORLD_SCALE, ax: d.anchor / WORLD_SCALE,
      });
    }
  }));
}

export function getSprite(name) {
  if (artMode.legacy && sprites.has(name + '@legacy')) return sprites.get(name + '@legacy');
  return sprites.get(name) || fallback(name);
}

// Draw a sprite with its feet at (x, y) in WORLD units (world render pass). facing: 1 = right, -1 = left.
// Sprites in sprites.json are legacy density (1 sprite pixel = 1 world unit = 1.5 native px); the
// framebuffer shows each as an exact 3×3 block. The position snaps to the NATIVE grid, so characters
// move in 2/3-unit steps instead of whole legacy pixels. (Integer inputs are unchanged by snapN.)
export function drawSprite(ctx, name, frame, x, y, facing = 1) {
  const s = getSprite(name);
  const list = facing < 0 ? s.flipped : s.frames;
  const img = list[((frame % list.length) + list.length) % list.length];
  if (s.native) {
    // native sheet: 1 image px = 1 native px; anchored on the body, mirrored with the facing
    const ax = facing < 0 ? s.w - s.ax : s.ax;
    ctx.drawImage(img, snapN(x - ax), snapN(y - s.h), s.w, s.h);
    return;
  }
  ctx.drawImage(img, snapN(x - s.w / 2), snapN(y - s.h));
}
