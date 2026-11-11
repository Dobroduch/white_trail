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
import { nativeArt, nativeLayers } from './nativeArt.js';
import { artMode } from './artMode.js';

const cache = new Map();
export const sceneMeta = {}; // extra data painters expose (e.g. ridge heights)

export function getLayers(sceneId, phase, width) {
  const key = sceneId + ':' + phase + (artMode.legacy ? ':legacy' : '');
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
// Painted version (Pixelorama layers). Lighting, steam, snow and fog stay dynamic in the engine, so
// the baked light pools / steam / snowfall layers are intentionally not used here.
function paintStationPainted(sw, A) {
  const SPLIT = 147; // deck top: everything above is behind the train prop, everything below in front
  const slice = (img, w, y0, y1) => {
    const [c, x] = canvas(w, H);
    x.drawImage(img, 0, y0, w, y1 - y0, 0, y0, w, y1 - y0);
    return c;
  };
  const full = (img, w) => slice(img, w, 0, H);
  const back = [
    { canvas: full(A.sky, W), factor: 0, z: -100 },
    { canvas: full(A.mountains_far, lw(sw, 0.08)), factor: 0.08, z: -90 },
    { canvas: full(A.mountains_near, lw(sw, 0.2)), factor: 0.2, z: -80 },
    { canvas: full(A.pines, lw(sw, 0.4)), factor: 0.4, z: -70 },
    { canvas: full(A.haze, sw), factor: 1, z: -60 },
  ];
  // track bed, bank and rails (+ shadows above the deck) sit behind the train
  const [bk, bkx] = canvas(sw, H);
  bkx.drawImage(slice(A.ground, sw, 0, SPLIT), 0, 0);
  bkx.drawImage(slice(A.shadows, sw, 0, SPLIT), 0, 0);
  back.push({ canvas: bk, factor: 1, z: -50 });

  const [m, mx] = canvas(sw, H);
  mx.drawImage(slice(A.ground, sw, SPLIT, H), 0, 0);
  mx.drawImage(A.building, 0, 0);
  mx.drawImage(A.props, 0, 0);
  mx.drawImage(slice(A.shadows, sw, SPLIT, H), 0, 0);
  // emissive: lamps + windows. The train's own glow is drawn by the train prop (it moves).
  const [g, gx] = canvas(sw, H);
  gx.drawImage(A.emissive, 0, 0);
  gx.clearRect(0, 95, 232, 60);
  const [f, fx] = canvas(sw, H);
  fx.drawImage(A.drifts, 0, 0);
  return { back, main: { canvas: m, glow: g }, front: [{ canvas: f, factor: 1, z: 20 }] };
}

function paintStation(sw) {
  const A = stationArt();
  if (A) return paintStationPainted(sw, A);
  return paintStationProcedural(sw);
}

function paintStationProcedural(sw) {
  const back = [
    sky([PAL.navy, '#0d1220', PAL.purple, '#1d2335', '#2a3143'], 11),
    mountainLayer(sw, 0.08, 116, 48, 21, '#1b2232', '#5a667d', '#252f40', -90),
    mountainLayer(sw, 0.2, 134, 30, 33, '#131926', '#3c475b', null, -80),
    pineLayer(sw, 0.4, 146, 9, 22, 6, 41, '#0d121c', '#2c3546', -70, '#0d121c'),
  ];
  const [m, ctx] = canvas(sw, H);
  const [g, gx] = canvas(sw, H);
  // track bed + rails (behind platform)
  rect(ctx, 0, 140, sw, 7, '#10141d');
  for (let x = 0; x < sw; x += 6) rect(ctx, x, 144, 4, 2, '#2a2019');
  hline(ctx, 0, sw, 143, PAL.iron2);
  // platform deck + face
  planks(ctx, 0, 147, sw, 4, PAL.wood3, PAL.wood1, PAL.wood5, 5, 2);
  hline(ctx, 0, sw, 147, PAL.snow2);
  const rng = mulberry32(77);
  for (let i = 0; i < 70; i++) { const x = Math.floor(rng() * sw); rect(ctx, x, 147, 2 + Math.floor(rng() * 8), 1, PAL.snow3); }
  rect(ctx, 0, 151, sw, 9, PAL.wood1);
  for (let x = 4; x < sw; x += 22) rect(ctx, x, 151, 3, 9, PAL.wood2);
  hline(ctx, 0, sw, 151, PAL.wood4);
  snowGround(ctx, sw, () => 160, H, 9);
  // station building
  const bx = 330, bw = 140, top = 92;
  siding(ctx, bx, top, bw, 147 - top, PAL.wood2, PAL.wood1, PAL.wood3, 3);
  // roof
  for (let i = 0; i < 16; i++) rect(ctx, bx - 8 + i, top - 16 + i, bw + 16 - i * 2, 1, i < 3 ? PAL.snow3 : i < 5 ? PAL.snow1 : '#2a2220');
  hline(ctx, bx - 8, bx + bw + 8, top - 16, PAL.snow4);
  rect(ctx, bx - 8, top, bw + 16, 3, PAL.wood1);
  // canopy over platform edge
  rect(ctx, bx - 14, 104, bw + 28, 3, PAL.wood1);
  hline(ctx, bx - 14, bx + bw + 14, 103, PAL.snow3);
  for (const p of [bx - 10, bx + bw + 9]) rect(ctx, p, 107, 2, 40, PAL.wood1);
  // sign
  const sign = 'BLACKWOOD';
  rect(ctx, bx + 44, 96, signWidth(sign) + 6, 9, PAL.wood0);
  signText(ctx, sign, bx + 47, 98, PAL.snow3);
  // windows: waiting room (dark), telegraph office (lit)
  windowPane(ctx, bx + 16, 112, 16, 18, PAL.wood0, '#141a26', null);
  windowPane(ctx, bx + 90, 112, 18, 18, PAL.wood0, '#3b2610', PAL.kerosene);
  windowPane(gx, bx + 90, 112, 18, 18, 'rgba(0,0,0,0)', '#5a3510', PAL.amber);
  rect(gx, bx + 91, 113, 2, 2, PAL.amberHi);
  // door
  rect(ctx, bx + 50, 117, 16, 30, PAL.wood0);
  rect(ctx, bx + 52, 119, 12, 26, PAL.wood2);
  px(ctx, bx + 62, 132, PAL.amber);
  // telegraph office plate
  rect(ctx, bx + 88, 133, 23, 6, PAL.wood0);
  signText(ctx, 'TEL', bx + 94, 134, PAL.snow2);
  // timetable chalkboard
  rect(ctx, bx + 118, 112, 18, 16, PAL.wood1);
  rect(ctx, bx + 119, 113, 16, 14, '#162019');
  for (let i = 0; i < 5; i++) hline(ctx, bx + 121, bx + 121 + 6 + ((i * 5) % 7), 115 + i * 2, '#8c9a90');
  line(ctx, bx + 121, 125, bx + 133, 124, '#c8d2cc');
  // freight: crates & sacks
  rect(ctx, 286, 136, 14, 11, PAL.wood3); rect(ctx, 287, 137, 12, 9, PAL.wood4);
  line(ctx, 287, 137, 298, 145, PAL.wood2); hline(ctx, 286, 299, 136, PAL.snow3);
  rect(ctx, 301, 140, 9, 7, '#6b604c'); rect(ctx, 302, 139, 7, 2, '#7d7058'); hline(ctx, 302, 308, 139, PAL.snow3);
  rect(ctx, 309, 142, 7, 5, '#5f5644');
  // lamp post
  rect(ctx, 259, 114, 2, 33, PAL.iron);
  rect(ctx, 256, 110, 8, 2, PAL.iron);
  rect(ctx, 256, 104, 8, 6, PAL.iron);
  rect(ctx, 257, 105, 6, 4, PAL.kerosene);
  rect(gx, 257, 105, 6, 4, PAL.amber); rect(gx, 259, 106, 2, 2, PAL.amberHi);
  hline(ctx, 255, 264, 103, PAL.snow3);
  // telegraph pole + wires
  rect(ctx, 506, 64, 3, 83, '#1b1510');
  rect(ctx, 498, 70, 19, 2, '#1b1510');
  px(ctx, 500, 69, PAL.slate6); px(ctx, 514, 69, PAL.slate6);
  for (let x = 0; x < 500; x++) {
    const sag = Math.round(Math.sin((x / 500) * Math.PI) * 8);
    px(ctx, x, 69 + sag, '#2a3040');
    px(ctx, x, 72 + sag, '#252a38');
  }
  for (let x = 516; x < sw; x++) px(ctx, x, 69 + Math.round(((x - 516) / 60) * 3), '#2a3040');
  // front: low drifts
  const [f, fx] = canvas(lw(sw, 1.15), H);
  const fr = mulberry32(5);
  for (let x = 0; x < f.width; x += 40 + Math.floor(fr() * 60)) {
    const w = 20 + Math.floor(fr() * 30);
    for (let i = 0; i < w; i++) {
      const hgt = Math.round(Math.sin((i / w) * Math.PI) * 6);
      vline(fx, x + i, 180 - hgt, 179, '#1a2130');
      if (hgt > 1) px(fx, x + i, 180 - hgt, '#4a5568');
    }
  }
  return { back, main: { canvas: m, glow: g }, front: [{ canvas: f, factor: 1.15, z: 20 }] };
}

// ---------- THE ROAD ----------
export const ROAD_GROUND = [[0, 150], [120, 148], [260, 152], [400, 149], [540, 151], [680, 148], [800, 150]];
function paintRoad(sw) {
  const back = [
    sky([PAL.navy, '#0b0f1b', PAL.purple, '#191f2e'], 12),
    mountainLayer(sw, 0.08, 112, 44, 51, '#171d2b', '#4e5a70', '#212a39', -90),
    mountainLayer(sw, 0.18, 130, 28, 52, '#111622', '#333e52', null, -85),
  ];
  // distant village lights
  {
    const factor = 0.32, w = lw(sw, factor);
    const [c, ctx] = canvas(w, H);
    const [gc, gctx] = canvas(w, H);
    const r = mulberry32(3);
    for (let i = 0; i < 7; i++) {
      const hx = w - 120 + i * 14 + Math.floor(r() * 6);
      const hh = 6 + Math.floor(r() * 6);
      rect(ctx, hx, 140 - hh, 10, hh + 4, '#0e121c');
      for (let k = 0; k < 6; k++) px(ctx, hx - 1 + k * 2, 140 - hh - 1 - (k < 3 ? k : 5 - k), '#0e121c');
      if (r() > 0.35) { px(gctx, hx + 3, 136 - Math.floor(hh / 2), PAL.amber); px(gctx, hx + 4, 136 - Math.floor(hh / 2), PAL.kerosene); }
    }
    back.push({ canvas: c, glow: gc, factor, z: -78 });
  }
  back.push(pineLayer(sw, 0.42, 146, 10, 24, 6, 61, '#0c1019', '#28303f', -70, '#0c1019'));
  back.push(pineLayer(sw, 0.7, 152, 30, 62, 16, 62, '#090c14', '#2f394b', -60));
  const gAt = groundFn(ROAD_GROUND);
  const [m, ctx] = canvas(sw, H);
  const [g] = canvas(sw, H);
  // fence (behind path)
  const fenceRuns = [[30, 300], [450, 650]];
  for (const [a, b] of fenceRuns) {
    for (let x = a; x <= b; x += 14) {
      const gy = Math.round(gAt(x));
      const broken = x > 210 && x < 240;
      rect(ctx, x, gy - 15, 2, 15, '#1e1712');
      px(ctx, x, gy - 16, PAL.snow3); px(ctx, x + 1, gy - 16, PAL.snow2);
      if (x + 14 <= b && !broken) {
        const gy2 = Math.round(gAt(x + 14));
        line(ctx, x + 2, gy - 11, x + 13, gy2 - 11, '#2a2018');
        line(ctx, x + 2, gy - 6, x + 13, gy2 - 6, '#2a2018');
        line(ctx, x + 2, gy - 12, x + 13, gy2 - 12, PAL.snow1);
      }
      if (broken) line(ctx, x + 2, gy - 11, x + 9, gy - 2, '#2a2018');
    }
  }
  snowGround(ctx, sw, gAt, H, 17);
  // trodden path: wagon ruts
  for (let x = 0; x < sw; x++) {
    const gy = Math.round(gAt(x));
    if ((x * 7) % 11 > 2) px(ctx, x, gy + 2, PAL.snow1);
    if ((x * 5) % 13 > 3) px(ctx, x, gy + 5, PAL.snow1);
  }
  // signpost
  {
    const x = 140, gy = Math.round(gAt(x));
    rect(ctx, x, gy - 26, 2, 26, '#2a1f17');
    const t = "CROW'S HOLLOW";
    const w = signWidth(t) + 8;
    rect(ctx, x - 4, gy - 30, w, 8, '#3a2a1c');
    for (let i = 0; i < 4; i++) vline(ctx, x - 4 + w + i, gy - 30 + i, gy - 23 - i, '#3a2a1c');
    hline(ctx, x - 4, x - 4 + w, gy - 31, PAL.snow3);
    signText(ctx, t, x - 1, gy - 28, '#c8bfa8');
  }
  // half-buried ore car on a stub of rail
  {
    const x = 352, gy = Math.round(gAt(x));
    hline(ctx, x - 14, x + 30, gy - 1, PAL.iron2);
    rect(ctx, x - 2, gy - 12, 22, 9, PAL.rust);
    rect(ctx, x - 3, gy - 13, 24, 2, '#3a2418');
    for (let i = 0; i < 5; i++) vline(ctx, x + 1 + i * 4, gy - 11, gy - 5, '#4a2a1b');
    rect(ctx, x + 1, gy - 4, 4, 4, PAL.iron); rect(ctx, x + 13, gy - 4, 4, 4, PAL.iron);
    hline(ctx, x - 3, x + 20, gy - 14, PAL.snow4);
    for (let i = 0; i < 18; i++) px(ctx, x + i, gy - 15 - (i % 5 === 0 ? 1 : 0), PAL.snow3);
    for (let i = -6; i < 30; i++) { const hh = Math.max(0, 4 - Math.abs(i - 6) / 4); vline(ctx, x + i, Math.round(gy - hh), gy, PAL.snow3); }
  }
  // notice board near the village
  {
    const x = 716, gy = Math.round(gAt(x));
    rect(ctx, x, gy - 30, 2, 30, '#2a1f17'); rect(ctx, x + 22, gy - 30, 2, 30, '#2a1f17');
    rect(ctx, x - 2, gy - 34, 28, 3, '#2a1f17'); hline(ctx, x - 2, x + 25, gy - 35, PAL.snow4);
    rect(ctx, x + 2, gy - 30, 20, 16, '#3a2a1c');
    rect(ctx, x + 5, gy - 28, 9, 11, '#c9bfa6');
    for (let i = 0; i < 4; i++) hline(ctx, x + 6, x + 12, gy - 26 + i * 2, '#6b6250');
    rect(ctx, x + 15, gy - 27, 5, 6, '#a9a08a');
  }
  // front: big trunks
  const fw = lw(sw, 1.3);
  const [f, fx] = canvas(fw, H);
  const fr = mulberry32(8);
  for (let x = 120; x < fw; x += 230 + Math.floor(fr() * 140)) {
    const tw = 10;
    rect(fx, x, 0, tw, H, '#05070c');
    vline(fx, x, 0, H, '#0d111b');
    for (let y = 0; y < H; y += 3) if (fr() > 0.55) px(fx, x + 1 + Math.floor(fr() * (tw - 2)), y, '#0b0e16');
    // snow caught on the windward side, and broken branch stubs with snow clumps
    for (let y = 0; y < H; y += 2) if (fr() > 0.6) px(fx, x, y, '#1e2534');
    for (let y = 8; y < H - 30; y += 18 + Math.floor(fr() * 18)) {
      const side = fr() > 0.5 ? -1 : 1;
      const len = 6 + Math.floor(fr() * 10);
      const bx = side < 0 ? x - len : x + tw;
      rect(fx, bx, y, len, 2, '#05070c');
      rect(fx, bx + (side < 0 ? 0 : len - 4), y - 1, 4, 1, '#3b4558');
      if (fr() > 0.5) px(fx, bx + (side < 0 ? 1 : len - 2), y + 2, '#05070c');
    }
  }
  return { back, main: { canvas: m, glow: g }, front: [{ canvas: f, factor: 1.3, z: 20 }] };
}

// ---------- CROW'S HOLLOW (main street) ----------
export const VILLAGE_GROUND = [[0, 150], [556, 150], [600, 154], [640, 157]];

// Painted version (Pixelorama layers). Structure (buildings, ground, props, shadows) is one `main`
// canvas; lit windows and lamps live on the separate `glow` canvas (drawn by the engine's emissive
// pass, which cuts out characters standing in front of them). Evening and night differ only in the
// sky, the far lights and the glow layers.
function paintVillagePainted(sw, phase, A) {
  const night = phase === 'NIGHT';
  const slice = (img, w) => { const [c, x] = canvas(w, H); x.drawImage(img, 0, 0, w, H, 0, 0, w, H); return c; };
  const back = [
    { canvas: slice(night ? A.sky_night : A.sky_evening, W), factor: 0, z: -100 },
    { canvas: slice(A.mountains, lw(sw, 0.08)), factor: 0.08, z: -90 },
    { canvas: slice(A.far_trees, lw(sw, 0.3)), factor: 0.3, z: -80 },
    { canvas: slice(A.far_rooftops, lw(sw, 0.5)), glow: night ? null : slice(A.far_lights_evening, lw(sw, 0.5)), factor: 0.5, z: -70 },
    { canvas: slice(A.fog, sw), factor: 1, z: -60 },
  ];
  const [m, mx] = canvas(sw, H);
  for (const k of ['buildings', 'ground', 'props', 'shadows']) mx.drawImage(A[k], 0, 0, sw, H, 0, 0, sw, H);
  const [g, gx] = canvas(sw, H);
  if (night) {
    gx.drawImage(A.windows_night, 0, 0, sw, H, 0, 0, sw, H);
  } else {
    gx.drawImage(A.windows_evening, 0, 0, sw, H, 0, 0, sw, H);
    gx.drawImage(A.lamps, 0, 0, sw, H, 0, 0, sw, H);
  }
  const [f, fx] = canvas(lw(sw, 1.2), H);
  fx.drawImage(A.drifts, 0, 0);
  return { back, main: { canvas: m, glow: g }, front: [{ canvas: f, factor: 1.2, z: 20 }] };
}

function paintVillage(sw, phase) {
  const A = townArt();
  if (A) return paintVillagePainted(sw, phase, A);
  return paintVillageProcedural(sw, phase);
}

function paintVillageProcedural(sw, phase) {
  const night = phase === 'NIGHT';
  const back = [
    sky(night ? ['#06080f', PAL.navy, PAL.purple, '#151a28'] : [PAL.navy, '#0d1220', PAL.purple, '#1b2131'], 13),
    mountainLayer(sw, 0.08, 108, 44, 71, '#171d2b', '#4e5a70', '#212a39', -90),
    pineLayer(sw, 0.3, 136, 8, 18, 6, 72, '#0e131d', '#28303f', -80, '#0e131d'),
  ];
  // far rooftops and church steeple
  {
    const factor = 0.5, w = lw(sw, factor);
    const [c, ctx] = canvas(w, H);
    const [gc, gctx] = canvas(w, H);
    const r = mulberry32(14);
    const col = '#0b0f18';
    for (let x = 0; x < w; x += 18 + Math.floor(r() * 16)) {
      const hh = 14 + Math.floor(r() * 16), ww = 14 + Math.floor(r() * 10);
      rect(ctx, x, 146 - hh, ww, hh + 6, col);
      for (let i = 0; i < ww / 2; i++) hline(ctx, x + i, x + ww - i - 1, 146 - hh - Math.floor(i / 1.2), col);
      hline(ctx, x + 2, x + ww - 3, 146 - hh - 1, '#2f394b');
      if (!night && r() > 0.45) { rect(gctx, x + 4, 136 - Math.floor(hh / 2), 2, 2, PAL.kerosene); }
    }
    // steeple
    const sx = Math.floor(w * 0.62);
    rect(ctx, sx, 96, 12, 50, col);
    for (let i = 0; i < 18; i++) hline(ctx, sx + Math.floor(i / 3), sx + 11 - Math.floor(i / 3), 96 - 18 + i, col);
    vline(ctx, sx + 6, 70, 78, col); hline(ctx, sx + 4, sx + 8, 72, col);
    rect(ctx, sx + 4, 104, 4, 6, '#141a26');
    back.push({ canvas: c, glow: gc, factor, z: -70 });
  }
  const gAt = groundFn(VILLAGE_GROUND);
  const [m, ctx] = canvas(sw, H);
  const [g, gx] = canvas(sw, H);
  const lit = night ? null : PAL.kerosene;
  const glowWin = (x, y, w, h, on) => {
    if (!on) return;
    rect(gx, x, y + h - Math.ceil(h / 3), w, Math.ceil(h / 3), PAL.amber);
    rect(gx, x, y, w, h - Math.ceil(h / 3), 'rgba(217,119,6,0.55)');
    vline(gx, x + Math.floor(w / 2), y, y + h - 1, 'rgba(0,0,0,0.6)');
    hline(gx, x, x + w - 1, y + Math.floor(h / 2), 'rgba(0,0,0,0.6)');
  };
  // house 1 (the watcher's window is a prop)
  siding(ctx, 20, 108, 100, 42, '#2b221b', '#1c1612', '#3a2e24', 21, 5);
  for (let i = 0; i < 26; i++) hline(ctx, 14 + i * 2, 125 - i * 2, 108 - i, i < 2 ? PAL.snow4 : '#201915');
  for (let i = 0; i < 26; i++) { px(ctx, 14 + i * 2, 108 - i, PAL.snow3); px(ctx, 125 - i * 2, 108 - i, PAL.snow3); }
  rect(ctx, 94, 70, 7, 16, '#1c1612'); hline(ctx, 94, 100, 69, PAL.snow3);
  rect(ctx, 30, 120, 12, 30, '#1c1612');
  windowPane(ctx, 60, 114, 14, 14, '#1c1612', '#121722', null);
  windowPane(ctx, 92, 114, 12, 14, '#1c1612', '#121722', null);
  // general store with false front
  siding(ctx, 140, 82, 112, 68, '#30251c', '#1f1812', '#3e3024', 22, 4);
  hline(ctx, 140, 251, 81, PAL.snow4); hline(ctx, 140, 251, 82, PAL.snow2);
  const st = "RUSK GEN'L MDSE";
  rect(ctx, 150, 88, signWidth(st) + 8, 9, '#1a140f');
  signText(ctx, st, 154, 90, '#b9ae95');
  rect(ctx, 136, 112, 120, 3, '#1a140f'); hline(ctx, 136, 255, 111, PAL.snow3);
  windowPane(ctx, 152, 118, 44, 22, '#1a140f', '#0f131c', null);
  for (let i = 0; i < 5; i++) rect(ctx, 156 + i * 8, 132, 5, 8 - (i % 3) * 2, '#1a1d24');
  rect(ctx, 214, 118, 18, 32, '#1a140f'); rect(ctx, 216, 120, 14, 30, '#2a2018');
  rect(ctx, 236, 132, 6, 18, '#1f1812');
  // the Black Ram Hotel
  const hx = 280, hw = 170;
  siding(ctx, hx, 66, hw, 84, '#3a2a20', '#261b14', '#4a3628', 23, 4);
  for (let i = 0; i < 12; i++) hline(ctx, hx - 4 + i, hx + hw + 3 - i, 66 - 12 + i, i < 2 ? PAL.snow4 : '#22180f');
  rect(ctx, hx - 2, 66, hw + 4, 2, '#1a120c');
  // upper windows
  for (let i = 0; i < 5; i++) {
    const wx = hx + 14 + i * 32;
    const on = night ? i === 3 : i !== 1;
    windowPane(ctx, wx, 74, 12, 16, '#1a120c', '#121722', on ? (night ? '#5a3a1a' : lit) : null);
    glowWin(wx, 74, 12, 16, on && !night);
    if (on && night) rect(gx, wx + 2, 84, 3, 4, 'rgba(217,119,6,0.35)');
  }
  // sign board
  const hs = 'BLACK RAM HOTEL';
  const sw2 = signWidth(hs) + 18;
  rect(ctx, hx + (hw - sw2) / 2, 96, sw2, 10, '#140d09');
  rect(ctx, hx + (hw - sw2) / 2 + 1, 97, sw2 - 2, 8, '#2a1a12');
  signText(ctx, hs, hx + (hw - sw2) / 2 + 14, 99, '#d9cfb3');
  // ram's horns emblem
  const ex = hx + (hw - sw2) / 2 + 4;
  rect(ctx, ex + 2, 99, 4, 4, '#d9cfb3'); px(ctx, ex + 1, 99, '#d9cfb3'); px(ctx, ex, 100, '#d9cfb3'); px(ctx, ex, 101, '#d9cfb3'); px(ctx, ex + 1, 102, '#d9cfb3');
  px(ctx, ex + 6, 99, '#d9cfb3'); px(ctx, ex + 7, 100, '#d9cfb3'); px(ctx, ex + 7, 101, '#d9cfb3'); px(ctx, ex + 6, 102, '#d9cfb3');
  // porch roof + posts
  rect(ctx, hx - 6, 110, hw + 12, 4, '#1a120c'); hline(ctx, hx - 6, hx + hw + 5, 109, PAL.snow4); hline(ctx, hx - 6, hx + hw + 5, 110, PAL.snow2);
  for (const p of [hx - 2, hx + 50, hx + 118, hx + hw]) rect(ctx, p, 114, 2, 36, '#22180f');
  // lower windows + door
  windowPane(ctx, hx + 16, 120, 22, 18, '#1a120c', '#121722', night ? null : lit);
  glowWin(hx + 16, 120, 22, 18, !night);
  windowPane(ctx, hx + 128, 120, 22, 18, '#1a120c', '#121722', night ? null : lit);
  glowWin(hx + 128, 120, 22, 18, !night);
  rect(ctx, hx + 74, 122, 20, 28, '#140d09');
  rect(ctx, hx + 76, 124, 16, 26, '#3a2618');
  rect(ctx, hx + 79, 127, 10, 8, night ? '#1a1410' : '#7a4a14');
  if (!night) { rect(gx, hx + 79, 127, 10, 8, 'rgba(245,158,11,0.75)'); }
  // porch lamp
  rect(ctx, hx + 66, 116, 4, 5, PAL.iron);
  if (!night) { rect(gx, hx + 67, 117, 2, 3, PAL.amberHi); }
  // hitching rail
  rect(ctx, hx + 4, 140, 2, 10, '#22180f'); rect(ctx, hx + 40, 140, 2, 10, '#22180f'); rect(ctx, hx + 4, 139, 38, 2, '#2e2116');
  hline(ctx, hx + 4, hx + 41, 138, PAL.snow3);
  // alley + shed
  rect(ctx, 452, 90, 16, 60, '#07090e');
  siding(ctx, 470, 112, 62, 38, '#241c16', '#17120e', '#30251c', 24, 6);
  for (let i = 0; i < 8; i++) hline(ctx, 466 + i, 535 - i, 112 - 8 + i, i < 2 ? PAL.snow4 : '#17120e');
  // fence at creek path + old mill sign
  for (let x = 540; x < sw; x += 12) {
    const gy = Math.round(gAt(x));
    if (x > 572 && x < 610) continue;
    rect(ctx, x, gy - 13, 2, 13, '#1e1712'); px(ctx, x, gy - 14, PAL.snow3);
    if (x + 12 < sw && !(x + 12 > 572 && x + 12 < 610)) line(ctx, x + 2, gy - 9, x + 11, Math.round(gAt(x + 12)) - 9, '#2a2018');
  }
  {
    const x = 590, gy = Math.round(gAt(x));
    rect(ctx, x, gy - 24, 2, 24, '#2a1f17');
    rect(ctx, x - 2, gy - 28, 22, 7, '#3a2a1c');
    for (let i = 0; i < 3; i++) vline(ctx, x + 20 + i, gy - 28 + i, gy - 22 - i, '#3a2a1c');
    signText(ctx, 'MILL', x + 2, gy - 27, '#b9ae95');
    hline(ctx, x - 2, x + 19, gy - 29, PAL.snow4);
  }
  snowGround(ctx, sw, gAt, H, 25);
  // trodden street
  for (let x = 0; x < sw; x++) { const gy = Math.round(gAt(x)); if ((x * 3) % 7 > 1) px(ctx, x, gy + 3, PAL.snow1); if ((x * 5) % 9 > 3) px(ctx, x, gy + 7, PAL.snow1); }
  const [f, fx] = canvas(lw(sw, 1.2), H);
  const fr = mulberry32(31);
  for (let x = 20; x < f.width; x += 70 + Math.floor(fr() * 90)) {
    const w = 18 + Math.floor(fr() * 24);
    for (let i = 0; i < w; i++) {
      const hgt = Math.round(Math.sin((i / w) * Math.PI) * 5);
      vline(fx, x + i, 180 - hgt, 179, '#151b28');
    }
  }
  return { back, main: { canvas: m, glow: g }, front: [{ canvas: f, factor: 1.2, z: 20 }] };
}

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

// ---------- THE CREEK PATH ----------
export const CREEK_GROUND = [[0, 150], [200, 153], [420, 156], [600, 157], [760, 157]];
function paintCreek(sw) {
  const back = [
    sky(['#05070d', PAL.navy, PAL.purple, '#121725'], 15),
    mountainLayer(sw, 0.08, 104, 42, 91, '#141a27', '#46526a', '#1c2433', -90),
    mountainLayer(sw, 0.2, 126, 30, 92, '#0f141f', '#2f394c', null, -85),
  ];
  // distant sawmill & waterwheel silhouette
  {
    const factor = 0.45, w = lw(sw, factor);
    const [c, ctx] = canvas(w, H);
    const col = '#0a0e17';
    const mx = w - 110;
    rect(ctx, mx, 116, 40, 26, col);
    for (let i = 0; i < 10; i++) hline(ctx, mx - 3 + i, mx + 42 - i, 116 - 10 + i, col);
    hline(ctx, mx - 3, mx + 42, 106, '#2f394b');
    const cx = mx + 54, cy = 124, r = 14;
    for (let a = 0; a < 64; a++) { const t = (a / 64) * Math.PI * 2; px(ctx, cx + Math.round(Math.cos(t) * r), cy + Math.round(Math.sin(t) * r), col); px(ctx, cx + Math.round(Math.cos(t) * (r - 1)), cy + Math.round(Math.sin(t) * (r - 1)), col); }
    for (let a = 0; a < 8; a++) { const t = (a / 8) * Math.PI * 2; line(ctx, cx, cy, cx + Math.cos(t) * r, cy + Math.sin(t) * r, col); }
    rect(ctx, mx + 40, 108, 30, 3, col);
    pineRow(ctx, w, 146, 10, 22, 6, 93, '#0c1019', '#232b3a');
    rect(ctx, 0, 146, w, 40, '#0c1019');
    back.push({ canvas: c, factor, z: -70 });
  }
  back.push(pineLayer(sw, 0.72, 154, 34, 66, 15, 94, '#070a11', '#283244', -60));
  const gAt = groundFn(CREEK_GROUND);
  const [m, ctx] = canvas(sw, H);
  const [g] = canvas(sw, H);
  // creek in the foreground
  rect(ctx, 0, 168, sw, 12, '#08101c');
  const rng = mulberry32(95);
  for (let x = 0; x < sw; x += 6 + Math.floor(rng() * 20)) {
    const w = 8 + Math.floor(rng() * 30);
    rect(ctx, x, 168 + Math.floor(rng() * 3), w, 2 + Math.floor(rng() * 3), '#3a4659');
    hline(ctx, x, x + w - 1, 168, '#5d6a80');
  }
  snowGround(ctx, sw, gAt, 168, 96);
  for (let x = 0; x < sw; x++) px(ctx, x, 167, (x * 7) % 5 ? '#2a3446' : '#3a4659');
  // fresh footprints toward the bridge (visible, subtle; the lantern makes them read clearly)
  footprints(ctx, 30, 636, gAt, 97, '#3a4659');
  // footbridge (angles away from the viewer across the creek)
  {
    const bx = 628;
    for (let i = 0; i < 9; i++) {
      const y = 157 + i;
      rect(ctx, bx + i * 2, y, 34 - i, 1, i % 2 ? PAL.wood2 : PAL.wood3);
    }
    hline(ctx, bx, bx + 34, 157, PAL.snow3);
    rect(ctx, bx + 2, 140, 2, 18, PAL.wood1); rect(ctx, bx + 32, 140, 2, 18, PAL.wood1);
    line(ctx, bx + 2, 141, bx + 22, 158, PAL.wood3);
    line(ctx, bx + 32, 141, bx + 52, 158, PAL.wood3);
    line(ctx, bx + 3, 140, bx + 33, 140, '#8b7a55');
    px(ctx, bx + 2, 139, PAL.snow3); px(ctx, bx + 32, 139, PAL.snow3);
  }
  // deadfall blocking the bank path
  {
    const dx = 690;
    line(ctx, dx - 6, 120, dx + 60, 157, '#1c140e');
    line(ctx, dx - 6, 121, dx + 60, 158, '#2a1f17');
    line(ctx, dx - 5, 122, dx + 60, 159, '#1c140e');
    line(ctx, dx - 6, 119, dx + 58, 155, PAL.snow3);
    line(ctx, dx + 10, 156, dx + 70, 120, '#1c140e');
    line(ctx, dx + 10, 157, dx + 70, 121, '#2a1f17');
    line(ctx, dx + 11, 155, dx + 69, 120, PAL.snow2);
    for (let i = 0; i < 16; i++) { const x = dx + Math.floor(rng() * 64); const y = 124 + Math.floor(rng() * 30); line(ctx, x, y, x + (rng() > 0.5 ? 6 : -6), y - 5, '#1c140e'); }
    rect(ctx, dx + 30, 112, 5, 46, '#140e0a');
  }
  // reeds at the creek's edge (front)
  const [f, fx] = canvas(lw(sw, 1.25), H);
  const fr = mulberry32(98);
  for (let x = 0; x < f.width; x += 3 + Math.floor(fr() * 9)) {
    const h = 6 + Math.floor(fr() * 12);
    line(fx, x, 180, x + (fr() > 0.5 ? 2 : -1), 180 - h, '#0a0d14');
  }
  return { back, main: { canvas: m, glow: g }, front: [{ canvas: f, factor: 1.25, z: 20 }] };
}

// ---------- THE OLD SAWMILL ----------
export const SAWMILL_GROUND = [[0, 150], [486, 150], [500, 155], [560, 158]];
export const RIDGE_FACTOR = 0.22;
function paintSawmill(sw) {
  const ridge = mountainLayer(sw, RIDGE_FACTOR, 110, 40, 101, '#0e131e', '#3a4559', '#1a2232', -85);
  sceneMeta.SAWMILL = { ridgeHeights: ridge.heights };
  const back = [
    sky(['#05070d', PAL.navy, PAL.purple, '#111624'], 16),
    mountainLayer(sw, 0.06, 96, 30, 100, '#161c29', '#4a566c', null, -90),
    ridge,
    pineLayer(sw, 0.45, 146, 10, 26, 7, 102, '#0a0e16', '#252e3e', -70, '#0a0e16'),
  ];
  const gAt = groundFn(SAWMILL_GROUND);
  const [m, ctx] = canvas(sw, H);
  const [g] = canvas(sw, H);
  // creek on the right
  rect(ctx, 486, 156, sw - 486, 24, '#08101c');
  const rng = mulberry32(103);
  for (let i = 0; i < 18; i++) { const x = 490 + Math.floor(rng() * 66); const y = 160 + Math.floor(rng() * 18); rect(ctx, x, y, 4 + Math.floor(rng() * 10), 1, '#2f3b4e'); }
  for (let x = 486; x < sw; x += 9) rect(ctx, x, 158, 6, 2, '#4a566b');
  // shed floor: packed earth + sawdust, sheltered from snow
  snowGround(ctx, sw, gAt, H, 104);
  rect(ctx, 134, 150, 196, 4, '#3a2c20');
  for (let x = 134; x < 330; x++) { if (rng() > 0.6) px(ctx, x, 150, '#5a4632'); if (rng() > 0.7) px(ctx, x, 151 + Math.floor(rng() * 3), '#4e3c2b'); }
  hline(ctx, 134, 329, 154, PAL.snow1);
  // shed frame
  for (const p of [134, 200, 266, 326]) { rect(ctx, p, 92, 4, 58, '#21180f'); vline(ctx, p, 92, 149, '#2e2216'); }
  // back wall: broken planks
  for (let x = 138; x < 326; x += 5) {
    if (rng() > 0.78) continue;
    const h = 20 + Math.floor(rng() * 26);
    rect(ctx, x, 94, 4, h, '#1a130d'); vline(ctx, x, 94, 94 + h, '#241a12');
  }
  // roof (slanted, snow-laden)
  for (let x = 124; x < 338; x++) {
    const y = Math.round(82 + ((x - 124) / 214) * 10);
    rect(ctx, x, y, 1, 7, '#1a130d');
    px(ctx, x, y, PAL.snow4); px(ctx, x, y - 1, PAL.snow3); if (rng() > 0.4) px(ctx, x, y - 2, PAL.snow2);
    if ((x % 9) === 0) { vline(ctx, x, y + 7, y + 7 + Math.floor(rng() * 4), '#a3afc2'); }
  }
  // saw carriage + log + blade
  rect(ctx, 146, 140, 100, 3, '#2e2216'); rect(ctx, 150, 143, 2, 7, '#21180f'); rect(ctx, 238, 143, 2, 7, '#21180f');
  rect(ctx, 152, 132, 70, 8, '#4a3626'); hline(ctx, 152, 221, 132, '#5e4632'); rect(ctx, 150, 133, 3, 6, '#6b5440');
  for (let i = 0; i < 6; i++) px(ctx, 151, 134 + i, i % 2 ? '#7a6248' : '#5a4632');
  const bxC = 232, byC = 136, br = 9;
  for (let a = 0; a < 48; a++) { const t = (a / 48) * Math.PI * 2; px(ctx, bxC + Math.round(Math.cos(t) * br), byC + Math.round(Math.sin(t) * br), a % 3 ? PAL.rust : '#7a4a30'); }
  rect(ctx, bxC - 1, byC - 1, 3, 3, PAL.iron2);
  // fire pit / ash in the shed (ledger is a prop)
  rect(ctx, 248, 147, 18, 3, '#1c1814'); for (let i = 0; i < 14; i++) px(ctx, 249 + Math.floor(rng() * 16), 146 + Math.floor(rng() * 2), rng() > 0.5 ? '#3a3632' : '#5a5650');
  // tools on the wall
  line(ctx, 206, 100, 210, 128, '#3a3028'); rect(ctx, 204, 98, 6, 3, PAL.iron2);
  line(ctx, 214, 102, 214, 126, '#3a3028'); rect(ctx, 212, 124, 5, 4, PAL.iron);
  // boot impressions: sheltered under the roof edge, in the sawdust
  for (const [x, y] of [[279, 151], [288, 152], [297, 151], [305, 152]]) {
    rect(ctx, x, y, 4, 1, '#20170f'); px(ctx, x + 4, y, '#20170f'); rect(ctx, x, y + 1, 1, 1, '#20170f');
    px(ctx, x - 1, y, '#20170f');
  }
  // waterwheel frame
  rect(ctx, 350, 60, 5, 90, '#21180f'); vline(ctx, 350, 60, 149, '#2e2216');
  rect(ctx, 482, 60, 5, 96, '#21180f');
  rect(ctx, 344, 60, 146, 5, '#2a1f15'); hline(ctx, 344, 489, 59, PAL.snow3); hline(ctx, 344, 489, 60, PAL.snow2);
  line(ctx, 355, 70, 370, 62, '#21180f');
  // rope burn on the beam
  for (let i = 0; i < 4; i++) px(ctx, 390 + i, 64, '#b39a72');
  px(ctx, 391, 65, '#b39a72');
  // rope from beam over to the cleat on the post
  line(ctx, 391, 65, 356, 118, '#8b7a55');
  rect(ctx, 354, 116, 4, 3, PAL.iron2);
  // carved marks on the post (pale fresh cuts)
  const marks = ['1111', '111', '1-1', '11111', '11'];
  let my = 124;
  for (const mk of marks) {
    let mx = 351;
    for (const ch of mk) {
      if (ch === '1') vline(ctx, mx, my, my + 3, '#c9b68e');
      mx += ch === '-' ? 1 : 1;
      if (ch === '-') hline(ctx, mx - 2, mx, my + 1, '#c9b68e');
    }
    if (mk.length >= 5) line(ctx, 350, my + 3, 354, my, '#c9b68e');
    my += 5;
  }
  // waterwheel (stopped, iced)
  const cx = 448, cy = 118, r = 28;
  for (let a = 0; a < 180; a++) {
    const t = (a / 180) * Math.PI * 2;
    px(ctx, cx + Math.round(Math.cos(t) * r), cy + Math.round(Math.sin(t) * r), '#2e2216');
    px(ctx, cx + Math.round(Math.cos(t) * (r - 1)), cy + Math.round(Math.sin(t) * (r - 1)), '#3a2a1c');
    px(ctx, cx + Math.round(Math.cos(t) * (r - 7)), cy + Math.round(Math.sin(t) * (r - 7)), '#2e2216');
  }
  for (let a = 0; a < 12; a++) {
    const t = (a / 12) * Math.PI * 2 + 0.1;
    line(ctx, cx, cy, cx + Math.cos(t) * (r - 1), cy + Math.sin(t) * (r - 1), '#2a1f15');
    const bx = cx + Math.round(Math.cos(t) * (r - 3)), by = cy + Math.round(Math.sin(t) * (r - 3));
    rect(ctx, bx - 2, by - 2, 4, 4, '#241a12');
    if (Math.sin(t) > 0.2) vline(ctx, bx, by + 2, by + 4 + (a % 3), '#a3afc2');
  }
  rect(ctx, cx - 3, cy - 3, 6, 6, PAL.iron); rect(ctx, cx - 1, cy - 1, 2, 2, PAL.iron2);
  for (let a = 0; a < 90; a++) { const t = Math.PI + (a / 90) * Math.PI; if (rng() > 0.6) px(ctx, cx + Math.round(Math.cos(t) * r), cy + Math.round(Math.sin(t) * r) - 1, PAL.snow3); }
  // drag furrow up from the creek bank toward the wheel
  for (let x = 404; x < 500; x++) {
    const gy = Math.round(gAt(x));
    if ((x * 13) % 7 > 1) px(ctx, x, gy + 1, '#7d8aa0');
    if ((x * 7) % 5 > 1) px(ctx, x, gy + 2, '#5d6a80');
    if (rng() > 0.8) px(ctx, x, gy, '#a3afc2');
  }
  // beneath the body: undisturbed white; only a faint stain
  rect(ctx, 384, 150, 14, 1, PAL.snow4);
  px(ctx, 390, 151, '#6b3a3a'); px(ctx, 392, 151, '#5a3030');
  // front: icicles hanging off a near beam + reeds
  const [f, fx] = canvas(lw(sw, 1.2), H);
  const fr = mulberry32(105);
  for (let x = 0; x < f.width; x += 4 + Math.floor(fr() * 12)) {
    const h = 5 + Math.floor(fr() * 10);
    line(fx, x, 180, x + 1, 180 - h, '#090c13');
  }
  // native-density Pixelorama playfield replaces the procedural one (same clue positions)
  const NA = nativeArt('SAWMILL');
  if (NA) return { back, main: { canvas: NA.main, glow: null, native: true }, front: [{ canvas: f, factor: 1.2, z: 20 }] };
  return { back, main: { canvas: m, glow: g }, front: [{ canvas: f, factor: 1.2, z: 20 }] };
}

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
  STATION: paintStation, ROAD: paintRoad, VILLAGE: paintVillage, PARLOR: paintParlor,
  ROOM4: paintRoom4, CREEK: paintCreek, SAWMILL: paintSawmill, TITLE: paintTitle,
};
