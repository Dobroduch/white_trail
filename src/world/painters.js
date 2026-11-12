// Procedural pixel-art backgrounds for every scene. Each painter returns cached layers:
//   back:  [{ canvas, glow?, factor, z }]  parallax layers behind the playfield
//   main:  { canvas, glow? }              the playfield (factor 1)
//   front: [{ canvas, factor }]            foreground silhouettes (kept sparse so clues stay visible)
// "glow" canvases are emissive pixels drawn after the lighting pass (lit windows, lamps).
// Painters author in WORLD units (1 canvas pixel = 1 world unit = legacy density). W×H here is the
// world-unit view the camera frames (VIEW_W×VIEW_H = 320×180), not a screen resolution.
// W is the WIDEST view the responsive display can show, so every parallax layer covers any window.
import { MAX_VIEW_W as W, VIEW_H as H } from '../engine/display.js';
import { mulberry32 } from '../engine/rng.js';
import {
  PAL, canvas, rect, px, hline, vline, line, ditherGradient, ditherFill, mountains, pine, pineRow,
  snowGround, planks, siding, windowPane, signText, signWidth,
} from './paint.js';
import { stationArt } from './stationArt.js';
import { townArt } from './townArt.js';
import { nativeArt, nativeLayers, parallaxArt } from './nativeArt.js';
import { artMode } from './artMode.js';

const cache = new Map();
export const sceneMeta = {}; // extra data painters expose (e.g. ridge heights)

export function getLayers(sceneId, phase, width) {
  const key = sceneId + ':' + phase + (artMode.legacy ? ':legacy' : '') + (artMode.legacyParallax ? ':oldParallax' : '');
  if (!cache.has(key)) {
    const fn = PAINTERS[sceneId];
    if (!fn) {
      console.error(`[painters] No painter for scene "${sceneId}". Drawing an empty backdrop.`);
      const [c, ctx] = canvas(width, H);
      rect(ctx, 0, 0, width, H, PAL.navy);
      cache.set(key, { back: [], main: { canvas: c }, front: [] });
    } else {
      const t0 = performance.now();
      cache.set(key, fn(width, phase));
      console.debug(`[painters] painted ${key} in ${(performance.now() - t0).toFixed(0)} ms`);
    }
  }
  return cache.get(key);
}

const lw = (sceneW, factor) => Math.ceil(W + (sceneW - W) * factor) + 2;

// Swap a parallax layer for its native-density painting (assets/export/environments/parallax/),
// keeping factor and z. glowName names the matching emissive layer, if the layer has one.
function nb(scene, name, layer, glowName) {
  const img = parallaxArt(scene, name);
  if (!img) return layer;
  const glow = glowName ? parallaxArt(scene, glowName) : null;
  return { ...layer, canvas: img, glow, native: true };
}

// Top edge of a native layer, per world unit (for props that sit on a painted ridge).
export function nativeHeights(img) {
  const [, x] = canvas(img.width, img.height);
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, img.width, img.height).data;
  const out = [];
  for (let wx = 0; wx < Math.floor(img.width / 1.5); wx++) {
    const col = Math.min(img.width - 1, Math.round(wx * 1.5));
    let top = img.height;
    for (let y = 0; y < img.height; y++) if (d[(y * img.width + col) * 4 + 3] > 12) { top = y; break; }
    out.push(Math.round(top / 1.5));
  }
  return out;
}

// ---------- shared exterior pieces ----------
function sky(colors, seed, streaks = true) {
  const [c, ctx] = canvas(W, H);
  ditherGradient(ctx, 0, 0, W, 160, colors);
  rect(ctx, 0, 160, W, 20, colors[colors.length - 1]);
  if (streaks) {
    const rng = mulberry32(seed);
    for (let i = 0; i < 9; i++) {
      const y = 8 + Math.floor(rng() * 90);
      const x = Math.floor(rng() * W);
      const len = 40 + Math.floor(rng() * 120);
      ditherFill(ctx, x, y, len, 1 + Math.floor(rng() * 3), colors[1], colors[0], 0.5);
    }
  }
  return { canvas: c, factor: 0, z: -100 };
}

function mountainLayer(sceneW, factor, baseY, amp, seed, body, snow, edge, z) {
  const w = lw(sceneW, factor);
  const [c, ctx] = canvas(w, H);
  const heights = mountains(ctx, w, baseY, amp, seed, body, snow, edge);
  return { canvas: c, factor, z, heights };
}

function pineLayer(sceneW, factor, baseY, minH, maxH, spacing, seed, col, snow, z, groundCol) {
  const w = lw(sceneW, factor);
  const [c, ctx] = canvas(w, H);
  pineRow(ctx, w, baseY, minH, maxH, spacing, seed, col, snow);
  if (groundCol) rect(ctx, 0, baseY + 2, w, H - baseY, groundCol);
  return { canvas: c, factor, z };
}

function groundFn(points) {
  return (x) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[i + 1];
      if (x >= x0 && x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
    return x < points[0][0] ? points[0][1] : points[points.length - 1][1];
  };
}

function footprints(ctx, x0, x1, gAt, seed, col, step = 9) {
  const rng = mulberry32(seed);
  let left = true;
  for (let x = x0; x < x1; x += step + Math.floor(rng() * 2)) {
    const g = Math.round(gAt(x));
    const yy = g + (left ? 1 : 3);
    rect(ctx, x, yy, 2, 1, col);
    px(ctx, x + 2, yy, col);
    left = !left;
  }
}

// ---------- BLACKWOOD STATION ----------
// The station is a Tiled map (assets/levels/blackwood_station.tmj, tiles from tilesets/station_exterior + black_ram_exterior).
// Its train is a prop (props.js) drawn between the map's track-bed layer and its playfield.

// The Road and the Creek Path are Tiled maps too (assets/levels/road_to_crows_hollow.tmj, creek_path.tmj; wilderness_exterior tileset).
// CROW'S HOLLOW Main Street and the Black Ram forecourt are Tiled maps (assets/levels/*.tmj): see world/tiled/.

// ---------- BLACK RAM HOTEL PARLOR ----------
// Native-density Pixelorama art (assets/export/environments/parlor) when available. Layers are
// flagged `native` so the renderer draws them at 1/WORLD_SCALE (each art pixel = one native pixel).
function paintParlor(sw, phase) {
  const A = nativeArt('PARLOR');
  return A ? nativeLayers(A, phase) : paintParlorProcedural(sw, phase);
}
function paintParlorProcedural(sw, phase) {
  const night = phase === 'NIGHT';
  const [m, ctx] = canvas(sw, H);
  const [g, gx] = canvas(sw, H);
  // ceiling
  rect(ctx, 0, 0, sw, 12, '#140d09');
  for (let x = 0; x < sw; x += 48) rect(ctx, x, 0, 6, 14, '#1d140e');
  hline(ctx, 0, sw, 12, '#2a1c13');
  // wallpaper
  rect(ctx, 0, 13, sw, 106, '#3a2220');
  for (let x = 0; x < sw; x += 6) { vline(ctx, x, 13, 118, '#43271f'); }
  const rng = mulberry32(90);
  for (let y = 18; y < 116; y += 8) for (let x = 3 + ((y / 8) % 2) * 3; x < sw; x += 6) if (rng() > 0.25) px(ctx, x, y, '#52301f');
  // chair rail & wainscot
  rect(ctx, 0, 118, sw, 3, PAL.wood4); hline(ctx, 0, sw, 118, PAL.wood5);
  rect(ctx, 0, 121, sw, 29, PAL.wood2);
  for (let x = 4; x < sw; x += 26) { rect(ctx, x, 125, 20, 21, PAL.wood1); rect(ctx, x + 1, 126, 18, 19, PAL.wood2); hline(ctx, x + 1, x + 18, 126, PAL.wood3); }
  // floor
  planks(ctx, 0, 150, sw, 30, PAL.wood3, PAL.wood1, PAL.wood4, 91, 5);
  hline(ctx, 0, sw, 150, PAL.wood5);
  // front door with cold glass
  rect(ctx, 4, 92, 26, 58, PAL.wood0);
  rect(ctx, 7, 95, 20, 55, '#3a2618');
  rect(ctx, 10, 99, 14, 16, '#16203a');
  hline(ctx, 10, 23, 106, PAL.wood0); vline(ctx, 16, 99, 114, PAL.wood0);
  px(ctx, 24, 126, PAL.amber);
  // coat hooks
  rect(ctx, 34, 100, 14, 2, PAL.wood1);
  rect(ctx, 35, 102, 5, 16, '#26242c'); rect(ctx, 34, 98, 7, 3, '#1c1916');
  rect(ctx, 42, 102, 4, 12, '#3a2f28');
  // fireplace
  const fx0 = 56;
  rect(ctx, fx0, 90, 56, 60, '#3d3834');
  for (let y = 92; y < 150; y += 5) for (let x = fx0 + ((y / 5) % 2) * 4; x < fx0 + 56; x += 8) { rect(ctx, x, y, 7, 4, '#4b4540'); px(ctx, x, y, '#5a534d'); }
  rect(ctx, fx0 - 4, 88, 64, 5, PAL.wood4); hline(ctx, fx0 - 4, fx0 + 59, 88, PAL.wood5);
  rect(ctx, fx0 + 14, 116, 28, 34, '#0a0706');
  rect(ctx, fx0 + 12, 114, 32, 3, '#2a2522');
  rect(ctx, fx0 + 16, 146, 24, 2, PAL.iron2);
  // mantel clock + candlesticks
  rect(ctx, fx0 + 24, 79, 9, 9, PAL.wood1); rect(ctx, fx0 + 26, 81, 5, 5, '#c9c0a8'); px(ctx, fx0 + 28, 82, PAL.ink); px(ctx, fx0 + 28, 83, PAL.ink); px(ctx, fx0 + 29, 83, PAL.ink);
  rect(ctx, fx0 + 6, 82, 2, 6, '#a07a3a'); rect(ctx, fx0 + 48, 82, 2, 6, '#a07a3a');
  // photograph over the corner table
  rect(ctx, 148, 58, 26, 22, PAL.wood0); rect(ctx, 150, 60, 22, 18, '#8d8574');
  rect(ctx, 150, 70, 22, 8, '#6d6658');
  for (let i = 0; i < 6; i++) { rect(ctx, 152 + i * 3, 66, 2, 6, '#3a3630'); px(ctx, 152 + i * 3, 65, '#4a453e'); }
  rect(ctx, 165, 61, 6, 6, '#5d574c');
  px(ctx, 160, 58, PAL.wood5);
  // reception desk is an overlay prop so Mrs. Gable can stand behind it
  // pigeonholes & key board
  rect(ctx, 246, 66, 62, 40, PAL.wood1);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    rect(ctx, 248 + c * 10, 68 + r * 9, 8, 7, '#120c08');
    if ((r * 6 + c) % 4 === 1) rect(ctx, 249 + c * 10, 71 + r * 9, 5, 3, '#b5ab92');
  }
  for (let i = 0; i < 6; i++) { px(ctx, 250 + i * 10, 108, '#a07a3a'); if (i !== 3) { vline(ctx, 250 + i * 10, 109, 112, '#c08a2c'); } }
  rect(ctx, 246, 107, 62, 1, PAL.wood3);
  signText(ctx, '1 2 3 4 5 6', 249, 113, '#7a6146');
  // stairs
  for (let i = 0; i < 10; i++) {
    const sx = 334 + i * 6, sy = 144 - i * 6;
    rect(ctx, sx, sy, sw - sx, 6, PAL.wood2);
    hline(ctx, sx, sw, sy, PAL.wood4);
    vline(ctx, sx, sy, sy + 5, PAL.wood1);
  }
  line(ctx, 330, 116, 392, 56, PAL.wood5);
  line(ctx, 330, 117, 392, 57, PAL.wood3);
  for (let i = 0; i < 11; i++) vline(ctx, 332 + i * 6, 116 - i * 6, 150 - i * 6, PAL.wood1);
  rect(ctx, 328, 112, 4, 38, PAL.wood4);
  rect(ctx, 372, 22, 26, 32, '#0d0806');
  // wall sconces
  const sconces = [[122, 96], [222, 92], [322, 96]];
  for (const [x, y] of sconces) {
    rect(ctx, x - 1, y + 3, 3, 4, '#a07a3a');
    rect(ctx, x - 2, y - 3, 5, 6, night ? '#2a2420' : '#c08a2c');
    if (!night) { rect(gx, x - 1, y - 3, 3, 5, 'rgba(252,211,77,0.85)'); px(gx, x, y - 4, PAL.amberHi); }
  }
  // desk lamp
  rect(ctx, 250, 108, 6, 2, '#a07a3a');
  if (!night) rect(gx, 251, 103, 4, 5, 'rgba(252,211,77,0.8)');
  return { back: [], main: { canvas: m, glow: g }, front: [] };
}

// ---------- ROOM 4 ----------
function paintRoom4(sw, phase) {
  const A = nativeArt('ROOM4');
  return A ? nativeLayers(A, phase) : paintRoom4Procedural(sw, phase);
}
function paintRoom4Procedural(sw, phase) {
  const night = phase === 'NIGHT';
  const [m, ctx] = canvas(sw, H);
  const [g, gx] = canvas(sw, H);
  rect(ctx, 0, 0, sw, 16, '#16100c');
  rect(ctx, 0, 16, sw, 108, '#2f2b25');
  for (let x = 0; x < sw; x += 8) vline(ctx, x, 16, 123, '#35302a');
  const rng = mulberry32(44);
  for (let y = 22; y < 120; y += 10) for (let x = 4; x < sw; x += 8) if (rng() > 0.3) { px(ctx, x, y, '#3d372f'); px(ctx, x + 1, y + 1, '#3d372f'); }
  // a pale rectangle where a picture once hung
  rect(ctx, 90, 50, 18, 14, '#38332c'); hline(ctx, 90, 107, 50, '#2a2620');
  rect(ctx, 0, 122, sw, 3, PAL.wood3);
  rect(ctx, 0, 125, sw, 25, '#2a1d15');
  for (let x = 6; x < sw; x += 30) { rect(ctx, x, 129, 24, 17, '#22170f'); hline(ctx, x, x + 23, 129, '#33241a'); }
  // floor — normal boards
  planks(ctx, 0, 150, sw, 30, PAL.wood3, PAL.wood1, PAL.wood4, 45, 5);
  hline(ctx, 0, sw, 150, PAL.wood5);
  // the scrubbed patch: paler boards, raised grain, dark residue only in the seams
  for (let y = 151; y < 166; y++) for (let x = 172; x < 202; x++) {
    const edge = Math.min(x - 172, 201 - x, y - 151 < 2 ? 9 : 9, 165 - y);
    const r = rng();
    if (edge < 2 && r > 0.5) continue;
    px(ctx, x, y, r > 0.82 ? '#806650' : '#6f5841');
  }
  for (const yy of [155, 160, 165]) for (let x = 172; x < 202; x++) px(ctx, x, yy, rng() > 0.45 ? '#3a1712' : PAL.wood1);
  vline(ctx, 186, 151, 154, '#3a1712'); vline(ctx, 179, 156, 159, '#3a1712'); vline(ctx, 194, 161, 164, '#3a1712');
  for (let i = 0; i < 14; i++) px(ctx, 173 + Math.floor(rng() * 28), 151 + Math.floor(rng() * 14), '#8a7058');
  // door
  rect(ctx, 8, 96, 24, 54, PAL.wood0);
  rect(ctx, 10, 98, 20, 52, '#3a2618');
  rect(ctx, 13, 102, 14, 18, '#32200f'); rect(ctx, 13, 124, 14, 22, '#32200f');
  px(ctx, 27, 126, '#c08a2c');
  signText(ctx, '4', 18, 90, '#b5ab92');
  // wardrobe
  rect(ctx, 44, 82, 36, 68, PAL.wood1);
  rect(ctx, 46, 86, 15, 60, PAL.wood2); rect(ctx, 63, 86, 15, 60, PAL.wood2);
  rect(ctx, 42, 80, 40, 3, PAL.wood3);
  px(ctx, 60, 114, '#a07a3a'); px(ctx, 64, 114, '#a07a3a');
  // washstand, basin, jug, lamp
  rect(ctx, 92, 128, 30, 3, PAL.wood4); rect(ctx, 94, 131, 26, 19, PAL.wood2); rect(ctx, 96, 134, 22, 6, PAL.wood1);
  rect(ctx, 97, 124, 14, 4, '#d6d0c4'); hline(ctx, 98, 109, 124, '#ece8e0');
  rect(ctx, 100, 116, 6, 8, '#c9c2b4'); px(ctx, 106, 118, '#c9c2b4'); px(ctx, 107, 119, '#c9c2b4');
  rect(ctx, 114, 122, 5, 6, '#a07a3a'); rect(ctx, 114, 114, 5, 8, night ? '#3a3328' : '#d8b26a');
  if (!night) { rect(gx, 115, 116, 3, 5, 'rgba(252,211,77,0.9)'); } else { rect(gx, 116, 119, 1, 2, 'rgba(217,119,6,0.7)'); }
  // window onto the storm (snow inside is a prop)
  rect(ctx, 138, 62, 36, 46, PAL.wood0);
  rect(ctx, 141, 65, 30, 40, '#111a2c');
  vline(ctx, 156, 65, 104, PAL.wood0); hline(ctx, 141, 170, 84, PAL.wood0);
  for (const [x, y] of [[141, 65], [157, 65], [141, 85], [157, 85]]) { px(ctx, x, y, '#8e9bb0'); px(ctx, x + 1, y, '#5d6a80'); px(ctx, x, y + 1, '#5d6a80'); }
  rect(ctx, 136, 108, 40, 3, PAL.wood3);
  // chair
  rect(ctx, 124, 130, 2, 20, PAL.wood1); rect(ctx, 124, 136, 10, 2, PAL.wood2); rect(ctx, 132, 138, 2, 12, PAL.wood1);
  // bed
  rect(ctx, 206, 118, 3, 32, PAL.iron2); rect(ctx, 278, 104, 3, 46, PAL.iron2);
  for (let i = 0; i < 4; i++) vline(ctx, 282 - 2 - i * 0, 108 + i * 8, 112 + i * 8, PAL.iron);
  for (let y = 108; y < 128; y += 5) hline(ctx, 278, 280, y, '#565c68');
  rect(ctx, 208, 132, 70, 10, PAL.iron); rect(ctx, 208, 126, 70, 7, '#cfc9bc'); hline(ctx, 208, 277, 126, '#e6e1d6');
  rect(ctx, 260, 121, 16, 6, '#e0dbd0'); hline(ctx, 261, 274, 121, '#f0ece4');
  rect(ctx, 208, 128, 48, 6, '#3d3247'); hline(ctx, 208, 255, 128, '#51435d');
  for (let x = 210; x < 255; x += 7) px(ctx, x, 127, '#bdb6a8');
  return { back: [], main: { canvas: m, glow: g }, front: [] };
}

// ---------- THE OLD SAWMILL ----------
// The sawmill is a Tiled map (assets/levels/old_sawmill.tmj, tiles from tilesets/sawmill_exterior). Its ridge
// layer is flagged `ridge`, which publishes the skyline heights for the closing lantern (see tiled/levels.js).
export const RIDGE_FACTOR = 0.22;

// ---------- title backdrop ----------
function paintTitle() {
  const sw = 640;
  const back = [
    sky([PAL.navy, '#0b0f1b', PAL.purple, '#191f2e'], 19),
    mountainLayer(sw, 0.08, 118, 50, 111, '#171d2b', '#5a667d', '#212a39', -90),
    mountainLayer(sw, 0.2, 138, 30, 112, '#111622', '#333e52', null, -85),
    pineLayer(sw, 0.42, 150, 12, 28, 6, 113, '#0c1019', '#28303f', -70, '#0c1019'),
    pineLayer(sw, 0.7, 162, 40, 80, 18, 114, '#080b12', '#2f394b', -60),
  ];
  const [m, ctx] = canvas(sw, H);
  snowGround(ctx, sw, (x) => 160 + Math.round(Math.sin(x / 40) * 2), H, 115);
  footprints(ctx, 0, sw, (x) => 160 + Math.round(Math.sin(x / 40) * 2), 116, '#56627a', 10);
  return { back, main: { canvas: m }, front: [] };
}

const PAINTERS = {
  PARLOR: paintParlor,
  ROOM4: paintRoom4, TITLE: paintTitle,
};

// Data-driven scenes (Tiled maps, see world/tiled/levels.js) register their own layer builder.
export function registerPainter(sceneId, fn) { PAINTERS[sceneId] = fn; clearLayerCache(sceneId); }
// Drop cached layers (all phases) so the next getLayers() rebuilds them, e.g. after a map reload.
export function clearLayerCache(sceneId) { for (const k of [...cache.keys()]) if (k.split(':')[0] === sceneId) cache.delete(k); }
