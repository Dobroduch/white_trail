// Wind-driven snow in three depth layers, drifting ground fog, and Silas's breath.
// Particles live in screen space and are shifted by camera motion scaled by their depth,
// so near flakes parallax faster than far ones. Pooled; no per-frame allocation.
// Simulation runs in screen-space WORLD units (VIEW_W×VIEW_H, so speeds feel unchanged); flakes are
// drawn on the NATIVE pixel grid (call draw() under the native transform). Flake sizes are native
// px chosen to match the old 1/1/2-world-pixel sizes (1.5/1.5/3 native) as closely as whole pixels allow.
import { VIEW_W as W, VIEW_H as H, WORLD_SCALE } from '../engine/display.js';
import { noise1 } from '../engine/rng.js';
import { fogTexture } from './paint.js';

const MAX = 340;
const LAYERS = [
  { depth: 0.35, speed: 14, size: 1, alpha: 0.35, col: '#8e9bb0' },
  { depth: 0.8, speed: 24, size: 2, alpha: 0.75, col: '#cbd5e1' },
  { depth: 1.25, speed: 40, size: 3, alpha: 0.55, col: '#f1f5f9' },
];

export class Weather {
  constructor() {
    this.p = [];
    for (let i = 0; i < MAX; i++) {
      const layer = i % 10 === 0 ? 2 : i % 3 === 0 ? 1 : i % 2 === 0 ? 0 : 1;
      this.p.push({ x: Math.random() * W, y: Math.random() * H, l: layer, wob: Math.random() * 6.28, sp: 0.7 + Math.random() * 0.6 });
    }
    this.density = 0;
    this.targetDensity = 0;
    this.windBase = 0.5;
    this.wind = 0.5;
    this.fog = 0;
    this.t = 0;
    this.lastCam = 0;
    this.fogTex = fogTexture(640, 26, 7, '#cbd5e1');
    this.breath = [];
    this.breathTimer = 1;
  }
  configure(cfg, camX, instant) {
    this.targetDensity = cfg ? cfg.snow : 0;
    this.windBase = cfg ? cfg.wind : 0;
    this.fog = cfg ? cfg.fog : 0;
    if (instant) this.density = this.targetDensity;
    this.lastCam = camX;
  }
  update(dt, camX, windOverride) {
    this.t += dt;
    this.density += (this.targetDensity - this.density) * Math.min(1, dt * 1.5);
    const gust = noise1(this.t * 0.25, 3) * 0.9 + noise1(this.t * 1.1, 9) * 0.25;
    const base = windOverride != null ? windOverride : this.windBase;
    this.wind = base * (0.55 + gust);
    const dCam = camX - this.lastCam;
    this.lastCam = camX;
    const active = Math.floor(MAX * this.density);
    for (let i = 0; i < active; i++) {
      const q = this.p[i];
      const L = LAYERS[q.l];
      q.wob += dt * 2;
      q.x += (this.wind * 70 * L.depth + Math.sin(q.wob) * 4) * dt * q.sp - dCam * L.depth;
      q.y += L.speed * dt * q.sp * (1 - Math.min(0.5, this.wind * 0.2));
      if (q.y > H) { q.y -= H + 2; q.x = Math.random() * W; }
      if (q.x > W + 2) q.x -= W + 4;
      if (q.x < -2) q.x += W + 4;
    }
    for (const b of this.breath) { b.t += dt; b.x += (6 + this.wind * 20) * dt; b.y -= 4 * dt; }
    while (this.breath.length && this.breath[0].t > 1.4) this.breath.shift();
  }
  puff(x, y, dir) {
    for (let i = 0; i < 4; i++) this.breath.push({ x: x + dir * (2 + i), y: y - (i % 2), t: i * 0.05 });
  }
  // layer 0/1 behind characters, layer 2 in front. Native-grid pass.
  draw(ctx, back) {
    const active = Math.floor(MAX * this.density);
    for (let i = 0; i < active; i++) {
      const q = this.p[i];
      if ((q.l === 2) === back) continue;
      const L = LAYERS[q.l];
      ctx.globalAlpha = L.alpha;
      ctx.fillStyle = L.col;
      ctx.fillRect(Math.round(q.x * WORLD_SCALE), Math.round(q.y * WORLD_SCALE), L.size, L.size);
    }
    ctx.globalAlpha = 1;
  }
  // World pass (legacy breath pixels, 1 world unit each).
  drawBreath(ctx, camX) {
    for (const b of this.breath) {
      ctx.globalAlpha = Math.max(0, 0.5 * (1 - b.t / 1.4));
      ctx.fillStyle = '#dfe6ee';
      ctx.fillRect(Math.round(b.x - camX), Math.round(b.y), 1 + (b.t > 0.6 ? 1 : 0), 1);
    }
    ctx.globalAlpha = 1;
  }
  // View pass (screen-anchored, world-unit texture); offsets snap to the native grid.
  drawFog(ctx, camPos) {
    if (this.fog <= 0.01) return;
    const tw = this.fogTex.width;
    const snap = (v) => Math.round(v * WORLD_SCALE) / WORLD_SCALE;
    const off = ((camPos * 0.9 + this.t * (6 + this.wind * 14)) % tw + tw) % tw;
    ctx.globalAlpha = this.fog * 0.32;
    for (let x = -off; x < W; x += tw) ctx.drawImage(this.fogTex, snap(x), 136);
    const off2 = ((camPos * 0.5 + this.t * (3 + this.wind * 8)) % tw + tw) % tw;
    ctx.globalAlpha = this.fog * 0.18;
    for (let x = -off2; x < W; x += tw) ctx.drawImage(this.fogTex, snap(x), 104);
    ctx.globalAlpha = 1;
  }
}
