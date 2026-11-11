// Browser resizing: the output always fits the window, keeps the 270-native-px height, follows the
// window's aspect within 4:3…2.67:1, uses whole-pixel scaling where the spec says it should, and
// survives live resizes without a reload.
import { test, expect } from '@playwright/test';
import { boot, step, expectClean } from './helpers.mjs';

const read = (page) => page.evaluate(async () => {
  const D = await import('/src/engine/display.js');
  const c = TWT.display.canvas, r = c.getBoundingClientRect();
  return {
    nativeW: D.NATIVE_W, nativeH: D.NATIVE_H, viewW: D.VIEW_W, scale: TWT.display.scale,
    out: { w: c.width, h: c.height }, css: { x: r.x, y: r.y, w: r.width, h: r.height },
    win: { w: innerWidth, h: innerHeight },
    scroll: { x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight },
  };
});

const SIZES = [[1920, 1080], [1280, 720], [1366, 768], [1024, 768], [760, 480], [2560, 1080], [600, 900]];

for (const [w, h] of SIZES) {
  test(`fits ${w}×${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
    await step(page, 2);
    const s = await read(page);
    expect(s.nativeH).toBe(270);
    expect(s.nativeW % 3).toBe(0); // whole world units
    expect(s.nativeW).toBeGreaterThanOrEqual(360);
    expect(s.nativeW).toBeLessThanOrEqual(720);
    expect(s.css.w).toBeLessThanOrEqual(w + 0.5);
    expect(s.css.h).toBeLessThanOrEqual(h + 0.5);
    expect(s.css.x).toBeGreaterThanOrEqual(-0.5);
    expect(s.css.y).toBeGreaterThanOrEqual(-0.5);
    expect(s.scroll).toEqual({ x: false, y: false });
    // the frame's aspect equals NATIVE_W:270 (never stretched)
    expect(Math.abs(s.out.w / s.out.h - s.nativeW / 270)).toBeLessThan(0.02);
    // the limiting dimension is (nearly) filled
    expect(Math.max(s.css.w / w, s.css.h / h)).toBeGreaterThan(0.89);
    await expectClean(page, errors);
  });
}

test('1920×1080 is an exact 4× of 480×270', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  await step(page, 2);
  const s = await read(page);
  expect(s.nativeW).toBe(480);
  expect(s.out).toEqual({ w: 1920, h: 1080 });
  expect(s.scale).toBe(4);
});

test('live resizing rescales immediately, keeps playing, and pointer mapping stays exact', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  for (const [w, h] of [[1280, 720], [900, 700], [1700, 700], [1280, 720]]) {
    await page.setViewportSize({ width: w, height: h });
    await step(page, 2); // the per-frame size check picks the change up
    const s = await read(page);
    expect(s.css.w).toBeLessThanOrEqual(w + 0.5);
    // round trip: a world point → client px → back to world lands on the same point
    const err = await page.evaluate(async () => {
      const D = await import('/src/engine/display.js');
      const g = TWT, cam = g.camera, fo = cam.screenFocus();
      const wx = g.player.x, wy = g.player.y - 10;
      const n = D.Display.projectZoom((wx - cam.pos) * D.WORLD_SCALE, wy * D.WORLD_SCALE, cam.zoom, fo.x, fo.y);
      const r = g.display.canvas.getBoundingClientRect();
      const nw = D.NATIVE_W;
      const back = g.pointerToWorld(r.x + (n.x / nw) * r.width, r.y + (n.y / D.NATIVE_H) * r.height);
      return Math.hypot(back.x - wx, back.y - wy);
    });
    expect(err).toBeLessThan(0.05);
  }
  expect(await page.evaluate(() => TWT.scene.id)).toBe('BLACK_RAM_EXTERIOR');
  await expectClean(page, errors);
});
