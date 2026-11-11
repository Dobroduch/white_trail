// Lighting pass, rendered at NATIVE resolution (480×270): an ambient darkness layer with light pools
// cut out of it in hard pixel bands, then a restrained additive warm glow. Both are rasterised on
// the native grid and composited into the framebuffer with nearest-neighbour scaling, so the bands
// stay crisp pixel steps (finer than the old 320×180 steps, same radii in world terms).
// Light positions/radii arrive in WORLD units relative to the camera's whole-unit position;
// `sub` is the camera's sub-unit remainder.
import { NATIVE_W, NATIVE_H, WORLD_SCALE, makeCanvas } from '../engine/display.js';

const dark = makeCanvas(NATIVE_W, NATIVE_H);
const dctx = dark.getContext('2d');
const glow = makeCanvas(NATIVE_W, NATIVE_H);
const gctx = glow.getContext('2d');

const BANDS = [[0, 1], [0.42, 1], [0.42, 0.72], [0.66, 0.72], [0.66, 0.42], [0.84, 0.42], [0.84, 0.16], [1, 0]];

// ctx: the framebuffer context with an identity transform.
export function renderLighting(ctx, lights, ambient, sub = 0) {
  const toN = (L, rk) => ({
    x: Math.round((L.x - sub) * WORLD_SCALE),
    y: Math.round(L.y * WORLD_SCALE),
    r: Math.max(3, Math.round(L.r * rk * WORLD_SCALE)),
  });
  dctx.globalCompositeOperation = 'source-over';
  dctx.clearRect(0, 0, NATIVE_W, NATIVE_H);
  dctx.fillStyle = ambient.color;
  dctx.globalAlpha = ambient.alpha;
  dctx.fillRect(0, 0, NATIVE_W, NATIVE_H);
  dctx.globalAlpha = 1;
  dctx.globalCompositeOperation = 'destination-out';
  for (const L of lights) {
    const { x, y, r } = toN(L, 1);
    if (x + r < 0 || x - r > NATIVE_W) continue;
    const strength = L.strength != null ? L.strength : 1;
    const g = dctx.createRadialGradient(x, y, 0, x, y, r);
    for (const [p, a] of BANDS) g.addColorStop(p, `rgba(0,0,0,${a * strength})`);
    dctx.fillStyle = g;
    dctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(dark, 0, 0, ctx.canvas.width, ctx.canvas.height);
  // warm additive glow (accumulated additively on its own native layer, then added to the scene)
  gctx.globalCompositeOperation = 'source-over';
  gctx.clearRect(0, 0, NATIVE_W, NATIVE_H);
  gctx.globalCompositeOperation = 'lighter';
  let any = false;
  for (const L of lights) {
    if (!L.warm) continue;
    const { x, y, r } = toN(L, 0.7);
    if (x + r < 0 || x - r > NATIVE_W) continue;
    const g = gctx.createRadialGradient(x, y, 0, x, y, r);
    const a = L.warm * 0.6;
    g.addColorStop(0, `rgba(245,158,11,${a})`);
    g.addColorStop(0.45, `rgba(217,119,6,${a * 0.6})`);
    g.addColorStop(0.45, `rgba(217,119,6,${a * 0.35})`);
    g.addColorStop(0.8, `rgba(180,83,9,${a * 0.18})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = g;
    gctx.fillRect(x - r, y - r, r * 2, r * 2);
    any = true;
  }
  if (any) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glow, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.imageSmoothingEnabled = smooth;
}
