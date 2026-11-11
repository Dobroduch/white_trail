// Inventory item illustrations. Each ITEMS entry names its own image (`icon`: a 48×48 transparent
// PNG in assets/export/items/inventory/, authored in assets/source/pixelorama/items/*.pxo), so
// adding an item means adding one data field and one picture — no per-item drawing code here.
// A missing picture logs an error and the inventory draws a plain empty frame in its place.
import { ITEMS } from '../data/notebookData.js';

const icons = new Map(); // item id -> HTMLImageElement
export const ICON_PX = 48;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url + '?v=1';
  });
}

export async function loadItemIcons(items = ITEMS) {
  await Promise.all(Object.entries(items).map(async ([id, it]) => {
    if (!it.icon) { console.error(`[items] item "${id}" has no icon`); return; }
    try { icons.set(id, await loadImage(it.icon)); } catch (err) { console.error(`[items] ${err.message}; "${id}" will show an empty frame.`); }
  }));
}

export function itemIcon(id) { return icons.get(id) || null; }

// Draw an item picture centred on (cx, cy) in the current (UI-unit) transform, at the largest whole
// number of device pixels per image pixel that fits `maxUnits` UI units, snapped to the device grid,
// so the pixel art stays crisp at any window size. Returns the drawn size in UI units.
export function drawItemIcon(ctx, id, cx, cy, maxUnits) {
  const img = icons.get(id);
  const m = ctx.getTransform();
  const dev = m.a || 1; // device px per UI unit
  const n = Math.max(1, Math.floor((maxUnits * dev) / ICON_PX + 1e-6));
  const size = (n * ICON_PX) / dev;
  const snap = (v, off) => (Math.round(v * dev + off) - off) / dev;
  const x = snap(cx - size / 2, m.e);
  const y = snap(cy - size / 2, m.f);
  if (!img) {
    ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1 / dev;
    ctx.strokeRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
    return size;
  }
  const sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x, y, size, size);
  ctx.imageSmoothingEnabled = sm;
  return size;
}
