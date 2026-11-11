// Startup: the real boot path (title screen, real-time loop, real keyboard) and the asset loads.
import { test, expect } from '@playwright/test';
import { boot, expectClean } from './helpers.mjs';

test('boots to the title screen without errors and with every asset loaded', async ({ page }) => {
  const { errors } = await boot(page, { nopause: '1' });
  const s = await page.evaluate(() => ({
    mode: TWT.mode, overlay: TWT.overlay && TWT.overlay.constructor.name,
    bootHidden: getComputedStyle(document.getElementById('boot')).display === 'none',
    canvas: { w: TWT.display.canvas.width, h: TWT.display.canvas.height },
    levels: TWT.levels.status,
  }));
  expect(s.mode).toBe('title');
  expect(s.overlay).toBe('TitleMenu');
  expect(s.bootHidden).toBe(true);
  expect(s.canvas.w).toBeGreaterThan(0);
  expect(s.levels.BLACK_RAM_EXTERIOR.ok).toBe(true);
  // the asset loader reports anything missing as an error: there must be none
  const assetProblems = await page.evaluate(async () => (await import('/src/engine/assets.js')).assetErrors());
  expect(assetProblems).toEqual([]);
  await expectClean(page, errors);
});

test('title → New investigation starts the opening at Blackwood Station (real-time loop)', async ({ page }) => {
  const { errors } = await boot(page, { nopause: '1' });
  await page.waitForTimeout(600); // the title ignores keys for its first 0.4 s
  await page.keyboard.press('Space'); // "press any key"
  await page.waitForFunction(() => TWT.overlay && TWT.overlay.pressed);
  await page.keyboard.press('Enter'); // first item: New investigation (no save in a fresh context)
  await page.waitForFunction(() => TWT.mode === 'play', null, { timeout: 5000 });
  const s = await page.evaluate(() => ({ scene: TWT.scene.id, cut: TWT.cutscene && TWT.cutscene.id, audio: TWT.audio.ready }));
  expect(s.scene).toBe('STATION');
  expect(s.cut).toBe('INTRO');
  expect(s.audio).toBe(true); // the key press was the user gesture that unlocks Web Audio
  await page.waitForTimeout(1500);
  await expectClean(page, errors);
});

test('opening the page from file:// is explained instead of failing silently', async ({ page }) => {
  const path = (await import('node:url')).pathToFileURL((await import('node:path')).resolve('index.html')).href;
  await page.goto(path);
  await expect(page.locator('#boot')).toHaveClass(/error/);
  await expect(page.locator('#boot-msg')).toContainText('served over http');
});
