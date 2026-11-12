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

// The hotel interiors (PARLOR, ROOM4) are Tiled maps too (assets/levels/black_ram_parlor.tmj, room_4.tmj; hotel_interior tileset).

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
  TITLE: paintTitle, // the title-screen backdrop is the only procedural scene left
};

// Data-driven scenes (Tiled maps, see world/tiled/levels.js) register their own layer builder.
export function registerPainter(sceneId, fn) { PAINTERS[sceneId] = fn; clearLayerCache(sceneId); }
// Drop cached layers (all phases) so the next getLayers() rebuilds them, e.g. after a map reload.
export function clearLayerCache(sceneId) { for (const k of [...cache.keys()]) if (k.split(':')[0] === sceneId) cache.delete(k); }
