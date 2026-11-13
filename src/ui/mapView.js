// The Map: a dedicated panel (its own HUD button and the M key), separate from the Notebook and the
// Inventory. It shows Silas's own sketch map, composed only from places he has been and ways he has
// actually walked. Undiscovered places are not drawn at all: no outline, label, icon or "?".
import { UI, font, text, UI_H, UI_LEFT, UI_RIGHT, UI_TOP, UI_BOTTOM, SERIF } from './text.js';
import { LOCATIONS, PATHS, POSITION, MAP_W, MAP_H } from '../data/mapData.js';
import { ensureMapState } from '../systems/exploration.js';

const art = new Map(); // art id -> Image
let parchment = null;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url + '?v=1';
  });
}

export async function loadMapArt(base = 'assets/export/map/') {
  const ids = [...LOCATIONS.map((l) => l.art), ...PATHS.map((p) => p.art)];
  try { parchment = await loadImage(base + 'parchment.png'); } catch (err) { console.error(`[map] ${err.message}; the map will draw a plain sheet.`); }
  await Promise.all(ids.map(async (id) => {
    try { art.set(id, await loadImage(`${base}${id}.png`)); } catch (err) { console.error(`[map] ${err.message}; that piece will be missing from the map.`); }
  }));
}

const INK = '#45382c';
const FADED = '#78634a';
const RED = '#7a4037';
const PAPER = '#d8c39a';

export class MapView {
  constructor(game) {
    this.game = game;
    this.panelKind = 'map';
    this.t = 0;
  }
  update(input) {
    this.t += 1 / 60;
    if (input.pressed('pause') || input.pressed('back') || input.pressed('map')) { this.game.audio.sfx('page'); return 'close'; }
    return null;
  }
  // Pencil mark for Silas's current position, in map px.
  here() {
    const g = this.game;
    const P = POSITION[g.scene.id];
    if (!P) return null;
    if (P.at) return P.at;
    const [b0, b1] = g.scene.bounds;
    const k = Math.max(0, Math.min(1, (g.player.x - b0) / Math.max(1, b1 - b0)));
    return [P.from[0] + (P.to[0] - P.from[0]) * k, P.from[1] + (P.to[1] - P.from[1]) * k];
  }
  draw(ctx) {
    const s = this.game.state;
    const m = ensureMapState(s);
    ctx.fillStyle = 'rgba(4,6,10,0.8)';
    ctx.fillRect(UI_LEFT, UI_TOP, UI_RIGHT - UI_LEFT, UI_BOTTOM - UI_TOP);
    // 1 map pixel = 1 UI unit (1.5 native px), drawn nearest-neighbour so the ink stays crisp
    const ox = 10, oy = 6;
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(ox + 2, oy + 2, MAP_W, MAP_H);
    if (parchment) ctx.drawImage(parchment, ox, oy, MAP_W, MAP_H);
    else { ctx.fillStyle = PAPER; ctx.fillRect(ox, oy, MAP_W, MAP_H); }
    for (const p of PATHS) if (m.paths.includes(p.id) && art.get(p.art)) ctx.drawImage(art.get(p.art), ox, oy, MAP_W, MAP_H);
    const shown = LOCATIONS.filter((l) => m.visited.includes(l.id));
    for (const l of shown) if (art.get(l.art)) ctx.drawImage(art.get(l.art), ox, oy, MAP_W, MAP_H);
    ctx.imageSmoothingEnabled = smooth;
    // labels in Silas's hand
    for (const l of shown) {
      font(ctx, l.minor ? 5.2 : 6.2, { italic: true });
      text(ctx, l.name, ox + l.label[0], oy + l.label[1], l.minor ? FADED : INK, 'center');
    }
    // where he stands now: a small pencilled cross
    const h = this.here();
    if (h) {
      const x = ox + Math.round(h[0]), y = oy + Math.round(h[1]) - 5;
      ctx.fillStyle = RED;
      for (let i = -2; i <= 2; i++) { ctx.fillRect(x + i, y + i, 1, 1); ctx.fillRect(x + i, y - i, 1, 1); }
    }
    // title cartouche and notes
    ctx.font = `italic 8px ${SERIF}`;
    text(ctx, 'Crow’s Hollow & about', ox + 16, oy + 20, INK);
    font(ctx, 4.6, { italic: true });
    text(ctx, `drawn by S.V. — ${shown.length} place${shown.length === 1 ? '' : 's'} walked`, ox + 16, oy + 28, FADED);
    if (shown.length <= 1) text(ctx, 'Nothing else drawn yet. I only put down what I have seen.', ox + 16, oy + 35, FADED);
    font(ctx, 4.4, { italic: true });
    text(ctx, this.game.touchUI() ? 'Back closes' : 'M / Esc  close', ox + MAP_W - 14, oy + MAP_H - 6, FADED, 'right');
  }
}
