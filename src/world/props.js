// Dynamic scene props: things that animate, react to story state, or must layer around characters.
// A prop factory returns { z, update(dt, game), draw(ctx, camX, game), glow?(ctx, camX, game), lights?(game) }.
// draw/glow run in the world render pass: coordinates are WORLD units and camX is the camera's whole
// world-unit position (the sub-unit remainder is already applied by the pass transform).
import { drawSprite } from '../engine/assets.js';
import { mulberry32 } from '../engine/rng.js';
import { PAL, canvas, rect, px, hline, vline, line, signText } from './paint.js';
import { sceneMeta, RIDGE_FACTOR } from './painters.js';
import { stationArt } from './stationArt.js';
import { parallaxArt } from './nativeArt.js';

// ---------------- Train (Blackwood Station) ----------------
const TRAIN_STOP = -10;
export const COACH_DOOR_OFFSET = 208;
let trainBody = null;
function buildTrain() {
  const A = stationArt();
  if (A) return A.train; // painted sprite (wheels are drawn by the prop so they can turn)
  const [c, ctx] = canvas(220, 52);
  const Y = (y) => y - 100; // author in world y (rail at 146) -> local
  // cowcatcher
  for (let i = 0; i < 9; i++) vline(ctx, i, Y(146 - i), Y(146), '#2a2d36');
  for (let i = 0; i < 9; i += 2) line(ctx, i, Y(146), 8, Y(138), '#3a3f4a');
  // frame / running board
  rect(ctx, 6, Y(134), 66, 4, '#1a1c22'); hline(ctx, 6, 71, Y(134), '#3a3f4a');
  // boiler
  rect(ctx, 10, Y(119), 42, 15, '#22252d');
  hline(ctx, 10, 51, Y(119), '#4a505c'); hline(ctx, 10, 51, Y(120), '#3a3f4a');
  for (const b of [18, 30, 42]) vline(ctx, b, Y(119), Y(133), '#8a6a2a');
  // smokebox
  rect(ctx, 8, Y(118), 8, 16, '#16181d');
  // diamond stack
  rect(ctx, 13, Y(110), 5, 9, '#16181d');
  for (let i = 0; i < 6; i++) hline(ctx, 15 - i, 15 + i, Y(104 + i), '#16181d');
  for (let i = 0; i < 3; i++) hline(ctx, 10 + i, 20 - i, Y(110 + i), '#16181d');
  hline(ctx, 10, 20, Y(104), '#3a3f4a');
  // dome + bell
  rect(ctx, 28, Y(114), 7, 5, '#8a6a2a'); hline(ctx, 29, 33, Y(113), '#b08a3a');
  rect(ctx, 40, Y(116), 4, 3, '#b08a3a');
  // headlamp box
  rect(ctx, 6, Y(112), 8, 7, '#2a2d36'); rect(ctx, 6, Y(113), 2, 5, '#c9a64a');
  // cab
  rect(ctx, 52, Y(110), 20, 24, '#2a1c16'); rect(ctx, 50, Y(108), 24, 3, '#16181d');
  rect(ctx, 56, Y(114), 10, 8, '#3a2410');
  // tender
  rect(ctx, 74, Y(120), 28, 16, '#1d1f25'); hline(ctx, 74, 101, Y(120), '#3a3f4a');
  for (let i = 0; i < 6; i++) px(ctx, 77 + i * 4, Y(119), '#2a2a2a');
  rect(ctx, 76, Y(119), 24, 1, PAL.snow3);
  // coach
  rect(ctx, 106, Y(109), 110, 28, '#3a221c');
  for (let y = 109; y < 137; y += 3) hline(ctx, 106, 215, Y(y), '#33201a');
  rect(ctx, 104, Y(106), 114, 4, '#1c1412'); hline(ctx, 104, 217, Y(105), PAL.snow3); hline(ctx, 106, 215, Y(104), PAL.snow2);
  hline(ctx, 106, 215, Y(126), '#8a6a2a');
  for (let i = 0; i < 8; i++) rect(ctx, 112 + i * 11, Y(113), 7, 8, '#2a1a10');
  rect(ctx, 202, Y(112), 10, 22, '#1c1412'); rect(ctx, 204, Y(114), 6, 8, '#2a1a10');
  rect(ctx, 200, Y(134), 14, 2, '#3a3f4a'); rect(ctx, 202, Y(137), 10, 2, '#3a3f4a');
  rect(ctx, 106, Y(137), 110, 3, '#16181d');
  return c;
}

export function trainProp() {
  let x = 600, v = 0, state = 'idle', t = 0, wheel = 0;
  const steam = [];
  const rng = mulberry32(5);
  const prop = {
    z: -5,
    get x() { return x; },
    get state() { return state; },
    arrive() { x = 640; v = -150; state = 'arriving'; },
    depart() { state = 'departing'; v = 0; },
    placeStopped() { x = TRAIN_STOP; v = 0; state = 'stopped'; },
    hide() { state = 'gone'; },
    done() { return state === 'stopped' || state === 'gone'; },
    update(dt, game) {
      t += dt;
      if (!trainBody) trainBody = buildTrain();
      if (state === 'arriving') {
        // constant braking: v = sqrt(2·a·d), capped at cruising speed
        const dist = x - TRAIN_STOP;
        v = -Math.max(4, Math.min(150, Math.sqrt(2 * 46 * Math.max(0, dist))));
        x += v * dt;
        if (x - TRAIN_STOP < 0.5) { x = TRAIN_STOP; v = 0; state = 'stopped'; game.audio.sfx('steamHiss'); }
      } else if (state === 'departing') {
        v -= 22 * dt; v = Math.max(v, -160);
        x += v * dt;
        if (x < -260) state = 'gone';
      }
      wheel += -v * dt;
      if (state !== 'gone' && state !== 'idle') {
        const moving = Math.abs(v) > 1;
        const chuffRate = moving ? Math.max(0.12, 1.4 - Math.abs(v) / 100) : 0.9;
        prop._chuff = (prop._chuff || 0) + dt;
        if (prop._chuff > chuffRate) {
          prop._chuff = 0;
          for (let i = 0; i < 3; i++) steam.push({ x: x + 15 + rng() * 3, y: 100, vx: 8 + rng() * 10, vy: -14 - rng() * 8, life: 0, max: 1.6 + rng(), r: 2 });
          if (moving && game.audio) game.audio.sfx('chuff', { vol: 0.5 });
        }
        if (!moving && rng() < dt * 1.2) steam.push({ x: x + 20 + rng() * 30, y: 140, vx: 6 + rng() * 6, vy: -4, life: 0, max: 1.2, r: 1 });
      }
      for (const s of steam) { s.life += dt; s.x += (s.vx + (game.weather ? game.weather.wind * 10 : 0)) * dt; s.y += s.vy * dt; s.vy *= 0.985; }
      for (let i = steam.length - 1; i >= 0; i--) if (steam[i].life > steam[i].max) steam.splice(i, 1);
    },
    draw(ctx, camX) {
      if (state === 'idle' || state === 'gone' || !trainBody) { drawSteam(ctx, camX); return; }
      const bx = Math.round(x - camX);
      const N = parallaxArt('station', 'train');
      if (N) {
        // native-density train (assets/export/environments/parallax/station_train.png): body at
        // 1/1.5, then wheels and rods in native px so they turn without world-unit stair steps
        ctx.drawImage(N, bx, 100, N.width / 1.5, N.height / 1.5);
        ctx.save();
        ctx.translate(bx, 100);
        ctx.scale(2 / 3, 2 / 3);
        drawNativeRunningGear(ctx, wheel * 1.5);
        ctx.restore();
        drawSteam(ctx, camX);
        return;
      }
      ctx.drawImage(trainBody, bx, 100);
      // wheels + side rod
      const phase = wheel / 7;
      const rx = Math.round(Math.cos(phase) * 4), ry = Math.round(Math.sin(phase) * 4);
      if (stationArt()) {
        // painted train: three drivers, a lead truck and six carriage/tender trucks
        for (const wx of [22, 36, 50]) wheelAt(ctx, bx + wx, 139, 7, phase);
        wheelAt(ctx, bx + 14, 142, 4, phase * 1.8);
        for (const wx of [85, 96, 118, 128, 192, 203]) wheelAt(ctx, bx + wx, 142, 4, phase * 1.8);
        line(ctx, bx + 22 + rx, 139 + ry, bx + 50 + rx, 139 + ry, '#8a8f99');
        line(ctx, bx + 22 + rx, 139 + ry, bx + 14, 133, '#5a5f69');
      } else {
        const drv = [32, 48];
        for (const wx of drv) wheelAt(ctx, bx + wx, 139, 7, phase);
        wheelAt(ctx, bx + 18, 143, 3, phase * 2.3);
        for (const wx of [80, 94, 116, 130, 190, 204]) wheelAt(ctx, bx + wx, 143, 3, phase * 2.3);
        line(ctx, bx + 32 + rx, 139 + ry, bx + 48 + rx, 139 + ry, '#8a8f99');
        line(ctx, bx + 32 + rx, 139 + ry, bx + 22, 133, '#5a5f69');
      }
      drawSteam(ctx, camX);
    },
    glow(ctx, camX) {
      if (state === 'idle' || state === 'gone') return;
      const bx = Math.round(x - camX);
      const NG = parallaxArt('station', 'train') && parallaxArt('station', 'train_glow');
      if (NG) { ctx.drawImage(NG, bx, 100, NG.width / 1.5, NG.height / 1.5); return; }
      const A = stationArt();
      if (A) { ctx.drawImage(A.train_glow, bx, 100); return; }
      for (let i = 0; i < 8; i++) { rect(ctx, bx + 112 + i * 11, 113, 7, 8, 'rgba(245,158,11,0.75)'); rect(ctx, bx + 112 + i * 11, 118, 7, 3, PAL.amber); }
      rect(ctx, bx + 56, 114, 10, 8, 'rgba(217,119,6,0.7)');
      rect(ctx, bx + 6, 113, 2, 5, PAL.amberHi);
    },
    lights() {
      if (state === 'idle' || state === 'gone') return [];
      const bx = x;
      return [
        { x: bx + 4, y: 115, r: 40, warm: 0.35 },
        { x: bx + 160, y: 118, r: 70, warm: 0.18 },
      ];
    },
  };
  function drawSteam(ctx, camX) {
    // soft pixel puffs: a rounded blob that thins out as it rises
    for (const s of steam) {
      const a = 1 - s.life / s.max;
      const r = Math.round(s.r + s.life * 3);
      const cx = Math.round(s.x - camX), cy = Math.round(s.y);
      ctx.globalAlpha = a * 0.4;
      rect(ctx, cx - r, cy - r + 1, r * 2, Math.max(1, r * 2 - 2), '#b8c2d0');
      rect(ctx, cx - r + 1, cy - r, Math.max(1, r * 2 - 2), r * 2, '#b8c2d0');
      ctx.globalAlpha = a * 0.25;
      rect(ctx, cx - Math.ceil(r / 2), cy - Math.ceil(r / 2), r, r, '#e2e8f0');
      ctx.globalAlpha = 1;
    }
  }
  return prop;
}

// Native-px running gear for the native train sprite (local native coords; rail at y 69).
// dist is how far the train has rolled, in native px.
function nline(ctx, x0, y0, x1, y1, col) {
  ctx.fillStyle = col;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
}
function nativeWheel(ctx, cx, cy, r, ang, counterweight) {
  // tire and rim: lit along the top, the flange dark underneath
  for (let a = 0; a < 72; a++) {
    const t = (a / 72) * Math.PI * 2;
    const s = Math.sin(t);
    ctx.fillStyle = s < -0.55 ? '#6a707d' : s > 0.6 ? '#16181d' : '#3f4450';
    ctx.fillRect(Math.round(cx + Math.cos(t) * r), Math.round(cy + s * r), 1, 1);
    ctx.fillStyle = '#22252d';
    ctx.fillRect(Math.round(cx + Math.cos(t) * (r - 1)), Math.round(cy + s * (r - 1)), 1, 1);
  }
  if (counterweight) {
    for (let a = -9; a <= 9; a++) {
      const t = ang + Math.PI + a * 0.09;
      for (let d = r - 5; d <= r - 2; d++) {
        ctx.fillStyle = '#16181d';
        ctx.fillRect(Math.round(cx + Math.cos(t) * d), Math.round(cy + Math.sin(t) * d), 1, 1);
      }
    }
  }
  const spokes = r > 8 ? 10 : 6;
  for (let k = 0; k < spokes; k++) {
    const t = ang + (k / spokes) * Math.PI * 2;
    nline(ctx, cx + Math.cos(t) * 2, cy + Math.sin(t) * 2, cx + Math.cos(t) * (r - 2), cy + Math.sin(t) * (r - 2), '#2e323c');
  }
  ctx.fillStyle = '#5a606d'; ctx.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 3, 3);
  ctx.fillStyle = '#8a8f99'; ctx.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 1, 1);
}
function drawNativeRunningGear(ctx, dist) {
  const ang = dist / 10; // driver radius 10 native px: rolls without slipping
  for (const wx of [33, 54, 75]) nativeWheel(ctx, wx, 58, 10, ang, true);
  for (const wx of [21, 127, 144, 177, 192, 288, 304]) nativeWheel(ctx, wx, 63, 6, dist / 6, false);
  // side rod coupling the drivers, main rod back to the crosshead behind the cylinder
  const rx = Math.cos(ang) * 6, ry = Math.sin(ang) * 6;
  nline(ctx, 33 + rx, 58 + ry, 75 + rx, 58 + ry, '#8a8f99');
  nline(ctx, 33 + rx, 59 + ry, 75 + rx, 59 + ry, '#4a505c');
  const chx = 40 + rx * 0.5;
  nline(ctx, chx, 48, 54 + rx, 58 + ry, '#5a5f69');
  ctx.fillStyle = '#6a707d'; ctx.fillRect(Math.round(chx) - 1, 47, 3, 3);
  for (const wx of [33, 54, 75]) { ctx.fillStyle = '#b08a3a'; ctx.fillRect(Math.round(wx + rx), Math.round(58 + ry), 1, 1); }
}

function wheelAt(ctx, cx, cy, r, phase) {
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2;
    px(ctx, cx + Math.round(Math.cos(t) * r), cy + Math.round(Math.sin(t) * r), '#3a3f4a');
  }
  for (let k = 0; k < 2; k++) {
    const t = phase + k * Math.PI / 2;
    line(ctx, cx - Math.cos(t) * (r - 1), cy - Math.sin(t) * (r - 1), cx + Math.cos(t) * (r - 1), cy + Math.sin(t) * (r - 1), '#2a2d36');
  }
}

// ---------------- Parlor fire ----------------
// A burning hearth: a glowing ember bed under the logs, flames that lean and gutter, sparks, and a flickering
// light that reaches the furniture around it. Every so often a draught from the front door flattens the flames
// for a moment and the room darkens with them (the "slightly unsettling" half of a cosy fire). `embersOnly` is
// the dead fire of the small hours.
export function fireProp(x, y, { embersOnly = false } = {}) {
  let t = 0;
  const rng = mulberry32(9);
  const sparks = [];
  let gutter = 0; // 0..1: how far a draught has flattened the flames
  let nextDraught = 14;
  return {
    z: 1,
    update(dt, game) {
      t += dt;
      // crackle ambience, falling off with the player's distance from the hearth
      if (game && game.audio && game.player) {
        const d = Math.abs(game.player.x - x);
        game.audio.fire(0.12 + 0.88 / (1 + (d / 110) ** 2), { embers: embersOnly });
      }
      if (embersOnly) return;
      nextDraught -= dt;
      if (nextDraught <= 0) { gutter = 1; nextDraught = 16 + rng() * 22; }
      gutter = Math.max(0, gutter - dt * 0.9);
      if (rng() < dt * 2.2) sparks.push({ x: (rng() - 0.5) * 8, y: 0, vy: 6 + rng() * 6, life: 0.6 + rng() * 0.8 });
      for (const s of sparks) { s.y += s.vy * dt; s.x += Math.sin((t + s.life) * 7) * dt * 3; s.life -= dt; }
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
    },
    draw(ctx, camX) {
      const bx = Math.round(x - camX);
      // fire dogs and the two logs
      rect(ctx, bx - 8, y - 4, 16, 3, PAL.wood1);
      line(ctx, bx - 9, y - 2, bx + 6, y - 5, PAL.wood2);
      line(ctx, bx - 5, y - 5, bx + 9, y - 2, PAL.wood0);
      vline(ctx, bx - 9, y - 3, y - 1, PAL.iron2); vline(ctx, bx + 9, y - 3, y - 1, PAL.iron2);
    },
    glow(ctx, camX) {
      const bx = Math.round(x - camX);
      const f = Math.floor(t * 9);
      // the ember bed: always there, breathing slowly
      for (let i = 0; i < 9; i++) {
        const on = (f + i * 3) % (embersOnly ? 5 : 7) !== 0;
        if (on) px(ctx, bx - 8 + i * 2, y - 2 - (i % 2), i % 3 === 0 ? PAL.amber : i % 2 ? PAL.ember : '#7c2d12');
      }
      if (embersOnly) return;
      const r2 = mulberry32(f);
      const lean = Math.round(Math.sin(t * 1.7) * 1.2); // the draw of the chimney
      const scale = 1 - gutter * 0.6;
      for (let i = -7; i <= 7; i++) {
        const h = Math.max(1, Math.round((10 - Math.abs(i) * 1.1 + r2() * 5) * scale));
        for (let k = 0; k < h; k++) {
          const tt = k / h;
          const col = tt < 0.3 ? PAL.amberHi : tt < 0.65 ? PAL.amber : PAL.kerosene;
          if (tt > 0.75 && r2() > 0.5) continue;
          px(ctx, bx + i + (k > h / 2 ? lean : 0), y - 4 - k, col);
        }
      }
      for (const s of sparks) px(ctx, bx + Math.round(s.x), Math.round(y - 12 - s.y), s.life > 0.4 ? PAL.amberHi : PAL.ember);
    },
    lights() {
      if (embersOnly) return [{ x, y: y - 6, r: 34, warm: 0.12, world: true }];
      const flick = Math.round(Math.sin(t * 13) * 2 + Math.sin(t * 7.3) * 2 + Math.sin(t * 2.1) * 3);
      const k = 1 - gutter * 0.35;
      return [
        { x, y: y - 8, r: Math.round((92 + flick) * k), warm: 0.28 * k, world: true },
        { x: x + 2, y: y - 2, r: 30 + flick, warm: 0.18 * k, world: true }, // the hearthstones and the floor in front
      ];
    },
  };
}

// ---------------- Black Ram windows ----------------
// The hotel's windows (and its neighbour's) answer the hour instead of being baked into one lit tile layer.
// Each window is the 2×2-tile window of black_ram_exterior.png at tile (tx, ty) and has a `room`:
//   parlor  — lit while the parlor is (fire + lamps in the evening, Gable's candle at night, the fire by day)
//   room4   — Silas's room: lamp lit in the evening and at night, out by day
//   guest   — empty guest rooms: lamps put out one by one through the evening, dark at night
//   keeper  — Mrs. Gable's own room: lit late in the evening
//   house   — the neighbouring house: lit in the early evening only
// By day every pane reflects the grey snow-light (darkening toward dusk), and the parlor panes show the fire
// low behind the glass. Coordinates are native px (the tile grid); 1 native px = 2/3 world unit.
const N = 1 / 1.5;
const LIT = [ // the emissive window pattern (the old winlit tiles): pane rows top→bottom, curtain pair
  [5, 7, '#fcd36b'], [8, 10, '#e6b66c'], [11, 12, '#e0a04a'], [13, 13, '#d68a3f'],
  [16, 18, '#fcd36b'], [19, 21, '#e6b66c'], [22, 23, '#e0a04a'], [24, 24, '#d68a3f'],
];
const LOW = [[5, 7, '#e0a04a'], [8, 10, '#d68a3f'], [11, 13, '#b56e22'], [16, 18, '#d68a3f'], [19, 21, '#b56e22'], [22, 24, '#a65c2c']];
const CANDLE = [[20, 22, '#b56e22'], [23, 24, '#a65c2c']];
const PANES_X = [5, 17];
const PANES_Y = [5, 16];
export function windowState(room, s, t) {
  const min = s.time.h * 60 + s.time.m;
  const night = s.phase === 'NIGHT', day = s.phase === 'DAY';
  if (day) {
    const dusk = min >= 16 * 60;
    if (room === 'parlor') return dusk ? 'low' : 'dayFire';
    return dusk ? 'dusk' : 'day';
  }
  if (night) {
    if (room === 'room4') return 'low';
    if (room === 'parlor') return 'candle';
    // one of the empty rooms upstairs, now and then: somebody walking with a candle where nobody is staying
    if (room === 'guest2') return (t % 41) > 35 ? 'candle' : 'dark';
    return 'dark';
  }
  // evening: lamps go out as the night wears on
  if (room === 'parlor' || room === 'room4') return 'lit';
  if (room === 'keeper') return min >= 21 * 60 + 30 ? 'low' : 'lit';
  if (room === 'guest1') return min < 20 * 60 ? 'lit' : 'dark';
  if (room === 'guest2') return min < 21 * 60 ? 'lit' : 'dark';
  if (room === 'house') return min < 21 * 60 + 15 ? 'lit' : 'dark';
  return 'dark';
}
export function hotelWindowsProp(...wins) {
  let t = 0;
  const box = (ctx, camX, nx, ny, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(nx * N - camX, ny * N, w * N, h * N); };
  // daylight glass: grey sky in the upper panes, darker toward the sill, one bright diagonal glint per pane
  const glass = (ctx, camX, ox, oy, dusk) => {
    const rows = dusk ? ['#5d6a80', '#5d6a80', '#4d5d7f', '#4d5d7f', '#4d5d7f', '#39466a', '#39466a'] : ['#7d8aa0', '#7d8aa0', '#5d6a80', '#5d6a80', '#5d6a80', '#4d5d7f', '#4d5d7f'];
    const glint = dusk ? '#7d8aa0' : '#c8d1de';
    PANES_X.forEach((px0, side) => PANES_Y.forEach((py0) => {
      for (let r = 0; r < 7; r++) box(ctx, camX, ox + px0, oy + py0 + r, 10, 1, rows[r]);
      for (let r = 0; r < 2; r++) box(ctx, camX, ox + px0, oy + py0 + 7 + r, 10, 1, r ? '#334155' : '#475569');
      for (let r = 0; r < 7; r++) {
        const c0 = side ? 7 - r : 5 - r;
        for (const c of [c0, c0 + 1]) if (c >= 0 && c < 10 && !(r === 6 && c === c0 + 1)) box(ctx, camX, ox + px0 + c, oy + py0 + r, 1, 1, glint);
      }
    }));
  };
  const emit = (ctx, camX, ox, oy, rows, curtains) => {
    for (const [y0, y1, col] of rows) for (const px0 of PANES_X) box(ctx, camX, ox + px0, oy + y0, 10, y1 - y0 + 1, col);
    if (!curtains) return;
    for (const cx of [3, 27]) for (let y = 5; y <= 24; y++) {
      if (y === 14 || y === 15) continue;
      box(ctx, camX, ox + cx, oy + y, 2, 1, (y - 5) % 3 === 1 ? '#a65c2c' : '#b56e22');
    }
  };
  return {
    z: 0.5,
    update(dt) { t += dt; },
    draw(ctx, camX, game) {
      for (const w of wins) {
        const st = windowState(w.room, game.state, t);
        if (st === 'day' || st === 'dayFire' || st === 'dusk') glass(ctx, camX, w.tx * 16, w.ty * 16, st === 'dusk');
      }
    },
    glow(ctx, camX, game) {
      for (const w of wins) {
        const ox = w.tx * 16, oy = w.ty * 16;
        const st = windowState(w.room, game.state, t);
        if (st === 'lit') emit(ctx, camX, ox, oy, LIT, true);
        else if (st === 'low') emit(ctx, camX, ox, oy, LOW, true);
        else if (st === 'candle') {
          const flick = Math.floor(t * 6) % 5 === 0;
          emit(ctx, camX, ox, oy, flick ? CANDLE.slice(1) : CANDLE, false);
        } else if (st === 'dayFire') {
          // the parlor fire, low behind the glass: a few warm pixels along the bottom of the lower panes
          const f = Math.floor(t * 5);
          for (const px0 of PANES_X) for (let c = 0; c < 10; c++) {
            if ((f + c) % 5 === 0) continue;
            box(ctx, camX, ox + px0 + c, oy + 22, 1, 1, (f + c) % 3 ? '#b56e22' : '#a65c2c');
            if ((f * 3 + c) % 4 === 1) box(ctx, camX, ox + px0 + c, oy + 21, 1, 1, '#d68a3f');
          }
        }
      }
    },
    lights(game) {
      const out = [];
      for (const w of wins) {
        const st = windowState(w.room, game.state, t);
        if (st !== 'lit' && st !== 'low') continue;
        // a pool of window light on the snow below
        out.push({ x: (w.tx * 16 + 16) * N, y: (w.ty * 16 + 30) * N, r: st === 'lit' ? 22 : 15, warm: st === 'lit' ? 0.07 : 0.04, world: true });
      }
      return out;
    },
  };
}

// ---------------- Chimney smoke ----------------
// Smoke from a chimney top at (x, y) world units, carried off by the wind. `hearth` chimneys answer the parlor
// fire (thick by day and evening, a thin thread from the embers at night); others always draw a thin thread.
export function chimneySmokeProp(x, y, kind = 'stove') {
  let t = 0;
  const rng = mulberry32(Math.round(x * 7 + y));
  const puffs = [];
  let acc = 0;
  return {
    z: -0.5,
    puffs, // (read by the tests)
    update(dt, game) {
      t += dt;
      const s = game && game.state;
      const thick = kind === 'hearth' && s && s.phase !== 'NIGHT';
      const rate = thick ? 6 : 2.2;
      acc += dt * rate;
      while (acc >= 1) {
        acc -= 1;
        puffs.push({ x: (rng() - 0.5) * 1.5, y: 0, life: 0, max: thick ? 4.5 + rng() * 2 : 2.6 + rng(), big: thick && rng() > 0.5 });
      }
      const wind = (game && game.weather && game.weather.wind != null ? game.weather.wind : 0.6) * 9;
      for (const p of puffs) { p.life += dt; p.y -= dt * (5 + p.life * 0.8); p.x += dt * (wind * Math.min(1, p.life / 1.5) + Math.sin(t * 0.7 + p.max) * 0.6); }
      for (let i = puffs.length - 1; i >= 0; i--) if (puffs[i].life >= puffs[i].max) puffs.splice(i, 1);
    },
    draw(ctx, camX) {
      for (const p of puffs) {
        const k = p.life / p.max;
        ctx.globalAlpha = Math.max(0, 0.8 * (1 - k * k));
        const size = (p.big ? 3 : 2) + Math.floor(k * 3);
        ctx.fillStyle = k < 0.35 ? PAL.snow2 : k < 0.7 ? PAL.snow1 : PAL.snow0;
        ctx.fillRect(Math.round((x + p.x - camX) * 1.5) / 1.5, Math.round((y + p.y) * 1.5) / 1.5, size * N, size * N);
      }
      ctx.globalAlpha = 1;
    },
  };
}

// ---------------- Room 4 by day: a rag rug over the scrubbed boards ----------------
export function rugProp(x, y) {
  let c = null;
  return {
    z: 0.4,
    draw(ctx, camX) {
      if (!c) {
        // a braided rag rug seen from the side-on floor: banded rows of old cloth, wider toward the viewer
        const W = 40, H = 13;
        const [cc, g] = canvas(W, H);
        const bands = ['#565049', '#b5ab92', '#5b3423', '#475569', '#b5ab92', '#4a1010', '#565049', '#b5ab92', '#5b3423', '#475569', '#b5ab92', '#5b3423', '#3b2a1e'];
        for (let r = 0; r < H; r++) {
          const inset = Math.max(0, 3 - Math.floor(r / 2)); // the far edge looks narrower
          hline(g, inset, W - 1 - inset, r, bands[r]);
          for (let i = inset + (r % 2); i < W - inset; i += 4) px(g, i, r, r % 3 ? '#8d8574' : '#2a1c14'); // the braid
        }
        for (let i = 2; i < W - 2; i += 3) px(g, i, H - 1, '#b5ab92'); // fringe
        c = cc;
      }
      ctx.drawImage(c, Math.round(x - camX) - 20, y);
    },
  };
}

// ---------------- Parlor: patrons around the corner table ----------------
export function patronsProp() {
  let t = 0;
  return {
    z: 3,
    update(dt) { t += dt; },
    draw(ctx, camX, game) {
      const bx = Math.round(-camX);
      const looking = game.state.flags.parlorEntered && (game.time - (game.parlorEnterAt || 0)) < 9;
      const talk = Math.floor(t * 1.3) % 4 === 0;
      // three different men: A (miner), B (clerk), C (teamster, always watching the door)
      drawSprite(ctx, looking ? 'patron_look' : 'patron', 0, bx + 146, 141, 1);
      drawSprite(ctx, looking ? 'patron_b_look' : 'patron_b', 0, bx + 166, 140, looking ? -1 : (talk ? -1 : 1));
      drawSprite(ctx, 'patron_c_look', 0, bx + 184, 141, -1);
      // table in front of them
      rect(ctx, bx + 136, 136, 54, 3, PAL.wood4); hline(ctx, bx + 136, bx + 189, 136, PAL.wood5);
      rect(ctx, bx + 160, 139, 4, 11, PAL.wood1); rect(ctx, bx + 154, 148, 16, 2, PAL.wood1);
      rect(ctx, bx + 142, 132, 2, 4, '#7a8a90'); rect(ctx, bx + 170, 133, 3, 3, '#6b5a2a'); rect(ctx, bx + 180, 131, 2, 5, '#3a4a40');
      rect(ctx, bx + 132, 140, 2, 10, PAL.wood1); rect(ctx, bx + 192, 140, 2, 10, PAL.wood1);
    },
  };
}

// ---------------- Parlor desk front (overlays Mrs. Gable) ----------------
export function deskFrontProp() {
  let c = null;
  return {
    z: 5,
    draw(ctx, camX) {
      if (!c) {
        const [cc, x] = canvas(86, 14);
        rect(x, 0, 0, 86, 14, PAL.wood2);
        rect(x, 0, 0, 86, 2, PAL.wood4); hline(x, 0, 85, 0, PAL.wood5);
        rect(x, 0, 2, 86, 1, PAL.wood1);
        for (let i = 0; i < 4; i++) {
          const px0 = 3 + i * 20;
          rect(x, px0, 4, 18, 8, PAL.wood1);
          rect(x, px0 + 1, 5, 16, 6, PAL.wood3);
          rect(x, px0 + 2, 6, 14, 4, PAL.wood2);
          hline(x, px0 + 2, px0 + 15, 6, PAL.wood4);
        }
        rect(x, 0, 12, 86, 2, PAL.wood1);
        c = cc;
      }
      const bx = Math.round(234 - camX);
      ctx.drawImage(c, bx, 137);
      // open register and the desk bell
      rect(ctx, bx + 61, 134, 16, 3, '#d8d0bc'); vline(ctx, bx + 69, 134, 136, '#8a8270');
      for (let i = 0; i < 2; i++) { hline(ctx, bx + 63, bx + 67, 135 + i, '#9a927e'); hline(ctx, bx + 71, bx + 75, 135 + i, '#9a927e'); }
      rect(ctx, bx + 44, 135, 5, 2, '#b08a3a'); px(ctx, bx + 46, 134, '#d4b060');
    },
  };
}

// ---------------- Village: the watcher at the window ----------------
export function watcherProp(wx = 60, wy = 114) {
  // (wx, wy): top-left of the 14×14 lit pane in world units. The Tiled map passes it (prop args) so it follows the cabin window.
  let closedAt = null;
  return {
    z: 1,
    update(dt, game) {
      if (game.state.flags.curtainDrawn && closedAt === null) closedAt = game.time;
    },
    draw(ctx, camX, game) {
      const bx = Math.round(wx - camX);
      if (game.state.phase === 'NIGHT') return;
      if (!game.state.flags.curtainDrawn) {
        // silhouette of a head and shoulders against the lamp
        rect(ctx, bx + 4, wy + 5, 5, 5, '#140f0c'); rect(ctx, bx + 3, wy + 10, 7, 4, '#140f0c');
      }
    },
    glow(ctx, camX, game) {
      if (game.state.phase === 'NIGHT') return;
      const bx = Math.round(wx - camX);
      const closed = game.state.flags.curtainDrawn;
      const k = closed ? Math.min(1, (game.time - closedAt) / 0.8) : 0;
      if (closed && k >= 1) return;
      ctx.globalAlpha = 1 - k;
      rect(ctx, bx, wy, 14, 14, 'rgba(217,119,6,0.55)');
      rect(ctx, bx, wy + 9, 14, 5, PAL.amber);
      if (!closed) { rect(ctx, bx + 4, wy + 5, 5, 5, '#140f0c'); rect(ctx, bx + 3, wy + 10, 7, 4, '#140f0c'); }
      vline(ctx, bx + 7, wy, wy + 13, 'rgba(0,0,0,0.6)'); hline(ctx, bx, bx + 13, wy + 6, 'rgba(0,0,0,0.6)');
      ctx.globalAlpha = 1;
    },
    lights(game) {
      if (game.state.phase === 'NIGHT' || (game.state.flags.curtainDrawn && game.time - closedAt > 0.8)) return [];
      return [{ x: wx + 7, y: wy + 7, r: 26, warm: 0.15 }];
    },
  };
}

// ---------------- Snow seen through a window (interiors) ----------------
export function windowSnowProp(x, y, w, h) {
  const flakes = [];
  const rng = mulberry32(x * 31 + y);
  for (let i = 0; i < Math.floor((w * h) / 30); i++) flakes.push({ x: rng() * w, y: rng() * h, s: 8 + rng() * 14 });
  return {
    z: 0.5,
    update(dt) { for (const f of flakes) { f.x += f.s * 1.4 * dt; f.y += f.s * dt; if (f.x > w) f.x -= w; if (f.y > h) f.y -= h; } },
    draw(ctx, camX) {
      for (const f of flakes) {
        const fx = Math.round(x + f.x - camX), fy = Math.round(y + f.y);
        px(ctx, fx, fy, '#8e9bb0');
      }
    },
  };
}

// ---------------- Room 4: lamp on the washstand (light only) ----------------
export function lampLight(x, y, r, warm, opts = {}) {
  let t = 0;
  return {
    z: 0,
    update(dt) { t += dt; },
    lights() {
      const flick = opts.steady ? 0 : Math.round(Math.sin(t * 5.1) + Math.sin(t * 11.7) * 0.6);
      return [{ x, y, r: r + flick, warm, world: true }];
    },
  };
}

// ---------------- Sawmill: Sheriff Hale's body ----------------
export function bodyProp() {
  let t = 0;
  return {
    z: 3,
    update(dt) { t += dt; },
    draw(ctx, camX, game) {
      const sway = Math.round(Math.sin(t * 0.7 + (game.weather ? game.weather.wind : 0)) * 0.6);
      const bx = Math.round(391 - camX);
      vline(ctx, bx, 65, 96, '#8b7a55');
      vline(ctx, bx + 1, 66, 96, '#5f5338');
      drawSprite(ctx, 'hale_body', 0, bx + 1 + sway, 123, 1);
    },
  };
}

// ---------------- Sawmill: small evidence objects that can be picked up ----------------
// Native-density pick-up sprites (assets/export/items/world/*.png, Pixelorama sources in
// assets/source/pixelorama/items/), drawn from the same designs as the inventory pictures. Until an
// image has loaded (or if it is missing) the original hand-placed pixels are drawn instead.
const worldItemArt = {};
function worldItem(name) {
  if (!(name in worldItemArt)) {
    const img = new Image();
    worldItemArt[name] = null;
    img.onload = () => { worldItemArt[name] = img; };
    img.onerror = () => console.error(`[props] could not load assets/export/items/world/${name}.png; using the fallback pixels.`);
    img.src = `assets/export/items/world/${name}.png?v=1`;
  }
  return worldItemArt[name];
}
// 1 image px = 1 native px = 1 / 1.5 world units
function drawWorldItem(ctx, img, x, y) { ctx.drawImage(img, x, y, img.width / 1.5, img.height / 1.5); }

export function watchProp() {
  let t = 0;
  return {
    z: 2,
    update(dt) { t += dt; },
    draw(ctx, camX) {
      const bx = Math.round(463 - camX);
      const img = worldItem('pocket_watch_world');
      if (img) { drawWorldItem(ctx, img, bx, 148); return; }
      rect(ctx, bx, 149, 3, 2, '#9aa3ad'); px(ctx, bx + 1, 149, '#e2e8f0');
      line(ctx, bx + 3, 150, bx + 7, 151, '#7a7f88');
    },
    glow(ctx, camX) {
      // a faint catch of light on the casing, every few seconds
      if (Math.sin(t * 1.3) > 0.93) px(ctx, Math.round(464 - camX), 149, '#f1f5f9');
    },
  };
}

export function ledgerProp() {
  return {
    z: 2,
    draw(ctx, camX) {
      const bx = Math.round(252 - camX);
      const img = worldItem('ledger_world');
      if (img) { drawWorldItem(ctx, img, bx, 145); return; }
      rect(ctx, bx, 145, 9, 3, '#b8ad92');
      rect(ctx, bx + 5, 145, 4, 3, '#2a2420');
      px(ctx, bx + 4, 145, '#5a4632'); px(ctx, bx + 1, 146, '#6b6250'); px(ctx, bx + 3, 146, '#6b6250');
      hline(ctx, bx, bx + 4, 148, '#1c1814');
    },
  };
}

// ---------------- Sawmill: lantern on the ridge (the closing beat) ----------------
export function ridgeLightProp() {
  const RX = 300; // position along the ridge layer
  // Attached to the ridge parallax layer: its draw-x comes from game.layerX(RIDGE_FACTOR), which is
  // native-grid aligned; split into whole units (for the integer pixel helpers) + a remainder.
  const pos = (game) => {
    const heights = sceneMeta.SAWMILL && sceneMeta.SAWMILL.ridgeHeights;
    const top = heights ? heights[RX] : 90;
    const lx = game.layerX(RIDGE_FACTOR);
    const base = Math.floor(lx + 1e-6);
    return { x: RX + base + game.ridgeLight.swing, frac: lx - base, y: top - 3 };
  };
  const visible = (game) => game.state.flags.ridgeLightStart && game.ridgeLight && game.ridgeLight.k > 0;
  // Drawn in the depth-sorted pass (behind the playfield) so the mill frame occludes it correctly.
  return {
    z: -84,
    draw(ctx, camX, game) {
      if (!visible(game)) return;
      const k = game.ridgeLight.k;
      const { x, y, frac } = pos(game);
      const flick = Math.sin(game.time * 11) > 0.6 ? 1 : 0;
      ctx.save();
      ctx.translate(frac, 0);
      ctx.globalAlpha = k * 0.3;
      rect(ctx, x - 3, y - 2, 7, 5, PAL.amber); rect(ctx, x - 2, y - 3, 5, 7, PAL.amber);
      ctx.globalAlpha = k;
      rect(ctx, x - 1, y - 1, 3, 3, PAL.amber);
      px(ctx, x, y, flick ? '#fff7d6' : PAL.amberHi);
      px(ctx, x, y + 2, PAL.kerosene);
      ctx.restore();
    },
    lights(game) {
      if (!visible(game)) return [];
      const { x, y, frac } = pos(game);
      return [{ x: x + frac + game.camera.ix, y, r: 9, strength: game.ridgeLight.k, warm: 0.25 * game.ridgeLight.k }];
    },
    worldPos(game) {
      const heights = sceneMeta.SAWMILL && sceneMeta.SAWMILL.ridgeHeights;
      return { layerX: RX, y: (heights ? heights[RX] : 90) - 3 };
    },
  };
}

// ---------------- A tileset block shown on a condition (e.g. the opened grave) ----------------
// args: [tilesetUrl (.tsj, tiles carry a `name` property), blockName, widthInTiles, heightInTiles, x, y] with x, y the block's
// top-left in native px (Tiled coordinates). Drawn in the playfield plane over the map's own tiles; the prop's `if` decides
// when it exists (the scene reloads when that changes). Loads once per tileset and draws as soon as it is ready.
const stampSheets = new Map(); // tsj url -> Promise<{ img, cols, byName }>
function loadStampSheet(url) {
  if (!stampSheets.has(url)) {
    stampSheets.set(url, fetch(url).then((r) => r.json()).then((ts) => new Promise((resolve) => {
      const img = new Image();
      const byName = new Map();
      for (const t of ts.tiles || []) { const n = (t.properties || []).find((p) => p.name === 'name'); if (n) byName.set(n.value, t.id); }
      img.onload = () => resolve({ img, cols: ts.columns, byName, tw: ts.tilewidth, th: ts.tileheight });
      img.onerror = () => { console.error(`[props] stamp: could not load ${ts.image}`); resolve(null); };
      img.src = new URL(ts.image, new URL(url, location.href)).href;
    })).catch((e) => { console.error(`[props] stamp: ${url}: ${e.message}`); return null; }));
  }
  return stampSheets.get(url);
}
export function stampProp(tsjUrl, block, wt, ht, x, y) {
  let sheet = null;
  loadStampSheet(tsjUrl).then((s) => { sheet = s; });
  return {
    z: 1,
    draw(ctx, camX) {
      if (!sheet) return;
      const k = 1 / 1.5; // native px -> world units
      for (let r = 0; r < ht; r++) for (let c = 0; c < wt; c++) {
        const id = sheet.byName.get(`${block}_${r}_${c}`);
        if (id == null) continue;
        const sx = (id % sheet.cols) * sheet.tw, sy = Math.floor(id / sheet.cols) * sheet.th;
        ctx.drawImage(sheet.img, sx, sy, sheet.tw, sheet.th, (x + c * sheet.tw) * k - camX, (y + r * sheet.th) * k, sheet.tw * k, sheet.th * k);
      }
    },
  };
}

export const PROP_FACTORIES = {
  stamp: stampProp,
  train: trainProp, fire: fireProp, embers: (x, y) => fireProp(x, y, { embersOnly: true }),
  patrons: patronsProp, deskFront: deskFrontProp, watcher: (x, y) => watcherProp(x, y), windowSnow: windowSnowProp,
  hotelWindows: hotelWindowsProp, chimneySmoke: chimneySmokeProp, rug: rugProp,
  lamp: lampLight, body: bodyProp, watch: watchProp, ledger: ledgerProp, ridgeLight: ridgeLightProp,
};
void signText;

// ======================= Chapter 3 =======================
// Painted at native density (1 px = 1 native px = 2/3 world unit), like the Pixelorama scene art, then drawn scaled.
function nativePiece(w, h, paint) { const [c, g] = canvas(w, h); paint(g); return c; }
function drawNative(ctx, img, wx, wy, camX) { ctx.drawImage(img, Math.round((wx - camX) * 1.5) / 1.5, Math.round(wy * 1.5) / 1.5, img.width / 1.5, img.height / 1.5); }

// The constable's office: the cell along the back wall (bars, a cot, a folded blanket). (x, y): world top-left.
export function jailCellProp(x, y, w = 64, h = 86) {
  let img = null;
  return {
    z: 0.6,
    draw(ctx, camX) {
      if (!img) {
        const W = Math.round(w * 1.5), H = Math.round(h * 1.5);
        img = nativePiece(W, H, (g) => {
          rect(g, 0, H - 26, W, 2, PAL.iron); // the cot's frame inside
          rect(g, 10, H - 34, W - 26, 6, '#565049'); rect(g, 10, H - 34, W - 26, 1, '#635c55');
          rect(g, 14, H - 37, 14, 3, '#8d8574'); // the folded blanket
          for (let bx = 0; bx < W; bx += 7) { rect(g, bx, 0, 2, H, PAL.iron); px(g, bx, 0, PAL.iron2); vline(g, bx + 1, 2, H - 1, PAL.iron2); }
          for (const by of [0, 4, Math.round(H * 0.45), H - 4]) { rect(g, 0, by, W, 3, PAL.iron); hline(g, 0, W - 1, by, PAL.iron2); }
          rect(g, W - 16, Math.round(H * 0.45) + 6, 7, 9, PAL.iron2); px(g, W - 13, Math.round(H * 0.45) + 9, PAL.ink); // the lock
        });
      }
      drawNative(ctx, img, x, y, camX);
    },
  };
}

// Sheriff Hale on a bench under canvas, waiting for the burial. (x, y): world centre of the bench top.
export function shroudProp(x, y) {
  let img = null;
  return {
    z: 0.7,
    draw(ctx, camX) {
      if (!img) {
        img = nativePiece(72, 30, (g) => {
          rect(g, 2, 18, 68, 3, '#634832'); hline(g, 2, 69, 18, '#7a5a3e'); // the bench top
          for (const lx of [6, 62]) rect(g, lx, 21, 3, 9, '#3b2a1e');
          // the canvas over him: a long low mound, the head end higher, folds in the cloth
          for (let i = 0; i < 64; i++) {
            const t = i / 63;
            const top = Math.round(17 - (t < 0.18 ? 6 + Math.sin(t * 17) * 2 : t > 0.86 ? 7 - (t - 0.86) * 30 : 5 + Math.sin(t * 9) * 1));
            for (let yy = top; yy < 18; yy++) px(g, 4 + i, yy, yy === top ? '#c8bfa8' : (i + yy) % 9 === 0 ? '#8d8574' : '#b5ab92');
          }
          for (const fx of [18, 30, 44]) vline(g, fx, 12, 17, '#8d8574');
          // a boot heel shows at the foot end: square, a miner's
          rect(g, 66, 13, 4, 5, '#1a120d'); px(g, 69, 17, '#3b2a1e');
        });
      }
      drawNative(ctx, img, x - 24, y - 12, camX);
    },
  };
}

// A fresh grave by the chapel: dark earth thrown up on the snow, a spade left standing in it. (x, y): world base centre.
export function newGraveProp(x, y) {
  let img = null;
  return {
    z: 0.5,
    draw(ctx, camX) {
      if (!img) {
        img = nativePiece(54, 26, (g) => {
          for (let i = 0; i < 48; i++) {
            const top = Math.round(19 - Math.sin((i / 47) * Math.PI) * 6);
            for (let yy = top; yy < 24; yy++) px(g, 3 + i, yy, yy === top ? '#c8d1de' : (i * 7 + yy) % 5 === 0 ? '#3b2a1e' : yy > 21 ? '#1a120d' : '#2a1c14');
          }
          for (let i = 0; i < 9; i++) px(g, 6 + i * 5, 23 - (i % 2), '#e4e9f0'); // snow already settling on it
          line(g, 44, 2, 40, 18, '#634832'); line(g, 45, 2, 41, 18, '#4e3826'); rect(g, 42, 0, 5, 2, '#3a3f4a'); // the spade
          rect(g, 38, 17, 5, 4, '#3a3f4a');
        });
      }
      drawNative(ctx, img, x - 18, y - 16, camX);
    },
  };
}

// The coffee pot on the parlor hob at night, steam rising thinly. (x, y): world base of the pot.
export function coffeePotProp(x, y) {
  let img = null, t = 0;
  return {
    z: 1.2,
    update(dt) { t += dt; },
    draw(ctx, camX, game) {
      if (game && game.state.flags.drankCoffee) return;
      if (!img) {
        img = nativePiece(12, 14, (g) => {
          rect(g, 2, 3, 7, 10, '#3a3f4a'); rect(g, 3, 4, 5, 8, '#565049'); vline(g, 3, 4, 11, '#635c55');
          rect(g, 1, 12, 9, 2, '#24272e'); rect(g, 4, 1, 3, 2, '#24272e'); // base, lid knob
          line(g, 9, 5, 11, 3, '#3a3f4a'); px(g, 11, 2, '#3a3f4a'); // spout
          vline(g, 0, 5, 9, '#24272e'); px(g, 1, 5, '#24272e'); px(g, 1, 9, '#24272e'); // handle
        });
      }
      drawNative(ctx, img, x - 4, y - 9, camX);
      const k = Math.floor(t * 3);
      ctx.globalAlpha = 0.45; ctx.fillStyle = '#a3afc2';
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 4 - camX + Math.sin(t * 2 + i) * 0.8, y - 11 - ((k + i * 2) % 6), 2 / 3, 2 / 3);
      ctx.globalAlpha = 1;
    },
  };
}

Object.assign(PROP_FACTORIES, { jailCell: jailCellProp, shroud: shroudProp, newGrave: newGraveProp, coffeePot: coffeePotProp });
