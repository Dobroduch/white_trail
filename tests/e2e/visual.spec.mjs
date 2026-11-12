// Deterministic screenshots of scenes with animated snow, lighting, lantern flicker and fire.
//
// ?test=1 seeds Math.random and stops the real-time loop; the test advances an exact number of
// fixed 1/60 s steps, so the frame is a pure function of (seed, steps, inputs). Two guarantees are
// checked: (1) the same seed renders bit-identical frames in two separate page loads, and (2) the
// frame matches the committed baseline (`npm run test:visual:update` to (re)create baselines).
import { test, expect } from '@playwright/test';
import { boot, step } from './helpers.mjs';
import { createHash } from 'node:crypto';

const frameHash = async (page) => {
  const url = await page.evaluate(() => TWT.display.canvas.toDataURL('image/png'));
  return createHash('sha1').update(url).digest('hex');
};

async function frame(page, { seed = 1, scene, phase = 'EVENING', setup = null, steps = 150 }) {
  await boot(page, { test: '1', seed: String(seed), scene, phase });
  if (setup) await page.evaluate(setup);
  await step(page, steps);
}

test.describe('determinism', () => {
  test('same seed → identical frames across page loads; different seed → different snow', async ({ browser }) => {
    const hashes = [];
    for (const seed of [7, 7, 8]) {
      const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
      await frame(page, { seed, scene: 'BLACK_RAM_EXTERIOR' });
      hashes.push(await frameHash(page));
      await page.close();
    }
    expect(hashes[0]).toBe(hashes[1]);
    expect(hashes[2]).not.toBe(hashes[0]);
  });

  test('stepping is the only clock: real time passing changes nothing', async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 540 });
    await frame(page, { scene: 'BLACK_RAM_EXTERIOR' });
    const a = await frameHash(page);
    await page.waitForTimeout(700);
    await page.evaluate(() => TWT_TEST.render());
    expect(await frameHash(page)).toBe(a);
  });
});

const SHOTS = [
  { name: 'main-street-evening', scene: 'VILLAGE', setup: () => { TWT.state.flags.introDone = true; T.walkTo(120); } },
  { name: 'black-ram-evening', scene: 'BLACK_RAM_EXTERIOR', setup: () => T.walkTo(300) },
  { name: 'black-ram-night-lantern', scene: 'BLACK_RAM_EXTERIOR', phase: 'NIGHT', setup: () => { T.press('KeyF'); T.walkTo(420); } },
  { name: 'sawmill-night-frame', scene: 'SAWMILL', phase: 'NIGHT', setup: () => { T.talkThrough(); TWT.state.flags.foundSheriffBody = true; T.walkTo(420); } },
  { name: 'station-house-evening', scene: 'STATION', setup: () => { T.talkThrough(); T.walkTo(430); } },
  { name: 'parlor-fire', scene: 'PARLOR', setup: () => { T.talkThrough(); T.walkTo(120); } },
  { name: 'creek-night-snow-fog', scene: 'CREEK', phase: 'NIGHT', setup: () => { T.talkThrough(); T.walkTo(200); } },
];

test.describe('baselines', () => {
  for (const s of SHOTS) {
    test(s.name, async ({ page }) => {
      await page.setViewportSize({ width: 960, height: 540 }); // exact 2× of 480×270
      await frame(page, s);
      await expect(page.locator('#game')).toHaveScreenshot(`${s.name}.png`);
    });
  }
});
