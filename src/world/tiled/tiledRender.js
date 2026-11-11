// Browser side of the Tiled pipeline: fetch a .tmj map, its tilesets (embedded or external .tsj)
// and images, and rasterise its tile/image layers into the engine's layer structure
// ({ back, main, front }, all `native: true`, exactly like the Pixelorama scene art in nativeArt.js),
// so Game.draw renders a Tiled scene with the same passes, parallax, lighting and emissive masking.
import { makeCanvas, MAX_VIEW_W, WORLD_SCALE } from '../../engine/display.js';
import { layerPlan, resolveUrl } from './tiledMap.js';

const FLIP_H = 0x80000000, FLIP_V = 0x40000000, FLIP_D = 0x20000000, GID_MASK = 0x0fffffff;

function loadImage(url, bust) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load image ${url}`));
    img.src = url + (bust ? `?v=${bust}` : '');
  });
}
async function fetchJSON(url, bust) {
  const res = await fetch(url + (bust ? `?v=${bust}` : ''), { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Fetch a map and everything it references. Throws with a clear message on any missing piece. */
export async function loadTiledMap(url, bust = Date.now()) {
  const map = await fetchJSON(url, bust);
  const tilesets = [];
  const warnings = [];
  for (const ref of map.tilesets || []) {
    let ts = ref, base = url;
    if (ref.source) {
      if (/\.tsx$/i.test(ref.source)) throw new Error(`${url}: tileset "${ref.source}" is XML (.tsx). Save tilesets as JSON (.tsj) or embed them in the map.`);
      base = resolveUrl(url, ref.source);
      ts = Object.assign(await fetchJSON(base, bust), { firstgid: ref.firstgid });
    }
    const entry = { firstgid: ts.firstgid, name: ts.name, tw: ts.tilewidth, th: ts.tileheight, columns: ts.columns || 1,
      margin: ts.margin || 0, spacing: ts.spacing || 0, tilecount: ts.tilecount, image: null, tiles: new Map() };
    if (ts.image) entry.image = await loadImage(resolveUrl(base, ts.image), bust);
    for (const t of ts.tiles || []) {
      if (t.image) entry.tiles.set(t.id, await loadImage(resolveUrl(base, t.image), bust)); // image-collection tileset
      if (t.animation) warnings.push(`${ts.name}: tile ${t.id} is animated; tile animation is not supported yet (first frame is drawn)`);
    }
    tilesets.push(entry);
  }
  tilesets.sort((a, b) => a.firstgid - b.firstgid);
  const images = new Map();
  for (const p of layerPlan(map)) {
    if (p.layer.type === 'imagelayer' && p.layer.image && !images.has(p.layer.image)) {
      images.set(p.layer.image, await loadImage(resolveUrl(url, p.layer.image), bust));
    }
  }
  for (const w of warnings) console.warn('[tiled]', w);
  return { url, map, tilesets, images };
}

function tilesetFor(tilesets, gid) {
  let found = null;
  for (const t of tilesets) if (t.firstgid <= gid) found = t; else break;
  return found;
}

function drawTileLayer(ctx, layer, loaded, ox, oy) {
  const { map, tilesets } = loaded;
  if (layer.chunks) throw new Error(`layer "${layer.name}" uses chunks (infinite map); turn Infinite off`);
  if (typeof layer.data === 'string') throw new Error(`layer "${layer.name}" is ${layer.encoding}-encoded; set Tile Layer Format to CSV in Map Properties`);
  const cols = layer.width;
  for (let i = 0; i < layer.data.length; i++) {
    const raw = layer.data[i] >>> 0;
    if (!raw) continue;
    const gid = raw & GID_MASK;
    const ts = tilesetFor(tilesets, gid);
    if (!ts) continue;
    const local = gid - ts.firstgid;
    let img = ts.image, sx = 0, sy = 0, sw = ts.tw, sh = ts.th;
    if (ts.tiles.has(local)) { img = ts.tiles.get(local); sw = img.width; sh = img.height; }
    else if (img) { sx = ts.margin + (local % ts.columns) * (ts.tw + ts.spacing); sy = ts.margin + Math.floor(local / ts.columns) * (ts.th + ts.spacing); }
    if (!img) continue;
    // Tiled aligns tiles to the bottom-left of their grid cell (matters for tiles larger than the grid)
    const dx = ox + (i % cols) * map.tilewidth;
    const dy = oy + Math.floor(i / cols) * map.tileheight + map.tileheight - sh;
    if (raw & (FLIP_H | FLIP_V | FLIP_D)) {
      // Tiled applies the diagonal flip first, then horizontal, then vertical.
      let a = 1, b = 0, c = 0, d = 1;
      if (raw & FLIP_D) { a = 0; b = 1; c = 1; d = 0; }
      if (raw & FLIP_H) { a = -a; c = -c; }
      if (raw & FLIP_V) { b = -b; d = -d; }
      ctx.save();
      ctx.setTransform(a, b, c, d, dx + sw / 2, dy + sh / 2);
      ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
    }
  }
}

// Native px a parallax layer must span so it covers the widest view at either end of the scene
// (the same rule painters.js uses for its layers: MAX_VIEW_W + (sceneW − MAX_VIEW_W) × factor).
export const parallaxSpan = (sceneW, factor) => Math.ceil((MAX_VIEW_W + Math.max(0, sceneW - MAX_VIEW_W) * factor + 2) * WORLD_SCALE);

/**
 * Rasterise a loaded map for one story phase into engine layers.
 * Layers with a `phase` property are drawn only in that phase (EVENING / NIGHT).
 */
export function renderTiledLayers(loaded, phase, sceneW) {
  const { map } = loaded;
  const pxW = map.width * map.tilewidth, pxH = map.height * map.tileheight;
  const newC = (wd) => { const c = makeCanvas(wd, pxH); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
  const [main, mctx] = newC(pxW);
  let glow = null, gctx = null;
  const back = [], front = [];
  let z = -100;
  for (const p of layerPlan(map)) {
    if (p.phase && p.phase !== phase) continue;
    const L = p.layer;
    const draw = (ctx, width) => {
      ctx.globalAlpha = p.opacity;
      if (L.type === 'tilelayer') drawTileLayer(ctx, L, loaded, p.offx, p.offy);
      else {
        const img = loaded.images.get(L.image);
        if (img) {
          const stepX = L.repeatx ? img.width : Infinity;
          for (let x = p.offx; x < width; x += stepX) {
            ctx.drawImage(img, x, p.offy);
            if (!L.repeatx) break;
          }
        }
      }
      ctx.globalAlpha = 1;
    };
    if (p.factor === 1 && (p.role === 'main' || p.role === 'glow')) {
      if (p.role === 'main') draw(mctx, pxW);
      else { if (!glow) [glow, gctx] = newC(pxW); draw(gctx, pxW); }
      continue;
    }
    const list = p.role === 'front' || p.factor > 1 ? front : back;
    const width = Math.max(pxW, parallaxSpan(sceneW, p.factor));
    if (p.role === 'glow') {
      // emissive pixels for the most recent parallax layer with the same factor
      const host = [...list].reverse().find((l) => l.factor === p.factor);
      if (!host) { console.warn(`[tiled] glow layer "${p.name}" (parallax ${p.factor}) has no layer with the same parallax below it; ignored`); continue; }
      if (!host.glow) { const [c] = newC(width); host.glow = c; }
      draw(host.glow.getContext('2d'), width);
      continue;
    }
    const [c, x] = newC(width);
    draw(x, width);
    list.push({ canvas: c, factor: p.factor, z: list === front ? 20 + front.length : z++, native: true, name: p.name });
  }
  return { back, main: { canvas: main, glow, native: true }, front };
}
