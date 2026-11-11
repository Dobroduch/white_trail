// Dynamic scene props: things that animate, react to story state, or must layer around characters.
// A prop factory returns { z, update(dt, game), draw(ctx, camX, game), glow?(ctx, camX, game), lights?(game) }.
import { H } from '../engine/display.js';
import { drawSprite } from '../engine/assets.js';
import { mulberry32 } from '../engine/rng.js';
import { PAL, canvas, rect, px, hline, vline, line, signText } from './paint.js';
import { sceneMeta, RIDGE_FACTOR } from './painters.js';

// ---------------- Train (Blackwood Station) ----------------
const TRAIN_STOP = -10;
export const COACH_DOOR_OFFSET = 208;
let trainBody = null;
function buildTrain() {
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
      ctx.drawImage(trainBody, bx, 100);
      // wheels + side rod
      const phase = wheel / 7;
      const drv = [32, 48];
      for (const wx of drv) wheelAt(ctx, bx + wx, 139, 7, phase);
      wheelAt(ctx, bx + 18, 143, 3, phase * 2.3);
      for (const wx of [80, 94, 116, 130, 190, 204]) wheelAt(ctx, bx + wx, 143, 3, phase * 2.3);
      const rx = Math.round(Math.cos(phase) * 4), ry = Math.round(Math.sin(phase) * 4);
      line(ctx, bx + 32 + rx, 139 + ry, bx + 48 + rx, 139 + ry, '#8a8f99');
      line(ctx, bx + 32 + rx, 139 + ry, bx + 22, 133, '#5a5f69');
      drawSteam(ctx, camX);
    },
    glow(ctx, camX) {
      if (state === 'idle' || state === 'gone') return;
      const bx = Math.round(x - camX);
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
export function fireProp(x, y, { embersOnly = false } = {}) {
  let t = 0;
  const rng = mulberry32(9);
  return {
    z: 1,
    update(dt) { t += dt; },
    draw(ctx, camX) {
      const bx = Math.round(x - camX);
      rect(ctx, bx - 8, y - 4, 16, 3, '#2a1a10');
      line(ctx, bx - 9, y - 2, bx + 6, y - 5, '#3a2416');
    },
    glow(ctx, camX) {
      const bx = Math.round(x - camX);
      const f = Math.floor(t * 9);
      if (embersOnly) {
        for (let i = 0; i < 7; i++) if ((f + i * 3) % 5 !== 0) px(ctx, bx - 7 + i * 2, y - 4 + (i % 2), i % 2 ? '#b45309' : '#7c2d12');
        return;
      }
      const r2 = mulberry32(f);
      for (let i = -7; i <= 7; i++) {
        const h = Math.max(1, Math.round(10 - Math.abs(i) * 1.1 + r2() * 5));
        for (let k = 0; k < h; k++) {
          const tt = k / h;
          const col = tt < 0.3 ? PAL.amberHi : tt < 0.65 ? PAL.amber : PAL.kerosene;
          if (tt > 0.75 && r2() > 0.5) continue;
          px(ctx, bx + i, y - 4 - k, col);
        }
      }
      if (rng() > 0.7) px(ctx, bx + Math.floor(r2() * 10) - 5, y - 16 - Math.floor(r2() * 6), PAL.amberHi);
    },
    lights() {
      const flick = embersOnly ? 0 : Math.round(Math.sin(t * 13) * 2 + Math.sin(t * 7.3) * 2);
      return [{ x: x, y: y - 8, r: (embersOnly ? 34 : 92) + flick, warm: embersOnly ? 0.12 : 0.28, world: true }];
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
      drawSprite(ctx, looking ? 'patron_look' : 'patron', 0, bx + 146, 141, 1);
      drawSprite(ctx, looking ? 'patron_look' : 'patron', 0, bx + 166, 140, looking ? -1 : (talk ? -1 : 1));
      drawSprite(ctx, 'patron_look', 0, bx + 184, 141, -1);
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
export function watcherProp() {
  let closedAt = null;
  return {
    z: 1,
    update(dt, game) {
      if (game.state.flags.curtainDrawn && closedAt === null) closedAt = game.time;
    },
    draw(ctx, camX, game) {
      const bx = Math.round(60 - camX);
      if (game.state.phase === 'NIGHT') return;
      if (!game.state.flags.curtainDrawn) {
        // silhouette of a head and shoulders against the lamp
        rect(ctx, bx + 4, 119, 5, 5, '#140f0c'); rect(ctx, bx + 3, 124, 7, 4, '#140f0c');
      }
    },
    glow(ctx, camX, game) {
      if (game.state.phase === 'NIGHT') return;
      const bx = Math.round(60 - camX);
      const closed = game.state.flags.curtainDrawn;
      const k = closed ? Math.min(1, (game.time - closedAt) / 0.8) : 0;
      if (closed && k >= 1) return;
      ctx.globalAlpha = 1 - k;
      rect(ctx, bx, 114, 14, 14, 'rgba(217,119,6,0.55)');
      rect(ctx, bx, 123, 14, 5, PAL.amber);
      if (!closed) { rect(ctx, bx + 4, 119, 5, 5, '#140f0c'); rect(ctx, bx + 3, 124, 7, 4, '#140f0c'); }
      vline(ctx, bx + 7, 114, 127, 'rgba(0,0,0,0.6)'); hline(ctx, bx, bx + 13, 120, 'rgba(0,0,0,0.6)');
      ctx.globalAlpha = 1;
    },
    lights(game) {
      if (game.state.phase === 'NIGHT' || (game.state.flags.curtainDrawn && game.time - closedAt > 0.8)) return [];
      return [{ x: 67, y: 121, r: 26, warm: 0.15 }];
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
export function watchProp() {
  let t = 0;
  return {
    z: 2,
    update(dt) { t += dt; },
    draw(ctx, camX) {
      const bx = Math.round(463 - camX);
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
  const pos = (game, camX) => {
    const heights = sceneMeta.SAWMILL && sceneMeta.SAWMILL.ridgeHeights;
    const top = heights ? heights[RX] : 90;
    return { x: Math.round(RX - camX * RIDGE_FACTOR + game.ridgeLight.swing), y: top - 3 };
  };
  const visible = (game) => game.state.flags.ridgeLightStart && game.ridgeLight && game.ridgeLight.k > 0;
  // Drawn in the depth-sorted pass (behind the playfield) so the mill frame occludes it correctly.
  return {
    z: -84,
    draw(ctx, camX, game) {
      if (!visible(game)) return;
      const k = game.ridgeLight.k;
      const { x, y } = pos(game, camX);
      const flick = Math.sin(game.time * 11) > 0.6 ? 1 : 0;
      ctx.globalAlpha = k * 0.3;
      rect(ctx, x - 3, y - 2, 7, 5, PAL.amber); rect(ctx, x - 2, y - 3, 5, 7, PAL.amber);
      ctx.globalAlpha = k;
      rect(ctx, x - 1, y - 1, 3, 3, PAL.amber);
      px(ctx, x, y, flick ? '#fff7d6' : PAL.amberHi);
      px(ctx, x, y + 2, PAL.kerosene);
      ctx.globalAlpha = 1;
    },
    lights(game) {
      if (!visible(game)) return [];
      const camX = game.camera.ix;
      const { x, y } = pos(game, camX);
      return [{ x: x + camX, y, r: 9, strength: game.ridgeLight.k, warm: 0.25 * game.ridgeLight.k }];
    },
    worldPos(game) {
      const heights = sceneMeta.SAWMILL && sceneMeta.SAWMILL.ridgeHeights;
      return { layerX: RX, y: (heights ? heights[RX] : 90) - 3 };
    },
  };
}

export const PROP_FACTORIES = {
  train: trainProp, fire: fireProp, embers: (x, y) => fireProp(x, y, { embersOnly: true }),
  patrons: patronsProp, deskFront: deskFrontProp, watcher: watcherProp, windowSnow: windowSnowProp,
  lamp: lampLight, body: bodyProp, watch: watchProp, ledger: ledgerProp, ridgeLight: ridgeLightProp,
};
void H; void signText;
