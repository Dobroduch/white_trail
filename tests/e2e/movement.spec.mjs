// Movement: real keyboard input on the real-time loop, plus exact fixed-step checks.
import { test, expect } from '@playwright/test';
import { boot, step, expectClean } from './helpers.mjs';

// Real keyboard on the real-time loop. The key is held until Silas has covered the distance (bounded),
// instead of for a fixed wall-clock time: under parallel test load the rAF loop can be starved for a
// few hundred ms, which says nothing about the game. Exact speed is checked in fixed-step mode below.
async function holdUntil(page, key, cond, arg) {
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(cond, arg, { timeout: 5000, polling: 50 });
  } finally {
    await page.keyboard.up(key);
  }
}

test('holding D / A walks Silas right and left in real time', async ({ page }) => {
  const { errors } = await boot(page, { scene: 'ROAD', nopause: '1' });
  await page.waitForFunction(() => TWT.canMove());
  const x0 = await page.evaluate(() => TWT.player.x);
  await holdUntil(page, 'KeyD', (x) => TWT.player.x > x + 10, x0);
  const x1 = await page.evaluate(() => TWT.player.x);
  expect(x1 - x0).toBeGreaterThan(10);
  expect(await page.evaluate(() => TWT.player.facing)).toBe(1);
  await holdUntil(page, 'ArrowLeft', (x) => TWT.player.x < x - 5, x1);
  expect(await page.evaluate(() => TWT.player.x)).toBeLessThan(x1);
  expect(await page.evaluate(() => TWT.player.facing)).toBe(-1);
  await expectClean(page, errors);
});

test('walk speed is 44 world units per second (fixed step) and the camera follows', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  await step(page, 30);
  const r = await page.evaluate(() => {
    const g = TWT;
    const walk = (frames) => { for (let i = 0; i < frames; i++) { g.input.down.add('KeyD'); g.update(1 / 60); } g.input.down.delete('KeyD'); };
    walk(60); // accelerate to full speed
    const a = g.player.x, cam0 = g.camera.x;
    walk(60);
    return { speed: g.player.x - a, camMoved: g.camera.x - cam0 };
  });
  expect(r.speed).toBeCloseTo(44, 0);
  expect(r.camMoved).toBeGreaterThan(0);
  await expectClean(page, errors);
});

test('scene bounds stop Silas, and walking off an edge takes the exit', async ({ page }) => {
  const { errors } = await boot(page, { test: '1', scene: 'BLACK_RAM_EXTERIOR' });
  await step(page, 10);
  const r = await page.evaluate(() => {
    T.walkTo(0);
    const atEdge = TWT.player.x;
    T.hold('KeyA', 30); T.step(60);
    return { atEdge, scene: TWT.scene.id };
  });
  expect(r.atEdge).toBeGreaterThanOrEqual(4); // bounds from the Tiled "bounds" rectangle
  expect(r.scene).toBe('VILLAGE'); // the west "exit" object → VILLAGE.fromHotel
  await expectClean(page, errors);
});
