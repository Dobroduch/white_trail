// Lighting pass on the 320x180 buffer: an ambient darkness layer with light pools cut out of it
// in hard pixel bands, then a restrained additive warm glow. Radii are integers (no shimmer).
import { W, H, makeCanvas } from '../engine/display.js';

const dark = makeCanvas(W, H);
const dctx = dark.getContext('2d');

const BANDS = [[0, 1], [0.42, 1], [0.42, 0.72], [0.66, 0.72], [0.66, 0.42], [0.84, 0.42], [0.84, 0.16], [1, 0]];

export function renderLighting(ctx, lights, ambient) {
  dctx.globalCompositeOperation = 'source-over';
  dctx.clearRect(0, 0, W, H);
  dctx.globalAlpha = 1;
  dctx.fillStyle = ambient.color;
  dctx.globalAlpha = ambient.alpha;
  dctx.fillRect(0, 0, W, H);
  dctx.globalAlpha = 1;
  dctx.globalCompositeOperation = 'destination-out';
  for (const L of lights) {
    const r = Math.max(2, Math.round(L.r));
    const x = Math.round(L.x), y = Math.round(L.y);
    if (x + r < 0 || x - r > W) continue;
    const strength = L.strength != null ? L.strength : 1;
    const g = dctx.createRadialGradient(x, y, 0, x, y, r);
    for (const [p, a] of BANDS) g.addColorStop(p, `rgba(0,0,0,${a * strength})`);
    dctx.fillStyle = g;
    dctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.drawImage(dark, 0, 0);
  // warm additive glow
  ctx.globalCompositeOperation = 'lighter';
  for (const L of lights) {
    if (!L.warm) continue;
    const r = Math.max(2, Math.round(L.r * 0.7));
    const x = Math.round(L.x), y = Math.round(L.y);
    if (x + r < 0 || x - r > W) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = L.warm * 0.6;
    g.addColorStop(0, `rgba(245,158,11,${a})`);
    g.addColorStop(0.45, `rgba(217,119,6,${a * 0.6})`);
    g.addColorStop(0.45, `rgba(217,119,6,${a * 0.35})`);
    g.addColorStop(0.8, `rgba(180,83,9,${a * 0.18})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}
